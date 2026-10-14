'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

/** The page's address with a copy button, for nudging people to share it. */
export function CopyLink({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  const shown = url.replace(/^https?:\/\//, '');
  return (
    <div className="flex flex-wrap items-center gap-3">
      <a href={url} target="_blank" rel="noreferrer" className="ac-display min-w-0 truncate rounded text-[26px] underline decoration-[var(--ac-lilac)] decoration-2 underline-offset-[6px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] sm:text-[30px]">{shown}</a>
      <Button type="button" className="ac-btn ac-btn-primary" onClick={async () => { await navigator.clipboard.writeText(url); setDone(true); toast.success('Link copied'); setTimeout(() => setDone(false), 1600); }}>
        {done ? <Check className="size-4" /> : <Copy className="size-4" />}
        <span aria-live="polite">{done ? 'Copied' : 'Copy link'}</span>
      </Button>
    </div>
  );
}
