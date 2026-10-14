// Server-rendered by default; animation and sharing are small client islands.
import { MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import { MotionProvider, MotionShell, MotionHeader } from './motion';
import { ShareButton } from './islands';
import type { Page, Tile } from '@/lib/schema';
import { pageStyle, isDark, tileBackground } from '@/lib/style';
import { asset, cn } from '@/lib/utils';
import { TileContent, tileHref, brandHex, RichText } from './tiles';

/** Splits tiles into sections at each heading tile. */
export function sections(tiles: Tile[]) {
  const out: { heading?: Extract<Tile, { type: 'heading' }>; tiles: { tile: Tile; index: number }[] }[] = [{ tiles: [] }];
  tiles.forEach((tile, index) => {
    if (tile.type === 'heading') out.push({ heading: tile, tiles: [] });
    else out[out.length - 1].tiles.push({ tile, index });
  });
  return out.filter(s => s.heading || s.tiles.length);
}

export function PageFrame({ page, children, profile, className }: { page: Page; children: ReactNode; profile?: ReactNode; className?: string }) {
  return (
    <div
      className={cn('posy-page posy-grain bg-[var(--bg)] text-[var(--text)] transition-colors duration-500', page.theme.layout === 'stack' ? 'posy-stack' : 'posy-split', page.theme.motion && 'posy-motion', isDark(page) && 'dark', className)}
      style={{ ...pageStyle(page), colorScheme: isDark(page) ? 'dark' : 'light' }}
    >
      <MotionProvider enabled={page.theme.motion}>
        <div className="posy-layout">
          {profile ?? <Profile page={page} />}
          <main className="min-w-0">{children}</main>
        </div>
        {page.badge && (
          <footer className="relative z-[1] pb-10 text-center text-[13px] text-[var(--muted)]">
            <a href="https://github.com/Himanshu-Sangshetti/posy" className="transition-colors hover:text-[var(--text)]" target="_blank" rel="noopener">Made with Posy</a>
          </footer>
        )}
      </MotionProvider>
    </div>
  );
}

export function Avatar({ page, className }: { page: Page; className?: string }) {
  const { avatar, name } = page.profile;
  const initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className={cn('relative size-[112px] shrink-0 overflow-hidden rounded-[36%] bg-[linear-gradient(135deg,var(--tint-peach),var(--tint-lilac))] shadow-[0_10px_30px_-14px_rgb(0_0_0/.35)] ring-4 ring-[var(--surface)]', className)}>
      {avatar
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={asset(avatar)} alt={name} className="size-full object-cover" />
        : <span className="posy-head grid size-full place-items-center text-[40px] text-[var(--text)]">{initials}</span>}
    </div>
  );
}

export function Profile({ page }: { page: Page }) {
  const { name, bio, location } = page.profile;
  return (
    <MotionHeader className="posy-profile">
      <Avatar page={page} />
      <h1 className="posy-head mt-3 text-[42px] leading-[1.02] sm:text-[50px]">{name}</h1>
      {bio && <p className="max-w-[34ch] whitespace-pre-line text-[17px] leading-relaxed text-[var(--muted)]"><RichText text={bio} /></p>}
      <div className="flex items-center gap-4 text-[14px] text-[var(--muted)]">
        {location && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{location}</span>}
        <ShareButton url={page.seo.url} />
      </div>
    </MotionHeader>
  );
}

export function TileShell({ tile, index, children, editing, className, style }: { tile: Tile; index: number; children?: ReactNode; editing?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <MotionShell
      href={editing ? null : tileHref(tile)}
      index={index}
      label={ariaLabel(tile)}
      className={cn('posy-tile group block', `posy-size-${tile.size}`, className)}
      style={{ background: tileBackground(tile, index, brandHex(tile)), ...style }}
    >
      {children ?? <TileContent tile={tile} editing={editing} />}
    </MotionShell>
  );
}

function ariaLabel(tile: Tile) {
  if (tile.type === 'social') return `${tile.platform}: ${tile.handle}`;
  if (tile.type === 'link') return tile.title || tile.url;
  if (tile.type === 'github') return `GitHub repository ${tile.repo}`;
  return undefined;
}

export function SectionHeading({ text }: { text: string }) {
  return <h2 className="posy-head mb-4 px-1 text-[26px] leading-tight">{text}</h2>;
}

/** The public, read-only page. */
export function PageView({ page }: { page: Page }) {
  return (
    <PageFrame page={page}>
      {sections(page.tiles).map((s, i) => (
        <section key={s.heading?.id ?? `top-${i}`} className="posy-grid-wrap">
          {s.heading && <SectionHeading text={s.heading.text} />}
          {s.tiles.length > 0 && (
            <div className="posy-grid">
              {s.tiles.map(({ tile, index }) => <TileShell key={tile.id} tile={tile} index={index} />)}
            </div>
          )}
        </section>
      ))}
    </PageFrame>
  );
}
