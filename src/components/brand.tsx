import { cn } from '@/lib/utils';

/** Posy mark: four soft petals around a centre. */
export function PosyMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-7', className)} aria-hidden>
      <circle cx="16" cy="9.2" r="6.8" fill="#f6b8a0" />
      <circle cx="22.8" cy="16" r="6.8" fill="#c9b8ee" />
      <circle cx="16" cy="22.8" r="6.8" fill="#a9dcc4" />
      <circle cx="9.2" cy="16" r="6.8" fill="#f7d98f" />
      <circle cx="16" cy="16" r="4.2" fill="#2b2621" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-[19px] font-semibold tracking-[-0.03em]', className)}>
      <PosyMark />Posy
    </span>
  );
}
