'use client';

import { create, useStore } from 'zustand';
import { temporal } from 'zundo';
import { arrayMove } from '@dnd-kit/sortable';
import type { Page, Tile } from '@/lib/schema';

type Patch<T> = Partial<T>;
export type StudioState = {
  page: Page | null;
  selected: string | null;
  setPage: (page: Page) => void;
  select: (id: string | null) => void;
  updateProfile: (p: Patch<Page['profile']>) => void;
  updateTheme: (t: Patch<Page['theme']>) => void;
  updateSeo: (s: Patch<Page['seo']>) => void;
  setBadge: (b: boolean) => void;
  addTile: (tile: Tile, afterId?: string | null) => void;
  updateTile: (id: string, patch: Partial<Tile>) => void;
  removeTile: (id: string) => void;
  moveTile: (activeId: string, overId: string) => void;
};

function throttle<A extends unknown[]>(fn: (...a: A) => void, ms: number) {
  let last = 0, timer: ReturnType<typeof setTimeout> | null = null, pending: A | null = null;
  return (...a: A) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...a); return; }
    pending = a;
    if (!timer) timer = setTimeout(() => { last = Date.now(); timer = null; if (pending) fn(...pending); }, ms - (now - last));
  };
}

const withPage = (s: StudioState, fn: (p: Page) => Page) => (s.page ? { page: fn(s.page) } : {});

export const useStudio = create<StudioState>()(
  temporal(
    set => ({
      page: null,
      selected: null,
      setPage: page => set({ page }),
      select: selected => set({ selected }),
      updateProfile: p => set(s => withPage(s, page => ({ ...page, profile: { ...page.profile, ...p } }))),
      updateTheme: t => set(s => withPage(s, page => ({ ...page, theme: { ...page.theme, ...t } }))),
      updateSeo: x => set(s => withPage(s, page => ({ ...page, seo: { ...page.seo, ...x } }))),
      setBadge: badge => set(s => withPage(s, page => ({ ...page, badge }))),
      addTile: (tile, afterId) => set(s => withPage(s, page => {
        const tiles = [...page.tiles];
        const at = afterId ? tiles.findIndex(t => t.id === afterId) : -1;
        tiles.splice(at >= 0 ? at + 1 : tiles.length, 0, tile);
        return { ...page, tiles };
      })),
      updateTile: (id, patch) => set(s => withPage(s, page => ({ ...page, tiles: page.tiles.map(t => (t.id === id ? ({ ...t, ...patch } as Tile) : t)) }))),
      removeTile: id => set(s => ({ ...withPage(s, page => ({ ...page, tiles: page.tiles.filter(t => t.id !== id) })), selected: s.selected === id ? null : s.selected })),
      moveTile: (activeId, overId) => set(s => withPage(s, page => {
        const from = page.tiles.findIndex(t => t.id === activeId), to = page.tiles.findIndex(t => t.id === overId);
        return from < 0 || to < 0 ? page : { ...page, tiles: arrayMove(page.tiles, from, to) };
      })),
    }),
    {
      limit: 100,
      partialize: s => ({ page: s.page }),
      equality: (a, b) => a.page === b.page,
      handleSet: handleSet => throttle<Parameters<typeof handleSet>>((...args) => handleSet(...args), 400),
    },
  ),
);

export const undo = () => useStudio.temporal.getState().undo();
export const redo = () => useStudio.temporal.getState().redo();

/** Subscribe to undo history (zundo's temporal store is a vanilla store). */
export function useHistory<T>(selector: (s: ReturnType<typeof useStudio.temporal.getState>) => T): T {
  return useStore(useStudio.temporal, selector);
}
