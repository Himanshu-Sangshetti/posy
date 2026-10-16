// Shared by the server-rendered page and the client studio. Interactive bits live in ./islands.
// These views draw the Minimal style: plain cards on paper. The other styles draw their own tiles in ./styles.
import { ArrowUpRight, Star, Mail, Play, Music2 } from 'lucide-react';
import { Favicon, VideoPlayer } from './islands';
import type { Tile } from '@/lib/schema';
import { PLATFORMS, profileUrl } from '@/lib/platforms';
import { hostOf, safeHref, youtubeId } from '@/lib/url';
import { asset, cn } from '@/lib/utils';
import { cropStyle } from '@/lib/crop';
import { isColourful } from '@/lib/style';

type Props<T extends Tile['type']> = { tile: Extract<Tile, { type: T }>; editing?: boolean };

/** The frosted disc in the corner of link-ish tiles. */
function Badge({ children, bg, fg, round }: { children: React.ReactNode; bg?: string; fg?: string; round?: boolean }) {
  return (
    <span className={cn('sf-badge', round && 'sf-badge-round')} style={{ ...(bg ? { '--sf-badge-bg': bg } : {}), color: fg } as React.CSSProperties}>
      {children}
    </span>
  );
}

export function BrandIcon({ path, size = 20, color }: { path: string; size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color ?? 'currentColor'} aria-hidden>
      <path d={path} />
    </svg>
  );
}

/** A small round chip that appears on hover to say "this opens". */
function Corner() {
  return <span aria-hidden className="sf-go"><ArrowUpRight className="size-[15px]" /></span>;
}

/** Very small markdown: **bold**, *italic*, [text](url). */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((p, i) => {
        if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>;
        if (/^\*[^*]+\*$/.test(p)) return <em key={i}>{p.slice(1, -1)}</em>;
        const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        const href = m && safeHref(m[2]);
        if (m && !href) return <span key={i}>{m[1]}</span>;
        if (m) return <a key={i} href={href!} target="_blank" rel="noopener" className="underline decoration-[var(--accent)] decoration-2 underline-offset-4 hover:text-[var(--accent)]">{m[1]}</a>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

export function LinkTileView({ tile }: Props<'link'>) {
  const wide = tile.size === 'w' || tile.size === 'l';
  const showImage = tile.image && tile.size !== 's';
  return (
    <div className={cn('sf-link', wide && showImage && 'sf-split')}>
      <div className="sf-link-text">
        <Badge><Favicon url={tile.url} /></Badge>
        <div className="sf-copy">
          <p className="sf-title">{tile.title || hostOf(tile.url)}</p>
          {tile.description && tile.size !== 's' && <p className="sf-desc">{tile.description}</p>}
          <p className="sf-sub">{hostOf(tile.url)}</p>
        </div>
      </div>
      {showImage && (
        <div className="sf-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset(tile.image)} alt="" loading="lazy" style={cropStyle(tile)} />
        </div>
      )}
      <Corner />
    </div>
  );
}

export function SocialTileView({ tile }: Props<'social'>) {
  const p = PLATFORMS[tile.platform];
  const icon = p.icon;
  const isEmail = tile.platform === 'email';
  const hex = icon?.hex ?? '6b7280';
  // Black/white brands (X, GitHub, Threads…) use the theme's ink so they stay visible on dark themes.
  const bg = isEmail ? 'var(--accent)' : isColourful(hex) ? `#${hex}` : 'var(--text)';
  const fg = isEmail || isColourful(hex) ? '#fff' : 'var(--surface)';
  const handle = isEmail ? tile.handle : `@${tile.handle.replace(/^@/, '')}`;
  return (
    <div className="sf-social">
      <Badge bg={bg} fg={fg} round>
        {isEmail ? <Mail className="size-5" /> : icon && icon.path ? <BrandIcon path={icon.path} /> : <span className="text-[15px] font-bold tracking-tight">in</span>}
      </Badge>
      <div className="sf-copy">
        <p className="sf-title">{p.label}</p>
        <p className="sf-sub">{handle}</p>
      </div>
      <Corner />
    </div>
  );
}

export function TextTileView({ tile }: Props<'text'>) {
  const big = tile.size === 'l' || tile.size === 't';
  return (
    <div className={cn('sf-text', big && 'sf-text-big', tile.size === 's' && 'sf-text-s')}>
      <p><RichText text={tile.text} /></p>
    </div>
  );
}

export function ImageTileView({ tile }: Props<'image'>) {
  return (
    <div className="sf-photo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(tile.src)} alt={tile.alt} loading="lazy" style={cropStyle(tile)} />
      {tile.caption && <span className="sf-cap">{tile.caption}</span>}
    </div>
  );
}

export function VideoTileView({ tile, editing }: Props<'video'>) {
  const id = youtubeId(tile.url);
  if (!id) return <LinkTileView tile={{ ...tile, type: 'link' }} />;
  return <div className="sf-photo"><VideoPlayer id={id} title={tile.title} editing={editing} thumb={tile.image && asset(tile.image)} crop={cropStyle(tile)} /></div>;
}

/** A native-looking music card: cover art, title, artist and a play button that opens the track. */
export function MusicTileView({ tile }: Props<'music'>) {
  const sp = PLATFORMS.spotify.icon as { path: string };
  const cover = tile.image ? asset(tile.image) : undefined;
  const title = tile.title || 'Listen on Spotify';
  const artist = tile.artist || 'Spotify';
  if (tile.size === 's') {
    return (
      <div className="sf-music sf-music-s">
        <span className="sf-cover">{cover ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={cover} alt="" loading="lazy" style={cropStyle(tile)} /> : <Music2 className="size-7" />}</span>
        <span className="sf-play"><Play className="size-3.5 fill-current" /></span>
        <Corner />
      </div>
    );
  }
  return (
    <div className="sf-music">
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" aria-hidden className="sf-music-glow" loading="lazy" />
      )}
      <span className="sf-cover">{cover ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={cover} alt="" loading="lazy" style={cropStyle(tile)} /> : <Music2 className="size-8" />}</span>
      <div className="sf-music-body">
        <span className="sf-music-kind"><BrandIcon path={sp.path} size={13} />Now playing</span>
        <p className="sf-title">{title}</p>
        <p className="sf-sub">{artist}</p>
        <span className="sf-eq" aria-hidden><i /><i /><i /><i /><i /></span>
      </div>
      <span className="sf-play" aria-hidden><Play className="size-[17px] fill-current" /></span>
    </div>
  );
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5', Rust: '#dea584', Go: '#00ADD8', Swift: '#F05138',
  'C#': '#178600', Kotlin: '#A97BFF', Java: '#b07219', Ruby: '#701516', 'C++': '#f34b7d', C: '#555555', Svelte: '#ff3e00', Vue: '#41b883', HTML: '#e34c26', CSS: '#663399',
};

export function GithubTileView({ tile }: Props<'github'>) {
  const [owner, name] = tile.repo.split('/');
  const gh = PLATFORMS.github.icon as { path: string };
  return (
    <div className="sf-github">
      <Badge bg="var(--text)" fg="var(--surface)" round><BrandIcon path={gh.path} /></Badge>
      <div className="sf-copy">
        <p className="sf-title"><span className="sf-owner">{owner}/</span>{name}</p>
        {tile.description && tile.size !== 's' && <p className="sf-desc">{tile.description}</p>}
        {(tile.stars !== undefined || tile.language) && (
          <p className="sf-chips">
            {tile.stars !== undefined && <span className="sf-chip"><Star className="size-3" />{Intl.NumberFormat('en', { notation: 'compact' }).format(tile.stars)}</span>}
            {tile.language && <span className="sf-chip"><i style={{ background: LANG_COLORS[tile.language] ?? 'var(--muted)' }} />{tile.language}</span>}
          </p>
        )}
      </div>
      <Corner />
    </div>
  );
}

/** Where a tile links to (null = not a link). */
export function tileHref(tile: Tile, _desk = false): string | null {
  switch (tile.type) {
    case 'link': return safeHref(tile.url);
    case 'social': return safeHref(profileUrl(tile.platform, tile.handle, tile.url));
    case 'github': return `https://github.com/${tile.repo}`;
    case 'image': return safeHref(tile.url);
    case 'music': return safeHref(tile.url);
    default: return null;
  }
}

export function TileContent({ tile, editing }: { tile: Tile; editing?: boolean }) {
  switch (tile.type) {
    case 'link': return <LinkTileView tile={tile} />;
    case 'social': return <SocialTileView tile={tile} />;
    case 'text': return <TextTileView tile={tile} />;
    case 'image': return <ImageTileView tile={tile} />;
    case 'video': return <VideoTileView tile={tile} editing={editing} />;
    case 'music': return <MusicTileView tile={tile} editing={editing} />;
    case 'github': return <GithubTileView tile={tile} />;
    case 'heading': return null;
  }
}

export function brandHex(tile: Tile): string | undefined {
  return tile.type === 'social' ? PLATFORMS[tile.platform].icon?.hex : undefined;
}

/* ---------- List layout (Linktree-style rows) ---------- */
function RowText({ title, sub }: { title: string; sub?: string }) {
  return (
    <span className="sf-row-text">
      <span className="sf-title">{title}</span>
      {sub && <span className="sf-sub">{sub}</span>}
    </span>
  );
}
const RowArrow = () => <span aria-hidden className="sf-row-go"><ArrowUpRight className="size-4" /></span>;

export function ListItem({ tile }: { tile: Tile }) {
  switch (tile.type) {
    case 'link':
      return (
        <div className="posy-row-inner">
          {tile.image && tile.size !== 's'
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={asset(tile.image)} alt="" className="sf-row-thumb" loading="lazy" style={cropStyle(tile)} />
            : <Badge><Favicon url={tile.url} /></Badge>}
          <RowText title={tile.title || hostOf(tile.url)} sub={tile.description || hostOf(tile.url)} />
          <RowArrow />
        </div>
      );
    case 'github': {
      const gh = PLATFORMS.github.icon as { path: string };
      return (
        <div className="posy-row-inner">
          <Badge bg="var(--text)" fg="var(--surface)"><BrandIcon path={gh.path} /></Badge>
          <RowText title={tile.repo} sub={[tile.stars !== undefined && `★ ${Intl.NumberFormat('en', { notation: 'compact' }).format(tile.stars)}`, tile.language, tile.description].filter(Boolean).join(' · ')} />
          <RowArrow />
        </div>
      );
    }
    case 'music': {
      const cover = tile.image ? asset(tile.image) : undefined;
      return (
        <div className="posy-row-inner sf-music-row">
          <span className="sf-cover">{cover ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={cover} alt="" loading="lazy" style={cropStyle(tile)} /> : <Music2 className="size-5" />}</span>
          <RowText title={tile.title || 'Listen on Spotify'} sub={tile.artist || 'Spotify'} />
          <span className="sf-play" aria-hidden><Play className="size-3.5 fill-current" /></span>
        </div>
      );
    }
    case 'text':
      return <div className="sf-text sf-text-row"><p><RichText text={tile.text} /></p></div>;
    case 'image':
      return (
        <div className="relative" style={{ aspectRatio: tile.size === 't' ? '4 / 5' : tile.size === 's' ? '1' : '16 / 10' }}>
          <ImageTileView tile={tile} />
        </div>
      );
    case 'video': {
      const id = youtubeId(tile.url);
      return id ? <div className="relative aspect-video"><div className="sf-photo"><VideoPlayer id={id} title={tile.title} /></div></div> : null;
    }
    default:
      return null;
  }
}
