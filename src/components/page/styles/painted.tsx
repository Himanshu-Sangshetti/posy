// Painted: Posy's own world. The page floats in a watercolour sky; tiles are pieces of watercolour paper with torn
// edges and a soft wash of colour, photos are painted to the edge, notes are handwritten letters, newsletters come in
// an envelope with a wax seal, and a stamp note is the seal itself.
import { ArrowUpRight, Play, Star } from 'lucide-react';
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

const WASHES = ['peach', 'sky', 'butter', 'lilac', 'mint', 'rose'];
/** A soft wash of colour in one corner of the paper: the tile's own colour, or one of the palette's tints in turn. */
const wash = (tile: Tile, index: number) => {
  const c = tile.color === 'auto' || tile.color === 'surface' ? WASHES[index % WASHES.length] : tile.color;
  return { '--wash': c === 'accent' ? 'var(--accent)' : `var(--tint-${c})` } as React.CSSProperties;
};

export function PaintedHeader({ page, slots }: { page: Page; slots: HeaderSlots }) {
  void page;
  return (
    <>
      {slots.avatar && <div className="pt-portrait">{slots.avatar}</div>}
      <div className="pt-intro">
        <h1 className="posy-head posy-name pt-name">{slots.name}</h1>
        {slots.bio && <div className="posy-bio pt-bio">{slots.bio}</div>}
        {slots.caption && <p className="pt-caption">{slots.caption}</p>}
        <div className="pt-socials">{slots.socials}</div>
      </div>
    </>
  );
}

const Seal = ({ text }: { text?: string }) => <span className="pt-seal" aria-hidden>{text && <i>{text}</i>}</span>;

export function PaintedTile({ tile, index, editing }: { tile: Tile; index: number; editing?: boolean }) {
  const m = tileMeta(tile);

  if (tile.type === 'text') {
    if (tile.look === 'stamp') return (
      <div className="pt-seal-wrap"><span className="pt-seal pt-seal-big"><i>{tile.text.replace(/[*[\]]|\(https?:[^)]+\)/g, '')}</i></span></div>
    );
    return (
      <div className={cn('pt-paper pt-letter', `pt-l-${tile.size}`)}>
        <p><RichText text={tile.text} /></p>
      </div>
    );
  }

  if (tile.type === 'image') return (
    <figure className="pt-paper pt-photo" style={wash(tile, index)}>
      <span className="pt-pic"><Img src={tile.src} alt={tile.alt} /></span>
      {tile.caption && <figcaption>{tile.caption}</figcaption>}
    </figure>
  );

  if (tile.type === 'video') {
    const id = youtubeId(tile.url);
    return (
      <div className="pt-paper pt-photo pt-video" style={wash(tile, index)}>
        <span className="pt-pic">
          {id ? <VideoPlayer id={id} title={tile.title} overlay={false} editing={editing} thumb={tile.image ? asset(tile.image) : undefined} /> : m.image && <Img src={m.image} />}
        </span>
        <p className="pt-cap-row"><Play aria-hidden className="pt-play" />{m.title}</p>
      </div>
    );
  }

  if (tile.type === 'music') return (
    <div className="pt-paper pt-music" style={wash(tile, index)}>
      <span className="pt-record">{m.image && <Img src={m.image} />}</span>
      <div className="pt-text"><b>{m.title}</b><span>{m.sub}</span></div>
    </div>
  );

  if (tile.type === 'github') return (
    <div className="pt-paper pt-card" style={wash(tile, index)}>
      <b className="pt-title pt-mono">{tile.repo}</b>
      {tile.description && <p className="pt-desc">{tile.description}</p>}
      {(tile.stars !== undefined || tile.language) && <span className="pt-meta">{tile.stars !== undefined && <><Star aria-hidden className="pt-star" />{compact(tile.stars)}</>}{tile.stars !== undefined && tile.language && ' · '}{tile.language}</span>}
    </div>
  );

  if (m.kind === 'newsletter') return (
    <div className="pt-env" style={wash(tile, index)}>
      <div className="pt-env-body">
        <b className="pt-title">{m.title}</b>
        {tile.type === 'link' && tile.description && <p className="pt-desc">{tile.description}</p>}
      </div>
      <Seal />
    </div>
  );

  const pic = tile.size !== 's' && m.image;
  return (
    <div className={cn('pt-paper pt-card', pic && 'pt-card-pic', m.kind === 'shop' && 'pt-shop')} style={wash(tile, index)}>
      {pic && <span className="pt-pic"><Img src={m.image!} /></span>}
      <div className="pt-text">
        <b className="pt-title">{m.title}</b>
        {m.sub && m.sub !== m.title && <span className="pt-desc">{m.sub}</span>}
      </div>
      <span className="pt-go" aria-hidden><ArrowUpRight /></span>
    </div>
  );
}

export function PaintedRow({ tile, index }: { tile: Tile; index: number }) {
  const m = tileMeta(tile);
  if (tile.type === 'text') return <div className="pt-paper pt-letter pt-row-letter"><p><RichText text={tile.text} /></p></div>;
  return (
    <div className="pt-paper pt-row" style={wash(tile, index)}>
      {m.image && <span className="pt-pic pt-row-pic"><Img src={m.image} /></span>}
      <span className="pt-text"><b className="pt-title">{m.title || 'Photo'}</b>{m.sub && m.sub !== m.title && tile.type !== 'image' && <span className="pt-desc">{m.sub}</span>}</span>
      <span className="pt-go" aria-hidden><ArrowUpRight /></span>
    </div>
  );
}
