// "Terminal" share image: the page as a shell session. Prompt lines with `$ whoami`, a big
// monospace name with a block cursor, boxed tiles with [ labels ], and `ls -l` rows. Mirrors the terminal page style.
import 'server-only';
import type { Theme } from '@/lib/themes';
import type { FontSpec } from './fonts';
import { loadImage } from './images';
import type { OgInput, OgStyle } from './index';
import { Glyph, bitsFor, socialsOf, type Bit } from './shared';
import { alpha, clip, fitSize, plain, safe, slug } from './util';

const MONO: FontSpec = { family: 'IBM Plex Mono', weight: 400 };
const MONO_B: FontSpec = { family: 'IBM Plex Mono', weight: 600 };
const PIXEL: FontSpec = { family: 'VT323', weight: 400 };
const F = '"IBM Plex Mono"';

/** A tiny deterministic pattern from a string, so each person gets their own block of "ASCII". */
export function blockPattern(seed: string, cols: number, rows: number): number[][] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619) >>> 0;
  const next = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296);
  const half = Math.ceil(cols / 2);
  return Array.from({ length: rows }, () => {
    const left = Array.from({ length: half }, () => { const v = next(); return v < 0.34 ? 0 : v < 0.55 ? 1 : v < 0.8 ? 2 : 3; });
    return [...left, ...[...left].reverse().slice(cols % 2)]; // mirrored: reads as a little glyph
  });
}

function Box({ b, w, h, t }: { b: Bit; w: number; h: number; t: Theme }) {
  const line = alpha(t.text, 0.3);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', width: w, height: h, padding: '20px 14px 12px', border: `1px solid ${line}`, background: alpha(t.surface, 0.7), gap: 8 }}>
      <div style={{ position: 'absolute', top: -11, left: 12, display: 'flex', padding: '0 6px', background: t.bg, fontSize: 16, color: t.accent }}>
        <span style={{ color: t.muted }}>[ </span>{clip(b.kind, 12)}<span style={{ color: t.muted }}> ]</span>
      </div>
      {b.image ? (
        <div style={{ display: 'flex', position: 'relative', flex: 1, border: `1px solid ${line}`, overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.image} width={w - 30} height={h - 70} style={{ objectFit: 'cover' }} alt="" />
          <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, background: t.accent, opacity: 0.22 }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, fontSize: b.text && b.text.length > 50 ? 17 : 19, lineHeight: 1.45, color: t.text, overflow: 'hidden' }}>
          {b.text ? `/* ${clip(b.text, 80)} */` : clip(b.sub || b.title, 70)}
        </div>
      )}
      <div style={{ display: 'flex', fontSize: 16, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden' }}>
        <span style={{ color: t.accent }}>{'> '}</span>{clip(b.title || b.kind, Math.floor((w - 50) / 10))}
      </div>
    </div>
  );
}

export const terminal: OgStyle = async ({ page, theme: t, link }: OgInput) => {
  const { name, bio } = page.profile;
  const [avatar, bits] = await Promise.all([loadImage(page.profile.avatar, 150, 150, { gray: true }), bitsFor(page, 5, 220, 130, { gray: true })]);
  const socials = socialsOf(page, 4);
  const boxes = bits.filter(b => b.image || b.text).slice(0, 2);
  const rest = bits.filter(b => !boxes.includes(b)).slice(0, 3);
  const nameSize = fitSize(name, [112, 96, 80, 66, 56], 570, 0.42);
  const shortBio = bio ? clip(safe(plain(bio)), 104) : '';
  const grid = blockPattern(name, 9, 5);
  const shade = [0, 0.25, 0.55, 1];
  const line = alpha(t.text, 0.3);
  const prompt = (cmd: string, first = false) => (
    <div style={{ display: 'flex', flexShrink: 0, marginTop: first ? 0 : 16, fontSize: 21, color: t.muted }}>
      <span style={{ color: t.accent }}>{first ? `~/${slug(name).slice(0, 18)}` : '~'}</span>
      <span>{`\u00a0$\u00a0${cmd}`}</span>
    </div>
  );

  const element = (
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: t.bg, color: t.text, fontFamily: F,
      backgroundImage: `radial-gradient(60% 55% at 12% 100%, ${alpha(t.accent, 0.14)} 0%, ${alpha(t.accent, 0)} 100%), repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 3px, rgba(0,0,0,0.22) 3px, rgba(0,0,0,0.22) 4px)` }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: 660, height: '100%', padding: '50px 0 44px 64px' }}>
        {prompt('whoami', true)}
        <div style={{ display: 'flex', alignItems: 'flex-end', flexShrink: 0, marginTop: 4, fontFamily: '"VT323"', fontSize: nameSize, lineHeight: 0.92, color: t.text, textShadow: `0 0 18px ${alpha(t.accent, 0.35)}`, maxWidth: 600, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex' }}>{clip(name, 30)}</span>
          <div style={{ display: 'flex', width: nameSize * 0.42, height: nameSize * 0.7, marginLeft: nameSize * 0.12, marginBottom: nameSize * 0.06, background: t.accent }} />
        </div>
        {shortBio && <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>{prompt('cat about.txt')}<div style={{ display: 'flex', flexShrink: 0, marginTop: 6, maxWidth: 560, fontSize: 22, lineHeight: 1.45, color: t.text }}>{shortBio}</div></div>}
        {socials.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          {prompt('ls ./elsewhere')}
          <div style={{ display: 'flex', flexShrink: 0, flexWrap: 'wrap', gap: 10, marginTop: 10, maxWidth: 580 }}>
            {socials.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 11px', border: `1px solid ${line}`, fontSize: 18, color: t.text }}>
                {s.path && <Glyph path={s.path} size={17} color={t.accent} />}{clip(s.label, 18)}
              </div>
            ))}
          </div>
        </div>}
        <div style={{ display: 'flex', flexShrink: 0, marginTop: 'auto', fontSize: 23, color: t.muted }}>
          <span style={{ color: t.accent }}>$</span>
          <span>{'\u00a0open\u00a0'}</span><span style={{ color: t.text, fontWeight: 600 }}>{link}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', position: 'absolute', left: 724, top: 44, width: 424, gap: 26 }}>
        <div style={{ display: 'flex', gap: 22, alignItems: 'stretch' }}>
          <div style={{ display: 'flex', position: 'relative', width: 150, height: 150, padding: 9, border: `1px solid ${line}` }}>
            <div style={{ position: 'absolute', top: -11, left: 10, display: 'flex', padding: '0 6px', background: t.bg, fontSize: 16, color: t.muted }}>avatar.txt</div>
            {avatar ? (
              <div style={{ display: 'flex', position: 'relative', width: 130, height: 130 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatar} width={130} height={130} style={{ objectFit: 'cover' }} alt="" />
                <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, background: t.accent, opacity: 0.3 }} />
              </div>
            ) : (
              <div style={{ display: 'flex', width: 130, height: 130, alignItems: 'center', justifyContent: 'center', background: alpha(t.accent, 0.14), fontFamily: '"VT323"', fontSize: 96, color: t.accent }}>{[...name.trim()][0]?.toUpperCase() ?? '_'}</div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
            {grid.map((row, y) => (
              <div key={y} style={{ display: 'flex', gap: 4 }}>
                {row.map((v, x) => <div key={x} style={{ display: 'flex', width: 21, height: 21, background: v ? alpha(t.accent, shade[v]) : alpha(t.text, 0.07) }} />)}
              </div>
            ))}
          </div>
        </div>
        {boxes.length > 0 ? (
          <div style={{ display: 'flex', gap: 22 }}>
            {boxes.map((b, i) => <Box key={i} b={b} w={boxes.length === 1 ? 424 : 201} h={boxes.length === 1 ? 200 : 214} t={t} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', position: 'relative', width: 424, height: 150, padding: '22px 16px', border: `1px solid ${line}`, fontSize: 21, lineHeight: 1.5, color: t.text }}>
            <div style={{ position: 'absolute', top: -11, left: 12, display: 'flex', padding: '0 6px', background: t.bg, fontSize: 16, color: t.accent }}>[ status ]</div>
            {`/* ${page.profile.location ? clip(safe(page.profile.location), 60) : 'no tiles yet. say hi.'} */`}
          </div>
        )}
        {rest.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', borderTop: `1px dashed ${line}` }}>
            {rest.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 14, padding: '10px 4px', borderBottom: `1px dashed ${line}`, fontSize: 17 }}>
                <span style={{ display: 'flex', color: t.muted }}>-rw-r--r--</span>
                <span style={{ display: 'flex', flex: 1, fontWeight: 600, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden' }}>{clip(b.title || 'untitled', 18)}</span>
                <span style={{ display: 'flex', color: t.muted }}>{clip(b.kind, 9)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  return { element, fonts: [MONO, MONO_B, PIXEL] };
};
