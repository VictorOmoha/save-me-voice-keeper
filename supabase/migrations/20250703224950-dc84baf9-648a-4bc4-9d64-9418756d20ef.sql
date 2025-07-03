-- Fix the user_id column to be NOT NULL and ensure the trigger works properly
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