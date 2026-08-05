-- Maximum size accepted by the display bucket: 500 MB, MP4 only.
UPDATE storage.buckets
SET file_size_limit = 524288000, allowed_mime_types = ARRAY['video/mp4']
WHERE id = 'display-videos';
