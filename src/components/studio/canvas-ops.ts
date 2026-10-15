'use client';

// Canvas-layout edits. Each one is a single store update, so undo/redo and autosave treat it as one step.
import type { Page, Size, Tile, TilePos } from '@/lib/schema';
import { placeTiles, looseStyle, sizeBox, clampPos, layerTo, type Placed } from '@/lib/canvas-layout';
import { socialsInHeader } from '@/components/page/styles';
import { useStudio } from './store';

/** The tiles drawn on the canvas (other styles show social links in the header instead). */
export const canvasTiles = (page: Page) => (socialsInHeader(page) ? page.tiles.filter(t => t.type !== 'social') : page.tiles);

/**
 * Writes new positions. The first edit also pins every auto-placed tile where it is shown,
 * so moving one tile never makes the others reflow.
 */
export function commitCanvas(changes: Record<string, Partial<Tile>>) {
  const { page, patchTiles } = useStudio.getState();
  if (!page) return;
  const patches: Record<string, Partial<Tile>> = {};
  for (const p of placeTiles(canvasTiles(page), looseStyle(page.theme.style))) if (!p.tile.pos) patches[p.tile.id] = { pos: p.pos };
  for (const [id, c] of Object.entries(changes)) patches[id] = { ...patches[id], ...c };
  patchTiles(patches);
}

function current(id: string): { placed: Placed[]; me?: Placed } {
  const page = useStudio.getState().page;
  if (!page) return { placed: [] };
  const placed = placeTiles(canvasTiles(page), looseStyle(page.theme.style));
  return { placed, me: placed.find(p => p.tile.id === id) };
}

export const setPos = (id: string, pos: TilePos) => commitCanvas({ [id]: { pos: clampPos(pos) } });

export function nudgeTile(id: string, dx: number, dy: number) {
  const { me } = current(id);
  if (me) setPos(id, { ...me.pos, x: me.pos.x + dx, y: me.pos.y + dy });
}

export function layerTile(id: string, where: 'front' | 'back') {
  const { placed, me } = current(id);
  if (me) setPos(id, { ...me.pos, z: layerTo(placed, id, where) });
}

/** The size buttons on the canvas: the grid size's box, keeping the tile's corner where it is. */
export function sizeTile(id: string, size: Size) {
  const { me } = current(id);
  if (!me) return;
  commitCanvas({ [id]: { size, pos: clampPos({ ...me.pos, ...sizeBox({ type: me.tile.type, size }) }) } });
}
