-- Create a secure view for public demo video access that excludes sensitive fields
CREATE OR REPLACE VIEW public.public_demo_videos AS
SELECT 
  id,
  title,
  description,
  video_url,
  thumbnail_url,
  video_type,
  is_active,
  created_at,
  updated_at
FROM public.demo_videos
WHERE is_active = true;

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.public_demo_videos TO anon;
GRANT SELECT ON public.public_demo_videos TO authenticated;

-- Drop the public SELECT policy that exposes all columns including uploaded_by
DROP POLICY IF EXISTS "Anyone can view active demo videos" ON public.demo_videos;

-- Add a comment explaining the security model
COMMENT ON VIEW public.public_demo_videos IS 'Public-safe view of demo_videos that excludes the uploaded_by field to prevent internal user ID exposure';