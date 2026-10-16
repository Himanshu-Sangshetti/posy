'use client';

// The only animation code that ships to visitors: LazyMotion with DOM features (~18 KB) instead of full Motion.
import { LazyMotion, MotionConfig } from 'motion/react';
import * as m from 'motion/react-m';

// Animation features load after the page is interactive, so they never block first paint.
const features = () => import('./motion-features').then(r => r.default);
import type { ReactNode } from 'react';
import { safeHref } from '@/lib/url';

export const spring = { type: 'spring', stiffness: 380, damping: 30, mass: 0.8 } as const;

export function MotionProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return (
    <LazyMotion features={features} strict>
      <MotionConfig reducedMotion={enabled ? 'user' : 'always'}>{children}</MotionConfig>
    </LazyMotion>
  );
}

type ShellProps = { href?: string | null; index: number; className?: string; style?: React.CSSProperties; label?: string; children?: ReactNode; lift?: boolean; tileId?: string };

export function MotionShell({ href: raw, index, className, style, label, children, lift = true, tileId }: ShellProps) {
  const href = safeHref(raw);
  // Entrance is CSS (.posy-rise) so tiles are visible even before any JavaScript runs.
  const anim = { className: `${className ?? ''} posy-rise`, style: { ...style, '--i': index } as React.CSSProperties, initial: false as const, 'data-tile-id': tileId };
  if (href) {
    const external = /^https?:/.test(href);
    return (
      <m.a href={href} aria-label={label} {...anim} whileHover={lift ? { y: -4, transition: spring } : undefined} whileTap={{ scale: 0.98 }} {...(external ? { target: '_blank', rel: 'noopener' } : {})}>
        {children}
      </m.a>
    );
  }
  return <m.div {...anim}>{children}</m.div>;
}

export function MotionHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <header className={`${className ?? ''} posy-rise`}>{children}</header>;
}
