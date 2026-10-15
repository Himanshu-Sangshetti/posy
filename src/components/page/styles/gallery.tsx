// Gallery: your page as a small exhibition. Photos hang framed on the wall with a mat and a little wall label beside
// them, notes are lettered straight onto the wall, links are catalogue cards, music is a listening bench, a video is
// a dark projection room, and a stamp note becomes the red dot that means "sold".
import { ArrowUpRight, Headphones, Star } from 'lucide-react';
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

export function GalleryHeader({ page, slots }: { page: Page; slots: HeaderSlots }) {
  void page;
  return (
    <>
      <div className="gl-title">
        <h1 className="posy-head posy-name gl-name">{slots.name}</h1>
        {slots.bio && <div className="posy-bio gl-bio">{slots.bio}</div>}
        {slots.caption && <p className="gl-caption">{slots.caption}</p>}
        <div className="gl-socials">{slots.socials}</div>
      </div>
      {slots.avatar && (
        <div className="gl-portrait">
          <div className="gl-frame gl-frame-portrait"><div className="gl-mat">{slots.avatar}</div></div>
        </div>
      )}
    </>
  );
}

/** The small white card that hangs beside a work. */
function Label({ title, sub, go }: { title?: string; sub?: string; go?: boolean }) {
  if (!title && !sub) return null;
  return (
    <span className="gl-label">
      {title && <b>{title}</b>}
      {sub && <span>{sub}</span>}
      {go && <ArrowUpRight aria-hidden className="gl-go" />}
    </span>
  );
}

export function GalleryTile({ tile, editing }: { tile: Tile; index: number; editing?: boolean }) {
  const m = tileMeta(tile);

  if (tile.type === 'text') {
    if (tile.look === 'stamp') return (
      <div className="gl-piece gl-dot-wrap"><span className="gl-dot" aria-hidden /><span className="gl-dot-text">{tile.text.replace(/[*[\]]|\(https?:[^)]+\)/g, '')}</span></div>
    );
    return <div className={cn('gl-piece gl-walltext', `gl-wt-${tile.size}`)}><p><RichText text={tile.text} /></p></div>;
  }

  if (tile.type === 'video') {
    const id = youtubeId(tile.url);
    return (
      <div className="gl-piece gl-room">
        <div className="gl-screen">
          {id ? <VideoPlayer id={id} title={tile.title} overlay={false} editing={editing} thumb={tile.image ? asset(tile.image) : undefined} /> : m.image && <Img src={m.image} />}
        </div>
        <Label title={m.title} sub={m.sub} />
      </div>
    );
  }

  if (tile.type === 'music') return (
    <div className="gl-piece gl-hang gl-bench">
      <div className="gl-frame gl-frame-sm"><div className="gl-mat">{m.image ? <Img src={m.image} /> : <Headphones aria-hidden className="gl-ph" />}</div></div>
      <Label title={m.title} sub={m.sub} go />
      <Headphones aria-hidden className="gl-phones" />
    </div>
  );

  if (tile.type === 'github') return (
    <div className="gl-piece gl-card gl-blueprint">
      <b className="gl-card-title gl-mono">{tile.repo}</b>
      {tile.description && <p>{tile.description}</p>}
      {(tile.stars !== undefined || tile.language) && <span className="gl-card-meta">{tile.stars !== undefined && <><Star aria-hidden className="gl-star" />{compact(tile.stars)}</>}{tile.stars !== undefined && tile.language && ' · '}{tile.language}</span>}
    </div>
  );

  // a framed work: photos, and links that bring a picture on bigger tiles
  const pic = tile.type === 'image' ? tile.src : tile.size !== 's' ? m.image : undefined;
  if (pic) {
    const title = tile.type === 'image' ? tile.caption : m.title;
    const sub = tile.type === 'image' ? undefined : m.sub !== m.title ? m.sub : undefined;
    return (
      <div className={cn('gl-piece gl-hang', tile.type !== 'image' && 'gl-linked')}>
        <div className="gl-frame"><div className="gl-mat"><Img src={pic} alt={tile.type === 'image' ? tile.alt : ''} /></div></div>
        <Label title={title} sub={sub} go={tile.type !== 'image'} />
      </div>
    );
  }

  // links without a picture: a catalogue card pinned to the wall
  return (
    <div className={cn('gl-piece gl-card', m.kind === 'newsletter' && 'gl-flyer', m.kind === 'shop' && 'gl-shop')}>
      <b className="gl-card-title">{m.title}</b>
      {m.sub && m.sub !== m.title && <p>{m.sub}</p>}
      <ArrowUpRight aria-hidden className="gl-go" />
    </div>
  );
}

export function GalleryRow({ tile }: { tile: Tile; index: number }) {
  const m = tileMeta(tile);
  if (tile.type === 'text') return <p className="gl-row-text"><RichText text={tile.text} /></p>;
  return (
    <div className="gl-row">
      {m.image && <span className="gl-frame gl-frame-xs"><span className="gl-mat"><Img src={m.image} /></span></span>}
      <span className="gl-row-label"><b>{m.title || 'Untitled'}</b>{m.sub && m.sub !== m.title && tile.type !== 'image' && <span>{m.sub}</span>}</span>
      <ArrowUpRight className="gl-go" aria-hidden />
    </div>
  );
}

