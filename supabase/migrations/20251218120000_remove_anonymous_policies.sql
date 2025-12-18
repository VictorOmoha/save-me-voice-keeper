-- CRITICAL SECURITY FIX: Remove anonymous user policies from entries table
-- These policies were created for demo purposes but allow ANY unauthenticated user
-- to read, modify, or delete ANY user's data

-- Drop the overly permissive anonymous policies
DROP POLICY IF EXISTS "Anonymous users can create entries" ON public.entries;
DROP POLICY IF EXISTS "Anonymous users can view all entries" ON public.entries;
DROP POLICY IF EXISTS "Anonymous users can update all entries" ON public.entries;
DROP POLICY IF EXISTS "Anonymous users can delete all entries" ON public.entries;

-- Verify that the authenticated user policies are still in place
-- These should already exist from the original migration, but let's ensure they do

-- Policy for viewing own entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'entries'
    AND policyname = 'Users can view their own entries'
  ) THEN
    CREATE POLICY "Users can view their own entries"
      ON public.entries
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policy for creating own entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'entries'
    AND policyname = 'Users can create their own entries'
  ) THEN
    CREATE POLICY "Users can create their own entries"
      ON public.entries
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policy for updating own entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'entries'
    AND policyname = 'Users can update their own entries'
  ) THEN
    CREATE POLICY "Users can update their own entries"
      ON public.entries
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policy for deleting own entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'entries'
    AND policyname = 'Users can delete their own entries'
  ) THEN
    CREATE POLICY "Users can delete their own entries"
      ON public.entries
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add comment explaining the security model
COMMENT ON TABLE public.entries IS 'User entries with strict RLS - only authenticated users can access their own data';
