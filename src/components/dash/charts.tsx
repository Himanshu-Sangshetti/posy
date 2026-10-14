'use client';

import { useEffect, useRef, useState } from 'react';

const fmtDay = (d: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) =>
  new Date(d + 'T00:00:00Z').toLocaleDateString('en', { ...opts, timeZone: 'UTC' });
const nice = (max: number) => { if (max <= 4) return 4; const p = 10 ** Math.floor(Math.log10(max)); const m = max / p; return (m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; };

/** Smooth line through points that never overshoots (monotone cubic), so a quiet day never dips below zero. */
function smooth(pts: [number, number][]): string {
  const n = pts.length;
  if (n < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : '';
  const dx = pts.slice(1).map((p, i) => p[0] - pts[i][0]);
  const m = pts.slice(1).map((p, i) => (p[1] - pts[i][1]) / dx[i]);
  const t = pts.map((_, i) => (i === 0 ? m[0] : i === n - 1 ? m[n - 2] : m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${(pts[i][0] + h).toFixed(1)},${(pts[i][1] + t[i] * h).toFixed(1)} ${(pts[i + 1][0] - h).toFixed(1)},${(pts[i + 1][1] - t[i + 1] * h).toFixed(1)} ${pts[i + 1][0].toFixed(1)},${pts[i + 1][1].toFixed(1)}`;
  }
  return d;
}

/**
 * One series over time: a soft area, a crosshair tooltip (pointer or
 * arrow keys), the best day marked, and a table for screen readers.
 */
export function AreaChart({ data, unit }: { data: { day: string; value: number }[]; unit: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(800);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, e.contentRect.width)));
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  const h = w < 500 ? 200 : 240, pl = 30, pr = 10, pt = 30, pb = 30;
  const top = Math.max(...data.map(d => d.value), 0);
  const max = nice(top);
  const x = (i: number) => pl + (i * (w - pl - pr)) / Math.max(1, data.length - 1);
  const y = (v: number) => pt + (1 - v / max) * (h - pt - pb);
  const line = smooth(data.map((d, i) => [x(i), y(d.value)]));
  const area = `${line}L${x(data.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const long = data.length > 120;
  const tickCount = data.length <= 7 && w >= 500 ? data.length : data.length <= 7 ? 4 : w < 500 ? 3 : 5;
  const ticks = Array.from({ length: tickCount }, (_, k) => Math.round((k * (data.length - 1)) / Math.max(1, tickCount - 1)));
  const label = (d: string) => (data.length <= 7 ? fmtDay(d, { weekday: 'short' }) : long ? fmtDay(d, { month: 'short' }) : fmtDay(d));
  const best = top > 0 ? data.findIndex(d => d.value === top) : -1;
  const pick = (clientX: number, el: Element) => {
    const r = el.getBoundingClientRect();
    const i = Math.round(((clientX - r.left - pl) / (w - pl - pr)) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };
  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 7 : 1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setHover(h0 => Math.max(0, Math.min(data.length - 1, (h0 ?? data.length - 1) + (e.key === 'ArrowRight' ? step : -step))));
    } else if (e.key === 'Escape') setHover(null);
  };
  const hv = hover !== null ? data[hover] : null;
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div ref={box} className="relative w-full min-w-0">
      <div tabIndex={0} onKeyDown={onKey} onBlur={() => setHover(null)} aria-label={`${unit} per day, ${total} in total. Use the arrow keys to read each day.`}
        className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
        <svg width={w} height={h} aria-hidden onPointerMove={e => pick(e.clientX, e.currentTarget)} onPointerDown={e => pick(e.clientX, e.currentTarget)} onPointerLeave={() => setHover(null)} className="block max-w-full touch-pan-y select-none">
          <defs>
            <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity=".32" />
              <stop offset=".75" stopColor="var(--accent)" stopOpacity=".06" />
              <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[max / 2, max].map(t => (
            <g key={t}>
              <line x1={pl} x2={w - pr} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray="3 5" strokeLinecap="round" />
              <text x={pl - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)" className="ac-mono">{t}</text>
            </g>
          ))}
          <line x1={pl} x2={w - pr} y1={y(0)} y2={y(0)} stroke="var(--input)" />
          <path d={area} fill="url(#area-fill)" />
          <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          {ticks.map(i => (
            <text key={i} x={x(i)} y={h - 8} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} fontSize="11" fill="var(--muted)" className="ac-mono">{label(data[i].day)}</text>
          ))}
          {best >= 0 && hover === null && (
            <g>
              <circle cx={x(best)} cy={y(top)} r={4.5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
              <text x={Math.min(Math.max(x(best), pl + 40), w - pr - 40)} y={y(top) - 12} textAnchor="middle" fontSize="10.5" fill="var(--ac-deep)" className="ac-mono" style={{ letterSpacing: '.08em', textTransform: 'uppercase' }}>best day</text>
            </g>
          )}
          {hv && hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={pt - 10} y2={y(0)} stroke="var(--ac-deep)" strokeOpacity=".35" strokeDasharray="3 4" />
              <circle cx={x(hover)} cy={y(hv.value)} r={6} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2.5} />
            </g>
          )}
        </svg>
      </div>
      {hv && hover !== null && (
        <div role="status" className="pointer-events-none absolute -top-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2 shadow-[0_12px_28px_-14px_rgb(80_50_130/.4)]"
          style={{ left: Math.min(Math.max(x(hover) - 70, 0), w - 140) }}>
          <div className="ac-mono text-[11px] uppercase tracking-[.06em] text-[var(--muted)]">{fmtDay(hv.day, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
          <div className="ac-display text-[22px] leading-tight">{hv.value} <span className="font-sans text-[13px] text-[var(--muted)]">{hv.value === 1 ? unit.replace(/s$/, '') : unit}</span></div>
        </div>
      )}
      <table className="sr-only">
        <caption>{unit} per day</caption>
        <tbody>{data.map(d => <tr key={d.day}><th scope="row">{d.day}</th><td>{d.value}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

/** A faint, made-up curve for the empty state: shows where the line will be, clearly not data. */
export function GhostChart() {
  const pts: [number, number][] = [8, 14, 11, 20, 17, 26, 22, 31, 27, 38, 34, 44].map((v, i) => [i * 80, 200 - v * 3.6]);
  const d = smooth(pts);
  return (
    <svg viewBox="0 0 880 210" className="block h-[180px] w-full" preserveAspectRatio="none" aria-hidden>
      <path d={`${d}L880,210L0,210Z`} fill="var(--accent)" fillOpacity=".07" />
      <path d={d} fill="none" stroke="var(--accent)" strokeOpacity=".4" strokeWidth={2.5} strokeDasharray="1 9" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
