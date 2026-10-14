'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

/** The page's address with a copy button, for nudging people to share it. */
export function CopyLink({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  const shown = url.replace(/^https?:\/\//, '');
  return (
    <div className="flex flex-wrap items-center gap-3">
      <a href={url} target="_blank" rel="noreferrer" className="min-w-0 truncate font-[family-name:var(--font-serif)] text-[28px] leading-tight underline decoration-[color-mix(in_oklab,var(--accent)_45%,transparent)] decoration-2 underline-offset-[6px] sm:text-[32px]">{shown}</a>
      <button type="button" className="app-btn" onClick={async () => { await navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 1600); }}>
        {done ? <Check className="size-4" /> : <Copy className="size-4" />}
        <span aria-live="polite">{done ? 'Copied' : 'Copy link'}</span>
      </button>
    </div>
  );
}
