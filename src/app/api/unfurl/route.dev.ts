// Dev-only: fetch a page's title / description / preview image for link tiles.
export const dynamic = 'force-dynamic';

const meta = (html: string, key: string) =>
  html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)`, 'i'))?.[1] ??
  html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`, 'i'))?.[1];
const decode = (s?: string) => s?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get('url');
  if (!url || !/^https?:\/\//.test(url)) return Response.json({ error: 'Bad url' }, { status: 400 });
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Posy link preview)' }, signal: AbortSignal.timeout(5000), redirect: 'follow' });
    const html = (await res.text()).slice(0, 300_000);
    let image = decode(meta(html, 'og:image') ?? meta(html, 'twitter:image'));
    if (image) image = new URL(image, res.url).toString();
    return Response.json({
      title: decode(meta(html, 'og:title') ?? html.match(/<title[^>]*>([^<]+)/i)?.[1]),
      description: decode(meta(html, 'og:description') ?? meta(html, 'description')),
      image,
    });
  } catch {
    return Response.json({});
  }
}
