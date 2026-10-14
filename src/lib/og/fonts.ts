import 'server-only';

type Weight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
export type OgFont = { name: string; data: ArrayBuffer; weight: Weight; style: 'normal' | 'italic' };
export type FontSpec = { family: string; weight: Weight; italic?: boolean };

/** Google Fonts families behind each built-in font pair (heading + body). Edition pairs fall back to Geist. */
const PAIRS: Record<string, { head: FontSpec; body: FontSpec }> = {
  soft: { head: { family: 'Geist', weight: 600 }, body: { family: 'Geist', weight: 400 } },
  editorial: { head: { family: 'Instrument Serif', weight: 400 }, body: { family: 'Geist', weight: 400 } },
  classic: { head: { family: 'Fraunces', weight: 600 }, body: { family: 'Geist', weight: 400 } },
  elegant: { head: { family: 'DM Serif Display', weight: 400 }, body: { family: 'DM Sans', weight: 400 } },
  rounded: { head: { family: 'Nunito', weight: 800 }, body: { family: 'Nunito', weight: 400 } },
  playful: { head: { family: 'Bricolage Grotesque', weight: 700 }, body: { family: 'Geist', weight: 400 } },
  modern: { head: { family: 'Sora', weight: 600 }, body: { family: 'Sora', weight: 400 } },
  tech: { head: { family: 'Space Grotesk', weight: 600 }, body: { family: 'Space Grotesk', weight: 400 } },
  mono: { head: { family: 'Geist Mono', weight: 500 }, body: { family: 'Geist', weight: 400 } },
  hand: { head: { family: 'Caveat', weight: 700 }, body: { family: 'Geist', weight: 400 } },
};

export const fontPair = (font: string) => PAIRS[font] ?? PAIRS.soft;

// Fonts are fetched once per process and kept in memory (a few hundred KB each).
const cache = new Map<string, Promise<ArrayBuffer | null>>();

function fetchFont({ family, weight, italic }: FontSpec): Promise<ArrayBuffer | null> {
  const key = `${family}:${weight}:${italic ? 'i' : 'n'}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const p = (async () => {
    const q = `${family.replace(/ /g, '+')}:ital,wght@${italic ? 1 : 0},${weight}`;
    // No browser user agent: Google then serves plain TrueType, which Satori can read.
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${q}`, { signal: AbortSignal.timeout(4000) }).then(r => (r.ok ? r.text() : ''));
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!src) throw new Error(`no TTF for ${key}`);
    const res = await fetch(src, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`font ${res.status}`);
    return res.arrayBuffer();
  })().catch(() => {
    cache.delete(key); // try again on the next request
    return null;
  });
  cache.set(key, p);
  return p;
}

/**
 * Load fonts for an image. Anything that fails to download is skipped; if nothing loads,
 * returns undefined so next/og uses its bundled Geist.
 */
export async function loadFonts(specs: FontSpec[]): Promise<OgFont[] | undefined> {
  const uniq = [...new Map(specs.map(s => [`${s.family}:${s.weight}:${!!s.italic}`, s])).values()];
  const data = await Promise.all(uniq.map(fetchFont));
  const fonts = uniq.flatMap((s, i) => (data[i] ? [{ name: s.family, data: data[i]!, weight: s.weight, style: s.italic ? 'italic' as const : 'normal' as const }] : []));
  return fonts.length ? fonts : undefined;
}
