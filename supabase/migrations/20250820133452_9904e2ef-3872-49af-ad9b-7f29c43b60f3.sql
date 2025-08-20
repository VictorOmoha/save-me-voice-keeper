-- Fix security issues with subscribers table RLS policies
-- Drop existing policies that have potential security vulnerabilities
DROP POLICY IF EXISTS "insert_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Create more secure RLS policies that explicitly require authentication
-- and prefer user_id matching over email matching

-- Policy for SELECT: Users can only view their own subscription data
CREATE POLICY "subscribers_select_own" ON public.subscribers
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    user_id = auth.uid() OR 
    (user_id = auth.uid() AND email = auth.email())
  )
);

-- Policy for INSERT: Only authenticated users can insert their own subscription data
CREATE POLICY "subscribers_insert_own" ON public.subscribers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND
  user_id = auth.uid()
);

-- Policy for UPDATE: Only authenticated users can update their own subscription data
CREATE POLICY "subscribers_update_own" ON public.subscribers
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND user_id = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL AND user_id = auth.uid()
);

-- Policy for DELETE: Prevent all direct deletes (subscription management should be done via Stripe)
CREATE POLICY "subscribers_no_delete" ON public.subscribers
FOR DELETE
TO authenticated
USING (false);

-- Ensure the table has RLS enabled
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;