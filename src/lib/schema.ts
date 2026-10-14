import { z } from 'zod';
import { PLATFORM_IDS } from './platforms';
import { THEME_IDS, TINTS } from './themes';

/** Tile footprint on the grid: small square, wide, tall, large square. */
export const SIZES = ['s', 'w', 't', 'l'] as const;
export const FONTS = ['soft', 'editorial', 'classic', 'elegant', 'rounded', 'playful', 'modern', 'tech', 'mono', 'hand'] as const;
export const RADII = ['sharp', 'soft', 'round', 'pill'] as const;
export const LAYOUTS = ['bento', 'list'] as const;
export const ALIGNS = ['side', 'center'] as const;
export const BACKGROUNDS = ['solid', 'gradient', 'mesh', 'aurora', 'dots', 'grid', 'image'] as const;
export const TILE_STYLES = ['soft', 'glass', 'outline', 'solid'] as const;
export const EFFECTS = ['lift', 'tilt', 'glow', 'none'] as const;
export const AVATARS = ['squircle', 'circle', 'square', 'hidden'] as const;
export const COLORS = ['auto', 'surface', 'accent', ...TINTS] as const;

const id = z.string().min(1).describe('Stable unique id, e.g. "t-abc123"');
const url = z.string().min(1).describe('Absolute URL (https://...) or a path inside /public');
const base = {
  id,
  size: z.enum(SIZES).default('s').describe('s = 1x1, w = 2x1, t = 1x2, l = 2x2'),
  color: z.enum(COLORS).default('auto').describe('Tile background. "auto" picks a pastel from the theme'),
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
});

export const MusicTile = z.object({
  ...base,
  type: z.literal('music'),
  url: url.describe('Spotify track, album, playlist or artist URL'),
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
  font: z.enum(FONTS).default('soft'),
  radius: z.enum(RADII).default('round'),
  layout: z.enum(LAYOUTS).default('bento').describe('bento = tile grid; list = Linktree-style stacked links'),
  align: z.enum(ALIGNS).default('side').describe('bento only: profile beside the grid (side) or above it (center)'),
  background: Background.default(Background.parse({})),
  tileStyle: z.enum(TILE_STYLES).default('soft'),
  effect: z.enum(EFFECTS).default('lift').describe('Hover effect on tiles'),
  avatar: z.enum(AVATARS).default('squircle'),
  motion: z.boolean().default(true),
});

/** v1 pages used layout "split" | "stack"; map them onto layout + align. */
function migrateTheme(input: unknown) {
  if (!input || typeof input !== 'object') return input;
  const t = { ...(input as Record<string, unknown>) };
  if (t.layout === 'split') { t.layout = 'bento'; t.align = t.align ?? 'side'; }
  if (t.layout === 'stack') { t.layout = 'bento'; t.align = t.align ?? 'center'; }
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

export function parsePage(data: unknown): Page {
  return Page.parse(data);
}

export function newId(): string {
  return 't-' + Math.random().toString(36).slice(2, 9);
}
