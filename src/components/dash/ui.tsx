import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AppBody } from './AppBody';

/** Page frame for auth, onboarding and the dashboard. */
export function AppFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('posy-page posy-app ac-root', className)}>
      <AppBody />
      <div aria-hidden className="ac-mesh" />
      {children}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('ac-eyebrow', className)}>{children}</p>;
}

export function PageHead({ eyebrow, title, lede, actions }: { eyebrow?: string; title: ReactNode; lede?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="ac-rise flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
      <div className="min-w-0">
        {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
        <h1 className="ac-display ac-h1 max-w-[20ch]">{title}</h1>
        {lede && <p className="ac-lede mt-3">{lede}</p>}
      </div>
      {actions}
    </header>
  );
}

/** A titled card: mono eyebrow, serif title, optional description and header action. */
export function Panel({ eyebrow, title, desc, action, children, className, tone, art }: {
  /** A painting across the top of the card. */
  art?: string;
  eyebrow?: string; title: ReactNode; desc?: ReactNode; action?: ReactNode; children?: ReactNode; className?: string; tone?: 'rose' | 'lilac' | 'mint' | 'butter' | 'sky' | 'peach';
}) {
  return (
    <section className={cn('ac-card ac-card-pad ac-rise min-w-0', art && 'overflow-hidden', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {art && <img src={art} alt="" className="-mx-[22px] -mt-[22px] mb-6 aspect-[16/7] w-[calc(100%+44px)] max-w-none object-cover sm:-mx-[28px] sm:-mt-[28px] sm:w-[calc(100%+56px)]" />}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <Eyebrow className="mb-2.5">{eyebrow}</Eyebrow>}
          <h2 className="ac-display ac-h2">{title}</h2>
          {desc && <p className="mt-1.5 max-w-[60ch] text-[14.5px] leading-relaxed text-[var(--muted)]">{desc}</p>}
        </div>
        {action}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </section>
  );
}
