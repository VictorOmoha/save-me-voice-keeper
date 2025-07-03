-- Check if the trigger exists and recreate it to ensure it runs before RLS check
DROP TRIGGER IF EXISTS set_user_id_trigger ON public.entries;

-- Recreate the function to be more explicit
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set user_id to the current authenticated user
  NEW.user_id = auth.uid();
  
  -- If auth.uid() is null, the user is not authenticated, so reject the insert
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create entries';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger to run BEFORE INSERT
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT ON public.entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();