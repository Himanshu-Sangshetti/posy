'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Plus, Palette, Monitor, Smartphone, Undo2, Redo2, Send, Type, Heading, ImagePlus, Link2, Copy, ArrowUpRight, Check, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { Page, Tile } from '@/lib/schema';
import { newId } from '@/lib/schema';
import { THEMES, type ThemeId } from '@/lib/themes';
import { tileFromInput } from '@/lib/detect';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useStudio, undo, redo } from './store';
import { storeImage } from './storage';
import { ThemePanel } from './ThemePanel';

export type Device = 'desktop' | 'mobile';
export type SaveState = 'saved' | 'saving' | 'error';

function DockButton({ label, children, active, ...rest }: { label: string; active?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={label} {...rest}
          className={cn('grid size-11 place-items-center rounded-[14px] text-[var(--text)] transition-all hover:bg-[var(--secondary)] active:scale-95 disabled:opacity-35', active && 'bg-[var(--secondary)]', rest.className)}>
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>{label}</TooltipContent>
    </Tooltip>
  );
}

/* ---------- Add ---------- */
export function useAddTile(onAdded?: (t: Tile) => void) {
  const addTile = useStudio(s => s.addTile);
  return (tile: Tile) => {
    const after = useStudio.getState().selected;
    addTile(tile, after);
    useStudio.getState().select(tile.id);
    onAdded?.(tile);
    requestAnimationFrame(() => document.querySelector(`[data-tile="${tile.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };
}

function AddPanel({ add, close }: { add: (t: Tile) => void; close: () => void }) {
  const [value, setValue] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const quick = (t: Tile) => { add(t); close(); };
  const submit = () => { if (!value.trim()) return; add(tileFromInput(value)); setValue(''); close(); };
  return (
    <div className="grid gap-3">
      <Input autoFocus value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="Paste a link, an email, or write a note" className="h-11 text-[15px]" />
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: 'Note', icon: Type, run: () => quick({ id: newId(), type: 'text', text: 'Write something', size: 'w', color: 'auto' }) },
          { label: 'Section', icon: Heading, run: () => quick({ id: newId(), type: 'heading', text: 'New section', size: 's', color: 'auto' }) },
          { label: 'Image', icon: ImagePlus, run: () => file.current?.click() },
          { label: 'Link', icon: Link2, run: () => quick({ id: newId(), type: 'link', url: 'https://example.com', title: 'My link', size: 's', color: 'auto' }) },
        ].map(({ label, icon: Icon, run }) => (
          <button key={label} type="button" onClick={run} className="grid place-items-center gap-1.5 rounded-[12px] py-3 text-[12.5px] text-[var(--muted)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--text)]">
            <Icon className="size-[18px]" />{label}
          </button>
        ))}
      </div>
      <input ref={file} type="file" accept="image/*" className="hidden" onChange={async e => {
        const f = e.target.files?.[0]; if (!f) return;
        try { quick({ id: newId(), type: 'image', src: await storeImage(f), alt: '', size: 's', color: 'auto' }); } catch (err) { toast.error((err as Error).message); }
        e.target.value = '';
      }} />
    </div>
  );
}

/* ---------- Share ---------- */
function SharePanel({ page, url }: { page: Page; url: string }) {
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const t = THEMES[page.theme.preset as ThemeId];
    QRCode.toDataURL(url, { margin: 1, width: 420, color: { dark: t.text, light: t.surface } }).then(setQr).catch(() => setQr(''));
  }, [url, page.theme.preset]);
  return (
    <div className="grid gap-5">
      <div className="flex gap-2">
        <Input readOnly value={url} onFocus={e => e.currentTarget.select()} />
        <button type="button" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-[var(--line)] hover:bg-[var(--secondary)]" aria-label="Copy link">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
      </div>
      {qr && (
        <div className="grid place-items-center gap-3 rounded-[18px] bg-[var(--secondary)] p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR code for your page" className="size-44 rounded-[12px]" />
          <a href={qr} download="posy-qr.png" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--muted)] hover:text-[var(--text)]"><Download className="size-3.5" />Download QR code</a>
        </div>
      )}
      <a href={url} target="_blank" rel="noopener" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[12px] bg-[var(--text)] text-[14px] font-medium text-[var(--surface)] hover:opacity-90">Open my page<ArrowUpRight className="size-4" /></a>
    </div>
  );
}

/* ---------- Dock ---------- */
export function Dock({ page, device, setDevice, add, url }: { page: Page; device: Device; setDevice: (d: Device) => void; add: (t: Tile) => void; url: string }) {
  const [addOpen, setAddOpen] = useState(false);
  const { pastStates, futureStates } = useStudio.temporal.getState();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-3" onClick={e => e.stopPropagation()}>
      <div className="pointer-events-auto flex items-center gap-1 rounded-[20px] border border-[var(--line)] bg-[color-mix(in_oklab,var(--surface)_88%,transparent)] p-1.5 shadow-[0_18px_50px_-18px_rgb(0_0_0/.35)] backdrop-blur-xl">
        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <button type="button" className="inline-flex h-11 items-center gap-2 rounded-[14px] bg-[var(--text)] px-4 text-[14.5px] font-medium text-[var(--surface)] transition-transform active:scale-95">
              <Plus className="size-[18px]" />Add
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" sideOffset={14} className="w-[340px] p-3"><AddPanel add={add} close={() => setAddOpen(false)} /></PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild><button type="button" aria-label="Design" className="grid size-11 place-items-center rounded-[14px] transition-colors hover:bg-[var(--secondary)]"><Palette className="size-5" /></button></PopoverTrigger>
          <PopoverContent side="top" sideOffset={14} className="w-[400px] max-w-[calc(100vw-24px)] p-3.5"><ThemePanel page={page} /></PopoverContent>
        </Popover>
        <span className="mx-1 h-6 w-px bg-[var(--line)]" />
        <DockButton label="Desktop" active={device === 'desktop'} onClick={() => setDevice('desktop')}><Monitor className="size-5" /></DockButton>
        <DockButton label="Mobile" active={device === 'mobile'} onClick={() => setDevice('mobile')}><Smartphone className="size-5" /></DockButton>
        <span className="mx-1 h-6 w-px bg-[var(--line)]" />
        <DockButton label="Undo (⌘Z)" onClick={undo} disabled={!pastStates.length}><Undo2 className="size-5" /></DockButton>
        <DockButton label="Redo (⇧⌘Z)" onClick={redo} disabled={!futureStates.length}><Redo2 className="size-5" /></DockButton>
        <Dialog>
          <DialogTrigger asChild>
            <button type="button" className="ml-1 inline-flex h-11 items-center gap-2 rounded-[14px] px-3.5 text-[14.5px] font-medium transition-colors hover:bg-[var(--secondary)]"><Send className="size-[18px]" />Share</button>
          </DialogTrigger>
          <DialogContent className="max-w-[400px] rounded-[22px]">
            <DialogHeader><DialogTitle>Share your page</DialogTitle><DialogDescription>Visitors see the last published version.</DialogDescription></DialogHeader>
            <SharePanel page={page} url={url} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
