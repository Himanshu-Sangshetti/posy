'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Plus, Palette, Monitor, Smartphone, Undo2, Redo2, Send, Type, Heading, ImagePlus, Link2, Copy, Download, ArrowUpRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { Page, Tile } from '@/lib/schema';
import { FONTS, RADII, LAYOUTS, newId } from '@/lib/schema';
import { THEMES, THEME_IDS, type ThemeId } from '@/lib/themes';
import { FONT_VARS } from '@/lib/style';
import { tileFromInput } from '@/lib/detect';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { cn, BASE } from '@/lib/utils';
import { useStudio, undo, redo } from './store';
import { storeImage, type Mode } from './storage';

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="grid gap-2.5"><p className="text-[12.5px] font-medium text-[var(--muted)]">{title}</p>{children}</div>;
}

/* ---------- Add ---------- */
export function useAddTile(mode: Mode, onAdded?: (t: Tile) => void) {
  const addTile = useStudio(s => s.addTile);
  return (tile: Tile) => {
    const after = useStudio.getState().selected;
    addTile(tile, after);
    useStudio.getState().select(tile.id);
    onAdded?.(tile);
    requestAnimationFrame(() => document.querySelector(`[data-tile="${tile.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };
}

function AddPanel({ mode, add, close }: { mode: Mode; add: (t: Tile) => void; close: () => void }) {
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
        try { quick({ id: newId(), type: 'image', src: await storeImage(mode, f), alt: '', size: 's', color: 'auto' }); } catch (err) { toast.error((err as Error).message); }
        e.target.value = '';
      }} />
    </div>
  );
}

/* ---------- Theme ---------- */
const ACCENTS = ['#e39b6f', '#e8886a', '#d97a9a', '#9a86d8', '#5e9bd6', '#5fb08a', '#c9a227', '#161616'];
const RADIUS_GLYPH: Record<(typeof RADII)[number], string> = { sharp: '4px', soft: '8px', round: '13px' };

function ThemePanel({ page }: { page: Page }) {
  const { updateTheme, setBadge } = useStudio();
  const t = page.theme;
  return (
    <div className="grid max-h-[70vh] gap-5 overflow-y-auto pr-1">
      <Section title="Theme">
        <div className="grid grid-cols-4 gap-2">
          {THEME_IDS.map(id => {
            const th = THEMES[id];
            return (
              <button key={id} type="button" onClick={() => updateTheme({ preset: id, accent: undefined })} aria-pressed={t.preset === id}
                className="group grid gap-1.5 text-center text-[12px] text-[var(--muted)]">
                <span className={cn('relative grid h-14 place-items-center overflow-hidden rounded-[14px] border transition-transform group-hover:scale-[1.04]', t.preset === id ? 'border-[var(--text)] ring-1 ring-[var(--text)]' : 'border-[var(--line)]')} style={{ background: th.bg }}>
                  <span className="flex gap-1">{(['peach', 'mint', 'lilac'] as const).map(k => <span key={k} className="size-3.5 rounded-full" style={{ background: th.tints[k], boxShadow: `inset 0 0 0 1px ${th.line}` }} />)}</span>
                </span>
                {th.name}
              </button>
            );
          })}
        </div>
      </Section>
      <Section title="Accent">
        <div className="flex flex-wrap items-center gap-2">
          {ACCENTS.map(c => (
            <button key={c} type="button" aria-label={c} onClick={() => updateTheme({ accent: c })}
              className={cn('size-7 rounded-full transition-transform hover:scale-110', (t.accent ?? THEMES[t.preset as ThemeId].accent) === c && 'ring-2 ring-[var(--text)] ring-offset-2 ring-offset-[var(--surface)]')} style={{ background: c }} />
          ))}
          <label className="relative size-7 cursor-pointer overflow-hidden rounded-full border border-[var(--line)]" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }} aria-label="Custom accent">
            <input type="color" value={t.accent ?? THEMES[t.preset as ThemeId].accent} onChange={e => updateTheme({ accent: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" />
          </label>
        </div>
      </Section>
      <Section title="Font">
        <div className="grid grid-cols-4 gap-2">
          {FONTS.map(f => (
            <button key={f} type="button" onClick={() => updateTheme({ font: f })} aria-pressed={t.font === f}
              className={cn('grid gap-0.5 rounded-[12px] border py-2.5 text-center transition-colors', t.font === f ? 'border-[var(--text)] bg-[var(--secondary)]' : 'border-[var(--line)] hover:bg-[var(--secondary)]')}
              style={FONT_VARS[f] as React.CSSProperties}>
              <span className="posy-head text-[22px] leading-none">Aa</span>
              <span className="text-[11.5px] capitalize text-[var(--muted)]">{f}</span>
            </button>
          ))}
        </div>
      </Section>
      <div className="grid grid-cols-2 gap-4">
        <Section title="Corners">
          <div className="flex gap-1.5">
            {RADII.map(r => (
              <button key={r} type="button" aria-label={r} onClick={() => updateTheme({ radius: r })} aria-pressed={t.radius === r}
                className={cn('grid size-10 place-items-center rounded-[11px] border transition-colors', t.radius === r ? 'border-[var(--text)] bg-[var(--secondary)]' : 'border-[var(--line)] hover:bg-[var(--secondary)]')}>
                <span className="size-5 border-l-2 border-t-2 border-current" style={{ borderTopLeftRadius: RADIUS_GLYPH[r] }} />
              </button>
            ))}
          </div>
        </Section>
        <Section title="Layout">
          <div className="flex gap-1.5">
            {LAYOUTS.map(l => (
              <button key={l} type="button" onClick={() => updateTheme({ layout: l })} aria-pressed={t.layout === l}
                className={cn('h-10 flex-1 rounded-[11px] border text-[13px] capitalize transition-colors', t.layout === l ? 'border-[var(--text)] bg-[var(--secondary)]' : 'border-[var(--line)] hover:bg-[var(--secondary)]')}>
                {l === 'split' ? 'Side' : 'Centre'}
              </button>
            ))}
          </div>
        </Section>
      </div>
      <div className="grid gap-3 border-t border-[var(--line)] pt-4">
        <label className="flex items-center justify-between text-[14px]">Animations <Switch checked={t.motion} onCheckedChange={v => updateTheme({ motion: v })} /></label>
        <label className="flex items-center justify-between text-[14px]">“Made with Posy” link <Switch checked={page.badge} onCheckedChange={setBadge} /></label>
      </div>
    </div>
  );
}

/* ---------- Share ---------- */
function SharePanel({ page, mode }: { page: Page; mode: Mode }) {
  const updateSeo = useStudio(s => s.updateSeo);
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const url = page.seo.url || '';
  useEffect(() => {
    if (!url) { setQr(''); return; }
    const t = THEMES[page.theme.preset as ThemeId];
    QRCode.toDataURL(url, { margin: 1, width: 360, color: { dark: t.text, light: t.surface } }).then(setQr).catch(() => setQr(''));
  }, [url, page.theme.preset]);
  const json = () => JSON.stringify({ $schema: '../schema/page.schema.json', ...page }, null, 2) + '\n';
  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <p className="text-[13px] font-medium text-[var(--muted)]">Your page's address</p>
        <div className="flex gap-2">
          <Input value={url} placeholder="https://yourname.com" onChange={e => updateSeo({ url: e.target.value || undefined })} />
          <button type="button" disabled={!url} onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-[var(--line)] hover:bg-[var(--secondary)] disabled:opacity-40" aria-label="Copy link">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </button>
        </div>
      </div>
      {qr && (
        <div className="grid place-items-center gap-2 rounded-[18px] bg-[var(--secondary)] p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR code for your page" className="size-40 rounded-[12px]" />
          <a href={qr} download="posy-qr.png" className="text-[13px] text-[var(--muted)] underline-offset-4 hover:underline">Download QR code</a>
        </div>
      )}
      <div className="grid gap-2">
        <p className="text-[13px] font-medium text-[var(--muted)]">Publish</p>
        {mode === 'file' ? (
          <p className="text-[14px] leading-relaxed">
            Everything is saved to <code className="rounded bg-[var(--secondary)] px-1.5 py-0.5 text-[12.5px]">content/page.json</code>. Push to GitHub and the included workflow publishes it to GitHub Pages, or run <code className="rounded bg-[var(--secondary)] px-1.5 py-0.5 text-[12.5px]">npm run build</code> and upload the <code className="rounded bg-[var(--secondary)] px-1.5 py-0.5 text-[12.5px]">out</code> folder anywhere.
          </p>
        ) : (
          <p className="text-[14px] leading-relaxed">Download your page and drop it into a copy of the Posy repo as <code className="rounded bg-[var(--secondary)] px-1.5 py-0.5 text-[12.5px]">content/page.json</code>. It deploys free on GitHub Pages or Vercel.</p>
        )}
        <div className="mt-1 flex flex-wrap gap-2">
          <button type="button" onClick={() => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json()], { type: 'application/json' })); a.download = 'page.json'; a.click(); }}
            className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-[var(--text)] px-3.5 text-[13.5px] font-medium text-[var(--surface)] transition-opacity hover:opacity-90"><Download className="size-4" />Download page.json</button>
          <button type="button" onClick={async () => { await navigator.clipboard.writeText(json()); toast('Copied page.json'); }}
            className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[var(--line)] px-3.5 text-[13.5px] font-medium hover:bg-[var(--secondary)]"><Copy className="size-4" />Copy JSON</button>
          {mode === 'file' && <a href={`${BASE}/`} target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[var(--line)] px-3.5 text-[13.5px] font-medium hover:bg-[var(--secondary)]">View page<ArrowUpRight className="size-4" /></a>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Dock ---------- */
export function Dock({ page, mode, device, setDevice, save, add }: { page: Page; mode: Mode; device: Device; setDevice: (d: Device) => void; save: SaveState; add: (t: Tile) => void }) {
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
          <PopoverContent side="top" sideOffset={14} className="w-[340px] p-3"><AddPanel mode={mode} add={add} close={() => setAddOpen(false)} /></PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild><button type="button" aria-label="Theme" className="grid size-11 place-items-center rounded-[14px] transition-colors hover:bg-[var(--secondary)]"><Palette className="size-5" /></button></PopoverTrigger>
          <PopoverContent side="top" sideOffset={14} className="w-[360px] p-4"><ThemePanel page={page} /></PopoverContent>
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
          <DialogContent className="max-w-[420px] rounded-[22px]">
            <DialogHeader><DialogTitle>Share your page</DialogTitle><DialogDescription>{save === 'saved' ? 'All changes saved.' : save === 'saving' ? 'Saving…' : 'Last save failed.'}</DialogDescription></DialogHeader>
            <SharePanel page={page} mode={mode} />
          </DialogContent>
        </Dialog>
        <span className={cn('ml-1 mr-2 size-2 rounded-full transition-colors', save === 'saved' ? 'bg-[#6fcf97]' : save === 'saving' ? 'bg-[var(--accent)]' : 'bg-[#e5534b]')} title={save === 'saved' ? 'Saved' : save === 'saving' ? 'Saving' : 'Save failed'} aria-label={save === 'saved' ? 'Saved' : save === 'saving' ? 'Saving' : 'Save failed'} role="status" />
      </div>
    </div>
  );
}
