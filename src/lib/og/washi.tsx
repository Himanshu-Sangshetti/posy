// "Washi" share image: the page's woodblock print, mounted, with the name on its title slip, and beside it
// the person's small print with their red seal, a few lines and the address. Mirrors the Washi page style.
import 'server-only';
import { WASHI_PRINTS } from '@/components/page/styles/washi';
import type { FontSpec } from './fonts';
import { loadImage, loadRoundable } from './images';
import type { OgInput, OgStyle } from './index';
import { alpha, clip, initials, plain, safe } from './util';

const SERIF: FontSpec = { family: 'Cormorant Garamond', weight: 600 };
const SERIF_R: FontSpec = { family: 'Cormorant Garamond', weight: 500 };
const SANS: FontSpec = { family: 'Geist', weight: 400 };

export const washi: OgStyle = async ({ page, theme: t, link }: OgInput) => {
  const art = WASHI_PRINTS[page.theme.preset] ?? WASHI_PRINTS.kinari;
  const { name, bio } = page.profile;
  const PW = 640, PH = Math.round(PW * 0.64);
  const [print, paper, avatar, seal] = await Promise.all([
    loadImage(art.src, PW, PH), loadImage('/looks/washi/paper.jpg', 600, 315), loadImage(page.profile.avatar, 150, 188), loadRoundable('/looks/washi/seal.png', 96),
  ]);
  const shown = clip(name, 22);
  const slipFont = shown.length > 14 ? 30 : shown.length > 9 ? 36 : 42;
  const slipLen = Math.min(PH - 40, Math.round(shown.length * slipFont * 0.62 + 60));
  const dek = bio ? clip(safe(plain(bio)), 120) : '';
  const ink = '#1d1a16';
  const element = (
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: t.bg, color: t.text, fontFamily: '"Geist"' }}>
      {paper && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={paper} width={1200} height={630} style={{ position: 'absolute', left: 0, top: 0, opacity: t.dark ? 0.08 : 0.35, objectFit: 'cover' }} alt="" />
      )}
      {/* the mounted print */}
      <div style={{ display: 'flex', flexDirection: 'column', position: 'absolute', left: 64, top: 62, padding: '18px 18px 12px', background: t.dark ? '#26231f' : '#efe9dc', boxShadow: `0 0 0 1px ${alpha(t.text, 0.18)}, 0 30px 50px -30px rgba(0,0,0,0.55)` }}>
        <div style={{ display: 'flex', position: 'relative', width: PW, height: PH, background: alpha(t.text, 0.08) }}>
          {print && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={print} width={PW} height={PH} style={{ objectFit: 'cover' }} alt="" />
          )}
          <div style={{ display: 'flex', position: 'absolute', right: 30, top: 28, width: slipFont + 34, height: slipLen, background: '#f3ecdd', border: `1.5px solid ${ink}`, alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px -12px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', position: 'absolute', left: 3, top: 3, right: 3, bottom: 3, border: `1px solid ${alpha(ink, 0.5)}` }} />
            <div style={{ display: 'flex', width: slipLen - 30, justifyContent: 'center', transform: 'rotate(90deg)', fontFamily: '"Cormorant Garamond"', fontWeight: 600, fontSize: slipFont, letterSpacing: slipFont * 0.12, color: ink, whiteSpace: 'nowrap' }}>{shown}</div>
          </div>
        </div>
        <div style={{ display: 'flex', marginTop: 10, fontSize: 14, color: t.muted }}>
          <span style={{ display: 'flex', color: t.text, marginRight: 6 }}>{art.artist}</span>{`· ${art.title}`}
        </div>
      </div>
      {/* you, your seal, your words */}
      <div style={{ display: 'flex', flexDirection: 'column', position: 'absolute', left: 790, top: 70, width: 350 }}>
        <div style={{ display: 'flex', position: 'relative', width: 150, height: 214, padding: '8px 8px 26px', background: t.dark ? '#2b2824' : '#f6f1e6', boxShadow: `0 0 0 1px ${alpha(t.text, 0.16)}, 0 18px 30px -20px rgba(0,0,0,0.5)`, transform: 'rotate(-2deg)' }}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} width={134} height={180} style={{ objectFit: 'cover' }} alt="" />
          ) : <div style={{ display: 'flex', width: 134, height: 180, alignItems: 'center', justifyContent: 'center', background: alpha(t.text, 0.08), fontFamily: '"Cormorant Garamond"', fontSize: 52, color: t.muted }}>{initials(name)}</div>}
          <div style={{ display: 'flex', position: 'absolute', right: -38, bottom: -18, width: 84, height: 84, alignItems: 'center', justifyContent: 'center', transform: 'rotate(-6deg)' }}>
            {seal && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={seal} width={84} height={84} style={{ position: 'absolute', left: 0, top: 0 }} alt="" />
            )}
            <div style={{ display: 'flex', fontFamily: '"Cormorant Garamond"', fontWeight: 600, fontSize: 24, color: '#c43c28' }}>{initials(name)}</div>
          </div>
        </div>
        {dek && <div style={{ display: 'flex', marginTop: 40, fontFamily: '"Cormorant Garamond"', fontWeight: 500, fontSize: 28, lineHeight: 1.35, color: t.text }}>{dek}</div>}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 26, fontSize: 17, letterSpacing: 2, textTransform: 'uppercase', color: t.muted }}>
          <div style={{ display: 'flex', width: 10, height: 10, borderRadius: 10, background: t.accent, marginRight: 12 }} />{link}
        </div>
      </div>
    </div>
  );
  return { element, fonts: [SERIF, SERIF_R, SANS] };
};
