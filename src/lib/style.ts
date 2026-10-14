import { THEMES, themeVars, TINTS, type ThemeId } from './themes';
import type { Page, Tile } from './schema';

const f = (body: string, head: string, weight: number | string, track: string, label: string) =>
  ({ '--font-body': `var(${body})`, '--font-head': `var(${head})`, '--head-weight': String(weight), '--head-track': track, label });
/** Ten curated pairs: heading + body. */
export const FONT_PAIRS = {
  soft: f('--font-geist', '--font-geist', 640, '-0.035em', 'Soft'),
  editorial: f('--font-geist', '--font-serif', 400, '-0.01em', 'Editorial'),
  classic: f('--font-geist', '--font-fraunces', 560, '-0.03em', 'Classic'),
  elegant: f('--font-dm-sans', '--font-dm-serif', 400, '-0.015em', 'Elegant'),
  rounded: f('--font-nunito', '--font-nunito', 800, '-0.02em', 'Rounded'),
  playful: f('--font-geist', '--font-bricolage', 700, '-0.035em', 'Playful'),
  modern: f('--font-sora', '--font-sora', 620, '-0.04em', 'Modern'),
  tech: f('--font-space', '--font-space', 600, '-0.035em', 'Tech'),
  mono: f('--font-geist', '--font-geist-mono', 500, '-0.04em', 'Mono'),
  hand: f('--font-geist', '--font-caveat', 700, '-0.01em', 'Handwritten'),
} as const;
export const FONT_VARS = Object.fromEntries(Object.entries(FONT_PAIRS).map(([k, { label: _l, ...v }]) => [k, v])) as unknown as Record<keyof typeof FONT_PAIRS, Record<string, string>>;
export const RADIUS_PX = { sharp: 12, soft: 20, round: 28, pill: 34 } as const;

export function pageStyle(page: Page): React.CSSProperties {
  const t = page.theme;
  const bg = t.background;
  return {
    ...themeVars(t.preset as ThemeId, t.accent),
    ...FONT_VARS[t.font],
    '--radius-tile': `${RADIUS_PX[t.radius]}px`,
    ...(bg.style === 'image' && bg.image ? { '--bg-image': `url("${bg.image.replace(/"/g, '%22')}")`, '--bg-dim': String(bg.dim / 100), '--bg-blur': `${bg.blur}px` } : {}),
  } as unknown as React.CSSProperties;
}

/** Root class names that switch layout, background, tile style, effect and avatar via CSS. */
export function pageClasses(page: Page): string {
  const t = page.theme;
  return [
    'posy-page',
    `posy-layout-${t.layout}`,
    t.layout === 'bento' && t.align === 'center' ? 'posy-center' : t.layout === 'bento' ? 'posy-side' : 'posy-center',
    `posy-bg-${t.background.style}`,
    t.background.grain && 'posy-grain',
    `posy-tiles-${t.tileStyle}`,
    `posy-fx-${t.effect}`,
    `posy-avatar-${t.avatar}`,
    t.motion && 'posy-motion',
    isDark(page) && 'dark',
  ].filter(Boolean).join(' ');
}
export const isDark = (page: Page) => THEMES[page.theme.preset as ThemeId]?.dark ?? false;

/** Background for a tile. "auto" cycles pastel tints; social tiles get a whisper of their brand colour. */
export function tileBackground(tile: Tile, index: number, brandHex?: string): string {
  const c = tile.color;
  if (c === 'surface') return 'var(--surface)';
  if (c === 'accent') return 'color-mix(in oklab, var(--accent) 22%, var(--surface))';
  if (c !== 'auto') return `var(--tint-${c})`;
  if (tile.type === 'social' && brandHex && isColourful(brandHex)) return `color-mix(in oklab, #${brandHex} 10%, var(--surface))`;
  if (tile.type === 'image' || tile.type === 'video' || tile.type === 'music') return 'var(--surface)';
  return `var(--tint-${TINTS[index % TINTS.length]})`;
}

/** True when a brand colour is saturated enough to tint a tile (black/white brands are not). */
export function isColourful(hex: string) {
  const n = parseInt(hex, 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return max - min > 60;
}
