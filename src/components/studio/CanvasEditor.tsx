'use client';

// Canvas layout in the studio: drag to move, handles to resize and rotate, snapping to an 8-unit grid and to
// neighbours' edges and centres. The gesture runs on local state and is written to the store once, on release,
// so each move is one undo step and one autosave.
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import type { Page, Tile, TilePos } from '@/lib/schema';
import { TileShell, canvasVars, halfOnPhone } from '@/components/page/PageView';
import { placeTiles, canvasHeight, readingOrder, boxSize, snapMove, resizeBox, snapRotation, CANVAS_WIDTH, type Box, type Guide, type Handle, type Placed } from '@/lib/canvas-layout';
import { cn } from '@/lib/utils';
import { useStudio } from './store';
import { TileToolbar } from './TileControls';
import { canvasTiles, setPos } from './canvas-ops';

const BRAND = '#e4572e';
/** Below this width the canvas shows the phone stack, as visitors see it. */
export const STACK_BELOW = 600;
const HANDLES: Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const HANDLE_CURSOR: Record<Handle, string> = { n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize' };

type Live = { id: string; pos: TilePos; guides: Guide[]; mode: 'move' | 'resize' | 'rotate' };

type Props = {
  page: Page;
  renderTile: (tile: Tile, index: number, selected: boolean) => React.ReactNode;
  renderHeading: (tile: Extract<Tile, { type: 'heading' }>, selected: boolean) => React.ReactNode;
  labelFor: (tile: Tile) => string;
};

export function CanvasEditor({ page, renderTile, renderHeading, labelFor }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = width / CANVAS_WIDTH;
  const stacked = width > 0 && width < STACK_BELOW;

  const selectedId = useStudio(s => s.selected);
  const select = useStudio(s => s.select);
  const placed = useMemo(() => placeTiles(canvasTiles(page)), [page]);
  const [live, setLive] = useState<Live | null>(null);
  const shown = live ? placed.map(p => (p.tile.id === live.id ? { ...p, pos: live.pos } : p)) : placed;
  const selected = shown.find(p => p.tile.id === selectedId);

  /** One pointer gesture: tracks on window, previews locally, commits on release if anything moved. */
  const gesture = (e: React.PointerEvent, p: Placed, mode: Live['mode'], update: (dx: number, dy: number, ev: PointerEvent) => { pos: TilePos; guides: Guide[] }) => {
    if (e.button !== 0 || stacked || !scale) return;
    e.preventDefault();
    e.stopPropagation();
    select(p.tile.id);
    const sx = e.clientX, sy = e.clientY;
    let moved = false, last: { pos: TilePos; guides: Guide[] } | null = null;
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 3) return;
      moved = true;
      last = update(dx, dy, ev);
      setLive({ id: p.tile.id, mode, ...last });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (moved) {
        // the release can land outside the tile; swallow the click it makes so the selection stays
        const swallow = (ev: MouseEvent) => { ev.stopPropagation(); ev.preventDefault(); };
        window.addEventListener('click', swallow, { capture: true, once: true });
        setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0);
      }
      if (moved && last) {
        // a tile dropped onto others lands on top of them, as it looked while dragging
        const box = last.pos;
        const under = placed.filter(o => o.tile.id !== p.tile.id && overlaps(o.pos, box));
        const z = mode !== 'rotate' && under.length && under.some(o => o.pos.z >= box.z) ? Math.max(...under.map(o => o.pos.z)) + 1 : box.z;
        setPos(p.tile.id, { ...box, z });
      }
      setLive(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const others = (id: string): Box[] => placed.filter(o => o.tile.id !== id).map(o => o.pos);
  const threshold = scale ? 6 / scale : 0;

  const startMove = (e: React.PointerEvent, p: Placed) => {
    const rest = others(p.tile.id);
    gesture(e, p, 'move', (dx, dy) => {
      const s = snapMove({ ...p.pos, x: p.pos.x + dx / scale, y: p.pos.y + dy / scale }, rest, threshold);
      return { pos: { ...p.pos, x: s.x, y: s.y }, guides: s.guides };
    });
  };

  const startResize = (e: React.PointerEvent, p: Placed, handle: Handle) => {
    const rest = others(p.tile.id);
    const a = (p.pos.r * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a);
    gesture(e, p, 'resize', (dx, dy) => {
      // pointer travel in the tile's own (rotated) axes
      const ux = (dx * cos + dy * sin) / scale, uy = (-dx * sin + dy * cos) / scale;
      const r = resizeBox(p.pos, handle, ux, uy, rest, threshold);
      return { pos: { ...p.pos, ...r.box }, guides: r.guides };
    });
  };

  const startRotate = (e: React.PointerEvent, p: Placed) => {
    const box = (e.currentTarget as HTMLElement).closest('[data-cv-overlay]')!.getBoundingClientRect();
    const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
    const a0 = Math.atan2(e.clientY - cy, e.clientX - cx);
    gesture(e, p, 'rotate', (_dx, _dy, ev) => {
      const a = Math.atan2(ev.clientY - cy, ev.clientX - cx);
      let deg = p.pos.r + ((a - a0) * 180) / Math.PI;
      deg = ((deg + 540) % 360) - 180;
      return { pos: { ...p.pos, r: snapRotation(deg) }, guides: [] };
    });
  };

  // The editor keeps room below the last tile so there is space to drag into.
  const height = canvasHeight(shown) + 240;
  return (
    <div ref={wrap} className="posy-canvas-wrap">
      <div className={cn('posy-canvas', live && 'select-none')} style={{ '--ch': height } as React.CSSProperties} data-canvas-editor>
        {/* page order, not reading order: re-ordering DOM nodes mid-drag would restart their entrance animation */}
        {(stacked ? readingOrder(shown) : shown).map(p => {
          const isSel = p.tile.id === selectedId;
          return (
            <div key={p.tile.id} data-tile={p.tile.id} aria-label={labelFor(p.tile)} className={cn('posy-cv', p.tile.type === 'heading' ? 'posy-cv-heading' : halfOnPhone(p.pos) && 'posy-cv-half', !stacked && 'cursor-grab', live?.id === p.tile.id && live.mode === 'move' && 'cursor-grabbing')}
              style={{ ...canvasVars(p.pos), ...(live?.id === p.tile.id ? { zIndex: 9000 } : {}) }}
              onPointerDown={e => startMove(e, p)}
              onDragStart={e => e.preventDefault()}
              onClick={e => { e.stopPropagation(); select(p.tile.id); }}>
              {p.tile.type === 'heading' ? renderHeading(p.tile, isSel) : renderTile({ ...p.tile, size: boxSize(p.tile, p.pos) } as Tile, p.index, isSel)}
              {isSel && stacked && <TileToolbar tile={p.tile} />}
            </div>
          );
        })}
        {!stacked && live?.guides.map((g, i) => (
          <span key={i} aria-hidden className="pointer-events-none absolute z-[9998]" style={g.axis === 'x'
            ? { left: `calc(${g.at} * var(--u))`, top: 0, bottom: 0, width: 1, background: BRAND }
            : { top: `calc(${g.at} * var(--u))`, left: 0, right: 0, height: 1, background: BRAND }} />
        ))}
        {!stacked && selected && (
          <div data-cv-overlay className="posy-cv pointer-events-none" style={{ ...canvasVars(selected.pos), zIndex: 9999 }}>
            <span aria-hidden className="absolute -inset-[4px] rounded-[6px] border-2" style={{ borderColor: BRAND }} />
            {HANDLES.map(h => (
              <span key={h} data-handle={h} onPointerDown={e => startResize(e, selected, h)}
                className="pointer-events-auto absolute size-[12px] rounded-[3px] border-2 bg-white shadow-sm"
                style={{ borderColor: BRAND, cursor: HANDLE_CURSOR[h], ...handlePos(h) }} />
            ))}
            <button type="button" aria-label="Rotate" data-handle="rotate" onPointerDown={e => startRotate(e, selected)} onClick={e => e.stopPropagation()}
              className="pointer-events-auto absolute left-1/2 grid size-[26px] -translate-x-1/2 cursor-grab place-items-center rounded-full border-2 bg-white text-[#e4572e] shadow-sm"
              style={{ borderColor: BRAND, bottom: -40 }}>
              <RotateCw className="size-3.5" strokeWidth={2.5} />
            </button>
            {!live && (
              // the toolbar stays level even when the tile is turned
              <div className="absolute inset-0" style={{ rotate: `${-selected.pos.r}deg` }}>
                <div className="pointer-events-auto"><TileToolbar tile={selected.tile} /></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

function handlePos(h: Handle): React.CSSProperties {
  const off = -9; // centre the 12px handle on the 2px frame drawn 4px outside the tile
  const s: React.CSSProperties = {};
  if (h.includes('n')) s.top = off; else if (h.includes('s')) s.bottom = off; else { s.top = '50%'; s.marginTop = -6; }
  if (h.includes('w')) s.left = off; else if (h.includes('e')) s.right = off; else { s.left = '50%'; s.marginLeft = -6; }
  return s;
}
