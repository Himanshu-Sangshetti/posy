import 'server-only';
import type { Tile } from './schema';

const meta = (html: string, key: string) =>
  html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)`, 'i'))?.[1] ??
  html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`, 'i'))?.[1];
const decode = (s?: string) => s?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
export const isPrivateHost = (h: string) => /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[?::1|172\.(1[6-9]|2\d|3[01])\.)/.test(h);

export async function unfurl(url: string): Promise<{ title?: string; description?: string; image?: string }> {
  let target: URL;
  try { target = new URL(url); } catch { return {}; }
  if (!/^https?:$/.test(target.protocol) || isPrivateHost(target.hostname)) return {};
  try {
    const res = await fetch(target, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PosyBot/1.0; link preview)' }, signal: AbortSignal.timeout(5000), redirect: 'follow' });
    const html = (await res.text()).slice(0, 300_000);
    let image = decode(meta(html, 'og:image') ?? meta(html, 'twitter:image'));
    if (image) image = new URL(image, res.url).toString();
    return { title: decode(meta(html, 'og:title') ?? html.match(/<title[^>]*>([^<]+)/i)?.[1])?.slice(0, 80), description: decode(meta(html, 'og:description') ?? meta(html, 'description'))?.slice(0, 160), image };
  } catch { return {}; }
}

export async function githubRepo(repo: string) {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: { Accept: 'application/vnd.github+json', ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) },
      signal: AbortSignal.timeout(6000), next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const r = await res.json();
    return { description: (r.description as string | null) ?? undefined, stars: r.stargazers_count as number, language: (r.language as string | null) ?? undefined };
  } catch { return null; }
}

/** Fill in titles, previews and repo stats so tiles added by agents look complete. */
export async function enrichTile<T extends Tile>(tile: T): Promise<T> {
  if (tile.type === 'github') {
    const r = await githubRepo(tile.repo);
    return r ? { ...tile, description: tile.description ?? r.description, stars: r.stars, language: tile.language ?? r.language } : tile;
  }
  if (tile.type === 'link' && (!tile.title || !tile.image)) {
    const r = await unfurl(tile.url);
    return { ...tile, title: tile.title ?? r.title, description: tile.description ?? r.description, image: tile.image ?? r.image };
  }
  return tile;
}
