-- Drop existing policies on subscribers table
DROP POLICY IF EXISTS "No user can delete subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "Authenticated users can insert only their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Authenticated users can update only their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Authenticated users can view only their own subscription" ON public.subscribers;

-- Explicit denial for anonymous users
CREATE POLICY "Block all anonymous access to subscribers"
ON public.subscribers
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Restrictive policies for authenticated users only
CREATE POLICY "Authenticated users can view only their own subscription"
ON public.subscribers
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Authenticated users can insert only their own subscription"
ON public.subscribers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
  AND email = auth.email()
);

CREATE POLICY "Authenticated users can update only their own subscription"
ON public.subscribers
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
  AND email = auth.email()
);

-- Block all deletes (service role only can delete)
CREATE POLICY "Block all user deletes from subscribers"
ON public.subscribers
FOR DELETE
TO authenticated
USING (false);