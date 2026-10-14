import { ImageResponse } from 'next/og';
import { publicPage } from '@/lib/pages';
import { THEMES } from '@/lib/themes';
import { siteUrl } from '@/lib/site';

export const revalidate = 3600;

/** Share image for links on X, WhatsApp, iMessage… */
export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const r = await publicPage((await params).username);
  if (!r) return new Response('Not found', { status: 404 });
  const { page, row } = r;
  const t = THEMES[page.theme.preset];
  const avatar = page.profile.avatar ? new URL(page.profile.avatar, siteUrl()).toString() : null;
  const initials = page.profile.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const tints = Object.values(t.tints);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: t.bg, padding: 72, gap: 56, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 22 }}>
          {avatar
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={avatar} width={128} height={128} style={{ borderRadius: 46, objectFit: 'cover' }} alt="" />
            : <div style={{ width: 128, height: 128, borderRadius: 46, background: t.tints.peach, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, color: t.text }}>{initials}</div>}
          <div style={{ fontSize: 76, fontWeight: 700, color: t.text, letterSpacing: -2, lineHeight: 1.05 }}>{page.profile.name}</div>
          {page.profile.bio && <div style={{ fontSize: 32, color: t.muted, lineHeight: 1.35, maxWidth: 620 }}>{page.profile.bio.slice(0, 140)}</div>}
          <div style={{ fontSize: 26, color: t.muted, marginTop: 8 }}>{`${siteUrl().replace(/^https?:\/\//, '')}/${row.username}`}</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', width: 380, gap: 20 }}>
          {tints.slice(0, 6).map((c, i) => <div key={i} style={{ width: i === 0 || i === 5 ? 380 : 180, height: 118, borderRadius: 36, background: c, border: `1px solid ${t.line}` }} />)}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
