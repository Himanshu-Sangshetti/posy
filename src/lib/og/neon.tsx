// "Neon" share image: a cyberpunk night. Glowing grid floor, a hexagon avatar, a glitching uppercase
// name (three offset layers), cut-corner panels with glowing edges. Mirrors the neon page style.
// Only CSS Satori can draw: gradients, text-shadow, box-shadow, opacity, and SVG for the cut corners.
import 'server-only';
import type { Theme } from '@/lib/themes';
import { fontPair, type FontSpec } from './fonts';
import { loadImage } from './images';
import type { OgInput, OgStyle } from './index';
import { Glyph, bitsFor, socialsOf, type Bit } from './shared';
import { alpha, clip, fitSize, initials, mix, plain, safe } from './util';

const GLOW: Record<string, string> = { peach: '#ff8a3d', butter: '#f4ff52', mint: '#3dffb5', sky: '#2be4ff', lilac: '#b26bff', rose: '#ff3ea5' };
const CYAN = '#2be4ff';
const MONO: FontSpec = { family: 'Geist Mono', weight: 400 };
const CHAKRA: FontSpec = { family: 'Chakra Petch', weight: 700 };
const CHAKRA_M: FontSpec = { family: 'Chakra Petch', weight: 500 };
const BODY: FontSpec = { family: 'Geist', weight: 400 };

/** Glow colour for a tile, as on the page: its chosen colour, or a cycle that starts at the accent. */
export function glowFor(accent: string, color: string | undefined, i: number) {
  if (color === 'accent' || color === 'surface') return accent;
  if (color && GLOW[color]) return GLOW[color];
  return [accent, CYAN, '#b26bff', '#3dffb5'][i % 4];
}

const cut = (w: number, h: number, c: number) => [[1.5, 1.5], [w - c, 1.5], [w - 1.5, c], [w - 1.5, h - 1.5], [c, h - 1.5], [1.5, h - c]].map(p => p.join(',')).join(' ');

function Panel({ b, color, w, h, t, i }: { b: Bit; color: string; w: number; h: number; t: Theme; i: number }) {
  const inner = { w: w - 4, h: h - 4 };
  return (
    <div style={{ display: 'flex', position: 'relative', width: w, height: h }}>
      <div style={{ position: 'absolute', left: -14, top: -14, right: -14, bottom: -14, display: 'flex', background: `radial-gradient(closest-side, ${alpha(color, 0.28)}, ${alpha(color, 0)})` }} />
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', left: 0, top: 0 }}>
        <polygon points={cut(w, h, 22)} fill={mix(t.surface, t.bg, 0.85)} stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
      <div style={{ position: 'absolute', left: 2, top: 2, width: inner.w, height: inner.h, display: 'flex', flexDirection: 'column', gap: 8, padding: '24px 16px 14px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', position: 'absolute', left: 16, top: 7, fontFamily: '"Geist Mono"', fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', color, textShadow: `0 0 8px ${color}` }}>{`// ${clip(b.kind, 14)}`}</div>
        {b.image ? (
          <div style={{ display: 'flex', position: 'relative', flex: 1, overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.image} width={inner.w - 32} height={inner.h - (b.title ? (b.sub ? 90 : 72) : 38)} style={{ objectFit: 'cover' }} alt="" />
            <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, display: 'flex', background: `linear-gradient(135deg, ${alpha(color, 0.38)}, ${alpha(i % 2 ? '#b26bff' : CYAN, 0.28)})` }} />
          </div>
        ) : b.text ? (
          <div style={{ display: 'flex', flex: 1, fontFamily: '"Chakra Petch"', fontWeight: 500, fontSize: b.text.length > 56 ? 19 : 23, lineHeight: 1.25, color: t.text, textShadow: `0 0 12px ${alpha(color, 0.5)}`, overflow: 'hidden' }}>{b.text}</div>
        ) : (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
            {b.icon ? <Glyph path={b.icon} size={44} color={color} /> : <div style={{ display: 'flex', fontFamily: '"Chakra Petch"', fontWeight: 700, fontSize: 44, color }}>//</div>}
          </div>
        )}
        {(b.title && !b.text) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', fontFamily: '"Chakra Petch"', fontWeight: 700, fontSize: 21, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden' }}>{clip(b.title, Math.floor((w - 40) / 12))}</div>
            {b.sub && <div style={{ display: 'flex', fontFamily: '"Geist Mono"', fontSize: 13, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden' }}>{clip(b.sub, Math.floor((w - 40) / 8))}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

const HEX = (s: number) => [[0.5, 0], [1, 0.25], [1, 0.75], [0.5, 1], [0, 0.75], [0, 0.25]].map(([x, y]) => `${x * s},${y * s}`).join(' ');

export const neon: OgStyle = async ({ page, theme: t, link }: OgInput) => {
  const pair = fontPair(page.theme.font);
  const { name, bio, location } = page.profile;
  const [avatar, bits] = await Promise.all([loadImage(page.profile.avatar, 170, 170), bitsFor(page, 4, 250, 190)]);
  const socials = socialsOf(page, 5);
  const shown = name.toUpperCase();
  const size = fitSize(shown, [86, 72, 60, 50, 42], 1000, 0.62);
  const shortBio = bio ? clip(safe(plain(bio)), 110) : '';
  const S = 148;
  // Two staggered columns of panels.
  const cols = bits.length <= 2
    ? [{ x: 740, y: 70, w: 380, h: 220 }, { x: 740, y: 330, w: 380, h: 220 }]
    : [{ x: 640, y: 56, w: 240, h: 250 }, { x: 904, y: 100, w: 230, h: 230 }, { x: 640, y: 338, w: 240, h: 220 }, { x: 904, y: 358, w: 230, h: 200 }];
  const line = alpha(t.accent, 0.22);
  const grid = `repeating-linear-gradient(0deg, ${line} 0px, ${line} 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 36px), repeating-linear-gradient(90deg, ${line} 0px, ${line} 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 56px)`;

  const element = (
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: t.bg, color: t.text, fontFamily: '"Geist"', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 330, width: 1200, height: 300, display: 'flex', backgroundImage: grid }} />
      <div style={{ position: 'absolute', left: 0, top: 300, width: 1200, height: 330, display: 'flex', backgroundImage: `linear-gradient(180deg, ${t.bg} 0%, ${alpha(t.bg, 0.55)} 45%, ${alpha(t.bg, 0)} 100%)` }} />
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1200, height: 630, display: 'flex',
        backgroundImage: `radial-gradient(60% 40% at 50% 108%, ${alpha(t.accent, 0.42)} 0%, ${alpha(t.accent, 0)} 100%), radial-gradient(45% 35% at 85% -6%, ${alpha(CYAN, 0.2)} 0%, ${alpha(CYAN, 0)} 100%), repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 3px, rgba(0,0,0,0.14) 3px, rgba(0,0,0,0.14) 4px)` }} />

      <div style={{ display: 'flex', flexDirection: 'column', position: 'absolute', left: 70, top: 52, width: bits.length ? 540 : 1000 }}>
        <div style={{ display: 'flex', position: 'relative', width: S + 24, height: S + 24 }}>
        <svg width={S + 24} height={S + 24} viewBox={`-12 -12 ${S + 24} ${S + 24}`}>
          <defs><clipPath id="hx"><polygon points={HEX(S)} /></clipPath></defs>
          <polygon points={HEX(S)} fill="none" stroke={alpha(t.accent, 0.18)} strokeWidth="18" strokeLinejoin="round" />
          <polygon points={HEX(S)} fill="none" stroke={alpha(t.accent, 0.35)} strokeWidth="10" strokeLinejoin="round" />
          {avatar
            ? <image href={avatar} x="0" y="0" width={S} height={S} preserveAspectRatio="xMidYMid slice" clipPath="url(#hx)" />
            : <polygon points={HEX(S)} fill={mix(t.accent, t.bg, 0.3)} />}
          <polygon points={HEX(S)} fill="none" stroke={t.accent} strokeWidth="3.5" strokeLinejoin="round" />
        </svg>
        {!avatar && <div style={{ position: 'absolute', left: 12, top: 12, width: S, height: S, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Chakra Petch"', fontWeight: 700, fontSize: 58, color: t.text, textShadow: `0 0 16px ${t.accent}` }}>{initials(name)}</div>}
        </div>
        <div style={{ display: 'flex', position: 'relative', marginTop: 22, maxWidth: bits.length ? 560 : 1000 }}>
          <div style={{ display: 'flex', position: 'absolute', left: -4, top: 0, width: bits.length ? 560 : 1000, fontFamily: '"Chakra Petch"', fontWeight: 700, fontSize: size, lineHeight: 1, letterSpacing: 2, color: CYAN, opacity: 0.85 }}>{clip(shown, 34)}</div>
          <div style={{ display: 'flex', position: 'absolute', left: 4, top: 1, width: bits.length ? 560 : 1000, fontFamily: '"Chakra Petch"', fontWeight: 700, fontSize: size, lineHeight: 1, letterSpacing: 2, color: t.accent, opacity: 0.85 }}>{clip(shown, 34)}</div>
          <div style={{ display: 'flex', position: 'relative', fontFamily: '"Chakra Petch"', fontWeight: 700, fontSize: size, lineHeight: 1, letterSpacing: 2, color: t.text, textShadow: `0 0 22px ${alpha(t.accent, 0.8)}, 0 0 3px ${t.text}` }}>{clip(shown, 34)}</div>
        </div>
        {location && <div style={{ display: 'flex', marginTop: 14, fontFamily: '"Geist Mono"', fontSize: 17, letterSpacing: 2.4, textTransform: 'uppercase', color: CYAN, textShadow: `0 0 10px ${alpha(CYAN, 0.7)}` }}>{`// ${clip(safe(location), 40)}`}</div>}
        {shortBio && <div style={{ display: 'flex', marginTop: 14, maxWidth: 520, fontSize: 24, lineHeight: 1.4, color: t.muted }}>{shortBio}</div>}
        {socials.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {socials.map((s, i) => {
              const c = [t.accent, CYAN, '#b26bff', '#3dffb5', t.accent][i];
              return (
                <div key={i} style={{ display: 'flex', width: 46, height: 46, alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${c}`, background: alpha(c, 0.1), boxShadow: `0 0 16px ${alpha(c, 0.45)}` }}>
                  {s.path ? <Glyph path={s.path} size={22} color={c} /> : <div style={{ display: 'flex', color: c, fontSize: 20 }}>@</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {cols.slice(0, Math.max(bits.length, 0)).map((s, i) => bits[i] && (
        <div key={i} style={{ display: 'flex', position: 'absolute', left: s.x, top: s.y }}>
          <Panel b={bits[i]} color={glowFor(t.accent, bits[i].tile.color, i)} w={s.w} h={s.h} t={t} i={i} />
        </div>
      ))}
      {!bits.length && (
        <div style={{ display: 'flex', position: 'absolute', left: 720, top: 150 }}>
          <Panel b={{ tile: { id: 'x', type: 'text', text: '' } as Bit['tile'], kind: 'status', title: '', sub: '', text: 'signal online. say hi.', image: null }} color={t.accent} w={400} h={250} t={t} i={0} />
        </div>
      )}
      <div style={{ display: 'flex', position: 'absolute', left: 70, bottom: 38, fontFamily: '"Geist Mono"', fontSize: 20, letterSpacing: 3, textTransform: 'uppercase', color: t.text, textShadow: `0 0 12px ${alpha(t.accent, 0.8)}` }}>{link}</div>
    </div>
  );
  return { element, fonts: [pair.head, CHAKRA, CHAKRA_M, BODY, MONO] };
};
