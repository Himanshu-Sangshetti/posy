// Labels and defaults for the visual styles (safe to use in the browser).
import { PREMIUM } from '@/edition/premium';
import type { STYLES } from './schema';

export type StyleId = (typeof STYLES)[number];

/** What each style is, and the colours and fonts it starts with when you pick it. */
export const STYLE_INFO: Record<StyleId, { label: string; note: string; preset: string; font: string; layout: 'bento' | 'list' | 'canvas' }> = {
  cozy: { label: 'Desk', note: 'Polaroids and notes in the afternoon sun', preset: 'cream', font: 'editorial', layout: 'canvas' },
  painted: { label: 'Painted', note: 'Watercolour paper under a painted sky', preset: 'morning', font: 'painted', layout: 'bento' },
  washi: { label: 'Washi', note: 'Paper, ink and a red seal', preset: 'kinari', font: 'washi', layout: 'bento' },
  lofi: { label: 'Lofi', note: 'A desktop left open, windows you can drag', preset: 'daydream', font: 'lofi', layout: 'canvas' },
  night: { label: 'Night', note: 'A netrunner\'s HUD: scanned photos, cut-corner panels, one signal colour', preset: 'netrunner', font: 'night', layout: 'bento' },
  cobalt: { label: 'Cobalt', note: 'A vintage print in two inks, under a crescent moon', preset: 'cobalt', font: 'cobalt', layout: 'bento' },
  minimal: { label: 'Minimal', note: 'Big type, hairlines and nothing extra', preset: 'paper', font: 'editorial', layout: 'bento' },
};
/** The looks people (and agents) can pick, in the order they're shown. Minimal stays only as the plain fallback. */
export const STYLE_IDS: StyleId[] = ['cozy', 'washi', 'lofi', 'painted', 'cobalt', 'night'];
export const PREMIUM_STYLES = new Set(PREMIUM.styles);

/** The palettes offered for each style, first one is the default. Other palettes still render (older pages). */
export const STYLE_PALETTES: Record<StyleId, string[]> = {
  cozy: ['cream', 'oak', 'sage', 'slate'],
  minimal: ['paper', 'white', 'stone', 'ink'],
  washi: ['kinari', 'sakura', 'yomogi', 'sumi'],
  lofi: ['daydream', 'night-blue', 'violet', 'sunset'],
  painted: ['morning', 'golden-hour', 'dusk-sky', 'starry'],
  night: ['netrunner', 'ice', 'redline', 'daylight'],
  cobalt: ['cobalt', 'vermilion', 'moonlit', 'verdigris'],
};
