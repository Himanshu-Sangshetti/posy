'use client';

import { useRef, useState } from 'react';
import { Pencil, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import type { Tile, Size, Color } from '@/lib/schema';
import { COLORS } from '@/lib/schema';
import { PLATFORMS, PLATFORM_IDS } from '@/lib/platforms';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useStudio } from './store';
import { storeImage, type Mode } from './storage';

const SIZE_LABEL: Record<Size, string> = { s: 'Small', w: 'Wide', t: 'Tall', l: 'Large' };

function SizeGlyph({ size }: { size: Size }) {
  const dims = { s: [8, 8], w: [16, 8], t: [8, 16], l: [16, 16] }[size];
  return <span className="block rounded-[3px] border-[1.5px] border-current" style={{ width: dims[0], height: dims[1] }} />;
}

export function swatch(c: Color): string {
  if (c === 'auto') return 'conic-gradient(var(--tint-peach), var(--tint-butter), var(--tint-mint), var(--tint-sky), var(--tint-lilac), var(--tint-rose), var(--tint-peach))';
  if (c === 'surface') return 'var(--surface)';
  if (c === 'accent') return 'color-mix(in oklab, var(--accent) 22%, var(--surface))';
  return `var(--tint-${c})`;
}

function ToolButton({ label, active, onClick, children }: { label: string; active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" onClick={onClick} aria-label={label} aria-pressed={active}
          className={cn('grid size-8 place-items-center rounded-[10px] text-[var(--muted)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--text)]', active && 'bg-[var(--text)] text-[var(--surface)] hover:bg-[var(--text)] hover:text-[var(--surface)]')}>
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

/** Floating toolbar above the selected tile. */
export function TileToolbar({ tile, mode }: { tile: Tile; mode: Mode }) {
  const { updateTile, removeTile } = useStudio();
  const sizes: Size[] = tile.type === 'music' ? ['s', 'w', 'l'] : ['s', 'w', 't', 'l'];
  return (
    <div
      data-toolbar
      onPointerDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
      className="absolute left-1/2 top-0 z-30 flex -translate-x-1/2 -translate-y-[calc(100%+10px)] items-center gap-0.5 rounded-[14px] border border-[var(--line)] bg-[color-mix(in_oklab,var(--surface)_92%,transparent)] p-1 shadow-[0_12px_32px_-12px_rgb(0_0_0/.28)] backdrop-blur-md"
    >
      {tile.type !== 'heading' && sizes.map(s => (
        <ToolButton key={s} label={SIZE_LABEL[s]} active={tile.size === s} onClick={() => updateTile(tile.id, { size: s })}><SizeGlyph size={s} /></ToolButton>
      ))}
      {tile.type !== 'heading' && <span className="mx-1 h-5 w-px bg-[var(--line)]" />}
      {tile.type !== 'heading' && (
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" aria-label="Colour" className="grid size-8 place-items-center rounded-[10px] hover:bg-[var(--secondary)]">
              <span className="size-[18px] rounded-full border border-[var(--line)]" style={{ background: swatch(tile.color) }} />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-auto p-2">
            <div className="grid grid-cols-5 gap-1.5">
              {COLORS.map(c => (
                <button key={c} type="button" aria-label={c} onClick={() => updateTile(tile.id, { color: c })}
                  className={cn('size-8 rounded-full border border-[var(--line)] transition-transform hover:scale-110', tile.color === c && 'ring-2 ring-[var(--text)] ring-offset-2 ring-offset-[var(--surface)]')}
                  style={{ background: swatch(c) }} />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
      {tile.type !== 'text' && tile.type !== 'heading' && (
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" aria-label="Edit" className="grid size-8 place-items-center rounded-[10px] text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--text)]"><Pencil className="size-4" /></button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-80"><TileFields tile={tile} mode={mode} /></PopoverContent>
        </Popover>
      )}
      <ToolButton label="Delete" onClick={() => removeTile(tile.id)}><Trash2 className="size-4" /></ToolButton>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1.5"><Label className="text-[12.5px] font-medium text-[var(--muted)]">{label}</Label>{children}</div>;
}

export function ImagePicker({ mode, onPick, label = 'Upload image' }: { mode: Mode; onPick: (src: string) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={async e => {
        const f = e.target.files?.[0]; if (!f) return;
        setBusy(true);
        try { onPick(await storeImage(mode, f)); } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); e.target.value = ''; }
      }} />
      <button type="button" onClick={() => ref.current?.click()} disabled={busy}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] px-3 text-[13.5px] font-medium transition-colors hover:bg-[var(--secondary)] disabled:opacity-60">
        <Upload className="size-4" />{busy ? 'Uploading…' : label}
      </button>
    </>
  );
}

/** The edit form for one tile. */
export function TileFields({ tile, mode }: { tile: Tile; mode: Mode }) {
  const update = useStudio(s => s.updateTile);
  const set = (patch: Record<string, unknown>) => update(tile.id, patch as Partial<Tile>);
  const text = (key: string, value: string | undefined, label: string, placeholder?: string) => (
    <Field label={label}><Input value={value ?? ''} placeholder={placeholder} onChange={e => set({ [key]: e.target.value || undefined })} /></Field>
  );
  return (
    <div className="grid gap-3.5">
      {tile.type === 'link' && <>
        {text('url', tile.url, 'Link')}
        {text('title', tile.title, 'Title')}
        {text('description', tile.description, 'Description')}
        <Field label="Preview image"><div className="flex gap-2"><Input value={tile.image ?? ''} placeholder="https://…" onChange={e => set({ image: e.target.value || undefined })} /><ImagePicker mode={mode} label="Upload" onPick={src => set({ image: src })} /></div></Field>
      </>}
      {tile.type === 'social' && <>
        <Field label="Platform">
          <select value={tile.platform} onChange={e => set({ platform: e.target.value })}
            className="h-9 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] px-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[var(--ring)]">
            {PLATFORM_IDS.map(p => <option key={p} value={p}>{PLATFORMS[p].label}</option>)}
          </select>
        </Field>
        {text('handle', tile.handle, tile.platform === 'email' ? 'Email' : 'Username')}
        {text('url', tile.url, 'Custom link (optional)')}
      </>}
      {tile.type === 'image' && <>
        <Field label="Image"><div className="flex gap-2"><Input value={tile.src.startsWith('data:') ? 'Uploaded image' : tile.src} onChange={e => set({ src: e.target.value })} /><ImagePicker mode={mode} label="Replace" onPick={src => set({ src })} /></div></Field>
        {text('caption', tile.caption, 'Caption')}
        {text('alt', tile.alt, 'Description for screen readers')}
        {text('url', tile.url, 'Link (optional)')}
      </>}
      {tile.type === 'video' && <>{text('url', tile.url, 'YouTube link')}{text('title', tile.title, 'Title')}</>}
      {tile.type === 'music' && text('url', tile.url, 'Spotify link')}
      {tile.type === 'github' && text('repo', tile.repo, 'Repository', 'owner/name')}
    </div>
  );
}
