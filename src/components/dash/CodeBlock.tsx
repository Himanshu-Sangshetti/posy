'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Terminal } from '@/components/ui/terminal';

/** A copyable snippet in a terminal frame. */
export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="group relative">
      <Terminal sequence={false} className="ac-term">
        <span className="ac-tl select-none pb-1">{label ?? 'Terminal'}</span>
        <span className="block overflow-x-auto whitespace-pre pr-10 text-[13px]">{code}</span>
      </Terminal>
      <button type="button" aria-label="Copy" onClick={async () => { await navigator.clipboard.writeText(code); setDone(true); toast.success('Copied to clipboard'); setTimeout(() => setDone(false), 1400); }}
        className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/10 text-white/70 outline-none transition-colors hover:bg-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--ac-lilac)]">
        {done ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}
