
-- Create a table to store form entries
CREATE TABLE public.entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  title TEXT NOT NULL,
  fields JSONB NOT NULL DEFAULT '{}',
  field_definitions JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own entries
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view their own entries" 
  ON public.entries 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own entries" 
  ON public.entries 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries" 
  ON public.entries 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries" 
  ON public.entries 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Allow anonymous users to create entries (for demo purposes)
CREATE POLICY "Anonymous users can create entries" 
  ON public.entries 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anonymous users can view all entries" 
  ON public.entries 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anonymous users can update all entries" 
  ON public.entries 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Anonymous users can delete all entries" 
  ON public.entries 
  FOR DELETE 
  USING (true);
