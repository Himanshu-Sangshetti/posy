// "Lofi" share image: a desktop left open. A menu bar, a window with the person in it, the name set wide,
// and a few app windows (Photos, Notes, Music…) with pinstriped title bars over the palette's wallpaper:
// lavender sky by day, the painted anime room at night. Mirrors the Lofi page style.
import 'server-only';
import type { Theme } from '@/lib/themes';
import type { FontSpec } from './fonts';
import { loadImage } from './images';
import type { OgInput, OgStyle } from './index';
import { Glyph, bitsFor, socialsOf, type Bit } from './shared';
import { alpha, clip, fitSize, initials, plain, safe } from './util';

const SANS: FontSpec = { family: 'Geist', weight: 400 };
const SANS_B: FontSpec = { family: 'Geist', weight: 600 };
const MONO: FontSpec = { family: 'Geist Mono', weight: 600 };
const ROOMS: Record<string, string> = { 'night-blue': '/looks/lofi/room-night.jpg', violet: '/looks/lofi/room-violet.jpg', sunset: '/looks/lofi/train-sunset.jpg' };
const APP: Record<string, string> = { photo: 'Photos', note: 'Notes', music: 'Music', video: 'Player', repo: 'Terminal', newsletter: 'Mail', shop: 'Shop', link: 'Browser' };

function Win({ t, title, w, h, children }: { t: Theme; title: string; w: number; h: number; children: React.ReactNode }) {
  const edge = t.dark ? alpha(t.text, 0.32) : t.text;
  const lines = (n: number) => (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 2, opacity: t.dark ? 0.5 : 0.9 }}>
      {Array.from({ length: n }, (_, i) => <div key={i} style={{ display: 'flex', height: 1, background: edge }} />)}
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: w, height: h, border: `2px solid ${edge}`, borderRadius: 7, background: t.dark ? alpha(t.surface, 0.94) : t.surface, boxShadow: t.dark ? '0 26px 50px -24px rgba(0,0,0,0.9)' : `5px 5px 0 ${t.text}`, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', height: 30, padding: '0 9px', gap: 8, borderBottom: `2px solid ${edge}` }}>
        <div style={{ display: 'flex', width: 13, height: 13, border: `2px solid ${edge}` }} />
        {lines(5)}
        {title && <div style={{ display: 'flex', fontFamily: '"Geist Mono"', fontWeight: 600, fontSize: 14, color: t.text }}>{title}</div>}
        {lines(5)}
        <div style={{ display: 'flex', width: 13, height: 13, border: `2px solid ${edge}` }} />
      </div>
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', padding: 12, overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

function body(b: Bit, t: Theme, w: number, h: number) {
  if (b.image) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={b.image} width={w - 28} height={h - 58} style={{ objectFit: 'cover', borderRadius: 3 }} alt="" />
  );
  if (b.text) return <div style={{ display: 'flex', fontSize: b.text.length > 50 ? 21 : 25, lineHeight: 1.35, color: t.text }}>{b.text}</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 12, border: `2px solid ${t.dark ? alpha(t.text, 0.3) : t.text}`, background: alpha(t.accent, 0.2) }}>
        {b.icon ? <Glyph path={b.icon} size={24} color={t.text} /> : <div style={{ display: 'flex', fontSize: 24, color: t.text }}>↗</div>}
      </div>
      <div style={{ display: 'flex', fontWeight: 600, fontSize: 22, color: t.text }}>{clip(b.title, 26)}</div>
      {b.sub && <div style={{ display: 'flex', fontSize: 15, color: t.muted }}>{clip(b.sub, 34)}</div>}
    </div>
  );
}

export const lofi: OgStyle = async ({ page, theme: t, link }: OgInput) => {
  const { name, bio } = page.profile;
  const room = t.dark ? ROOMS[page.theme.preset] : undefined;
  const [avatar, bits, wall] = await Promise.all([loadImage(page.profile.avatar, 200, 200), bitsFor(page, 3, 300, 190), room ? loadImage(room, 1200, 630) : Promise.resolve(null)]);
  const socials = socialsOf(page, 6);
  const shown = name.toUpperCase();
  const size = fitSize(shown, [64, 54, 46, 40, 34], 640, 0.98);
  const dek = bio ? clip(safe(plain(bio)), 96) : '';
  const slots = [{ x: 70, y: 352, w: 330, h: 236 }, { x: 430, y: 380, w: 330, h: 212 }, { x: 790, y: 340, w: 340, h: 250 }];
  const element = (
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: t.bg, color: t.text, fontFamily: '"Geist"', overflow: 'hidden' }}>
      {wall ? <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={wall} width={1200} height={630} style={{ position: 'absolute', left: 0, top: 0, objectFit: 'cover' }} alt="" />
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1200, height: 630, display: 'flex', backgroundImage: `linear-gradient(180deg, ${alpha(t.bg, 0.55)}, ${alpha(t.bg, 0.25)} 45%, ${alpha(t.bg, 0.7)})` }} />
      </> : (
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1200, height: 630, display: 'flex', backgroundImage: `radial-gradient(45% 55% at 85% 10%, ${alpha(t.accent, 0.16)}, ${alpha(t.accent, 0)}), radial-gradient(40% 50% at 8% 90%, ${alpha('#4d7cff', 0.12)}, ${alpha('#4d7cff', 0)})` }} />
      )}
      {/* menu bar */}
      <div style={{ display: 'flex', position: 'absolute', left: 0, top: 0, width: 1200, height: 38, alignItems: 'center', padding: '0 22px', gap: 12, background: alpha(t.surface, 0.92), borderBottom: `2px solid ${t.dark ? alpha(t.text, 0.25) : t.text}`, fontSize: 17 }}>
        <div style={{ display: 'flex', width: 14, height: 14, borderRadius: 14, background: t.accent }} />
        <div style={{ display: 'flex', fontWeight: 600 }}>{clip(name, 30)}</div>
        <div style={{ display: 'flex', flex: 1 }} />
        <div style={{ display: 'flex', fontFamily: '"Geist Mono"', fontSize: 15, color: t.muted }}>{link}</div>
      </div>
      {/* you */}
      <div style={{ display: 'flex', position: 'absolute', left: 70, top: 74 }}>
        <Win t={t} title="me" w={226} h={252}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} width={198} height={198} style={{ objectFit: 'cover', borderRadius: 3 }} alt="" />
          ) : <div style={{ display: 'flex', width: 198, height: 198, alignItems: 'center', justifyContent: 'center', background: alpha(t.accent, 0.2), fontSize: 64, fontWeight: 600 }}>{initials(name)}</div>}
        </Win>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', position: 'absolute', left: 340, top: 92, width: 800 }}>
        <div style={{ display: 'flex', fontWeight: 600, fontSize: size, letterSpacing: size * 0.36, lineHeight: 1, color: t.text, textShadow: t.dark ? '0 2px 18px rgba(0,0,0,0.6)' : 'none' }}>{clip(shown, 22)}</div>
        {dek && <div style={{ display: 'flex', marginTop: 20, maxWidth: 640, fontSize: 23, lineHeight: 1.45, color: t.dark ? alpha(t.text, 0.85) : t.muted }}>{dek}</div>}
        {socials.length > 0 && (
          <div style={{ display: 'flex', gap: 14, marginTop: 22 }}>
            {socials.map((s, i) => (
              <div key={i} style={{ display: 'flex', width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: t.surface, border: `2px solid ${t.dark ? alpha(t.text, 0.3) : t.text}`, boxShadow: t.dark ? 'none' : `3px 3px 0 ${t.text}` }}>
                {s.path ? <Glyph path={s.path} size={22} color={t.text} /> : <div style={{ display: 'flex', fontSize: 20, color: t.text }}>@</div>}
              </div>
            ))}
          </div>
        )}
      </div>
      {bits.slice(0, 3).map((b, i) => (
        <div key={i} style={{ display: 'flex', position: 'absolute', left: slots[i].x, top: slots[i].y }}>
          <Win t={t} title={APP[b.kind] ?? (b.tile.type === 'social' ? b.kind : 'Browser')} w={slots[i].w} h={slots[i].h}>{body(b, t, slots[i].w, slots[i].h)}</Win>
        </div>
      ))}
    </div>
  );
  return { element, fonts: [SANS, SANS_B, MONO] };
};
