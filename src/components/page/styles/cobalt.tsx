// Cobalt: a vintage print in two inks. The top of the page is a cobalt night over a cream plain, burst with a thousand
// printed lines; your name is lettered on that sky and your portrait is a moon. Below it the page is cream paper:
// links are numbered plates, every photo is reprinted in the two inks, notes are set like verse on a cobalt block,
// a record is a disc of engraved rings, a stamp note is a sun-burst seal, and a newsletter is a perforated ticket.
import { ArrowUpRight, Play, Star } from 'lucide-react';
import type { Page, Tile } from '@/lib/schema';
import { THEMES } from '@/lib/themes';
import { asset, cn } from '@/lib/utils';
import { hostOf, youtubeId } from '@/lib/url';
import { VideoPlayer, PhotoExposure } from '../islands';
import { cropStyle } from '@/lib/crop';
import { RichText } from '../tiles';
import { tileMeta, compact, seeded } from './meta';
import type { HeaderSlots } from './types';

/** The palettes made for this look; each has its own pair of inks (see cobalt.css). Any other palette prints in its own text and paper colours. */
const OWN = new Set(['cobalt', 'vermilion', 'moonlit', 'verdigris']);
/** Ink (shadows) and paper (highlights) for the two-ink reprint of photos. */
const INKS: Record<string, [string, string]> = {
  cobalt: ['#1a2d8f', '#f3e9d2'], vermilion: ['#b8321f', '#f4ead6'], moonlit: ['#0d1a52', '#f1e5c9'], verdigris: ['#17463f', '#efe8d6'],
};

const hex = (h: string) => { const n = parseInt(h.replace('#', '').padEnd(6, '0').slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => (v / 255).toFixed(3)); };

/**
 * The print every picture goes through, so a selfie, a product shot or a bright YouTube thumbnail all come out as the same
 * kind of object: a stippled two-ink print. The picture is flattened to its light, pushed in contrast, then a fine grain of
 * noise decides, dot by dot, whether each spot takes ink, half ink or none (three tones), and those are printed in the
 * palette's ink and paper colours.
 */
function Inks({ preset }: { preset: string }) {
  const t = THEMES[preset] ?? THEMES.cobalt;
  const [ink, paper] = INKS[preset] ?? [t.dark ? t.bg : t.text, t.dark ? t.text : t.surface];
  const a = hex(ink), b = hex(paper);
  const ch = (i: number) => `${a[i]} ${(+a[i] * 0.42 + +b[i] * 0.58).toFixed(3)} ${b[i]}`;
  const lin = (slope: number, icpt: number) => <><feFuncR type="linear" slope={slope} intercept={icpt} /><feFuncG type="linear" slope={slope} intercept={icpt} /><feFuncB type="linear" slope={slope} intercept={icpt} /></>;
  // shadows are opened before the print, so a dark picture still has shapes in it
  const gamma = <><feFuncR type="gamma" exponent="0.72" /><feFuncG type="gamma" exponent="0.72" /><feFuncB type="gamma" exponent="0.72" /></>;
  const steps = <><feFuncR type="discrete" tableValues="0 .5 1" /><feFuncG type="discrete" tableValues="0 .5 1" /><feFuncB type="discrete" tableValues="0 .5 1" /></>;
  return (
    <svg aria-hidden width="0" height="0" style={{ position: 'absolute', width: 0, height: 0 }}>
      <filter id={`cb-duo-${OWN.has(preset) ? preset : 'cobalt'}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0" result="light" />
        <feComponentTransfer in="light" result="lift">{gamma}</feComponentTransfer>
        <feComponentTransfer in="lift" result="bold">{lin(1.3, -0.12)}</feComponentTransfer>
        <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="2" seed="7" result="noise" />
        <feColorMatrix in="noise" type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1" result="grain" />
        <feComposite in="bold" in2="grain" operator="arithmetic" k1="0" k2="1" k3="0.62" k4="-0.31" result="dither" />
        <feComponentTransfer in="dither" result="tones">{steps}</feComponentTransfer>
        <feComponentTransfer in="tones"><feFuncR type="table" tableValues={ch(0)} /><feFuncG type="table" tableValues={ch(1)} /><feFuncB type="table" tableValues={ch(2)} /></feComponentTransfer>
      </filter>
    </svg>
  );
}

const Img = ({ src, alt = '', crop }: { src: string; alt?: string; crop?: React.CSSProperties }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={asset(src)} alt={alt} loading="lazy" draggable={false} style={crop} />
);

/** A photo, reprinted in the two inks with a fine halftone over it. */
const Print = ({ src, alt, className, crop }: { src: string; alt?: string; className?: string; crop?: React.CSSProperties }) => (
  <span className={cn('cb-print', className)}><Img src={src} alt={alt} crop={crop} /></span>
);

const ROMAN: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
const roman = (n: number) => { let s = ''; for (const [v, r] of ROMAN) while (n >= v) { s += r; n -= v; } return s; };
/** Every plate on the page carries its number, like the plates in an old book. */
const No = ({ index }: { index: number }) => <span className="cb-no">Pl. {roman(index + 1)}</span>;

const f1 = (n: number) => Math.round(n * 10) / 10;

/**
 * A plate's own little print, drawn from its id: a cobalt sky with a burst of cream lines rising from a point on the horizon,
 * a crescent somewhere in the sky and stipple on the plain. Links without a picture get one, so a page of plain links still
 * reads as a folio of prints. Repositories get a constellation instead, and shops a star.
 */
function Burst({ seed, kind = 'link' }: { seed: string; kind?: 'link' | 'repo' | 'shop' }) {
  const r = seeded(seed + kind);
  const W = 200, H = 120, horizon = kind === 'repo' ? H : 74 + r() * 8;
  const ox = 30 + r() * 140, oy = horizon;
  let rays = '';
  if (kind !== 'repo') {
    const n = 70 + Math.floor(r() * 50);
    for (let i = 0; i < n; i++) {
      const a = Math.PI + (i + r() * .8) / n * Math.PI, r0 = 4 + r() * 14, r1 = r0 + 18 + r() * (kind === 'shop' ? 60 : 130);
      rays += `M${f1(ox + Math.cos(a) * r0)} ${f1(oy + Math.sin(a) * r0)}L${f1(ox + Math.cos(a) * r1)} ${f1(oy + Math.sin(a) * r1)}`;
    }
  }
  // a constellation: a few stars joined in a line, like a chart
  const stars = kind === 'repo' ? Array.from({ length: 7 }, () => [20 + r() * 160, 18 + r() * 84]) : [];
  const chart = stars.map(([x, y], i) => `${i ? 'L' : 'M'}${f1(x)} ${f1(y)}`).join('');
  const mx = (ox + 60 + r() * 80) % (W - 30) + 15, my = 14 + r() * 18;
  const dots = kind === 'repo' ? [] : Array.from({ length: 70 }, () => { const y = horizon + 2 + Math.pow(r(), 0.7) * (H - horizon); return [f1(r() * W), f1(y), f1(.35 + r() * .9 * ((y - horizon) / (H - horizon) + .3))]; });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="cb-burst" aria-hidden>
      <rect width={W} height={horizon} className="cb-b-sky" />
      {rays && <path d={rays} className="cb-b-rays" />}
      {chart && <><path d={chart} className="cb-b-chart" />{stars.map(([x, y], i) => <circle key={i} cx={f1(x)} cy={f1(y)} r={i % 3 ? 1.6 : 2.6} className="cb-b-star" />)}</>}
      {kind === 'shop' && <path d={`M${f1(ox)} ${f1(oy - 9)}L${f1(ox + 2)} ${f1(oy - 2)}L${f1(ox + 9)} ${f1(oy)}L${f1(ox + 2)} ${f1(oy + 2)}L${f1(ox)} ${f1(oy + 9)}L${f1(ox - 2)} ${f1(oy + 2)}L${f1(ox - 9)} ${f1(oy)}L${f1(ox - 2)} ${f1(oy - 2)}Z`} className="cb-b-star" />}
      {kind !== 'repo' && <path d={`M${f1(mx)} ${f1(my)}a7 7 0 1 0 6.2 10.4a5.6 5.6 0 0 1-6.2-10.4Z`} className="cb-b-moon" />}
      {dots.map(([x, y, rr], i) => <circle key={i} cx={x} cy={y} r={rr} className="cb-b-dot" />)}
    </svg>
  );
}

const Moon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden className={cn('cb-moon', className)}><path d="M15.5 3.2a8.8 8.8 0 1 0 5.3 15.1A9.6 9.6 0 0 1 15.5 3.2Z" /></svg>
);

export function CobaltHeader({ page, slots }: { page: Page; slots: HeaderSlots }) {
  return (
    <>
      <Inks preset={page.theme.preset} />
      <PhotoExposure selector=".cb-print img, .cb-portrait .posy-avatar img" />
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
      <Print src={tile.src} alt={tile.alt} crop={cropStyle(tile)} />
      <figcaption><No index={index} />{tile.caption && <span>{tile.caption}</span>}</figcaption>
    </figure>
  );

  if (tile.type === 'video') {
    const id = youtubeId(tile.url);
    return (
      <div className="cb-plate cb-photo cb-video">
        <span className="cb-print cb-screen">
          {id ? <VideoPlayer id={id} title={tile.title} overlay={false} editing={editing} thumb={tile.image ? asset(tile.image) : undefined} crop={cropStyle(tile)} /> : m.image && <Img src={m.image} crop={cropStyle(tile)} />}
        </span>
        <p className="cb-cap"><Play aria-hidden className="cb-play" /><span>{m.title}</span></p>
      </div>
    );
  }

  if (tile.type === 'music') return (
    <div className="cb-plate cb-music">
      <span className="cb-record" aria-hidden>{m.image && <Print src={m.image} crop={cropStyle(tile)} />}</span>
      <div className="cb-text">
        <No index={index} />
        <b className="cb-title">{m.title}</b>
        <span className="cb-sub">{m.sub}</span>
      </div>
    </div>
  );

  if (tile.type === 'github') return (
    <div className="cb-plate cb-card cb-card-art">
      <span className="cb-art"><Burst seed={tile.id} kind="repo" /></span>
      <div className="cb-top"><No index={index} /><span className="cb-kind">Repository</span></div>
      <div className="cb-body">
        <b className="cb-title cb-mono">{tile.repo}</b>
        {tile.description && <p className="cb-sub">{tile.description}</p>}
        {(tile.stars !== undefined || tile.language) && (
          <span className="cb-meta">{tile.stars !== undefined && <><Star aria-hidden className="cb-star" />{compact(tile.stars)}</>}{tile.stars !== undefined && tile.language && ' · '}{tile.language}</span>
        )}
      </div>
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
    <article className={cn('cb-plate cb-card', pic ? 'cb-card-pic' : 'cb-card-art', m.kind === 'shop' && 'cb-shop')}>
      {!pic && <span className="cb-art"><Burst seed={tile.id} kind={m.kind === 'shop' ? 'shop' : 'link'} /></span>}
      <div className="cb-top"><No index={index} /><span className="cb-kind">{m.kind === 'shop' ? 'Editions' : m.kind === 'link' ? host : m.kind}</span></div>
      {pic && <Print src={m.image!} crop={cropStyle(tile)} />}
      <div className="cb-body">
        <b className="cb-title">{m.title}</b>
        {m.sub && m.sub !== m.title && m.sub !== host && <p className="cb-sub">{m.sub}</p>}
      </div>
      <span className="cb-go" aria-hidden><ArrowUpRight /></span>
    </article>
  );
}

export function CobaltRow({ tile, index }: { tile: Tile; index: number }) {
  const m = tileMeta(tile);
  if (tile.type === 'text') return <figure className="cb-verse cb-row-verse"><Moon /><blockquote><RichText text={tile.text} /></blockquote></figure>;
  if (tile.type === 'image') return (
    <figure className="cb-plate cb-photo cb-row-photo">
      <Print src={tile.src} alt={tile.alt} crop={cropStyle(tile)} />
      <figcaption><span className="cb-row-no">{roman(index + 1)}</span>{tile.caption && <span>{tile.caption}</span>}</figcaption>
    </figure>
  );
  return (
    <div className="cb-plate cb-row">
      <span className="cb-row-no">{roman(index + 1)}</span>
      {m.image ? <Print src={m.image} className="cb-row-pic" crop={cropStyle(tile)} /> : <span className="cb-art cb-row-pic"><Burst seed={tile.id} kind={tile.type === 'github' ? 'repo' : 'link'} /></span>}
      <span className="cb-text"><b className="cb-title">{m.title}</b>{m.sub && m.sub !== m.title && <span className="cb-sub">{m.sub}</span>}</span>
      <span className="cb-go" aria-hidden><ArrowUpRight /></span>
    </div>
  );
}
