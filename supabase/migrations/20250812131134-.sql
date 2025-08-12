-- Secure demo video delivery using signed URLs and private bucket

-- 1) Ensure 'demo-videos' bucket is private
UPDATE storage.buckets
SET public = false
WHERE id = 'demo-videos';

-- 2) Create RLS policy so only admins can manage objects in the 'demo-videos' bucket
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins manage demo videos objects'
  ) THEN
    DROP POLICY "Admins manage demo videos objects" ON storage.objects;
  END IF;
END$$;

CREATE POLICY "Admins manage demo videos objects"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'demo-videos' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'demo-videos' AND has_role(auth.uid(), 'admin'::app_role));
