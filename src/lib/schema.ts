import { z } from 'zod';
import { PLATFORM_IDS } from './platforms';
import { THEME_IDS, TINTS } from './themes';
import { EDITION_FONT_PAIRS } from '@/edition/fonts';
import { CANVAS_WIDTH } from './canvas-layout';

/** Tile footprint on the grid: small square, wide, tall, large square. */
export const SIZES = ['s', 'w', 't', 'l'] as const;
export const BASE_FONTS = ['soft', 'editorial', 'washi', 'lofi', 'classic', 'elegant', 'rounded', 'playful', 'modern', 'tech', 'mono', 'hand', 'terminal', 'cyber', 'storybook', 'journal', 'stationery'] as const;
export const FONTS = [...BASE_FONTS, ...Object.keys(EDITION_FONT_PAIRS)] as [string, ...string[]];
export const RADII = ['sharp', 'soft', 'round', 'pill'] as const;
/** The look of the whole page. Independent of the layout. */
export const STYLES = ['cozy', 'minimal', 'washi', 'lofi'] as const;
/** Styles that were retired, and the look each one moves to. */
const RETIRED_STYLES: Record<string, (typeof STYLES)[number]> = { soft: 'minimal', editorial: 'minimal', terminal: 'minimal', neon: 'lofi' };
export const LAYOUTS = ['bento', 'list', 'canvas'] as const;
export const TEXT_LOOKS = ['note', 'stamp'] as const;
export const ALIGNS = ['side', 'center'] as const;
export const BACKGROUNDS = ['solid', 'dots', 'grid', 'image'] as const;
export const TILE_STYLES = ['soft', 'glass', 'outline', 'solid'] as const;
export const EFFECTS = ['lift', 'tilt', 'glow', 'none'] as const;
export const AVATARS = ['squircle', 'circle', 'square', 'hidden'] as const;
export const PHOTO_LOOKS = ['natural', 'mono', 'dither'] as const;
export const COLORS = ['auto', 'surface', 'accent', ...TINTS] as const;

const id = z.string().min(1).describe('Stable unique id, e.g. "t-abc123"');
const url = z.string().min(1).describe('Absolute URL (https://...) or a path inside /public');
/** Free placement on the canvas layout. Units are a 1200-wide design space; the page scales it to fit. */
export const TilePos = z.object({
  x: z.number().min(0).max(CANVAS_WIDTH).describe('Left edge, 0–1200'),
  y: z.number().min(0).describe('Top edge, 0 and up'),
  w: z.number().min(24).max(CANVAS_WIDTH).describe('Width, up to 1200'),
  h: z.number().min(24).describe('Height'),
  r: z.number().min(-15).max(15).default(0).describe('Rotation in degrees, -15 to 15'),
  z: z.number().int().default(0).describe('Layer: higher sits on top'),
}).describe('Canvas layout only: where the tile sits. Tiles without it are placed automatically, flowing like the grid');

const base = {
  id,
  size: z.enum(SIZES).default('s').describe('s = 1x1, w = 2x1, t = 1x2, l = 2x2'),
  color: z.enum(COLORS).default('auto').describe('Tile background. "auto" is the plain card colour; pick a tint to colour one tile'),
  pos: TilePos.optional(),
};

export const LinkTile = z.object({
  ...base,
  type: z.literal('link'),
  url,
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional().describe('Preview image shown on wide/large tiles'),
}).describe('Any link, shown with its favicon and title');

export const SocialTile = z.object({
  ...base,
  type: z.literal('social'),
  platform: z.enum(PLATFORM_IDS),
  handle: z.string().min(1).describe('Username without @'),
  url: z.string().optional().describe('Override the profile URL'),
}).describe('A social profile with the platform icon');

export const TextTile = z.object({
  ...base,
  type: z.literal('text'),
  text: z.string().min(1).describe('Short note. **bold** and [links](https://...) are supported'),
  look: z.enum(TEXT_LOOKS).optional().describe('Desk layout: note = sticky note, stamp = round badge with the text running around it (keep it short)'),
});

export const HeadingTile = z.object({
  ...base,
  type: z.literal('heading'),
  text: z.string().min(1),
}).describe('Section title; always spans the full row');

export const ImageTile = z.object({
  ...base,
  type: z.literal('image'),
  src: url,
  alt: z.string().default(''),
  url: z.string().optional().describe('Optional link when the image is clicked'),
  caption: z.string().optional(),
});

export const VideoTile = z.object({
  ...base,
  type: z.literal('video'),
  url: url.describe('YouTube URL'),
  title: z.string().optional(),
  image: z.string().optional().describe('Custom thumbnail; defaults to the YouTube one'),
});

export const MusicTile = z.object({
  ...base,
  type: z.literal('music'),
  url: url.describe('Spotify track, album, playlist or artist URL'),
  title: z.string().optional().describe('Filled automatically from Spotify'),
  artist: z.string().optional(),
  image: z.string().optional().describe('Cover art, filled automatically from Spotify'),
});

export const GithubTile = z.object({
  ...base,
  type: z.literal('github'),
  repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/).describe('owner/name'),
  description: z.string().optional().describe('Filled automatically at build time'),
  stars: z.number().optional().describe('Filled automatically at build time'),
  language: z.string().optional(),
});

export const Tile = z.discriminatedUnion('type', [LinkTile, SocialTile, TextTile, HeadingTile, ImageTile, VideoTile, MusicTile, GithubTile]);

export const Background = z.object({
  style: z.enum(BACKGROUNDS).default('solid'),
  image: z.string().optional().describe('Background image when style is "image"'),
  dim: z.number().min(0).max(80).default(20).describe('Darken an image background, 0–80 (%)'),
  blur: z.number().min(0).max(24).default(0).describe('Blur an image background, 0–24 (px)'),
  grain: z.boolean().default(true).describe('Subtle film grain over the background'),
});

export const Theme = z.object({
  preset: z.enum(THEME_IDS).default('cream'),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().describe('Override the theme accent, e.g. "#e8a87c"'),
  font: z.enum(FONTS).default('editorial'),
  radius: z.enum(RADII).default('round'),
  style: z.enum(STYLES).default('cozy').describe('cozy = Desk: tiles as objects on a desk (polaroids, sticky notes, records); minimal = paper and ink, photos printed as 1-bit dither that turn to colour on hover; washi = a Japanese print (paper, ink, kanji numerals, red seal); lofi = a desktop left open (tiles as little app windows with pinstriped title bars, clay clouds by day, painted anime rooms at night)'),
  layout: z.enum(LAYOUTS).default('bento').describe('bento = grid of tiles; list = Linktree-style stacked links; canvas = free placement, each tile at its own `pos` (x, y, w, h in a 1200-wide space, rotation r, layer z)'),
  align: z.enum(ALIGNS).default('side').describe('minimal style + bento only: profile beside the grid (side) or above it (center)'),
  background: Background.default(Background.parse({})),
  tileStyle: z.enum(TILE_STYLES).default('soft'),
  effect: z.enum(EFFECTS).default('lift').describe('Hover effect on tiles'),
  avatar: z.enum(AVATARS).default('squircle'),
  photos: z.enum(PHOTO_LOOKS).optional().describe('How photos are printed: natural colour, mono (black and white) or dither (1-bit pixels, colour on hover). Unset = the style\'s own default (Minimal dithers)'),
  motion: z.boolean().default(true),
});

/** v1 pages used layout "split" | "stack"; map them onto layout + align. */
function migrateTheme(input: unknown) {
  if (!input || typeof input !== 'object') return input;
  const t = { ...(input as Record<string, unknown>) };
  if (t.layout === 'split') { t.layout = 'bento'; t.align = t.align ?? 'side'; }
  if (t.layout === 'stack') { t.layout = 'bento'; t.align = t.align ?? 'center'; }
  // Before styles existed, "desk" was a layout. Pages saved without a style keep the look they had.
  if (t.layout === 'desk') { t.layout = 'bento'; t.style = t.style ?? 'cozy'; }
  if (t.style === undefined && t.layout !== undefined) t.style = 'minimal';
  if (typeof t.style === 'string' && RETIRED_STYLES[t.style]) t.style = RETIRED_STYLES[t.style];
  // Blended backgrounds were retired: pages keep their colour, as a single solid one.
  const bg = t.background as Record<string, unknown> | undefined;
  if (bg && ['gradient', 'mesh', 'aurora'].includes(String(bg.style))) t.background = { ...bg, style: 'solid' };
  return t;
}

export const Page = z.object({
  $schema: z.string().optional(),
  version: z.union([z.literal(1), z.literal(2)]).default(2).transform(() => 2 as const),
  profile: z.object({
    name: z.string().min(1),
    bio: z.string().default(''),
    avatar: z.string().optional().describe('Image URL or /path in public/'),
    location: z.string().optional(),
  }),
  theme: z.preprocess(migrateTheme, Theme).default(Theme.parse({})),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    url: z.string().optional().describe('Public URL of the page, used for share links and the QR code'),
  }).default({}),
  tiles: z.array(Tile).default([]),
  badge: z.boolean().default(true).describe('Show a small "Made with Posy" link in the footer'),
});

export type Page = z.infer<typeof Page>;
export type ThemeSettings = z.infer<typeof Theme>;
export type BackgroundSettings = z.infer<typeof Background>;
export type Tile = z.infer<typeof Tile>;
export type TileType = Tile['type'];
export type Size = (typeof SIZES)[number];
export type Color = (typeof COLORS)[number];
export type TilePos = z.infer<typeof TilePos>;
export type Layout = (typeof LAYOUTS)[number];

export function parsePage(data: unknown): Page {
  return Page.parse(data);
}

export function newId(): string {
  return 't-' + Math.random().toString(36).slice(2, 9);
}
