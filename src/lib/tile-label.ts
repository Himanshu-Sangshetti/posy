import { PLATFORMS } from './platforms';
import type { Tile } from './schema';

export function tileLabel(t?: Tile, fallback?: string | null) {
  if (!t) return fallback?.includes(':') ? fallback : 'Removed tile';
  switch (t.type) {
    case 'social': return `${PLATFORMS[t.platform].label} · ${t.handle}`;
    case 'link': return t.title || t.url;
    case 'github': return t.repo;
    case 'image': return t.caption || 'Image';
    case 'video': return t.title || 'Video';
    case 'music': return 'Spotify';
    default: return t.type;
  }
}
