import { authed, json } from '@/lib/api';

const meta = (html: string, key: string) =>
  html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)`, 'i'))?.[1] ??
  html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`, 'i'))?.[1];
const decode = (s?: string) => s?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
const privateHost = (h: string) => /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[?::1|172\.(1[6-9]|2\d|3[01])\.)/.test(h);

/** Title, description and preview image for a link tile. */
export const GET = authed(async (_userId, req) => {
  const url = new URL(req.url).searchParams.get('url') ?? '';
  let target: URL;
  try { target = new URL(url); } catch { return json({ error: 'Bad url' }, 400); }
  if (!/^https?:$/.test(target.protocol) || privateHost(target.hostname)) return json({ error: 'Bad url' }, 400);
  try {
    const res = await fetch(target, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PosyBot/1.0; link preview)' }, signal: AbortSignal.timeout(5000), redirect: 'follow' });
    const html = (await res.text()).slice(0, 300_000);
    let image = decode(meta(html, 'og:image') ?? meta(html, 'twitter:image'));
    if (image) image = new URL(image, res.url).toString();
    return json({ title: decode(meta(html, 'og:title') ?? html.match(/<title[^>]*>([^<]+)/i)?.[1]), description: decode(meta(html, 'og:description') ?? meta(html, 'description')), image });
  } catch { return json({}); }
});
