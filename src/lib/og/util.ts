export const initials = (name: string) =>
  name.trim().split(/\s+/).map(w => [...w][0] ?? '').slice(0, 2).join('').toUpperCase() || 'P';

/** True when dark text reads better than white on this colour. */
export function isLight(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.36;
}
