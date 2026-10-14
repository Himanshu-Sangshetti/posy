import { ImageResponse } from 'next/og';
import { readPage } from '@/lib/content';
import { THEMES } from '@/lib/themes';

export const dynamic = 'force-static';
const size = { width: 64, height: 64 };

// A route (not the icon.tsx convention) so the <link> can include the GitHub Pages base path.
export function GET() {
  const page = readPage();
  const t = THEMES[page.theme.preset];
  const letter = page.profile.name.trim()[0]?.toUpperCase() ?? 'P';
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.tints.peach, borderRadius: 20, fontSize: 36, fontWeight: 700, color: t.text }}>{letter}</div>,
    size,
  );
}
