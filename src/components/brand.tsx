import { cn } from '@/lib/utils';

/** Posy mark: a six-petal flower drawn like a typed asterisk, in vermilion. */
export function PosyMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-6', className)} aria-hidden>
      <g stroke="#e4572e" strokeWidth="5.2" strokeLinecap="round">
        <path d="M16 5.5v21" /><path d="M6.9 10.75l18.2 10.5" /><path d="M6.9 21.25l18.2-10.5" />
      </g>
      <circle cx="16" cy="16" r="2.6" fill="#16140f" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 font-[family-name:var(--font-serif)] text-[27px] leading-none tracking-[-0.02em]', className)}>
      <PosyMark className="size-[22px] translate-y-[1px]" />posy
    </span>
  );
}
