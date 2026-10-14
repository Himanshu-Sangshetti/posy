import { ImageResponse } from 'next/og';
import { publicPage } from '@/lib/pages';
import { THEMES } from '@/lib/themes';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const r = await publicPage((await params).username);
  const t = THEMES[r?.page.theme.preset ?? 'cream'];
  const letter = r?.page.profile.name.trim()[0]?.toUpperCase() ?? 'P';
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.tints.peach, borderRadius: 20, fontSize: 36, fontWeight: 700, color: t.text }}>{letter}</div>,
    { width: 64, height: 64, headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' } },
  );
}
