// Hosted MCP server: lets Claude, Cursor, Codex & co. edit a Posy page with the user's API key.
import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { z } from 'zod';
import { createLocalJWKSet, jwtVerify } from 'jose';
import { auth } from '@/lib/auth';
import { keyAllows } from '@/lib/session';
import { siteUrl } from '@/lib/site';
import { getState, importBrief, createPageFor, addTiles, addTile, updateTile, removeTile, moveTile, setTheme, setProfile, publishPage } from '@/lib/page-ops';
import type { Page } from '@/lib/schema';
import { SIZES, COLORS, FONTS, RADII, LAYOUTS, ALIGNS, BACKGROUNDS, TILE_STYLES, EFFECTS, AVATARS, PHOTO_LOOKS } from '@/lib/schema';
import { THEME_IDS } from '@/lib/themes';
import { STYLE_IDS, STYLE_INFO, STYLE_PALETTES } from '@/lib/styles';
import { TEMPLATES } from '@/lib/templates';
import { PLATFORM_IDS } from '@/lib/platforms';

const ok = (data: unknown) => ({ content: [{ type: 'text' as const, text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }] });
const fail = (e: unknown) => ({ content: [{ type: 'text' as const, text: `Error: ${(e as Error).message}` }], isError: true });
const userOf = (ctx: { http?: { authInfo?: { extra?: Record<string, unknown> } } }) => String(ctx.http?.authInfo?.extra?.userId ?? '');
const run = <A,>(fn: (userId: string, args: A) => Promise<unknown>) => async (args: A, ctx: Parameters<typeof userOf>[0]) => {
  try { return ok(await fn(userOf(ctx), args)); } catch (e) { return fail(e); }
};

const INSTRUCTIONS = `Posy makes a link-in-bio page ("Linktree-like"). Every edit changes the user's DRAFT; call "publish" to make it live.
Flow: get_page first. If it says there is no page, ask the user for a username and call create_page. Then add their links with
add_tile (use "inputs" to add many at once), optionally set_profile and set_theme, then publish and give them the public URL.
Tiles have stable ids. Sizes: s=1x1, w=2x1, t=1x2, l=2x2. "heading" tiles start sections.
add_tile accepts any link (profiles, YouTube, Spotify, GitHub repos, images), an email, owner/repo, or plain text and picks the right tile.
Pass empty: true to create_page when you will add the user's own links. list_options lists the looks and the palettes each offers.
Keep pages calm: a few well-chosen tiles beat many. Ask before deleting things the user added, and before import_page replaces a draft.`;

const READ = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const WRITE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false };
const SET = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const DESTROY = { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false };
// publish makes content public, so it is open-world even though it only changes this user's page.
const PUBLISH = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true };

const NEXT_NO_PAGE = 'No page yet. Ask the user which username they want (3–30 letters, numbers, - or _), then call create_page.';
const nextStep = (s: { hasUnpublishedChanges: boolean; page: { tiles: unknown[] } }) =>
  !s.page.tiles.length ? 'The page is empty. Ask the user for their links and add them with add_tile (inputs[]).'
  : s.hasUnpublishedChanges ? 'There are unpublished changes. Call publish when the user is happy, then share the URL.'
  : 'Everything is published. Share the URL.';

/** How the server introduces itself to AI apps (title and icon show in their connector lists). mcp-handler's type only names `name` and `version`, but passes the whole object to the MCP server. */
const SERVER_INFO = {
  name: 'posy', title: 'Posy', version: '2.0.0', websiteUrl: 'https://posy.page',
  icons: [
    { src: 'https://posy.page/brand/posy-app-512.png', mimeType: 'image/png', sizes: ['512x512'] },
    { src: 'https://posy.page/icon.svg', mimeType: 'image/svg+xml', sizes: ['any'] },
  ],
} as { name: string; version: string };

const handler = createMcpHandler(server => {
  // Connector directories (Claude's among them) read the display name from annotations.title, not the tool's title.
  const register = server.registerTool.bind(server);
  server.registerTool = ((name: string, config: { title?: string; annotations?: object }, cb: unknown) =>
    register(name, { ...config, annotations: { title: config.title, ...config.annotations } } as never, cb as never)) as typeof server.registerTool;

  server.registerTool('get_page', {
    title: 'Get page',
    description: 'The current draft (profile, theme, tiles with ids), public URL, version and whether there are unpublished changes.',
    inputSchema: z.object({}),
    annotations: READ,
  }, run(async userId => {
    const s = await getState(userId);
    return s ? { ...s, next: nextStep(s) } : NEXT_NO_PAGE;
  }));

  server.registerTool('create_page', {
    title: 'Create page',
    description: 'Claim a username and create the user\'s page (one per account). `style` picks a look; without it the page starts from a starter template.',
    inputSchema: z.object({
      username: z.string().describe('3–30 letters, numbers, - or _. This becomes the public URL.'),
      style: z.enum(STYLE_IDS).optional().describe('The look of the page: cozy (Desk), washi, lofi, painted, cobalt or night. Omit to use a starter template.'),
      layout: z.enum(LAYOUTS).optional(),
      preset: z.enum(THEME_IDS).optional().describe('Colour theme'),
      template: z.enum(Object.keys(TEMPLATES) as [keyof typeof TEMPLATES, ...(keyof typeof TEMPLATES)[]]).optional(),
      empty: z.boolean().optional().describe('Start blank instead of with sample tiles.'),
    }),
    annotations: WRITE,
  }, run(async (userId, a: Record<string, unknown>) => ({ ...(await createPageFor(userId, a)), next: 'Add the user\'s links with add_tile (inputs[]), then publish.' })));

  server.registerTool('import_page', {
    title: 'Import page file',
    description: 'Load a whole page at once from a Posy brief (name, bio, look, theme, links[]) or a full page JSON. Creates the page if there is none (pass username); with an existing page it replaces the draft only when replace is true.',
    inputSchema: z.object({
      file: z.union([z.string(), z.record(z.string(), z.unknown())]).describe('The brief or page JSON, as an object or text. Format: /docs/format'),
      username: z.string().optional(),
      replace: z.boolean().optional().describe('Overwrite an existing draft.'),
    }),
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
  }, run(async (userId, a: { file: string | Record<string, unknown>; username?: string; replace?: boolean }) => ({ ...(await importBrief(userId, a.file, a)), next: 'Review with get_page, then publish.' })));

  server.registerTool('add_tile', {
    title: 'Add tile',
    description: 'Add tiles. Pass `inputs` (several links, emails, owner/repos or notes) or `input` (one) to auto-detect, or a full `tile` object.',
    inputSchema: z.object({
      input: z.string().optional().describe('e.g. "https://github.com/user", "owner/repo", "hi@me.com", "Open to work"'),
      inputs: z.array(z.string()).max(30).optional().describe('Several inputs at once, added in order.'),
      tile: z.record(z.string(), z.unknown()).optional().describe('Full tile object, e.g. {"type":"heading","text":"Projects"}'),
      after: z.string().optional().describe('Insert after this tile id (default: end)'),
      size: z.enum(SIZES).optional(),
      color: z.enum(COLORS).optional(),
    }),
    annotations: WRITE,
  }, run(async (userId, a: { input?: string; inputs?: string[]; tile?: Record<string, unknown>; after?: string; size?: string; color?: string }) => {
    if (a.inputs?.length) return { added: await addTiles(userId, a.inputs, a), next: 'Call publish when the user is happy.' };
    if (!a.input && !a.tile) throw new Error('Pass inputs, input or tile');
    return { added: await addTile(userId, a.tile ?? a.input!, a) };
  }));

  server.registerTool('update_tile', {
    title: 'Update tile',
    description: 'Change fields of a tile, e.g. {"size":"l"}, {"title":"New title"}, {"color":"mint"}, {"text":"…"}. Crop the picture of a tile with {"focus":{"x":30,"y":20},"zoom":1.6} (focus 0–100 is the point to keep in view, zoom 1–3).',
    inputSchema: z.object({ id: z.string(), patch: z.record(z.string(), z.unknown()) }),
    annotations: SET,
  }, run(async (userId, a: { id: string; patch: Record<string, unknown> }) => ({ updated: await updateTile(userId, a.id, a.patch) })));

  server.registerTool('remove_tile', {
    title: 'Remove tile', description: 'Delete a tile by id.', inputSchema: z.object({ id: z.string() }), annotations: DESTROY,
  }, run(async (userId, a: { id: string }) => { await removeTile(userId, a.id); return 'Removed.'; }));

  server.registerTool('move_tile', {
    title: 'Move tile', description: 'Move a tile to a 0-based position in the tile list.', inputSchema: z.object({ id: z.string(), position: z.number().int().min(0) }), annotations: SET,
  }, run(async (userId, a: { id: string; position: number }) => { await moveTile(userId, a.id, a.position); return 'Moved.'; }));

  server.registerTool('set_theme', {
    title: 'Set theme',
    description: 'Change colours, fonts, layout and other theme settings. Only pass what should change. `style` switches the look (cozy = Desk, washi, lofi, painted, cobalt, night); `preset` picks one of the palettes the chosen look offers.',
    inputSchema: z.object({
      style: z.enum(STYLE_IDS).optional().describe('The look: cozy (Desk), washi, lofi, painted, cobalt or night'),
      preset: z.enum(THEME_IDS).optional(), accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      font: z.enum(FONTS).optional(), radius: z.enum(RADII).optional(), layout: z.enum(LAYOUTS).optional(), align: z.enum(ALIGNS).optional(),
      tileStyle: z.enum(TILE_STYLES).optional(), effect: z.enum(EFFECTS).optional(), avatar: z.enum(AVATARS).optional(), photos: z.enum(PHOTO_LOOKS).optional(), motion: z.boolean().optional(), ambient: z.boolean().optional(),
      background: z.object({ style: z.enum(BACKGROUNDS).optional(), image: z.string().optional(), dim: z.number().optional(), blur: z.number().optional(), grain: z.boolean().optional(), color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional() }).optional(),
    }),
    annotations: SET,
  }, run(async (userId, a: Record<string, unknown>) => ({ theme: await setTheme(userId, a) })));

  server.registerTool('set_profile', {
    title: 'Set profile', description: 'Change name, bio, avatar URL or location. avatarFocus {x,y} (0–100) and avatarZoom (1–3) crop the avatar.',
    inputSchema: z.object({ name: z.string().optional(), bio: z.string().optional(), avatar: z.string().optional(), location: z.string().optional(), avatarFocus: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }).optional(), avatarZoom: z.number().min(1).max(3).optional() }),
    annotations: SET,
  }, run(async (userId, a: Partial<Page['profile']>) => ({ profile: await setProfile(userId, a) })));

  server.registerTool('publish', {
    title: 'Publish', description: 'Make the draft live at the public URL.', inputSchema: z.object({}), annotations: PUBLISH,
  }, run(async userId => publishPage(userId)));

  server.registerTool('list_options', {
    title: 'List options', description: 'Allowed values for looks (with a note and the palettes each offers), themes, fonts, backgrounds, tile styles, sizes, colours and social platforms.', inputSchema: z.object({}), annotations: READ,
  }, run(async () => ({ styles: STYLE_IDS.map(id => ({ id, label: STYLE_INFO[id].label, note: STYLE_INFO[id].note, palettes: STYLE_PALETTES[id] })), themes: THEME_IDS, fonts: FONTS, radius: RADII, layouts: LAYOUTS, align: ALIGNS, backgrounds: BACKGROUNDS, tileStyles: TILE_STYLES, effects: EFFECTS, avatars: AVATARS, photos: PHOTO_LOOKS, sizes: SIZES, colors: COLORS, platforms: PLATFORM_IDS })));
}, { serverInfo: SERVER_INFO, instructions: INSTRUCTIONS });

const RESOURCE = () => `${siteUrl()}/api/mcp`;

// One endpoint, two kinds of bearer: "posy_…" API keys, and OAuth access tokens (JWTs) from claude.ai, ChatGPT, Cursor …
const verify = async (_req: Request, token?: string) => {
  if (!token) return undefined;
  if (token.startsWith('posy_')) {
    const r = await auth.api.verifyApiKey({ body: { key: token } }).catch(() => null);
    if (!r?.valid || !r.key) return undefined;
    const scopes = keyAllows(r.key.permissions, 'write') ? ['page:write'] : [];
    return { token, clientId: r.key.id, scopes, extra: { userId: r.key.referenceId } };
  }
  try {
    const { baseURL } = await auth.$context;
    const jwks = createLocalJWKSet(await auth.api.getJwks());
    const { payload } = await jwtVerify(token, jwks, { issuer: baseURL, audience: RESOURCE() });
    const scopes = String(payload.scope ?? '').split(' ').filter(Boolean);
    if (!payload.sub) return undefined;
    return { token, clientId: String(payload.azp ?? payload.client_id ?? 'oauth'), scopes, expiresAt: payload.exp, extra: { userId: payload.sub } };
  } catch { return undefined; }
};

const authed = withMcpAuth(handler, verify, { required: true, requiredScopes: ['page:write'], resourceUrl: siteUrl() });
export { authed as GET, authed as POST, authed as DELETE };
