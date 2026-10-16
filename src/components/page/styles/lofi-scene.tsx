// Lofi as a scene: on a computer your page is your computer (an about-me window, your best links open as browser
// windows, a music player, photos and sticky notes over an anime wallpaper, everything else as desktop icons, socials
// in the dock). On a phone it's your phone's home screen: widgets, app icons and a dock.
import { ArrowUpRight, ChevronLeft, ChevronRight, Lock, Music2, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import type { Tile } from '@/lib/schema';
import { PLATFORMS } from '@/lib/platforms';
import { asset, cn } from '@/lib/utils';
import { cleanTitle, hostOf, pathOf, siteName, youtubeId } from '@/lib/url';
import { Favicon, LiveClock, VideoPlayer } from '../islands';
import { BrandIcon, RichText } from '../tiles';
import { tileMeta, compact } from './meta';
import { anatomy, Arrangements, type SceneProps } from './scene';
import { LofiWindows, SafeImg } from '../islands';

const Img = ({ src, className }: { src: string; className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={asset(src)} alt="" loading="lazy" draggable={false} className={className} />
);

/** Which clay app icon stands for a tile. */
function iconFor(tile: Tile) {
  if (tile.type === 'github') return 'terminal';
  if (tile.type === 'image') return 'camera';
  if (tile.type === 'music') return 'music';
  if (tile.type === 'video') return 'video';
  if (tile.type === 'text') return 'notes';
  const k = tileMeta(tile).kind;
  return k === 'newsletter' ? 'mail' : k === 'shop' ? 'shop' : 'globe';
}

/** A short name for an icon label: the title, or the site's name. */
function label(tile: Tile) {
  if (tile.type === 'link') return cleanTitle(tile.title || siteName(tile.url), { site: siteName(tile.url) }).title;
  if (tile.type === 'github') return tile.repo.split('/')[1];
  return tileMeta(tile).title || '';
}

/** A clay app icon, with the site's own favicon as a little badge for links. */
function AppIcon({ tile, size = 'md' }: { tile: Tile; size?: 'md' | 'lg' }) {
  return (
    <span className={cn('lfs-icon', `lfs-icon-${size}`)}>
      <Img src={`/looks/lofi/icons/${iconFor(tile)}.png`} />
      {tile.type === 'link' && <span className="lfs-badge"><Favicon url={tile.url} /></span>}
    </span>
  );
}

function SocialTile({ tile }: { tile: Extract<Tile, { type: 'social' }> }) {
  const p = PLATFORMS[tile.platform];
  return (
    <span className="lfs-social" style={{ '--brand': `#${p.icon?.hex ?? '6b7280'}` } as React.CSSProperties} title={p.label}>
      {p.icon?.path ? <BrandIcon path={p.icon.path} size={24} /> : <b>{tile.platform === 'email' ? '@' : 'in'}</b>}
    </span>
  );
}

/** A window: a soft title bar with the app's name in pixel type, and its content. */
function Win({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('lfs-win', className)}>
      <div className="lfs-bar"><span className="lfs-lights" aria-hidden><i /><i /><i /></span><span className="lfs-title">{title}</span></div>
      <div className="lfs-body">{children}</div>
    </div>
  );
}

function Browser({ tile }: { tile: Tile }) {
  const m = tileMeta(tile);
  const url = tile.type === 'link' ? tile.url : `https://github.com/${tile.type === 'github' ? tile.repo : ''}`;
  const site = siteName(url), host = hostOf(url), path = pathOf(url);
  const t = tile.type === 'link' ? cleanTitle(tile.title || site, { site, description: tile.description })
    : { title: m.title, tagline: undefined, description: tile.type === 'github' ? tile.description : undefined };
  const sub = t.description ?? t.tagline;
  const splash = <span className="lfs-splash"><span className="lfs-splash-fav"><Favicon url={url} /></span></span>;
  return (
    <div className="lfs-win lfs-browser">
      <div className="lfs-bar">
        <span className="lfs-lights" aria-hidden><i /><i /><i /></span>
        <span className="lfs-tab"><span className="lfs-tab-fav"><Favicon url={url} /></span><span>{site}</span></span>
      </div>
      <div className="lfs-toolbar">
        <span className="lfs-nav" aria-hidden><ChevronLeft /><ChevronRight /></span>
        <span className="lfs-address"><Lock aria-hidden /><span className="lfs-url"><b>{host}</b>{path}</span><i className="lfs-loading" aria-hidden /></span>
      </div>
      <div className="lfs-page">
        <span className="lfs-hero">{m.image ? <SafeImg src={asset(m.image)!} fallback={splash} /> : splash}</span>
        <div className="lfs-page-text"><b>{t.title}</b>{sub && <span>{sub}</span>}</div>
        <div className="lfs-page-foot">
          {tile.type === 'github' && (tile.stars !== undefined || tile.language)
            ? <span className="lfs-meta">{tile.stars !== undefined && <>★ {compact(tile.stars)}</>}{tile.stars !== undefined && tile.language && ' · '}{tile.language}</span>
            : <span />}
          <span className="lfs-open">Open <ArrowUpRight aria-hidden /></span>
        </div>
      </div>
    </div>
  );
}

function Player({ tile, editing, wide }: { tile: Extract<Tile, { type: 'music' | 'video' }>; editing?: boolean; wide?: boolean }) {
  const m = tileMeta(tile);
  if (tile.type === 'video') {
    const id = youtubeId(tile.url);
    return (
      <Win title="Player" className="lfs-video">
        <div className="lfs-screen">{id ? <VideoPlayer id={id} title={tile.title} overlay={false} editing={editing} thumb={tile.image ? asset(tile.image) : undefined} /> : m.image && <Img src={m.image} />}</div>
        <b className="lfs-caption">{m.title}</b>
      </Win>
    );
  }
  return (
    <Win title="Music" className={cn('lfs-music', wide && 'lfs-music-wide')}>
      <div className="lfs-deck" aria-hidden>
        <span className="lfs-vinyl"><i /></span>
        <span className="lfs-sleeve">{m.image ? <Img src={m.image} /> : <span className="lfs-sleeve-blank"><Music2 /></span>}</span>
      </div>
      <div className="lfs-track">
        <b>{m.title}</b>
        <span className="lfs-artist"><span className="lfs-eq" aria-hidden><i /><i /><i /><i /></span><span>{m.sub}</span></span>
        <span className="lfs-progress" aria-hidden><i /></span>
        <span className="lfs-controls" aria-hidden><SkipBack /><span className="lfs-play"><Play className="lfs-p1" /><Pause className="lfs-p2" /></span><SkipForward /></span>
      </div>
    </Win>
  );
}

function Photo({ tile }: { tile: Extract<Tile, { type: 'image' }> }) {
  return (
    <Win title="Photos" className="lfs-photo">
      <Img src={tile.src} className="lfs-photo-img" />
      {tile.caption && <span className="lfs-caption">{tile.caption}</span>}
    </Win>
  );
}

function Sticky({ tile }: { tile: Extract<Tile, { type: 'text' }> }) { return <div className="lfs-sticky"><p><RichText text={tile.text} /></p></div>; }
function Sticker({ tile }: { tile: Extract<Tile, { type: 'text' }> }) { return <div className="lfs-sticker"><span>{tile.text.replace(/[*[\]]|\(https?:[^)]+\)/g, '')}</span></div>; }

const BatteryEtc = () => (
  <span className="lfs-status-icons" aria-hidden>
    <svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="7" rx="1" /><rect x="10" y="2.5" width="3" height="9.5" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
    <svg viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="currentColor" opacity=".5" /><rect x="2.5" y="2.5" width="15" height="7" rx="1.6" /><rect x="23.5" y="4" width="2" height="4" rx="1" opacity=".5" /></svg>
  </span>
);

export function LofiScene({ page, slots, piece, only, editing }: SceneProps) {
  const a = anatomy(page.tiles);
  const featured = a.links.slice(0, 2);
  const shelf = [...a.links.slice(2), ...a.photos.slice(1), ...a.media.slice(1), ...a.notes.slice(1)];
  const media = a.media[0], photo = a.photos[0], note = a.notes[0], stamp = a.stamps[0];
  const dock = a.socials.slice(0, 5), extraSocials = a.socials.slice(5), phoneExtra = a.socials.slice(4);

  const desktop = () => (
    <div className="lfs-desk">
      <div className="lfs-menubar">
        <span className="lfs-menu-logo" aria-hidden>✿</span><b>{slots.name}</b><span className="lfs-menu-gap" /><span className="lfs-clock"><LiveClock /></span>
      </div>
      <div className="lfs-area">
        <Win title="about_me.txt" className="lfs-about lfs-a-about">
          {slots.avatar && <div className="lfs-me">{slots.avatar}</div>}
          <div className="lfs-me-text">
            <h1 className="posy-head lfs-name">{slots.name}</h1>
            {slots.bio && <div className="lfs-bio">{slots.bio}</div>}
            {slots.caption && <p className="lfs-online"><i aria-hidden />{slots.caption}</p>}
          </div>
        </Win>
        {featured.map((t, i) => piece(t, <Browser tile={t} />, { key: t.id, className: `lfs-a-feat${i + 1}` }))}
        {media && piece(media, <Player tile={media} editing={editing} />, { key: media.id, className: 'lfs-a-media' })}
        {photo && piece(photo, <Photo tile={photo} />, { key: photo.id, className: 'lfs-a-photo' })}
        {note && piece(note, <Sticky tile={note} />, { key: note.id, className: 'lfs-a-note' })}
        {stamp && piece(stamp, <Sticker tile={stamp} />, { key: stamp.id, className: 'lfs-a-stamp' })}
      </div>
      {shelf.length + extraSocials.length > 0 && (
        <div className="lfs-desk-icons">
          {shelf.map(t => piece(t, <><AppIcon tile={t} /><span className="lfs-label">{label(t)}</span></>, { key: t.id, className: 'lfs-desk-icon' }))}
          {extraSocials.map(t => piece(t, <><SocialTile tile={t} /><span className="lfs-label">{PLATFORMS[t.platform].label}</span></>, { key: t.id, className: 'lfs-desk-icon' }))}
        </div>
      )}
      {dock.length > 0 && <div className="lfs-dock">{dock.map(t => piece(t, <SocialTile tile={t} />, { key: t.id, className: 'lfs-dock-item' }))}</div>}
      {!editing && <LofiWindows />}
    </div>
  );

  const mobile = () => (
    <div className="lfs-phone">
      <div className="lfs-status"><span className="lfs-clock"><LiveClock /></span><BatteryEtc /></div>
      <div className="lfs-widget lfs-w-me">
        {slots.avatar && <div className="lfs-me">{slots.avatar}</div>}
        <div className="lfs-me-text">
          <h1 className="posy-head lfs-name">{slots.name}</h1>
          {slots.bio && <div className="lfs-bio">{slots.bio}</div>}
          {slots.caption && <p className="lfs-online"><i aria-hidden />{slots.caption}</p>}
        </div>
      </div>
      {featured.map(t => piece(t, (
        <div className="lfs-widget lfs-w-link">
          {tileMeta(t).image ? <SafeImg src={asset(tileMeta(t).image)!} className="lfs-w-thumb" fallback={<AppIcon tile={t} />} /> : <AppIcon tile={t} />}
          <span className="lfs-w-text"><b>{label(t)}</b><span>{t.type === 'link' ? siteName(t.url) : 'GitHub'}</span></span>
          <ArrowUpRight aria-hidden className="lfs-w-go" />
        </div>
      ), { key: t.id, className: 'lfs-m-wide' }))}
      {(media || photo) && (
        <div className="lfs-widgets">
          {media && piece(media, media.type === 'music'
            ? <div className="lfs-widget lfs-w-music"><div className="lfs-disc">{tileMeta(media).image ? <Img src={tileMeta(media).image!} /> : <span />}</div><b>{tileMeta(media).title}</b><span className="lfs-eq" aria-hidden><i /><i /><i /><i /><i /></span></div>
            : <div className="lfs-widget lfs-w-photo">{tileMeta(media).image && <Img src={tileMeta(media).image!} />}<span className="lfs-w-play"><Play /></span></div>,
            { key: media.id, className: cn('lfs-m-square', !photo && 'lfs-m-wide') })}
          {photo && piece(photo, <div className="lfs-widget lfs-w-photo"><Img src={photo.src} />{photo.caption && <span className="lfs-w-cap">{photo.caption}</span>}</div>, { key: photo.id, className: cn('lfs-m-square', !media && 'lfs-m-wide') })}
        </div>
      )}
      {(shelf.length > 0 || phoneExtra.length > 0) && (
        <div className="lfs-apps">
          {shelf.map(t => piece(t, <><AppIcon tile={t} /><span className="lfs-label">{label(t)}</span></>, { key: t.id, className: 'lfs-app' }))}
          {phoneExtra.map(t => piece(t, <><SocialTile tile={t} /><span className="lfs-label">{PLATFORMS[t.platform].label}</span></>, { key: t.id, className: 'lfs-app' }))}
        </div>
      )}
      {note && piece(note, <div className="lfs-widget lfs-w-note"><p><RichText text={note.text} /></p></div>, { key: note.id, className: 'lfs-m-wide' })}
      {stamp && piece(stamp, <Sticker tile={stamp} />, { key: stamp.id, className: 'lfs-m-stamp' })}
      {dock.length > 0 && <div className="lfs-dock lfs-phone-dock">{dock.slice(0, 4).map(t => piece(t, <SocialTile tile={t} />, { key: t.id, className: 'lfs-dock-item' }))}</div>}
    </div>
  );

  return (
    <div className={cn('lfs', page.theme.preset === 'daydream' ? 'lfs-day' : 'lfs-night')}>
      <Arrangements only={only} desktop={desktop} mobile={mobile} />
    </div>
  );
}

/** The kit on its own, for the component lab. */
export { Browser as LofiBrowser, AppIcon as LofiAppIcon, SocialTile as LofiSocial, Player as LofiPlayer, Photo as LofiPhoto, Sticky as LofiSticky, Sticker as LofiSticker, Win as LofiWin, label as lofiLabel };
