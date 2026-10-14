'use client';

import { parsePage, type Page } from '@/lib/schema';
import { BASE } from '@/lib/utils';

/** "file" = running `npm run dev`: reads/writes content/page.json. "local" = hosted playground: browser storage. */
export type Mode = 'file' | 'local';
const KEY = 'posy:page';

export async function load(fallback: Page): Promise<{ mode: Mode; page: Page; mtime?: number }> {
  if (process.env.NEXT_PUBLIC_POSY_DEV) try {
    const res = await fetch(`${BASE}/api/page/`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return { mode: 'file', page: parsePage(data.page), mtime: data.mtime };
    }
  } catch { /* dev API unavailable */ }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { mode: 'local', page: parsePage(JSON.parse(raw)) };
  } catch { /* storage blocked or stale */ }
  return { mode: 'local', page: fallback };
}

export class Conflict extends Error {}

export async function save(mode: Mode, page: Page, baseMtime?: number): Promise<number | undefined> {
  if (mode === 'local') {
    try { localStorage.setItem(KEY, JSON.stringify(page)); } catch { /* quota or blocked */ }
    return;
  }
  const res = await fetch(`${BASE}/api/page/`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(baseMtime ? { 'x-base-mtime': String(baseMtime) } : {}) }, body: JSON.stringify(page) });
  if (res.status === 409) throw new Conflict('page.json changed on disk');
  if (!res.ok) throw new Error('Save failed');
  return (await res.json()).mtime;
}

export async function remoteMtime(): Promise<{ mtime: number; page: Page } | null> {
  try {
    const res = await fetch(`${BASE}/api/page/`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.valid ? { mtime: data.mtime, page: parsePage(data.page) } : null;
  } catch { return null; }
}

/** Shrink big photos before storing them. Returns a Blob (file mode) or a data URL (local mode). */
export async function prepareImage(file: File, max = 1600): Promise<Blob> {
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale); canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise(r => canvas.toBlob(b => r(b ?? file), 'image/webp', 0.86));
}

export async function storeImage(mode: Mode, file: File): Promise<string> {
  const blob = await prepareImage(file, mode === 'local' ? 1000 : 1600);
  if (mode === 'local') return new Promise(r => { const fr = new FileReader(); fr.onload = () => r(String(fr.result)); fr.readAsDataURL(blob); });
  const form = new FormData();
  form.append('file', new File([blob], 'upload', { type: blob.type }));
  const res = await fetch(`${BASE}/api/upload/`, { method: 'POST', body: form });
  if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
  return (await res.json()).src;
}

/** Fill in titles, previews and GitHub numbers after a tile is added. */
export async function enrich(mode: Mode, tile: import('@/lib/schema').Tile): Promise<Partial<import('@/lib/schema').Tile> | null> {
  if (tile.type === 'github') {
    try {
      const r = await (await fetch(`https://api.github.com/repos/${tile.repo}`)).json();
      if (r.full_name) return { description: r.description ?? undefined, stars: r.stargazers_count, language: r.language ?? undefined };
    } catch { /* offline */ }
  }
  if (tile.type === 'link' && mode === 'file') {
    try {
      const r = await (await fetch(`${BASE}/api/unfurl/?url=${encodeURIComponent(tile.url)}`)).json();
      const patch: Record<string, string> = {};
      if (r.title && !tile.title) patch.title = r.title.slice(0, 80);
      if (r.description && !tile.description) patch.description = r.description.slice(0, 160);
      if (r.image && !tile.image) patch.image = r.image;
      return Object.keys(patch).length ? patch : null;
    } catch { /* ignore */ }
  }
  return null;
}
