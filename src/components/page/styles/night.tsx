// Night: a neon street after rain. Tiles are lit signs on dark glass, photos are posters in light boxes, notes glow
// as neon tubes, music is a jukebox, a video plays on an arcade screen, a shop is a vending machine and a stamp
// note is the blinking "open" sign. Signs alternate between the palette's two neon colours.
import { ArrowUpRight, Mail, Play, Star } from 'lucide-react';
import type { Page, Tile } from '@/lib/schema';
import { asset, cn } from '@/lib/utils';
import { youtubeId } from '@/lib/url';
import { VideoPlayer } from '../islands';
import { RichText } from '../tiles';
import { tileMeta, compact } from './meta';
import type { HeaderSlots } from './types';

const Img = ({ src, alt = '' }: { src: string; alt?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={asset(src)} alt={alt} loading="lazy" draggable={false} />
);

/** Every other sign in the second neon colour, so the street isn't one colour. */
const tube = (index: number) => (index % 2 ? 'nt-b' : 'nt-a');

export function NightHeader({ page, slots }: { page: Page; slots: HeaderSlots }) {
  void page;
  return (
    <>
      {slots.avatar && <div className="nt-portrait">{slots.avatar}</div>}
      <div className="nt-intro">
        <h1 className="posy-head posy-name nt-name">{slots.name}</h1>
        {slots.bio && <div className="posy-bio nt-bio">{slots.bio}</div>}
        {slots.caption && <p className="nt-caption"><i aria-hidden />{slots.caption}</p>}
        <div className="nt-socials">{slots.socials}</div>
      </div>
    </>
  );
}

export function NightTile({ tile, index, editing }: { tile: Tile; index: number; editing?: boolean }) {
  const m = tileMeta(tile);
  const c = tube(index);

  if (tile.type === 'text') {
    if (tile.look === 'stamp') return <div className={cn('nt-open', c)}><span>{tile.text.replace(/[*[\]]|\(https?:[^)]+\)/g, '')}</span></div>;
    return <div className={cn('nt-tube', c, `nt-tube-${tile.size}`)}><p><RichText text={tile.text} /></p></div>;
  }

  if (tile.type === 'image') return (
    <figure className={cn('nt-poster', c)}>
      <span className="nt-pic"><Img src={tile.src} alt={tile.alt} /></span>
      {tile.caption && <figcaption>{tile.caption}</figcaption>}
    </figure>
  );

  if (tile.type === 'video') {
    const id = youtubeId(tile.url);
    return (
      <div className={cn('nt-sign nt-arcade', c)}>
        <span className="nt-crt">
          {id ? <VideoPlayer id={id} title={tile.title} overlay={false} editing={editing} thumb={tile.image ? asset(tile.image) : undefined} /> : m.image && <Img src={m.image} />}
        </span>
        <b className="nt-title nt-small"><Play aria-hidden className="nt-icon-fill" />{m.title}</b>
      </div>
    );
  }

  if (tile.type === 'music') return (
    <div className={cn('nt-sign nt-jukebox', c)}>
      <span className="nt-juke-arch" aria-hidden><i /><i /><i /><i /><i /><i /><i /></span>
      <div className="nt-juke-row">
        {m.image && <span className="nt-cover"><Img src={m.image} /></span>}
        <span className="nt-text"><b className="nt-title nt-small">{m.title}</b><span className="nt-sub">{m.sub}</span></span>
      </div>
    </div>
  );

  if (tile.type === 'github') return (
    <div className={cn('nt-sign nt-term', c)}>
      <b className="nt-title nt-mono">{tile.repo}</b>
      {tile.description && <p className="nt-sub">{tile.description}</p>}
      {(tile.stars !== undefined || tile.language) && <span className="nt-sub">{tile.stars !== undefined && <><Star aria-hidden className="nt-icon-fill" />{compact(tile.stars)}</>}{tile.stars !== undefined && tile.language && ' · '}{tile.language}</span>}
    </div>
  );

  if (m.kind === 'shop') return (
    <div className={cn('nt-sign nt-vending', c)}>
      <span className="nt-slots" aria-hidden>{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</span>
      <span className="nt-text"><b className="nt-title">{m.title}</b>{m.sub && m.sub !== m.title && <span className="nt-sub">{m.sub}</span>}</span>
    </div>
  );

  const pic = tile.size !== 's' && m.image;
  return (
    <div className={cn('nt-sign', c, pic && 'nt-sign-pic')}>
      {pic && <span className="nt-pic"><Img src={m.image!} /></span>}
      {!pic && m.kind === 'newsletter' && <Mail aria-hidden className="nt-glyph" />}
      <span className="nt-text">
        <b className="nt-title">{m.title}</b>
        {m.sub && m.sub !== m.title && <span className="nt-sub">{m.sub}</span>}
      </span>
      <ArrowUpRight aria-hidden className="nt-go" />
    </div>
  );
}

export function NightRow({ tile, index }: { tile: Tile; index: number }) {
  const m = tileMeta(tile);
  if (tile.type === 'text') return <div className={cn('nt-tube nt-row-tube', tube(index))}><p><RichText text={tile.text} /></p></div>;
  return (
    <div className={cn('nt-sign nt-row', tube(index))}>
      {m.image && <span className="nt-pic nt-row-pic"><Img src={m.image} /></span>}
      <span className="nt-text"><b className="nt-title nt-small">{m.title || 'Photo'}</b>{m.sub && m.sub !== m.title && tile.type !== 'image' && <span className="nt-sub">{m.sub}</span>}</span>
      <ArrowUpRight aria-hidden className="nt-go" />
    </div>
  );
}
