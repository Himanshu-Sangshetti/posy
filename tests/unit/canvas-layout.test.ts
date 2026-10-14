import { describe, it, expect } from 'vitest';
import { parsePage, type Tile } from '@/lib/schema';
import { placeTiles, canvasHeight, readingOrder, boxSize, snapMove, resizeBox, snapRotation, layerTo, clampPos, CELL, GAP, MIN_W, MIN_H, CANVAS_WIDTH } from '@/lib/canvas-layout';

const tiles = (list: Partial<Tile>[]) => parsePage({ profile: { name: 'A' }, tiles: list.map((t, i) => ({ id: `t${i}`, type: 'link', url: 'https://a.b', ...t })) }).tiles;
const step = CELL + GAP;

describe('canvas auto-placement', () => {
  it('flows sizes like the bento grid, packing gaps densely', () => {
    const p = placeTiles(tiles([{ size: 'l' }, { size: 's' }, { size: 's' }, { size: 'w' }, { size: 't' }, { size: 's' }]));
    expect(p.map(x => [x.pos.x, x.pos.y, x.pos.w, x.pos.h])).toEqual([
      [0, 0, 2 * CELL + GAP, 2 * CELL + GAP],
      [2 * step, 0, CELL, CELL],
      [3 * step, 0, CELL, CELL],
      [2 * step, step, 2 * CELL + GAP, CELL],
      [0, 2 * step, CELL, 2 * CELL + GAP],
      [step, 2 * step, CELL, CELL],
    ]);
    expect(p.every(x => x.pos.r === 0 && x.pos.z === 0)).toBe(true);
    // the grid fills the design width exactly
    expect(4 * CELL + 3 * GAP).toBe(CANVAS_WIDTH);
  });
  it('starts a full-width section at each heading', () => {
    const p = placeTiles(tiles([{ size: 's' }, { type: 'heading', text: 'More' } as Partial<Tile>, { size: 's' }]));
    expect(p[1].pos).toMatchObject({ x: 0, w: CANVAS_WIDTH });
    expect(p[1].pos.y).toBeGreaterThanOrEqual(CELL);
    expect(p[2].pos.y).toBeGreaterThan(p[1].pos.y + p[1].pos.h);
    expect(p[2].pos.x).toBe(0);
  });
  it('keeps placed tiles and puts new ones below them', () => {
    const p = placeTiles(tiles([{ pos: { x: 400, y: 100, w: 300, h: 200, r: 5, z: 2 } }, { size: 's' }]));
    expect(p[0].pos).toEqual({ x: 400, y: 100, w: 300, h: 200, r: 5, z: 2 });
    expect(p[1].pos.y).toBeGreaterThanOrEqual(300);
    expect(canvasHeight(p)).toBe(p[1].pos.y + CELL);
  });
  it('orders by row then column for reading and the phone stack', () => {
    const p = placeTiles(tiles([{ pos: { x: 600, y: 0, w: 200, h: 200, r: 0, z: 0 } }, { pos: { x: 0, y: 0, w: 200, h: 200, r: 0, z: 0 } }]));
    expect(readingOrder(p).map(x => x.tile.id)).toEqual(['t1', 't0']);
  });
  it('clamps positions into the design space', () => {
    expect(clampPos({ x: 1100, y: -20, w: 300, h: 10, r: 40, z: 1.6 })).toEqual({ x: 900, y: 0, w: 300, h: 24, r: 15, z: 2 });
  });
  it('reads a box as the closest grid size', () => {
    expect(boxSize({ type: 'link' }, { w: 288, h: 288 })).toBe('s');
    expect(boxSize({ type: 'link' }, { w: 592, h: 288 })).toBe('w');
    expect(boxSize({ type: 'link' }, { w: 288, h: 592 })).toBe('t');
    expect(boxSize({ type: 'link' }, { w: 592, h: 592 })).toBe('l');
    expect(boxSize({ type: 'music' }, { w: 288, h: 592 })).toBe('s');
  });
});

describe('canvas editing geometry', () => {
  it('snaps a moved box to the 8-unit grid', () => {
    expect(snapMove({ x: 101, y: 203, w: 200, h: 200 }, [], 0)).toMatchObject({ x: 104, y: 200, guides: [] });
  });
  it('locks onto a neighbour edge or centre and reports a guide', () => {
    const r = snapMove({ x: 503, y: 13, w: 100, h: 100 }, [{ x: 0, y: 10, w: 500, h: 300 }], 6);
    expect(r.x).toBe(500); // left edge onto the neighbour's right edge
    expect(r.y).toBe(10);
    expect(r.guides).toEqual(expect.arrayContaining([{ axis: 'x', at: 500 }, { axis: 'y', at: 10 }]));
  });
  it('never moves outside the canvas', () => {
    expect(snapMove({ x: 1150, y: -40, w: 200, h: 100 }, [], 0)).toMatchObject({ x: 1000, y: 0 });
  });
  it('resizes from any handle with a minimum size', () => {
    const start = { x: 100, y: 100, w: 300, h: 300 };
    // edges land on the 8-unit grid: 451 -> 448, 499 -> 496
    expect(resizeBox(start, 'se', 51, 99, [], 0).box).toEqual({ x: 100, y: 100, w: 348, h: 396 });
    expect(resizeBox(start, 'nw', 1000, 1000, [], 0).box).toEqual({ x: 400 - MIN_W, y: 400 - MIN_H, w: MIN_W, h: MIN_H });
    expect(resizeBox(start, 'e', 5000, 0, [], 0).box).toMatchObject({ x: 100, w: CANVAS_WIDTH - 100 });
    expect(resizeBox(start, 'w', -500, 0, [], 0).box).toMatchObject({ x: 0, w: 400 });
  });
  it('snaps rotation to whole degrees within ±15 and settles near zero', () => {
    expect(snapRotation(0.8)).toBe(0);
    expect(snapRotation(7.4)).toBe(7);
    expect(snapRotation(-40)).toBe(-15);
  });
  it('brings a tile to the front or back', () => {
    const p = placeTiles(tiles([{ pos: { x: 0, y: 0, w: 100, h: 100, r: 0, z: 3 } }, { pos: { x: 0, y: 0, w: 100, h: 100, r: 0, z: -1 } }, { size: 's' }]));
    expect(layerTo(p, 't2', 'front')).toBe(4);
    expect(layerTo(p, 't2', 'back')).toBe(-2);
  });
});
