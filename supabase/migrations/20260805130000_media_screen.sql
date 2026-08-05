CREATE TABLE IF NOT EXISTS public.display_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL,
  source text NOT NULL DEFAULT 'upload' CHECK (source IN ('upload', 'instagram')),
  video_url text NOT NULL, thumbnail_url text, instagram_permalink text,
  is_active boolean NOT NULL DEFAULT true, is_current boolean NOT NULL DEFAULT false,
  queue_order integer NOT NULL DEFAULT 0, created_by text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.instagram_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_url text NOT NULL, username text, access_token text,
  connected_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.display_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view display media" ON public.display_media FOR SELECT USING (true);
CREATE POLICY "Employees can manage display media" ON public.display_media FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Employees can manage Instagram connection" ON public.instagram_connections FOR ALL USING (true) WITH CHECK (true);
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('display-videos', 'display-videos', true, 524288000, ARRAY['video/mp4'])
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;
CREATE POLICY "Public can view display videos" ON storage.objects FOR SELECT USING (bucket_id = 'display-videos');
CREATE POLICY "Employees can upload display videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'display-videos');
CREATE POLICY "Employees can update display videos" ON storage.objects FOR UPDATE USING (bucket_id = 'display-videos');
CREATE POLICY "Employees can delete display videos" ON storage.objects FOR DELETE USING (bucket_id = 'display-videos');
ALTER TABLE public.display_media REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.display_media;
