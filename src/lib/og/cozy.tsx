// "Cozy" share image: the page as a little desk. Profile on the left, a few of the person's own
// tiles on the right as paper objects (polaroid, sticky note, record, ticket, tag, stickers),
// in their theme colours and heading font. Mirrors components/page/desk.tsx.
import 'server-only';
import type { Tile } from '@/lib/schema';
import type { Theme, Tint } from '@/lib/themes';
import { PLATFORMS } from '@/lib/platforms';
import { hostOf, youtubeId } from '@/lib/url';
import { fontPair, type FontSpec } from './fonts';
import { loadImage } from './images';
import type { OgInput, OgStyle } from './index';
import { initials } from './util';

const NEWSLETTER = /(^|\.)(substack\.com|buttondown\.(email|com)|beehiiv\.com|kit\.com|convertkit\.com|ghost\.io)$/;
const HAND: FontSpec = { family: 'Caveat', weight: 600 };
const MONO: FontSpec = { family: 'Geist Mono', weight: 400 };
const MARK: FontSpec = { family: 'Instrument Serif', weight: 400, italic: true };

type Slot = { x: number; y: number; w: number; h: number; r: number };
type Shape = 'tall' | 'square' | 'wide';
type Obj = { shape: Shape; rank: number; draw: (s: Slot) => React.ReactElement };
type Ctx = { t: Theme; paper: string; ink: string; shadow: string; head: string; headWeight: number; body: string };

const clip = (s: string, n: number) => {
  const flat = s.replace(/\s+/g, ' ').trim();
  if (flat.length <= n) return flat;
  const cut = flat.slice(0, n);
  return (cut.slice(0, Math.max(cut.lastIndexOf(' '), n * 0.6)) || cut).replace(/[\s,.;:–-]+$/, '') + '…';
};
const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
const tintOf = (t: Theme, tile: Tile, fallback: Tint) =>
  tile.color === 'auto' ? t.tints[fallback] : tile.color === 'surface' ? t.surface : tile.color === 'accent' ? mix(t.accent, t.surface, 0.3) : t.tints[tile.color];
function mix(a: string, b: string, k: number) {
  const p = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, i) => Math.round(v * k + y[i] * (1 - k)).toString(16).padStart(2, '0')).join('');
}

const at = (s: Slot, extra: React.CSSProperties = {}): React.CSSProperties =>
  ({ position: 'absolute', left: s.x, top: s.y, width: s.w, height: s.h, transform: `rotate(${s.r}deg)`, display: 'flex', ...extra });

function Glyph({ path, size, color }: { path: string; size: number; color: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24"><path d={path} fill={color} /></svg>;
}
const Flower = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    {[0, 72, 144, 216, 288].map(a => <circle key={a} cx={12 + 6 * Math.sin((a * Math.PI) / 180)} cy={12 - 6 * Math.cos((a * Math.PI) / 180)} r={4.6} fill={color} />)}
    <circle cx={12} cy={12} r={3.4} fill="#fffaf0" />
  </svg>
);

// ---------- objects ----------

async function polaroid(tile: Extract<Tile, { type: 'image' }>, c: Ctx): Promise<Obj | null> {
  const img = await loadImage(tile.src, 240, 240);
  if (!img) return null;
  return {
    shape: 'tall', rank: 6,
    draw: s => {
      const side = s.w - 28;
      return (
        <div style={at(s, { flexDirection: 'column', alignItems: 'center', padding: '14px 14px 0', background: c.paper, boxShadow: c.shadow })}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} width={side} height={Math.min(side, s.h - 74)} style={{ objectFit: 'cover' }} alt="" />
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', fontFamily: 'Caveat', fontSize: 30, color: '#4a423b' }}>{tile.caption ? clip(tile.caption, 22) : ''}</div>
        </div>
      );
    },
  };
}

function note(tile: Extract<Tile, { type: 'text' }>, c: Ctx): Obj {
  const bg = tintOf(c.t, tile, tile.look === 'stamp' ? 'lilac' : 'butter');
  const text = clip(plain(tile.text), tile.look === 'stamp' ? 34 : 64);
  if (tile.look === 'stamp') return {
    shape: 'square', rank: 4,
    draw: s => {
      const d = Math.min(s.w, s.h);
      return (
        <div style={at({ ...s, w: d, h: d }, { alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, borderRadius: d, background: bg, boxShadow: c.shadow, padding: 30, border: `2px dashed ${mix(c.t.text, bg, 0.22)}` })}>
          <Flower size={30} color={c.t.accent} />
          <div style={{ display: 'flex', textAlign: 'center', fontFamily: c.head, fontWeight: c.headWeight, fontSize: text.length > 20 ? 22 : 27, lineHeight: 1.1, color: c.t.text }}>{text}</div>
        </div>
      );
    },
  };
  return {
    shape: 'square', rank: 5,
    draw: s => (
      <div style={at(s, { flexDirection: 'column', padding: '26px 24px', background: bg, boxShadow: c.shadow })}>
        <div style={{ position: 'absolute', top: -12, left: s.w / 2 - 46, width: 92, height: 26, background: mix(c.t.tints.sky, '#ffffff', 0.75), opacity: 0.85, transform: 'rotate(-3deg)' }} />
        <div style={{ display: 'flex', fontFamily: 'Caveat', fontSize: text.length > 44 ? 31 : 36, lineHeight: 1.08, color: c.t.text }}>{text}</div>
      </div>
    ),
  };
}

async function vinyl(tile: Extract<Tile, { type: 'music' }>, c: Ctx): Promise<Obj> {
  const img = await loadImage(tile.image, 190, 190);
  const bg = tintOf(c.t, tile, 'rose');
  const spotify = PLATFORMS.spotify.icon!.path;
  return {
    shape: 'tall', rank: 5,
    draw: s => {
      const side = Math.min(s.w - 50, s.h - 70);
      return (
        <div style={at(s, { flexDirection: 'column' })}>
          <div style={{ position: 'absolute', left: side * 0.32, top: 6, width: side - 12, height: side - 12, borderRadius: side, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundImage: 'repeating-radial-gradient(circle, #1d1b1a 0px, #1d1b1a 3px, #2b2826 4px, #1d1b1a 6px)', boxShadow: c.shadow }}>
            <div style={{ width: side * 0.3, height: side * 0.3, borderRadius: side, background: c.t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 10, height: 10, borderRadius: 10, background: '#1d1b1a' }} />
            </div>
          </div>
          <div style={{ display: 'flex', width: side, height: side, background: bg, boxShadow: c.shadow, alignItems: 'center', justifyContent: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {img ? <img src={img} width={side} height={side} style={{ objectFit: 'cover' }} alt="" /> : <Glyph path={spotify} size={54} color={c.t.text} />}
          </div>
          <div style={{ display: 'flex', marginTop: 10, fontFamily: 'Caveat', fontSize: 28, color: c.t.text, width: s.w }}>{clip(tile.title || 'on repeat', 24)}</div>
        </div>
      );
    },
  };
}

async function ticket(tile: Extract<Tile, { type: 'video' }>, c: Ctx): Promise<Obj> {
  const id = youtubeId(tile.url);
  const img = await loadImage(tile.image || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined), 200, 120);
  const bg = tintOf(c.t, tile, 'peach');
  return {
    shape: 'wide', rank: 4,
    draw: s => (
      <div style={at(s, { background: bg, boxShadow: c.shadow, borderRadius: 10, padding: 10 })}>
        <div style={{ display: 'flex', flex: 1, borderRadius: 6, overflow: 'hidden', background: mix(c.t.text, bg, 0.15), alignItems: 'flex-end' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {img && <img src={img} width={s.w - 92} height={s.h - 20} style={{ position: 'absolute', objectFit: 'cover' }} alt="" />}
        </div>
        <div style={{ display: 'flex', width: 62, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, borderLeft: `2px dashed ${mix(c.t.text, bg, 0.25)}`, marginLeft: 10 }}>
          <div style={{ display: 'flex', width: 38, height: 38, borderRadius: 38, background: c.paper, alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z" fill="#2d2723" /></svg>
          </div>
          <div style={{ display: 'flex', fontFamily: 'Caveat', fontSize: 22, color: c.t.text }}>watch</div>
        </div>
      </div>
    ),
  };
}

async function linkObj(tile: Extract<Tile, { type: 'link' }>, c: Ctx): Promise<Obj> {
  const host = hostOf(tile.url);
  const title = clip(tile.title || host, 30);
  const img = tile.image && !NEWSLETTER.test(host) ? await loadImage(tile.image, 220, 180) : null;
  if (img) return {
    shape: 'tall', rank: 5,
    draw: s => (
      <div style={at(s, { flexDirection: 'column', padding: 12, background: c.paper, boxShadow: c.shadow })}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} width={s.w - 24} height={s.h - 76} style={{ objectFit: 'cover' }} alt="" />
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', fontFamily: 'Caveat', fontSize: 28, color: '#4a423b' }}>{clip(tile.title || host, 20)} ↗</div>
      </div>
    ),
  };
  const bg = tintOf(c.t, tile, NEWSLETTER.test(host) ? 'lilac' : 'sky');
  return {
    shape: 'wide', rank: NEWSLETTER.test(host) ? 4 : 3,
    draw: s => (
      <div style={at(s, { alignItems: 'center', gap: 18, padding: '0 26px 0 22px', background: bg, boxShadow: c.shadow, borderRadius: '10px 30px 30px 10px' })}>
        <div style={{ width: 18, height: 18, borderRadius: 18, background: c.t.bg, boxShadow: `inset 0 1px 2px ${mix('#000000', bg, 0.3)}`, flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
          <div style={{ display: 'flex', fontFamily: c.head, fontWeight: c.headWeight, fontSize: title.length > 18 ? 25 : 30, lineHeight: 1.05, color: c.t.text }}>{title}</div>
          <div style={{ display: 'flex', fontFamily: 'Geist Mono', fontSize: 17, color: c.t.muted }}>{clip(host, 26)}</div>
        </div>
      </div>
    ),
  };
}

function indexCard(tile: Extract<Tile, { type: 'github' }>, c: Ctx): Obj {
  return {
    shape: 'square', rank: 3,
    draw: s => (
      <div style={at(s, { flexDirection: 'column', padding: '20px 22px', background: '#fffefb', boxShadow: c.shadow,
        backgroundImage: 'linear-gradient(#e7a3a3, #e7a3a3), repeating-linear-gradient(#fffefb 0px, #fffefb 33px, #dfe7f3 33px, #dfe7f3 34px)', backgroundSize: '100% 2px, 100% 100%', backgroundPosition: '0 56px, 0 22px', backgroundRepeat: 'no-repeat, repeat' })}>
        <div style={{ display: 'flex', fontFamily: 'Geist Mono', fontSize: 17, color: '#2d2723' }}>{clip(tile.repo, 22)}</div>
        <div style={{ display: 'flex', marginTop: 22, fontFamily: 'Caveat', fontSize: 27, lineHeight: '34px', color: '#4f5a7a' }}>{clip(tile.description || '', 52)}</div>
        {tile.stars !== undefined && <div style={{ display: 'flex', marginTop: 'auto', fontFamily: 'Geist Mono', fontSize: 16, color: '#8d8379', alignItems: 'center', gap: 6 }}><svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="#8d8379" /></svg>{Intl.NumberFormat('en', { notation: 'compact' }).format(tile.stars)}</div>}
      </div>
    ),
  };
}

function stickers(tiles: Extract<Tile, { type: 'social' }>[], c: Ctx): Obj {
  const list = tiles.slice(0, 4);
  const tints: Tint[] = ['lilac', 'peach', 'mint', 'sky'];
  const first = list[0];
  const handle = first.platform === 'email' ? first.handle : `@${first.handle.replace(/^@/, '')}`;
  return {
    shape: 'wide', rank: 2 + Math.min(list.length, 3) * 0.4,
    draw: s => (
      <div style={at(s, { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 })}>
        <div style={{ display: 'flex' }}>
          {list.map((t, i) => {
            const p = PLATFORMS[t.platform];
            return (
              <div key={t.id} style={{ display: 'flex', width: 70, height: 70, marginLeft: i ? -10 : 0, borderRadius: 70, border: `4px solid ${c.paper}`, background: c.t.tints[tints[i]], alignItems: 'center', justifyContent: 'center', boxShadow: c.shadow, transform: `rotate(${[-8, 6, -4, 9][i]}deg) translateY(${[0, -8, 4, -4][i]}px)` }}>
                {p.icon?.path ? <Glyph path={p.icon.path} size={28} color={c.ink} /> : <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, color: c.ink }}>{t.platform === 'email' ? '@' : 'in'}</div>}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', fontFamily: 'Caveat', fontSize: 30, color: c.t.muted }}>{clip(handle, 22)}</div>
      </div>
    ),
  };
}

async function objectsFor(tiles: Tile[], c: Ctx): Promise<Obj[]> {
  const socials = tiles.filter((t): t is Extract<Tile, { type: 'social' }> => t.type === 'social');
  const rest = tiles.filter(t => t.type !== 'social' && t.type !== 'heading').slice(0, 10);
  const made = await Promise.all(rest.map(t => {
    switch (t.type) {
      case 'image': return polaroid(t, c);
      case 'text': return note(t, c);
      case 'music': return vinyl(t, c);
      case 'video': return ticket(t, c);
      case 'link': return linkObj(t, c);
      case 'github': return indexCard(t, c);
      default: return null;
    }
  }));
  const objs = made.filter((o): o is Obj => !!o);
  if (socials.length) objs.push(stickers(socials, c));
  // The most characterful objects first, at most two of each shape so the desk stays varied.
  const out: Obj[] = [];
  const perShape: Record<Shape, number> = { tall: 0, square: 0, wide: 0 };
  for (const o of objs.map((o, i) => ({ o, i })).sort((a, b) => b.o.rank - a.o.rank || a.i - b.i).map(x => x.o)) {
    if (out.length === 4) break;
    if (perShape[o.shape] >= 2) continue;
    perShape[o.shape]++;
    out.push(o);
  }
  return out;
}

// Four cells on the right half of the card; each shape has a natural size and favourite cells.
type Cell = { x: number; y: number; w: number; h: number; r: number };
const CELLS: Cell[] = [
  { x: 630, y: 44, w: 290, h: 340, r: -3.5 },  // top left: the hero object
  { x: 948, y: 44, w: 216, h: 250, r: 4 },     // top right
  { x: 644, y: 404, w: 280, h: 190, r: 2.5 },  // bottom left
  { x: 944, y: 318, w: 224, h: 278, r: -2.5 }, // bottom right
];
const FIT: Record<Shape, { w: number; h: number; cells: number[] }> = {
  tall: { w: 262, h: 318, cells: [0, 3] },
  square: { w: 206, h: 206, cells: [1, 3, 2] },
  wide: { w: 272, h: 148, cells: [2, 1, 3] },
};

function place(objs: Obj[]): { o: Obj; s: Slot }[] {
  const used = new Set<number>();
  const out: { o: Obj; s: Slot }[] = [];
  for (const o of objs) {
    const f = FIT[o.shape];
    const i = f.cells.find(c => !used.has(c)) ?? CELLS.findIndex((_, c) => !used.has(c));
    if (i < 0) break;
    used.add(i);
    const cell = CELLS[i];
    const w = Math.min(f.w, cell.w), h = Math.min(f.h, cell.h);
    out.push({ o, s: { x: cell.x + (cell.w - w) / 2, y: cell.y + (cell.h - h) / 2, w, h, r: cell.r } });
  }
  return out;
}

export const cozy: OgStyle = async ({ page, theme: t, link }: OgInput) => {
  const pair = fontPair(page.theme.font);
  const c: Ctx = {
    t, paper: t.dark ? '#f4f1ec' : '#fffefb', ink: t.dark ? t.text : '#2d2723',
    shadow: t.dark ? '0 2px 4px rgba(0,0,0,.4), 0 22px 40px -14px rgba(0,0,0,.75)' : '0 1px 2px rgba(60,40,20,.08), 0 18px 34px -14px rgba(60,40,20,.32)',
    head: `"${pair.head.family}"`, headWeight: pair.head.weight, body: `"${pair.body.family}"`,
  };
  const [avatar, objs] = await Promise.all([loadImage(page.profile.avatar, 150, 150), objectsFor(page.tiles, c)]);
  const placed = place(objs);
  const { name, bio } = page.profile;
  const nameLen = [...name].length;
  const nameSize = (nameLen <= 12 ? 92 : nameLen <= 18 ? 76 : nameLen <= 28 ? 60 : 48) * (pair.head.family === 'Caveat' ? 1.2 : 1);
  const shortBio = bio ? clip(plain(bio), nameLen > 18 ? 110 : 140) : '';
  const glow = (tint: string, x: string, y: string, r: number) => `radial-gradient(circle at ${x} ${y}, ${tint} 0%, ${tint}00 ${r}%)`;

  const element = (
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: t.bg, fontFamily: c.body, color: t.text,
      backgroundImage: [glow(t.dark ? t.tints.lilac : t.tints.peach, '6%', '8%', 38), glow(t.tints.sky, '96%', '96%', 42), glow(t.tints.butter, '62%', '4%', 30)].join(', ') }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: 560, height: '100%', padding: '62px 0 54px 76px' }}>
        {avatar ? (
          <div style={{ display: 'flex', width: 154, padding: '10px 10px 12px', background: c.paper, boxShadow: c.shadow, transform: 'rotate(-4deg)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatar} width={134} height={134} style={{ objectFit: 'cover' }} alt="" />
          </div>
        ) : (
          <div style={{ display: 'flex', width: 132, height: 132, alignItems: 'center', justifyContent: 'center', borderRadius: 34, background: t.tints.peach, boxShadow: c.shadow, transform: 'rotate(-4deg)', fontFamily: c.head, fontWeight: c.headWeight, fontSize: pair.head.family === 'Caveat' ? 72 : 54, color: t.text }}>{initials(name)}</div>
        )}
        <div style={{ display: 'flex', marginTop: 40, fontFamily: c.head, fontWeight: c.headWeight, fontSize: nameSize, lineHeight: 1, letterSpacing: pair.head.family === 'Instrument Serif' ? -1 : -2, color: t.text }}>{clip(name, 48)}</div>
        {shortBio && <div style={{ display: 'flex', marginTop: 22, maxWidth: 470, fontSize: 27, lineHeight: 1.38, color: t.muted }}>{shortBio}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto', fontFamily: 'Caveat', fontSize: 34, color: t.text }}>
          <Flower size={26} color={t.accent} />
          {link}
        </div>
      </div>
      {placed.map(({ o, s }) => o.draw(s))}
      {!placed.length && (
        <div style={at({ x: 740, y: 150, w: 320, h: 320, r: 3 }, { flexDirection: 'column', justifyContent: 'space-between', padding: '40px 36px', background: t.tints.butter, boxShadow: c.shadow, fontFamily: 'Caveat', fontSize: 50, lineHeight: 1.05, color: t.text })}>
          <div style={{ position: 'absolute', top: -13, left: 114, width: 92, height: 26, background: mix(t.tints.sky, '#ffffff', 0.75), opacity: 0.85, transform: 'rotate(-3deg)' }} />
          <div style={{ display: 'flex' }}>{page.profile.location ? clip(page.profile.location, 40) : 'come say hi'}</div>
          <Flower size={44} color={t.accent} />
        </div>
      )}
      <div style={{ position: 'absolute', right: 34, bottom: 22, display: 'flex', alignItems: 'center', gap: 6, fontFamily: '"Instrument Serif"', fontStyle: 'italic', fontSize: 28, color: t.muted }}>posy</div>
    </div>
  );
  return { element, fonts: [pair.head, pair.body, HAND, MONO, MARK] };
};
