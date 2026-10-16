/**
 * The Posy brief: a short, forgiving JSON file any chat model can write and anyone can load into Posy.
 * It is the way into Posy for chats that cannot connect to the MCP server (ChatGPT, Gemini, plain chat windows).
 *
 *   { "posy": 1, "name": "Mira Sol", "bio": "…", "look": "cobalt", "links": ["https://github.com/mira", {"heading": "Projects"}] }
 *
 * Also accepted: the full page JSON that Posy exports. Client-safe (no database, no network).
 */
import { z } from 'zod';
import { Page, SIZES, COLORS, LAYOUTS, newId, type Tile } from './schema';
import { tileFromInput } from './detect';
import { starterPage } from './templates';
import { STYLE_IDS, STYLE_INFO, type StyleId } from './styles';
import { THEME_IDS } from './themes';
import { USERNAME_RE } from './username';

const LinkObject = z.object({
  url: z.string().optional().describe('A link, e.g. "https://github.com/me". Posy picks the right kind of tile.'),
  email: z.string().optional(),
  repo: z.string().optional().describe('A GitHub repo as "owner/name"'),
  heading: z.string().optional().describe('Starts a new section'),
  text: z.string().optional().describe('A short note'),
  title: z.string().optional(), description: z.string().optional(),
  size: z.enum(SIZES).optional().describe('s=1x1, w=2x1, t=1x2, l=2x2'),
  color: z.enum(COLORS).optional(),
}).describe('One tile. Give exactly one of url, email, repo, heading or text.');

export const Brief = z.object({
  posy: z.literal(1).optional().describe('Format version'),
  username: z.string().optional().describe('The address, e.g. "mira" becomes posy.page/mira. 3–30 letters, numbers, - or _'),
  name: z.string().min(1).describe('Display name'),
  bio: z.string().optional(),
  location: z.string().optional(),
  avatar: z.string().optional().describe('Image URL'),
  look: z.string().optional().describe(`The look of the page. One of: ${STYLE_IDS.join(', ')}`),
  theme: z.string().optional().describe(`Colours. One of: ${THEME_IDS.join(', ')}`),
  layout: z.enum(LAYOUTS).optional(),
  links: z.array(z.union([z.string(), LinkObject])).max(60).describe('Links in order. Strings are fine: a URL, an email, owner/repo or a note. Use {"heading": "…"} to start a section.'),
}).describe('A Posy page in brief');
export type Brief = z.infer<typeof Brief>;

export class BriefError extends Error {}

/** Pull the JSON out of whatever a chat pasted: code fences, prose around it, smart quotes, trailing commas. */
export function extractJson(text: string): unknown {
  let t = text.trim();
  const fence = t.match(/```(?:json|jsonc|posy)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a === -1 || b <= a) throw new BriefError('I could not find a JSON object in that. Paste the whole reply from your chat, or just the { … } part.');
  t = t.slice(a, b + 1)
    .replace(/[\u201C\u201D\u201E]/g, '"').replace(/[\u2018\u2019]/g, "'")
    .replace(/\/\/[^\n"]*$/gm, '')           // line comments (not inside strings on the same line as a quote)
    .replace(/,\s*([}\]])/g, '$1');            // trailing commas
  try { return JSON.parse(t); }
  catch (e) { throw new BriefError(`That is not valid JSON (${(e as Error).message}). Ask your chat: "fix the JSON so it parses, and return only the JSON".`); }
}

export type BriefResult = { page: Page; username?: string; warnings: string[] };

function tileFor(entry: Brief['links'][number], i: number, warnings: string[]): Tile | null {
  const n = `link ${i + 1}`;
  if (typeof entry === 'string') {
    const s = entry.trim();
    if (!s) return null;
    return tileFromInput(s);
  }
  const o = entry;
  const given = [o.url, o.email, o.repo, o.heading, o.text].filter(Boolean).length;
  if (given !== 1) { warnings.push(`${n}: give exactly one of url, email, repo, heading or text. Skipped.`); return null; }
  if (o.heading) return { id: newId(), type: 'heading', text: o.heading, size: 's', color: 'auto' };
  const tile = tileFromInput((o.url ?? o.email ?? o.repo ?? o.text)!);
  if (tile.type === 'link') { if (o.title) tile.title = o.title; if (o.description) tile.description = o.description; }
  if (o.size) tile.size = o.size;
  if (o.color) tile.color = o.color;
  return tile;
}

/** Turn a brief (or a full page) into a page. Never throws for small mistakes: they come back as warnings. */
export function briefToPage(input: unknown): BriefResult {
  const warnings: string[] = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new BriefError('Expected a JSON object.');
  const o = input as Record<string, unknown>;

  // Full page JSON, as Posy exports it
  if (Array.isArray(o.tiles) && o.profile) {
    const r = Page.safeParse(o);
    if (!r.success) throw new BriefError(`That page file has a problem: ${r.error.issues.slice(0, 3).map(i => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ')}`);
    return { page: r.data, username: typeof o.username === 'string' ? o.username : undefined, warnings };
  }

  const r = Brief.safeParse(o);
  if (!r.success) {
    const issues = r.error.issues.slice(0, 3).map(i => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
    throw new BriefError(`The brief needs a "name" and a "links" list. ${issues}`);
  }
  const b = r.data;
  const known = Object.keys(Brief.shape);
  Object.keys(o).filter(k => !known.includes(k)).forEach(k => warnings.push(`Ignored "${k}": not part of the brief.`));

  let look: StyleId = STYLE_IDS[0];
  if (b.look) {
    const l = b.look.toLowerCase().trim();
    if ((STYLE_IDS as string[]).includes(l)) look = l as StyleId;
    else warnings.push(`Unknown look "${b.look}", used ${look}. Options: ${STYLE_IDS.join(', ')}.`);
  }
  let preset: string | undefined;
  if (b.theme) {
    const t = b.theme.toLowerCase().trim();
    if (THEME_IDS.includes(t)) preset = t; else warnings.push(`Unknown theme "${b.theme}", used the look's own colours.`);
  }

  const base = starterPage({ name: b.name, style: look, layout: b.layout, preset, empty: true });
  const tiles = b.links.map((e, i) => tileFor(e, i, warnings)).filter((t): t is Tile => !!t);
  if (!tiles.length) warnings.push('No links were added.');

  const page = Page.parse({ ...base, profile: { ...base.profile, name: b.name, bio: b.bio ?? '', ...(b.location ? { location: b.location } : {}), ...(b.avatar ? { avatar: b.avatar } : {}) }, tiles });
  let username = b.username?.trim().toLowerCase();
  if (username && !USERNAME_RE.test(username)) { warnings.push(`"${b.username}" is not a valid username (3–30 letters, numbers, - or _). You can pick one when you sign up.`); username = undefined; }
  return { page, username, warnings };
}

/** Everything in one: text from a chat → page. Throws BriefError with a message a person can act on. */
export const readBrief = (text: string) => briefToPage(extractJson(text));

/**
 * The simplest link a chat can write, with no encoding at all:
 *   /new?name=Mira&bio=Illustrator&links=https://github.com/mira,hi@mira.so,mira/atlas
 * `links` may be separated by commas, spaces or newlines, or repeated (`&link=…&link=…`). Also: username, look, theme, layout, avatar, location.
 * Returns null when the query holds no page.
 */
export function briefFromQuery(q: URLSearchParams): object | null {
  const links = [...q.getAll('links'), ...q.getAll('link')].flatMap(v => v.split(/[\s,]+/)).map(v => v.trim()).filter(Boolean);
  const name = q.get('name')?.trim();
  if (!name && !links.length) return null;
  const pick = (k: string) => q.get(k)?.trim() || undefined;
  return { posy: 1, name: name || 'My page', bio: pick('bio'), username: pick('username'), look: pick('look'), theme: pick('theme'), layout: pick('layout'), avatar: pick('avatar'), location: pick('location'), links };
}

/** A friendly address from a name: "Mira Sol" becomes "mira-sol". */
export const usernameFromName = (name: string) => name.trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);

/** Compact, URL-safe encoding for /new#p=… */
export const encodeBrief = (brief: object) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(brief)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export function decodeBrief(hash: string): unknown {
  const b = hash.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b + '='.repeat((4 - (b.length % 4)) % 4)), c => c.charCodeAt(0))));
}

/** The prompt a person pastes into any chat. Generated from the live options so it never goes stale. */
export function briefPrompt(site = 'https://posy.page') {
  const looks = STYLE_IDS.map(id => `${id} (${STYLE_INFO[id].note})`).join('; ');
  return `You are helping me make a link-in-bio page on Posy (${site}). Ask me for my name, a one-line bio, my links, and the vibe I want. Then reply with ONLY a JSON object (no explanation, no markdown) in this shape:

{
  "posy": 1,
  "username": "mira",            // optional: becomes ${site.replace(/^https?:\/\//, '')}/mira
  "name": "Mira Sol",
  "bio": "Illustrator making small, soft things",
  "look": "${STYLE_IDS[0]}",       // one of: ${looks}
  "theme": "${THEME_IDS[0]}",     // optional colours, one of: ${THEME_IDS.join(', ')}
  "links": [
    {"heading": "Find me"},
    "https://github.com/mira",     // any URL, email or owner/repo: Posy picks the right tile
    "hi@mira.so",
    {"heading": "Work"},
    {"url": "https://mira.so/portfolio", "title": "Portfolio", "size": "w"},
    {"text": "Open for commissions"}
  ]
}

Rules: keep the page calm, 5 to 12 links, a heading per group. Use only real links I gave you. "size" is optional: s (small), w (wide), t (tall), l (large).
When I have the JSON, I will paste it at ${site}/new.`;
}
