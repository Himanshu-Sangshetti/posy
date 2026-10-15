'use client';

import { useRef, useState } from 'react';
import { Plus, Palette, Monitor, Smartphone, Undo2, Redo2, Type, Heading, ImagePlus, Link2, CornerDownLeft, Music2, Play, FolderGit2, AtSign } from 'lucide-react';
import { toast } from 'sonner';
import type { Page, Tile } from '@/lib/schema';
import { newId } from '@/lib/schema';
import { tileFromInput } from '@/lib/detect';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useStudio, undo, redo, useHistory } from './store';
import { storeImage } from './storage';
import { CHROME } from './chrome';

export type Device = 'desktop' | 'mobile';
export type SaveState = 'saved' | 'saving' | 'error';

function Hint({ label, keys, children }: { label: string; keys?: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={10} className={cn(CHROME, 'flex items-center gap-2')}>
        {label}{keys && <span className="sc-kbd !border-white/20 !bg-white/10 !text-white/80">{keys}</span>}
      </TooltipContent>
    </Tooltip>
  );
}

const iconBtn = 'size-10 rounded-[11px] text-[var(--text)] hover:bg-[var(--secondary)] disabled:opacity-30 [&_svg]:size-[18px]';

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

export const newNote = (): Tile => ({ id: newId(), type: 'text', text: 'Write something', size: 'w', color: 'auto' });
export const newSection = (): Tile => ({ id: newId(), type: 'heading', text: 'New section', size: 's', color: 'auto' });
export const newLink = (): Tile => ({ id: newId(), type: 'link', url: 'https://example.com', title: 'My link', size: 's', color: 'auto' });

const KINDS = [
  { label: 'Note', icon: Type, tint: '#fbe9a6', make: newNote },
  { label: 'Section', icon: Heading, tint: '#e3e8f6', make: newSection },
  { label: 'Link', icon: Link2, tint: '#dcefd8', make: newLink },
] as const;
/** Kinds that start from a link: picking one asks for that kind of link. */
const FROM_LINK = [
  { label: 'Music', icon: Music2, tint: '#d9f2e2', hint: 'Paste a Spotify, Apple Music or SoundCloud link' },
  { label: 'Video', icon: Play, tint: '#fbdcd4', hint: 'Paste a YouTube link' },
  { label: 'Repo', icon: FolderGit2, tint: '#e8e4f4', hint: 'Paste a GitHub repo, like github.com/you/project' },
  { label: 'Social', icon: AtSign, tint: '#f6e3f0', hint: 'Paste your Instagram, X, TikTok… profile link' },
] as const;

function AddPanel({ add, close }: { add: (t: Tile) => void; close: () => void }) {
  const [value, setValue] = useState('');
  const [hint, setHint] = useState('Paste a link, an email, or write a note');
  const input = useRef<HTMLInputElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const quick = (t: Tile) => { add(t); close(); };
  const submit = () => { if (!value.trim()) return; add(tileFromInput(value)); setValue(''); close(); };
  const chip = 'group grid place-items-center gap-2 rounded-[14px] border border-transparent px-1 py-3 text-[12.5px] font-medium text-[var(--text)] transition-all hover:border-[var(--line)] hover:bg-[var(--secondary)] active:scale-[.97]';
  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <p className="sc-eyebrow">Paste anything</p>
        <div className="relative">
          <Input ref={input} autoFocus value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder={hint} className="h-11 rounded-[12px] border-[var(--line)] bg-[var(--bg)] pr-11 text-[14.5px] shadow-none focus-visible:border-[var(--sc-deep)] focus-visible:ring-[var(--sc-on)]" />
          <span className="sc-kbd pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"><CornerDownLeft className="size-3" /></span>
        </div>
      </div>
      <div className="grid gap-1.5">
        <p className="sc-eyebrow">Or start with</p>
        <div className="grid grid-cols-4 gap-1">
          {FROM_LINK.map(({ label, icon: Icon, tint, hint: h }) => (
            <button key={label} type="button" onClick={() => { setHint(h); input.current?.focus(); }} className={chip}>
              <span className="grid size-10 place-items-center rounded-[12px]" style={{ background: tint }}><Icon className="size-[18px]" /></span>{label}
            </button>
          ))}
          {KINDS.map(({ label, icon: Icon, tint, make }) => (
            <button key={label} type="button" onClick={() => quick(make())} className={chip}>
              <span className="grid size-10 place-items-center rounded-[12px]" style={{ background: tint }}><Icon className="size-[18px]" /></span>{label}
            </button>
          ))}
          <button type="button" onClick={() => file.current?.click()} className={chip}>
            <span className="grid size-10 place-items-center rounded-[12px]" style={{ background: '#f6dfd6' }}><ImagePlus className="size-[18px]" /></span>Image
          </button>
        </div>
      </div>
      <input ref={file} type="file" accept="image/*" className="hidden" onChange={async e => {
        const f = e.target.files?.[0]; if (!f) return;
        try { quick({ id: newId(), type: 'image', src: await storeImage(f), alt: '', size: 's', color: 'auto' }); } catch (err) { toast.error((err as Error).message); }
        e.target.value = '';
      }} />
    </div>
  );
}

/* ---------- Dock ---------- */
export function Dock({ device, setDevice, add, designOpen, onDesign, addOpen, setAddOpen }: {
  page: Page; device: Device; setDevice: (d: Device) => void; add: (t: Tile) => void;
  designOpen: boolean; onDesign: () => void; addOpen: boolean; setAddOpen: (o: boolean) => void;
}) {
  const canUndo = useHistory(s => s.pastStates.length > 0);
  const canRedo = useHistory(s => s.futureStates.length > 0);
  return (
    <div className={cn('pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-3 transition-[padding] duration-300', designOpen && 'sm:pr-[392px] max-sm:hidden')} onClick={e => e.stopPropagation()}>
      <div className={cn(CHROME, 'sc-float sc-dock pointer-events-auto flex items-center gap-1 rounded-full p-1.5')}>
        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <Button type="button" aria-label="Add" className="sc-add h-11 gap-1.5 rounded-full pl-3.5 pr-4 text-[14.5px] active:scale-[.96]">
              <Plus className="size-[18px]" />Add
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" sideOffset={14} className={cn(CHROME, 'sc-pop w-[360px] max-w-[calc(100vw-24px)] rounded-[18px] p-4')}><AddPanel add={add} close={() => setAddOpen(false)} /></PopoverContent>
        </Popover>
        <Hint label="Design" keys="D">
          <Button type="button" variant="ghost" aria-label="Design" aria-pressed={designOpen} onClick={onDesign} className={cn('h-10 gap-1.5 rounded-[12px] px-3 text-[14px] hover:bg-[var(--secondary)]', designOpen && 'bg-[var(--sc-on)] text-[var(--sc-deep)] hover:bg-[var(--sc-on)]')}>
            <Palette className="size-[18px]" /><span className="hidden sm:inline">Design</span>
          </Button>
        </Hint>
        <span className="mx-1 h-5 w-px bg-[var(--line)]" />
        <ToggleGroup type="single" value={device} onValueChange={v => v && setDevice(v as Device)} aria-label="Preview size" className="gap-0.5 rounded-[12px] bg-[var(--secondary)] p-0.5">
          {([['desktop', 'Desktop', Monitor], ['mobile', 'Mobile', Smartphone]] as const).map(([id, label, Icon]) => (
            <Hint key={id} label={`${label} preview`}>
              <ToggleGroupItem value={id} aria-label={label} className="size-9 rounded-[10px] text-[var(--muted)] hover:bg-transparent hover:text-[var(--text)] data-[state=on]:bg-[var(--surface)] data-[state=on]:text-[var(--text)] data-[state=on]:shadow-[0_1px_3px_rgb(22_20_15/.18)]">
                <Icon className="size-[17px]" />
              </ToggleGroupItem>
            </Hint>
          ))}
        </ToggleGroup>
        <span className="mx-1 h-5 w-px bg-[var(--line)]" />
        <Hint label="Undo" keys="⌘Z"><Button type="button" variant="ghost" size="icon" aria-label="Undo" onClick={undo} disabled={!canUndo} className={iconBtn}><Undo2 /></Button></Hint>
        <Hint label="Redo" keys="⇧⌘Z"><Button type="button" variant="ghost" size="icon" aria-label="Redo" onClick={redo} disabled={!canRedo} className={iconBtn}><Redo2 /></Button></Hint>
      </div>
    </div>
  );
}
