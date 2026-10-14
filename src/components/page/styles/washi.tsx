// Washi: a Japanese print. Fibrous paper, sumi ink, double-ruled frames numbered in kanji, a red hanko seal,
// the name set vertically like a book spine, and short notes typeset top to bottom.
import { ArrowUpRight } from 'lucide-react';
import type { Tile } from '@/lib/schema';
import { asset, cn } from '@/lib/utils';
import { youtubeId } from '@/lib/url';
import { VideoPlayer } from '../islands';
import { RichText } from '../tiles';
import { tileMeta, compact } from './meta';
import type { HeaderSlots } from './types';

const DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
/** 1 → 一, 12 → 十二, 40 → 四十. */
export function kanji(n: number) {
  if (n < 10) return DIGITS[n] || '〇';
  const t = Math.floor(n / 10) % 10, o = n % 10;
  return `${t > 1 ? DIGITS[t] : ''}十${DIGITS[o]}`;
}

const initials = (name: string) => name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'P';

export function WashiHeader({ name, slots }: { name: string; slots: HeaderSlots }) {
  return (
    <>
      {/* each word is its own column, read right to left; the editor passes an input instead of text */}
      <h1 className={cn('posy-head posy-name ws-name', name.length > 14 && 'ws-name-long', typeof slots.name !== 'string' && 'ws-name-edit')} aria-label={name}>
        {typeof slots.name === 'string' ? slots.name.trim().split(/\s+/).map((w, i) => <span key={i} className="ws-word" aria-hidden>{w}</span>) : slots.name}
      </h1>
      <div className="ws-side">
        <div className="ws-top">
          {slots.avatar && <div className="ws-print">{slots.avatar}</div>}
          <span className="ws-seal" aria-hidden><span>{initials(name)}</span></span>
        </div>
        {slots.bio && <div className="posy-bio ws-bio">{slots.bio}</div>}
        {slots.caption && <p className="ws-caption">{slots.caption}</p>}
        {slots.socials}
      </div>
    </>
  );
}

const Img = ({ src }: { src: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={asset(src)} alt="" loading="lazy" draggable={false} />
);

export function WashiTile({ tile, index, editing }: { tile: Tile; index: number; editing?: boolean }) {
  const m = tileMeta(tile);
  const n = kanji(index + 1);
  const vid = tile.type === 'video' ? youtubeId(tile.url) : null;
  const pic = tile.type === 'image' || tile.type === 'video' || ((tile.type === 'link' || tile.type === 'music') && tile.size !== 's' && m.image);
  return (
    <div className={cn('ws-frame', `ws-t-${tile.type}`)}>
      <div className="ws-meta"><span className="ws-n">{n}</span><span className="ws-kind">{m.kind}</span></div>
      {tile.type === 'text' && <p className="ws-note"><RichText text={tile.text} /></p>}
      {pic && (
        <div className="ws-img">
          {vid ? <VideoPlayer id={vid} title={tile.type === 'video' ? tile.title : undefined} editing={editing} thumb={tile.type === 'video' && tile.image ? asset(tile.image) : undefined} /> : m.image && <Img src={m.image} />}
        </div>
      )}
      {tile.type === 'image' && tile.caption && <p className="ws-cap">{tile.caption}</p>}
      {!pic && tile.type !== 'text' && <span className="ws-mark" aria-hidden>{n}</span>}
      {tile.type !== 'text' && tile.type !== 'image' && (
        <div className="ws-text">
          <b>{m.title}</b>
          {tile.type === 'github'
            ? <span>{tile.stars !== undefined && `★ ${compact(tile.stars)}`}{tile.language && ` · ${tile.language}`}</span>
            : m.sub && m.sub !== m.title && <span>{m.sub}</span>}
        </div>
      )}
      {m.href && tile.type !== 'video' && <ArrowUpRight className="ws-go" aria-hidden />}
    </div>
  );
}

export function WashiRow({ tile, index }: { tile: Tile; index: number }) {
  const m = tileMeta(tile);
  if (tile.type === 'text') return <p className="ws-row-note"><RichText text={tile.text} /></p>;
  return (
    <div className="ws-line">
      <span className="ws-n">{kanji(index + 1)}</span>
      <b>{m.title}</b>
      <span className="ws-kind">{m.kind}</span>
      <ArrowUpRight className="ws-go" aria-hidden />
    </div>
  );
}
