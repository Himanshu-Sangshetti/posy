'use client';

import { useRef, useState } from 'react';
import { Pencil, Stamp, StickyNote, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import type { Tile, Size, Color } from '@/lib/schema';
import { COLORS } from '@/lib/schema';
import { PLATFORMS, PLATFORM_IDS } from '@/lib/platforms';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Toggle } from '@/components/ui/toggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CHROME } from './chrome';
import { cn } from '@/lib/utils';
import { useStudio } from './store';
import { storeImage } from './storage';

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

function ToolButton({ label, active, onClick, children, danger }: { label: string; active?: boolean; onClick?: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle pressed={!!active} onPressedChange={() => onClick?.()} aria-label={label} size="sm"
          className={cn('size-8 min-w-8 rounded-[9px] px-0 text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--text)] data-[state=on]:bg-[var(--sc-on)] data-[state=on]:text-[var(--sc-deep)]', danger && 'hover:bg-[#fbe3e8] hover:text-[#b83a52]')}>
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="top" className={CHROME}>{label}</TooltipContent>
    </Tooltip>
  );
}

const Divider = () => <span className="mx-1 h-5 w-px shrink-0 bg-[var(--line)]" />;
const popCls = cn(CHROME, 'sc-pop rounded-[16px] p-3');

/** Floating toolbar above the selected tile. */
export function TileToolbar({ tile }: { tile: Tile }) {
  const { updateTile, removeTile } = useStudio();
  const sizes: Size[] = tile.type === 'music' ? ['s', 'w', 'l'] : ['s', 'w', 't', 'l'];
  const style = useStudio(s => s.page?.theme.style ?? 'soft');
  const layout = useStudio(s => s.page?.theme.layout);
  const desk = style === 'cozy';
  const stamp = tile.type === 'text' && tile.look === 'stamp';
  const sticker = tile.type === 'social' && (style !== 'soft' || layout === 'list');
  const inlineText = tile.type === 'text' && !stamp && (style === 'soft' || style === 'cozy');
  const sized = tile.type !== 'heading' && !sticker;
  return (
    <div
      data-toolbar
      onPointerDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
      className={cn(CHROME, 'sc-float absolute left-1/2 top-0 z-30 flex -translate-x-1/2 -translate-y-[calc(100%+10px)] items-center gap-0.5 rounded-[13px] p-1')}
    >
      {sized && sizes.map(s => (
        <ToolButton key={s} label={SIZE_LABEL[s]} active={tile.size === s} onClick={() => updateTile(tile.id, { size: s })}><SizeGlyph size={s} /></ToolButton>
      ))}
      {sized && <Divider />}
      {sized && (
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button type="button" aria-label="Colour" className="grid size-8 place-items-center rounded-[9px] transition-colors hover:bg-[var(--secondary)]">
                  <span className="size-[18px] rounded-full border border-[var(--line)] shadow-[inset_0_0_0_1px_rgb(255_255_255/.5)]" style={{ background: swatch(tile.color) }} />
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" className={CHROME}>Colour</TooltipContent>
          </Tooltip>
          <PopoverContent side="top" className={cn(popCls, 'w-auto')}>
            <p className="sc-eyebrow mb-2">Tile colour</p>
            <div className="grid grid-cols-5 gap-1.5">
              {COLORS.map(c => (
                <button key={c} type="button" aria-label={c} onClick={() => updateTile(tile.id, { color: c })}
                  className={cn('size-8 rounded-full border border-[var(--line)] transition-transform hover:scale-110', tile.color === c && 'ring-2 ring-[var(--sc-deep)] ring-offset-2 ring-offset-[var(--surface)]')}
                  style={{ background: swatch(c) }} />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
      {desk && tile.type === 'text' && <>
        <ToolButton label="Sticky note" active={!stamp} onClick={() => updateTile(tile.id, { look: undefined } as Partial<Tile>)}><StickyNote className="size-4" /></ToolButton>
        <ToolButton label="Round stamp" active={stamp} onClick={() => updateTile(tile.id, { look: 'stamp' } as Partial<Tile>)}><Stamp className="size-4" /></ToolButton>
      </>}
      {!inlineText && tile.type !== 'heading' && (
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button type="button" aria-label="Edit" className="grid size-8 place-items-center rounded-[9px] text-[var(--muted)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--text)]"><Pencil className="size-4" /></button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" className={CHROME}>Edit</TooltipContent>
          </Tooltip>
          <PopoverContent side="top" className={cn(popCls, 'w-80 p-4')}><TileFields tile={tile} /></PopoverContent>
        </Popover>
      )}
      <Divider />
      <ToolButton label="Delete" danger onClick={() => removeTile(tile.id)}><Trash2 className="size-4" /></ToolButton>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1.5"><Label className="sc-eyebrow">{label}</Label>{children}</div>;
}

export function ImagePicker({ onPick, label = 'Upload image' }: { onPick: (src: string) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={async e => {
        const f = e.target.files?.[0]; if (!f) return;
        setBusy(true);
        try { onPick(await storeImage(f)); } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); e.target.value = ''; }
      }} />
      <button type="button" onClick={() => ref.current?.click()} disabled={busy}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] px-3 text-[13px] font-medium transition-colors hover:bg-[var(--secondary)] disabled:opacity-60">
        <Upload className="size-4" />{busy ? 'Uploading…' : label}
      </button>
    </>
  );
}

/** The edit form for one tile. */
export function TileFields({ tile }: { tile: Tile }) {
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
        <Field label="Preview image"><div className="flex gap-2"><Input value={tile.image ?? ''} placeholder="https://…" onChange={e => set({ image: e.target.value || undefined })} /><ImagePicker label="Upload" onPick={src => set({ image: src })} /></div></Field>
      </>}
      {tile.type === 'social' && <>
        <Field label="Platform">
          <Select value={tile.platform} onValueChange={v => set({ platform: v })}>
            <SelectTrigger className="h-9 w-full rounded-[10px] border-[var(--line)] bg-[var(--bg)] shadow-none"><SelectValue /></SelectTrigger>
            <SelectContent className={cn(CHROME, 'sc-pop')}>{PLATFORM_IDS.map(p => <SelectItem key={p} value={p}>{PLATFORMS[p].label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        {text('handle', tile.handle, tile.platform === 'email' ? 'Email' : 'Username')}
        {text('url', tile.url, 'Custom link (optional)')}
      </>}
      {tile.type === 'image' && <>
        <Field label="Image"><div className="flex gap-2"><Input value={tile.src.startsWith('data:') ? 'Uploaded image' : tile.src} onChange={e => set({ src: e.target.value })} /><ImagePicker label="Replace" onPick={src => set({ src })} /></div></Field>
        {text('caption', tile.caption, 'Caption')}
        {text('alt', tile.alt, 'Description for screen readers')}
        {text('url', tile.url, 'Link (optional)')}
      </>}
      {tile.type === 'text' && <Field label="Text"><Textarea value={tile.text} rows={2} onChange={e => set({ text: e.target.value })} /></Field>}
      {tile.type === 'video' && <>{text('url', tile.url, 'YouTube link')}{text('title', tile.title, 'Title')}<Field label="Thumbnail (optional)"><div className="flex gap-2"><Input value={tile.image ?? ''} placeholder="YouTube's own" onChange={e => set({ image: e.target.value || undefined })} /><ImagePicker label="Upload" onPick={src => set({ image: src })} /></div></Field></>}
      {tile.type === 'music' && text('url', tile.url, 'Spotify link')}
      {tile.type === 'github' && text('repo', tile.repo, 'Repository', 'owner/name')}
    </div>
  );
}
