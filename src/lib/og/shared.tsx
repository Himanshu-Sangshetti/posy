// Pieces every share-image style reuses: tiles reduced to plain facts, social icons, avatar loading.
import 'server-only';
import type { Page, Tile } from '@/lib/schema';
import { tileMeta, compact } from '@/components/page/styles/meta';
import { PLATFORMS } from '@/lib/platforms';
import { loadImage } from './images';
import { clip, pickTiles, plain, safe } from './util';

export type Bit = {
  tile: Tile;
  kind: string;
  title: string;
  sub: string;
  text?: string;           // a note's own words
  image: string | null;    // data URL, already cropped
  icon?: string;           // brand icon path
};

/** The most telling tiles of a page, with their pictures fetched at the size the style will draw them. */
export async function bitsFor(page: Page, n: number, w: number, h: number, opts: { gray?: boolean } = {}): Promise<Bit[]> {
  const picked = pickTiles(page.tiles, n);
  return Promise.all(picked.map(async tile => {
    const m = tileMeta(tile);
    const wantsImage = tile.type === 'image' || tile.type === 'video' || tile.type === 'music' || (tile.type === 'link' && !/newsletter/.test(m.kind));
    const image = wantsImage ? await loadImage(m.image, w, h, opts) : null;
    const sub = tile.type === 'github'
      ? [tile.stars !== undefined ? `${compact(tile.stars)} stars` : '', tile.language ?? ''].filter(Boolean).join(' · ')
      : m.sub && m.sub !== m.title ? m.sub : '';
    return {
      tile, kind: m.kind, image, icon: m.icon,
      title: clip(safe(plain(m.title)), tile.type === 'text' ? 90 : 34),
      sub: clip(safe(plain(sub)), 40),
      text: tile.type === 'text' ? clip(safe(plain(tile.text)), 90) : undefined,
    };
  }));
}

/** Social tiles as [icon path | null, label]. */
export function socialsOf(page: Page, n: number) {
  return page.tiles.filter((t): t is Extract<Tile, { type: 'social' }> => t.type === 'social').slice(0, n).map(t => {
    const p = PLATFORMS[t.platform];
    return { path: p.icon?.path ?? null, label: t.platform === 'email' ? t.handle : `@${t.handle.replace(/^@/, '')}`, platform: p.label.toLowerCase() };
  });
}

export const Glyph = ({ path, size, color }: { path: string; size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><path d={path} fill={color} /></svg>
);
