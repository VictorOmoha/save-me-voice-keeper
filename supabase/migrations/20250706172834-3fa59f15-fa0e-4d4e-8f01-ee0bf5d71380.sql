-- Create waiting list table
CREATE TABLE public.waiting_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (public signup)
CREATE POLICY "Anyone can join waiting list" 
ON public.waiting_list 
FOR INSERT 
WITH CHECK (true);

-- Create policy to prevent reading (admin only)
CREATE POLICY "No public read access to waiting list" 
ON public.waiting_list 
FOR SELECT 
USING (false);