import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass, Download, Lock, StickyNote, Trash2 } from 'lucide-react';
import { requireUser } from '@/lib/session';
import { pageForUser } from '@/lib/pages';
import { hasEvents, pageStats } from '@/lib/analytics';
import { parsePage, type Tile } from '@/lib/schema';
import { tileLabel } from '@/lib/tile-label';
import { TINTS } from '@/lib/themes';
import { PLATFORMS } from '@/lib/platforms';
import { youtubeId } from '@/lib/url';
import { asset } from '@/lib/utils';
import { siteUrl } from '@/lib/site';
import { AreaChart, GhostChart } from '@/components/dash/charts';
import { CopyLink } from '@/components/dash/CopyLink';
import { PageHead, Panel } from '@/components/dash/ui';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Favicon } from '@/components/page/islands';
import { BrandIcon } from '@/components/page/tiles';
import { entitlementsFor } from '@/lib/entitlements';

export const metadata: Metadata = { title: 'Analytics · Posy' };
export const dynamic = 'force-dynamic';

const PERIODS = [
  { days: 7, label: '7 days', span: 'this week' },
  { days: 30, label: '30 days', span: 'this month' },
  { days: 90, label: '90 days', span: 'in the last three months' },
  { days: 365, label: 'A year', span: 'this year' },
];
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString()} ${n === 1 ? one : many}`;
const fmtDay = (d: string) => new Date(d + 'T00:00:00Z').toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' });

/** A tiny rendering of the tile, so you recognise it before reading its label. */
function TileMark({ tile, tint }: { tile?: Tile; tint: string }) {
  const frame = 'grid size-10 shrink-0 place-items-center overflow-hidden';
  // eslint-disable-next-line @next/next/no-img-element
  const img = (src: string) => <img src={asset(src)} alt="" className="size-full object-cover" loading="lazy" />;
  if (!tile) return <span className={`${frame} rounded-[10px] border border-dashed border-[var(--input)] text-[var(--muted)]`}><Trash2 className="size-4" /></span>;
  switch (tile.type) {
    case 'image':
      return <span className={`${frame} rounded-[8px] border border-[var(--line)] bg-[var(--surface)]`}>{img(tile.src)}</span>;
    case 'video': {
      const id = youtubeId(tile.url);
      const src = tile.image || (id ? `https://i.ytimg.com/vi/${id}/default.jpg` : '');
      return <span className={`${frame} rounded-[8px] border border-[var(--line)]`} style={{ background: tint }}>{src ? img(src) : null}</span>;
    }
    case 'music':
      return <span className={`${frame} rounded-[8px] border border-[var(--line)]`} style={{ background: tint }}>{tile.image ? img(tile.image) : <BrandIcon path={PLATFORMS.spotify.icon!.path} size={20} />}</span>;
    case 'social': {
      const p = PLATFORMS[tile.platform];
      return <span className={`${frame} rounded-full border border-[var(--line)]`} style={{ background: tint }}>{p.icon?.path ? <BrandIcon path={p.icon.path} size={18} /> : <b className="text-[15px]">{tile.platform === 'email' ? '@' : 'in'}</b>}</span>;
    }
    case 'link':
      return <span className={`${frame} rounded-[8px] border border-[var(--line)]`} style={{ background: tint }}><Favicon url={tile.url} /></span>;
    case 'github':
      return <span className={`${frame} rounded-[8px] border border-[var(--line)] bg-[var(--surface)]`}><BrandIcon path={PLATFORMS.github.icon!.path} size={18} /></span>;
    default:
      return <span className={`${frame} rounded-[8px] border border-[var(--line)]`} style={{ background: tint }}><StickyNote className="size-[18px] text-[var(--muted)]" /></span>;
  }
}

/** A ranked table: a mark, a label, a share bar, the count and its share of the total. */
function Rank({ rows, head, max, total }: { rows: { key: string; mark: React.ReactNode; label: string; n: number; colour: string }[]; head: string; max: number; total: number }) {
  return (
    <Table className="ac-table">
      <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="px-0">{head}</TableHead><TableHead className="hidden w-[30%] sm:table-cell"><span className="sr-only">Share</span></TableHead><TableHead className="w-14 text-right">Count</TableHead><TableHead className="hidden w-14 pr-0 text-right sm:table-cell">Share</TableHead></TableRow></TableHeader>
      <TableBody>
        {rows.map(r => (
          <TableRow key={r.key} title={`${r.label}: ${r.n}`}>
            <TableCell className="px-0"><span className="flex min-w-0 items-center gap-3">{r.mark}<span className="min-w-0 truncate text-[14.5px] font-medium">{r.label}</span></span></TableCell>
            <TableCell className="hidden sm:table-cell"><span className="block h-2 rounded-full bg-[var(--secondary)]"><span className="block h-full rounded-full" style={{ width: `${Math.max(4, (r.n / max) * 100)}%`, background: r.colour }} /></span></TableCell>
            <TableCell className="ac-mono text-right text-[14px] font-medium">{r.n.toLocaleString()}</TableCell>
            <TableCell className="ac-mono hidden pr-0 text-right text-[12.5px] text-[var(--muted)] sm:table-cell">{total ? Math.round((r.n / total) * 100) : 0}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const countryName = (code: string) => { try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code; } catch { return code; } };
const flag = (code: string) => /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map(c => 0x1f1a5 + c.charCodeAt(0))) : '🌍';

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const user = await requireUser();
  const row = (await pageForUser(user.id))!;
  const ent = await entitlementsFor(user.id);
  const asked = Number((await searchParams).days);
  const allowed = PERIODS.filter(p => p.days <= ent.analyticsDays);
  const period = allowed.find(p => p.days === asked) ?? allowed.find(p => p.days === 30) ?? allowed.at(-1)
    ?? { days: ent.analyticsDays, label: `${ent.analyticsDays} days`, span: `in the last ${ent.analyticsDays} days` };
  const [s, ever] = await Promise.all([pageStats(row.id, period.days), hasEvents(row.id)]);
  const page = parsePage(row.published ?? row.draft);
  const byId = new Map(page.tiles.map(t => [t.id, t]));
  const tintOf = (id?: string | null) => { const i = page.tiles.findIndex(t => t.id === id); return `var(--tint-${TINTS[(i < 0 ? 0 : i) % TINTS.length]})`; };
  const pageUrl = `${siteUrl()}/${row.username}`;
  const pro = ent.plan !== 'self-hosted';

  const switcher = (
    <nav aria-label="Period" className="ac-seg max-w-full overflow-x-auto">
      {PERIODS.map(p => p.days <= ent.analyticsDays
        ? <Link key={p.days} href={`/analytics?days=${p.days}`} aria-current={p.days === period.days ? 'page' : undefined} scroll={false}>{p.label}</Link>
        : (
          <span key={p.days} aria-disabled title={pro ? 'Part of Posy Pro' : undefined} className="inline-flex h-[34px] cursor-default items-center gap-1.5 px-3.5 text-[14px] text-[var(--muted)]/60">
            {p.label} <Lock className="size-3.5" aria-hidden />{pro && <span className="ac-pill ac-tone-butter !h-[18px]">Pro</span>}
          </span>
        ))}
    </nav>
  );

  // A brand-new page: show what will appear here and help them share it.
  if (!ever) return (
    <div className="grid min-w-0 gap-6 [&>*]:min-w-0">
      <PageHead eyebrow="Analytics" title={<>Nobody has <i>stopped by</i> yet.</>} lede="Your page is live. Share it, and this page fills in by itself: visits each day, which tiles people tap, and where they found you. No cookies, nothing that follows anyone around." />
      <Panel eyebrow="Your link" tone="lilac" title={<>Share it <i>first</i></>} desc="Pop it in your Instagram or X bio, your email signature, or send it to a friend.">
        <CopyLink url={pageUrl} />
      </Panel>
      <Panel eyebrow="Preview" tone="sky" title={<>Visits <i>per day</i></>}>
        <div className="relative">
          <GhostChart />
          <p className="ac-mono absolute inset-x-0 top-[40%] text-center text-[12.5px] text-[var(--muted)]"><span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 py-1.5">your first visits will draw a line here</span></p>
        </div>
      </Panel>
      <div className="grid gap-6 md:grid-cols-2 [&>*]:min-w-0">
        {[['What people', 'tapped', 'Each tile, with how often it was tapped.', 'peach'], ['Where they', 'came from', 'Instagram, X, a newsletter, or straight to your link.', 'mint']].map(([a, b, note, tone]) => (
          <Panel key={b} eyebrow={b === 'tapped' ? 'Tiles' : 'Sources'} tone={tone as 'peach' | 'mint'} title={<>{a} <i>{b}</i></>} desc={note}>
            <ul aria-hidden className="grid gap-4 opacity-60">
              {[78, 52, 30].map((w, i) => (
                <li key={w} className="flex items-center gap-3">
                  <span className="size-10 shrink-0 rounded-[8px]" style={{ background: `var(--tint-${TINTS[i + (b === 'tapped' ? 0 : 3)]})` }} />
                  <span className="h-2 rounded-full bg-[var(--line)]" style={{ width: `${w}%` }} />
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </div>
  );

  const best = s.series.reduce((a, d) => (d.views > a.views ? d : a), s.series[0]);
  const topRef = s.referrers.find(r => r.label !== 'Direct or unknown');
  const quiet = s.views === 0;
  const tileRows = s.tiles.map((t, i) => ({ key: `${t.tileId}-${i}`, mark: <TileMark tile={byId.get(t.tileId ?? '')} tint={tintOf(t.tileId)} />, label: tileLabel(byId.get(t.tileId ?? ''), t.tileId) ?? 'Unknown', n: t.n, colour: tintOf(t.tileId) }));
  const tileMax = Math.max(1, ...tileRows.map(r => r.n));
  const refMax = Math.max(1, ...s.referrers.map(r => r.n));
  const countryMax = Math.max(1, ...s.countries.map(c => c.n));
  const kpis = [
    { k: 'Visits', v: s.views, tone: 'lilac', suffix: '' },
    { k: 'Taps', v: s.clicks, tone: 'rose', suffix: '' },
    { k: 'Tap rate', v: Math.round(s.ctr * 100), tone: 'mint', suffix: '%' },
  ] as const;

  return (
    <div className="grid min-w-0 gap-6 [&>*]:min-w-0">
      <PageHead eyebrow={`Analytics · ${period.label}`}
        title={quiet
          ? <>A quiet stretch, <i>no visits</i> {period.span}.</>
          : <>{plural(s.views, 'visit')} <i>{period.span}</i>, {s.clicks ? `${plural(s.clicks, 'tap')} on your tiles.` : 'no taps yet.'}</>}
        lede={<>
          {!quiet && best.views > 0 && <>Your best day was {fmtDay(best.day)}, with {plural(best.views, 'visit')}. </>}
          {!quiet && topRef && <>Most people found you through {topRef.label}. </>}
          Counted without cookies.
        </>} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        {switcher}
        {ent.analyticsExport && <a href={`/api/v1/analytics/export`} className="ac-btn ac-btn-soft inline-flex items-center gap-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)]"><Download className="size-4" />Download CSV</a>}
      </div>

      <dl className="grid grid-cols-3 gap-3 sm:gap-4">
        {kpis.map(({ k, v, suffix }) => (
          <div key={k} className="ac-card ac-rise p-4 sm:p-5">
            <dt className="ac-eyebrow !text-[var(--text)]/60">{k}</dt>
            <dd className="ac-display mt-2 text-[34px] leading-none tabular-nums sm:text-[48px]"><NumberTicker value={v} />{suffix}</dd>
          </div>
        ))}
      </dl>

      <Panel eyebrow="Trend" tone="sky" title={<>Visits <i>per day</i></>}>
        <AreaChart data={s.series.map(d => ({ day: d.day, value: d.views }))} unit="visits" />
      </Panel>

      <div className="grid gap-6 md:grid-cols-2 [&>*]:min-w-0">
        <Panel eyebrow="Tiles" tone="peach" title={<>What people <i>tapped</i></>}>
          {tileRows.length
            ? <Rank head="Tile" rows={tileRows} max={tileMax} total={s.clicks} />
            : <p className="rounded-2xl border border-dashed border-[var(--input)] px-4 py-8 text-center text-[14px] text-[var(--muted)]">No taps {period.span} yet.</p>}
        </Panel>
        <Panel eyebrow="Sources" tone="mint" title={<>Where they <i>came from</i></>}>
          {s.referrers.length
            ? <Rank head="Source" max={refMax} total={s.views} rows={s.referrers.map(r => ({ key: r.label, label: r.label, n: r.n, colour: 'var(--ac-lilac)',
                mark: <span className="grid size-10 shrink-0 place-items-center rounded-[8px] border border-[var(--line)] bg-[var(--surface)]">{r.label === 'Direct or unknown' ? <Compass className="size-[18px] text-[var(--muted)]" /> : <Favicon url={`https://${r.label}`} />}</span> }))} />
            : <p className="rounded-2xl border border-dashed border-[var(--input)] px-4 py-8 text-center text-[14px] text-[var(--muted)]">Nobody {period.span} yet.</p>}
        </Panel>
      </div>

      {s.countries.length > 0 && (
        <Panel eyebrow="Places" tone="sky" title={<>Where in the <i>world</i></>}>
          <Rank head="Country" max={countryMax} total={s.views} rows={s.countries.map(c => ({ key: c.code, label: countryName(c.code), n: c.n, colour: 'var(--ac-sky)',
            mark: <span aria-hidden className="grid size-10 shrink-0 place-items-center text-[24px]">{flag(c.code)}</span> }))} />
        </Panel>
      )}
    </div>
  );
}
