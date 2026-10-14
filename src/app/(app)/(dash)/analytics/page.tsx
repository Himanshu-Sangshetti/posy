import type { Metadata } from 'next';
import { requireUser } from '@/lib/session';
import { pageForUser } from '@/lib/pages';
import { pageStats } from '@/lib/analytics';
import { parsePage } from '@/lib/schema';
import { tileLabel } from '@/lib/tile-label';
import { AreaChart } from '@/components/dash/charts';
import { entitlementsFor } from '@/lib/entitlements';

export const metadata: Metadata = { title: 'Analytics · Posy' };
export const dynamic = 'force-dynamic';

const card = 'app-card';

function BarList({ rows, empty }: { rows: { label: string; n: number }[]; empty: string }) {
  if (!rows.length) return <p className="py-6 text-[14px] text-[#8d8379]">{empty}</p>;
  const max = Math.max(...rows.map(r => r.n));
  return (
    <ul className="grid gap-1.5">
      {rows.map(r => (
        <li key={r.label} className="relative flex h-9 items-center justify-between overflow-hidden rounded-[10px] px-3 text-[14px]" title={`${r.label}: ${r.n}`}>
          <span aria-hidden className="absolute inset-y-0 left-0 rounded-[10px] bg-[color-mix(in_oklab,var(--accent)_22%,transparent)]" style={{ width: `${Math.max(4, (r.n / max) * 100)}%` }} />
          <span className="relative truncate pr-3">{r.label}</span>
          <span className="relative tabular-nums text-[#8d8379]">{r.n}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function AnalyticsPage() {
  const user = await requireUser();
  const row = (await pageForUser(user.id))!;
  const ent = await entitlementsFor(user.id);
  const days = ent.analyticsDays;
  const s = await pageStats(row.id, days);
  const page = parsePage(row.published ?? row.draft);
  const byId = new Map(page.tiles.map(t => [t.id, t]));
  const stat = (label: string, value: string) => (
    <div className={card}><p className="app-hand text-[22px] text-[#8d8379]">{label}</p><p className="app-num mt-1">{value}</p></div>
  );
  return (
    <div className="posy-rise grid gap-7">
      <div className="mb-4 mt-6 flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="app-h1">Who <i>stopped by</i></h1><p className="app-lede">Last {days} days. No cookies, no tracking across sites.</p></div>
        {ent.analyticsExport && <a href="/api/v1/analytics/export" className="app-btn app-btn-ghost">Download CSV</a>}
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {stat('Views', s.views.toLocaleString())}
        {stat('Clicks', s.clicks.toLocaleString())}
        {stat('Click rate', `${Math.round(s.ctr * 100)}%`)}
      </div>
      <section className={card}>
        <h2 className="app-h2 mb-4">Views per day</h2>
        <AreaChart data={s.series.map(d => ({ day: d.day, value: d.views }))} unit="views" />
      </section>
      <div className="grid gap-7 md:grid-cols-2">
        <section className={card}><h2 className="app-h2 mb-3">Most clicked</h2><BarList rows={s.tiles.map(t => ({ label: tileLabel(byId.get(t.tileId ?? ''), t.tileId) ?? 'Unknown', n: t.n }))} empty="No clicks yet. Share your page to get started." /></section>
        <section className={card}><h2 className="app-h2 mb-3">Where visitors come from</h2><BarList rows={s.referrers} empty="No visits yet." /></section>
      </div>
    </div>
  );
}
