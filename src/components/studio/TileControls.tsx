'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BringToFront, Pencil, SendToBack, Stamp, StickyNote, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import type { Tile, Size, Color, FocusPoint } from '@/lib/schema';
import { COLORS } from '@/lib/schema';
import { PLATFORMS, PLATFORM_IDS } from '@/lib/platforms';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CHROME } from './chrome';
import { asset, cn } from '@/lib/utils';
import { cropStyle } from '@/lib/crop';
import { sceneFor } from '@/components/page/styles';
import { useStudio } from './store';
import { storeImage } from './storage';
import { layerTile, sizeTile } from './canvas-ops';

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

function ToolButton({ label, active, onClick, children, danger, disabled }: { label: string; active?: boolean; onClick?: () => void; children: React.ReactNode; danger?: boolean; disabled?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle pressed={!!active} disabled={disabled} onPressedChange={() => onClick?.()} aria-label={label} size="sm"
          className={cn('size-8 min-w-8 rounded-[9px] px-0 text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--text)] data-[state=on]:bg-[var(--sc-on)] data-[state=on]:text-[var(--sc-deep)]', danger && 'hover:bg-[#fbe3e8] hover:text-[#b83a52]')}>
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="top" className={CHROME}>{label}</TooltipContent>
    </Tooltip>
  );
}

const Divider = () => <span className="mx-1 h-5 w-px shrink-0 bg-[var(--line)]" />;
/** Popovers stay clear of the top bar and the dock, scroll when they're taller than what's left, and never outgrow a phone. */
const popCls = cn(CHROME, 'sc-pop z-[70] max-h-[var(--radix-popover-content-available-height)] max-w-[calc(100vw-16px)] overflow-y-auto rounded-[16px] p-3');
export const POP_FIT = { collisionPadding: { top: 64, bottom: 88, left: 8, right: 8 }, sticky: 'always' } as const;

/** The tile whose slot a tile swaps into when it moves one step: its neighbour among the same kind of piece on scenes. */
function neighbour(tile: Tile, dir: -1 | 1): Tile | undefined {
  const page = useStudio.getState().page;
  if (!page) return;
  const scene = !!sceneFor(page.theme.style);
  const kind = (t: Tile) => !scene ? (t.type === 'heading' ? 'h' : t.type === 'social' ? 's' : 'g') : t.type === 'text' ? (t.look === 'stamp' ? 'stamp' : 'note') : t.type === 'github' ? 'link' : t.type === 'music' || t.type === 'video' ? 'media' : t.type;
  const same = page.tiles.filter(t => kind(t) === kind(tile));
  return same[same.findIndex(t => t.id === tile.id) + dir];
}

/** Floating toolbar above the selected tile. */
export function TileToolbar({ tile }: { tile: Tile }) {
  const { updateTile, removeTile, moveTile } = useStudio();
  const bar = useRef<HTMLDivElement>(null);
  // Keep the toolbar on screen: nudge it sideways at the edges, and drop it under the tile when there's no room above.
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const place = () => {
      el.style.top = '0'; el.style.transform = 'translate(-50%, calc(-100% - 10px))';
      const r = el.getBoundingClientRect(), vw = document.documentElement.clientWidth;
      const dx = r.left < 8 ? 8 - r.left : r.right > vw - 8 ? vw - 8 - r.right : 0;
      const below = r.top < 64;
      el.style.top = below ? '100%' : '0';
      el.style.transform = `translate(calc(-50% + ${dx}px), ${below ? '10px' : 'calc(-100% - 10px)'})`;
    };
    place();
    window.addEventListener('resize', place); window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, []);
  const sizes: Size[] = tile.type === 'music' ? ['s', 'w', 'l'] : ['s', 'w', 't', 'l'];
  const style = useStudio(s => s.page?.theme.style ?? 'minimal');
  const layout = useStudio(s => s.page?.theme.layout);
  const desk = style === 'cozy';
  const stamp = tile.type === 'text' && tile.look === 'stamp';
  const canvas = layout === 'canvas' && !sceneFor(style);
  const sticker = tile.type === 'social' && (style !== 'minimal' || layout === 'list');
  const inlineText = tile.type === 'text' && !stamp && (style === 'minimal' || style === 'cozy');
  const prev = canvas ? undefined : neighbour(tile, -1), next = canvas ? undefined : neighbour(tile, 1);
  const stampable = tile.type === 'text' && style !== 'minimal';
  const blankNote = tile.type === 'text' && !tile.text.trim();
  const sized = tile.type !== 'heading' && !sticker;
  return (
    <div
      ref={bar}
      data-toolbar
      onPointerDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
      className={cn(CHROME, 'sc-float absolute left-1/2 top-0 z-30 flex w-max max-w-[calc(100vw-16px)] -translate-x-1/2 -translate-y-[calc(100%+10px)] flex-wrap items-center justify-center gap-0.5 rounded-[13px] p-1 max-sm:[&:has([aria-expanded=true])]:pointer-events-none max-sm:[&:has([aria-expanded=true])]:opacity-0')}
    >
      {sized && sizes.map(s => (
        <ToolButton key={s} label={SIZE_LABEL[s]} active={tile.size === s} onClick={() => (canvas ? sizeTile(tile.id, s) : updateTile(tile.id, { size: s }))}><SizeGlyph size={s} /></ToolButton>
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
          <PopoverContent side="top" {...POP_FIT} className={cn(popCls, 'w-auto')}>
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
      {stampable && <>
        <ToolButton label={desk ? 'Sticky note' : 'Note'} active={!stamp} onClick={() => updateTile(tile.id, { look: undefined } as Partial<Tile>)}><StickyNote className="size-4" /></ToolButton>
        <ToolButton label={blankNote ? 'Round stamp (write something first)' : 'Round stamp'} active={stamp} disabled={blankNote && !stamp}
          onClick={() => updateTile(tile.id, { look: 'stamp', ...(tile.text.trim() === 'Write something' ? { text: 'Say hello' } : {}) } as Partial<Tile>)}><Stamp className="size-4" /></ToolButton>
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
          <PopoverContent side="top" {...POP_FIT} onOpenAutoFocus={e => e.preventDefault()} className={cn(popCls, 'w-80 p-4')}><TileFields tile={tile} /></PopoverContent>
        </Popover>
      )}
      {canvas && !sticker && <>
        <Divider />
        <ToolButton label="Bring to front" onClick={() => layerTile(tile.id, 'front')}><BringToFront className="size-4" /></ToolButton>
        <ToolButton label="Send to back" onClick={() => layerTile(tile.id, 'back')}><SendToBack className="size-4" /></ToolButton>
      </>}
      {(prev || next) && <>
        <Divider />
        <ToolButton label="Move earlier" disabled={!prev} onClick={() => prev && moveTile(tile.id, prev.id)}><ArrowLeft className="size-4" /></ToolButton>
        <ToolButton label="Move later" disabled={!next} onClick={() => next && moveTile(tile.id, next.id)}><ArrowRight className="size-4" /></ToolButton>
      </>}
      <Divider />
      <ToolButton label="Delete" danger onClick={() => removeTile(tile.id)}><Trash2 className="size-4" /></ToolButton>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid min-w-0 gap-1.5"><Label className="sc-eyebrow">{label}</Label>{children}</div>;
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
        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-[var(--line)] bg-[var(--surface)] px-3 text-[13px] font-medium transition-colors hover:bg-[var(--secondary)] disabled:opacity-60">
        <Upload className="size-4" />{busy ? 'Uploading…' : label}
      </button>
    </>
  );
}

type Crop = { focus?: FocusPoint; zoom?: number };
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Drag the picture inside its frame to choose what stays in view, and slide to zoom in on it. The frame shows what the
 * tile shows (same object-fit: cover crop, same zoom around the focal point), so what you see is what is saved.
 */
export function CropControl({ src, crop, aspect = 1, onChange }: { src: string; crop: Crop; aspect?: number; onChange: (c: Crop) => void }) {
  const frame = useRef<HTMLDivElement>(null);
  const natural = useRef<[number, number]>([0, 0]);
  const drag = useRef<{ x: number; y: number; fx: number; fy: number } | null>(null);
  const fx = crop.focus?.x ?? 50, fy = crop.focus?.y ?? 50, z = crop.zoom ?? 1;
  const set = (focus: FocusPoint, zoom = z) => onChange({ focus: focus.x === 50 && focus.y === 50 ? undefined : { x: Math.round(focus.x), y: Math.round(focus.y) }, zoom: zoom > 1 ? Math.round(zoom * 20) / 20 : undefined });
  // Moving the focal point by a fraction f shifts the picture by (z * overflow + (z - 1) * frame) * f; invert that to follow the pointer.
  const move = (e: React.PointerEvent) => {
    const d = drag.current, el = frame.current, [nw, nh] = natural.current;
    if (!d || !el || !nw) return;
    const W = el.clientWidth, H = el.clientHeight, s = Math.max(W / nw, H / nh);
    const kx = z * Math.max(0, nw * s - W) + (z - 1) * W, ky = z * Math.max(0, nh * s - H) + (z - 1) * H;
    set({ x: kx > 0.5 ? clamp(d.fx - (e.clientX - d.x) / kx * 100, 0, 100) : d.fx, y: ky > 0.5 ? clamp(d.fy - (e.clientY - d.y) / ky * 100, 0, 100) : d.fy });
  };
  const changed = !!crop.focus || z > 1;
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between"><Label className="sc-eyebrow">Crop</Label>
        {changed && <button type="button" onClick={() => onChange({ focus: undefined, zoom: undefined })} className="text-[12px] text-[var(--muted)] hover:text-[var(--text)]">Reset</button>}
      </div>
      <div ref={frame} role="img" aria-label="Drag to reposition the picture" data-crop-frame
        className="relative mx-auto w-full max-w-[220px] cursor-grab touch-none select-none overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--secondary)] active:cursor-grabbing"
        style={{ aspectRatio: String(aspect) }}
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, fx, fy }; }}
        onPointerMove={move}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(src)} alt="" draggable={false} className="pointer-events-none absolute inset-0 size-full object-cover"
          style={cropStyle({ focus: crop.focus, zoom: crop.zoom })} onLoad={e => { natural.current = [e.currentTarget.naturalWidth, e.currentTarget.naturalHeight]; }} />
        <span className="pointer-events-none absolute inset-0 rounded-[10px] shadow-[inset_0_0_0_1px_rgb(255_255_255/.35)]" />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[12px] text-[var(--muted)]">Zoom</span>
        <Slider aria-label="Zoom" min={1} max={3} step={0.05} value={[z]} onValueChange={([v]) => set({ x: fx, y: fy }, v)} />
        <span className="w-9 text-right text-[12px] tabular-nums text-[var(--muted)]">{z.toFixed(1)}×</span>
      </div>
      <p className="text-[12px] text-[var(--muted)]">Drag the picture to choose what stays in view.</p>
    </div>
  );
}

/** Crop for the profile photo. */
export function AvatarCrop() {
  const avatar = useStudio(s => s.page?.profile.avatar);
  const focus = useStudio(s => s.page?.profile.avatarFocus), zoom = useStudio(s => s.page?.profile.avatarZoom);
  const update = useStudio(s => s.updateProfile);
  if (!avatar) return null;
  return <CropControl src={avatar} crop={{ focus, zoom }} onChange={c => update({ avatarFocus: c.focus, avatarZoom: c.zoom })} />;
}

/** The edit form for one tile. */
export function TileFields({ tile }: { tile: Tile }) {
  const update = useStudio(s => s.updateTile);
  const set = (patch: Record<string, unknown>) => update(tile.id, patch as Partial<Tile>);
  const text = (key: string, value: string | undefined, label: string, placeholder?: string) => (
    <Field label={label}><Input className="min-w-0 truncate" value={value ?? ''} placeholder={placeholder} onChange={e => set({ [key]: e.target.value || undefined })} /></Field>
  );
  return (
    <div className="grid gap-3.5">
      {tile.type === 'link' && <>
        {text('url', tile.url, 'Link')}
        {text('title', tile.title, 'Title')}
        {text('description', tile.description, 'Description')}
        <Field label="Preview image"><div className="flex min-w-0 gap-2"><Input className="min-w-0 truncate" value={tile.image ?? ''} placeholder="https://…" onChange={e => set({ image: e.target.value || undefined })} /><ImagePicker label="Upload" onPick={src => set({ image: src, focus: undefined, zoom: undefined })} /></div></Field>
        {tile.image && <CropControl src={tile.image} crop={tile} aspect={2} onChange={c => set(c)} />}
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
        <Field label="Image"><div className="flex min-w-0 gap-2"><Input className="min-w-0 truncate" value={tile.src.startsWith('data:') ? 'Uploaded image' : tile.src} onChange={e => set({ src: e.target.value })} /><ImagePicker label="Replace" onPick={src => set({ src, focus: undefined, zoom: undefined })} /></div></Field>
        {tile.src && <CropControl src={tile.src} crop={tile} aspect={tile.size === 'w' ? 2 : tile.size === 't' ? 0.5 : 1} onChange={c => set(c)} />}
        {text('caption', tile.caption, 'Caption')}
        {text('alt', tile.alt, 'Description for screen readers')}
        {text('url', tile.url, 'Link (optional)')}
      </>}
      {tile.type === 'text' && <Field label="Text"><Textarea value={tile.text} rows={2} onChange={e => set({ text: e.target.value })} /></Field>}
      {tile.type === 'video' && <>{text('url', tile.url, 'YouTube link')}{text('title', tile.title, 'Title')}<Field label="Thumbnail (optional)"><div className="flex min-w-0 gap-2"><Input className="min-w-0 truncate" value={tile.image ?? ''} placeholder="YouTube's own" onChange={e => set({ image: e.target.value || undefined })} /><ImagePicker label="Upload" onPick={src => set({ image: src, focus: undefined, zoom: undefined })} /></div></Field>{tile.image && <CropControl src={tile.image} crop={tile} aspect={16 / 9} onChange={c => set(c)} />}</>}
      {tile.type === 'music' && <>{text('url', tile.url, 'Spotify link')}{tile.image && <CropControl src={tile.image} crop={tile} onChange={c => set(c)} />}</>}
      {tile.type === 'github' && text('repo', tile.repo, 'Repository', 'owner/name')}
    </div>
  );
}
