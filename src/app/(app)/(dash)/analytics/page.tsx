import type { Metadata } from 'next';
import { requireUser } from '@/lib/session';
import { pageForUser } from '@/lib/pages';
import { pageStats } from '@/lib/analytics';
import { parsePage, type Tile } from '@/lib/schema';
import { PLATFORMS } from '@/lib/platforms';
import { AreaChart } from '@/components/dash/charts';

export const metadata: Metadata = { title: 'Analytics · Posy' };
export const dynamic = 'force-dynamic';

const card = 'rounded-[24px] border border-[color-mix(in_oklab,#fff_55%,transparent)] bg-[color-mix(in_oklab,var(--surface)_78%,transparent)] p-5 shadow-[0_20px_50px_-34px_rgb(0_0_0/.35)] backdrop-blur-xl sm:p-6';

function tileName(t?: Tile, fallback?: string | null) {
  if (!t) return fallback?.includes(':') ? fallback : 'Removed tile';
  switch (t.type) {
    case 'social': return `${PLATFORMS[t.platform].label} · ${t.handle}`;
    case 'link': return t.title || t.url;
    case 'github': return t.repo;
    case 'image': return t.caption || 'Image';
    case 'video': return t.title || 'Video';
    case 'music': return 'Spotify';
    default: return t.type;
  }
}

function BarList({ rows, empty }: { rows: { label: string; n: number }[]; empty: string }) {
  if (!rows.length) return <p className="py-6 text-[14px] text-[var(--muted)]">{empty}</p>;
  const max = Math.max(...rows.map(r => r.n));
  return (
    <ul className="grid gap-1.5">
      {rows.map(r => (
        <li key={r.label} className="relative flex h-9 items-center justify-between overflow-hidden rounded-[10px] px-3 text-[14px]" title={`${r.label}: ${r.n}`}>
          <span aria-hidden className="absolute inset-y-0 left-0 rounded-[10px] bg-[color-mix(in_oklab,var(--accent)_22%,transparent)]" style={{ width: `${Math.max(4, (r.n / max) * 100)}%` }} />
          <span className="relative truncate pr-3">{r.label}</span>
          <span className="relative tabular-nums text-[var(--muted)]">{r.n}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function AnalyticsPage() {
  const user = await requireUser();
  const row = (await pageForUser(user.id))!;
  const s = await pageStats(row.id, 30);
  const page = parsePage(row.published ?? row.draft);
  const byId = new Map(page.tiles.map(t => [t.id, t]));
  const stat = (label: string, value: string) => (
    <div className={card}><p className="text-[13.5px] text-[var(--muted)]">{label}</p><p className="mt-1 text-[38px] font-semibold tracking-[-0.03em] tabular-nums">{value}</p></div>
  );
  return (
    <div className="posy-rise grid gap-5">
      <div className="mb-2 mt-6"><h1 className="text-[32px] font-semibold tracking-[-0.03em]">Analytics</h1><p className="text-[15px] text-[var(--muted)]">Last 30 days. No cookies, no tracking across sites.</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        {stat('Views', s.views.toLocaleString())}
        {stat('Clicks', s.clicks.toLocaleString())}
        {stat('Click rate', `${Math.round(s.ctr * 100)}%`)}
      </div>
      <section className={card}>
        <h2 className="mb-4 text-[16px] font-semibold">Views per day</h2>
        <AreaChart data={s.series.map(d => ({ day: d.day, value: d.views }))} unit="views" />
      </section>
      <div className="grid gap-5 md:grid-cols-2">
        <section className={card}><h2 className="mb-3 text-[16px] font-semibold">Most clicked</h2><BarList rows={s.tiles.map(t => ({ label: tileName(byId.get(t.tileId ?? ''), t.tileId) ?? 'Unknown', n: t.n }))} empty="No clicks yet. Share your page to get started." /></section>
        <section className={card}><h2 className="mb-3 text-[16px] font-semibold">Where visitors come from</h2><BarList rows={s.referrers} empty="No visits yet." /></section>
      </div>
    </div>
  );
}
