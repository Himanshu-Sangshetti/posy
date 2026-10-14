// Terminal: the page as a shell session. Monospace, box-drawn tiles, ASCII avatar, inverted selection on hover.
import type { Tile } from '@/lib/schema';
import { asset, cn } from '@/lib/utils';
import { youtubeId } from '@/lib/url';
import { VideoPlayer } from '../islands';
import { RichText } from '../tiles';
import { tileMeta, compact } from './meta';
import type { HeaderSlots } from './types';

const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'me';

export function TerminalHeader({ name, slots }: { name: string; slots: HeaderSlots }) {
  return (
    <>
      {slots.avatar && <div className="tm-avatar">{slots.avatar}</div>}
      <div className="tm-lines">
        <p className="tm-prompt"><span>~/{slug(name)}</span> $ whoami</p>
        <h1 className="posy-head posy-name tm-name">{slots.name}<span className="tm-cursor" aria-hidden /></h1>
        {slots.bio && <><p className="tm-prompt">$ cat about.txt</p><div className="posy-bio">{slots.bio}</div></>}
        {slots.caption && <p className="tm-dim"># {slots.caption}</p>}
        {slots.socials && <><p className="tm-prompt">$ ls ./elsewhere</p>{slots.socials}</>}
      </div>
    </>
  );
}

const Img = ({ src }: { src: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={asset(src)} alt="" loading="lazy" draggable={false} />
);

export function TerminalTile({ tile, editing }: { tile: Tile; editing?: boolean }) {
  const m = tileMeta(tile);
  const media = tile.size !== 's';
  return (
    <div className={cn('tm-box', `tm-t-${tile.type}`)}>
      <span className="tm-label">{m.kind}</span>
      {tile.type === 'text' && <p className="tm-note"><RichText text={tile.text} /></p>}
      {tile.type === 'image' && <><div className="tm-img"><Img src={tile.src} /></div>{tile.caption && <p className="tm-cap">&gt; {tile.caption}</p>}</>}
      {tile.type === 'video' && (
        <>
          <div className="tm-img">{youtubeId(tile.url) ? <VideoPlayer id={youtubeId(tile.url)!} title={tile.title} editing={editing} thumb={tile.image && asset(tile.image)} /> : null}</div>
          <p className="tm-cap">&gt; play {tile.title ? `"${tile.title}"` : 'video'}</p>
        </>
      )}
      {tile.type === 'music' && (
        <div className="tm-row">
          {m.image && <div className="tm-cover"><Img src={m.image} /></div>}
          <div className="tm-text"><b>♪ {m.title}</b><span>{m.sub}</span><span className="tm-dim">[▶ play]</span></div>
        </div>
      )}
      {tile.type === 'github' && (
        <div className="tm-text">
          <b>{tile.repo}</b>
          {tile.description && <span>{tile.description}</span>}
          <span className="tm-dim">{tile.stars !== undefined && `★ ${compact(tile.stars)}`}{tile.language && `  ${tile.language}`}</span>
        </div>
      )}
      {(tile.type === 'link' || tile.type === 'social') && (
        <>
          {media && m.image && <div className="tm-img tm-img-sm"><Img src={m.image} /></div>}
          <div className="tm-text"><b>{m.title}</b>{m.sub && m.sub !== m.title && <span>{m.sub}</span>}<span className="tm-dim">→ open</span></div>
        </>
      )}
    </div>
  );
}

export function TerminalRow({ tile }: { tile: Tile }) {
  const m = tileMeta(tile);
  if (tile.type === 'image' || tile.type === 'video') return <TerminalTile tile={tile} />;
  if (tile.type === 'text') return <p className="tm-row-note"><span>//</span> <RichText text={tile.text} /></p>;
  return (
    <div className="tm-line">
      <span className="tm-perm" aria-hidden>-rw-r--r--</span>
      <b>{m.title}</b>
      <span className="tm-kind">{m.kind}</span>
      <span className="tm-go" aria-hidden>→</span>
    </div>
  );
}
