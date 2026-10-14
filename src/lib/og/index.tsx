import 'server-only';
import { ImageResponse } from 'next/og';
import type { Page } from '@/lib/schema';
import { THEMES, type Theme } from '@/lib/themes';
import { cozy } from './cozy';
import { neon } from './neon';
import { soft } from './soft';
import { terminal } from './terminal';
import { fontPair, loadFonts } from './fonts';
import { loadRoundable } from './images';
import { isLight } from './util';

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
const STYLES: Record<string, OgStyle> = { cozy, soft, terminal, neon };

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

/** Favicon: the avatar cropped round, or the first initial on the page's accent colour. */
export async function faviconFor(page: Page | null): Promise<ImageResponse> {
  const size = 96;
  const t = page ? themeOf(page) : THEMES.cream;
  const avatar = page ? await loadRoundable(page.profile.avatar, size) : null;
  const head = fontPair(page?.theme.font ?? 'editorial').head;
  const letter = page ? [...page.profile.name.trim()][0]?.toUpperCase() ?? 'P' : 'P';
  const fonts = avatar ? undefined : await loadFonts([head]);
  return new ImageResponse(
    avatar
      // eslint-disable-next-line @next/next/no-img-element
      ? <div style={{ width: '100%', height: '100%', display: 'flex' }}><img src={avatar} width={size} height={size} style={{ borderRadius: size, objectFit: 'cover' }} alt="" /></div>
      : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: size, background: t.accent }}>
          <span style={{ fontFamily: `"${head.family}"`, fontWeight: head.weight, fontSize: head.family === 'Caveat' ? 74 : 58, lineHeight: 1, marginTop: head.family === 'Instrument Serif' || head.family === 'DM Serif Display' ? 4 : 0, color: isLight(t.accent) ? '#241f1b' : '#ffffff' }}>{letter}</span>
        </div>
      ),
    { width: size, height: size, fonts, headers: CACHE },
  );
}
