import { cn } from '@/lib/utils';

/** Posy mark: the calico cat curled up asleep, from the painted Posy world. Vector, three colours (public/brand). */
export function PosyMark({ className }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/posy-cat.svg" alt="" aria-hidden width={24} height={24} className={cn('size-6 shrink-0', className)} draggable={false} />;
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-[family-name:var(--font-serif)] text-[27px] leading-none tracking-[-0.02em]', className)}>
      <PosyMark className="size-[28px]" />posy
    </span>
  );
}
