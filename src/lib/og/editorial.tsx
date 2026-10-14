// "Editorial" share image: the page as a small magazine. A masthead with a serif display name and a
// round greyscale portrait, a double rule, then columns: an italic dek and the person's own tiles as
// numbered articles with kickers. Mirrors the editorial page style.
import 'server-only';
import { fontPair, type FontSpec } from './fonts';
import { loadImage } from './images';
import type { OgInput, OgStyle } from './index';
import { bitsFor, socialsOf, type Bit } from './shared';
import { alpha, clip, fitSize, initials, plain, safe } from './util';

const SANS: FontSpec = { family: 'Geist', weight: 500 };
const SANS_R: FontSpec = { family: 'Geist', weight: 400 };

export const editorial: OgStyle = async ({ page, theme: t, link }: OgInput) => {
  const pair = fontPair(page.theme.font);
  const serif = pair.head.family === 'Geist' ? { family: 'Instrument Serif', weight: 400 as const } : pair.head;
  const head = `"${serif.family}"`;
  const italic: FontSpec = { ...serif, italic: true };
  const { name, bio, location } = page.profile;
  const [avatar, bits] = await Promise.all([loadImage(page.profile.avatar, 120, 120, { gray: true }), bitsFor(page, 3, 227, 200)]);
  const socials = socialsOf(page, 4);
  const mastW = 930;
  const single = fitSize(name, [150, 128, 108, 92, 78, 66], mastW, 0.46);
  const twoLines = [...name].length * 66 * 0.46 > mastW;
  const size = twoLines ? 66 : single;
  const dek = bio ? clip(safe(plain(bio)), 130) : '';
  const rule = t.text;
  const kicker = (s: string, n: number) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontSize: 12, letterSpacing: 2.2, textTransform: 'uppercase', color: t.muted }}>
      <span style={{ display: 'flex', fontFamily: head, fontStyle: 'italic', fontSize: 18, letterSpacing: 0, color: t.accent === t.text ? t.muted : t.accent }}>{String(n).padStart(2, '0')}</span>
      {s}
    </div>
  );
  const article = (b: Bit, i: number) => (
    <div key={i} style={{ display: 'flex', flexDirection: 'column', width: 227, gap: 10, paddingTop: 12, borderTop: `1.5px solid ${rule}` }}>
      {kicker(clip(b.kind, 14), i + 1)}
      {b.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={b.image} width={227} height={200} style={{ objectFit: 'cover' }} alt="" />
      )}
      {b.text ? (
        <div style={{ display: 'flex', fontFamily: head, fontStyle: 'italic', fontSize: b.text.length > 60 ? 26 : 31, lineHeight: 1.1, color: t.text }}>{`“${b.text}”`}</div>
      ) : b.image && !b.title ? null : (
        <div style={{ display: 'flex', fontFamily: head, fontSize: b.image ? 27 : 34, lineHeight: 1.04, letterSpacing: -0.4, color: t.text }}>{clip(b.title || b.kind, b.image ? 34 : 44)}</div>
      )}
      {!b.image && !b.text && b.sub && <div style={{ display: 'flex', fontSize: 16, lineHeight: 1.4, color: t.muted }}>{clip(b.sub, 70)}</div>}
    </div>
  );

  const element = (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, color: t.text, fontFamily: '"Geist"', padding: '34px 64px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, letterSpacing: 2.6, textTransform: 'uppercase', color: t.muted }}>
        <span style={{ display: 'flex' }}>{location ? clip(safe(location), 48) : 'A small magazine of one'}</span>
        <span style={{ display: 'flex' }}>{link}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, height: 160 }}>
        <div style={{ display: 'flex', width: mastW, fontFamily: head, fontWeight: serif.weight, fontSize: size, lineHeight: 0.9, letterSpacing: -size * 0.03, color: t.text }}>{clip(name, 44)}</div>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} width={118} height={118} style={{ borderRadius: 118, objectFit: 'cover' }} alt="" />
        ) : (
          <div style={{ display: 'flex', width: 118, height: 118, borderRadius: 118, alignItems: 'center', justifyContent: 'center', background: t.text, color: t.bg, fontFamily: head, fontStyle: 'italic', fontSize: 56 }}>{initials(name)}</div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 12, gap: 3 }}>
        <div style={{ display: 'flex', height: 4, background: rule }} />
        <div style={{ display: 'flex', height: 1.5, background: rule }} />
      </div>
      <div style={{ display: 'flex', gap: 30, marginTop: 26 }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: 300, gap: 22 }}>
          {dek && <div style={{ display: 'flex', fontFamily: head, fontStyle: 'italic', fontSize: 29, lineHeight: 1.28, color: t.text }}>{dek}</div>}
          {socials.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 14, borderTop: `1px solid ${alpha(t.text, 0.5)}` }}>
              {socials.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, letterSpacing: 1.8, textTransform: 'uppercase', color: t.muted }}>
                  <span style={{ display: 'flex' }}>{s.platform}</span>
                  <span style={{ display: 'flex', color: t.text, letterSpacing: 0.4, textTransform: 'none', fontSize: 15 }}>{clip(s.label, 22)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {bits.length > 0 ? bits.map(article) : (
          <div style={{ display: 'flex', flexDirection: 'column', width: 740, gap: 10, paddingTop: 12, borderTop: `1.5px solid ${rule}` }}>
            {kicker('Letter from the editor', 1)}
            <div style={{ display: 'flex', fontFamily: head, fontStyle: 'italic', fontSize: 54, lineHeight: 1.08, color: t.text }}>{'“Nothing here yet. Come back soon.”'}</div>
          </div>
        )}
      </div>
    </div>
  );
  return { element, fonts: [serif, italic, SANS, SANS_R, pair.body] };
};
