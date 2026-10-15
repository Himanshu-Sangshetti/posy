// Canvas layout: tiles sit at free positions in a 1200-unit wide design space that the page scales to fit.
// Pure geometry only (no Zod values), so the public page, the studio and tests can all use it.
import type { Size, Tile, TilePos } from './schema';

export const CANVAS_WIDTH = 1200;
/** Auto-placement grid: 4 columns of 288 with 16 gaps fill the 1200 units exactly; every value is on the 8-unit grid. */
export const COLS = 4;
export const CELL = 288;
export const GAP = 16;
export const SNAP = 8;
export const MIN_W = 96;
export const MIN_H = 64;
export const HEADING_H = 64;
export const MAX_ROT = 15;

const SPAN: Record<Size, [number, number]> = { s: [1, 1], w: [2, 1], t: [1, 2], l: [2, 2] };
const span = (cells: number) => cells * CELL + (cells - 1) * GAP;

export type Box = { x: number; y: number; w: number; h: number };
export type Placed = { tile: Tile; pos: TilePos; index: number };

/** The box a grid size takes on the canvas. Headings span the full width. */
export function sizeBox(tile: Pick<Tile, 'type' | 'size'>): { w: number; h: number } {
  if (tile.type === 'heading') return { w: CANVAS_WIDTH, h: HEADING_H };
  const [c, r] = SPAN[tile.size] ?? SPAN.s;
  return { w: span(c), h: span(r) };
}

/** Keeps a position inside the design space (agents and old drafts can send anything). */
export function clampPos(p: Partial<TilePos> & Box): TilePos {
  const w = clamp(num(p.w, CELL), 24, CANVAS_WIDTH);
  const h = Math.max(24, num(p.h, CELL));
  return {
    x: clamp(num(p.x, 0), 0, CANVAS_WIDTH - w),
    y: Math.max(0, num(p.y, 0)),
    w, h,
    r: clamp(num(p.r, 0), -MAX_ROT, MAX_ROT),
    z: Math.round(num(p.z, 0)),
  };
}

/**
 * A position for every tile. Tiles that have one keep it; the rest flow like the bento grid
 * (4 columns, dense packing, a heading starts a new section) below any placed tiles,
 * so switching an existing page to canvas looks right straight away.
 * `loose` nudges each auto-placed tile off the grid so neighbours overlap a little, like windows left open on a desktop.
 */
export function placeTiles(tiles: Tile[], loose = false): Placed[] {
  const placed = tiles.filter(t => t.pos);
  let cursor = placed.length ? Math.max(...placed.map(t => t.pos!.y + t.pos!.h)) + GAP * 3 : 0;
  let rows: boolean[][] = [];
  let top = cursor;
  const closeSection = () => { if (rows.length) cursor = top + rows.length * (CELL + GAP); rows = []; };
  const out: Placed[] = [];
  tiles.forEach((tile, index) => {
    if (tile.pos) { out.push({ tile, index, pos: clampPos(tile.pos) }); return; }
    if (tile.type === 'heading') {
      closeSection();
      const y = cursor > 0 ? cursor + GAP * 2 : 0;
      out.push({ tile, index, pos: { x: 0, y, w: CANVAS_WIDTH, h: HEADING_H, r: 0, z: 0 } });
      cursor = top = y + HEADING_H + GAP;
      return;
    }
    if (!rows.length) top = cursor;
    const [c, r] = SPAN[tile.size] ?? SPAN.s;
    const { row, col } = findSlot(rows, c, r);
    for (let y = row; y < row + r; y++) {
      while (rows.length <= y) rows.push(Array(COLS).fill(false));
      for (let x = col; x < col + c; x++) rows[y][x] = true;
    }
    const pos = { x: col * (CELL + GAP), y: top + row * (CELL + GAP), w: span(c), h: span(r), r: 0, z: 0 };
    if (loose) {
      const h = hash(tile.id);
      pos.x = clamp(pos.x + ((h % 7) - 3) * 12, 0, CANVAS_WIDTH - pos.w);
      pos.y = Math.max(0, pos.y + (((h >> 3) % 5) - 1) * 14);
      pos.z = index;
    }
    out.push({ tile, index, pos });
  });
  return out;
}

/** First free slot scanning rows top to bottom (CSS grid-auto-flow: dense). */
function findSlot(rows: boolean[][], c: number, r: number) {
  for (let row = 0; ; row++) {
    for (let col = 0; col + c <= COLS; col++) {
      let free = true;
      for (let y = row; y < row + r && free; y++) for (let x = col; x < col + c && free; x++) if (rows[y]?.[x]) free = false;
      if (free) return { row, col };
    }
  }
}

/** Height of the design space the tiles need. */
export const canvasHeight = (placed: { pos: Box }[]) => placed.reduce((m, p) => Math.max(m, p.pos.y + p.pos.h), 0);

/** Top-to-bottom, left-to-right: the order screen readers and the stacked phone view use. */
export const readingOrder = <T extends { pos: Box }>(placed: T[]) =>
  [...placed].sort((a, b) => a.pos.y - b.pos.y || a.pos.x - b.pos.x);

/** Which grid size a free box looks most like, so each style can lay out the tile's content for its shape. */
export function boxSize(tile: Pick<Tile, 'type'>, b: { w: number; h: number }): Size {
  const big = 440;
  const ratio = b.w / b.h;
  let s: Size = b.w >= big && b.h >= big ? (ratio > 1.6 ? 'w' : ratio < 0.62 ? 't' : 'l') : ratio >= 1.4 && b.w >= big ? 'w' : ratio <= 0.7 && b.h >= big ? 't' : 's';
  if (tile.type === 'music' && s === 't') s = 's';
  return s;
}

// ---------- editing geometry ----------

export const snap = (v: number, step = SNAP) => Math.round(v / step) * step;

export type Guide = { axis: 'x' | 'y'; at: number };

/** Edges and centres of the other tiles, plus the canvas edges and centre line. */
export function snapTargets(others: Box[]) {
  const xs = [0, CANVAS_WIDTH / 2, CANVAS_WIDTH], ys: number[] = [0];
  for (const o of others) { xs.push(o.x, o.x + o.w / 2, o.x + o.w); ys.push(o.y, o.y + o.h / 2, o.y + o.h); }
  return { xs, ys };
}

/** Snaps one value: to the nearest target within `threshold`, otherwise to the 8-unit grid. */
export function snapValue(v: number, targets: number[], threshold: number): { v: number; guide?: number } {
  let best: number | undefined, dist = threshold + 1e-9;
  for (const t of targets) { const d = Math.abs(v - t); if (d <= dist) { dist = d; best = t; } }
  return best !== undefined ? { v: best, guide: best } : { v: snap(v) };
}

/** Snaps a moving box: any of its edges or centre can lock onto a neighbour's; otherwise the corner lands on the grid. */
export function snapMove(b: Box, others: Box[], threshold: number): { x: number; y: number; guides: Guide[] } {
  const { xs, ys } = snapTargets(others);
  const guides: Guide[] = [];
  const axis = (pos: number, size: number, targets: number[], name: 'x' | 'y') => {
    let best: { off: number; t: number; d: number } | null = null;
    for (const off of [0, size / 2, size]) for (const t of targets) {
      const d = Math.abs(pos + off - t);
      if (d <= threshold && (!best || d < best.d)) best = { off, t, d };
    }
    if (best) { guides.push({ axis: name, at: best.t }); return best.t - best.off; }
    return snap(pos);
  };
  const x = clamp(axis(b.x, b.w, xs, 'x'), 0, CANVAS_WIDTH - b.w);
  const y = Math.max(0, axis(b.y, b.h, ys, 'y'));
  return { x, y, guides };
}

export type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/** Resizes from a handle by (dx, dy) design units, snapping the moving edges and keeping a readable minimum size. */
export function resizeBox(start: Box, handle: Handle, dx: number, dy: number, others: Box[], threshold: number): { box: Box; guides: Guide[] } {
  const { xs, ys } = snapTargets(others);
  const guides: Guide[] = [];
  let l = start.x, r = start.x + start.w, t = start.y, b = start.y + start.h;
  const edge = (v: number, targets: number[], axis: 'x' | 'y') => { const s = snapValue(v, targets, threshold); if (s.guide !== undefined) guides.push({ axis, at: s.guide }); return s.v; };
  if (handle.includes('w')) l = Math.min(clamp(edge(l + dx, xs, 'x'), 0, CANVAS_WIDTH), r - MIN_W);
  if (handle.includes('e')) r = Math.max(clamp(edge(r + dx, xs, 'x'), 0, CANVAS_WIDTH), l + MIN_W);
  if (handle.includes('n')) t = Math.min(Math.max(0, edge(t + dy, ys, 'y')), b - MIN_H);
  if (handle.includes('s')) b = Math.max(edge(b + dy, ys, 'y'), t + MIN_H);
  if (r > CANVAS_WIDTH) { r = CANVAS_WIDTH; l = Math.min(l, r - MIN_W); }
  if (l < 0) { l = 0; r = Math.max(r, MIN_W); }
  return { box: { x: l, y: t, w: r - l, h: b - t }, guides };
}

/** Rotation from a pointer angle change, snapped to whole degrees and to 0 when close. */
export function snapRotation(deg: number): number {
  const d = clamp(Math.round(deg), -MAX_ROT, MAX_ROT);
  return Math.abs(d) <= 1 ? 0 : d;
}

/** Front/back: one above the highest layer, or one below the lowest. */
export function layerTo(placed: { tile: Tile; pos: TilePos }[], id: string, where: 'front' | 'back'): number {
  const zs = placed.filter(p => p.tile.id !== id).map(p => p.pos.z);
  if (!zs.length) return 0;
  return where === 'front' ? Math.max(...zs) + 1 : Math.min(...zs) - 1;
}

function hash(s: string) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619) >>> 0; return h; }
function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }
function num(v: unknown, d: number) { return typeof v === 'number' && Number.isFinite(v) ? v : d; }
