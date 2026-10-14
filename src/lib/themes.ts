import { EDITION_THEMES } from '@/edition/themes';
import { PREMIUM } from '@/edition/premium';

/** Pastel tints available to every tile. Each theme maps them to its own shades. */
export const TINTS = ['peach', 'butter', 'mint', 'sky', 'lilac', 'rose'] as const;
export type Tint = (typeof TINTS)[number];

export type Theme = {
  id: string;
  name: string;
  dark: boolean;
  bg: string;        // page background
  surface: string;   // neutral card
  text: string;
  muted: string;
  line: string;      // hairline borders
  accent: string;
  tints: Record<Tint, string>;
};

const light = (t: Omit<Theme, 'dark'>): Theme => ({ ...t, dark: false });

const BASE = {
  cream: light({
    id: 'cream', name: 'Cream', bg: '#f6f1e9', surface: '#fffcf7', text: '#2b2621', muted: '#8c8277', line: '#e9e1d5', accent: '#e39b6f',
    tints: { peach: '#fbe2d2', butter: '#f9eec5', mint: '#dcefe2', sky: '#d9e9f6', lilac: '#e7e0f4', rose: '#f8dbe3' },
  }),
  lavender: light({
    id: 'lavender', name: 'Lavender', bg: '#f1eef9', surface: '#fcfbff', text: '#27233a', muted: '#857f9c', line: '#e3def2', accent: '#9a86d8',
    tints: { peach: '#f7e1dc', butter: '#f4eed2', mint: '#dcefe9', sky: '#dbe6f8', lilac: '#e4dcf7', rose: '#f3dbec' },
  }),
  mint: light({
    id: 'mint', name: 'Mint', bg: '#ecf5ef', surface: '#fbfefc', text: '#1f2b25', muted: '#77897f', line: '#d9e9df', accent: '#5fb08a',
    tints: { peach: '#f6e3d6', butter: '#f1efcc', mint: '#d3eedd', sky: '#d5ebf0', lilac: '#e2e1f2', rose: '#f3dde1' },
  }),
  sky: light({
    id: 'sky', name: 'Sky', bg: '#edf3fa', surface: '#fbfdff', text: '#1e2733', muted: '#7a8798', line: '#dbe5f1', accent: '#5e9bd6',
    tints: { peach: '#f7e3da', butter: '#f3efd2', mint: '#d9efe6', sky: '#d4e6f7', lilac: '#e1e0f6', rose: '#f4dde6' },
  }),
  peach: light({
    id: 'peach', name: 'Peach', bg: '#fbefe8', surface: '#fffbf8', text: '#2e2420', muted: '#94817a', line: '#f1ded4', accent: '#e8886a',
    tints: { peach: '#fbd9c9', butter: '#f9ebc6', mint: '#ddeedf', sky: '#dce8f3', lilac: '#ebdff2', rose: '#f9d6df' },
  }),
  paper: light({
    id: 'paper', name: 'Paper', bg: '#f4f4f2', surface: '#ffffff', text: '#161616', muted: '#7b7b78', line: '#e4e4e1', accent: '#161616',
    tints: { peach: '#f3ece7', butter: '#f2f0e6', mint: '#e8efea', sky: '#e7ecf1', lilac: '#ecebf1', rose: '#f2e9ec' },
  }),
  blush: light({
    id: 'blush', name: 'Blush', bg: '#fbeef1', surface: '#fffafb', text: '#2f2226', muted: '#977f86', line: '#f2dde3', accent: '#df7f9c',
    tints: { peach: '#fbe0d6', butter: '#f8edcf', mint: '#e0efe4', sky: '#dde8f5', lilac: '#ebdff4', rose: '#f9d3de' },
  }),
  sage: light({
    id: 'sage', name: 'Sage', bg: '#eef1ea', surface: '#fbfcf8', text: '#232820', muted: '#7d8576', line: '#dfe5d8', accent: '#7c9a6d',
    tints: { peach: '#f2e4d8', butter: '#efecd0', mint: '#d9e8d3', sky: '#d9e6e8', lilac: '#e3e1ec', rose: '#f0e0e0' },
  }),
  midnight: {
    id: 'midnight', name: 'Midnight', dark: true, bg: '#11131b', surface: '#1a1d28', text: '#eceef5', muted: '#8d93a8', line: '#262a38', accent: '#a9b8ff',
    tints: { peach: '#2c2226', butter: '#2b2a22', mint: '#1d2a27', sky: '#1c2536', lilac: '#252239', rose: '#2d2030' },
  },
  mocha: {
    id: 'mocha', name: 'Mocha', dark: true, bg: '#171311', surface: '#221d1a', text: '#f2ebe4', muted: '#a0948a', line: '#2f2824', accent: '#e7b48f',
    tints: { peach: '#33241d', butter: '#2f2a1d', mint: '#1f2a22', sky: '#1e2630', lilac: '#2a2231', rose: '#33212a' },
  },
  dusk: {
    id: 'dusk', name: 'Dusk', dark: true, bg: '#17131f', surface: '#211b2c', text: '#efe9f7', muted: '#9a90ab', line: '#2e2639', accent: '#d7a6f2',
    tints: { peach: '#33232a', butter: '#2f2a25', mint: '#1f2a28', sky: '#1f2537', lilac: '#2c2240', rose: '#352135' },
  },
  linen: light({
    id: 'linen', name: 'Linen', bg: '#ebe3d3', surface: '#faf6ec', text: '#2e2a22', muted: '#5f5748', line: '#d9cfba', accent: '#a9794a',
    tints: { peach: '#f4d9bf', butter: '#f3e6b4', mint: '#d6e4c8', sky: '#cfe0e6', lilac: '#ddd5e6', rose: '#f0d3d0' },
  }),
  matcha: light({
    id: 'matcha', name: 'Matcha', bg: '#dfe6d6', surface: '#f5f8ef', text: '#232b21', muted: '#4f5d4b', line: '#c9d4bd', accent: '#5a7d4a',
    tints: { peach: '#f2dccb', butter: '#eeeab9', mint: '#c9e4c8', sky: '#cde3e3', lilac: '#dcd8ea', rose: '#efd4d6' },
  }),
  rosewater: light({
    id: 'rosewater', name: 'Rosewater', bg: '#f2dcdd', surface: '#fdf4f3', text: '#35222a', muted: '#6b4d56', line: '#e6c8cb', accent: '#b8456a',
    tints: { peach: '#f9d9c8', butter: '#f6e8c0', mint: '#d9ebdc', sky: '#d6e3f1', lilac: '#e4d8f0', rose: '#f6c9d4' },
  }),
  'night-garden': {
    id: 'night-garden', name: 'Night Garden', dark: true, bg: '#0f1a15', surface: '#18261f', text: '#e8f0e9', muted: '#aabdb0', line: '#27382f', accent: '#8fd3a4',
    tints: { peach: '#4a3a31', butter: '#464030', mint: '#2f4b3c', sky: '#2f4553', lilac: '#403a56', rose: '#4c3640' },
  },
  phosphor: {
    id: 'phosphor', name: 'Phosphor', dark: true, bg: '#070b08', surface: '#0d140f', text: '#c9f7cf', muted: '#6f9a76', line: '#1d2b20', accent: '#3dff8b',
    tints: { peach: '#1d1a12', butter: '#1c1f10', mint: '#10241a', sky: '#0f1f22', lilac: '#17172a', rose: '#22131a' },
  },
  amber: {
    id: 'amber', name: 'Amber', dark: true, bg: '#0d0904', surface: '#16100a', text: '#ffd79a', muted: '#a37f4f', line: '#2a1e10', accent: '#ffb000',
    tints: { peach: '#2a170c', butter: '#2a2109', mint: '#13200f', sky: '#121b20', lilac: '#1c1524', rose: '#2a1216' },
  },
  synth: {
    id: 'synth', name: 'Synth', dark: true, bg: '#08061a', surface: '#110d2a', text: '#f3eeff', muted: '#948bc4', line: '#241d4a', accent: '#ff3ea5',
    tints: { peach: '#2a1426', butter: '#25221a', mint: '#0f2a2a', sky: '#0e1f38', lilac: '#20164a', rose: '#2e0f2c' },
  },
  ocean: {
    id: 'ocean', name: 'Ocean', dark: true, bg: '#0d171d', surface: '#14212a', text: '#e6f1f5', muted: '#86a0ab', line: '#1e2f39', accent: '#7fd1c7',
    tints: { peach: '#2b2523', butter: '#26281f', mint: '#16302c', sky: '#172b3a', lilac: '#202538', rose: '#2b2129' },
  },
} satisfies Record<string, Theme>;

/** Built-in themes plus any the edition adds. */
export const THEMES: Record<string, Theme> = { ...BASE, ...EDITION_THEMES };
export type ThemeId = string;
export const THEME_IDS = Object.keys(THEMES) as [string, ...string[]];
/** Themes that need the premium entitlement (only exist in editions that add them). */
export const PREMIUM_THEMES = new Set([...PREMIUM.themes, ...Object.keys(EDITION_THEMES)]);

/** CSS custom properties for a theme (+ optional accent override). */
export function themeVars(id: ThemeId, accent?: string): Record<string, string> {
  const t = THEMES[id] ?? THEMES.cream;
  const vars: Record<string, string> = {
    '--bg': t.bg, '--surface': t.surface, '--text': t.text, '--muted': t.muted, '--line': t.line,
    '--accent': accent || t.accent,
  };
  for (const k of TINTS) vars[`--tint-${k}`] = t.tints[k];
  return vars;
}
