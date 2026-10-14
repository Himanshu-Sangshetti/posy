'use client';

import { useEffect, useRef, useState } from 'react';

const fmtDay = (d: string) => new Date(d + 'T00:00:00Z').toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const nice = (max: number) => { if (max <= 4) return 4; const p = 10 ** Math.floor(Math.log10(max)); return Math.ceil(max / p) * p; };

/** One series over time: area + 2px line, crosshair tooltip, table for screen readers. */
export function AreaChart({ data, unit }: { data: { day: string; value: number }[]; unit: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(800);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, e.contentRect.width)));
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  const h = 220, pl = 34, pr = 8, pt = 12, pb = 26;
  const max = nice(Math.max(...data.map(d => d.value), 0));
  const x = (i: number) => pl + (i * (w - pl - pr)) / Math.max(1, data.length - 1);
  const y = (v: number) => pt + (1 - v / max) * (h - pt - pb);
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join('');
  const area = `${line}L${x(data.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const ticks = [0, max / 2, max];
  const onMove = (e: React.PointerEvent) => {
    const r = (e.currentTarget as SVGElement).getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left - pl) / (w - pl - pr)) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };
  const hv = hover !== null ? data[hover] : null;
  return (
    <div ref={box} className="relative">
      <svg width={w} height={h} role="img" aria-label={`${unit} per day`} onPointerMove={onMove} onPointerLeave={() => setHover(null)} className="block touch-none">
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity=".28" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map(t => (
          <g key={t}>
            <line x1={pl} x2={w - pr} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray={t ? '3 4' : undefined} />
            <text x={pl - 8} y={y(t) + 4} textAnchor="end" fontSize="11.5" fill="var(--muted)">{t}</text>
          </g>
        ))}
        <path d={area} fill="url(#area-fill)" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {[0, Math.floor((data.length - 1) / 2), data.length - 1].map(i => (
          <text key={i} x={x(i)} y={h - 6} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} fontSize="11.5" fill="var(--muted)">{fmtDay(data[i].day)}</text>
        ))}
        {hv && hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pt} y2={y(0)} stroke="var(--muted)" strokeOpacity=".5" />
            <circle cx={x(hover)} cy={y(hv.value)} r={5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
          </g>
        )}
      </svg>
      {hv && hover !== null && (
        <div className="pointer-events-none absolute top-1 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[13px] shadow-lg"
          style={{ left: Math.min(Math.max(x(hover) - 60, 0), w - 130) }}>
          <div className="text-[var(--muted)]">{fmtDay(hv.day)}</div>
          <div className="font-semibold">{hv.value} {unit}</div>
        </div>
      )}
      <table className="sr-only">
        <caption>{unit} per day</caption>
        <tbody>{data.map(d => <tr key={d.day}><th scope="row">{d.day}</th><td>{d.value}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
