import { THEMES, themeVars, TINTS, type ThemeId } from './themes';
import { EDITION_FONT_PAIRS } from '@/edition/fonts';
import { PREMIUM } from '@/edition/premium';
import type { Page, Tile } from './schema';

const f = (body: string, head: string, weight: number | string, track: string, label: string) =>
  ({ '--font-body': `var(${body})`, '--font-head': `var(${head})`, '--head-weight': String(weight), '--head-track': track, label });
/** Ten curated pairs: heading + body. */
export const FONT_PAIRS = {
  soft: f('--font-dm-sans', '--font-fraunces', 520, '-0.025em', 'Soft'),
  editorial: f('--font-geist', '--font-serif', 400, '-0.01em', 'Editorial'),
  washi: f('--font-geist', '--font-cormorant', 600, '0.01em', 'Washi'),
  lofi: f('--font-geist', '--font-geist', 500, '0em', 'Lofi'),
  classic: f('--font-geist', '--font-fraunces', 560, '-0.03em', 'Classic'),
  elegant: f('--font-dm-sans', '--font-dm-serif', 400, '-0.015em', 'Elegant'),
  rounded: f('--font-nunito', '--font-nunito', 800, '-0.02em', 'Rounded'),
  playful: f('--font-geist', '--font-bricolage', 700, '-0.035em', 'Playful'),
  modern: f('--font-sora', '--font-sora', 620, '-0.04em', 'Modern'),
  tech: f('--font-space', '--font-space', 600, '-0.035em', 'Tech'),
  mono: f('--font-geist', '--font-geist-mono', 500, '-0.04em', 'Mono'),
  hand: f('--font-geist', '--font-caveat', 700, '-0.01em', 'Handwritten'),
  terminal: f('--font-plex-mono', '--font-vt323', 400, '0em', 'Terminal'),
  cyber: f('--font-geist', '--font-chakra', 700, '0.01em', 'Cyber'),
  storybook: f('--font-geist', '--font-young-serif', 400, '-0.01em', 'Storybook'),
  journal: f('--font-geist', '--font-cormorant', 600, '-0.015em', 'Journal'),
  stationery: f('--font-dm-sans', '--font-bodoni', 600, '-0.02em', 'Stationery'),
} as const;
type Pair = { '--font-body': string; '--font-head': string; '--head-weight': string; '--head-track': string; label: string };
/** Built-in pairs plus any the edition adds (premium). */
export const ALL_FONT_PAIRS: Record<string, Pair> = {
  ...FONT_PAIRS,
  ...Object.fromEntries(Object.entries(EDITION_FONT_PAIRS).map(([k, v]) => [k, f(v.body, v.head, v.weight, v.track, v.label)])),
};
export const PREMIUM_FONTS = new Set([...PREMIUM.fonts, ...Object.keys(EDITION_FONT_PAIRS)]);
export const FONT_VARS = Object.fromEntries(Object.entries(ALL_FONT_PAIRS).map(([k, { label: _l, ...v }]) => [k, v])) as Record<string, Record<string, string>>;
export const RADIUS_PX = { sharp: 12, soft: 20, round: 28, pill: 34 } as const;

export function pageStyle(page: Page): React.CSSProperties {
  const t = page.theme;
  const bg = t.background;
  return {
    ...themeVars(t.preset as ThemeId, t.accent),
    ...FONT_VARS[t.font],
    '--radius-tile': `${RADIUS_PX[t.radius]}px`,
    ...(bg.color ? { '--bg': bg.color } : {}),
    ...(bg.style === 'image' && bg.image ? { '--bg-image': `url("${bg.image.replace(/"/g, '%22')}")`, '--bg-dim': String(bg.dim / 100), '--bg-blur': `${bg.blur}px` } : {}),
  } as unknown as React.CSSProperties;
}

/** Root class names that switch layout, background, tile style, effect and avatar via CSS. */
export function pageClasses(page: Page): string {
  const t = page.theme;
  return [
    'posy-page',
    `posy-layout-${t.layout}`,
    `posy-style-${t.style}`,
    `posy-preset-${t.preset}`,
    t.style !== 'minimal' ? 'posy-top' : t.layout === 'bento' && t.align === 'center' ? 'posy-center' : t.layout === 'bento' ? 'posy-side' : 'posy-center',
    `posy-bg-${t.background.style}`,
    t.background.grain && 'posy-grain',
    `posy-tiles-${t.tileStyle}`,
    `posy-fx-${t.effect}`,
    `posy-avatar-${t.avatar}`,
    `posy-photos-${photoLook(page)}`,
    t.motion && 'posy-motion',
    isDark(page) && 'dark',
  ].filter(Boolean).join(' ');
}
/** How photos are printed: what the page chose, or its style's default. */
export const photoLook = (page: Page) => page.theme.photos ?? (page.theme.style === 'minimal' ? 'dither' : 'natural');
export const isDark = (page: Page) => THEMES[page.theme.preset as ThemeId]?.dark ?? false;

/** Background for a tile: the plain card colour, or the tint someone picked for it. */
export function tileBackground(tile: Tile, index: number, brandHex?: string): string {
  const c = tile.color;
  if (c === 'surface') return 'var(--surface)';
  if (c === 'accent') return 'color-mix(in oklab, var(--accent) 22%, var(--surface))';
  if (c !== 'auto') return `var(--tint-${c})`;
  // Auto tiles stay plain: colour only where someone chose it, so a page never turns into a patchwork.
  void index; void brandHex;
  return 'var(--surface)';
}


/** True when a brand colour is saturated enough to tint a tile (black/white brands are not). */
export function isColourful(hex: string) {
  const n = parseInt(hex, 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return max - min > 60;
}
