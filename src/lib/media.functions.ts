import { createServerFn } from "@tanstack/react-start";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";

const mediaInput = z.object({ id: z.string().uuid() });
const mediaUrl = z.string().url().max(2000);

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL no está configurada en el servidor.");
  return neon(url);
}

async function ensureSchema() {
  const sql = db();
  await sql`CREATE TABLE IF NOT EXISTS display_media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL,
    source text NOT NULL DEFAULT 'upload', video_url text NOT NULL,
    is_active boolean NOT NULL DEFAULT true, is_current boolean NOT NULL DEFAULT false,
    queue_order integer NOT NULL DEFAULT 0, profile_url text, created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS display_settings (key text PRIMARY KEY, value text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`;
}

export const getDisplayMedia = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSchema();
  return db()`SELECT id, title, source, video_url, is_active, is_current, queue_order FROM display_media WHERE is_active = true ORDER BY queue_order ASC, created_at ASC`;
});

export const publishDisplayMedia = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ title: z.string().min(1).max(160), videoUrl: mediaUrl, source: z.enum(["upload", "instagram"]).default("upload") }).parse(input))
  .handler(async ({ data }) => { await ensureSchema(); const sql = db(); const count = await sql`SELECT count(*)::int AS count FROM display_media`; const rows = await sql`INSERT INTO display_media (title, video_url, source, is_current, queue_order) VALUES (${data.title}, ${data.videoUrl}, ${data.source}, ${(count[0]?.count ?? 0) === 0}, ${count[0]?.count ?? 0}) RETURNING id`; return rows[0]; });

export const chooseCurrentMedia = createServerFn({ method: "POST" }).inputValidator(mediaInput).handler(async ({ data }) => { await ensureSchema(); const sql = db(); await sql`UPDATE display_media SET is_current = false WHERE is_current = true`; await sql`UPDATE display_media SET is_current = true WHERE id = ${data.id}`; });
export const deleteDisplayMedia = createServerFn({ method: "POST" }).inputValidator(mediaInput).handler(async ({ data }) => { await ensureSchema(); await db()`DELETE FROM display_media WHERE id = ${data.id}`; });
export const moveDisplayMedia = createServerFn({ method: "POST" }).inputValidator(z.object({ id: z.string().uuid(), otherId: z.string().uuid() })).handler(async ({ data }) => { await ensureSchema(); const sql = db(); const rows = await sql`SELECT id, queue_order FROM display_media WHERE id = ${data.id} OR id = ${data.otherId}`; const a = rows.find((row) => row.id === data.id); const b = rows.find((row) => row.id === data.otherId); if (!a || !b) throw new Error("Video no encontrado."); await sql`UPDATE display_media SET queue_order = ${b.queue_order} WHERE id = ${a.id}`; await sql`UPDATE display_media SET queue_order = ${a.queue_order} WHERE id = ${b.id}`; });
