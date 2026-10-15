// A full-bleed painting from the Posy world that is quietly alive: each scene adds its own small motions on top of
// the picture (sunbeam dust, a lamp's glow, a cloud's shadow), placed in the picture's own
// coordinates so they stay on the right spot however the painting is cropped. CSS only, so it works without JS.
import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import './scene.css';

export type Scene = 'signup' | 'login' | 'lost';
const ALT: Record<Scene, string> = {
  signup: 'A sunny bedroom in the morning, a calico cat stretching on the desk by the laptop',
  login: 'The same bedroom late at night, the cat asleep by the desk lamp',
  lost: 'A paper kite caught high in a tree on a summer hill, a calico cat looking up at it',
};

const at = (x: number, y: number, extra: CSSProperties = {}) => ({ left: `${x}%`, top: `${y}%`, ...extra }) as CSSProperties;

export function PaintedScene({ scene, focus = '50% 50%', className }: { scene: Scene; focus?: string; className?: string }) {
  return (
    <div className={cn('ps', `ps-${scene}`, className)} style={{ '--focus': focus } as CSSProperties}>
      <div className="ps-pic">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/art/${scene}.jpg`} srcSet={`/art/${scene}-sm.jpg 768w, /art/${scene}.jpg 1536w`} sizes="100vw" alt={ALT[scene]} />
        {scene === 'signup' && <>
          <span className="ps-beam" aria-hidden />
          {Array.from({ length: 18 }, (_, i) => <i key={i} className="ps-mote" style={at(8 + ((i * 37) % 44), 6 + ((i * 53) % 48), { animationDelay: `${-i * 1.3}s`, animationDuration: `${9 + (i % 5) * 2}s` })} aria-hidden />)}
        </>}
        {scene === 'login' && <>
          <span className="ps-glow" style={at(78.7, 52)} aria-hidden />
          <span className="ps-screen" style={at(57.5, 61, { width: '11%', height: '13%' })} aria-hidden />
          {/* the cat wakes up when you start typing */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ps-awake" src="/art/login-cat-awake.webp" alt="" style={at(75, 56.25, { width: '25%' })} />
        </>}
        {scene === 'lost' && <>
          <span className="ps-shade" aria-hidden />
          <span className="ps-sway" aria-hidden />
        </>}
      </div>
    </div>
  );
}
