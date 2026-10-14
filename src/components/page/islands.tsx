'use client';

// Small interactive bits of the public page.
import { useEffect, useRef, useState } from 'react';
import { Link2, Play, Share2, Check } from 'lucide-react';
import { hostOf } from '@/lib/url';

export function Favicon({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => { const i = ref.current; if (i && i.complete && i.naturalWidth === 0) setFailed(true); }, []);
  const host = hostOf(url);
  if (failed || !host.includes('.')) return <Link2 className="size-[18px]" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={`https://icons.duckduckgo.com/ip3/${host}.ico`} alt="" width={20} height={20} className="size-5 rounded-[5px]" onError={() => setFailed(true)} loading="lazy" />;
}

export function VideoPlayer({ id, title, editing, thumb }: { id: string; title?: string; editing?: boolean; thumb?: string }) {
  const [playing, setPlaying] = useState(false);
  if (playing && !editing)
    return <iframe className="size-full" src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title={title || 'Video'} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />;
  return (
    <button type="button" onClick={e => { if (editing) return; e.preventDefault(); setPlaying(true); }} className="relative block size-full text-left" aria-label={`Play ${title || 'video'}`} tabIndex={editing ? -1 : 0}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumb || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" style={thumb ? undefined : { transform: 'scale(1.34)' }} loading="lazy" />
      <span className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      <span className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-lg backdrop-blur transition-transform duration-300 group-hover:scale-110">
        <Play className="ml-0.5 size-5 fill-[#1b1b1b] text-[#1b1b1b]" />
      </span>
      {title && <span className="absolute inset-x-4 bottom-3 line-clamp-1 text-[14px] font-medium text-white">{title}</span>}
    </button>
  );
}

export function ShareButton({ url }: { url?: string }) {
  const [done, setDone] = useState(false);
  async function share() {
    const href = url || window.location.href;
    if (navigator.share) { try { await navigator.share({ url: href }); return; } catch { /* cancelled */ } }
    await navigator.clipboard.writeText(href);
    setDone(true); setTimeout(() => setDone(false), 1600);
  }
  return (
    <button type="button" onClick={share} className="sf-pill sf-pill-btn">
      {done ? <Check className="size-3.5" /> : <Share2 className="size-3.5" />}{done ? 'Copied' : 'Share'}
    </button>
  );
}

/** Tilt and glow follow the pointer. One listener for the whole page; the visuals are CSS. */
export function TileEffects() {
  useEffect(() => {
    let current: HTMLElement | null = null;
    const reset = (el: HTMLElement | null) => { if (el) { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); } };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('.posy-tile') ?? null;
      if (el !== current) { reset(current); current = el; }
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      el.style.setProperty('--mx', `${x}px`); el.style.setProperty('--my', `${y}px`);
      el.style.setProperty('--rx', `${((y / r.height) - 0.5) * -7}deg`); el.style.setProperty('--ry', `${((x / r.width) - 0.5) * 9}deg`);
    };
    const leave = () => { reset(current); current = null; };
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    return () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerleave', leave); };
  }, []);
  return null;
}

const counted = new Set<string>();

/** Cookie-free analytics: one view per load, one click per tile tap. */
export function PageAnalytics({ username }: { username: string }) {
  useEffect(() => {
    const send = (k: 'view' | 'click', t?: string) => {
      const body = JSON.stringify({ u: username, k, t, r: k === 'view' ? document.referrer : undefined });
      if (!navigator.sendBeacon?.('/api/track', new Blob([body], { type: 'text/plain' }))) fetch('/api/track', { method: 'POST', body, keepalive: true }).catch(() => {});
    };
    if (!counted.has(username)) { counted.add(username); send('view'); }
    const click = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-tile-id], .posy-social-row a');
      if (el) send('click', el.dataset.tileId ?? el.getAttribute('aria-label') ?? undefined);
    };
    document.addEventListener('click', click, { capture: true });
    return () => document.removeEventListener('click', click, { capture: true });
  }, [username]);
  return null;
}

const RAMP = ' .:-=+*#%@';
