
-- First, drop the conflicting anonymous policies
DROP POLICY IF EXISTS "Anonymous users can create entries" ON public.entries;
DROP POLICY IF EXISTS "Anonymous users can view all entries" ON public.entries;
DROP POLICY IF EXISTS "Anonymous users can update all entries" ON public.entries;
DROP POLICY IF EXISTS "Anonymous users can delete all entries" ON public.entries;

-- Make user_id column NOT NULL since RLS policies depend on it
ALTER TABLE public.entries ALTER COLUMN user_id SET NOT NULL;

-- Update the entries table to automatically set user_id on insert
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set user_id
DROP TRIGGER IF EXISTS set_user_id_trigger ON public.entries;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT ON public.entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();
