// Washi: a Japanese print. Real Edo-period woodblock prints (public domain), real paper, a seal made from a real
// seal impression, double-ruled frames numbered in kanji, and short names set top to bottom like a book spine.
import { ArrowUpRight } from 'lucide-react';
import type { Page, Tile } from '@/lib/schema';
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

/** Public-domain prints (Art Institute of Chicago, CC0), one per palette. Credits: public/looks/CREDITS.md. */
export const WASHI_PRINTS: Record<string, { src: string; artist: string; title: string; year: string }> = {
  kinari: { src: '/looks/washi/mishima-mist.jpg', artist: 'Utagawa Hiroshige', title: 'Mishima: Morning Mist', year: 'c. 1833' },
  sakura: { src: '/looks/washi/benzaiten-snow.jpg', artist: 'Utagawa Hiroshige', title: 'Snow at Benzaiten Shrine', year: 'c. 1844' },
  yomogi: { src: '/looks/washi/mitsuke-ferry.jpg', artist: 'Utagawa Hiroshige', title: 'Ferries Crossing the Tenryu River', year: 'c. 1837' },
  sumi: { src: '/looks/washi/shower-summit.jpg', artist: 'Katsushika Hokusai', title: 'Shower Below the Summit', year: 'c. 1830' },
};
const printFor = (preset: string) => WASHI_PRINTS[preset] ?? WASHI_PRINTS.kinari;

const initials = (name: string) => name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'P';

/** A seal pressed with the person's initials: the frame and ink grain come from a real Edo seal impression. */
function Seal({ name }: { name: string }) {
  return <span className="ws-seal" aria-hidden><span className="ws-seal-ink">{initials(name)}</span></span>;
}

export function WashiHeader({ page, slots }: { page: Page; slots: HeaderSlots }) {
  const name = page.profile.name;
  // Short names go in a title slip on the print, read top to bottom, like the cartouche on a real woodblock print.
  const slip = name.trim().length <= 16 && typeof slots.name === 'string';
  const art = printFor(page.theme.preset);
  return (
    <>
      {!slip && <h1 className="posy-head posy-name ws-name ws-name-h" aria-label={name}>{slots.name}</h1>}
      <figure className="ws-art">
        <div className="ws-art-mount">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={art.src} alt={`${art.title}, ${art.artist}`} loading="eager" />
          {slip && <h1 className="posy-head posy-name ws-name ws-slip" aria-label={name}><span aria-hidden>{slots.name as string}</span></h1>}
        </div>
        <figcaption><b>{art.artist}</b> · {art.title} · {art.year}</figcaption>
      </figure>
      <div className="ws-side">
        <div className="ws-top">
          {slots.avatar && <div className="ws-print">{slots.avatar}</div>}
          <Seal name={name} />
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
      <div className="ws-meta"><span className="ws-n">{n}</span></div>
      {tile.type === 'text' && <p className="ws-note"><RichText text={tile.text} /></p>}
      {pic && (
        <div className="ws-img">
          {vid ? <VideoPlayer id={vid} title={tile.type === 'video' ? tile.title : undefined} editing={editing} thumb={tile.type === 'video' && tile.image ? asset(tile.image) : undefined} /> : m.image && <Img src={m.image} />}
        </div>
      )}
      {tile.type === 'image' && tile.caption && <p className="ws-cap">{tile.caption}</p>}
      {!pic && tile.type !== 'text' && <span className={cn('ws-pattern', `ws-pattern-${m.kind === 'shop' ? 'asanoha' : m.kind === 'repo' ? 'kikko' : 'seigaiha'}`)} aria-hidden />}
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
      {m.image ? <span className="ws-thumb"><Img src={m.image} /></span> : <span className="ws-thumb ws-thumb-empty" aria-hidden />}
      <span className="ws-line-text"><b>{m.title}</b>{m.sub && m.sub !== m.title && tile.type !== 'image' && <span>{m.sub}</span>}</span>
      <ArrowUpRight className="ws-go" aria-hidden />
    </div>
  );
}
