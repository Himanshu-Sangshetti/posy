// Painted as a scene: your page as a quiet 90s Ghibli background painting, the same world as Posy's own site. One big
// summer sky (golden hour, dusk or a calm starry night with the palette), one paper kite, and your things on cream
// painted-paper cards, all of one family: links with their favicon, a clean title and the site; a calm player for
// music and video; photos in a simple mat; notes in a serif hand; the stamp note as a small vermilion seal.
// On a computer: you on the left, your things in two calm columns beside you. On a phone: one column under your card.
import { Fragment, type CSSProperties } from 'react';
import { ArrowUpRight, Music2, Play } from 'lucide-react';
import type { Page, Tile } from '@/lib/schema';
import { PLATFORMS } from '@/lib/platforms';
import { cropStyle } from '@/lib/crop';
import { asset, cn } from '@/lib/utils';
import { cleanTitle, hostOf, siteName, youtubeId } from '@/lib/url';
import { Favicon, SafeImg, VideoPlayer } from '../islands';
import { BrandIcon, RichText } from '../tiles';
import { compact, tileMeta } from './meta';
import { anatomy, Arrangements, SceneName, SceneTitle, type PieceFn, type SceneProps } from './scene';
import type { HeaderSlots } from './types';

type Of<T extends Tile['type']> = Extract<Tile, { type: T }>;
type LinkTile = Of<'link'> | Of<'github'>;
type MediaTile = Of<'music'> | Of<'video'>;

const Img = ({ src, className, crop }: { src: string; className?: string; crop?: CSSProperties }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={asset(src)} alt="" loading="lazy" draggable={false} className={className} style={crop} />
);
const plain = (s: string) => s.replace(/\*\*?|\[([^\]]+)\]\([^)]+\)/g, '$1');

/** What a link says, cleaned up: scraped titles split into a title and a line, plus the site's short name. */
export function linkInfo(tile: LinkTile) {
  if (tile.type === 'github') {
    const meta = [tile.stars !== undefined ? `★ ${compact(tile.stars)}` : '', tile.language ?? ''].filter(Boolean).join(' · ');
    return { url: `https://github.com/${tile.repo}`, title: tile.repo.split('/')[1] || tile.repo, sub: tile.description, site: `GitHub · ${tile.repo.split('/')[0]}`, meta, image: undefined as string | undefined };
  }
  const site = siteName(tile.url);
  const t = cleanTitle(tile.title || site, { site, description: tile.description });
  return { url: tile.url, title: t.title, sub: t.description ?? t.tagline, site: hostOf(tile.url), meta: '', image: tile.image };
}

/* ---------------- the card family ---------------- */

const Go = () => <span className="ptc-go" aria-hidden><ArrowUpRight /></span>;

/** A link. `big` is the one you lead with: its picture on the left, the words on the right. */
function LinkCard({ tile, big }: { tile: LinkTile; big?: boolean }) {
  const l = linkInfo(tile);
  const fav = <span className="ptc-fav"><Favicon url={l.url} /></span>;
  return (
    <div className={cn('ptc ptc-link', big && 'ptc-big', big && l.image && 'ptc-has-pic', !l.sub && 'ptc-nosub')}>
      {big && l.image && <span className="ptc-pic"><SafeImg src={asset(l.image)!} fallback={<span className="ptc-pic-blank">{fav}</span>} crop={cropStyle(tile)} /></span>}
      <div className="ptc-body">
        {fav}
        <div className="ptc-words">
          <b className="ptc-title">{l.title}</b>
          {l.sub && <span className="ptc-sub">{l.sub}</span>}
          {l.meta && <span className="ptc-meta">{l.meta}</span>}
        </div>
        <span className="ptc-site"><span>{l.site}</span><Go /></span>
      </div>
    </div>
  );
}

/** Music: the cover, the track, and a quiet player line. */
function MusicCard({ tile }: { tile: Of<'music'> }) {
  const m = tileMeta(tile);
  return (
    <div className="ptc ptc-music">
      <span className="ptc-cover">{m.image ? <Img src={m.image} crop={cropStyle(tile)} /> : <Music2 aria-hidden />}</span>
      <div className="ptc-words">
        <b className="ptc-title">{m.title}</b>
        <span className="ptc-sub">{m.sub}</span>
        <span className="ptc-player" aria-hidden><span className="ptc-play"><Play /></span><span className="ptc-line"><i /></span></span>
      </div>
    </div>
  );
}

/** Video: the picture, framed, and its title under it. */
function VideoCard({ tile, editing }: { tile: Of<'video'>; editing?: boolean }) {
  const m = tileMeta(tile);
  const id = youtubeId(tile.url);
  return (
    <div className="ptc ptc-video">
      <span className="ptc-screen">{id ? <VideoPlayer id={id} title={tile.title} overlay={false} editing={editing} thumb={tile.image ? asset(tile.image) : undefined} crop={cropStyle(tile)} /> : m.image && <Img src={m.image} crop={cropStyle(tile)} />}</span>
      <span className="ptc-caption"><b className="ptc-title">{m.title}</b><span className="ptc-sub">YouTube</span></span>
    </div>
  );
}

function MediaCard({ tile, editing }: { tile: MediaTile; editing?: boolean }) {
  return tile.type === 'music' ? <MusicCard tile={tile} /> : <VideoCard tile={tile} editing={editing} />;
}

/** A photo in a simple cream mat, with a small handwritten caption. */
function PhotoCard({ tile, tall }: { tile: Of<'image'>; tall?: boolean }) {
  return (
    <figure className={cn('ptc ptc-photo', tall && 'ptc-photo-tall')}>
      <span className="ptc-mat"><Img src={tile.src} crop={cropStyle(tile)} /></span>
      {tile.caption && <figcaption className="ptc-hand">{tile.caption}</figcaption>}
    </figure>
  );
}

/** A note, set in the serif like a line from a letter. */
function NoteCard({ tile }: { tile: Of<'text'> }) {
  const len = plain(tile.text).length;
  return <div className={cn('ptc ptc-note', len < 40 && 'ptc-note-short', len > 120 && 'ptc-note-long')}><p><RichText text={tile.text} /></p></div>;
}

/** The stamp note: a small vermilion seal with its words around the rim. */
function Seal({ tile }: { tile: Of<'text'> }) {
  const text = plain(tile.text).trim().toUpperCase();
  const size = Math.max(7.4, Math.min(11, 150 / Math.max(8, text.length)));
  const id = `pts-seal-${tile.id}`;
  return (
    <span className="ptc-seal">
      <svg viewBox="0 0 100 100" aria-label={plain(tile.text)}>
        <defs><path id={id} d="M50 84a34 34 0 1 1 0-68 34 34 0 1 1 0 68" /></defs>
        <circle className="ptc-seal-ring" cx="50" cy="50" r="22" />
        <path className="ptc-seal-mark" d="M50 39c2.6 4 2.6 7.4 0 11-2.6-3.6-2.6-7 0-11Zm0 22c-2.6-4-2.6-7.4 0-11 2.6 3.6 2.6 7 0 11Zm-11-11c4-2.6 7.4-2.6 11 0-3.6 2.6-7 2.6-11 0Zm22 0c-4 2.6-7.4 2.6-11 0 3.6-2.6 7-2.6 11 0Z" />
        <text style={{ fontSize: size }}><textPath href={`#${id}`} startOffset="50%" textAnchor="middle">{text}</textPath></text>
      </svg>
    </span>
  );
}

/** A social: a round cream button with the brand's mark in ink. */
function Social({ tile }: { tile: Of<'social'> }) {
  const p = PLATFORMS[tile.platform];
  return (
    <span className="ptc-social" style={{ '--brand': `#${p.icon?.hex ?? '6b7280'}` } as CSSProperties} title={p.label}>
      {p.icon?.path ? <BrandIcon path={p.icon.path} size={19} /> : <b>{tile.platform === 'email' ? '@' : 'in'}</b>}
    </span>
  );
}

/** You: your portrait, your name in the serif, your line, a small handwritten caption, and your socials. */
function Profile({ slots, socials, stamps, piece, nlen = 12, heading = true }: { slots: HeaderSlots; socials: Of<'social'>[]; stamps: Of<'text'>[]; piece: PieceFn; nlen?: number; heading?: boolean }) {
  return (
    <div className="ptc ptc-me" style={{ '--nlen': nlen } as CSSProperties}>
      {slots.avatar && <div className="ptc-portrait">{slots.avatar}</div>}
      <SceneName heading={heading} className="posy-head ptc-name">{slots.name}</SceneName>
      {slots.bio && <div className="ptc-bio">{slots.bio}</div>}
      {slots.caption && <p className="ptc-hand ptc-where">{slots.caption}</p>}
      {socials.length > 0 && <div className="ptc-socials">{socials.map(t => piece(t, <Social tile={t} />, { key: t.id, className: 'ptc-social-piece' }))}</div>}
      {stamps.length > 0 && <div className={cn('ptc-seals', stamps.length > 1 && 'ptc-seals-row')}>{stamps.map(t => piece(t, <Seal tile={t} />, { key: t.id, className: 'ptc-seal-piece' }))}</div>}
    </div>
  );
}

/** A section title: a handwritten label on a small paper tag, set between groups of cards. */
function Label({ text }: { text: string }) { return <h2 className="ptc-tag ptc-hand"><span>{text}</span></h2>; }

const Kite = ({ className }: { className?: string }) => <span className={cn('pts-kite', className)} aria-hidden><Img src="/looks/painted/kite.webp" /></span>;

/* ---------------- the scene ---------------- */

/** A row of the desktop grid: how many cards share it, and what kind. */
type Row = { kind: 'small' | 'feat'; items: Tile[] } | { kind: 'stack'; feature: Tile; items: Tile[] };

/** Splits n things into rows of three and two (never a lone one, unless there is only one). */
function split<T>(xs: T[]): T[][] {
  const rows: T[][] = [];
  let i = 0;
  while (xs.length - i > 0) {
    const left = xs.length - i;
    const take = left === 4 ? 2 : left >= 3 ? 3 : left;
    rows.push(xs.slice(i, i + take)); i += take;
  }
  return rows;
}

/** Photos, videos and long notes are the big pieces; links, music and short notes are the small ones. */
const isFeature = (t: Tile) => t.type === 'image' || t.type === 'video' || (t.type === 'text' && plain(t.text).length > 110);

/**
 * The desktop rows for one group: even rows on one six-column grid. Small cards go three or two to a row; big pieces
 * two or three to a row at one height; an odd big piece sits beside a stack of small cards so no row is left ragged.
 */
function rows(tiles: Tile[]): Row[] {
  const feats = tiles.filter(isFeature), smalls = tiles.filter(t => !isFeature(t));
  const out: Row[] = [];
  let stack: Row | undefined;
  if (feats.length && smalls.length && (feats.length % 2 === 1 || smalls.length === 1)) {
    const s = smalls.length;
    const k = s === 1 ? 1 : s === 2 || s === 4 ? 2 : 3;
    stack = { kind: 'stack', feature: feats.shift()!, items: smalls.splice(0, k) };
  }
  for (const r of split(smalls)) out.push({ kind: 'small', items: r });
  if (stack) out.push(stack);
  for (const r of split(feats)) out.push({ kind: 'feat', items: r });
  return out;
}

export function PaintedScene({ page, slots, piece, only, editing }: SceneProps) {
  const a = anatomy(page.tiles);
  type Group = (typeof a.groups)[number];
  const night = page.theme.preset === 'starry';
  const lead = a.links[0];

  const card = (t: Tile, cls?: string) => {
    const node = t.type === 'link' || t.type === 'github' ? <LinkCard tile={t} />
      : t.type === 'music' || t.type === 'video' ? <MediaCard tile={t} editing={editing} />
      : t.type === 'image' ? <PhotoCard tile={t} />
      : t.type === 'text' ? <NoteCard tile={t} /> : null;
    return piece(t, node, { key: t.id, className: cn('pts-card', `pts-card-${t.type}`, cls) });
  };
  const heading = (g: Group, cls?: string) => g.heading && piece(g.heading, <Label text={g.heading.text} />, { key: g.heading.id, className: cn('pts-label', cls) });
  const leadCard = (g: Group) => g.links[0] === lead && lead && piece(lead, <LinkCard tile={lead} big />, { key: lead.id, className: 'pts-card pts-lead' });
  const profile = <Profile slots={slots} socials={a.socials} stamps={a.stamps} piece={piece} nlen={page.profile.name.length} heading={!!only} />;

  const desktop = () => {
    // the first row: you, and beside you the link you lead with (one with a picture, if one of your first three has
    // one) over a pair of your next small cards; or your first picture when there are no links before a heading
    const first = a.groups[0] && !a.groups[0].heading ? a.groups[0] : undefined;
    const g0 = first ? [...first.links, ...first.media, ...first.photos, ...first.notes] : [];
    const firstLinks = first?.links ?? [];
    const top = firstLinks.slice(0, 3).find(t => t.type === 'link' && t.image) ?? firstLinks[0];
    let beside: Tile[] = [];
    let hero: Tile | undefined;
    if (top) {
      hero = top;
      beside = g0.filter(t => t !== top && !isFeature(t)).slice(0, 2);
    } else {
      hero = g0.find(t => t.type === 'image' || t.type === 'video');
    }
    const used = new Set<Tile>([...(hero ? [hero] : []), ...beside]);
    const heroNode = hero && (hero === top
      ? piece(hero, <LinkCard tile={hero as LinkTile} big />, { key: hero.id, className: 'pts-card pts-lead' })
      : card(hero, 'pts-hero-pic'));
    const row = (r: Row, i: number) => r.kind === 'stack'
      ? <div key={i} className={cn('pts-row pts-row-stack', `pts-stack-${r.items.length}`)}>{card(r.feature, 'pts-feat')}<div className="pts-stackcol">{r.items.map(t => card(t))}</div></div>
      : <div key={i} className={cn('pts-row', r.kind === 'feat' ? 'pts-row-feat' : 'pts-row-small', `pts-n-${r.items.length}`)}>{r.items.map(t => card(t, r.kind === 'feat' ? 'pts-feat' : undefined))}</div>;
    const few = page.tiles.filter(t => t.type !== 'social' && t.type !== 'heading').length <= 4;
    return (
      <div className={cn('pts pts-desk', night && 'pts-night', few && 'pts-few')}>
        <Kite className="pts-kite-d" />
        <div className={cn('pts-head', !hero && 'pts-head-alone')}>
          {profile}
          {hero && (
            <div className={cn('pts-beside', beside.length === 0 && 'pts-beside-solo')}>
              {heroNode}
              {beside.length > 0 && <div className={cn('pts-pair', `pts-n-${beside.length}`)}>{beside.map(t => card(t))}</div>}
            </div>
          )}
        </div>
        {a.groups.map((g, gi) => {
          const rest = [...g.links, ...g.media, ...g.photos, ...g.notes].filter(t => !used.has(t));
          if (!g.heading && !rest.length) return null;
          return (
            <section key={g.heading?.id ?? `g${gi}`} className="pts-group">
              {heading(g)}
              {rows(rest).map(row)}
            </section>
          );
        })}
      </div>
    );
  };

  const mobile = () => (
    <div className={cn('pts pts-phone', night && 'pts-night')}>
      <Kite className="pts-kite-m" />
      {profile}
      <div className="pts-stack">
        {a.groups.map((g, gi) => (
          <Fragment key={g.heading?.id ?? `g${gi}`}>
            {heading(g)}
            {leadCard(g)}
            {g.links.filter(t => t !== lead).map(t => card(t))}
            {g.media.map(t => card(t))}
            {g.photos.length > 0 && <div className={cn('pts-photos', g.photos.length === 1 && 'pts-photos-one')}>{g.photos.map(t => card(t))}</div>}
            {g.notes.map(t => card(t))}
          </Fragment>
        ))}
      </div>
    </div>
  );

  return <>{!only && <SceneTitle name={page.profile.name} />}<Arrangements only={only} desktop={desktop} mobile={mobile} /></>;
}

/** The kit on its own, for the component lab. */
export { LinkCard as PaintedLink, MusicCard as PaintedMusic, VideoCard as PaintedVideo, PhotoCard as PaintedPhoto, NoteCard as PaintedNote, Seal as PaintedSeal, Social as PaintedSocial, Profile as PaintedProfile };

/* ---------------- canvas: the same kit, one card per box ---------------- */

/** Canvas layout: you, on one wide cream card (the editor passes its inputs in `slots`). */
export function PaintedCanvasHeader({ page, slots }: { page: Page; slots: HeaderSlots }) {
  return (
    <div className={cn('pts ptv-head', page.theme.preset === 'starry' && 'pts-night')} style={{ '--nlen': page.profile.name.length } as CSSProperties}>
      <div className="ptc ptc-me ptc-me-wide">
        {slots.avatar && <div className="ptc-portrait">{slots.avatar}</div>}
        <div className="ptc-me-words">
          <h1 className="posy-head ptc-name">{slots.name}</h1>
          {slots.bio && <div className="ptc-bio">{slots.bio}</div>}
          {slots.caption && <p className="ptc-hand ptc-where">{slots.caption}</p>}
        </div>
        {slots.socials && <div className="ptc-socials ptv-socials">{slots.socials}</div>}
      </div>
    </div>
  );
}

/** Canvas layout: one tile in Painted's kit, filling the box the canvas gives it. */
export function PaintedCanvasTile({ tile, editing }: { tile: Tile; index: number; editing?: boolean }) {
  let node: React.ReactNode = null;
  if (tile.type === 'link' || tile.type === 'github') node = <LinkCard tile={tile} big={tile.type === 'link' && !!tile.image} />;
  else if (tile.type === 'music') node = <MusicCard tile={tile} />;
  else if (tile.type === 'video') node = <VideoCard tile={tile} editing={editing} />;
  else if (tile.type === 'image') node = <PhotoCard tile={tile} />;
  else if (tile.type === 'text') node = tile.look === 'stamp' ? <span className="ptv-seal"><Seal tile={tile} /></span> : <NoteCard tile={tile} />;
  else if (tile.type === 'social') {
    const p = PLATFORMS[tile.platform];
    node = <div className="ptc ptv-social"><Social tile={tile} /><span className="ptc-words"><b className="ptc-title">{p.label}</b><span className="ptc-sub">{tile.handle}</span></span><Go /></div>;
  }
  return <div className={cn('pts ptv', `ptv-${tile.type}`)}>{node}</div>;
}
