// Editorial: the page as a small magazine. Masthead name, hairlines, kickers, italic deks, a numbered contents list.
import type { Tile } from '@/lib/schema';
import { asset, cn } from '@/lib/utils';
import { youtubeId } from '@/lib/url';
import { VideoPlayer } from '../islands';
import { RichText } from '../tiles';
import { tileMeta, compact } from './meta';
import type { HeaderSlots } from './types';

export function EditorialHeader({ slots }: { slots: HeaderSlots }) {
  return (
    <>
      <div className="ed-mast">
        <h1 className="posy-head posy-name ed-name">{slots.name}</h1>
        {slots.avatar && <div className="ed-avatar">{slots.avatar}</div>}
      </div>
      <div className="ed-rule" aria-hidden />
      <div className="ed-sub">
        {slots.bio && <div className="posy-bio ed-dek">{slots.bio}</div>}
        <div className="ed-side">
          {slots.caption && <p className="ed-place">{slots.caption}</p>}
          {slots.socials}
        </div>
      </div>
    </>
  );
}

const Img = ({ src }: { src: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={asset(src)} alt="" loading="lazy" draggable={false} />
);

export function EditorialTile({ tile, index, editing }: { tile: Tile; index: number; editing?: boolean }) {
  const m = tileMeta(tile);
  const vid = tile.type === 'video' ? youtubeId(tile.url) : null;
  if (tile.type === 'text') {
    return <blockquote className="ed-item ed-quote"><p><RichText text={tile.text} /></p></blockquote>;
  }
  const showImage = (tile.type === 'image' || tile.type === 'video' || tile.type === 'music' || (tile.size !== 's' && m.image));
  return (
    <article className={cn('ed-item', `ed-t-${tile.type}`, showImage && m.image && 'ed-has-img')}>
      {showImage && (
        <figure className="ed-fig">
          {vid ? <VideoPlayer id={vid} title={undefined} editing={editing} thumb={tile.type === 'video' && tile.image ? asset(tile.image) : undefined} /> : m.image && <Img src={m.image} />}
        </figure>
      )}
      <p className="ed-kicker"><span>{String(index + 1).padStart(2, '0')}</span>{m.kind}</p>
      {tile.type !== 'image' && <h3 className="ed-title">{m.title}</h3>}
      {tile.type === 'image' ? tile.caption && <p className="ed-caption">{tile.caption}</p>
        : tile.type === 'github' ? <p className="ed-dek">{tile.description}{tile.stars !== undefined && ` · ${compact(tile.stars)} stars`}</p>
        : m.sub && m.sub !== m.title && <p className="ed-dek">{m.sub}</p>}
    </article>
  );
}

export function EditorialRow({ tile, index }: { tile: Tile; index: number }) {
  const m = tileMeta(tile);
  if (tile.type === 'image' || tile.type === 'video') return <EditorialTile tile={tile} index={index} />;
  if (tile.type === 'text') return <blockquote className="ed-quote ed-row-quote"><p><RichText text={tile.text} /></p></blockquote>;
  return (
    <div className="ed-toc">
      <span className="ed-toc-n">{String(index + 1).padStart(2, '0')}</span>
      <span className="ed-toc-title">{m.title}</span>
      <span className="ed-toc-dots" aria-hidden />
      <span className="ed-toc-kind">{m.kind}</span>
    </div>
  );
}
