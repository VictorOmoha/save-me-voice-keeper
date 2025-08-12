-- Harden subscribers RLS: remove email-based access and require user_id auth

-- 1) Ensure RLS is enabled on subscribers
ALTER TABLE IF EXISTS public.subscribers ENABLE ROW LEVEL SECURITY;

-- 2) Drop existing permissive policies if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'subscribers' AND policyname = 'insert_subscription'
  ) THEN
    DROP POLICY "insert_subscription" ON public.subscribers;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'subscribers' AND policyname = 'select_own_subscription'
  ) THEN
    DROP POLICY "select_own_subscription" ON public.subscribers;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'subscribers' AND policyname = 'update_own_subscription'
  ) THEN
    DROP POLICY "update_own_subscription" ON public.subscribers;
  END IF;
END$$;

-- 3) Recreate strict, user_id-based policies
CREATE POLICY "insert_own_subscription" ON public.subscribers
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "select_own_subscription" ON public.subscribers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "update_own_subscription" ON public.subscribers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Note: No DELETE policy is created; deletes remain disallowed for users.

-- 4) Optional: add helpful comment for auditors
COMMENT ON TABLE public.subscribers IS 'Contains subscription linkage data; access restricted strictly by user_id via RLS.';
