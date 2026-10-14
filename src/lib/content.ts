import fs from 'node:fs';
import path from 'node:path';
import { parsePage, type Page } from './schema';

export const CONTENT_PATH = path.resolve(process.cwd(), process.env.POSY_CONTENT || 'content/page.json');

export function readPage(): Page {
  return parsePage(JSON.parse(fs.readFileSync(CONTENT_PATH, 'utf8')));
}

/** Refresh GitHub tiles (stars, description, language) at build time. Falls back to stored values. */
export async function withLiveData(page: Page): Promise<Page> {
  const tiles = await Promise.all(page.tiles.map(async t => {
    if (t.type !== 'github') return t;
    try {
      const res = await fetch(`https://api.github.com/repos/${t.repo}`, {
        headers: { Accept: 'application/vnd.github+json', ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) },
        signal: AbortSignal.timeout(6000),
        next: { revalidate: 3600 },
      });
      if (!res.ok) return t;
      const r = await res.json();
      return { ...t, description: t.description || r.description || undefined, stars: r.stargazers_count, language: r.language || t.language };
    } catch { return t; }
  }));
  return { ...page, tiles };
}
