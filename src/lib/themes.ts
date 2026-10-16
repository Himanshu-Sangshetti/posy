import { EDITION_THEMES } from '@/edition/themes';
import { PREMIUM } from '@/edition/premium';

/** Tints a tile can be given. Each theme maps them to its own shades. */
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

/** Quiet tints for palettes that don't need their own: tiles only use them when someone picks a colour. */
const LIGHT_TINTS = { peach: '#f4ddcc', butter: '#f2e6c0', mint: '#dbe9da', sky: '#d9e5ef', lilac: '#e3def0', rose: '#f2dadb' };
const DARK_TINTS = { peach: '#33261f', butter: '#2f2b1e', mint: '#1f2b24', sky: '#1d2633', lilac: '#262337', rose: '#33222a' };
const dark = (t: Omit<Theme, 'dark' | 'tints'>): Theme => ({ ...t, dark: true, tints: DARK_TINTS });
const plain = (t: Omit<Theme, 'dark' | 'tints'>): Theme => ({ ...t, dark: false, tints: LIGHT_TINTS });

/** Palettes made for the looks: one solid colour each, an ink and one accent. */
const LOOKS = {
  // Desk
  oak: plain({ id: 'oak', name: 'Oak', bg: '#e8dccb', surface: '#f7f1e6', text: '#2b241d', muted: '#6b5d4f', line: '#d8cab5', accent: '#a5683f' }),
  slate: dark({ id: 'slate', name: 'Slate', bg: '#1f2124', surface: '#2a2d31', text: '#ece8e1', muted: '#9c978e', line: '#35383d', accent: '#e0a96d' }),
  // Minimal
  white: plain({ id: 'white', name: 'White', bg: '#ffffff', surface: '#ffffff', text: '#111111', muted: '#6b6b6b', line: '#e9e9e9', accent: '#e4572e' }),
  stone: plain({ id: 'stone', name: 'Stone', bg: '#e7e5e0', surface: '#f3f2ee', text: '#1c1b19', muted: '#66625a', line: '#d6d3cc', accent: '#1c1b19' }),
  ink: dark({ id: 'ink', name: 'Ink', bg: '#111111', surface: '#1a1a1a', text: '#f2f0eb', muted: '#8f8c85', line: '#272727', accent: '#f2f0eb' }),
  // Washi
  kinari: plain({ id: 'kinari', name: 'Kinari', bg: '#f1ebdf', surface: '#f8f4ec', text: '#1e1b17', muted: '#6e6558', line: '#ded4c3', accent: '#c8402b' }),
  sakura: plain({ id: 'sakura', name: 'Sakura', bg: '#f4e7e4', surface: '#faf3f1', text: '#2a1d1c', muted: '#77605d', line: '#e8d3cf', accent: '#c23a4b' }),
  yomogi: plain({ id: 'yomogi', name: 'Yomogi', bg: '#e3e6d8', surface: '#f1f2ea', text: '#1f241c', muted: '#5d6556', line: '#cdd3c0', accent: '#b5432e' }),
  sumi: dark({ id: 'sumi', name: 'Sumi', bg: '#1a1917', surface: '#22211e', text: '#ece6da', muted: '#9a9384', line: '#33312c', accent: '#d4533b' }),
  // Lofi
  daydream: plain({ id: 'daydream', name: 'Daydream', bg: '#eeeefb', surface: '#ffffff', text: '#121212', muted: '#5b5b70', line: '#121212', accent: '#ff3d9a' }),
  'night-blue': dark({ id: 'night-blue', name: 'Night', bg: '#121a33', surface: '#18213f', text: '#e8ebff', muted: '#8d95c2', line: '#26305a', accent: '#8f7cff' }),
  violet: dark({ id: 'violet', name: 'Violet hour', bg: '#170f2b', surface: '#1f1638', text: '#f1eaff', muted: '#9d8fc4', line: '#2e2350', accent: '#c77dff' }),
  rain: dark({ id: 'rain', name: 'Rain', bg: '#0f1a1f', surface: '#15232a', text: '#e3f1f3', muted: '#85a3a8', line: '#213740', accent: '#5fd4d0' }),
  // Press
  newsprint: plain({ id: 'newsprint', name: 'Newsprint', bg: '#ece6d8', surface: '#f4efe3', text: '#151412', muted: '#5f5a50', line: '#151412', accent: '#c4301c' }),
  salmon: plain({ id: 'salmon', name: 'Salmon', bg: '#fbe9dc', surface: '#fff3ea', text: '#1d1714', muted: '#6b5a50', line: '#1d1714', accent: '#0d5e8a' }),
  ivory: plain({ id: 'ivory', name: 'Ivory', bg: '#f7f4ec', surface: '#fffdf7', text: '#111111', muted: '#5d5b55', line: '#111111', accent: '#111111' }),
  'late-edition': dark({ id: 'late-edition', name: 'Late edition', bg: '#161513', surface: '#1e1c19', text: '#eee7d8', muted: '#a39a89', line: '#eee7d8', accent: '#ff6a4d' }),
  // Gallery
  'white-cube': plain({ id: 'white-cube', name: 'White cube', bg: '#f3f2ef', surface: '#ffffff', text: '#1b1b1a', muted: '#6f6d68', line: '#dedcd6', accent: '#d2232a' }),
  'gallery-sage': plain({ id: 'gallery-sage', name: 'Sage wall', bg: '#c9cfbf', surface: '#f6f5ef', text: '#1e231c', muted: '#4f5848', line: '#b2b9a6', accent: '#b1352b' }),
  oxblood: dark({ id: 'oxblood', name: 'Oxblood', bg: '#4a1d1f', surface: '#f3ece1', text: '#f4e9dc', muted: '#cfae9f', line: '#6a3234', accent: '#e0b25c' }),
  'dark-room': dark({ id: 'dark-room', name: 'Dark room', bg: '#141414', surface: '#f1efe9', text: '#ecebe7', muted: '#97958f', line: '#2a2a2a', accent: '#e3463b' }),
  // Painted
  morning: plain({ id: 'morning', name: 'Morning', bg: '#dbe9f3', surface: '#fbf7ef', text: '#26313a', muted: '#5f6b74', line: '#e7dfd0', accent: '#d9553a' }),
  'golden-hour': plain({ id: 'golden-hour', name: 'Golden hour', bg: '#f6dfc4', surface: '#fdf7ee', text: '#3a2a20', muted: '#7a6152', line: '#ecdcc7', accent: '#c8572f' }),
  'dusk-sky': plain({ id: 'dusk-sky', name: 'Dusk', bg: '#e6d6e6', surface: '#fcf6f3', text: '#2e2534', muted: '#6d5f73', line: '#e8dbe2', accent: '#b8456a' }),
  starry: dark({ id: 'starry', name: 'Starry', bg: '#14203b', surface: '#f6f0e4', text: '#eef0f8', muted: '#a7b0c9', line: '#2a3858', accent: '#f2c46b' }),
  // Cobalt: two inks on cream (the night palette prints cream on cobalt)
  cobalt: plain({ id: 'cobalt', name: 'Cobalt', bg: '#ece2cb', surface: '#f6eedb', text: '#1a2d8f', muted: '#4c5ca0', line: '#1a2d8f', accent: '#2442c4' }),
  vermilion: plain({ id: 'vermilion', name: 'Vermilion', bg: '#efe4cf', surface: '#f8efde', text: '#2b1d18', muted: '#73584d', line: '#b8321f', accent: '#cf3b25' }),
  moonlit: dark({ id: 'moonlit', name: 'Moonlit', bg: '#0f1d57', surface: '#172a75', text: '#f1e5c9', muted: '#aab3dc', line: '#f1e5c9', accent: '#f3d58c' }),
  verdigris: plain({ id: 'verdigris', name: 'Verdigris', bg: '#e7e2cf', surface: '#f2eddd', text: '#17463f', muted: '#4f6e67', line: '#17463f', accent: '#2c7a69' }),
  // Night: a HUD after dark, in one signal colour (the older neon palettes below still render)
  netrunner: dark({ id: 'netrunner', name: 'Netrunner', bg: '#0b0b08', surface: '#121210', text: '#ecead6', muted: '#8f8b6c', line: '#34321a', accent: '#f3e600' }),
  ice: dark({ id: 'ice', name: 'Ice', bg: '#03080e', surface: '#08131d', text: '#dcf7ff', muted: '#6a8fa0', line: '#123444', accent: '#45efff' }),
  redline: dark({ id: 'redline', name: 'Redline', bg: '#0c0505', surface: '#150a0a', text: '#ffe8e2', muted: '#a37871', line: '#401714', accent: '#ff3b2f' }),
  daylight: plain({ id: 'daylight', name: 'Daylight', bg: '#f2e400', surface: '#f7ec42', text: '#0b0b08', muted: '#4b4614', line: '#0b0b08', accent: '#0b0b08' }),
  // Night
  neon: dark({ id: 'neon', name: 'Neon', bg: '#0c0915', surface: '#140f22', text: '#f6eefe', muted: '#a596bd', line: '#2a2140', accent: '#ff4fa3' }),
  'cyan-rain': dark({ id: 'cyan-rain', name: 'Cyan rain', bg: '#061217', surface: '#0b1c23', text: '#e6fbff', muted: '#83a9b3', line: '#173540', accent: '#3fe3ff' }),
  sodium: dark({ id: 'sodium', name: 'Sodium', bg: '#140d07', surface: '#1e140b', text: '#fff1de', muted: '#b59a7a', line: '#3a2814', accent: '#ffad3b' }),
  ultraviolet: dark({ id: 'ultraviolet', name: 'Ultraviolet', bg: '#0e0820', surface: '#171030', text: '#f1ebff', muted: '#9f92c8', line: '#2c2152', accent: '#a879ff' }),
  sunset: dark({ id: 'sunset', name: 'Last train', bg: '#1f1426', surface: '#281b31', text: '#ffe9e4', muted: '#b391a0', line: '#3a2840', accent: '#ff8a7a' }),
} satisfies Record<string, Theme>;

const BASE = {
  cream: light({
    id: 'cream', name: 'Cream', bg: '#f6f1e9', surface: '#fffcf7', text: '#2b2621', muted: '#6a6056', line: '#e9e1d5', accent: '#bc774c',
    tints: { peach: '#fee1d0', butter: '#f9eec0', mint: '#d6f1e0', sky: '#d2ebfd', lilac: '#e6dffa', rose: '#fadae3' },
  }),
  lavender: light({
    id: 'lavender', name: 'Lavender', bg: '#f1eef9', surface: '#fcfbff', text: '#27233a', muted: '#635d79', line: '#e3def2', accent: '#8f7bcc',
    tints: { peach: '#fddfd5', butter: '#f5eecf', mint: '#d4f2e5', sky: '#d4e8fd', lilac: '#e3dcfa', rose: '#f7d9e9' },
  }),
  mint: light({
    id: 'mint', name: 'Mint', bg: '#ecf5ef', surface: '#fbfefc', text: '#1f2b25', muted: '#54655b', line: '#d9e9df', accent: '#479873',
    tints: { peach: '#fbe1d1', butter: '#f3efc7', mint: '#d0efdc', sky: '#ceecf8', lilac: '#e2e0fa', rose: '#f9dae2' },
  }),
  sky: light({
    id: 'sky', name: 'Sky', bg: '#edf3fa', surface: '#fbfdff', text: '#1e2733', muted: '#576373', line: '#dbe5f1', accent: '#518dc7',
    tints: { peach: '#fde1d4', butter: '#f4efce', mint: '#d4f1e3', sky: '#cfe7fa', lilac: '#e2dffa', rose: '#f9dbe6' },
  }),
  peach: light({
    id: 'peach', name: 'Peach', bg: '#fbefe8', surface: '#fffbf8', text: '#2e2420', muted: '#6e5c55', line: '#f1ded4', accent: '#cd6f52',
    tints: { peach: '#fed8c5', butter: '#f8ecc1', mint: '#d7f0de', sky: '#d2eafd', lilac: '#e9dff8', rose: '#fbd5e0' },
  }),
  paper: light({
    id: 'paper', name: 'Paper', bg: '#f4f4f2', surface: '#ffffff', text: '#161616', muted: '#676764', line: '#e4e4e1', accent: '#161616',
    tints: { peach: '#fce9de', butter: '#f4f0dd', mint: '#e0f3e6', sky: '#ddeefc', lilac: '#ece9fc', rose: '#fbe5ec' },
  }),
  blush: light({
    id: 'blush', name: 'Blush', bg: '#fbeef1', surface: '#fffafb', text: '#2f2226', muted: '#6e585f', line: '#f2dde3', accent: '#c96c89',
    tints: { peach: '#fde0d3', butter: '#f8eecb', mint: '#d8f2e1', sky: '#d4eafe', lilac: '#e9dff9', rose: '#fcd2de' },
  }),
  sage: light({
    id: 'sage', name: 'Sage', bg: '#eef1ea', surface: '#fbfcf8', text: '#232820', muted: '#5d6456', line: '#dfe5d8', accent: '#739064',
    tints: { peach: '#fae1d0', butter: '#f0eccd', mint: '#d4ead5', sky: '#cae9f4', lilac: '#e3dff9', rose: '#fbdbe0' },
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
    id: 'linen', name: 'Linen', bg: '#ebe3d3', surface: '#faf6ec', text: '#2e2a22', muted: '#5f5748', line: '#d9cfba', accent: '#a57546',
    tints: { peach: '#f9d7bd', butter: '#f4e6ae', mint: '#cee7cb', sky: '#bfe3f4', lilac: '#ddd3f3', rose: '#f7cfd3' },
  }),
  matcha: light({
    id: 'matcha', name: 'Matcha', bg: '#dfe6d6', surface: '#f5f8ef', text: '#232b21', muted: '#4f5d4b', line: '#c9d4bd', accent: '#5a7d4a',
    tints: { peach: '#f9dac5', butter: '#f1e9b2', mint: '#c3e6ca', sky: '#bde6f0', lilac: '#dcd6f6', rose: '#f7d0d7' },
  }),
  rosewater: light({
    id: 'rosewater', name: 'Rosewater', bg: '#f2dcdd', surface: '#fdf4f3', text: '#35222a', muted: '#6b4d56', line: '#e6c8cb', accent: '#b8456a',
    tints: { peach: '#fcd8c5', butter: '#f6e9bb', mint: '#cfefd8', sky: '#c9e6fe', lilac: '#e2d7f7', rose: '#f9c7d5' },
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
export const THEMES: Record<string, Theme> = { ...BASE, ...LOOKS, ...EDITION_THEMES };
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
