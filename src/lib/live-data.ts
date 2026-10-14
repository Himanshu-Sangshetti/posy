import type { Page } from './schema';

import { githubRepo } from './enrich';

/** Refresh GitHub tiles (stars, description, language) on render; falls back to stored values. */
export async function withLiveData(page: Page): Promise<Page> {
  const tiles = await Promise.all(page.tiles.map(async t => {
    if (t.type !== 'github') return t;
    const r = await githubRepo(t.repo);
    return r ? { ...t, description: t.description || r.description, stars: r.stars, language: r.language || t.language } : t;
  }));
  return { ...page, tiles };
}
