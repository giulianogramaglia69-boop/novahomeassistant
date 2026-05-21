import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseRss(xml: string): { title: string; link: string; pubDate: string; source: string }[] {
  const items: { title: string; link: string; pubDate: string; source: string }[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title =
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ||
      block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "";
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";
    const source = block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || "";
    if (title) items.push({ title: title.trim(), link, pubDate, source });
  }
  return items;
}

const FEEDS = [
  "https://news.google.com/rss?hl=it&gl=IT&ceid=IT:it",
  "https://www.ansa.it/sito/ansait_rss.xml",
  "https://www.repubblica.it/rss/homepage/rss2.0.xml",
];

async function fetchFeed(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NOVAHome/1.0; +https://novahomeassistant.lovable.app)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let items: ReturnType<typeof parseRss> = [];
    for (const url of FEEDS) {
      const xml = await fetchFeed(url);
      if (!xml) continue;
      items = parseRss(xml).slice(0, 20);
      if (items.length > 0) break;
    }
    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("News feed error:", e);
    // Soft-fail with empty list so client doesn't surface a red error
    return new Response(JSON.stringify({ items: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
