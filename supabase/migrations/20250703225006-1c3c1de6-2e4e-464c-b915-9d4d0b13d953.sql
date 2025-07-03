-- First, delete any entries with null user_id since we can't assign them to a user
DELETE FROM public.entries WHERE user_id IS NULL;

-- Now make user_id NOT NULL 
ALTER TABLE public.entries ALTER COLUMN user_id SET NOT NULL;

-- Update the set_user_id function to ensure it always sets the user_id
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;