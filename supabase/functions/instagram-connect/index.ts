import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const graphVersion = "v22.0";

function redirect(url: string) { return Response.redirect(url, 302); }

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  const appId = Deno.env.get("META_APP_ID");
  const appSecret = Deno.env.get("META_APP_SECRET");
  const redirectUri = Deno.env.get("META_REDIRECT_URI");
  const appUrl = Deno.env.get("APP_URL") ?? "https://alisanpgpantalla1.vercel.app";
  if (!appId || !appSecret || !redirectUri) return new Response(JSON.stringify({ error: "Faltan los secretos META_APP_ID, META_APP_SECRET o META_REDIRECT_URI." }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const url = new URL(request.url);
  try {
    // Meta redirects the account owner here after they approve the requested permissions.
    if (request.method === "GET" && url.searchParams.get("code")) {
      const code = url.searchParams.get("code")!;
      const tokenUrl = new URL(`https://graph.facebook.com/${graphVersion}/oauth/access_token`);
      tokenUrl.search = new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code }).toString();
      const tokenResponse = await fetch(tokenUrl);
      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) throw new Error(tokenData.error?.message ?? "Meta no entregó un token.");
      const pagesResponse = await fetch(`https://graph.facebook.com/${graphVersion}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${tokenData.access_token}`);
      const pages = await pagesResponse.json();
      const page = pages.data?.find((p: any) => p.instagram_business_account)?.[0] ?? pages.data?.find((p: any) => p.instagram_business_account);
      if (!page?.instagram_business_account?.id) throw new Error("No encontramos una cuenta profesional de Instagram vinculada a una página de Facebook.");
      await supabase.from("instagram_connections").insert({ profile_url: "https://www.instagram.com/alisanpg/", username: page.instagram_business_account.username, instagram_user_id: page.instagram_business_account.id, access_token: page.access_token, token_expires_at: new Date(Date.now() + 50 * 86400000).toISOString() });
      return redirect(`${appUrl}/panel?instagram=connected`);
    }
    const body = await request.json();
    if (body.action === "authorize") {
      const authUrl = new URL(`https://www.facebook.com/${graphVersion}/dialog/oauth`);
      authUrl.search = new URLSearchParams({ client_id: appId, redirect_uri: redirectUri, response_type: "code", scope: "instagram_basic,pages_show_list,pages_read_engagement" }).toString();
      return new Response(JSON.stringify({ authorize_url: authUrl.toString() }), { headers: { ...cors, "Content-Type": "application/json" } });
    }
    if (body.action === "sync") {
      const { data: connection } = await supabase.from("instagram_connections").select("*").order("connected_at", { ascending: false }).limit(1).maybeSingle();
      if (!connection?.instagram_user_id || !connection.access_token) throw new Error("Primero conecta la cuenta de Instagram.");
      const mediaResponse = await fetch(`https://graph.facebook.com/${graphVersion}/${connection.instagram_user_id}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=25&access_token=${connection.access_token}`);
      const media = await mediaResponse.json();
      if (!mediaResponse.ok) throw new Error(media.error?.message ?? "No se pudieron leer los Reels.");
      const reels = (media.data ?? []).filter((item: any) => (item.media_type === "REELS" || item.media_type === "VIDEO") && item.media_url);
      for (const reel of reels) {
        const { data: existing } = await supabase.from("display_media").select("id").eq("external_id", reel.id).maybeSingle();
        const values = { title: reel.caption?.slice(0, 80) || "Reel de Instagram", source: "instagram", video_url: reel.media_url, thumbnail_url: reel.thumbnail_url, instagram_permalink: reel.permalink, external_id: reel.id, is_active: true, synced_at: new Date().toISOString() };
        if (existing) await supabase.from("display_media").update(values).eq("id", existing.id);
        else await supabase.from("display_media").insert({ ...values, queue_order: 1000 + reels.indexOf(reel) });
      }
      await supabase.from("instagram_connections").update({ last_synced_at: new Date().toISOString() }).eq("id", connection.id);
      return new Response(JSON.stringify({ imported: reels.length }), { headers: { ...cors, "Content-Type": "application/json" } });
    }
    throw new Error("Acción no soportada.");
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
