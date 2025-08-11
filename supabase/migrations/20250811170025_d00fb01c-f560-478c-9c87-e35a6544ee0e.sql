
-- 1) Subscribers table for subscription status
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,        -- 'basic' | 'premium' | 'enterprise' (lowercase recommended)
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscribers' AND policyname = 'select_own_subscription'
  ) THEN
    CREATE POLICY "select_own_subscription" ON public.subscribers
      FOR SELECT
      USING (user_id = auth.uid() OR email = auth.email());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscribers' AND policyname = 'update_own_subscription'
  ) THEN
    CREATE POLICY "update_own_subscription" ON public.subscribers
      FOR UPDATE
      USING (user_id = auth.uid() OR email = auth.email());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscribers' AND policyname = 'insert_subscription'
  ) THEN
    CREATE POLICY "insert_subscription" ON public.subscribers
      FOR INSERT
      WITH CHECK (user_id = auth.uid() OR email = auth.email());
  END IF;
END$$;

-- 2) Orders table for optional one-off tracking
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  stripe_session_id TEXT UNIQUE,
  amount INTEGER,            -- cents
  currency TEXT DEFAULT 'usd',
  status TEXT,               -- 'pending', 'paid', 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'select_own_orders'
  ) THEN
    CREATE POLICY "select_own_orders" ON public.orders
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'insert_orders_any'
  ) THEN
    -- Allow edge functions (service role) to insert
    CREATE POLICY "insert_orders_any" ON public.orders
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'update_orders_any'
  ) THEN
    CREATE POLICY "update_orders_any" ON public.orders
      FOR UPDATE
      USING (true);
  END IF;
END$$;

-- 3) user_storage_usage: per-user usage totals
CREATE TABLE IF NOT EXISTS public.user_storage_usage (
  user_id UUID PRIMARY KEY,
  tier TEXT NOT NULL DEFAULT 'free',       -- 'free'|'basic'|'premium'|'enterprise'
  db_bytes_used BIGINT NOT NULL DEFAULT 0,
  file_bytes_used BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_storage_usage ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_storage_usage' AND policyname = 'select_own_usage'
  ) THEN
    CREATE POLICY "select_own_usage" ON public.user_storage_usage
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END$$;

-- 4) user_files: tracks each stored blob per user (for accurate file usage)
CREATE TABLE IF NOT EXISTS public.user_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entry_id UUID,
  path TEXT NOT NULL UNIQUE,
  size BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_files' AND policyname = 'select_own_files'
  ) THEN
    CREATE POLICY "select_own_files" ON public.user_files
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_files' AND policyname = 'insert_own_files'
  ) THEN
    CREATE POLICY "insert_own_files" ON public.user_files
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_files' AND policyname = 'update_own_files'
  ) THEN
    CREATE POLICY "update_own_files" ON public.user_files
      FOR UPDATE
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_files' AND policyname = 'delete_own_files'
  ) THEN
    CREATE POLICY "delete_own_files" ON public.user_files
      FOR DELETE
      USING (user_id = auth.uid());
  END IF;
END$$;

-- Auto-populate user_id on user_files using the existing public.set_user_id() function
DROP TRIGGER IF EXISTS trg_user_files_set_user_id ON public.user_files;
CREATE TRIGGER trg_user_files_set_user_id
BEFORE INSERT ON public.user_files
FOR EACH ROW
EXECUTE FUNCTION public.set_user_id();

-- 5) Helper: get_tier_limit_bytes
CREATE OR REPLACE FUNCTION public.get_tier_limit_bytes(_tier TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
BEGIN
  -- 500MB, 5GB, 50GB, 500GB
  RETURN CASE lower(_tier)
    WHEN 'basic' THEN 5 * 1024 * 1024 * 1024
    WHEN 'premium' THEN 50 * 1024 * 1024 * 1024
    WHEN 'enterprise' THEN 500 * 1024 * 1024 * 1024
    ELSE 500 * 1024 * 1024  -- free
  END;
END;
$$;

-- 6) Recompute DB usage for a user by approximating bytes used in entries
CREATE OR REPLACE FUNCTION public.refresh_user_db_usage(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_bytes BIGINT;
BEGIN
  -- Estimate bytes as UTF-16 length of key fields
  SELECT COALESCE(SUM(
    COALESCE(length(e.title), 0) * 2 +
    COALESCE(length(e.fields::text), 0) * 2 +
    COALESCE(length(e.field_definitions::text), 0) * 2
  ), 0)::BIGINT
  INTO v_bytes
  FROM public.entries e
  WHERE e.user_id = p_user_id;

  INSERT INTO public.user_storage_usage (user_id, db_bytes_used, updated_at)
  VALUES (p_user_id, v_bytes, now())
  ON CONFLICT (user_id) DO UPDATE
  SET db_bytes_used = EXCLUDED.db_bytes_used,
      updated_at = now();
END;
$$;

-- 7) Trigger function for entries to refresh usage
CREATE OR REPLACE FUNCTION public.trg_refresh_db_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user UUID;
BEGIN
  v_user := COALESCE(NEW.user_id, OLD.user_id);
  IF v_user IS NOT NULL THEN
    PERFORM public.refresh_user_db_usage(v_user);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_entries_refresh_usage ON public.entries;
CREATE TRIGGER trg_entries_refresh_usage
AFTER INSERT OR UPDATE OR DELETE ON public.entries
FOR EACH ROW
EXECUTE FUNCTION public.trg_refresh_db_usage();

-- 8) Adjust file usage when user_files rows are inserted or deleted
CREATE OR REPLACE FUNCTION public.trg_adjust_file_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user UUID;
  v_delta BIGINT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_user := NEW.user_id;
    v_delta := GREATEST(NEW.size, 0);
  ELSIF TG_OP = 'DELETE' THEN
    v_user := OLD.user_id;
    v_delta := -GREATEST(OLD.size, 0);
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO public.user_storage_usage (user_id, file_bytes_used, updated_at)
  VALUES (v_user, GREATEST(v_delta, 0), now())
  ON CONFLICT (user_id) DO UPDATE
  SET file_bytes_used = GREATEST(public.user_storage_usage.file_bytes_used + v_delta, 0),
      updated_at = now();

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_user_files_adjust_usage ON public.user_files;
CREATE TRIGGER trg_user_files_adjust_usage
AFTER INSERT OR DELETE ON public.user_files
FOR EACH ROW
EXECUTE FUNCTION public.trg_adjust_file_usage();

-- 9) get_current_storage_usage: returns usage + current tier and limits
CREATE OR REPLACE FUNCTION public.get_current_storage_usage()
RETURNS TABLE(
  user_id UUID,
  tier TEXT,
  limit_bytes BIGINT,
  db_bytes_used BIGINT,
  file_bytes_used BIGINT,
  total_bytes BIGINT,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user UUID;
  v_tier TEXT;
  v_limit BIGINT;
  v_db BIGINT;
  v_file BIGINT;
  v_updated TIMESTAMPTZ;
BEGIN
  v_user := auth.uid();
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Ensure DB usage is up to date
  PERFORM public.refresh_user_db_usage(v_user);

  -- Derive tier: from subscribers if subscribed, else current stored tier, else 'free'
  SELECT lower(s.subscription_tier)
  INTO v_tier
  FROM public.subscribers s
  WHERE (s.user_id = v_user OR s.email = auth.email())
    AND s.subscribed = true
  ORDER BY s.updated_at DESC
  LIMIT 1;

  IF v_tier IS NULL THEN
    SELECT usu.tier
    INTO v_tier
    FROM public.user_storage_usage usu
    WHERE usu.user_id = v_user;
  END IF;

  v_tier := COALESCE(v_tier, 'free');
  v_limit := public.get_tier_limit_bytes(v_tier);

  -- Ensure user_storage_usage row exists and tier is current
  INSERT INTO public.user_storage_usage (user_id, tier)
  VALUES (v_user, v_tier)
  ON CONFLICT (user_id) DO UPDATE
  SET tier = EXCLUDED.tier,
      updated_at = now();

  SELECT db_bytes_used, file_bytes_used, updated_at
  INTO v_db, v_file, v_updated
  FROM public.user_storage_usage
  WHERE user_id = v_user;

  RETURN QUERY
  SELECT v_user,
         v_tier,
         v_limit,
         COALESCE(v_db, 0)::BIGINT,
         COALESCE(v_file, 0)::BIGINT,
         COALESCE(v_db, 0)::BIGINT + COALESCE(v_file, 0)::BIGINT AS total_bytes,
         COALESCE(v_updated, now())::TIMESTAMPTZ;
END;
$$;

-- 10) can_add_usage: checks if adding deltas would exceed the limit
CREATE OR REPLACE FUNCTION public.can_add_usage(_delta_db BIGINT, _delta_file BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r RECORD;
BEGIN
  SELECT * INTO r FROM public.get_current_storage_usage();
  IF r IS NULL THEN
    RETURN true; -- fail-open if status not available
  END IF;
  RETURN (r.total_bytes + GREATEST(_delta_db, 0) + GREATEST(_delta_file, 0)) <= r.limit_bytes;
END;
$$;
