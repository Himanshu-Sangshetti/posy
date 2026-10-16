import 'server-only';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { githubRepos } from '@/db/app-schema';
import type { Tile } from './schema';
import { safeFetch, isPublicUrl } from './safe-fetch';

const meta = (html: string, key: string) =>
  html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)`, 'i'))?.[1] ??
  html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`, 'i'))?.[1];
const decode = (s?: string) => s?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

/** A preview image we are willing to store: an http(s) URL on a public host. */
async function publicImage(raw: string | undefined, base?: string) {
  if (!raw) return undefined;
  try {
    const url = new URL(raw, base).toString();
    return (await isPublicUrl(url)) ? url : undefined;
  } catch { return undefined; }
}

export async function unfurl(url: string): Promise<{ title?: string; description?: string; image?: string }> {
  try {
    const res = await safeFetch(url, { maxBytes: 300_000, truncate: true, timeoutMs: 5000, accept: 'text/html,application/xhtml+xml' });
    const html = res.text();
    const image = await publicImage(decode(meta(html, 'og:image') ?? meta(html, 'twitter:image')), res.url);
    return { title: decode(meta(html, 'og:title') ?? html.match(/<title[^>]*>([^<]+)/i)?.[1])?.slice(0, 80), description: decode(meta(html, 'og:description') ?? meta(html, 'description'))?.slice(0, 160), image };
  } catch { return {}; }
}

type Repo = { description?: string; stars: number; language?: string };
const REPO = /^[\w.-]+\/[\w.-]+$/;
const FRESH_MS = 60 * 60 * 1000;

/**
 * Stats for a public GitHub repo, cached per repo for an hour. Only called when a page is edited or published, never
 * on a visitor's page view. Private repos (visible to GITHUB_TOKEN) are treated as missing so nothing private is published.
 */
export async function githubRepo(repo: string): Promise<Repo | null> {
  if (!REPO.test(repo)) return null;
  const key = repo.toLowerCase();
  const hit = await db.select().from(githubRepos).where(eq(githubRepos.repo, key)).get().catch(() => undefined);
  if (hit && Date.now() - hit.fetchedAt.getTime() < FRESH_MS) return hit.data;
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: { Accept: 'application/vnd.github+json', ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) },
      signal: AbortSignal.timeout(6000), cache: 'no-store',
    });
    const r = res.ok ? await res.json() : null;
    const data = r && !r.private ? { description: (r.description as string | null) ?? undefined, stars: r.stargazers_count as number, language: (r.language as string | null) ?? undefined } : null;
    await db.insert(githubRepos).values({ repo: key, data, fetchedAt: new Date() })
      .onConflictDoUpdate({ target: githubRepos.repo, set: { data, fetchedAt: new Date() } }).catch(() => {});
    return data;
  } catch { return hit?.data ?? null; }
}

/** Last known stats for these repos, from the cache only (no network). */
export async function cachedRepos(repos: string[]): Promise<Map<string, Repo>> {
  const keys = [...new Set(repos.filter(r => REPO.test(r)).map(r => r.toLowerCase()))];
  if (!keys.length) return new Map();
  const rows = await db.select().from(githubRepos).where(inArray(githubRepos.repo, keys)).all().catch(() => []);
  return new Map(rows.flatMap(r => (r.data ? [[r.repo, r.data] as const] : [])));
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
  if (tile.type === 'video' && (!tile.title || !tile.image)) {
    const r = await youtube(tile.url);
    return r ? { ...tile, title: tile.title ?? r.title, image: tile.image ?? r.image } : tile;
  }
  if (tile.type === 'music' && !tile.image) {
    const r = await spotify(tile.url);
    return r ? { ...tile, title: tile.title ?? r.title, image: r.image } : tile;
  }
  return tile;
}

async function oembed(endpoint: string) {
  const res = await safeFetch(endpoint, { maxBytes: 64_000, timeoutMs: 5000, accept: 'application/json' });
  if (!res.ok) return null;
  const r = res.json<{ title?: string; thumbnail_url?: string }>();
  return { title: r.title?.slice(0, 80), image: await publicImage(r.thumbnail_url) };
}

/** Title and cover art from Spotify's public oEmbed endpoint. */
export async function spotify(url: string): Promise<{ title?: string; image?: string } | null> {
  if (!/^https:\/\/open\.spotify\.com\//.test(url)) return null;
  return oembed(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`).catch(() => null);
}

/** Title and thumbnail from YouTube's public oEmbed endpoint (no key). */
export async function youtube(url: string): Promise<{ title?: string; image?: string } | null> {
  if (!/^https?:\/\/((www|m|music)\.)?(youtube\.com|youtu\.be)\//.test(url)) return null;
  return oembed(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`).catch(() => null);
}
