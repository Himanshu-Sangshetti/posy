'use client';

// Small interactive bits of the public page.
import { useEffect, useRef, useState } from 'react';
import { Link2, Play, Share2, Check } from 'lucide-react';
import { hostOf } from '@/lib/url';

/** A small live clock, like a desktop menubar (Lofi). Renders the time on the server too, so nothing jumps. */
export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const id = setInterval(() => setNow(new Date()), 15_000); return () => clearInterval(id); }, []);
  return <time className="lf-clock" suppressHydrationWarning>{now ? now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '--:--'}</time>;
}

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

/** Characters from light to dark, for photos drawn as ASCII. */
const RAMP = ' .:-=+*#%@';

/** Lofi canvas pages: visitors can pick a window up by its title bar and move it, like a real desktop.
 *  Nothing is saved; a click that ends a drag doesn't open the link. Off on phones (the canvas is a column there). */
export function DraggableWindows() {
  useEffect(() => {
    let top = 100;
    let drag: { el: HTMLElement; x: number; y: number; ox: number; oy: number; moved: boolean } | null = null;
    let swallow = false;
    const down = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      const win = t.closest<HTMLElement>('.posy-cv');
      if (!win || e.button !== 0 || !window.matchMedia('(min-width: 640px)').matches) return;
      win.style.zIndex = String(++top);
      if (!t.closest('.lf-bar')) return;
      const [ox, oy] = (win.style.translate || '0px 0px').split(' ').map(v => parseFloat(v) || 0);
      drag = { el: win, x: e.clientX, y: e.clientY, ox, oy, moved: false };
      win.classList.add('lf-dragging');
      e.preventDefault();
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
      drag.el.style.translate = `${drag.ox + dx}px ${drag.oy + dy}px`;
    };
    const up = () => { if (!drag) return; swallow = drag.moved; drag.el.classList.remove('lf-dragging'); drag = null; };
    const click = (e: MouseEvent) => { if (swallow) { e.preventDefault(); e.stopPropagation(); swallow = false; } };
    document.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', up);
    document.addEventListener('click', click, true);
    return () => { document.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); document.removeEventListener('click', click, true); };
  }, []);
  return null;
}

/**
 * Photos printed as 1-bit dither in the page's ink, on its paper. Hovering a tile dissolves the print block by block
 * to the real photo, and back. Each photo is drawn once into a canvas over the <img>; without JS (or if an image host
 * refuses CORS) the CSS fallback shows it in black and white instead.
 */
export function DitherPhotos() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>('.posy-photos-dither, .posy-photos-ascii');
    if (!page) return;
    const ascii = page.classList.contains('posy-photos-ascii');
    const css = getComputedStyle(page);
    const rgb = (v: string) => { const c = document.createElement('canvas').getContext('2d')!; c.fillStyle = v.trim() || '#000'; const h = c.fillStyle as string; return h.startsWith('#') ? [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) : [0, 0, 0]; };
    const ink = rgb(css.getPropertyValue('--text')), paper = rgb(css.getPropertyValue('--surface'));
    const PX = 2, BLOCK = 6;
    const cleanups: (() => void)[] = [];
    // React may still be hydrating parts of the page and drop nodes it didn't render; put our canvas back if so.
    const canvases = new WeakMap<HTMLImageElement, HTMLCanvasElement>();

    const print = (img: HTMLImageElement) => {
      const had = canvases.get(img);
      if (had) { if (!had.isConnected && img.isConnected) img.insertAdjacentElement('afterend', had); return; }
      if (img.closest('.posy-dither-skip')) return;
      const src = new Image(); src.crossOrigin = 'anonymous'; src.src = img.currentSrc || img.src;
      const cv = document.createElement('canvas'); cv.className = 'posy-dith'; cv.setAttribute('aria-hidden', 'true');
      canvases.set(img, cv);
      let data: ImageData | null = null, order: number[] = [], shown = 1, raf = 0, bw = 0, bh = 0, blk = BLOCK;
      const draw = () => {
        const w = img.offsetWidth, h = img.offsetHeight;
        if (!w || !h || !src.naturalWidth) return;
        Object.assign(cv.style, { left: `${img.offsetLeft}px`, top: `${img.offsetTop}px`, width: `${w}px`, height: `${h}px` });
        if (ascii) { drawAscii(w, h); return; }
        blk = BLOCK;
        bw = Math.ceil(w / PX); bh = Math.ceil(h / PX); cv.width = bw; cv.height = bh;
        const ctx = cv.getContext('2d', { willReadFrequently: true })!;
        const s = Math.max(bw / src.naturalWidth, bh / src.naturalHeight);
        ctx.drawImage(src, (bw - src.naturalWidth * s) / 2, (bh - src.naturalHeight * s) / 2, src.naturalWidth * s, src.naturalHeight * s);
        let px: ImageData;
        try { px = ctx.getImageData(0, 0, bw, bh); } catch { cv.remove(); img.classList.remove('posy-dith-on'); return; }
        // luminance with a little contrast, then Atkinson error diffusion (keeps highlights open, like an old Mac print)
        const L = new Float32Array(bw * bh);
        for (let i = 0; i < L.length; i++) { const l = (px.data[i * 4] * .299 + px.data[i * 4 + 1] * .587 + px.data[i * 4 + 2] * .114) / 255; L[i] = Math.min(1, Math.max(0, (Math.pow(l, 1.12) - .5) * 1.12 + .5)); }
        for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
          const i = y * bw + x, o = L[i] < .5 ? 0 : 1, e = (L[i] - o) / 8;
          L[i] = o;
          for (const [dx, dy] of [[1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]]) { const xx = x + dx, yy = y + dy; if (xx >= 0 && xx < bw && yy < bh) L[yy * bw + xx] += e; }
        }
        for (let i = 0; i < L.length; i++) { const c = L[i] ? paper : ink; px.data.set([c[0], c[1], c[2], 255], i * 4); }
        data = px; ctx.putImageData(px, 0, 0);
        shuffle();
      };
      // ASCII: the photo as characters of a mono font, darker cells get denser glyphs (like efecto.app)
      const drawAscii = (w: number, h: number) => {
        const dpr = Math.min(2, window.devicePixelRatio || 1), CH = 11, CW = CH * .6;
        const cols = Math.ceil(w / CW), rows = Math.ceil(h / CH);
        const probe = document.createElement('canvas'); probe.width = cols; probe.height = rows;
        const pc = probe.getContext('2d', { willReadFrequently: true })!;
        const s = Math.max(cols / src.naturalWidth, rows / src.naturalHeight);
        pc.drawImage(src, (cols - src.naturalWidth * s) / 2, (rows - src.naturalHeight * s) / 2, src.naturalWidth * s, src.naturalHeight * s);
        let px: ImageData;
        try { px = pc.getImageData(0, 0, cols, rows); } catch { cv.remove(); img.classList.remove('posy-dith-on'); return; }
        bw = cv.width = Math.round(w * dpr); bh = cv.height = Math.round(h * dpr); blk = Math.round(CH * dpr);
        const ctx = cv.getContext('2d', { willReadFrequently: true })!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = `rgb(${paper.join(',')})`; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = `rgb(${ink.join(',')})`; ctx.font = `600 ${CH}px ui-monospace, "Geist Mono", Menlo, monospace`; ctx.textBaseline = 'top';
        const lum = new Float32Array(cols * rows);
        for (let i = 0; i < lum.length; i++) lum[i] = (px.data[i * 4] * .299 + px.data[i * 4 + 1] * .587 + px.data[i * 4 + 2] * .114) / 255;
        // stretch each photo's own range so it always uses the whole ramp, with a little gamma to open the lights
        const sorted = Float32Array.from(lum).sort(), lo = sorted[Math.floor(sorted.length * .04)], hi = sorted[Math.floor(sorted.length * .96)] || 1;
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          const l = Math.min(1, Math.max(0, (lum[y * cols + x] - lo) / Math.max(.05, hi - lo)));
          const ch = RAMP[Math.min(RAMP.length - 1, Math.round(Math.pow(1 - l, 1.3) * (RAMP.length - 1)))];
          if (ch !== ' ') ctx.fillText(ch, x * CW, y * CH);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        data = ctx.getImageData(0, 0, bw, bh);
        shuffle();
      };
      const shuffle = () => {
        const n = Math.ceil(bw / blk) * Math.ceil(bh / blk);
        order = Array.from({ length: n }, (_, i) => i).sort(() => Math.random() - .5);
        shown = 1;
        img.classList.add('posy-dith-on');
      };
      // dissolve: blocks of the print are removed (or put back) in a random order over ~420ms
      const animate = (to: number) => {
        cancelAnimationFrame(raf);
        if (!data) return;
        const ctx = cv.getContext('2d')!; const cols = Math.ceil(bw / blk);
        const from = shown, t0 = performance.now();
        const step = (now: number) => {
          const k = Math.min(1, (now - t0) / 420), v = from + (to - from) * k;
          const a = Math.round(order.length * Math.min(shown, v)), b = Math.round(order.length * Math.max(shown, v));
          for (let j = a; j < b; j++) {
            const bx = (order[j] % cols) * blk, by = Math.floor(order[j] / cols) * blk;
            if (to < shown) ctx.clearRect(bx, by, blk, blk); else ctx.putImageData(data!, 0, 0, bx, by, blk, blk);
          }
          shown = v;
          if (k < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      };
      const tile = img.closest<HTMLElement>('.posy-tile, .posy-avatar, .posy-obj') ?? img.parentElement!;
      const enter = () => animate(0), leave = () => animate(1);
      tile.addEventListener('pointerenter', enter); tile.addEventListener('pointerleave', leave);
      tile.addEventListener('focusin', enter); tile.addEventListener('focusout', leave);
      const ro = new ResizeObserver(() => { cancelAnimationFrame(raf); draw(); });
      img.insertAdjacentElement('afterend', cv);
      const go = () => { draw(); ro.observe(img); };
      if (src.complete && src.naturalWidth) go(); else { src.onload = go; src.onerror = () => cv.remove(); }
      cleanups.push(() => { cancelAnimationFrame(raf); ro.disconnect(); cv.remove(); tile.removeEventListener('pointerenter', enter); tile.removeEventListener('pointerleave', leave); tile.removeEventListener('focusin', enter); tile.removeEventListener('focusout', leave); });
    };
    const scan = () => page.querySelectorAll<HTMLImageElement>('.posy-tile img, .posy-avatar img, .posy-obj img').forEach(img => { if (img.width >= 48 || img.offsetWidth >= 48) print(img); });
    scan();
    const mo = new MutationObserver(scan); mo.observe(page, { childList: true, subtree: true });
    return () => { mo.disconnect(); cleanups.forEach(f => f()); };
  }, []);
  return null;
}
