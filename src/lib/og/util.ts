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
  return (cut.slice(0, Math.max(cut.lastIndexOf(' '), n * 0.6)) || cut).replace(/[\s,.;:–-]+$/, '') + '…';
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
export const FAVICON_STYLES = ['cozy', 'soft', 'editorial', 'terminal', 'neon'] as const;
export const faviconKind = (style: unknown): (typeof FAVICON_STYLES)[number] =>
  (FAVICON_STYLES as readonly string[]).includes(String(style)) ? (style as (typeof FAVICON_STYLES)[number]) : 'cozy';

/** Drop symbols and emoji the share-image fonts have no glyph for (they would draw as empty boxes). */
export const safe = (s: string) =>
  s.replace(/[^\u0020-\u024F\u2010-\u2027\u2030-\u203A\u20AC]/gu, '').replace(/\s{2,}/g, ' ').trim();
