'use client';

import { parsePage, type Page, type Tile } from '@/lib/schema';

export type Remote = { version: number; page: Page; hasUnpublishedChanges: boolean; username: string; publishedAt: string | null };

export class Conflict extends Error {
  constructor(public remote: { version: number; page: Page }) { super('Your page changed elsewhere'); }
}

export async function fetchRemote(): Promise<Remote | null> {
  try {
    const res = await fetch('/api/v1/page', { cache: 'no-store' });
    if (!res.ok) return null;
    const d = await res.json();
    return { ...d, page: parsePage(d.page) };
  } catch { return null; }
}

/** Compare-and-set save: throws Conflict if someone (an agent, another tab) saved in between. */
export async function save(page: Page, baseVersion: number): Promise<number> {
  const res = await fetch('/api/v1/page', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page, baseVersion }) });
  if (res.status === 409) { const d = await res.json(); throw new Conflict({ version: d.version, page: parsePage(d.page) }); }
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Save failed');
  return (await res.json()).version;
}

export async function publish(): Promise<string> {
  const res = await fetch('/api/v1/page/publish', { method: 'POST' });
  if (!res.ok) throw new Error('Publish failed');
  return (await res.json()).url;
}

/** Shrink big photos in the browser before uploading. */
async function shrink(file: File, max = 1600): Promise<Blob> {
  if (file.type === 'image/gif') return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale); canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise(r => canvas.toBlob(b => r(b ?? file), 'image/webp', 0.86));
}

export async function storeImage(file: File, max?: number): Promise<string> {
  const blob = await shrink(file, max);
  const form = new FormData();
  form.append('file', new File([blob], 'upload', { type: blob.type }));
  const res = await fetch('/api/upload', { method: 'POST', body: form });
  if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
  return (await res.json()).src;
}

/** Fill in titles, previews and GitHub numbers after a tile is added in the editor. */
export async function enrich(tile: Tile): Promise<Partial<Tile> | null> {
  if (tile.type === 'github') {
    try {
      const r = await (await fetch(`https://api.github.com/repos/${tile.repo}`)).json();
      if (r.full_name) return { description: r.description ?? undefined, stars: r.stargazers_count, language: r.language ?? undefined };
    } catch { /* offline */ }
  }
  if ((tile.type === 'music' && !tile.image) || (tile.type === 'video' && (!tile.image || !tile.title))) {
    try {
      const r = await (await fetch(`/api/unfurl?url=${encodeURIComponent(tile.url)}`)).json();
      if (r.image || r.title) return { ...(r.image && !tile.image && { image: r.image }), ...(r.title && !tile.title && { title: r.title }) };
    } catch { /* ignore */ }
  }
  if (tile.type === 'link') {
    try {
      const r = await (await fetch(`/api/unfurl?url=${encodeURIComponent(tile.url)}`)).json();
      const patch: Record<string, string> = {};
      if (r.title && !tile.title) patch.title = r.title;
      if (r.description && !tile.description) patch.description = r.description;
      if (r.image && !tile.image) patch.image = r.image;
      return Object.keys(patch).length ? patch : null;
    } catch { /* ignore */ }
  }
  return null;
}
