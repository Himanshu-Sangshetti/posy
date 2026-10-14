import { z } from 'zod';
import { PLATFORM_IDS } from './platforms';
import { THEME_IDS, TINTS } from './themes';

/** Tile footprint on the grid: small square, wide, tall, large square. */
export const SIZES = ['s', 'w', 't', 'l'] as const;
export const FONTS = ['soft', 'editorial', 'rounded', 'mono'] as const;
export const RADII = ['sharp', 'soft', 'round'] as const;
export const LAYOUTS = ['split', 'stack'] as const;
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

export const Page = z.object({
  $schema: z.string().optional(),
  version: z.literal(1).default(1),
  profile: z.object({
    name: z.string().min(1),
    bio: z.string().default(''),
    avatar: z.string().optional().describe('Image URL or /path in public/'),
    location: z.string().optional(),
  }),
  theme: z.object({
    preset: z.enum(THEME_IDS).default('cream'),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().describe('Override the theme accent, e.g. "#e8a87c"'),
    font: z.enum(FONTS).default('soft'),
    radius: z.enum(RADII).default('round'),
    layout: z.enum(LAYOUTS).default('split').describe('split = profile beside the grid on desktop; stack = centred'),
    motion: z.boolean().default(true),
  }).default({ preset: 'cream', font: 'soft', radius: 'round', layout: 'split', motion: true }),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    url: z.string().optional().describe('Public URL of the page, used for share links and the QR code'),
  }).default({}),
  tiles: z.array(Tile).default([]),
  badge: z.boolean().default(true).describe('Show a small "Made with Posy" link in the footer'),
});

export type Page = z.infer<typeof Page>;
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
