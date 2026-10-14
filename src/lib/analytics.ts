import 'server-only';
import { and, eq, gte, sql, desc } from 'drizzle-orm';
import { db } from '@/db';
import { events } from '@/db/app-schema';

const DAY = 86_400_000;

/** Whether a page has ever had a visit or a tap (to tell a brand-new page from a quiet week). */
export async function hasEvents(pageId: string) {
  return !!(await db.select({ id: events.id }).from(events).where(eq(events.pageId, pageId)).limit(1).get());
}

export async function pageStats(pageId: string, days = 30) {
  const since = new Date(Date.now() - days * DAY);
  const where = and(eq(events.pageId, pageId), gte(events.createdAt, since));
  const dayExpr = sql<string>`strftime('%Y-%m-%d', ${events.createdAt} / 1000, 'unixepoch')`;

  const [daily, totals, tiles, referrers, countries] = await Promise.all([
    db.select({ day: dayExpr, kind: events.kind, n: sql<number>`count(*)` }).from(events).where(where).groupBy(dayExpr, events.kind),
    db.select({ kind: events.kind, n: sql<number>`count(*)` }).from(events).where(where).groupBy(events.kind),
    db.select({ tileId: events.tileId, n: sql<number>`count(*)` }).from(events).where(and(where, eq(events.kind, 'click'))).groupBy(events.tileId).orderBy(desc(sql`count(*)`)).limit(8),
    db.select({ referrer: events.referrer, n: sql<number>`count(*)` }).from(events).where(and(where, eq(events.kind, 'view'))).groupBy(events.referrer).orderBy(desc(sql`count(*)`)).limit(6),
    db.select({ country: events.country, n: sql<number>`count(*)` }).from(events).where(and(where, eq(events.kind, 'view'))).groupBy(events.country).orderBy(desc(sql`count(*)`)).limit(6),
  ]);

  // A continuous series (zero-filled) so the chart never skips days.
  const series: { day: string; views: number; clicks: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
    series.push({ day: d, views: 0, clicks: 0 });
  }
  const byDay = new Map(series.map(s => [s.day, s]));
  for (const r of daily) { const s = byDay.get(r.day); if (s) s[r.kind === 'view' ? 'views' : 'clicks'] = Number(r.n); }

  const views = Number(totals.find(t => t.kind === 'view')?.n ?? 0);
  const clicks = Number(totals.find(t => t.kind === 'click')?.n ?? 0);
  return {
    series, views, clicks, ctr: views ? clicks / views : 0,
    tiles: tiles.map(t => ({ tileId: t.tileId, n: Number(t.n) })),
    referrers: referrers.map(r => ({ label: r.referrer || 'Direct or unknown', n: Number(r.n) })),
    // Countries only exist when the host adds a geo header (Vercel, Cloudflare); otherwise all null.
    countries: countries.filter(c => c.country).map(c => ({ code: c.country!, n: Number(c.n) })),
  };
}
