// Desk as a scene: your things laid out on a sunny desk, seen from above.
// On a computer it's the whole desk at once: a letter with your polaroid clipped to it and enamel pins along its edge,
// your links as a bundle of luggage tags, a postcard, an envelope, an index card; a record in its sleeve, photos taped
// down, a sticky note, an ink stamp on the letter, and a coffee, a plant and a pen. On a phone you scroll down the
// same desk: the same objects, bigger, in one composed column.
import type { CSSProperties, ReactNode } from 'react';
import type { Tile } from '@/lib/schema';
import { PLATFORMS } from '@/lib/platforms';
import { asset, cn } from '@/lib/utils';
import { cropStyle } from '@/lib/crop';
import { cleanTitle, hostOf, siteName, youtubeId } from '@/lib/url';
import { DeskObjects, Favicon, SafeImg, VideoPlayer } from '../islands';
import { BrandIcon, RichText } from '../tiles';
import { compact, tileMeta } from './meta';
import { anatomy, Arrangements, type SceneProps } from './scene';

type Of<K extends Tile['type']> = Extract<Tile, { type: K }>;
type LinkTile = Of<'link'> | Of<'github'>;
type Media = Of<'music'> | Of<'video'>;

const Img = ({ src, className, crop }: { src: string; className?: string; crop?: CSSProperties }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={asset(src)} alt="" loading="lazy" draggable={false} className={className} style={crop} />
);

/** A small, stable number per tile, so things look placed by hand but never move between renders. */
function hash(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return (h >>> 0) % 1000 / 1000; }
const tilt = (id: string, spread: number, bias = 0) => Math.round(((hash(id) * 2 - 1) * spread + bias) * 10) / 10;

/** The colour of a piece of paper: the tile's chosen colour, or the object's own. */
function paperOf(tile: Tile, own: string) {
  const c = tile.color;
  if (c === 'auto') return own;
  if (c === 'surface') return '#fbf8f1';
  if (c === 'accent') return 'color-mix(in oklab, var(--accent) 34%, #fbf6ec)';
  return `color-mix(in oklab, var(--tint-${c}) 80%, #fbf6ec)`;
}

const NEWSLETTER = /(^|\.)(substack\.com|buttondown\.(email|com)|beehiiv\.com|kit\.com|convertkit\.com|ghost\.io|mailchimp\.com|list-manage\.com|mailerlite\.com|tinyletter\.com|letterdrop\.com|bearblog\.dev)$/;
const SHOP = /(^|\.)(gumroad\.com|etsy\.com|myshopify\.com|bigcartel\.com|ko-fi\.com|lemonsqueezy\.com|payhip\.com|storenvy\.com)$|^shop\./;

/** What a link says: a clean title, a line under it, and the site, the way you'd write it on a tag. */
function words(tile: LinkTile) {
  if (tile.type === 'github') {
    const [owner, repo] = tile.repo.split('/');
    return { title: repo || tile.repo, sub: tile.description, site: `github.com/${owner}`, url: `https://github.com/${tile.repo}` };
  }
  const site = siteName(tile.url);
  const c = cleanTitle(tile.title || site, { site, description: tile.description });
  return { title: c.title, sub: c.description ?? c.tagline, site: hostOf(tile.url), url: tile.url };
}

/** Which object a link becomes on the desk. */
export function linkObject(tile: LinkTile, featured: boolean): 'card' | 'envelope' | 'postcard' | 'tag' {
  if (tile.type === 'github') return 'card';
  const host = hostOf(tile.url);
  if (NEWSLETTER.test(host)) return 'envelope';
  if (featured && tile.image) return 'postcard';
  return 'tag';
}

/** Text running round a circle (stamps and postmarks). Ids are unique per arrangement, since the page draws both. */
function Ring({ text, uid, r = 70, size = 13 }: { text: string; uid: string; r?: number; size?: number }) {
  const id = `dks-ring-${uid}`;
  return (
    <svg viewBox="0 0 200 200" aria-hidden className="dks-ring">
      <defs><path id={id} d={`M100,100 m-${r},0 a${r},${r} 0 1,1 ${r * 2},0 a${r},${r} 0 1,1 -${r * 2},0`} /></defs>
      <text fontSize={size}><textPath href={`#${id}`} textLength={Math.round(2 * Math.PI * r) - 4} lengthAdjust="spacing">{text}</textPath></text>
    </svg>
  );
}

/** Shared SVG bits: the ink texture rubber stamps and postmarks are printed with. Drawn once per page. */
export function DeskDefs() {
  return (
    <svg aria-hidden width="0" height="0" style={{ position: 'absolute' }}>
      <filter id="dks-ink" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.2 2.35" result="m" />
        <feComposite in="SourceGraphic" in2="m" operator="in" />
      </filter>
    </svg>
  );
}

/* ---------------- the objects ---------------- */

/** You: a letter on good paper with your polaroid clipped to it. Pins go along its edge, a stamp on its corner. */
function Letter({ slots, pins, stamp, uid }: { slots: SceneProps['slots']; pins?: ReactNode; stamp?: ReactNode; uid: string }) {
  return (
    <div className={cn('dks-letter', !slots.avatar && 'dks-letter-solo')} data-uid={uid}>
      <div className="dks-sheet">
        <span className="dks-type dks-from" aria-hidden>From the desk of</span>
        <h1 className="posy-head dks-name">{slots.name}</h1>
        {slots.bio && <div className="dks-bio">{slots.bio}</div>}
        {!slots.avatar && slots.caption && <div className="dks-hand dks-sign">{slots.caption}</div>}
      </div>
      {slots.avatar && (
        <div className="dks-me">
          <div className="dks-me-pic">{slots.avatar}</div>
          {slots.caption && <div className="dks-hand dks-me-cap">{slots.caption}</div>}
          <PaperClip />
        </div>
      )}
      {stamp && <div className="dks-letter-stamp">{stamp}</div>}
      {pins && <div className="dks-pins">{pins}</div>}
    </div>
  );
}

const PaperClip = () => (
  <svg className="dks-clip" viewBox="0 0 28 84" aria-hidden>
    <path d="M9 22 V66 a6.5 6.5 0 0 0 13 0 V14 a9 9 0 0 0 -18 0 V60" fill="none" stroke="url(#dks-steel)" strokeWidth="2.6" strokeLinecap="round" />
    <defs><linearGradient id="dks-steel" x1="0" x2="1"><stop offset="0" stopColor="#8d949c" /><stop offset=".45" stopColor="#eef1f4" /><stop offset="1" stopColor="#7c838c" /></linearGradient></defs>
  </svg>
);

/** A social profile: an enamel pin in the platform's colour. */
function Pin({ tile }: { tile: Of<'social'> }) {
  const p = PLATFORMS[tile.platform];
  return (
    <span className="dks-obj dks-pin" style={{ '--brand': `#${p.icon?.hex ?? '6b5d4f'}` } as CSSProperties} title={p.label}>
      <span className="dks-pin-face">{p.icon?.path ? <BrandIcon path={p.icon.path} size={22} /> : <b>{tile.platform === 'email' ? '@' : 'in'}</b>}</span>
    </span>
  );
}

/** A link with no picture: a manila luggage tag on a loop of twine, typed, with the site written on in pen. */
function Tag({ tile, big }: { tile: LinkTile; big?: boolean }) {
  const w = words(tile);
  const kraft = tile.type === 'link' && SHOP.test(hostOf(tile.url));
  return (
    <div className={cn('dks-obj dks-tag', big && 'dks-tag-big', kraft && 'dks-tag-kraft')} style={{ '--paper': paperOf(tile, kraft ? '#c99d6b' : '#ecd6a4') } as CSSProperties}>
      <svg className="dks-twine" viewBox="0 0 80 60" aria-hidden><path d="M60 30 C 40 12, 14 6, 6 22 C 0 36, 22 50, 44 40 C 52 36, 58 33, 60 30" /></svg>
      <div className="dks-tag-paper">
        <span className="dks-eyelet" aria-hidden />
        <span className="dks-tag-text">
          <b className="dks-type">{w.title}</b>
          {big && w.sub && <span className="dks-tag-sub">{w.sub}</span>}
          <span className="dks-hand dks-pen">{w.site}</span>
        </span>
        <span className="dks-fav" aria-hidden><Favicon url={w.url} /></span>
      </div>
    </div>
  );
}

/** A link with a picture: a postcard, with its title typed on a slip of paper taped across the corner. */
function Postcard({ tile }: { tile: Of<'link'> }) {
  const w = words(tile);
  // no picture (or it's gone): the back of the postcard, with the site's icon as its stamp
  const blank = (
    <span className="dks-post-blank">
      {w.sub && <span className="dks-hand dks-pen dks-post-msg">{w.sub}</span>}
      <span className="dks-post-fav"><Favicon url={w.url} /></span>
      <span className="dks-hand dks-pen dks-post-to">{w.site}</span><i />
    </span>
  );
  return (
    <div className="dks-obj dks-post">
      <div className="dks-post-card">{tile.image ? <SafeImg src={asset(tile.image)!} className="dks-post-img" fallback={blank} crop={cropStyle(tile)} /> : blank}</div>
      <div className="dks-slip">
        <b className="dks-type">{w.title}</b>
        {w.sub && <span className="dks-slip-sub">{w.sub}</span>}
        <span className="dks-hand dks-pen">{w.site}</span>
        <i className="dks-tape" aria-hidden />
      </div>
    </div>
  );
}

/** A newsletter: an airmail envelope with a stamp and a postmark; the letter slides out when you reach for it. */
function Envelope({ tile, uid }: { tile: Of<'link'>; uid: string }) {
  const w = words(tile);
  const fav = <span className="dks-env-fav">{siteName(w.url).replace(/^www\./, '').charAt(0).toUpperCase()}</span>;
  return (
    <div className="dks-obj dks-env" style={{ '--paper': paperOf(tile, '#f6efe1') } as CSSProperties}>
      <div className="dks-env-letter" aria-hidden />
      <div className="dks-env-body">
        <div className="dks-env-stamp">{tile.image ? <SafeImg src={asset(tile.image)!} fallback={fav} crop={cropStyle(tile)} /> : fav}</div>
        <div className="dks-postmark"><Ring text={`${siteName(w.url).toUpperCase()} ✦ AIR MAIL ✦ `} uid={`pm-${uid}`} r={62} size={17} /><span /><svg className="dks-waves" viewBox="0 0 120 40" aria-hidden>{[6, 16, 26, 36].map(y => <path key={y} d={`M0 ${y} q 7.5 -6 15 0 t 15 0 t 15 0 t 15 0 t 15 0 t 15 0 t 15 0 t 15 0`} />)}</svg></div>
        <div className="dks-env-to">
          <b className="dks-type">{w.title}</b>
          {w.sub && <span className="dks-hand dks-pen">{w.sub}</span>}
        </div>
      </div>
    </div>
  );
}

/** A repository: a ruled index card, typed, with notes in pen. */
function IndexCard({ tile }: { tile: LinkTile }) {
  const w = words(tile);
  const g = tile.type === 'github' ? tile : null;
  return (
    <div className="dks-obj dks-card">
      <b className="dks-type">{w.title}</b>
      {w.sub && <p className="dks-hand dks-pen">{w.sub}</p>}
      <span className="dks-card-foot dks-type">
        <span>{g?.repo ?? w.site}</span>
        {g && (g.stars !== undefined || g.language) && <span>{g.stars !== undefined && `★ ${compact(g.stars)}`}{g.stars !== undefined && g.language && '  '}{g.language}</span>}
      </span>
    </div>
  );
}

/** Any link, as the object it is. */
function LinkObject({ tile, featured, uid }: { tile: LinkTile; featured?: boolean; uid: string }) {
  const o = linkObject(tile, !!featured);
  if (o === 'card') return <IndexCard tile={tile} />;
  if (o === 'envelope') return <Envelope tile={tile as Of<'link'>} uid={uid} />;
  if (o === 'postcard') return <Postcard tile={tile as Of<'link'>} />;
  return <Tag tile={tile} big={featured} />;
}

/** Music: a record half out of its sleeve, with the title on a strip of masking tape. */
function Record({ tile }: { tile: Of<'music'> }) {
  const m = tileMeta(tile);
  return (
    <div className={cn('dks-obj dks-rec', !m.image && 'dks-rec-plain')} style={{ '--paper': paperOf(tile, '#d9b98c') } as CSSProperties}>
      <span className="dks-vinyl" aria-hidden><i /></span>
      <span className="dks-sleeve">{m.image ? <Img src={m.image} crop={cropStyle(tile)} /> : <span className="dks-sleeve-hole" />}</span>
      <span className="dks-mtape"><b className="dks-hand">{m.title}</b>{tile.artist && <span className="dks-type">{tile.artist}</span>}</span>
    </div>
  );
}

/** A video: a cinema ticket with a still from it; tap to play. */
function Ticket({ tile, editing }: { tile: Of<'video'>; editing?: boolean }) {
  const m = tileMeta(tile);
  const id = youtubeId(tile.url);
  return (
    <div className="dks-obj dks-ticket" style={{ '--paper': paperOf(tile, '#f1d9c4') } as CSSProperties}>
      <div className="dks-ticket-main">
        <div className={cn('dks-ticket-pic', id && !tile.image && 'dks-ticket-yt')}>{id ? <VideoPlayer id={id} title={tile.title} overlay={false} editing={editing} thumb={tile.image ? asset(tile.image) : undefined} crop={cropStyle(tile)} /> : m.image && <Img src={m.image} crop={cropStyle(tile)} />}</div>
        <b className="dks-type">{m.title}</b>
      </div>
      <div className="dks-ticket-stub" aria-hidden><i className="dks-punch" /><i className="dks-barcode" /></div>
    </div>
  );
}

function Media({ tile, editing }: { tile: Media; editing?: boolean }) {
  return tile.type === 'music' ? <Record tile={tile} /> : <Ticket tile={tile} editing={editing} />;
}

/** A photo: a polaroid taped down, captioned by hand. Wide photos are wide prints. */
function Polaroid({ tile }: { tile: Of<'image'> }) {
  const wide = tile.size === 'w' || tile.size === 'l';
  return (
    <div className={cn('dks-obj dks-pol', wide && 'dks-pol-wide')}>
      <i className="dks-tape" aria-hidden />
      <div className="dks-pol-pic"><Img src={tile.src} crop={cropStyle(tile)} /></div>
      <div className="dks-hand dks-pol-cap">{tile.caption}</div>
    </div>
  );
}

/** A note: a sticky note in your handwriting. */
function Sticky({ tile }: { tile: Of<'text'> }) {
  return (
    <div className={cn('dks-obj dks-sticky', tile.text.length <= 24 && 'dks-sticky-short')} style={{ '--paper': paperOf(tile, '#fbe48a') } as CSSProperties}>
      <p className="dks-hand"><RichText text={tile.text} /></p>
    </div>
  );
}

/** A section heading: a strip of masking tape, labelled by hand. */
function Label({ tile }: { tile: Of<'heading'> }) {
  return <h2 className="dks-obj dks-label"><span className="dks-hand">{tile.text}</span></h2>;
}

/** A stamp: a rubber stamp pressed in ink, its words round the edge. */
function InkStamp({ tile, uid }: { tile: Of<'text'>; uid: string }) {
  const text = tile.text.replace(/[*[\]]|\(https?:[^)]+\)/g, '').trim().toUpperCase();
  let ring = `${text} ✦ `;
  while (ring.length < 34) ring += `${text} ✦ `;
  const ink = tile.color === 'auto' ? undefined : tile.color === 'accent' ? 'var(--accent)' : `color-mix(in oklab, var(--tint-${tile.color}) 30%, #3a2f6b)`;
  return (
    <div className="dks-obj dks-stamp" style={ink ? { '--ink-c': ink } as CSSProperties : undefined}>
      <span className="dks-stamp-ink">
        <Ring text={ring} uid={`st-${uid}`} r={70} size={ring.length > 44 ? 13 : 15.5} />
        <span className="dks-stamp-star" aria-hidden>✦</span>
      </span>
      <span className="sr-only">{tile.text}</span>
    </div>
  );
}

/** Your initials, as they'd be tooled in gold on a leather desk pad. */
const monogram = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 3).map(w => w[0].toUpperCase()).join('·');

/** Things on the desk that aren't yours to click: a coffee, a plant, a pen. */
function Prop({ name, className }: { name: string; className?: string }) {
  return <Img src={`/looks/desk/${name}.webp`} className={cn('dks-prop', `dks-prop-${name}`, className)} />;
}

/* ---------------- the desk ---------------- */

/** How many of the desk's 12 columns each kind of object takes on the computer. */
const SPAN = { postcard: 5, envelope: 5, card: 4, tag: 4, bigtag: 6, stack: 4, bigstack: 5, record: 5, ticket: 5, photo: 3, wide: 4, note: 3, stamp: 2 } as const;
type CellKind = keyof typeof SPAN;
type Cell = { key: string; kind: CellKind; node: ReactNode };

/**
 * Splits a run of objects, in order, into rows of at most 12 columns: rows as full as possible, fewest rows,
 * and never a small thing left alone on its own row. Each row then stretches to the full width in CSS.
 */
function rowsOf(cells: Cell[]): Cell[][] {
  const n = cells.length, best = Array<number>(n + 1).fill(Infinity), cut = Array<number>(n + 1).fill(0);
  best[0] = 0;
  for (let i = 1; i <= n; i++) {
    let s = 0;
    for (let j = i - 1; j >= 0; j--) {
      s += SPAN[cells[j].kind];
      if (s > 12 && j < i - 1) break;
      const lone = i - j === 1 && SPAN[cells[j].kind] <= 4 ? 50 : 0;
      const cost = best[j] + (12 - Math.min(s, 12)) ** 2 + lone + 10;
      if (cost < best[i]) { best[i] = cost; cut[i] = j; }
    }
  }
  const rows: Cell[][] = [];
  for (let i = n; i > 0; i = cut[i]) rows.unshift(cells.slice(cut[i], i));
  return rows;
}

/** n things in piles of at most `max`, as even as possible (5 → 3 + 2). */
function piles<T>(ts: T[], max: number): T[][] {
  const k = Math.ceil(ts.length / max), out: T[][] = [];
  for (let i = 0, at = 0; i < k; i++) { const size = Math.ceil((ts.length - at) / (k - i)); out.push(ts.slice(at, at + size)); at += size; }
  return out;
}

export function DeskScene({ page, slots, piece, only, editing }: SceneProps) {
  const a = anatomy(page.tiles);
  const featured = a.links.slice(0, 2);
  const [stamp] = a.stamps;
  const rot = (t: Tile, spread: number, bias = 0) => ({ '--r': `${tilt(t.id, spread, bias)}deg` }) as CSSProperties;
  // each piece drops onto the desk in turn
  let n = 0;
  const at = (t: Tile, spread: number, bias = 0) => ({ ...rot(t, spread, bias), '--dks-i': n++ }) as CSSProperties;

  const pins = (uid: string) => a.socials.length > 0 && a.socials.map(t => piece(t, <Pin tile={t} />, { key: `${uid}-${t.id}`, className: 'dks-p-pin', style: at(t, 10) }));
  const stampPiece = (uid: string) => stamp && piece(stamp, <InkStamp tile={stamp} uid={`${uid}-${stamp.id}`} />, { key: stamp.id, className: 'dks-p-stamp', style: at(stamp, 8, -6) });
  const smallThing = (t: Tile, uid: string) =>
    t.type === 'image' ? <Polaroid tile={t} /> : t.type === 'text' && t.look === 'stamp' ? <InkStamp tile={t} uid={`${uid}-${t.id}`} /> : t.type === 'text' ? <Sticky tile={t} /> : t.type === 'music' || t.type === 'video' ? <Media tile={t} editing={editing} /> : null;
  const kindOf = (t: Tile) => t.type === 'image' ? ((t.size === 'w' || t.size === 'l') ? 'wide' : 'photo') : t.type === 'text' ? (t.look === 'stamp' ? 'stamp' : 'note') : t.type === 'music' ? 'record' : 'ticket';
  const label = (h: Of<'heading'>) => piece(h, <Label tile={h} />, { key: h.id, className: 'dks-p-label', style: at(h, 1.8, -1) });

  const desktop = () => {
    n = 0;
    // A styled flat-lay: the letter and one hero object across the top, then each section as even rows on a
    // 12-column grid with one gutter. Objects lie squared to the grid; the props sit at the edges of the desk.
    const feat = new Set(featured.map(t => t.id));
    const sq = (t: Tile, spread = .7) => at(t, spread);
    const linkPiece = (t: LinkTile, big: boolean) =>
      piece(t, <LinkObject tile={t} featured={big} uid={`d-${t.id}`} />, { key: t.id, className: cn(big ? 'dks-p-feat' : 'dks-p-link', `dks-p-${linkObject(t, big)}`), style: sq(t, .5) });
    const thingPiece = (t: Tile) => piece(t, smallThing(t, 'd'), { key: t.id, className: `dks-p-${kindOf(t)}`, style: sq(t, kindOf(t) === 'note' ? 1.6 : .8) });

    // the hero: the most picture-like thing before the first heading (a postcard, an envelope, an index card,
    // the first one or two tags written large, or a record, a ticket or a photo)
    const g0 = a.groups[0] && !a.groups[0].heading ? a.groups[0] : undefined;
    const used = new Set<string>();
    let hero: ReactNode = null, heroKind = '';
    if (g0) {
      const ls = g0.links;
      const pick = ls.find(t => linkObject(t, true) === 'postcard') ?? ls.find(t => linkObject(t, true) === 'envelope') ?? ls.find(t => linkObject(t, true) === 'card');
      const thing = g0.media[0] ?? g0.photos.find(p => kindOf(p) === 'wide') ?? g0.photos[0];
      if (pick) { hero = linkPiece(pick, true); heroKind = linkObject(pick, true); used.add(pick.id); }
      else if (ls.length) { const two = ls.slice(0, 2); hero = two.map(t => linkPiece(t, true)); heroKind = 'tags'; two.forEach(t => used.add(t.id)); }
      else if (thing) { hero = thingPiece(thing); heroKind = kindOf(thing); used.add(thing.id); }
    }

    const cellsOf = (g: (typeof a.groups)[number]): Cell[] => {
      const links = g.links.filter(t => !used.has(t.id));
      const things = [...g.media, ...g.photos, ...g.notes, ...g.stamps.filter(t => t !== stamp)].filter(t => !used.has(t.id));
      const big = (t: LinkTile) => feat.has(t.id);
      const isTag = (t: LinkTile) => linkObject(t, big(t)) === 'tag';
      const others = links.filter(t => !isTag(t)).length + things.length;
      // next to other objects, tags lie in neat piles of up to three; on their own they lie side by side
      const pileOf = new Map<string, LinkTile[]>();
      if (others > 0) for (const p of piles(links.filter(isTag), 3)) pileOf.set(p[0].id, p);
      const inPile = new Set([...pileOf.values()].flat().map(t => t.id));
      const cells: Cell[] = [];
      for (const t of links) {
        const p = pileOf.get(t.id);
        if (p && p.length > 1) cells.push({ key: `pile-${t.id}`, kind: 'stack', node: <div className="dks-stack">{p.map(x => linkPiece(x, big(x)))}</div> });
        else if (p || !inPile.has(t.id)) {
          const o = linkObject(t, big(t));
          cells.push({ key: t.id, kind: o === 'tag' ? (big(t) ? 'bigtag' : 'tag') : o, node: linkPiece(t, big(t)) });
        }
      }
      for (const t of things) cells.push({ key: t.id, kind: kindOf(t), node: thingPiece(t) });
      return cells;
    };
    const row = (cells: Cell[], key: string) => (
      <div key={key} className="dks-row">
        {cells.map(c => <div key={c.key} className={cn('dks-cell', `dks-c-${c.kind}`)} style={{ '--s': SPAN[c.kind] } as CSSProperties}>{c.node}</div>)}
      </div>
    );

    return (
      <div className="dks-desk">
        <Prop name="coffee" className="dks-d-coffee" />
        <Prop name="pen" className="dks-d-pen" />
        <Prop name="plant" className="dks-d-plant" />
        <Prop name="camera" className="dks-d-camera" />
        <div className={cn('dks-head', !hero && 'dks-head-solo')}>
          <Letter slots={slots} uid="d" pins={pins('d')} stamp={stampPiece('d')} />
          {hero && <div className={cn('dks-hero', `dks-hero-${heroKind}`)}>{hero}</div>}
        </div>
        {a.groups.map((g, gi) => [
          g.heading && <div key={`h-${g.heading.id}`} className="dks-row dks-row-label">{label(g.heading)}</div>,
          ...rowsOf(cellsOf(g)).map((r, ri) => row(r, `r-${gi}-${ri}`)),
        ])}
        {!editing && <DeskObjects />}
      </div>
    );
  };

  const mobile = () => {
    n = 0;
    // one section after another, each as its links and then its things, the way the page was written
    const feat = new Set(featured.map(t => t.id));
    const pairsOf = (ts: Tile[]) => {
      const pairs: Tile[][] = [];
      for (const t of ts) {
        const k = kindOf(t), last = pairs[pairs.length - 1];
        const small = k === 'note' || k === 'stamp' || k === 'photo';
        if (small && last && last.length === 1 && ['note', 'stamp', 'photo'].includes(kindOf(last[0]))) last.push(t);
        else pairs.push([t]);
      }
      return pairs;
    };
    return (
      <div className="dks-phone">
        <Prop name="coffee" className="dks-m-coffee" />
        <Letter slots={slots} uid="m" pins={pins('m')} stamp={stampPiece('m')} />
        {a.groups.map((g, gi) => {
          const things = [...g.media, ...g.photos, ...g.notes, ...g.stamps.filter(t => t !== stamp)];
          return [
            g.heading && label(g.heading),
            g.links.length > 0 && (
              <div key={`links-${gi}`} className="dks-m-links">
                {g.links.map(t => feat.has(t.id)
                  ? piece(t, <LinkObject tile={t} featured uid={`m-${t.id}`} />, { key: t.id, className: cn('dks-p-feat', `dks-p-${linkObject(t, true)}`), style: at(t, 1.6) })
                  : piece(t, <LinkObject tile={t} featured={false} uid={`m-${t.id}`} />, { key: t.id, className: cn('dks-p-link', `dks-p-${linkObject(t, false)}`), style: at(t, 1.4) }))}
              </div>
            ),
            ...pairsOf(things).map(r => (
              <div key={r[0].id} className={cn('dks-m-row', r.length > 1 && 'dks-row-pair')}>
                {r.map(t => piece(t, smallThing(t, 'm'), { key: t.id, className: `dks-p-${kindOf(t)}`, style: at(t, kindOf(t) === 'note' ? 4 : 3) }))}
              </div>
            )),
          ];
        })}
        <Prop name="sprig" className="dks-m-sprig" />
      </div>
    );
  };

  return (
    <div className="dks">
      <DeskDefs />
      <span className="dks-lamp" aria-hidden />
      <Arrangements only={only} desktop={desktop} mobile={mobile} />
    </div>
  );
}

/** The kit on its own, for the component lab. */
export { Letter as DeskLetter, Pin as DeskPin, Tag as DeskTag, Postcard as DeskPostcard, Envelope as DeskEnvelope, IndexCard as DeskIndexCard, Record as DeskRecord, Ticket as DeskTicket, Polaroid as DeskPolaroid, Sticky as DeskSticky, InkStamp as DeskInkStamp, LinkObject as DeskLinkObject, Prop as DeskProp };

/* ---------------- the canvas: the header and one object per box ---------------- */

/** Canvas header: the same letter, with your polaroid clipped to it and your profiles as enamel pins along its edge. */
export function DeskCanvasHeader({ slots }: { slots: SceneProps['slots'] }) {
  return (
    <div className="dks dkc-head">
      <DeskDefs />
      <Letter slots={slots} uid="cv" pins={slots.socials ?? undefined} />
    </div>
  );
}

/** Canvas tile: one object, as large as its box allows at its own shape, lying square in the middle of it. */
export function DeskCanvasTile({ tile, editing }: { tile: Tile; index: number; editing?: boolean }) {
  const uid = `cv-${tile.id}`;
  const big = tile.size !== 's';
  let kind: string, node: ReactNode;
  switch (tile.type) {
    case 'link': case 'github': kind = linkObject(tile, big); node = <LinkObject tile={tile} featured={big} uid={uid} />; break;
    case 'music': kind = 'record'; node = <Record tile={tile} />; break;
    case 'video': kind = 'ticket'; node = <Ticket tile={tile} editing={editing} />; break;
    case 'image': kind = 'photo'; node = <Polaroid tile={tile} />; break;
    case 'text': kind = tile.look === 'stamp' ? 'stamp' : 'note'; node = tile.look === 'stamp' ? <InkStamp tile={tile} uid={uid} /> : <Sticky tile={tile} />; break;
    case 'social': kind = 'pin'; node = <Pin tile={tile} />; break;
    case 'heading': kind = 'label'; node = <Label tile={tile} />; break;
  }
  return <div className={cn('dks dkc', `dkc-${kind}`)}><div className="sc-piece dkc-box">{node}</div></div>;
}
