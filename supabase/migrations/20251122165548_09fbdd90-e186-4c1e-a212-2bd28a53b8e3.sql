-- Ensure RLS is explicitly enabled on subscribers table
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Add explicit comment documenting the security model
COMMENT ON TABLE public.subscribers IS 'Contains sensitive customer subscription data. RLS policies ensure users can only access their own subscription records.';