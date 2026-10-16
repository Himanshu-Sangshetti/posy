// What a tile is, in plain words, so every visual style can render it its own way.
import type { Tile } from '@/lib/schema';
import { PLATFORMS, profileUrl } from '@/lib/platforms';
import { hostOf, youtubeId } from '@/lib/url';

const NEWSLETTER = /(^|\.)(substack\.com|buttondown\.(email|com)|beehiiv\.com|kit\.com|convertkit\.com|ghost\.io|mailchimp\.com|list-manage\.com|mailerlite\.com|tinyletter\.com|letterdrop\.com|bearblog\.dev)$/;
const SHOP = /(^|\.)(gumroad\.com|etsy\.com|myshopify\.com|bigcartel\.com|ko-fi\.com|lemonsqueezy\.com|payhip\.com|storenvy\.com)$|^shop\./;

export type Meta = {
  /** Short lowercase word for the kind of thing: "instagram", "newsletter", "video", "note"… */
  kind: string;
  title: string;
  sub?: string;
  image?: string;
  href: string | null;
  /** Brand icon path (Simple Icons) when there is one. */
  icon?: string;
};

export function tileMeta(t: Tile): Meta {
  switch (t.type) {
    case 'link': {
      const host = hostOf(t.url);
      const kind = NEWSLETTER.test(host) ? 'newsletter' : SHOP.test(host) ? 'shop' : 'link';
      return { kind, title: t.title || host, sub: t.description || host, image: t.image, href: t.url };
    }
    case 'social': {
      const p = PLATFORMS[t.platform];
      return { kind: p.label.toLowerCase(), title: t.platform === 'email' ? t.handle : `@${t.handle.replace(/^@/, '')}`, sub: p.label, href: profileUrl(t.platform, t.handle, t.url), icon: p.icon?.path };
    }
    case 'text': return { kind: 'note', title: t.text, href: null };
    case 'heading': return { kind: 'section', title: t.text, href: null };
    case 'image': return { kind: 'photo', title: t.caption || t.alt || '', image: t.src, href: t.url ?? null };
    case 'video': {
      const id = youtubeId(t.url);
      return { kind: 'video', title: t.title || 'Watch', sub: 'YouTube', image: t.image || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined), href: t.url, icon: PLATFORMS.youtube.icon?.path };
    }
    case 'music': return { kind: 'music', title: t.title || 'Listen on Spotify', sub: t.artist || 'Spotify', image: t.image, href: t.url, icon: PLATFORMS.spotify.icon?.path };
    case 'github': return { kind: 'repo', title: t.repo, sub: t.description, href: `https://github.com/${t.repo}`, icon: PLATFORMS.github.icon?.path };
  }
}

export const compact = (n: number) => Intl.NumberFormat('en', { notation: 'compact' }).format(n);

/** A small, fast, repeatable random series from a string (a tile's id), so procedural art never changes between visits. */
export const seeded = (id: string) => { let h = 2166136261; for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619); let x = h >>> 0 || 1; return () => ((x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296); };
