-- Add video_type field to demo_videos table to support different video categories
ALTER TABLE public.demo_videos 
ADD COLUMN video_type text NOT NULL DEFAULT 'demo';

-- Add a check constraint to ensure valid video types
ALTER TABLE public.demo_videos 
ADD CONSTRAINT valid_video_type CHECK (video_type IN ('demo', 'canvid_replacement'));

-- Update existing videos to be demo type
UPDATE public.demo_videos 
SET video_type = 'demo' 
WHERE video_type IS NULL;