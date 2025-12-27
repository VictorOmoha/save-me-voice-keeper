-- Fix ambiguous column reference in get_current_storage_usage function
-- The issue was that 'user_id' in SELECT could refer to either the return table column
-- or the table column. We now use explicit table alias to disambiguate.

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
  INSERT INTO public.user_storage_usage AS usu_insert (user_id, tier)
  VALUES (v_user, v_tier)
  ON CONFLICT (user_id) DO UPDATE
  SET tier = EXCLUDED.tier,
      updated_at = now();

  -- Use explicit table alias to avoid ambiguity with return table columns
  SELECT usu.db_bytes_used, usu.file_bytes_used, usu.updated_at
  INTO v_db, v_file, v_updated
  FROM public.user_storage_usage usu
  WHERE usu.user_id = v_user;

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
