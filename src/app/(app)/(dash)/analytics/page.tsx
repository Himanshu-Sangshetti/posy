import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass, Lock, StickyNote, Trash2 } from 'lucide-react';
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
  const frame = 'grid size-11 shrink-0 place-items-center overflow-hidden';
  // eslint-disable-next-line @next/next/no-img-element
  const img = (src: string) => <img src={asset(src)} alt="" className="size-full object-cover" loading="lazy" />;
  if (!tile) return <span className={`${frame} rounded-[10px] border border-dashed border-[#d9cfc3] text-[#b3a89c]`}><Trash2 className="size-4" /></span>;
  switch (tile.type) {
    case 'image':
      return <span className={`${frame} -rotate-3 bg-[#fffefb] p-[3px] pb-[7px] shadow-[var(--dk-shadow)]`}>{img(tile.src)}</span>;
    case 'video': {
      const id = youtubeId(tile.url);
      const src = tile.image || (id ? `https://i.ytimg.com/vi/${id}/default.jpg` : '');
      return <span className={`${frame} rounded-[6px] shadow-[var(--dk-shadow)]`} style={{ background: tint }}>{src ? img(src) : null}</span>;
    }
    case 'music':
      return <span className={`${frame} shadow-[var(--dk-shadow)]`} style={{ background: tint }}>{tile.image ? img(tile.image) : <BrandIcon path={PLATFORMS.spotify.icon!.path} size={20} />}</span>;
    case 'social': {
      const p = PLATFORMS[tile.platform];
      return <span className={`${frame} rounded-full border-[3px] border-[#fffefb] shadow-[var(--dk-shadow)]`} style={{ background: tint }}>{p.icon?.path ? <BrandIcon path={p.icon.path} size={18} /> : <b className="text-[15px]">{tile.platform === 'email' ? '@' : 'in'}</b>}</span>;
    }
    case 'link':
      return <span className={`${frame} rounded-[10px_16px_16px_10px] shadow-[var(--dk-shadow)]`} style={{ background: tint }}><Favicon url={tile.url} /></span>;
    case 'github':
      return <span className={`${frame} rounded-[4px] bg-[#fffefb] shadow-[var(--dk-shadow)]`}><BrandIcon path={PLATFORMS.github.icon!.path} size={18} /></span>;
    default:
      return <span className={`${frame} rotate-2 shadow-[var(--dk-shadow)]`} style={{ background: tint }}><StickyNote className="size-[18px] text-[#8d8379]" /></span>;
  }
}

/** One row: a mark, a label, a gentle bar and the count. */
function Row({ mark, label, n, max, colour }: { mark: React.ReactNode; label: string; n: number; max: number; colour: string }) {
  return (
    <li className="flex items-center gap-4" title={`${label}: ${n}`}>
      {mark}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 truncate text-[15px]">{label}</span>
          <span className="font-[family-name:var(--font-serif)] text-[24px] leading-none tabular-nums">{n.toLocaleString()}</span>
        </div>
        <div className="mt-2 h-[7px] rounded-full bg-[rgb(45_39_35/.05)]">
          <div className="h-full rounded-full" style={{ width: `${Math.max(3, (n / max) * 100)}%`, background: colour }} />
        </div>
      </div>
    </li>
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
    <nav aria-label="Period" className="app-nav -ml-3 flex-wrap">
      {PERIODS.map(p => p.days <= ent.analyticsDays
        ? <Link key={p.days} href={`/analytics?days=${p.days}`} aria-current={p.days === period.days ? 'page' : undefined} scroll={false}>{p.label}</Link>
        : (
          <span key={p.days} aria-disabled title={pro ? 'Part of Posy Pro' : undefined} className="inline-flex cursor-default items-center gap-1.5 px-3 py-2 text-[15px] text-[#b3a89c]">
            {p.label} <Lock className="size-3.5" aria-hidden />{pro && <span className="app-hand text-[19px]">Pro</span>}
          </span>
        ))}
    </nav>
  );

  // A brand-new page: show what will appear here and help them share it.
  if (!ever) return (
    <div className="posy-rise grid min-w-0 gap-7 [&>*]:min-w-0">
      <header className="mt-6">
        <h1 className="app-h1 max-w-[14ch] !text-[46px] !leading-[1.02] sm:!text-[60px]">Nobody has <i>stopped by</i> yet.</h1>
        <p className="app-lede">Your page is live. Share it, and this page fills in by itself: visits each day, which tiles people tap, and where they found you. No cookies, nothing that follows anyone around.</p>
      </header>
      <section className="app-card">
        <span aria-hidden className="app-tape" />
        <p className="app-hand mb-3 text-[24px] text-[#8d8379]">your link</p>
        <CopyLink url={pageUrl} />
        <p className="mt-4 text-[15px] text-[#8d8379]">Pop it in your Instagram or X bio, your email signature, or send it to a friend.</p>
      </section>
      <section className="app-card">
        <h2 className="app-h2">Visits <i>per day</i></h2>
        <div className="relative mt-4">
          <GhostChart />
          <p className="app-hand absolute inset-x-0 top-[38%] text-center text-[26px] text-[#8d8379]">your first visits will draw a line here</p>
        </div>
      </section>
      <div className="grid gap-7 md:grid-cols-2 [&>*]:min-w-0">
        {[['What people', 'tapped', 'Each tile, with how often it was tapped.'], ['Where they', 'came from', 'Instagram, X, a newsletter, or straight to your link.']].map(([a, b, note]) => (
          <section key={b} className="app-card">
            <h2 className="app-h2">{a} <i>{b}</i></h2>
            <ul aria-hidden className="mt-5 grid gap-4 opacity-50">
              {[78, 52, 30].map((w, i) => (
                <li key={w} className="flex items-center gap-4">
                  <span className="size-11 shrink-0 rounded-[10px]" style={{ background: `var(--tint-${TINTS[i + (b === 'tapped' ? 0 : 3)]})` }} />
                  <span className="h-[7px] rounded-full bg-[rgb(45_39_35/.08)]" style={{ width: `${w}%` }} />
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[15px] text-[#8d8379]">{note}</p>
          </section>
        ))}
      </div>
    </div>
  );

  const best = s.series.reduce((a, d) => (d.views > a.views ? d : a), s.series[0]);
  const topRef = s.referrers.find(r => r.label !== 'Direct or unknown');
  const quiet = s.views === 0;
  const tileRows = s.tiles.map(t => ({ tile: byId.get(t.tileId ?? ''), label: tileLabel(byId.get(t.tileId ?? ''), t.tileId) ?? 'Unknown', n: t.n, tint: tintOf(t.tileId) }));
  const tileMax = Math.max(1, ...tileRows.map(r => r.n));
  const refMax = Math.max(1, ...s.referrers.map(r => r.n));
  const countryMax = Math.max(1, ...s.countries.map(c => c.n));

  return (
    <div className="posy-rise grid min-w-0 gap-7 [&>*]:min-w-0">
      <header className="mt-6">
        <h1 className="app-h1 max-w-[17ch] !text-[44px] !leading-[1.04] sm:!text-[58px]">
          {quiet
            ? <>A quiet stretch, <i>no visits</i> {period.span}.</>
            : <>{plural(s.views, 'visit')} <i>{period.span}</i>, {s.clicks ? `${plural(s.clicks, 'tap')} on your tiles.` : 'no taps yet.'}</>}
        </h1>
        <p className="app-lede">
          {!quiet && best.views > 0 && <>Your best day was {fmtDay(best.day)}, with {plural(best.views, 'visit')}. </>}
          {!quiet && topRef && <>Most people found you through {topRef.label}. </>}
          Counted without cookies.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {switcher}
          {ent.analyticsExport && <a href={`/api/v1/analytics/export`} className="app-btn app-btn-ghost">Download CSV</a>}
        </div>
      </header>

      <section className="app-card">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <h2 className="app-h2">Visits <i>per day</i></h2>
          <dl className="flex gap-8 sm:gap-10">
            {[['Visits', s.views.toLocaleString()], ['Taps', s.clicks.toLocaleString()], ['Tap rate', `${Math.round(s.ctr * 100)}%`]].map(([k, v]) => (
              <div key={k}><dt className="app-hand text-[21px] leading-none text-[#8d8379]">{k}</dt><dd className="mt-1 font-[family-name:var(--font-serif)] text-[38px] leading-none tabular-nums">{v}</dd></div>
            ))}
          </dl>
        </div>
        <AreaChart data={s.series.map(d => ({ day: d.day, value: d.views }))} unit="visits" />
      </section>

      <div className="grid gap-7 md:grid-cols-2 [&>*]:min-w-0">
        <section className="app-card">
          <h2 className="app-h2">What people <i>tapped</i></h2>
          {tileRows.length
            ? <ul className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-4">{tileRows.map((r, i) => <Row key={i} mark={<TileMark tile={r.tile} tint={r.tint} />} label={r.label} n={r.n} max={tileMax} colour={r.tint} />)}</ul>
            : <p className="app-hand mt-4 text-[24px] text-[#8d8379]">No taps {period.span} yet.</p>}
        </section>
        <section className="app-card">
          <h2 className="app-h2">Where they <i>came from</i></h2>
          {s.referrers.length
            ? (
              <ul className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-4">
                {s.referrers.map(r => {
                  const direct = r.label === 'Direct or unknown';
                  return <Row key={r.label} label={r.label} n={r.n} max={refMax} colour="color-mix(in oklab, var(--accent) 38%, var(--tint-peach))"
                    mark={<span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#fffefb] shadow-[var(--dk-shadow)]">{direct ? <Compass className="size-[18px] text-[#8d8379]" /> : <Favicon url={`https://${r.label}`} />}</span>} />;
                })}
              </ul>
            )
            : <p className="app-hand mt-4 text-[24px] text-[#8d8379]">Nobody {period.span} yet.</p>}
        </section>
      </div>

      {s.countries.length > 0 && (
        <section className="app-card">
          <h2 className="app-h2">Where in the <i>world</i></h2>
          <ul className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 md:gap-x-10">
            {s.countries.map(c => <Row key={c.code} label={countryName(c.code)} n={c.n} max={countryMax} colour="var(--tint-sky)"
              mark={<span aria-hidden className="grid size-11 shrink-0 place-items-center text-[26px]">{flag(c.code)}</span>} />)}
          </ul>
        </section>
      )}
    </div>
  );
}
