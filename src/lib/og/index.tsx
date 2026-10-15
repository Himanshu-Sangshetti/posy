import 'server-only';
import { ImageResponse } from 'next/og';
import type { Page } from '@/lib/schema';
import { THEMES, type Theme } from '@/lib/themes';
import { cozy } from './cozy';
import { soft } from './soft';
import { washi } from './washi';
import { lofi } from './lofi';
import { fontPair, loadFonts } from './fonts';
import { loadImage, loadRoundable } from './images';
import { faviconKind, isLight } from './util';

export { initials, isLight } from './util';

export const OG_SIZE = { width: 1200, height: 630 };
const CACHE = { 'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' };

/** Everything a share-image style needs to draw one page. */
export type OgInput = {
  page: Page;
  theme: Theme;      // the page's theme with its accent override applied
  link: string;      // what to print as the address, e.g. "posy.me/mira"
};
/** A style draws the card and lists the fonts it uses (fetched and cached by ogFor). */
export type OgStyle = (input: OgInput) => Promise<{ element: React.ReactElement; fonts: Parameters<typeof loadFonts>[0] }>;

/**
 * Share-image styles, keyed by `page.theme.style`. Add a style by writing an OgStyle and listing it here;
 * unknown or missing styles use "cozy".
 */
const STYLES: Record<string, OgStyle> = { cozy, minimal: soft, washi, lofi };

export function themeOf(page: Page): Theme {
  const t = THEMES[page.theme.preset] ?? THEMES.cream;
  return page.theme.accent ? { ...t, accent: page.theme.accent } : t;
}

/** The 1200×630 share image (Open Graph / X card) for a page. */
export async function ogFor(page: Page, opts: { link: string }): Promise<ImageResponse> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const style = String((page.theme as any).style ?? 'cozy');
  const draw = STYLES[style] ?? STYLES.cozy;
  const { element, fonts } = await draw({ page, theme: themeOf(page), link: opts.link });
  return new ImageResponse(element, { ...OG_SIZE, fonts: await loadFonts(fonts), headers: CACHE });
}

/**
 * Favicon, in the page style's character. Cozy: the avatar cropped round, or the initial on the accent.
 * Minimal: a rounded square. Washi: a serif initial in ink (greyscale portrait). Lofi: a glowing ring.
 */
export async function faviconFor(page: Page | null): Promise<ImageResponse> {
  const size = 96;
  const kind = faviconKind(page?.theme.style);
  const t = page ? themeOf(page) : THEMES.cream;
  const src = page?.profile.avatar;
  const letter = page ? [...page.profile.name.trim()][0]?.toUpperCase() ?? 'P' : 'P';
  const ink = isLight(t.accent) ? '#241f1b' : '#ffffff';
  const wrap = (child: React.ReactNode, style: React.CSSProperties = {}) => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', ...style }}>{child}</div>
  );
  const glyph = (family: string, weight: number, fontSize: number, color: string, extra: React.CSSProperties = {}) => (
    <span style={{ display: 'flex', fontFamily: `"${family}"`, fontWeight: weight, fontSize, lineHeight: 1, color, ...extra }}>{letter}</span>
  );
  // eslint-disable-next-line @next/next/no-img-element
  const photo = (url: string, style: React.CSSProperties) => <img src={url} width={size} height={size} style={{ objectFit: 'cover', ...style }} alt="" />;
  let el: React.ReactElement;
  let fonts: Parameters<typeof loadFonts>[0] = [];

  if (kind === 'soft') {
    const avatar = await loadRoundable(src, size);
    fonts = avatar ? [] : [{ family: 'Nunito', weight: 800 }];
    el = avatar ? wrap(photo(avatar, { borderRadius: 28 })) : wrap(glyph('Nunito', 800, 60, ink), { borderRadius: 28, background: t.accent });
  } else if (kind === 'editorial') {
    const avatar = await loadImage(src, size, size, { gray: true });
    const head = fontPair(page?.theme.font ?? 'editorial').head;
    const serif = head.family === 'Geist' ? { family: 'Instrument Serif', weight: 400 as const } : head;
    fonts = avatar ? [] : [{ ...serif, italic: true }];
    el = avatar ? wrap(photo(avatar, { borderRadius: size }))
      : wrap(glyph(serif.family, serif.weight, 70, t.bg, { fontStyle: 'italic', marginTop: serif.family === 'Instrument Serif' ? 6 : 0 }), { borderRadius: size, background: t.text });
  } else if (kind === 'neon') {
    const avatar = await loadRoundable(src, 64);
    fonts = [{ family: 'Chakra Petch', weight: 700 }];
    el = wrap(
      <div style={{ display: 'flex', width: 80, height: 80, borderRadius: 80, alignItems: 'center', justifyContent: 'center', border: `5px solid ${t.accent}`, boxShadow: `0 0 12px 3px ${t.accent}, inset 0 0 12px 1px ${t.accent}`, overflow: 'hidden', background: '#00000000' }}>
        {avatar ? photo(avatar, { width: 66, height: 66, borderRadius: 66 }) : glyph('Chakra Petch', 700, 46, t.text, { textShadow: `0 0 10px ${t.accent}` })}
      </div>,
      { background: t.bg, borderRadius: 22 },
    );
  } else {
    const avatar = await loadRoundable(src, size);
    const head = fontPair(page?.theme.font ?? 'editorial').head;
    fonts = avatar ? [] : [head];
    el = avatar ? wrap(photo(avatar, { borderRadius: size }))
      : wrap(glyph(head.family, head.weight, head.family === 'Caveat' ? 74 : 58, ink, { marginTop: head.family === 'Instrument Serif' || head.family === 'DM Serif Display' ? 4 : 0 }), { borderRadius: size, background: t.accent });
  }
  return new ImageResponse(el, { width: size, height: size, fonts: fonts.length ? await loadFonts(fonts) : undefined, headers: CACHE });
}
