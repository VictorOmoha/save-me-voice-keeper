-- 1) Ensure RLS is enabled (idempotent)
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- 2) Backfill user_id for existing rows from auth.users based on email
UPDATE public.subscribers s
SET user_id = u.id
FROM auth.users u
WHERE s.user_id IS NULL AND lower(s.email) = lower(u.email);

-- 3) Remove any orphaned rows that still lack a user_id after backfill (safety)
DELETE FROM public.subscribers s
WHERE s.user_id IS NULL;

-- 4) Enforce NOT NULL on user_id
ALTER TABLE public.subscribers
ALTER COLUMN user_id SET NOT NULL;

-- 5) Create INSERT trigger to set user_id from auth.uid() when missing (client-side inserts)
DROP TRIGGER IF EXISTS set_subscribers_user_id ON public.subscribers;
CREATE TRIGGER set_subscribers_user_id
BEFORE INSERT ON public.subscribers
FOR EACH ROW
EXECUTE FUNCTION public.set_user_id_if_null();

-- 6) Replace RLS policies with hardened versions (idempotently drop if exist)
DO $$ BEGIN
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
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'subscribers' AND policyname = 'insert_own_subscription'
  ) THEN
    DROP POLICY "insert_own_subscription" ON public.subscribers;
  END IF;
END $$;

-- 7) Create restrictive, owner-only policies (no DELETE on purpose)
CREATE POLICY "select_own_subscription" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "update_own_subscription" ON public.subscribers
FOR UPDATE
USING (user_id = auth.uid() OR email = auth.email())
WITH CHECK (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "insert_own_subscription" ON public.subscribers
FOR INSERT
WITH CHECK (user_id = auth.uid() OR email = auth.email());