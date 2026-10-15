export const initials = (name: string) =>
  name.trim().split(/\s+/).map(w => [...w][0] ?? '').slice(0, 2).join('').toUpperCase() || 'P';

/** True when dark text reads better than white on this colour. */
export function isLight(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.36;
}

/** Cut text to n characters on a word boundary, with an ellipsis. */
export const clip = (s: string, n: number) => {
  const flat = s.replace(/\s+/g, ' ').trim();
  if (flat.length <= n) return flat;
  const cut = flat.slice(0, n);
  const at = cut.lastIndexOf(' ');
  return cut.slice(0, at >= n * 0.5 ? at : n).replace(/[\s,.;:–-]+$/, '') + '…';
};

/** Strip **bold** and [text](url) markup from tile and bio text. */
export const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

/** Blend hex colour a over b by k (0..1). */
export function mix(a: string, b: string, k: number) {
  const p = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, i) => Math.round(v * k + y[i] * (1 - k)).toString(16).padStart(2, '0')).join('');
}

/** A hex colour with alpha, as rgba(). */
export function alpha(hex: string, a: number) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${a})`;
}

/** A shell-friendly folder name from a display name: "Mira Sol" → "mira-sol". */
export const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'me';

/** Largest of `sizes` whose width estimate fits: `perChar` is the average glyph width as a share of the size. */
export function fitSize(text: string, sizes: number[], box: number, perChar: number) {
  const len = [...text].length;
  return sizes.find(s => len * s * perChar <= box) ?? sizes[sizes.length - 1];
}

/** Which tiles best show a person's page in a few slots: pictures first, then richer tiles, headings never. */
const RANK: Record<string, number> = { image: 6, music: 5, video: 5, link: 4, github: 4, text: 3, social: 0, heading: -1 };
export function pickTiles<T extends { type: string; size?: string }>(tiles: T[], n: number, rank: (t: T) => number = t => RANK[t.type] ?? 1): T[] {
  return tiles
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t.type !== 'heading' && t.type !== 'social')
    .sort((a, b) => rank(b.t) - rank(a.t) || a.i - b.i)
    .slice(0, n)
    .sort((a, b) => a.i - b.i)
    .map(x => x.t);
}

/** The favicon's character for each style. */
export const FAVICON_STYLES = ['cozy', 'soft', 'editorial', 'neon'] as const;
/** Which favicon drawing each page style uses. */
const FAVICON_OF: Record<string, (typeof FAVICON_STYLES)[number]> = { cozy: 'cozy', minimal: 'soft', washi: 'editorial', lofi: 'soft' };
export const faviconKind = (style: unknown): (typeof FAVICON_STYLES)[number] => FAVICON_OF[String(style)] ?? 'cozy';

/** Drop symbols and emoji the share-image fonts have no glyph for (they would draw as empty boxes). */
export const safe = (s: string) =>
  s.replace(/[^\u0020-\u024F\u2010-\u2027\u2030-\u203A\u20AC]/gu, '').replace(/\s{2,}/g, ' ').trim();

/** A tiny deterministic pattern from a string, so each person gets their own block of "ASCII". */
export function blockPattern(seed: string, cols: number, rows: number): number[][] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619) >>> 0;
  const next = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296);
  const half = Math.ceil(cols / 2);
  return Array.from({ length: rows }, () => {
    const left = Array.from({ length: half }, () => { const v = next(); return v < 0.34 ? 0 : v < 0.55 ? 1 : v < 0.8 ? 2 : 3; });
    return [...left, ...[...left].reverse().slice(cols % 2)]; // mirrored: reads as a little glyph
  });
}

const GLOW: Record<string, string> = { peach: '#ff8a3d', butter: '#f4ff52', mint: '#3dffb5', sky: '#2be4ff', lilac: '#b26bff', rose: '#ff3ea5' };
export const CYAN = '#2be4ff';

/** Glow colour for a tile, as on the page: its chosen colour, or a cycle that starts at the accent. */
export function glowFor(accent: string, color: string | undefined, i: number) {
  if (color === 'accent' || color === 'surface') return accent;
  if (color && GLOW[color]) return GLOW[color];
  return [accent, CYAN, '#b26bff', '#3dffb5'][i % 4];
}
