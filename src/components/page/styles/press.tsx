// Press: a weekend newspaper. The name is the masthead, links are headlines with a short dek, photos are printed in
// ink on newsprint (colour comes back on hover), notes are pull quotes, newsletters are a cut-out coupon and shops a
// classified ad. Columns are divided by hairline rules, never boxes.
import { ArrowUpRight, Play, Scissors, Star } from 'lucide-react';
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

/** A photo printed on the page: ink on newsprint until you point at it. */
const Plate = ({ src, alt, className }: { src: string; alt?: string; className?: string }) => (
  <span className={cn('pr-plate', className)}><Img src={src} alt={alt} /></span>
);

export function PressHeader({ page, slots }: { page: Page; slots: HeaderSlots }) {
  void page;
  return (
    <>
      <div className="pr-mast">
        <h1 className="posy-head posy-name pr-name">{slots.name}</h1>
      </div>
      <div className="pr-dateline">
        {slots.avatar && <div className="pr-portrait">{slots.avatar}</div>}
        <div className="pr-about">
          {slots.bio && <div className="posy-bio pr-bio">{slots.bio}</div>}
          {slots.caption && <p className="pr-caption">{slots.caption}</p>}
        </div>
        <div className="pr-socials">{slots.socials}</div>
      </div>
    </>
  );
}

export function PressTile({ tile, editing }: { tile: Tile; index: number; editing?: boolean }) {
  const m = tileMeta(tile);

  if (tile.type === 'text') {
    if (tile.look === 'stamp') return <div className="pr-art pr-kicker-box"><span className="pr-flash">{tile.text.replace(/[*[\]]|\(https?:[^)]+\)/g, '')}</span></div>;
    return (
      <figure className={cn('pr-art pr-quote', `pr-q-${tile.size}`)}>
        <blockquote><RichText text={tile.text} /></blockquote>
      </figure>
    );
  }

  if (tile.type === 'image') return (
    <figure className="pr-art pr-photo">
      <Plate src={tile.src} alt={tile.alt} />
      {tile.caption && <figcaption>{tile.caption}</figcaption>}
    </figure>
  );

  if (tile.type === 'video') {
    const id = youtubeId(tile.url);
    return (
      <div className="pr-art pr-video">
        <span className="pr-plate pr-screen">
          {id ? <VideoPlayer id={id} title={tile.title} overlay={false} editing={editing} thumb={tile.image ? asset(tile.image) : undefined} /> : m.image && <Img src={m.image} />}
        </span>
        <p className="pr-headline pr-small"><Play aria-hidden className="pr-inline-icon" />{m.title}</p>
      </div>
    );
  }

  if (tile.type === 'music') return (
    <div className="pr-art pr-listing">
      <div className="pr-listing-row">
        {m.image && <Plate src={m.image} className="pr-cover" />}
        <div>
          <p className="pr-headline pr-small"><Play aria-hidden className="pr-inline-icon" />{m.title}</p>
          <p className="pr-dek">{m.sub}</p>
        </div>
      </div>
    </div>
  );

  if (tile.type === 'github') return (
    <div className="pr-art pr-tech">
      <p className="pr-headline pr-mono">{tile.repo}</p>
      {tile.description && <p className="pr-dek">{tile.description}</p>}
      {(tile.stars !== undefined || tile.language) && (
        <p className="pr-byline">{tile.stars !== undefined && <><Star aria-hidden className="pr-inline-icon" />{compact(tile.stars)}</>}{tile.stars !== undefined && tile.language && ' · '}{tile.language}</p>
      )}
    </div>
  );

  if (m.kind === 'newsletter') return (
    <div className="pr-art pr-coupon">
      <Scissors aria-hidden className="pr-scissors" />
      <div className="pr-coupon-in">
        <p className="pr-headline">{m.title}</p>
        {tile.type === 'link' && tile.description && <p className="pr-dek">{tile.description}</p>}
        <span className="pr-cta">Subscribe</span>
      </div>
    </div>
  );

  if (m.kind === 'shop') return (
    <div className="pr-art pr-classified">
      <div className="pr-classified-in">
        <p className="pr-headline">{m.title}</p>
        {tile.type === 'link' && tile.description && <p className="pr-dek">{tile.description}</p>}
        <span className="pr-cta">Visit the shop</span>
      </div>
    </div>
  );

  // links and anything else: a headline with its dek, and the picture above it on bigger tiles
  const pic = tile.size !== 's' && m.image;
  return (
    <article className={cn('pr-art pr-story', pic && 'pr-story-pic')}>
      {pic && <Plate src={m.image!} />}
      <p className="pr-headline">{m.title}<ArrowUpRight aria-hidden className="pr-go" /></p>
      {m.sub && m.sub !== m.title && <p className="pr-dek">{m.sub}</p>}
    </article>
  );
}

export function PressRow({ tile }: { tile: Tile; index: number }) {
  const m = tileMeta(tile);
  if (tile.type === 'text') return <blockquote className="pr-row-quote"><RichText text={tile.text} /></blockquote>;
  return (
    <div className="pr-row">
      {m.image && <Plate src={m.image} className="pr-row-pic" />}
      <span className="pr-row-text"><b className="pr-headline pr-small">{m.title || 'Photo'}</b>{m.sub && m.sub !== m.title && tile.type !== 'image' && <span className="pr-dek">{m.sub}</span>}</span>
      <ArrowUpRight className="pr-go" aria-hidden />
    </div>
  );
}
