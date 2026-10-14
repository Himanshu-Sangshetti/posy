import { authed, json } from '@/lib/api';
import { entitlementsFor } from '@/lib/entitlements';
import { pageForUser } from '@/lib/pages';
import { pageStats } from '@/lib/analytics';
import { parsePage } from '@/lib/schema';
import { tileLabel } from '@/lib/tile-label';

const cell = (v: string | number) => {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const row = (...v: (string | number)[]) => v.map(cell).join(',');

/** Daily views and clicks, top tiles and referrers as CSV. Part of Posy Pro on the hosted edition. */
export const GET = authed(async userId => {
  const e = await entitlementsFor(userId);
  if (!e.analyticsExport) return json({ error: 'CSV export is part of Posy Pro.' }, 402);
  const p = await pageForUser(userId);
  if (!p) return json({ error: 'No page yet' }, 404);
  const s = await pageStats(p.id, e.analyticsDays);
  const byId = new Map(parsePage(p.published ?? p.draft).tiles.map(t => [t.id, t]));
  const lines = [
    row('date', 'views', 'clicks'),
    ...s.series.map(d => row(d.day, d.views, d.clicks)),
    '',
    row('tile', 'clicks'),
    ...s.tiles.map(t => row(tileLabel(byId.get(t.tileId ?? ''), t.tileId), t.n)),
    '',
    row('referrer', 'visits'),
    ...s.referrers.map(r => row(r.label, r.n)),
  ];
  const name = `posy-analytics-${p.username}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(lines.join('\r\n') + '\r\n', {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${name}"`, 'cache-control': 'no-store' },
  });
});
