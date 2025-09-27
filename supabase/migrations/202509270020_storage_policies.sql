-- Storage policies for media uploads (photos and audio)
-- Apply via Supabase SQL editor or CLI

-- Allow authenticated users to upload to media buckets
DROP POLICY IF EXISTS "auth can upload media" ON storage.objects;
CREATE POLICY "auth can upload media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id in ('media-photos','media-audio')
  );

-- Allow authenticated users to read media in these buckets
DROP POLICY IF EXISTS "auth can read media" ON storage.objects;
CREATE POLICY "auth can read media"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id in ('media-photos','media-audio')
  );

-- Allow owners to update their own media (optional, for upserts/replacements)
DROP POLICY IF EXISTS "owner can update media" ON storage.objects;
CREATE POLICY "owner can update media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id in ('media-photos','media-audio') and owner = auth.uid()
  )
  WITH CHECK (
    bucket_id in ('media-photos','media-audio') and owner = auth.uid()
  );

-- Allow owners to delete their own media
DROP POLICY IF EXISTS "owner can delete media" ON storage.objects;
CREATE POLICY "owner can delete media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id in ('media-photos','media-audio') and owner = auth.uid()
  );
