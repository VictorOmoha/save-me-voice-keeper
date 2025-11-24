-- Drop existing policies on subscribers table
DROP POLICY IF EXISTS "No user can delete subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "Users can insert only their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update only their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view only their own subscription" ON public.subscribers;

-- Create improved RLS policies with explicit authentication checks
CREATE POLICY "Authenticated users can view only their own subscription"
ON public.subscribers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert only their own subscription"
ON public.subscribers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can update only their own subscription"
ON public.subscribers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
);

-- No user can delete subscriptions (service role only)
CREATE POLICY "No user can delete subscriptions"
ON public.subscribers
FOR DELETE
TO authenticated
USING (false);