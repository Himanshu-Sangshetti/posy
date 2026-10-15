// When a page is published, a paper kite lifts off the Publish button and flies up out of the window,
// swaying on the way, its string trailing. A small moment to mark it. Nothing happens with reduced motion.
export function launchKite(from?: Element | null) {
  if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = from?.getBoundingClientRect() ?? { left: window.innerWidth - 120, top: 20, width: 80, height: 36 };
  const x0 = r.left + r.width / 2, y0 = r.top + r.height / 2;
  const wrap = document.createElement('div');
  wrap.setAttribute('aria-hidden', 'true');
  Object.assign(wrap.style, { position: 'fixed', inset: '0', zIndex: '9999', pointerEvents: 'none', overflow: 'hidden' });
  const kite = document.createElement('img');
  kite.src = '/art/kite.png';
  Object.assign(kite.style, { position: 'absolute', left: '0', top: '0', width: '84px', filter: 'drop-shadow(0 10px 12px rgb(20 40 100 / .3))', transformOrigin: '28% 32%' });
  wrap.append(kite); document.body.append(wrap);
  // a curved path: out of the button, a swoop left toward the middle of the screen, then up and away
  const W = window.innerWidth, H = window.innerHeight;
  const pts = [[x0, y0, 0.2, 0], [x0 - W * 0.12, y0 + H * 0.25, 0.9, -12], [W * 0.5, H * 0.42, 1.25, 10], [W * 0.38, H * 0.18, 1.05, -16], [W * 0.55, -H * 0.3, 0.7, 20]];
  kite.animate(pts.map(([x, y, s, r]) => ({ transform: `translate(${x - 24}px, ${y - 30}px) scale(${s}) rotate(${r}deg)` })), { duration: 3400, easing: 'cubic-bezier(.3,.1,.3,1)', fill: 'forwards' })
    .finished.then(() => wrap.remove(), () => wrap.remove());
}
