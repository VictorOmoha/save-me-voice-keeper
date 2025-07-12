
-- Create a table for demo videos
CREATE TABLE public.demo_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for demo videos
ALTER TABLE public.demo_videos ENABLE ROW LEVEL SECURITY;

-- Policy for public to view active demo videos
CREATE POLICY "Anyone can view active demo videos" 
  ON public.demo_videos 
  FOR SELECT 
  USING (is_active = true);

-- Policy for authenticated users to view all demo videos (for admin interface)
CREATE POLICY "Authenticated users can view all demo videos" 
  ON public.demo_videos 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Policy for authenticated users to insert demo videos
CREATE POLICY "Authenticated users can upload demo videos" 
  ON public.demo_videos 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

-- Policy for authenticated users to update demo videos
CREATE POLICY "Authenticated users can update demo videos" 
  ON public.demo_videos 
  FOR UPDATE 
  TO authenticated
  USING (true);

-- Policy for authenticated users to delete demo videos
CREATE POLICY "Authenticated users can delete demo videos" 
  ON public.demo_videos 
  FOR DELETE 
  TO authenticated
  USING (true);

-- Create a storage bucket for demo videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('demo-videos', 'demo-videos', true);

-- Create RLS policies for the demo videos bucket
CREATE POLICY "Anyone can view demo videos" ON storage.objects
FOR SELECT USING (bucket_id = 'demo-videos');

CREATE POLICY "Authenticated users can upload demo videos" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'demo-videos');

CREATE POLICY "Authenticated users can update demo videos" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'demo-videos');

CREATE POLICY "Authenticated users can delete demo videos" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'demo-videos');
