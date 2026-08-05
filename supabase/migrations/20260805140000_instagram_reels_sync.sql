ALTER TABLE public.display_media ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE public.display_media ADD COLUMN IF NOT EXISTS synced_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS display_media_external_id_key ON public.display_media (external_id) WHERE external_id IS NOT NULL;
ALTER TABLE public.instagram_connections ADD COLUMN IF NOT EXISTS instagram_user_id text;
ALTER TABLE public.instagram_connections ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;
ALTER TABLE public.instagram_connections ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;
