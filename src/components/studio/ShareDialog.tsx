'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ArrowUpRight, Check, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CHROME } from './chrome';

export function ShareDialog({ open, onOpenChange, url, live }: { open: boolean; onOpenChange: (o: boolean) => void; url: string; live: boolean }) {
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(url, { margin: 1, width: 480, color: { dark: '#241f2e', light: '#fffdfa' } }).then(setQr).catch(() => setQr(''));
  }, [open, url]);
  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true); toast.success('Link copied'); setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={e => e.preventDefault()} className={cn(CHROME, 'sc-pop max-w-[420px] gap-5 rounded-[22px] border-[var(--line)] bg-[var(--surface)] p-6')}>
        <DialogHeader className="gap-1.5 text-left">
          <p className="sc-eyebrow">Share</p>
          <DialogTitle className="sc-title text-[28px] font-normal leading-none">Share your page</DialogTitle>
          <DialogDescription className="text-[13.5px] text-[var(--muted)]">
            {live ? 'Visitors see the last published version.' : 'Visitors see the last published version. You have changes that are not published yet.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input readOnly value={url} aria-label="Page link" onFocus={e => e.currentTarget.select()} className="sc-mono h-10 rounded-[10px] border-[var(--line)] bg-[var(--bg)] text-[12.5px]" />
          <Button type="button" variant="outline" size="icon-lg" onClick={copy} aria-label="Copy page link" className="size-10 shrink-0 rounded-[10px] border-[var(--line)] bg-[var(--surface)] shadow-none hover:bg-[var(--secondary)]">
            {copied ? <Check className="size-4 text-[var(--sc-deep)]" /> : <Copy className="size-4" />}
          </Button>
        </div>
        <div className="grid place-items-center gap-3 rounded-[18px] p-5" style={{ background: 'linear-gradient(135deg, var(--tint-lilac), var(--tint-rose) 55%, var(--tint-peach))' }}>
          <div className="grid size-48 place-items-center rounded-[16px] bg-[var(--surface)] p-2.5 shadow-[0_10px_30px_-14px_rgb(60_40_90/.4)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {qr ? <img src={qr} alt="QR code for your page" className="size-full" /> : <div className="size-full animate-pulse rounded-[10px] bg-[var(--secondary)]" />}
          </div>
          {qr && <a href={qr} download="posy-qr.png" className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--text)]/80 transition-colors hover:text-[var(--text)]"><Download className="size-3.5" />Download QR code</a>}
        </div>
        <Button asChild className="h-10 rounded-[10px] bg-[var(--text)] text-[14px] text-[var(--surface)] hover:bg-[#3a3248]">
          <a href={url} target="_blank" rel="noopener">Open my page<ArrowUpRight className="size-4" /></a>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
