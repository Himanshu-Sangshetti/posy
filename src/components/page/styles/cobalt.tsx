// Cobalt: a vintage print in two inks. The top of the page is a cobalt night over a cream plain, burst with a thousand
// printed lines; your name is lettered on that sky and your portrait is a moon. Below it the page is cream paper:
// links are numbered plates, every photo is reprinted in the two inks, notes are set like verse on a cobalt block,
// a record is a disc of engraved rings, a stamp note is a sun-burst seal, and a newsletter is a perforated ticket.
import { ArrowUpRight, Play, Star } from 'lucide-react';
import type { Page, Tile } from '@/lib/schema';
import { THEMES } from '@/lib/themes';
import { asset, cn } from '@/lib/utils';
import { hostOf, youtubeId } from '@/lib/url';
import { VideoPlayer } from '../islands';
import { RichText } from '../tiles';
import { tileMeta, compact } from './meta';
import type { HeaderSlots } from './types';

/** The palettes made for this look; each has its own pair of inks (see cobalt.css). Any other palette prints in its own text and paper colours. */
const OWN = new Set(['cobalt', 'vermilion', 'moonlit', 'verdigris']);
/** Ink (shadows) and paper (highlights) for the two-ink reprint of photos. */
const INKS: Record<string, [string, string]> = {
  cobalt: ['#1a2d8f', '#f3e9d2'], vermilion: ['#b8321f', '#f4ead6'], moonlit: ['#0d1a52', '#f1e5c9'], verdigris: ['#17463f', '#efe8d6'],
};

const hex = (h: string) => { const n = parseInt(h.replace('#', '').padEnd(6, '0').slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => (v / 255).toFixed(3)); };

/** One SVG filter that turns any photo into a two-ink print: luminance mapped from the ink to the paper colour. */
function Inks({ preset }: { preset: string }) {
  const t = THEMES[preset] ?? THEMES.cobalt;
  const [ink, paper] = INKS[preset] ?? [t.dark ? t.bg : t.text, t.dark ? t.text : t.surface];
  const a = hex(ink), b = hex(paper);
  // three steps per channel: ink, a slightly heavier mid-tone (prints darken in the middle), paper
  const ch = (i: number) => `${a[i]} ${(+a[i] * 0.55 + +b[i] * 0.45).toFixed(3)} ${b[i]}`;
  return (
    <svg aria-hidden width="0" height="0" style={{ position: 'absolute', width: 0, height: 0 }}>
      <filter id={`cb-duo-${OWN.has(preset) ? preset : 'cobalt'}`} colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0" />
        <feComponentTransfer><feFuncR type="linear" slope="1.25" intercept="-0.1" /><feFuncG type="linear" slope="1.25" intercept="-0.1" /><feFuncB type="linear" slope="1.25" intercept="-0.1" /></feComponentTransfer>
        <feComponentTransfer><feFuncR type="table" tableValues={ch(0)} /><feFuncG type="table" tableValues={ch(1)} /><feFuncB type="table" tableValues={ch(2)} /></feComponentTransfer>
      </filter>
    </svg>
  );
}

const Img = ({ src, alt = '' }: { src: string; alt?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={asset(src)} alt={alt} loading="lazy" draggable={false} />
);

/** A photo, reprinted in the two inks with a fine halftone over it. */
const Print = ({ src, alt, className }: { src: string; alt?: string; className?: string }) => (
  <span className={cn('cb-print', className)}><Img src={src} alt={alt} /></span>
);

const ROMAN: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
const roman = (n: number) => { let s = ''; for (const [v, r] of ROMAN) while (n >= v) { s += r; n -= v; } return s; };
/** Every plate on the page carries its number, like the plates in an old book. */
const No = ({ index }: { index: number }) => <span className="cb-no">Pl. {roman(index + 1)}</span>;

const Moon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden className={cn('cb-moon', className)}><path d="M15.5 3.2a8.8 8.8 0 1 0 5.3 15.1A9.6 9.6 0 0 1 15.5 3.2Z" /></svg>
);

export function CobaltHeader({ page, slots }: { page: Page; slots: HeaderSlots }) {
  return (
    <>
      <Inks preset={page.theme.preset} />
      {slots.avatar && <div className="cb-portrait">{slots.avatar}</div>}
      <h1 className="posy-head posy-name cb-name">{slots.name}</h1>
      {slots.bio && <div className="posy-bio cb-bio">{slots.bio}</div>}
      {slots.caption && <p className="cb-caption"><Moon />{slots.caption}</p>}
      <div className="cb-socials">{slots.socials}</div>
    </>
  );
}

/** The seal for a stamp note: its words set around a printed sun. */
function Seal({ text }: { text: string }) {
  const words = text.replace(/[*[\]]|\(https?:[^)]+\)/g, '').trim().toUpperCase();
  const ring = `${words} · ${words} · `;
  // the ring is 464 units round: size the letters so the words fit it, then let the spacing even them out
  const fs = Math.max(8.5, Math.min(15, 464 / (ring.length * 0.8)));
  return (
    <div className="cb-seal-wrap">
      <svg viewBox="0 0 200 200" className="cb-seal" role="img" aria-label={words}>
        <defs><path id="cb-ring" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" /></defs>
        <circle cx="100" cy="100" r="96" className="cb-seal-disc" />
        <circle cx="100" cy="100" r="58" className="cb-seal-sun" />
        <text className="cb-seal-text" textLength="464" lengthAdjust="spacing" style={{ fontSize: fs }}><textPath href="#cb-ring">{ring}</textPath></text>
      </svg>
    </div>
  );
}

export function CobaltTile({ tile, index, editing }: { tile: Tile; index: number; editing?: boolean }) {
  const m = tileMeta(tile);

  if (tile.type === 'text') {
    if (tile.look === 'stamp') return <Seal text={tile.text} />;
    return (
      <figure className={cn('cb-verse', `cb-v-${tile.size}`)}>
        <Moon />
        <blockquote><RichText text={tile.text} /></blockquote>
      </figure>
    );
  }

  if (tile.type === 'image') return (
    <figure className="cb-plate cb-photo">
      <Print src={tile.src} alt={tile.alt} />
      <figcaption><No index={index} />{tile.caption && <span>{tile.caption}</span>}</figcaption>
    </figure>
  );

  if (tile.type === 'video') {
    const id = youtubeId(tile.url);
    return (
      <div className="cb-plate cb-photo cb-video">
        <span className="cb-print cb-screen">
          {id ? <VideoPlayer id={id} title={tile.title} overlay={false} editing={editing} thumb={tile.image ? asset(tile.image) : undefined} /> : m.image && <Img src={m.image} />}
        </span>
        <p className="cb-cap"><Play aria-hidden className="cb-play" /><span>{m.title}</span></p>
      </div>
    );
  }

  if (tile.type === 'music') return (
    <div className="cb-plate cb-music">
      <span className="cb-record" aria-hidden>{m.image && <Print src={m.image} />}</span>
      <div className="cb-text">
        <No index={index} />
        <b className="cb-title">{m.title}</b>
        <span className="cb-sub">{m.sub}</span>
      </div>
    </div>
  );

  if (tile.type === 'github') return (
    <div className="cb-plate cb-card">
      <div className="cb-top"><No index={index} /><span className="cb-kind">Repository</span></div>
      <b className="cb-title cb-mono">{tile.repo}</b>
      {tile.description && <p className="cb-sub">{tile.description}</p>}
      {(tile.stars !== undefined || tile.language) && (
        <span className="cb-meta">{tile.stars !== undefined && <><Star aria-hidden className="cb-star" />{compact(tile.stars)}</>}{tile.stars !== undefined && tile.language && ' · '}{tile.language}</span>
      )}
      <span className="cb-go" aria-hidden><ArrowUpRight /></span>
    </div>
  );

  if (m.kind === 'newsletter') return (
    <div className="cb-ticket">
      <div className="cb-ticket-body">
        <span className="cb-kind">Letters</span>
        <b className="cb-title">{m.title}</b>
        {tile.type === 'link' && tile.description && <p className="cb-sub">{tile.description}</p>}
      </div>
      <div className="cb-ticket-stub"><span>Subscribe</span><Moon /></div>
    </div>
  );

  // links, shops and everything else: a numbered plate, with its picture printed above on bigger plates
  const pic = tile.size !== 's' && m.image;
  const host = tile.type === 'link' ? hostOf(tile.url) : '';
  return (
    <article className={cn('cb-plate cb-card', pic && 'cb-card-pic', m.kind === 'shop' && 'cb-shop')}>
      <div className="cb-top"><No index={index} /><span className="cb-kind">{m.kind === 'shop' ? 'Editions' : m.kind === 'link' ? host : m.kind}</span></div>
      {pic && <Print src={m.image!} />}
      <b className="cb-title">{m.title}</b>
      {m.sub && m.sub !== m.title && m.sub !== host && <p className="cb-sub">{m.sub}</p>}
      <span className="cb-go" aria-hidden><ArrowUpRight /></span>
    </article>
  );
}

export function CobaltRow({ tile, index }: { tile: Tile; index: number }) {
  const m = tileMeta(tile);
  if (tile.type === 'text') return <figure className="cb-verse cb-row-verse"><Moon /><blockquote><RichText text={tile.text} /></blockquote></figure>;
  return (
    <div className="cb-plate cb-row">
      <span className="cb-row-no">{roman(index + 1)}</span>
      {m.image && <Print src={m.image} className="cb-row-pic" />}
      <span className="cb-text"><b className="cb-title">{m.title || 'Photo'}</b>{m.sub && m.sub !== m.title && tile.type !== 'image' && <span className="cb-sub">{m.sub}</span>}</span>
      <span className="cb-go" aria-hidden><ArrowUpRight /></span>
    </div>
  );
}
