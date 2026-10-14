// The Desk layout: every tile is a real object on a soft paper desk. Server-rendered; motion is CSS.
import { Play, Star } from 'lucide-react';
import type { Tile, Size } from '@/lib/schema';
import { PLATFORMS } from '@/lib/platforms';
import { hostOf, youtubeId } from '@/lib/url';
import { asset, cn } from '@/lib/utils';
import { Favicon, VideoPlayer } from './islands';
import { BrandIcon, RichText } from './tiles';

type Props<T extends Tile['type']> = { tile: Extract<Tile, { type: T }>; editing?: boolean };

const NEWSLETTER_HOSTS = /(^|\.)(substack\.com|buttondown\.(email|com)|beehiiv\.com|kit\.com|convertkit\.com|ghost\.io|mailchimp\.com|list-manage\.com|mailerlite\.com|tinyletter\.com|letterdrop\.com|bearblog\.dev)$/;
const SHOP_HOSTS = /(^|\.)(gumroad\.com|etsy\.com|myshopify\.com|bigcartel\.com|ko-fi\.com|lemonsqueezy\.com|payhip\.com|storenvy\.com)$|^shop\./;

/** Small, stable tilt per tile so the desk looks placed by hand but never changes between renders. */
export function deskTilt(tile: Tile): number {
  let h = 0;
  for (const c of tile.id) h = (h * 31 + c.charCodeAt(0)) | 0;
  const spread: Record<Size, number> = { s: 2.8, w: 1.4, t: 1.8, l: 1.6 };
  return Math.round(((((h >>> 0) % 1000) / 1000) * 2 - 1) * spread[tile.size] * 10) / 10;
}

/** The paper colour of an object: the tile's chosen colour, or a sensible default for the object. */
function paper(tile: Tile, fallback: string) {
  const c = tile.color;
  if (c === 'auto') return `var(--tint-${fallback})`;
  if (c === 'surface') return 'var(--surface)';
  if (c === 'accent') return 'color-mix(in oklab, var(--accent) 30%, var(--surface))';
  return `var(--tint-${c})`;
}

const Img = ({ src, alt = '' }: { src: string; alt?: string }) =>
  // eslint-disable-next-line @next/next/no-img-element
  <img src={asset(src)} alt={alt} loading="lazy" draggable={false} />;

function Polaroid({ tile }: Props<'image'>) {
  const tape = tile.size !== 's';
  return (
    <div className="dk-pol">
      {tape && <span className="dk-tape" aria-hidden />}
      <div className="dk-pol-img"><Img src={tile.src} alt={tile.alt} /></div>
      {tile.caption && <span className="dk-hand dk-pol-cap">{tile.caption}</span>}
    </div>
  );
}

function Note({ tile }: Props<'text'>) {
  return (
    <div className={cn('dk-note', `dk-note-${tile.size}`)} style={{ '--paper': paper(tile, 'butter') } as React.CSSProperties}>
      <p className="dk-hand"><RichText text={tile.text} /></p>
    </div>
  );
}

function Stamp({ tile }: Props<'text'>) {
  const text = tile.text.replace(/[*[\]]|\(https?:[^)]+\)/g, '').toUpperCase();
  const label = `${text} · ${text} · `;
  const id = `ring-${tile.id}`;
  return (
    <div className="dk-stamp" style={{ '--paper': paper(tile, 'lilac') } as React.CSSProperties}>
      <div className="dk-ring">
        <svg viewBox="0 0 200 200" aria-hidden className="dk-ring-text">
          <defs><path id={id} d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" /></defs>
          <text fontSize={label.length > 46 ? 11 : 13.5} letterSpacing="3"><textPath href={`#${id}`} textLength={452} lengthAdjust="spacing">{label}</textPath></text>
        </svg>
        <span className="dk-flower" aria-hidden>✿</span>
        <span className="sr-only">{tile.text}</span>
      </div>
    </div>
  );
}

function Envelope({ tile }: Props<'link'>) {
  return (
    <div className="dk-env" style={{ '--paper': paper(tile, 'lilac') } as React.CSSProperties}>
      <div className="dk-env-back" />
      <div className="dk-env-letter"><p>{tile.description || `Dear friend, here's what I've been up to…`}</p></div>
      <div className="dk-env-front" />
      <div className="dk-env-flap" />
      <div className="dk-env-addr">
        <b className="dk-serif">{tile.title || hostOf(tile.url)}</b>
        <span>{hostOf(tile.url)}</span>
      </div>
      <div className="dk-env-stamp">{tile.image ? <Img src={tile.image} /> : <span>✿</span>}</div>
    </div>
  );
}

function Postcard({ tile, stack }: Props<'link'> & { stack?: boolean }) {
  return (
    <div className={cn('dk-post', stack && 'dk-post-stack')} style={{ '--paper': paper(tile, 'peach') } as React.CSSProperties}>
      {stack && <div className="dk-post-card dk-post-under" aria-hidden />}
      <div className="dk-post-card"><Img src={tile.image!} /></div>
      <span className="dk-label">{tile.title || hostOf(tile.url)} <span aria-hidden>↗</span></span>
    </div>
  );
}

function Tag({ tile }: Props<'link'>) {
  return (
    <div className="dk-tag" style={{ '--paper': paper(tile, 'sky') } as React.CSSProperties}>
      <span className="dk-tag-hole" aria-hidden />
      <span className="dk-tag-icon"><Favicon url={tile.url} /></span>
      <div className="dk-tag-text">
        <b className="dk-serif">{tile.title || hostOf(tile.url)}</b>
        {tile.description && tile.size !== 's' && <span className="dk-tag-desc">{tile.description}</span>}
        <span className="dk-mono">{hostOf(tile.url)}</span>
      </div>
    </div>
  );
}

function Ticket({ tile, editing }: Props<'video'>) {
  const id = youtubeId(tile.url);
  return (
    <div className={cn('dk-ticket', (tile.size === 's' || tile.size === 't') && 'dk-ticket-v')} style={{ '--paper': paper(tile, 'peach') } as React.CSSProperties}>
      <div className="dk-ticket-main">{id ? <VideoPlayer id={id} title={tile.title} editing={editing} /> : <span className="dk-serif">{tile.title || hostOf(tile.url)}</span>}</div>
      <div className="dk-ticket-stub">
        <span className="dk-ticket-play" aria-hidden><Play className="size-4 fill-current" /></span>
        <small className="dk-mono">Watch</small>
      </div>
    </div>
  );
}

function Vinyl({ tile }: Props<'music'>) {
  const spotify = PLATFORMS.spotify.icon as { path: string };
  return (
    <div className={cn('dk-vinyl', `dk-vinyl-${tile.size}`)} style={{ '--paper': paper(tile, 'rose') } as React.CSSProperties}>
      <div className="dk-record" aria-hidden />
      <div className="dk-sleeve">{tile.image ? <Img src={tile.image} /> : <span className="dk-sleeve-blank"><BrandIcon path={spotify.path} size={34} /></span>}</div>
      {tile.size !== 's' && (
        <div className="dk-vinyl-info">
          <span className="dk-mono">On repeat</span>
          <b className="dk-serif">{tile.title || 'Listen on Spotify'}</b>
          {tile.artist && <span>{tile.artist}</span>}
        </div>
      )}
    </div>
  );
}

function IndexCard({ tile }: Props<'github'>) {
  return (
    <div className="dk-card">
      <span className="dk-mono dk-card-repo">{tile.repo}</span>
      {tile.description && <p className="dk-hand">{tile.description}</p>}
      <span className="dk-mono dk-card-stats">
        {tile.stars !== undefined && <span><Star className="size-3 fill-current" />{Intl.NumberFormat('en', { notation: 'compact' }).format(tile.stars)}</span>}
        {tile.language && <span>{tile.language}</span>}
      </span>
    </div>
  );
}

function Sticker({ tile }: Props<'social'>) {
  const p = PLATFORMS[tile.platform];
  return (
    <div className="dk-sticker-tile">
      <span className="dk-sticker">{p.icon?.path ? <BrandIcon path={p.icon.path} size={26} /> : <span className="text-[20px] font-bold">{tile.platform === 'email' ? '@' : 'in'}</span>}</span>
      <span className="dk-hand">{tile.platform === 'email' ? tile.handle : `@${tile.handle.replace(/^@/, '')}`}</span>
    </div>
  );
}

/** One tile as a desk object. */
export function DeskTile({ tile, editing }: { tile: Tile; editing?: boolean }) {
  switch (tile.type) {
    case 'image': return <Polaroid tile={tile} />;
    case 'text': return tile.look === 'stamp' ? <Stamp tile={tile} /> : <Note tile={tile} />;
    case 'link': {
      const host = hostOf(tile.url);
      if (NEWSLETTER_HOSTS.test(host)) return <Envelope tile={tile} />;
      if (tile.image && tile.size !== 's' || tile.image && SHOP_HOSTS.test(host)) return <Postcard tile={tile} stack={SHOP_HOSTS.test(host)} />;
      return <Tag tile={tile} />;
    }
    case 'video': return <Ticket tile={tile} editing={editing} />;
    case 'music': return <Vinyl tile={tile} />;
    case 'github': return <IndexCard tile={tile} />;
    case 'social': return <Sticker tile={tile} />;
    case 'heading': return null;
  }
}
