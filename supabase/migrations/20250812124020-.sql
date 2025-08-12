-- 1) Create roles enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END$$;

-- 2) Create user_roles table (no FK to auth.users to avoid reserved schema coupling)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Optional basic policy so users can view their own roles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users can view their own roles'
  ) THEN
    CREATE POLICY "Users can view their own roles"
      ON public.user_roles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3) Create has_role function (SECURITY DEFINER, stable)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles r
    WHERE r.user_id = _user_id
      AND r.role = _role
  );
$$;

-- 4) Tighten demo_videos policies to admin-only for write operations
-- Ensure RLS is enabled
ALTER TABLE public.demo_videos ENABLE ROW LEVEL SECURITY;

-- Drop overly-permissive existing policies if present
DROP POLICY IF EXISTS "Authenticated users can delete demo videos" ON public.demo_videos;
DROP POLICY IF EXISTS "Authenticated users can update demo videos" ON public.demo_videos;
DROP POLICY IF EXISTS "Authenticated users can view all demo videos" ON public.demo_videos;
DROP POLICY IF EXISTS "Authenticated users can upload demo videos" ON public.demo_videos;

-- Keep existing public SELECT on active videos ("Anyone can view active demo videos") as-is
-- Add admin-only SELECT for all videos
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'demo_videos' AND policyname = 'Admins can view all demo videos'
  ) THEN
    CREATE POLICY "Admins can view all demo videos"
      ON public.demo_videos
      FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Admin-only INSERT (must also set uploaded_by to themselves)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'demo_videos' AND policyname = 'Only admins can insert demo videos'
  ) THEN
    CREATE POLICY "Only admins can insert demo videos"
      ON public.demo_videos
      FOR INSERT
      TO authenticated
      WITH CHECK (public.has_role(auth.uid(), 'admin') AND uploaded_by = auth.uid());
  END IF;
END $$;

-- Admin-only UPDATE
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'demo_videos' AND policyname = 'Only admins can update demo videos'
  ) THEN
    CREATE POLICY "Only admins can update demo videos"
      ON public.demo_videos
      FOR UPDATE
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Admin-only DELETE
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'demo_videos' AND policyname = 'Only admins can delete demo videos'
  ) THEN
    CREATE POLICY "Only admins can delete demo videos"
      ON public.demo_videos
      FOR DELETE
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;