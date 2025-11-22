-- Fix RLS policies on subscribers table to properly secure sensitive data

-- Drop existing policies
DROP POLICY IF EXISTS "subscribers_select_own" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_insert_own" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_update_own" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_no_delete" ON public.subscribers;

-- Create strict SELECT policy - users can only view their own subscription data
CREATE POLICY "Users can view only their own subscription"
ON public.subscribers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create strict INSERT policy - users can only insert their own subscription data
CREATE POLICY "Users can insert only their own subscription"
ON public.subscribers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create strict UPDATE policy - users can only update their own subscription data
CREATE POLICY "Users can update only their own subscription"
ON public.subscribers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Maintain DELETE restriction - no user can delete subscription records
CREATE POLICY "No user can delete subscriptions"
ON public.subscribers
FOR DELETE
TO authenticated
USING (false);