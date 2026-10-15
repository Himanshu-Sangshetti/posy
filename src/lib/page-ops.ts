import 'server-only';
import { arrayMove } from './array';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { user } from '@/db/auth-schema';
import { pageForUser, saveDraft, publish, hasUnpublished, createPage } from './pages';
import { TEMPLATES, starterPage, type TemplateId } from './templates';
import { STYLE_IDS, type StyleId } from './styles';
import { THEMES } from './themes';
import { assertAllowed, entitlementsFor } from './entitlements';
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

/** Claim a username and create the user's page. Shared by REST `POST /api/v1/claim` and the MCP `create_page` tool. */
export async function createPageFor(userId: string, b: { username?: unknown; template?: unknown; style?: unknown; layout?: unknown; preset?: unknown; empty?: unknown }) {
  if (await pageForUser(userId)) throw new PageExistsError();
  const u = await db.select({ name: user.name }).from(user).where(eq(user.id, userId)).get();
  const name = u?.name ?? '';
  let page;
  if (typeof b.style === 'string' && (STYLE_IDS as readonly string[]).includes(b.style)) {
    page = starterPage({
      name, style: b.style as StyleId,
      layout: (['bento', 'list', 'canvas'] as const).find(l => l === b.layout),
      preset: typeof b.preset === 'string' && b.preset in THEMES ? b.preset : undefined,
      empty: b.empty === true,
    });
    assertAllowed(page, await entitlementsFor(userId));
  }
  const tpl = (typeof b.template === 'string' && b.template in TEMPLATES ? b.template : 'blank') as TemplateId;
  const row = await createPage(userId, String(b.username ?? ''), name, tpl, page);
  return { username: row.username, url: `${siteUrl()}/${row.username}` };
}

export class PageExistsError extends Error {
  constructor() { super('You already have a page'); }
}

/** Add several tiles at once, in order. Each entry is a link, email, owner/repo or note. */
export async function addTiles(userId: string, inputs: string[], opts: { after?: string } = {}) {
  const added = [];
  let after = opts.after;
  for (const input of inputs) {
    const tile = await addTile(userId, input, { after });
    added.push(tile);
    after = tile.id;
  }
  return added;
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
