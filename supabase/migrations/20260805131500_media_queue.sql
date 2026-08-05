-- A controlled playlist: only one item can be selected to play immediately.
ALTER TABLE public.display_media ADD COLUMN IF NOT EXISTS is_current boolean NOT NULL DEFAULT false;
ALTER TABLE public.display_media ADD COLUMN IF NOT EXISTS queue_order integer NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS display_media_one_current ON public.display_media (is_current) WHERE is_current;
