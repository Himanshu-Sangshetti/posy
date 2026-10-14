// Lofi: a night-time anime still. A deep blue room, every tile a small app window with a title bar, photos turned
// into a halftone print in the page colours (full colour on hover), the name set wide in capitals.
import { ArrowUpRight, Mail, Minus, Play, ShoppingBag, X } from 'lucide-react';
import type { Tile } from '@/lib/schema';
import { asset, cn } from '@/lib/utils';
import { hostOf, youtubeId } from '@/lib/url';
import { LiveClock, VideoPlayer } from '../islands';
import { BrandIcon, RichText } from '../tiles';
import { tileMeta, compact } from './meta';
import type { HeaderSlots } from './types';

const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 22) || 'untitled';

/** The file a tile pretends to be, for its window title. */
export function fileName(tile: Tile, n: number) {
  const pad = String(n + 1).padStart(2, '0');
  switch (tile.type) {
    case 'image': return `photo_${pad}.webp`;
    case 'video': return `${slug(tile.title || 'video')}.mp4`;
    case 'music': return `${slug(tile.title || 'track')}.mp3`;
    case 'text': return `note_${pad}.txt`;
    case 'github': return `${tile.repo.split('/').pop()}.git`;
    case 'social': return `${tile.platform}.url`;
    case 'link': return `${hostOf(tile.url).split('.').slice(-2, -1)[0] || 'link'}.url`;
    default: return `item_${pad}`;
  }
}

/** A photo, night-graded: real colour, a soft tint of the page's light and a fine print texture over it. */
export function Halftone({ src, className }: { src: string; className?: string }) {
  return (
    <span className={cn('lf-ht', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(src)} alt="" loading="lazy" draggable={false} />
    </span>
  );
}

function Bar({ name }: { name: string }) {
  return (
    <div className="lf-bar">
      <span className="lf-file">{name}</span>
      <span className="lf-ctl" aria-hidden><Minus /><X /></span>
    </div>
  );
}

/** A barcode that is the same for the same name, like a sticker on a sketchbook. */
function Barcode({ seed }: { seed: string }) {
  let h = 2166136261; const bars: number[] = [];
  for (const ch of seed + 'posy') h = Math.imul(h ^ ch.codePointAt(0)!, 16777619) >>> 0;
  for (let i = 0; i < 34; i++) { h = Math.imul(h ^ (h >>> 13), 2246822507) >>> 0; bars.push(1 + (h % 3)); }
  let x = 0;
  return (
    <svg className="lf-barcode" viewBox={`0 0 ${bars.reduce((a, b) => a + b + 1.5, 0)} 24`} aria-hidden>
      {bars.map((w, i) => { const r = <rect key={i} x={x} y={0} width={w} height={24} />; x += w + 1.5; return r; })}
    </svg>
  );
}

export function LofiHeader({ name, slots }: { name: string; slots: HeaderSlots }) {
  return (
    <>
      {slots.avatar && (
        <div className="lf-win lf-me">
          <Bar name="me.webp" />
          <div className="lf-me-body">{slots.avatar}</div>
        </div>
      )}
      <div className="lf-intro">
        <h1 className="posy-head posy-name lf-name" aria-label={name}>{slots.name}</h1>
        {slots.bio && <div className="posy-bio">{slots.bio}</div>}
        {slots.caption && <p className="lf-status"><i aria-hidden />{slots.caption}</p>}
        {slots.socials}
        <div className="lf-meta"><LiveClock /><Barcode seed={name} /></div>
      </div>
    </>
  );
}

export function LofiTile({ tile, index, editing }: { tile: Tile; index: number; editing?: boolean }) {
  const m = tileMeta(tile);
  const vid = tile.type === 'video' ? youtubeId(tile.url) : null;
  const pic = tile.type === 'image' || (tile.type === 'link' && tile.size !== 's' && m.image);
  return (
    <div className={cn('lf-win', `lf-t-${tile.type}`)}>
      <Bar name={fileName(tile, index)} />
      <div className="lf-body">
        {tile.type === 'text' && <p className="lf-note"><RichText text={tile.text} /></p>}
        {vid && <div className="lf-img lf-vid"><VideoPlayer id={vid} title={tile.type === 'video' ? tile.title : undefined} editing={editing} thumb={tile.type === 'video' && tile.image ? asset(tile.image) : undefined} /></div>}
        {pic && m.image && <Halftone src={m.image} className="lf-img" />}
        {tile.type === 'music' && (
          <div className="lf-track">
            {m.image ? <Halftone src={m.image} className="lf-cover" /> : <span className="lf-cover" />}
            <span className="lf-play" aria-hidden><Play /></span>
          </div>
        )}
        {(tile.type === 'link' || tile.type === 'github' || tile.type === 'social') && !pic && (
          <span className="lf-glyph" aria-hidden>{m.icon ? <BrandIcon path={m.icon} size={40} /> : (() => { const I = m.kind === 'shop' ? ShoppingBag : m.kind === 'newsletter' ? Mail : ArrowUpRight; return <I size={40} strokeWidth={1.4} />; })()}</span>
        )}
        {tile.type !== 'text' && tile.type !== 'image' && (
          <div className="lf-text">
            <b>{m.title}</b>
            {tile.type === 'github'
              ? <span>{tile.stars !== undefined && `★ ${compact(tile.stars)}`}{tile.language && ` · ${tile.language}`}</span>
              : m.sub && m.sub !== m.title && <span>{m.sub}</span>}
          </div>
        )}
        {tile.type === 'image' && tile.caption && <p className="lf-cap">{tile.caption}</p>}
      </div>
    </div>
  );
}

export function LofiRow({ tile, index }: { tile: Tile; index: number }) {
  const m = tileMeta(tile);
  if (tile.type === 'text') return <p className="lf-row-note"><RichText text={tile.text} /></p>;
  return (
    <div className="lf-line">
      <span className="lf-file">{fileName(tile, index)}</span>
      <b>{m.title}</b>
      <span className="lf-open">open ↗</span>
    </div>
  );
}
