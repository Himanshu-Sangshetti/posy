// Lofi: a desktop left open. Every tile is a small app window (Photos, Notes, Music, Terminal, Mail) with a classic
// pinstriped title bar, over a sky of clay clouds by day or a painted anime room at night. Visitors can drag windows.
import { ArrowUpRight, Globe, Mail, Play, ShoppingBag, SkipBack, SkipForward } from 'lucide-react';
import type { Tile } from '@/lib/schema';
import { PLATFORMS } from '@/lib/platforms';
import { avatarCrop } from '@/lib/crop';
import { asset, cn } from '@/lib/utils';
import { hostOf, youtubeId } from '@/lib/url';
import { LiveClock, VideoPlayer } from '../islands';
import { BrandIcon, RichText } from '../tiles';
import { tileMeta, compact } from './meta';
import type { HeaderSlots } from './types';

/** Every tile is a small app on the desktop: the window title says which one. */
export function appName(tile: Tile) {
  switch (tile.type) {
    case 'image': return 'Photos';
    case 'video': return 'Player';
    case 'music': return 'Music';
    case 'text': return 'Notes';
    case 'github': return 'Terminal';
    case 'social': return PLATFORMS[tile.platform].label;
    case 'link': {
      const k = tileMeta(tile).kind;
      return k === 'newsletter' ? 'Mail' : k === 'shop' ? 'Shop' : hostOf(tile.url).replace(/^www\./, '') || 'Browser';
    }
    default: return '';
  }
}

/** A photo, night-graded: real colour, a soft tint of the page's light and a fine print texture over it. */
export function Halftone({ src, className, profile }: { src: string; className?: string; profile?: Parameters<typeof avatarCrop>[0] }) {
  return (
    <span className={cn('lf-ht', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(src)} alt="" loading="lazy" draggable={false} style={profile && avatarCrop(profile)} />
    </span>
  );
}

/** A classic title bar: close box, pinstripes, the app's name in the middle, zoom box. */
export function Bar({ title }: { title: string }) {
  return (
    <div className="lf-bar">
      <i className="lf-box" aria-hidden />
      <span className="lf-stripes" aria-hidden />
      {title && <span className="lf-title">{title}</span>}
      <span className="lf-stripes" aria-hidden />
      <i className="lf-box lf-zoom" aria-hidden />
    </div>
  );
}

/** The bar across the top of a Lofi page, like an old desktop: a flower, your name, the time. */
export function LofiMenuBar({ name, pinned }: { name: string; pinned?: boolean }) {
  return (
    <div className={cn('lf-menubar', pinned && 'lf-menubar-pinned')} aria-hidden>
      <svg viewBox="0 0 24 24" className="lf-flower"><path d="M12 2.5c1.6 0 2.4 2.6 2.1 5.3 2.1-1.7 4.8-2.5 5.6-1.1.8 1.4-1.2 3.3-3.8 4.3 2.6 1 4.6 2.9 3.8 4.3-.8 1.4-3.5.6-5.6-1.1.3 2.7-.5 5.3-2.1 5.3s-2.4-2.6-2.1-5.3c-2.1 1.7-4.8 2.5-5.6 1.1-.8-1.4 1.2-3.3 3.8-4.3-2.6-1-4.6-2.9-3.8-4.3.8-1.4 3.5-.6 5.6 1.1C9.6 5.1 10.4 2.5 12 2.5Z" /><circle cx="12" cy="12" r="2.3" /></svg>
      <b>{name}</b>
      <span className="lf-menu-gap" />
      <LiveClock />
    </div>
  );
}

export function LofiHeader({ name, slots }: { name: string; slots: HeaderSlots }) {
  return (
    <>
      {slots.avatar && (
        <div className="lf-win lf-me">
          <Bar title="me" />
          <div className="lf-me-body">{slots.avatar}</div>
        </div>
      )}
      <div className="lf-intro">
        <h1 className="posy-head posy-name lf-name" aria-label={name}>{slots.name}</h1>
        {slots.bio && <div className="posy-bio">{slots.bio}</div>}
        {slots.caption && <p className="lf-status"><i aria-hidden />{slots.caption}</p>}
        {slots.socials}
      </div>
    </>
  );
}

function AppIcon({ tile, icon }: { tile: Tile; icon?: string }) {
  const k = tileMeta(tile).kind;
  const I = k === 'shop' ? ShoppingBag : k === 'newsletter' ? Mail : Globe;
  return <span className="lf-app" aria-hidden>{icon ? <BrandIcon path={icon} size={26} /> : <I size={26} strokeWidth={1.6} />}</span>;
}

const ACTION: Record<string, string> = { newsletter: 'Subscribe', shop: 'Browse', repo: 'Star', link: 'Open' };

export function LofiTile({ tile, index, editing }: { tile: Tile; index: number; editing?: boolean }) {
  void index;
  const m = tileMeta(tile);
  const vid = tile.type === 'video' ? youtubeId(tile.url) : null;
  const pic = tile.type === 'link' && tile.size !== 's' && m.image;
  return (
    <div className={cn('lf-win', `lf-t-${tile.type}`, `lf-k-${m.kind}`)}>
      <Bar title={appName(tile)} />
      <div className="lf-body">
        {tile.type === 'text' && <p className="lf-note"><RichText text={tile.text} /></p>}

        {tile.type === 'image' && <>
          <Halftone src={tile.src} className="lf-img" />
          {tile.caption && <p className="lf-cap">{tile.caption}</p>}
        </>}

        {tile.type === 'video' && <>
          {vid && <div className="lf-img lf-vid"><VideoPlayer id={vid} title={tile.title} editing={editing} thumb={tile.image ? asset(tile.image) : undefined} /></div>}
        </>}

        {tile.type === 'music' && (
          <div className="lf-player">
            {m.image ? <Halftone src={m.image} className="lf-cover" /> : <span className="lf-cover" />}
            <div className="lf-track">
              <b>{m.title}</b>
              <span>{m.sub}</span>
              <span className="lf-progress" aria-hidden><i /></span>
              <span className="lf-controls" aria-hidden><SkipBack /><span className="lf-play"><Play /></span><SkipForward /></span>
            </div>
          </div>
        )}

        {tile.type === 'github' && (
          <div className="lf-term">
            <p><span className="lf-ps">~ $</span> git clone {tile.repo}</p>
            {tile.description && <p className="lf-out">{tile.description}</p>}
            {(tile.stars !== undefined || tile.language) && <p className="lf-out">{tile.stars !== undefined && `★ ${compact(tile.stars)}`}{tile.stars !== undefined && tile.language && '  ·  '}{tile.language}</p>}
            <p><span className="lf-ps">~ $</span> <i className="lf-caret" /></p>
          </div>
        )}

        {(tile.type === 'link' || tile.type === 'social') && (pic ? <>
          <Halftone src={m.image!} className="lf-img" />
          <div className="lf-text"><b>{m.title}</b>{m.sub && m.sub !== m.title && <span>{m.sub}</span>}</div>
        </> : (
          <div className="lf-page">
            <AppIcon tile={tile} icon={m.icon} />
            <div className="lf-text"><b>{m.title}</b>{m.sub && m.sub !== m.title && <span>{m.sub}</span>}</div>
            <span className="lf-btn" aria-hidden>{tile.type === 'social' ? 'Follow' : ACTION[m.kind] ?? 'Open'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LofiRow({ tile }: { tile: Tile; index: number }) {
  const m = tileMeta(tile);
  if (tile.type === 'text') return <p className="lf-row-note"><RichText text={tile.text} /></p>;
  return (
    <div className="lf-line">
      {m.image ? <Halftone src={m.image} className="lf-line-pic" /> : <AppIcon tile={tile} icon={m.icon} />}
      <span className="lf-line-text"><b>{m.title}</b><span>{appName(tile)}</span></span>
      <ArrowUpRight className="lf-open" aria-hidden />
    </div>
  );
}
