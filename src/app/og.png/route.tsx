import { ImageResponse } from 'next/og';
import { readPage } from '@/lib/content';
import { THEMES } from '@/lib/themes';

export const dynamic = 'force-static';
const size = { width: 1200, height: 630 };

// Share image for links on X, WhatsApp, iMessage… (a route so its URL can carry the base path).
export function GET() {
  const page = readPage();
  const t = THEMES[page.theme.preset];
  const tints = Object.values(t.tints);
  const initials = page.profile.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: t.bg, padding: 72, gap: 56, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 22 }}>
          <div style={{ width: 120, height: 120, borderRadius: 44, background: t.tints.peach, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, color: t.text }}>{initials}</div>
          <div style={{ fontSize: 76, fontWeight: 700, color: t.text, letterSpacing: -2, lineHeight: 1.05 }}>{page.profile.name}</div>
          {page.profile.bio && <div style={{ fontSize: 32, color: t.muted, lineHeight: 1.35, maxWidth: 620 }}>{page.profile.bio.slice(0, 140)}</div>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', width: 380, gap: 20 }}>
          {tints.slice(0, 6).map((c, i) => (
            <div key={i} style={{ width: i === 0 || i === 5 ? 380 : 180, height: 120, borderRadius: 36, background: c, border: `1px solid ${t.line}` }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
