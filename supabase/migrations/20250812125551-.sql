-- Secure orders RLS and safe user_id trigger

-- 1) Ensure RLS is enabled
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;

-- 2) Drop permissive policies if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'insert_orders_any'
  ) THEN
    DROP POLICY "insert_orders_any" ON public.orders;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'update_orders_any'
  ) THEN
    DROP POLICY "update_orders_any" ON public.orders;
  END IF;
END$$;

-- 3) Create strict INSERT/UPDATE policies (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'insert_own_orders'
  ) THEN
    CREATE POLICY "insert_own_orders" ON public.orders
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'update_own_orders'
  ) THEN
    CREATE POLICY "update_own_orders" ON public.orders
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END$$;

-- 4) Ensure SELECT policy exists and targets authenticated
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'select_own_orders'
  ) THEN
    -- Recreate to ensure TO authenticated
    DROP POLICY "select_own_orders" ON public.orders;
  END IF;

  CREATE POLICY "select_own_orders" ON public.orders
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
END$$;

-- 5) Trigger to set user_id automatically only when missing
CREATE OR REPLACE FUNCTION public.set_user_id_if_null()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_orders_user_id ON public.orders;
CREATE TRIGGER set_orders_user_id
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_user_id_if_null();