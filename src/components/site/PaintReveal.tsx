'use client';
// A painting that starts as its own pencil sketch. Your cursor is a soft brush that paints the colour in;
// the sketch slowly settles back over it. With no pointer around, an invisible brush wanders and paints by itself.
import { useEffect, useRef } from 'react';

const BRUSH = 150, HEAL = 0.005;
const CENTER = [0.5, 0.5];

export function PaintReveal({ src, sketch, focus = CENTER, className }: { src: string; sketch: string; focus?: number[]; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!, box = wrap.current!;
    const ctx = cv.getContext('2d')!;
    const img = new Image(); // its source is set when the painting is about to scroll into view (below)
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, visible = false, dpr = 1, lastMove = 0, gone = false;
    let pointer: { x: number; y: number } | null = null, last: { x: number; y: number } | null = null;

    const paintSketch = (a: number) => {
      if (!img.naturalWidth) return;
      const W = cv.width, H = cv.height, s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a;
      ctx.drawImage(img, (W - img.naturalWidth * s) * focus[0], (H - img.naturalHeight * s) * focus[1], img.naturalWidth * s, img.naturalHeight * s);
      ctx.globalAlpha = 1;
    };
    const fit = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(box.clientWidth * dpr); cv.height = Math.round(box.clientHeight * dpr);
      paintSketch(1);
    };
    const dab = (x: number, y: number, r: number) => {
      ctx.globalCompositeOperation = 'destination-out';
      const X = x * dpr, Y = y * dpr, R = r * dpr;
      const g = ctx.createRadialGradient(X, Y, 0, X, Y, R);
      g.addColorStop(0, 'rgba(0,0,0,.95)'); g.addColorStop(0.55, 'rgba(0,0,0,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, R, 0, Math.PI * 2); ctx.fill();
    };
    // a stroke between two points, so fast moves leave a continuous trail
    const stroke = (a: { x: number; y: number }, b: { x: number; y: number }, r: number) => {
      const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (r * 0.3)));
      for (let i = 1; i <= n; i++) dab(a.x + (b.x - a.x) * (i / n), a.y + (b.y - a.y) * (i / n), r);
    };

    const tick = (now: number) => {
      raf = 0;
      const w = box.clientWidth, h = box.clientHeight, r = Math.min(BRUSH, w * 0.12);
      if (pointer) { stroke(last ?? pointer, pointer, r); last = pointer; }
      else if (!still && now - lastMove > 1800) {
        const t = now / 1000, p = { x: w * (0.5 + 0.38 * Math.sin(t * 0.21)), y: h * (0.5 + 0.26 * Math.sin(t * 0.43 + 1)) };
        stroke(last ?? p, p, r * 0.8); last = p;
      }
      paintSketch(HEAL);
      if (visible && !gone) raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf && visible && !gone) raf = requestAnimationFrame(tick); };
    const move = (e: PointerEvent) => {
      const b = box.getBoundingClientRect();
      if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) { if (pointer) leave(); return; }
      pointer = { x: e.clientX - b.left, y: e.clientY - b.top }; lastMove = performance.now(); kick();
    };
    const leave = () => { pointer = null; last = null; lastMove = performance.now(); };
    window.addEventListener('pointermove', move, { passive: true }); document.addEventListener('pointerleave', leave);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }); io.observe(box);
    const ro = new ResizeObserver(fit);
    // the sketch is a big image: fetch it only when the painting is within about a screen of view
    const pre = new IntersectionObserver(([e]) => { if (e.isIntersecting) { img.src = sketch; pre.disconnect(); } }, { rootMargin: '900px' }); pre.observe(box);
    img.onload = () => { if (gone) return; fit(); ro.observe(box); box.dataset.ready = '1'; kick(); };
    // once the painting leaves the page (say, logging in moves on to the editor) nothing may start the brush again
    return () => { gone = true; visible = false; img.onload = null; cancelAnimationFrame(raf); pre.disconnect(); io.disconnect(); ro.disconnect(); window.removeEventListener('pointermove', move); document.removeEventListener('pointerleave', leave); };
  }, [sketch, focus]);

  return (
    <div ref={wrap} className={className} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy" />
      <canvas ref={ref} />
    </div>
  );
}
