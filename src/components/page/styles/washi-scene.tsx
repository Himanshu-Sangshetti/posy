// Washi as a scene. Two ways of mounting the same things, the way Japanese studios have always shown work:
// on a computer your page is a folding screen (byobu) with your print pasted on it and your links hung from a cord
// as poem slips (tanzaku); on a phone it is a hanging scroll (kakejiku) you read top to bottom.
// Materials, not boxes: dyed slip paper, a carved seal, ink stamps, a round fan for music, a folding fan for photos.
import { Mail, Play } from 'lucide-react';
import { Fragment, type CSSProperties, type ReactNode } from 'react';
import type { Page, Tile } from '@/lib/schema';
import { PLATFORMS, type PlatformId } from '@/lib/platforms';
import { cropStyle } from '@/lib/crop';
import { asset, cn } from '@/lib/utils';
import { isDark } from '@/lib/style';
import { cleanTitle, hostOf, siteName, youtubeId } from '@/lib/url';
import { SafeImg, VideoPlayer, WashiBreeze } from '../islands';
import { BrandIcon, RichText } from '../tiles';
import { compact, tileMeta } from './meta';
import { anatomy, Arrangements, SceneName, SceneTitle, type SceneProps } from './scene';
import type { HeaderSlots } from './types';
import { WASHI_PRINTS } from './washi';

type Link = Extract<Tile, { type: 'link' | 'github' }>;
type Media = Extract<Tile, { type: 'music' | 'video' }>;
type Photo = Extract<Tile, { type: 'image' }>;
type Text = Extract<Tile, { type: 'text' }>;
type Social = Extract<Tile, { type: 'social' }>;

const Img = ({ src, className, alt = '', crop }: { src: string; className?: string; alt?: string; crop?: CSSProperties }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={asset(src)} alt={alt} loading="lazy" draggable={false} className={className} style={crop} />
);
const initials = (name: string) => name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'P';
const plain = (s: string) => s.replace(/\*\*?([^*]+)\*\*?/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
const lenClass = (s: string) => (s.length <= 12 ? 's' : s.length <= 34 ? 'm' : 'l');

/** The brand a URL belongs to, when we know its mark. */
function platformOf(url: string): PlatformId | undefined {
  const host = hostOf(url);
  return (Object.keys(PLATFORMS) as PlatformId[]).find(id => PLATFORMS[id].hosts.some(h => host === h || host.endsWith('.' + h)));
}

/** What a link slip says: a clean title, one line under it, the site it goes to. */
export function slipText(tile: Link) {
  if (tile.type === 'github') {
    const [owner, name] = tile.repo.split('/');
    const meta = [tile.stars !== undefined && `★ ${compact(tile.stars)}`, tile.language].filter(Boolean).join(' · ');
    void owner;
    return { title: name || tile.repo, sub: tile.description, site: 'GitHub', meta, url: `https://github.com/${tile.repo}`, image: undefined as string | undefined };
  }
  const site = siteName(tile.url);
  const t = cleanTitle(tile.title || site, { site, description: tile.description });
  return { title: t.title, sub: t.description ?? t.tagline, site, meta: '', url: tile.url, image: tile.image };
}

/** The site's own seal: a carved vermilion square with the brand's mark, or the site's first letter. */
function SiteSeal({ url, size = 'md' }: { url: string; size?: 'md' | 'lg' }) {
  const p = platformOf(url);
  const path = p ? PLATFORMS[p].icon?.path : undefined;
  const letter = (siteName(url).replace(/^www\./, '')[0] || '•').toUpperCase();
  return <span className={cn('wss-sseal', `wss-sseal-${size}`)} aria-hidden>{path ? <BrandIcon path={path} size={size === 'lg' ? 20 : 15} /> : <b>{letter}</b>}</span>;
}

/**
 * A link as a slip of dyed paper. `tanzaku`: a tall poem slip that hangs from the cord (computer).
 * `strip`: a long slip pasted across the scroll (phone). A featured slip carries the page's picture.
 */
export function Slip({ tile, form, feature }: { tile: Link; form: 'tanzaku' | 'strip'; feature?: boolean }) {
  const s = slipText(tile);
  const pic = feature && s.image;
  const fallback = <span className="wss-pic-blank" aria-hidden />;
  if (form === 'strip') return (
    <div className={cn('wss-strip', pic && 'wss-strip-feature')} data-len={lenClass(s.title)}>
      {pic && <span className="wss-pic"><SafeImg src={asset(s.image)!} fallback={fallback} crop={cropStyle(tile)} /></span>}
      <div className="wss-strip-row">
        <span className="wss-strip-text">
          <b className="wss-title">{s.title}</b>
          {(pic || s.meta) && s.sub && <span className="wss-strip-sub">{s.sub}</span>}
          <span className="wss-site">{s.meta ? `${s.site} · ${s.meta}` : s.site}</span>
        </span>
        <SiteSeal url={s.url} size="lg" />
      </div>
    </div>
  );
  return (
    <div className={cn('wss-tanzaku', pic && 'wss-tanzaku-feature')} data-len={lenClass(s.title)}>
      <div className="wss-tz-paper">
        {pic && <span className="wss-pic"><SafeImg src={asset(s.image)!} fallback={fallback} crop={cropStyle(tile)} /></span>}
        <b className="wss-title">{s.title}</b>
        {s.sub && <span className="wss-sub">{s.sub}</span>}
        {s.meta && <span className="wss-meta">{s.meta}</span>}
        <span className="wss-sign"><span className="wss-site">{s.site}</span><SiteSeal url={s.url} /></span>
      </div>
    </div>
  );
}

/** A social account as an ink stamp: the brand's mark carved out of a square of sumi ink. */
export function InkStamp({ tile, i = 0 }: { tile: Social; i?: number }) {
  const p = PLATFORMS[tile.platform];
  return (
    <span className="wss-ink" style={{ '--r': `${[-3, 2, -1, 3, -2, 1][i % 6]}deg` } as CSSProperties} title={p.label}>
      <span className="wss-ink-face">
        {p.icon?.path ? <BrandIcon path={p.icon.path} size={20} /> : tile.platform === 'email' ? <Mail aria-hidden /> : <b>{p.label[0]}</b>}
      </span>
    </span>
  );
}

/** Music on a round fan (uchiwa): the cover is the fan's paper, the ribs show through; it fans itself on hover. */
export function Uchiwa({ tile, form = 'full' }: { tile: Extract<Tile, { type: 'music' }>; form?: 'full' | 'strip' }) {
  const m = tileMeta(tile);
  return (
    <div className={cn('wss-music', `wss-music-${form}`)}>
      <span className="wss-uchiwa" aria-hidden>
        <span className="wss-uchiwa-face">{m.image ? <Img src={m.image} crop={cropStyle(tile)} /> : <span className="wss-uchiwa-blank" />}<i className="wss-ribs" /></span>
        <span className="wss-uchiwa-handle" />
      </span>
      <span className="wss-music-text">
        <b className="wss-title">{m.title}</b>
        <span className="wss-site">{m.sub}</span>
        <span className="wss-play" aria-hidden><Play /></span>
      </span>
    </div>
  );
}

/** A video as a mounted print with a vermilion play seal; it plays in place. */
export function Screen({ tile, editing }: { tile: Extract<Tile, { type: 'video' }>; editing?: boolean }) {
  const m = tileMeta(tile);
  const id = youtubeId(tile.url);
  return (
    <figure className="wss-mount wss-video">
      <span className="wss-mount-pic">{id ? <VideoPlayer id={id} title={tile.title} overlay={false} editing={editing} thumb={tile.image ? asset(tile.image) : undefined} crop={cropStyle(tile)} /> : m.image && <Img src={m.image} crop={cropStyle(tile)} />}</span>
      <figcaption className="wss-caption"><span className="wss-play-mark" aria-hidden /><span>{m.title}</span></figcaption>
    </figure>
  );
}

export function MediaPiece({ tile, editing, form = 'full' }: { tile: Media; editing?: boolean; form?: 'full' | 'strip' }) {
  return tile.type === 'music' ? <Uchiwa tile={tile} form={form} /> : <Screen tile={tile} editing={editing} />;
}

/** A photo as a print mounted on a paper mat, with its caption written under it. */
export function Print({ tile }: { tile: Photo }) {
  return (
    <figure className="wss-mount wss-print">
      <span className="wss-mount-pic"><Img src={tile.src} alt={tile.alt} crop={cropStyle(tile)} /></span>
      {tile.caption && <figcaption className="wss-caption"><span>{tile.caption}</span></figcaption>}
    </figure>
  );
}

/** A photo painted on a folding fan (ogi): it opens when the page loads and spreads a little more on hover. */
export function Ogi({ tile }: { tile: Photo }) {
  return (
    <figure className="wss-ogi">
      <span className="wss-ogi-sticks" aria-hidden>{Array.from({ length: 11 }, (_, i) => <i key={i} style={{ '--k': i - 5 } as CSSProperties} />)}</span>
      <span className="wss-ogi-leaf"><Img src={tile.src} alt={tile.alt} crop={cropStyle(tile)} /><i className="wss-pleats" /></span>
      <i className="wss-ogi-pin" aria-hidden />
      {tile.caption && <figcaption className="wss-caption"><span>{tile.caption}</span></figcaption>}
    </figure>
  );
}

/** A brushed ensō: one stroke of ink, heavy where the brush lands and dry at the tail; it draws itself. */
const ENSO = 'M137.8 34.6 L142.7 36.0 L147.5 37.9 L152.2 40.1 L156.7 42.8 L161.1 45.8 L164.9 49.6 L169.0 53.2 L172.8 57.1 L175.9 61.7 L178.9 66.3 L180.9 71.5 L183.2 76.6 L184.6 81.9 L185.9 87.4 L186.5 92.9 L186.4 98.5 L186.3 104.1 L185.7 109.6 L185.1 115.1 L183.7 120.5 L181.7 125.7 L180.0 130.9 L177.2 135.8 L174.8 140.7 L171.6 145.1 L168.3 149.5 L165.2 153.9 L161.1 157.6 L157.2 161.2 L153.3 165.0 L148.8 168.1 L144.1 170.7 L139.6 173.6 L134.6 175.7 L129.7 177.7 L124.5 179.1 L119.4 180.9 L114.2 181.8 L108.9 182.7 L103.5 183.0 L98.2 182.7 L92.9 182.5 L87.6 181.7 L82.4 180.7 L77.2 179.4 L72.1 177.9 L67.1 176.0 L62.5 173.4 L57.7 171.1 L53.4 168.0 L49.2 164.7 L45.1 161.4 L41.5 157.4 L38.2 153.3 L35.0 149.2 L32.1 144.8 L30.0 140.0 L27.4 135.5 L26.1 130.4 L24.3 125.6 L23.2 120.6 L22.9 115.4 L22.1 110.4 L22.3 105.3 L22.4 100.3 L23.3 95.4 L24.2 90.5 L25.3 85.7 L26.3 80.9 L28.5 76.5 L30.2 71.9 L32.4 67.6 L34.9 63.5 L37.9 59.7 L40.8 55.9 L43.8 52.2 L47.0 48.7 L50.7 45.8 L54.1 42.5 L57.9 39.7 L61.9 37.1 L66.2 35.2 L70.2 32.6 L74.8 31.2 L79.2 29.5 L83.7 28.0 L88.3 26.8 L93.1 26.4 L97.8 25.6 L102.6 25.8 L102.5 29.4 L97.9 30.0 L93.4 30.4 L89.1 31.7 L84.8 32.8 L80.6 34.1 L76.4 35.7 L72.7 38.2 L68.7 39.9 L65.3 42.7 L61.8 45.2 L58.5 48.0 L55.1 50.6 L52.4 54.0 L49.5 57.1 L46.8 60.4 L44.4 63.9 L42.5 67.8 L40.5 71.5 L38.6 75.3 L36.8 79.2 L35.9 83.4 L34.3 87.4 L33.4 91.6 L32.8 95.9 L32.8 100.3 L32.6 104.6 L33.1 108.9 L33.1 113.4 L34.4 117.6 L35.4 121.8 L36.4 126.2 L38.6 130.0 L40.1 134.2 L42.6 137.9 L45.0 141.6 L47.7 145.2 L50.8 148.4 L54.1 151.3 L57.3 154.3 L61.0 156.9 L64.9 159.0 L68.6 161.4 L72.8 162.9 L76.9 164.5 L81.1 165.9 L85.4 166.7 L89.8 167.3 L94.2 167.5 L98.5 167.6 L102.9 167.1 L107.1 166.5 L111.4 165.9 L115.6 164.8 L119.8 164.0 L123.7 162.2 L127.7 160.6 L131.4 158.4 L135.3 156.6 L138.7 153.9 L142.0 151.3 L145.6 148.8 L148.7 145.8 L151.3 142.4 L154.4 139.4 L156.8 135.8 L158.9 132.0 L161.2 128.3 L162.6 124.2 L164.5 120.3 L165.4 116.0 L166.3 111.8 L167.4 107.6 L167.8 103.2 L168.0 98.8 L167.4 94.5 L167.0 90.2 L166.4 85.8 L165.3 81.6 L164.4 77.3 L162.6 73.3 L161.1 69.1 L159.1 65.2 L157.3 61.1 L155.2 57.1 L152.2 53.7 L149.5 50.1 L146.4 46.7 L143.3 43.4 L139.8 40.2 L136.2 37.3Z';
const ENSO_SPINE = 'M137.0 35.9 L141.2 38.1 L145.4 40.6 L149.3 43.4 L153.1 46.4 L156.7 49.8 L160.0 53.3 L163.1 57.1 L165.9 61.2 L168.5 65.4 L170.7 69.8 L172.7 74.4 L174.3 79.1 L175.5 83.9 L176.4 88.8 L177.0 93.7 L177.2 98.7 L177.0 103.6 L176.5 108.6 L175.7 113.5 L174.6 118.3 L173.1 123.0 L171.3 127.6 L169.2 132.0 L166.8 136.3 L164.2 140.5 L161.3 144.4 L158.2 148.2 L154.9 151.7 L151.4 155.0 L147.6 158.1 L143.7 161.0 L139.7 163.6 L135.5 166.0 L131.2 168.1 L126.7 170.0 L122.1 171.6 L117.5 172.9 L112.8 173.9 L108.0 174.6 L103.2 175.0 L98.4 175.2 L93.5 175.0 L88.7 174.5 L83.9 173.7 L79.2 172.6 L74.5 171.2 L70.0 169.5 L65.6 167.4 L61.3 165.1 L57.2 162.4 L53.3 159.5 L49.6 156.3 L46.1 152.9 L42.9 149.3 L40.0 145.4 L37.4 141.3 L35.0 137.1 L33.0 132.7 L31.3 128.3 L29.9 123.7 L28.8 119.1 L28.0 114.4 L27.6 109.7 L27.4 105.0 L27.6 100.3 L28.0 95.6 L28.8 91.1 L29.8 86.6 L31.1 82.1 L32.6 77.8 L34.4 73.6 L36.4 69.6 L38.7 65.6 L41.1 61.8 L43.8 58.2 L46.7 54.7 L49.7 51.3 L52.9 48.2 L56.3 45.2 L59.9 42.5 L63.6 39.9 L67.5 37.5 L71.5 35.4 L75.6 33.5 L79.9 31.8 L84.2 30.4 L88.7 29.3 L93.3 28.4 L97.9 27.8 L102.5 27.6';
const Enso = () => (
  <svg className="wss-enso" viewBox="0 0 200 200" aria-hidden>
    <defs>
      <filter id="wss-dry" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency=".22 .22" numOctaves="2" seed="4" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="4" result="d" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3 2.1" result="streaks" />
        <feComposite in="d" in2="streaks" operator="in" />
      </filter>
      <mask id="wss-enso-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
        <path className="wss-enso-draw" d={ENSO_SPINE} pathLength={1} />
      </mask>
    </defs>
    <path className="wss-enso-ink" d={ENSO} mask="url(#wss-enso-mask)" filter="url(#wss-dry)" />
  </svg>
);

/** A note in brush-like serif on a gold-flecked poem card (shikishi), held by vermilion corner marks. */
export function Shikishi({ tile, form = 'card' }: { tile: Text; form?: 'card' | 'strip' }) {
  const len = plain(tile.text).length;
  return (
    <div className={cn('wss-note', `wss-note-${form}`)} data-len={len <= 40 ? 's' : len <= 110 ? 'm' : 'l'}>
      <Enso />
      <p><RichText text={tile.text} /></p>
    </div>
  );
}

/** A stamp tile as a red seal pressed into the paper; short words big, longer ones set in columns. */
export function Hanko({ tile }: { tile: Text }) {
  const t = plain(tile.text).trim();
  return (
    <span className="wss-hanko" data-len={t.length <= 8 ? 's' : t.length <= 18 ? 'm' : 'l'}>
      <span className="wss-hanko-ink">{t}</span>
    </span>
  );
}

/** A section title: a long slip of paper with the words brushed on, a vermilion dot at its head. */
export function TitleSlip({ text }: { text: string }) {
  return <h2 className="posy-head wss-head"><span>{text}</span></h2>;
}

/** A section title on the desktop: a dark lacquered slip that hangs from the cord as the first slip of its group. */
export function TitleTanzaku({ text }: { text: string }) {
  return (
    <div className="wss-tanzaku wss-tanzaku-head" data-len={lenClass(text)}>
      <div className="wss-tz-paper"><b className="wss-title posy-head">{text}</b></div>
    </div>
  );
}

/** Your seal: your initials carved in vermilion, the frame from a real Edo publisher's seal. */
const Seal = ({ name }: { name: string }) => <span className="wss-seal" aria-hidden><span>{initials(name)}</span></span>;

/** The print with your name on its title slip, the way a woodblock print names itself. */
function Masthead({ page, slots, heading = true }: { page: Page; slots: HeaderSlots; heading?: boolean }) {
  const art = WASHI_PRINTS[page.theme.preset] ?? WASHI_PRINTS.kinari;
  const name = page.profile.name.trim();
  const slip = typeof slots.name === 'string' && name.length <= 15;
  return (
    <figure className={cn('wss-masthead', slip ? 'wss-has-slip' : 'wss-has-band')}>
      <span className="wss-masthead-pic">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={art.src} alt={`${art.title}, ${art.artist}`} draggable={false} />
      </span>
      {slip
        ? <SceneName heading={heading} className="posy-head wss-name wss-name-slip" aria-label={name} style={{ '--nlen': name.length } as CSSProperties}><span aria-hidden>{slots.name}</span></SceneName>
        : <SceneName heading={heading} className="posy-head wss-name wss-name-band">{slots.name}</SceneName>}
    </figure>
  );
}

function About({ page, slots, socials }: { page: Page; slots: HeaderSlots; socials: ReactNode }) {
  return (
    <div className="wss-about">
      <div className="wss-me">
        {slots.avatar && <span className="wss-portrait">{slots.avatar}</span>}
        <Seal name={page.profile.name} />
      </div>
      <div className="wss-me-text">
        {slots.bio && <div className="wss-bio">{slots.bio}</div>}
        {slots.caption && <p className="wss-where">{slots.caption}</p>}
      </div>
      {socials && <div className="wss-stamps">{socials}</div>}
    </div>
  );
}

/**
 * The screen keeps one grid. Each piece takes units out of twelve (a slip two, a note two and a half, a round fan
 * three, a folding fan or a video four). A section starts a clean row; its slips come first, strung on
 * one cord, and its other things fill the rest of the row in page order. A short row spreads its pieces (a little) and then sits centred, so edges line up and nothing floats on its own.
 */
const SAG = 34, FULL = 12, COMPACT = 6;
// how far a short row may spread: slips stay slips, fans and stamps stay their size, so rows without a cord spread less
const spreadOf = (row: Row, cap: number) => cap === COMPACT ? Math.min(1.5, cap / row.u) : Math.min(row.cells.some(c => 'cord' in c) ? 1.3 : 1.2, cap / row.u);
const unitsOf = (t: Tile) => t.type === 'video' ? 4 : t.type === 'music' ? 3 : t.type === 'image' ? 4 : t.type === 'text' ? (t.look === 'stamp' ? 2 : 2.5) : 2;
type Cell = { cord: Link[]; u: number } | { tile: Tile; u: number };
type Row = { cells: Cell[]; u: number };
function pack(links: Link[], extras: Tile[], cap: number): Row[] {
  const per = Math.max(1, Math.floor(cap / 2));
  const cells: Cell[] = [];
  if (links.length) {
    const n = Math.ceil(links.length / per), base = Math.floor(links.length / n), more = links.length % n;
    let at = 0;
    for (let r = 0; r < n; r++) { const k = base + (r < more ? 1 : 0); cells.push({ cord: links.slice(at, at + k), u: k * 2 }); at += k; }
  }
  extras.forEach(t => cells.push({ tile: t, u: unitsOf(t) }));
  const rows: Row[] = [];
  for (const c of cells) {
    const last = rows[rows.length - 1];
    if (last && last.u + c.u <= cap + .01) { last.cells.push(c); last.u += c.u; } else rows.push({ cells: [c], u: c.u });
  }
  return rows;
}

export function WashiScene({ page, slots, piece, only, editing }: SceneProps) {
  const a = anatomy(page.tiles);
  const dark = isDark(page);
  const firstPic = a.links.findIndex(t => t.type === 'link' && t.image);
  const featured = firstPic >= 0 ? a.links[firstPic] : undefined;
  const order = new Map(page.tiles.map((t, i) => [t.id, i]));
  const extrasOf = (g: (typeof a.groups)[number]): Tile[] => [...g.media, ...g.photos, ...g.notes, ...g.stamps].sort((x, y) => (order.get(x.id) ?? 0) - (order.get(y.id) ?? 0));
  const stamps = (where: string) => a.socials.length ? a.socials.map((t, i) => piece(t, <InkStamp tile={t} i={i} />, { key: `${where}${t.id}`, className: 'wss-stamp-piece' })) : null;
  // a first-day page (no sections, a few things) hangs beside the print instead of under it
  const total = a.groups.reduce((s, g) => s + g.links.length * 2 + extrasOf(g).reduce((n, t) => n + unitsOf(t), 0), 0);
  const compact = !a.headings.length && total > 0 && total <= COMPACT + 1;
  const cap = compact ? COMPACT : FULL;

  const line = (links: Link[], u: number, rowU: number, frac: number, r: number) => {
    const n = links.length;
    const W = Math.max(120, Math.round(frac * (cap === FULL ? 1280 : 760) * u / rowU)); // about its width on a laptop, so the cord's dash animation stays true
    return (
      <div key={links[0].id} className="wss-line" style={{ '--n': n, flexGrow: u, '--sf': (frac * 2 / rowU).toFixed(4) } as CSSProperties}>
        <svg className="wss-cord" viewBox={`0 0 ${W} ${SAG * 2}`} preserveAspectRatio="none" aria-hidden>
          <path d={`M4 4Q${W / 2} ${SAG * 2 - 4} ${W - 4} 4`} vectorEffect="non-scaling-stroke" pathLength={1} />
        </svg>
        <i className="wss-pin" aria-hidden /><i className="wss-pin wss-pin-r" aria-hidden />
        {links.map((t, i) => {
          const f = (i + .5) / n * .94 + .03;
          const drop = (SAG * 2 - 8) * 2 * f * (1 - f) + 4; // the cord's height at f (control point at twice the sag)
          return piece(t, <Slip tile={t} form="tanzaku" feature={t === featured} />, {
            key: t.id, className: 'wss-hang', style: { '--drop': `${drop.toFixed(1)}px`, '--wk': r * 4 + i } as CSSProperties,
          });
        })}
      </div>
    );
  };

  const extra = (t: Tile, form: 'desk' | 'phone') => {
    const k = form === 'desk' ? '' : 'm';
    if (t.type === 'music' || t.type === 'video') return piece(t, <MediaPiece tile={t} editing={editing} form={form === 'phone' && t.type === 'music' ? 'strip' : 'full'} />, { key: k + t.id, className: `wss-x wss-x-${t.type}` });
    if (t.type === 'image') return piece(t, form === 'desk' ? <Ogi tile={t} /> : <Print tile={t} />, { key: k + t.id, className: 'wss-x wss-x-photo' });
    if (t.type === 'text' && t.look === 'stamp') return piece(t, <Hanko tile={t} />, { key: k + t.id, className: 'wss-x wss-x-stamp' });
    if (t.type === 'text') return piece(t, <Shikishi tile={t} form={form === 'desk' ? 'card' : 'strip'} />, { key: k + t.id, className: 'wss-x wss-x-note' });
    return null;
  };

  const kind = (t: Tile) => t.type === 'text' ? (t.look === 'stamp' ? 'stamp' : 'note') : t.type;
  const body = () => {
    let r = 0;
    return (
      <div className="wss-body">
        {a.groups.map((g, gi) => {
          const rows = pack(g.links, extrasOf(g), cap);
          const fr = (row: Row) => Math.min(1, row.u * spreadOf(row, cap) / cap);
          const widest = rows.reduce((m, row) => Math.max(m, fr(row)), 0) || 1;
          return (
            <section key={g.heading?.id ?? `g${gi}`} className="wss-sec">
              {g.heading && <div className="wss-sec-head" style={{ '--rw': widest } as CSSProperties}>{piece(g.heading, <TitleSlip text={g.heading.text} />, { key: g.heading.id, className: 'wss-head-piece' })}</div>}
              {rows.map((row, ri) => {
                const frac = fr(row), hung = row.cells.some(c => 'cord' in c), at = r++;
                return (
                  <div key={ri} className={cn('wss-row', hung && 'wss-row-hung')} style={{ '--rw': frac } as CSSProperties}>
                    {row.cells.map(c => 'cord' in c
                      ? line(c.cord, c.u, row.u, frac, at)
                      : <div key={c.tile.id} className={cn('wss-cell', `wss-cell-${kind(c.tile)}`)} style={{ flexGrow: c.u }}>{extra(c.tile, 'desk')}</div>)}
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
    );
  };

  const desktop = () => (
    <div className="wss-room">
      <div className={cn('wss-screen', compact && 'wss-screen-compact', compact && total <= 2 && 'wss-screen-solo')}>
        <i className="wss-folds" aria-hidden>{Array.from({ length: 6 }, (_, i) => <b key={i} />)}</i>
        {compact ? (
          <div className="wss-top">
            <Masthead page={page} slots={slots} heading={!!only} />
            <div className="wss-side">
              <About page={page} slots={slots} socials={stamps('d')} />
              {body()}
            </div>
          </div>
        ) : (
          <>
            <div className="wss-top">
              <Masthead page={page} slots={slots} heading={!!only} />
              <About page={page} slots={slots} socials={stamps('d')} />
            </div>
            {total > 0 || a.headings.length ? body() : null}
          </>
        )}
      </div>
      {!editing && <WashiBreeze />}
    </div>
  );
  const mobile = () => (
    <div className="wss-scroll">
      <div className="wss-hanger" aria-hidden><svg viewBox="0 0 120 40"><path d="M4 39 60 3l56 36" /></svg><i className="wss-rod" /></div>
      <div className="wss-silk">
        <i className="wss-futai" aria-hidden /><i className="wss-futai wss-futai-r" aria-hidden />
        <div className="wss-honshi">
          <Masthead page={page} slots={slots} heading={!!only} />
          <About page={page} slots={slots} socials={stamps('m')} />
          {a.groups.map((g, gi) => {
            const extras = extrasOf(g);
            return (
              <Fragment key={g.heading?.id ?? `g${gi}`}>
                {g.heading && piece(g.heading, <TitleSlip text={g.heading.text} />, { key: 'm' + g.heading.id, className: 'wss-head-piece' })}
                {g.links.length > 0 && (
                  <div className="wss-strips">
                    {g.links.map(t => piece(t, <Slip tile={t} form="strip" feature={t === featured} />, { key: 'm' + t.id, className: 'wss-strip-piece' }))}
                  </div>
                )}
                {extras.length > 0 && <div className="wss-m-extras">{extras.map(t => extra(t, 'phone'))}</div>}
              </Fragment>
            );
          })}
        </div>
      </div>
      <div className="wss-roller" aria-hidden><i /></div>
    </div>
  );

  return (
    <div className={cn('wss', dark ? 'wss-dark' : 'wss-light', editing && 'wss-editing')}>
      {!only && <SceneTitle name={page.profile.name} />}
      <Arrangements only={only} desktop={desktop} mobile={mobile} />
    </div>
  );
}

/**
 * Canvas layout: the header and one tile in Washi's own kit. The canvas sets each box's size; every piece fills it.
 * A link is a tall poem slip in a tall box and a long strip in a wide one (the box's shape decides, in CSS).
 */
export function WashiCanvasHeader({ page, slots }: { page: Page; slots: HeaderSlots }) {
  return (
    <div className={cn('wss wss-cvh', isDark(page) ? 'wss-dark' : 'wss-light')}>
      <Masthead page={page} slots={slots} />
      <About page={page} slots={slots} socials={slots.socials} />
    </div>
  );
}

export function WashiCanvasTile({ tile, editing }: { tile: Tile; index: number; editing?: boolean }) {
  let node: ReactNode = null;
  if (tile.type === 'link' || tile.type === 'github') node = (
    <>
      <span className="wss-cv-tall"><Slip tile={tile} form="tanzaku" feature /></span>
      <span className="wss-cv-wide"><Slip tile={tile} form="strip" feature /></span>
    </>
  );
  else if (tile.type === 'music') node = (
    <>
      <span className="wss-cv-tall"><Uchiwa tile={tile} /></span>
      <span className="wss-cv-wide"><Uchiwa tile={tile} form="strip" /></span>
    </>
  );
  else if (tile.type === 'video') node = <Screen tile={tile} editing={editing} />;
  else if (tile.type === 'image') node = <Print tile={tile} />;
  else if (tile.type === 'text') node = tile.look === 'stamp' ? <Hanko tile={tile} /> : <Shikishi tile={tile} />;
  else if (tile.type === 'social') node = (
    <div className="wss-strip wss-cv-social"><div className="wss-strip-row"><InkStamp tile={tile} /><span className="wss-strip-text"><b className="wss-title">{PLATFORMS[tile.platform].label}</b><span className="wss-site">{tile.handle}</span></span></div></div>
  );
  return <div className={cn('wss wss-cv', `wss-cv-${tile.type}`, tile.type === 'text' && tile.look === 'stamp' && 'wss-cv-stamp')}>{node}</div>;
}
