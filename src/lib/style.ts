import { THEMES, themeVars, TINTS, type ThemeId } from './themes';
import type { Page, Tile } from './schema';

export const FONT_VARS = {
  soft: { '--font-body': 'var(--font-geist)', '--font-head': 'var(--font-geist)', '--head-weight': '640', '--head-track': '-0.035em' },
  editorial: { '--font-body': 'var(--font-geist)', '--font-head': 'var(--font-serif)', '--head-weight': '400', '--head-track': '-0.01em' },
  rounded: { '--font-body': 'var(--font-nunito)', '--font-head': 'var(--font-nunito)', '--head-weight': '800', '--head-track': '-0.02em' },
  mono: { '--font-body': 'var(--font-geist)', '--font-head': 'var(--font-geist-mono)', '--head-weight': '500', '--head-track': '-0.04em' },
} as const;
export const RADIUS_PX = { sharp: 14, soft: 22, round: 30 } as const;

export function pageStyle(page: Page): React.CSSProperties {
  const t = page.theme;
  return {
    ...themeVars(t.preset as ThemeId, t.accent),
    ...FONT_VARS[t.font],
    '--radius-tile': `${RADIUS_PX[t.radius]}px`,
  } as unknown as React.CSSProperties;
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
