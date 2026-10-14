// Shared by the server-rendered page and the client studio. Interactive bits live in ./islands.
import { ArrowUpRight, Star, Mail } from 'lucide-react';
import { Favicon, VideoPlayer } from './islands';
import type { Tile } from '@/lib/schema';
import { PLATFORMS, profileUrl } from '@/lib/platforms';
import { hostOf, youtubeId, spotifyEmbed } from '@/lib/url';
import { asset, cn } from '@/lib/utils';
import { isColourful } from '@/lib/style';

type Props<T extends Tile['type']> = { tile: Extract<Tile, { type: T }>; editing?: boolean };

/** The square icon in the corner of link-ish tiles. */
function Badge({ children, bg, fg }: { children: React.ReactNode; bg: string; fg?: string }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-[12px] shadow-[0_1px_2px_rgb(0_0_0/.06)]" style={{ background: bg, color: fg }}>
      {children}
    </span>
  );
}

function BrandIcon({ path, size = 20, color }: { path: string; size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color ?? 'currentColor'} aria-hidden>
      <path d={path} />
    </svg>
  );
}

function Corner() {
  return (
    <ArrowUpRight
      aria-hidden
      className="absolute right-4 top-4 size-4 text-[var(--muted)] opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
    />
  );
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
        if (m) return <a key={i} href={m[2]} target="_blank" rel="noopener" className="underline decoration-[var(--accent)] decoration-2 underline-offset-4 hover:text-[var(--accent)]">{m[1]}</a>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

export function LinkTileView({ tile }: Props<'link'>) {
  const wide = tile.size === 'w' || tile.size === 'l';
  const showImage = tile.image && tile.size !== 's';
  return (
    <div className={cn('flex h-full gap-4 p-5', wide && showImage ? 'flex-row' : 'flex-col justify-between')}>
      <div className={cn('flex min-w-0 flex-col justify-between', wide && showImage && 'flex-1')}>
        <Badge bg="var(--surface)"><Favicon url={tile.url} /></Badge>
        <div className="mt-3 min-w-0">
          <p className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-[-0.01em]">{tile.title || hostOf(tile.url)}</p>
          {tile.description && tile.size !== 's' && <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[var(--muted)]">{tile.description}</p>}
          <p className="mt-1 truncate text-[13px] text-[var(--muted)]">{hostOf(tile.url)}</p>
        </div>
      </div>
      {showImage && (
        <div className={cn('overflow-hidden rounded-[calc(var(--radius-tile)-12px)]', wide ? 'flex-1' : 'min-h-0 flex-1')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset(tile.image)} alt="" className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" loading="lazy" />
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
    <div className="flex h-full flex-col justify-between p-5">
      <Badge bg={bg} fg={fg}>
        {isEmail ? <Mail className="size-5" /> : icon && icon.path ? <BrandIcon path={icon.path} /> : <span className="text-[15px] font-bold tracking-tight">in</span>}
      </Badge>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold tracking-[-0.01em]">{p.label}</p>
        <p className="truncate text-[13px] text-[var(--muted)]">{handle}</p>
      </div>
      <Corner />
    </div>
  );
}

export function TextTileView({ tile }: Props<'text'>) {
  const big = tile.size === 'l' || tile.size === 't';
  return (
    <div className={cn('flex h-full p-5', big ? 'items-end' : 'items-center')}>
      <p className={cn('font-medium leading-snug tracking-[-0.015em]', tile.size === 's' ? 'line-clamp-5 text-[15px]' : big ? 'text-[21px] leading-[1.3]' : 'line-clamp-4 text-[17px] leading-[1.45]')}>
        <RichText text={tile.text} />
      </p>
    </div>
  );
}

export function ImageTileView({ tile }: Props<'image'>) {
  return (
    <div className="relative h-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(tile.src)} alt={tile.alt} className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" loading="lazy" />
      {tile.caption && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/25 via-black/5 to-transparent p-4 pt-12">
          <p className="text-[14px] font-medium text-white [text-shadow:0_1px_8px_rgb(0_0_0/.35)]">{tile.caption}</p>
        </div>
      )}
    </div>
  );
}

export function VideoTileView({ tile, editing }: Props<'video'>) {
  const id = youtubeId(tile.url);
  if (!id) return <LinkTileView tile={{ ...tile, type: 'link' }} />;
  return <VideoPlayer id={id} title={tile.title} editing={editing} />;
}

export function MusicTileView({ tile, editing }: Props<'music'>) {
  const src = spotifyEmbed(tile.url);
  if (!src || tile.size === 's') {
    return (
      <div className="flex h-full flex-col justify-between p-5">
        <Badge bg="#1DB954" fg="#fff"><BrandIcon path={(PLATFORMS.spotify.icon as { path: string }).path} color="#fff" /></Badge>
        <div><p className="text-[15px] font-semibold">Spotify</p><p className="text-[13px] text-[var(--muted)]">Listen</p></div>
        <Corner />
      </div>
    );
  }
  return (
    <iframe
      className={cn('size-full', editing && 'pointer-events-none')}
      style={{ colorScheme: 'normal' }}
      src={`${src}?utm_source=generator&theme=0`}
      title="Spotify"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
    />
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
    <div className="flex h-full flex-col justify-between p-5">
      <Badge bg="var(--text)" fg="var(--surface)"><BrandIcon path={gh.path} /></Badge>
      <div className="min-w-0">
        <p className="truncate text-[15px] tracking-[-0.01em]"><span className="text-[var(--muted)]">{owner}/</span><span className="font-semibold">{name}</span></p>
        {tile.description && tile.size !== 's' && <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[var(--muted)]">{tile.description}</p>}
        {(tile.stars !== undefined || tile.language) && (
          <p className="mt-2 flex items-center gap-3 text-[12.5px] text-[var(--muted)]">
            {tile.stars !== undefined && <span className="inline-flex items-center gap-1"><Star className="size-3.5" />{Intl.NumberFormat('en', { notation: 'compact' }).format(tile.stars)}</span>}
            {tile.language && <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: LANG_COLORS[tile.language] ?? 'var(--muted)' }} />{tile.language}</span>}
          </p>
        )}
      </div>
      <Corner />
    </div>
  );
}

/** Where a tile links to (null = not a link). */
export function tileHref(tile: Tile): string | null {
  switch (tile.type) {
    case 'link': return tile.url;
    case 'social': return profileUrl(tile.platform, tile.handle, tile.url);
    case 'github': return `https://github.com/${tile.repo}`;
    case 'image': return tile.url ?? null;
    case 'music': return tile.size === 's' ? tile.url : null;
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
