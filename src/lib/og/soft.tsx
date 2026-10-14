// "Soft" share image: the page as pastel cards. Rounded avatar and name on the left, a grid of the
// person's own tiles as big-radius tinted cards on the right. Mirrors the soft page style.
import 'server-only';
import type { Theme, Tint } from '@/lib/themes';
import { fontPair, type FontSpec } from './fonts';
import { loadImage } from './images';
import type { OgInput, OgStyle } from './index';
import { Glyph, bitsFor, socialsOf, type Bit } from './shared';
import { alpha, clip, fitSize, initials, mix, plain, safe } from './util';

const CYCLE: Tint[] = ['lilac', 'peach', 'mint', 'sky', 'rose', 'butter'];
const SEMI: FontSpec = { family: 'Geist', weight: 600 };
const REG: FontSpec = { family: 'Geist', weight: 400 };

const tintFor = (t: Theme, b: Bit, i: number) => {
  const c = b.tile.color;
  if (c && c !== 'auto' && c !== 'surface' && c !== 'accent') return t.tints[c];
  return t.tints[CYCLE[i % CYCLE.length]];
};

function Card({ b, i, w, h, t, head, headWeight }: { b: Bit; i: number; w: number; h: number; t: Theme; head: string; headWeight: number }) {
  const bg = tintFor(t, b, i);
  const shadow = `0 2px 3px ${alpha('#000000', t.dark ? 0.3 : 0.04)}, 0 22px 36px -18px ${alpha(mix(t.text, bg, 0.5), t.dark ? 0.6 : 0.28)}`;
  const base: React.CSSProperties = { display: 'flex', flexDirection: 'column', width: w, height: h, borderRadius: 38, background: bg, boxShadow: shadow, overflow: 'hidden' };
  if (b.text) {
    return (
      <div style={{ ...base, justifyContent: 'space-between', padding: '28px 28px 24px' }}>
        <div style={{ display: 'flex', fontFamily: head, fontWeight: headWeight, fontSize: b.text.length > 56 ? 27 : 33, lineHeight: 1.16, letterSpacing: -0.5, color: t.text }}>{b.text}</div>
        <div style={{ display: 'flex', width: 44, height: 12, borderRadius: 12, background: alpha(t.text, 0.14) }} />
      </div>
    );
  }
  if (b.image) {
    const footer = b.title || b.sub ? 78 : 0;
    return (
      <div style={{ ...base, padding: 10 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.image} width={w - 20} height={h - 20 - footer} style={{ objectFit: 'cover', borderRadius: 30 }} alt="" />
        {footer > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: footer, padding: '0 14px', gap: 3 }}>
            <div style={{ display: 'flex', fontFamily: head, fontWeight: headWeight, fontSize: 24, letterSpacing: -0.4, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden' }}>{clip(b.title || b.kind, 18)}</div>
            <div style={{ display: 'flex', fontSize: 17, color: t.muted }}>{clip(b.sub || b.kind, 26)}</div>
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={{ ...base, justifyContent: 'space-between', padding: 26 }}>
      <div style={{ display: 'flex', width: 62, height: 62, borderRadius: 62, background: t.surface, alignItems: 'center', justifyContent: 'center' }}>
        {b.icon ? <Glyph path={b.icon} size={28} color={t.text} /> : <svg width="26" height="26" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill={t.accent} /><circle cx="12" cy="12" r="10" fill="none" stroke={t.accent} strokeWidth="2" /></svg>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', fontFamily: head, fontWeight: headWeight, fontSize: 26, lineHeight: 1.08, letterSpacing: -0.5, color: t.text }}>{clip(b.title, 26)}</div>
        <div style={{ display: 'flex', fontSize: 17, color: t.muted }}>{clip(b.sub || b.kind, 28)}</div>
      </div>
    </div>
  );
}

export const soft: OgStyle = async ({ page, theme: t, link }: OgInput) => {
  const pair = fontPair(page.theme.font);
  const head = `"${pair.head.family}"`;
  const { name, bio } = page.profile;
  const [avatar, bits] = await Promise.all([loadImage(page.profile.avatar, 170, 170), bitsFor(page, 4, 250, 260)]);
  const socials = socialsOf(page, 5);
  const two = bits.length <= 2;
  // Two columns of cards; with few tiles they get taller and centre themselves.
  const colA = two ? [330] : [292, 218];
  const colB = two ? [330] : [206, 304];
  const sizeName = fitSize(name, [88, 74, 62, 52, 46], 880, 0.5);
  const shortBio = bio ? clip(safe(plain(bio)), 120) : '';
  const blob = (c: string, x: string, y: string, r: number) => `radial-gradient(circle at ${x} ${y}, ${alpha(c, 0.75)} 0%, ${alpha(c, 0)} ${r}%)`;

  const element = (
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: t.bg, color: t.text, fontFamily: '"Geist"',
      backgroundImage: [blob(t.tints.lilac, '4%', '0%', 42), blob(t.tints.sky, '100%', '100%', 46), blob(t.tints.rose, '56%', '-4%', 26)].join(', ') }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: 570, height: '100%', padding: '52px 0 46px 76px' }}>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} width={124} height={124} style={{ borderRadius: 44, objectFit: 'cover', border: `6px solid ${t.surface}`, boxShadow: `0 20px 34px -14px ${alpha(t.accent, 0.5)}` }} alt="" />
        ) : (
          <div style={{ display: 'flex', width: 124, height: 124, borderRadius: 44, alignItems: 'center', justifyContent: 'center', background: t.accent, fontFamily: head, fontWeight: pair.head.weight, fontSize: 52, color: '#ffffff', boxShadow: `0 20px 34px -14px ${alpha(t.accent, 0.5)}` }}>{initials(name)}</div>
        )}
        <div style={{ display: 'flex', marginTop: 26, fontFamily: head, fontWeight: pair.head.weight, fontSize: sizeName, lineHeight: 1.02, letterSpacing: -2.5, color: t.text, maxWidth: 490 }}>{clip(name, 40)}</div>
        {shortBio && <div style={{ display: 'flex', marginTop: 16, maxWidth: 440, fontSize: 25, lineHeight: 1.38, color: t.muted }}>{shortBio}</div>}
        {socials.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            {socials.map((s, i) => (
              <div key={i} style={{ display: 'flex', width: 52, height: 52, borderRadius: 52, background: t.surface, alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 16px -8px ${alpha(t.text, 0.25)}` }}>
                {s.path ? <Glyph path={s.path} size={24} color={t.text} /> : <div style={{ display: 'flex', fontSize: 22, fontWeight: 600, color: t.text }}>@</div>}
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto' }}>
          <div style={{ display: 'flex', padding: '8px 22px', borderRadius: 40, background: t.surface, fontSize: 25, fontWeight: 600, color: t.text, boxShadow: `0 8px 16px -8px ${alpha(t.text, 0.25)}` }}>{link}</div>
        </div>
      </div>
      {bits.length > 0 ? (
        <div style={{ display: 'flex', gap: 20, position: 'absolute', left: 630, top: 50 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center' }}>
            {colA.map((h, k) => bits[k * 2] && <Card key={k} b={bits[k * 2]} i={k * 2} w={252} h={h} t={t} head={head} headWeight={pair.head.weight} />)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center', marginTop: two ? 0 : 0 }}>
            {colB.map((h, k) => bits[k * 2 + 1] && <Card key={k} b={bits[k * 2 + 1]} i={k * 2 + 1} w={252} h={h} t={t} head={head} headWeight={pair.head.weight} />)}
          </div>
        </div>
      ) : (
        <div style={{ position: 'absolute', left: 700, top: 150, width: 380, height: 330, borderRadius: 52, background: t.tints.butter, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 40, boxShadow: `0 28px 44px -20px ${alpha(t.text, 0.3)}` }}>
          <div style={{ display: 'flex', width: 70, height: 70, borderRadius: 70, background: t.surface, alignItems: 'center', justifyContent: 'center', }}><svg width="34" height="34" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill={t.accent} /><circle cx="12" cy="12" r="10" fill="none" stroke={t.accent} strokeWidth="2" /></svg></div>
          <div style={{ display: 'flex', fontFamily: head, fontWeight: pair.head.weight, fontSize: 44, lineHeight: 1.08, letterSpacing: -1, color: t.text }}>{page.profile.location ? clip(safe(page.profile.location), 36) : 'come say hi'}</div>
        </div>
      )}
    </div>
  );
  return { element, fonts: [pair.head, pair.body, SEMI, REG] };
};
