'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="group relative overflow-hidden rounded-[16px] bg-[#1d1a17] text-[#f3ece4]">
      {label && <div className="border-b border-white/10 px-4 py-2 text-[12.5px] text-white/50">{label}</div>}
      <pre className="overflow-x-auto px-4 py-3.5 pr-14 text-[13px] leading-relaxed"><code>{code}</code></pre>
      <button type="button" aria-label="Copy" onClick={async () => { await navigator.clipboard.writeText(code); setDone(true); setTimeout(() => setDone(false), 1400); }}
        className="absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-[9px] bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white">
        {done ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}
