import 'server-only';
import { arrayMove } from './array';
import { pageForUser, saveDraft, publish, hasUnpublished } from './pages';
import { parsePage, Tile, Theme, newId, type Page } from './schema';
import { tileFromInput } from './detect';
import { siteUrl } from './site';
import { enrichTile } from './enrich';

/** Operations shared by the REST API and the MCP server. Each one edits the draft. */
async function edit(userId: string, fn: (p: Page) => Page) {
  const row = await pageForUser(userId);
  if (!row) throw new Error('This account has no page yet. Claim a username at /onboarding first.');
  const next = fn(parsePage(row.draft));
  return saveDraft(userId, next);
}

export async function getState(userId: string) {
  const row = await pageForUser(userId);
  if (!row) return null;
  return {
    username: row.username,
    url: `${siteUrl()}/${row.username}`,
    version: row.version,
    publishedAt: row.publishedAt,
    hasUnpublishedChanges: hasUnpublished(row),
    page: parsePage(row.draft),
  };
}

export async function addTile(userId: string, input: string | Record<string, unknown>, opts: { after?: string; size?: string; color?: string } = {}) {
  const base = typeof input === 'string' ? tileFromInput(input) : { id: newId(), ...input };
  const tile = await enrichTile(Tile.parse({ ...base, ...(opts.size && { size: opts.size }), ...(opts.color && { color: opts.color }) }));
  await edit(userId, p => {
    const tiles = [...p.tiles];
    const at = opts.after ? tiles.findIndex(t => t.id === opts.after) : -1;
    tiles.splice(at >= 0 ? at + 1 : tiles.length, 0, tile);
    return { ...p, tiles };
  });
  return tile;
}

export async function updateTile(userId: string, id: string, patch: Record<string, unknown>) {
  let updated: Tile | undefined;
  await edit(userId, p => {
    const tiles = p.tiles.map(t => {
      if (t.id !== id) return t;
      updated = Tile.parse({ ...t, ...patch, id: t.id, type: (patch.type as string) ?? t.type });
      return updated;
    });
    if (!updated) throw new Error(`No tile with id ${id}`);
    return { ...p, tiles };
  });
  return updated!;
}

export async function removeTile(userId: string, id: string) {
  await edit(userId, p => {
    if (!p.tiles.some(t => t.id === id)) throw new Error(`No tile with id ${id}`);
    return { ...p, tiles: p.tiles.filter(t => t.id !== id) };
  });
}

export async function moveTile(userId: string, id: string, to: number) {
  await edit(userId, p => {
    const from = p.tiles.findIndex(t => t.id === id);
    if (from < 0) throw new Error(`No tile with id ${id}`);
    return { ...p, tiles: arrayMove(p.tiles, from, Math.max(0, Math.min(to, p.tiles.length - 1))) };
  });
}

export async function setTheme(userId: string, patch: Record<string, unknown>) {
  let theme: Page['theme'] | undefined;
  await edit(userId, p => {
    theme = Theme.parse({ ...p.theme, ...patch, background: { ...p.theme.background, ...(patch.background as object | undefined) } });
    return { ...p, theme };
  });
  return theme!;
}

export async function setProfile(userId: string, patch: Partial<Page['profile']>) {
  let profile: Page['profile'] | undefined;
  await edit(userId, p => { profile = { ...p.profile, ...patch }; return { ...p, profile }; });
  return profile!;
}

export async function publishPage(userId: string) {
  const { username } = await publish(userId);
  return { url: `${siteUrl()}/${username}` };
}
