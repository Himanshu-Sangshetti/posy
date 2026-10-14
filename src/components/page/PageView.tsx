// Server-rendered by default; animation, effects and sharing are small client islands.
import { MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Page, Tile } from '@/lib/schema';
import { PLATFORMS, profileUrl } from '@/lib/platforms';
import { pageStyle, pageClasses, tileBackground, isDark } from '@/lib/style';
import { asset, cn } from '@/lib/utils';
import { MotionProvider, MotionShell, MotionHeader } from './motion';
import { ShareButton, TileEffects } from './islands';
import { TileContent, tileHref, brandHex, RichText, ListItem, BrandIcon } from './tiles';
import { deskTilt } from './desk';
import { StyleHeader, StyleTile, StyleRow, headerClass, socialsInHeader, type StyleId } from './styles';
import { Halftone } from './styles/lofi';
import { Clouds3D } from './Clouds3D';
import { placeTiles, canvasHeight, readingOrder, boxSize } from '@/lib/canvas-layout';
import type { TilePos } from '@/lib/schema';
import './canvas.css';

/** Splits tiles into sections at each heading tile. */
export function sections(tiles: Tile[]) {
  const out: { heading?: Extract<Tile, { type: 'heading' }>; tiles: { tile: Tile; index: number }[] }[] = [{ tiles: [] }];
  tiles.forEach((tile, index) => {
    if (tile.type === 'heading') out.push({ heading: tile, tiles: [] });
    else out[out.length - 1].tiles.push({ tile, index });
  });
  return out.filter(s => s.heading || s.tiles.length);
}

/** The 0-based position of each tile among the numbered ones (not headings or socials), so "01, 02, 03" never skips. */
export function ordinals(tiles: Tile[]) {
  const out = new Map<string, number>();
  let n = 0;
  for (const t of tiles) if (t.type !== 'heading' && t.type !== 'social') out.set(t.id, n++);
  return out;
}

/** Decorative background: gradients, mesh, aurora, patterns or a photo, plus optional grain. */
export function Backdrop() {
  return <div aria-hidden className="posy-backdrop"><span className="posy-noise" /></div>;
}

export function PageFrame({ page, children, profile, className, interactive = true }: { page: Page; children: ReactNode; profile?: ReactNode; className?: string; interactive?: boolean }) {
  const fx = page.theme.effect === 'tilt' || page.theme.effect === 'glow';
  return (
    <div className={cn(pageClasses(page), className)} style={{ ...pageStyle(page), colorScheme: isDark(page) ? 'dark' : 'light' }}>
      <Backdrop />
      {page.theme.style === 'lofi' && !isDark(page) && <Clouds3D />}
      <MotionProvider enabled={page.theme.motion}>
        <div className="posy-layout">
          {profile ?? <Profile page={page} interactive={interactive} />}
          <main className="min-w-0">{children}</main>
        </div>
        {page.badge && (
          <footer className="posy-footer">
            <a href="https://posy.page" target="_blank" rel="noopener">Made with Posy</a>
          </footer>
        )}
      </MotionProvider>
      {interactive && fx && <TileEffects />}
    </div>
  );
}

export function Avatar({ page, className }: { page: Page; className?: string }) {
  const { avatar, name } = page.profile;
  const initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className={cn('posy-avatar', className)}>
      {avatar
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={asset(avatar)} alt={name} className="size-full object-cover" />
        : <span className="posy-head grid size-full place-items-center text-[40px]">{initials}</span>}
    </div>
  );
}

/** Linktree-style row of social icons (used by the list layout). */
export function SocialRow({ tiles }: { tiles: Extract<Tile, { type: 'social' }>[] }) {
  if (!tiles.length) return null;
  return (
    <nav aria-label="Social links" className="posy-social-row">
      {tiles.map(t => {
        const p = PLATFORMS[t.platform];
        return (
          <a key={t.id} href={profileUrl(t.platform, t.handle, t.url)} target={t.platform === 'email' ? undefined : '_blank'} rel="noopener" aria-label={`${p.label}: ${t.handle}`}
            style={{ '--brand': `#${p.icon?.hex ?? '6b7280'}` } as React.CSSProperties}>
            {p.icon?.path ? <BrandIcon path={p.icon.path} size={19} /> : t.platform === 'email' ? <span className="text-[17px]">@</span> : <span className="text-[14px] font-bold">in</span>}
          </a>
        );
      })}
    </nav>
  );
}

/** Desk names set the last word in italics, like a signature. */
export function DeskName({ name }: { name: string }) {
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return <>{name}</>;
  return <>{words.slice(0, -1).join(' ')} <i>{words[words.length - 1]}</i></>;
}

export const socialTiles = (page: Page) => page.tiles.filter((t): t is Extract<Tile, { type: 'social' }> => t.type === 'social');

export function Profile({ page, interactive = true }: { page: Page; interactive?: boolean }) {
  const { name, bio, location, avatar } = page.profile;
  const { style, layout } = page.theme;
  if (style !== 'minimal') {
    const av = page.theme.avatar === 'hidden' ? null : style === 'lofi' && avatar ? <Halftone src={avatar} className="posy-avatar" /> : <Avatar page={page} />;
    return (
      <MotionHeader className={headerClass(style)}>
        <StyleHeader page={page} slots={{
          avatar: av,
          name: style === 'cozy' ? <DeskName name={name} /> : name,
          bio: bio ? <RichText text={bio} /> : null,
          caption: location || null,
          socials: <SocialRow tiles={socialTiles(page)} />,
        }} />
      </MotionHeader>
    );
  }
  const list = layout === 'list';
  return (
    <MotionHeader className="posy-profile">
      <Avatar page={page} />
      <h1 className="posy-head posy-name">{name}</h1>
      {bio && <p className="posy-bio"><RichText text={bio} /></p>}
      <div className="posy-meta">
        {location && <span className="sf-pill"><MapPin className="size-3.5" />{location}</span>}
        {interactive && <ShareButton url={page.seo.url} />}
      </div>
      {list && <SocialRow tiles={socialTiles(page)} />}
    </MotionHeader>
  );
}

export function TileShell({ tile, index, ord, children, editing, className, style, lift = true, look = 'minimal' }: { tile: Tile; index: number; ord?: number; children?: ReactNode; editing?: boolean; className?: string; style?: React.CSSProperties; lift?: boolean; look?: StyleId }) {
  if (look !== 'minimal') {
    return (
      <MotionShell
        href={editing ? null : tileHref(tile, true)}
        index={index}
        lift={lift}
        label={ariaLabel(tile)}
        tileId={tile.id}
        className={cn('posy-tile posy-obj group block', `posy-size-${tile.size}`, `posy-type-${tile.type}`, className)}
        style={{ '--rot': look === 'cozy' ? `${deskTilt(tile)}deg` : '0deg', ...style } as React.CSSProperties}
      >
        {children ?? <StyleTile style={look} tile={tile} index={ord ?? index} editing={editing} />}
      </MotionShell>
    );
  }
  return (
    <MotionShell
      href={editing ? null : tileHref(tile)}
      index={index}
      lift={lift}
      label={ariaLabel(tile)}
      tileId={tile.id}
      className={cn('posy-tile group block', `posy-size-${tile.size}`, `posy-type-${tile.type}`, className)}
      style={{ '--tile-bg': tileBackground(tile, index, brandHex(tile)), ...style } as React.CSSProperties}
    >
      {children ?? <TileContent tile={tile} editing={editing} />}
    </MotionShell>
  );
}

function ariaLabel(tile: Tile) {
  if (tile.type === 'social') return `${PLATFORMS[tile.platform].label}: ${tile.handle}`;
  if (tile.type === 'link') return tile.title || tile.url;
  if (tile.type === 'github') return `GitHub repository ${tile.repo}`;
  return undefined;
}

export function SectionHeading({ text }: { text: string }) {
  return <h2 className="posy-head posy-section">{text}</h2>;
}

function BentoTiles({ page }: { page: Page }) {
  const lift = page.theme.effect === 'lift';
  const tiles = socialsInHeader(page) ? page.tiles.filter(t => t.type !== 'social') : page.tiles;
  const ord = ordinals(page.tiles);
  return (
    <>
      {sections(tiles).map((s, i) => (
        <section key={s.heading?.id ?? `top-${i}`} className="posy-grid-wrap">
          {s.heading && <SectionHeading text={s.heading.text} />}
          {s.tiles.length > 0 && (
            <div className="posy-grid">
              {s.tiles.map(({ tile, index }) => <TileShell key={tile.id} tile={tile} index={index} ord={ord.get(tile.id)} lift={lift} look={page.theme.style} />)}
            </div>
          )}
        </section>
      ))}
    </>
  );
}

function ListTiles({ page }: { page: Page }) {
  const lift = page.theme.effect === 'lift';
  const ord = ordinals(page.tiles);
  return (
    <div className="posy-list">
      {page.tiles.map((tile, index) => {
        if (tile.type === 'social') return null;
        if (tile.type === 'heading') return <SectionHeading key={tile.id} text={tile.text} />;
        if (page.theme.style !== 'minimal') return (
          <MotionShell key={tile.id} tileId={tile.id} href={tileHref(tile, true)} index={index} lift={lift} label={ariaLabel(tile)}
            className={cn('posy-row-st group block', `posy-type-${tile.type}`, `posy-size-${tile.size}`)}>
            <StyleRow style={page.theme.style} tile={tile} index={ord.get(tile.id) ?? index} />
          </MotionShell>
        );
        return (
          <MotionShell key={tile.id} tileId={tile.id} href={tileHref(tile)} index={index} lift={lift} label={ariaLabel(tile)}
            className={cn('posy-tile posy-row group', `posy-type-${tile.type}`, `posy-size-${tile.size}`)}
            style={{ '--tile-bg': tileBackground(tile, index, brandHex(tile)) } as React.CSSProperties}>
            <ListItem tile={tile} />
          </MotionShell>
        );
      })}
    </div>
  );
}

/** CSS variables that place one tile on the canvas. */
export const canvasVars = (pos: TilePos) => ({ '--x': pos.x, '--y': pos.y, '--w': pos.w, '--h': pos.h, '--r': pos.r, '--z': pos.z }) as React.CSSProperties;

/** On phones, tiles up to about a third of the design width sit two across. */
export const halfOnPhone = (pos: TilePos) => pos.w < 480;

/** Free placement: every tile at its own position, scaled from the 1200-unit design space. Plain CSS, so it works without JS. */
function CanvasTiles({ page }: { page: Page }) {
  const lift = page.theme.effect === 'lift';
  const tiles = socialsInHeader(page) ? page.tiles.filter(t => t.type !== 'social') : page.tiles;
  const placed = placeTiles(tiles);
  const ord = ordinals(page.tiles);
  return (
    <div className="posy-canvas-wrap">
      <div className="posy-canvas" style={{ '--ch': canvasHeight(placed) } as React.CSSProperties}>
        {readingOrder(placed).map(({ tile, pos }, i) => tile.type === 'heading'
          ? <div key={tile.id} className="posy-cv posy-cv-heading" style={canvasVars(pos)}><SectionHeading text={tile.text} /></div>
          : (
            <div key={tile.id} className={cn('posy-cv', halfOnPhone(pos) && 'posy-cv-half')} style={canvasVars(pos)}>
              <TileShell tile={{ ...tile, size: boxSize(tile, pos) }} index={i} ord={ord.get(tile.id)} lift={lift} look={page.theme.style} />
            </div>
          ))}
      </div>
    </div>
  );
}

/** The public, read-only page. `contained` renders it inside a box (previews, thumbnails, mockups). */
export function PageView({ page, contained }: { page: Page; contained?: boolean }) {
  return (
    <PageFrame page={page} className={contained ? 'posy-contained' : undefined} interactive={!contained}>
      {page.theme.layout === 'list' ? <ListTiles page={page} /> : page.theme.layout === 'canvas' ? <CanvasTiles page={page} /> : <BentoTiles page={page} />}
    </PageFrame>
  );
}
