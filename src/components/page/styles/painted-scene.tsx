// Painted as a scene: your page as a quiet 90s Ghibli background painting, the same world as Posy's own site. One big
// summer sky (golden hour, dusk or a calm starry night with the palette), one paper kite, and your things on cream
// painted-paper cards, all of one family: links with their favicon, a clean title and the site; a calm player for
// music and video; photos in a simple mat; notes in a serif hand; the stamp note as a small vermilion seal.
// On a computer: you on the left, your things in two calm columns beside you. On a phone: one column under your card.
import type { CSSProperties } from 'react';
import { ArrowUpRight, Music2, Play } from 'lucide-react';
import type { Tile } from '@/lib/schema';
import { PLATFORMS } from '@/lib/platforms';
import { asset, cn } from '@/lib/utils';
import { cleanTitle, hostOf, siteName, youtubeId } from '@/lib/url';
import { Favicon, SafeImg, VideoPlayer } from '../islands';
import { BrandIcon, RichText } from '../tiles';
import { compact, tileMeta } from './meta';
import { anatomy, Arrangements, type PieceFn, type SceneProps } from './scene';
import type { HeaderSlots } from './types';

type Of<T extends Tile['type']> = Extract<Tile, { type: T }>;
type LinkTile = Of<'link'> | Of<'github'>;
type MediaTile = Of<'music'> | Of<'video'>;

const Img = ({ src, className }: { src: string; className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={asset(src)} alt="" loading="lazy" draggable={false} className={className} />
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
      {big && l.image && <span className="ptc-pic"><SafeImg src={asset(l.image)!} fallback={<span className="ptc-pic-blank">{fav}</span>} /></span>}
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
      <span className="ptc-cover">{m.image ? <Img src={m.image} /> : <Music2 aria-hidden />}</span>
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
      <span className="ptc-screen">{id ? <VideoPlayer id={id} title={tile.title} overlay={false} editing={editing} thumb={tile.image ? asset(tile.image) : undefined} /> : m.image && <Img src={m.image} />}</span>
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
      <span className="ptc-mat"><Img src={tile.src} /></span>
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
function Profile({ slots, socials, stamps, piece, nlen = 12 }: { slots: HeaderSlots; socials: Of<'social'>[]; stamps: Of<'text'>[]; piece: PieceFn; nlen?: number }) {
  return (
    <div className="ptc ptc-me" style={{ '--nlen': nlen } as CSSProperties}>
      {slots.avatar && <div className="ptc-portrait">{slots.avatar}</div>}
      <h1 className="posy-head ptc-name">{slots.name}</h1>
      {slots.bio && <div className="ptc-bio">{slots.bio}</div>}
      {slots.caption && <p className="ptc-hand ptc-where">{slots.caption}</p>}
      {socials.length > 0 && <div className="ptc-socials">{socials.map(t => piece(t, <Social tile={t} />, { key: t.id, className: 'ptc-social-piece' }))}</div>}
      {stamps.length > 0 && <div className="ptc-seals">{stamps.map(t => piece(t, <Seal tile={t} />, { key: t.id, className: 'ptc-seal-piece' }))}</div>}
    </div>
  );
}

const Kite = ({ className }: { className?: string }) => <span className={cn('pts-kite', className)} aria-hidden><Img src="/looks/painted/kite.webp" /></span>;

/* ---------------- the scene ---------------- */

/** Rough heights, to share cards between the two desktop columns so they end level. */
function height(t: Tile) {
  if (t.type === 'link' || t.type === 'github') return 96;
  if (t.type === 'music') return 150;
  if (t.type === 'video') return 270;
  if (t.type === 'image') return t.caption ? 300 : 270;
  if (t.type === 'text') return 90 + plain(t.text).length * .9;
  return 100;
}

export function PaintedScene({ page, slots, piece, only, editing }: SceneProps) {
  const a = anatomy(page.tiles);
  const night = page.theme.preset === 'starry';
  const lead = a.links[0], rest = a.links.slice(1);
  // the cards beside you: links first (they matter most), then music and video, photos, notes
  const flow: Tile[] = [...rest, ...a.media, ...a.photos, ...a.notes];

  const card = (t: Tile, cls?: string) => {
    const node = t.type === 'link' || t.type === 'github' ? <LinkCard tile={t} />
      : t.type === 'music' || t.type === 'video' ? <MediaCard tile={t} editing={editing} />
      : t.type === 'image' ? <PhotoCard tile={t} />
      : t.type === 'text' ? <NoteCard tile={t} /> : null;
    return piece(t, node, { key: t.id, className: cn('pts-card', `pts-card-${t.type}`, cls) });
  };
  const profile = <Profile slots={slots} socials={a.socials} stamps={a.stamps} piece={piece} nlen={page.profile.name.length} />;

  const desktop = () => {
    // greedy: each card goes to the shorter column, keeping the page's order within each column
    const cols: Tile[][] = [[], []], h = [0, 0];
    for (const t of flow) { const k = h[0] <= h[1] ? 0 : 1; cols[k].push(t); h[k] += height(t) + 18; }
    return (
      <div className={cn('pts pts-desk', night && 'pts-night')}>
        <aside className="pts-side">
          {profile}
          <Kite />
        </aside>
        <main className="pts-main">
          {lead && piece(lead, <LinkCard tile={lead} big />, { key: lead.id, className: 'pts-card pts-lead' })}
          {flow.length > 0 && <div className="pts-cols">{cols.map((c, k) => <div key={k} className="pts-col">{c.map(t => card(t))}</div>)}</div>}
        </main>
      </div>
    );
  };

  const mobile = () => (
    <div className={cn('pts pts-phone', night && 'pts-night')}>
      <Kite className="pts-kite-m" />
      {profile}
      <div className="pts-stack">
        {lead && piece(lead, <LinkCard tile={lead} big />, { key: lead.id, className: 'pts-card pts-lead' })}
        {rest.map(t => card(t))}
        {a.media.map(t => card(t))}
        {a.photos.length > 0 && <div className={cn('pts-photos', a.photos.length === 1 && 'pts-photos-one')}>{a.photos.map(t => card(t))}</div>}
        {a.notes.map(t => card(t))}
      </div>
    </div>
  );

  return <Arrangements only={only} desktop={desktop} mobile={mobile} />;
}

/** The kit on its own, for the component lab. */
export { LinkCard as PaintedLink, MusicCard as PaintedMusic, VideoCard as PaintedVideo, PhotoCard as PaintedPhoto, NoteCard as PaintedNote, Seal as PaintedSeal, Social as PaintedSocial, Profile as PaintedProfile };
