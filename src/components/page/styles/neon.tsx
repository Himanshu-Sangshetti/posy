// Neon: a cyberpunk night. Cut-corner panels with glowing edges, duotone photos, a glitching name, a synthwave floor.
import { ArrowUpRight, Mail, ShoppingBag } from 'lucide-react';
import type { Tile } from '@/lib/schema';
import { asset, cn } from '@/lib/utils';
import { youtubeId } from '@/lib/url';
import { VideoPlayer } from '../islands';
import { BrandIcon, RichText } from '../tiles';
import { tileMeta, compact } from './meta';
import type { HeaderSlots } from './types';

const GLOW: Record<string, string> = { peach: '#ff8a3d', butter: '#f4ff52', mint: '#3dffb5', sky: '#2be4ff', lilac: '#b26bff', rose: '#ff3ea5' };
const CYCLE = ['var(--accent)', '#2be4ff', '#b26bff', '#3dffb5'];

/** The glow colour of a tile: its chosen colour, or a cycle that starts from the page accent. */
export function neonColor(tile: Tile, index: number) {
  if (tile.color === 'accent' || tile.color === 'surface') return 'var(--accent)';
  return GLOW[tile.color] ?? CYCLE[index % CYCLE.length];
}

export function NeonHeader({ name, slots }: { name: string; slots: HeaderSlots }) {
  return (
    <>
      {slots.avatar && <div className="nn-avatar">{slots.avatar}</div>}
      <h1 className="posy-head posy-name nn-name" data-text={name}>{slots.name}</h1>
      {slots.bio && <div className="posy-bio">{slots.bio}</div>}
      {slots.caption && <p className="nn-caption">{slots.caption}</p>}
      {slots.socials}
    </>
  );
}

const Img = ({ src }: { src: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={asset(src)} alt="" loading="lazy" draggable={false} />
);

export function NeonTile({ tile, index, editing }: { tile: Tile; index: number; editing?: boolean }) {
  const m = tileMeta(tile);
  const big = tile.size !== 's';
  const vid = tile.type === 'video' ? youtubeId(tile.url) : null;
  // Text-only panels get one big glowing mark up top instead of empty space.
  const glyph = (tile.type === 'link' || tile.type === 'github') && !(big && m.image);
  return (
    <div className={cn('nn-panel', `nn-t-${tile.type}`)} style={{ '--n': neonColor(tile, index) } as React.CSSProperties}>
      <span className="nn-label">{`// ${m.kind}`}</span>
      {tile.type === 'text' && <p className="nn-note"><RichText text={tile.text} /></p>}
      {(tile.type === 'image' || tile.type === 'video' || (big && m.image && tile.type !== 'music')) && (
        <div className="nn-img">
          {vid ? <VideoPlayer id={vid} title={tile.type === 'video' ? tile.title : undefined} editing={editing} thumb={tile.type === 'video' && tile.image ? asset(tile.image) : undefined} /> : m.image && <Img src={m.image} />}
        </div>
      )}
      {glyph && <span className="nn-glyph" aria-hidden>{m.icon ? <BrandIcon path={m.icon} size={64} /> : (() => { const I = m.kind === 'shop' ? ShoppingBag : m.kind === 'newsletter' ? Mail : ArrowUpRight; return <I size={64} strokeWidth={1.25} />; })()}</span>}
      {tile.type === 'music' && m.image && <div className="nn-cover"><Img src={m.image} /></div>}
      {tile.type !== 'text' && tile.type !== 'image' && tile.type !== 'video' && (
        <div className="nn-text">
          <b>{m.title}</b>
          {tile.type === 'github'
            ? <span>{tile.stars !== undefined && `★ ${compact(tile.stars)}`}{tile.language && ` · ${tile.language}`}</span>
            : m.sub && m.sub !== m.title && <span>{m.sub}</span>}
        </div>
      )}
      {tile.type === 'image' && tile.caption && <p className="nn-cap">{tile.caption}</p>}
      {m.icon && tile.type !== 'video' && !glyph && <span className="nn-icon" aria-hidden><BrandIcon path={m.icon} size={18} /></span>}
    </div>
  );
}

export function NeonRow({ tile, index }: { tile: Tile; index: number }) {
  const m = tileMeta(tile);
  if (tile.type === 'image' || tile.type === 'video') return <NeonTile tile={tile} index={index} />;
  if (tile.type === 'text') return <p className="nn-row-note" style={{ '--n': neonColor(tile, index) } as React.CSSProperties}><RichText text={tile.text} /></p>;
  return (
    <div className="nn-bar" style={{ '--n': neonColor(tile, index) } as React.CSSProperties}>
      <span className="nn-num">{String(index + 1).padStart(2, '0')}</span>
      <span className="nn-bar-text"><b>{m.title}</b><span>{m.kind}</span></span>
      <span className="nn-go" aria-hidden>↗</span>
    </div>
  );
}
