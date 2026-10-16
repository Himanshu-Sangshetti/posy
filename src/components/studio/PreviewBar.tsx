'use client';
// Shown while someone tries a look, palette or font their plan doesn't include. The editor shows it on their own page,
// so they can feel it; nothing is saved, and the published page stays as it was.
import { useStudio } from './store';
import { CHROME } from './chrome';
import { cn } from '@/lib/utils';

export function PreviewBar({ look, styleOnly, back, upgrade }: { look: string; styleOnly: boolean; back?: string; upgrade?: string }) {
  const setPreview = useStudio(s => s.setPreview);
  return (
    <div role="status" onClick={e => e.stopPropagation()}
      className={cn(CHROME, 'fixed inset-x-3 top-[68px] z-40 mx-auto flex max-w-[640px] flex-wrap items-center gap-x-4 gap-y-2 rounded-[16px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[14px] shadow-[0_18px_40px_-22px_rgb(22_20_15/.45)]')}>
      <p className="min-w-0 flex-1 leading-snug">
        <span className="font-medium">{styleOnly ? `Trying ${look}.` : 'Trying Pro colours and type.'}</span>{' '}
        <span className="text-[var(--muted)]">It comes with Posy Pro. Your page stays as it is until you upgrade.</span>
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={() => setPreview(null)} className="h-9 rounded-[10px] px-3 text-[13.5px] text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--text)]">
          {styleOnly && back ? `Back to ${back}` : 'Back'}
        </button>
        {upgrade && <a href={upgrade} className="inline-flex h-9 items-center rounded-[10px] bg-[#e4572e] px-3.5 text-[13.5px] font-medium text-white hover:bg-[#cf4a24]">Get Pro</a>}
      </div>
    </div>
  );
}
