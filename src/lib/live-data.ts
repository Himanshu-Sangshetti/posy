import type { Page } from './schema';

import { cachedRepos } from './enrich';

/** GitHub tiles with the latest cached stats (refreshed when the page is edited or published); falls back to stored values. */
export async function withLiveData(page: Page): Promise<Page> {
  const repos = page.tiles.flatMap(t => (t.type === 'github' ? [t.repo] : []));
  if (!repos.length) return page;
  const cache = await cachedRepos(repos);
  const tiles = page.tiles.map(t => {
    const r = t.type === 'github' ? cache.get(t.repo.toLowerCase()) : undefined;
    return t.type === 'github' && r ? { ...t, description: t.description || r.description, stars: r.stars, language: r.language || t.language } : t;
  });
  return { ...page, tiles };
}
