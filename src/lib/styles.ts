// Labels and defaults for the visual styles (safe to use in the browser).
import { PREMIUM } from '@/edition/premium';
import type { STYLES } from './schema';

export type StyleId = (typeof STYLES)[number];

/** What each style is, and the colours and fonts it starts with when you pick it. */
export const STYLE_INFO: Record<StyleId, { label: string; note: string; preset: string; font: string }> = {
  cozy: { label: 'Desk', note: 'Polaroids, notes and a spinning record', preset: 'cream', font: 'editorial' },
  minimal: { label: 'Minimal', note: 'Quiet type, lots of room', preset: 'paper', font: 'editorial' },
  washi: { label: 'Washi', note: 'Paper, ink and a red seal', preset: 'kinari', font: 'washi' },
  lofi: { label: 'Lofi', note: 'A night-time anime still', preset: 'night-blue', font: 'lofi' },
};
export const STYLE_IDS = Object.keys(STYLE_INFO) as StyleId[];
export const PREMIUM_STYLES = new Set(PREMIUM.styles);

/** The palettes offered for each style, first one is the default. Other palettes still render (older pages). */
export const STYLE_PALETTES: Record<StyleId, string[]> = {
  cozy: ['cream', 'oak', 'sage', 'slate'],
  minimal: ['paper', 'white', 'stone', 'ink'],
  washi: ['kinari', 'sakura', 'yomogi', 'sumi'],
  lofi: ['night-blue', 'violet', 'rain', 'sunset'],
};
