// Labels and defaults for the visual styles (safe to use in the browser).
import { PREMIUM } from '@/edition/premium';
import type { STYLES } from './schema';

export type StyleId = (typeof STYLES)[number];

/** What each style is, and the colours and fonts it starts with when you pick it. */
export const STYLE_INFO: Record<StyleId, { label: string; note: string; preset: string; font: string }> = {
  cozy: { label: 'Cozy', note: 'Polaroids, notes and records', preset: 'cream', font: 'editorial' },
  soft: { label: 'Soft', note: 'Pastel cards', preset: 'lavender', font: 'soft' },
  editorial: { label: 'Editorial', note: 'A small magazine', preset: 'paper', font: 'elegant' },
  terminal: { label: 'Terminal', note: 'ASCII and a blinking cursor', preset: 'phosphor', font: 'terminal' },
  neon: { label: 'Neon', note: 'A cyberpunk night', preset: 'synth', font: 'cyber' },
};
export const STYLE_IDS = Object.keys(STYLE_INFO) as StyleId[];
export const PREMIUM_STYLES = new Set(PREMIUM.styles);
