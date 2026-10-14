'use client';

import { useRouter } from 'next/navigation';
import { ArrowUpRight, BarChart3, Bot, Copy, Eye, Heading, ImagePlus, Link2, Monitor, Palette, Redo2, Send, Settings, Smartphone, Type, Undo2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import type { Tile } from '@/lib/schema';
import { THEMES, THEME_IDS, PREMIUM_THEMES } from '@/lib/themes';
import { STYLE_IDS, STYLE_INFO, PREMIUM_STYLES } from '@/lib/styles';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { CHROME } from './chrome';
import { useEntitlements } from './entitlements';
import { newLink, newNote, newSection, type Device } from './Dock';
import type { DesignTab } from './ThemePanel';
import { useStudio, undo, redo } from './store';

type Props = {
  open: boolean; onOpenChange: (o: boolean) => void;
  add: (t: Tile) => void; url: string; canPublish: boolean; onPublish: () => void; onShare: () => void;
  setDevice: (d: Device) => void; openDesign: (tab: DesignTab) => void;
};

export function CommandPalette({ open, onOpenChange, add, url, canPublish, onPublish, onShare, setDevice, openDesign }: Props) {
  const router = useRouter();
  const ent = useEntitlements();
  const { updateTheme } = useStudio();
  const run = (fn: () => void) => () => { onOpenChange(false); setTimeout(fn, 60); };
  const pro = () => toast('Part of Posy Pro', { description: 'Upgrade from Settings to use premium themes, fonts and more.' });
  const item = 'gap-3 rounded-[10px] px-2.5 py-2 text-[14px] data-[selected=true]:bg-[var(--sc-on)] data-[selected=true]:text-[var(--text)]';
  const chip = (bg: string, Icon: React.ElementType) => <span className="grid size-6 shrink-0 place-items-center rounded-[8px]" style={{ background: bg }}><Icon className="size-3.5" /></span>;
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Commands" description="Add tiles, change the look, publish or share." showCloseButton={false}
      className={cn(CHROME, 'sc-pop top-[18%] max-w-[560px] translate-y-0 rounded-[20px] border-[var(--line)] bg-[var(--surface)]')}>
      <CommandInput placeholder="Type a command or search…" className="text-[15px]" />
      <CommandList className="max-h-[min(420px,60dvh)] px-1.5 pb-2">
        <CommandEmpty>Nothing matches. Try “note”, “neon” or “publish”.</CommandEmpty>
        <CommandGroup heading="Add">
          <CommandItem className={item} onSelect={run(() => add(newNote()))}>{chip('var(--brand-butter)', Type)}Add a note</CommandItem>
          <CommandItem className={item} onSelect={run(() => add(newSection()))}>{chip('var(--brand-sky)', Heading)}Add a section title</CommandItem>
          <CommandItem className={item} onSelect={run(() => add(newLink()))}>{chip('var(--brand-mint)', Link2)}Add a link</CommandItem>
          <CommandItem className={item} onSelect={run(() => document.querySelector<HTMLButtonElement>('button[aria-label="Add"]')?.click())}>{chip('var(--brand-rose)', ImagePlus)}Paste a link or add an image…</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Page">
          <CommandItem className={item} disabled={!canPublish} onSelect={run(onPublish)}>{chip('var(--brand-lilac)', UploadCloud)}Publish</CommandItem>
          <CommandItem className={item} onSelect={run(async () => { await navigator.clipboard.writeText(url); toast.success('Link copied'); })}>{chip('var(--brand-mint)', Copy)}Copy link</CommandItem>
          <CommandItem className={item} onSelect={run(onShare)}>{chip('var(--brand-sky)', Send)}Share, with QR code</CommandItem>
          <CommandItem className={item} onSelect={run(() => window.open(url, '_blank'))}>{chip('var(--brand-peach, #fcdac6)', ArrowUpRight)}Open my page</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Style">
          {STYLE_IDS.map(id => (
            <CommandItem key={id} className={item} value={`style ${STYLE_INFO[id].label}`}
              onSelect={run(() => PREMIUM_STYLES.has(id) && !ent.premium ? pro() : updateTheme({ style: id, preset: STYLE_INFO[id].preset, font: STYLE_INFO[id].font, accent: undefined }))}>
              {chip('var(--brand-lilac)', Palette)}{STYLE_INFO[id].label}<span className="ml-auto text-[12px] text-[var(--muted)]">{STYLE_INFO[id].note}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Colours">
          {THEME_IDS.map(id => (
            <CommandItem key={id} className={item} value={`colour ${THEMES[id].name}`}
              onSelect={run(() => PREMIUM_THEMES.has(id) && !ent.premium ? pro() : updateTheme({ preset: id, accent: undefined }))}>
              <span className="flex size-6 shrink-0 items-center justify-center rounded-[8px] border border-[var(--line)]" style={{ background: THEMES[id].bg }}><span className="size-2.5 rounded-full" style={{ background: THEMES[id].accent }} /></span>{THEMES[id].name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="View">
          <CommandItem className={item} onSelect={run(() => openDesign('style'))}>{chip('var(--brand-lilac)', Palette)}Open the design panel</CommandItem>
          <CommandItem className={item} onSelect={run(() => setDevice('desktop'))}>{chip('var(--brand-sky)', Monitor)}Desktop preview</CommandItem>
          <CommandItem className={item} onSelect={run(() => setDevice('mobile'))}>{chip('var(--brand-sky)', Smartphone)}Mobile preview</CommandItem>
          <CommandItem className={item} onSelect={run(undo)}>{chip('var(--secondary)', Undo2)}Undo<CommandShortcut className="sc-kbd">⌘Z</CommandShortcut></CommandItem>
          <CommandItem className={item} onSelect={run(redo)}>{chip('var(--secondary)', Redo2)}Redo<CommandShortcut className="sc-kbd">⇧⌘Z</CommandShortcut></CommandItem>
        </CommandGroup>
        <CommandGroup heading="Go to">
          <CommandItem className={item} onSelect={run(() => router.push('/analytics'))}>{chip('var(--secondary)', BarChart3)}Analytics</CommandItem>
          <CommandItem className={item} onSelect={run(() => router.push('/agents'))}>{chip('var(--secondary)', Bot)}Agents</CommandItem>
          <CommandItem className={item} onSelect={run(() => router.push('/settings'))}>{chip('var(--secondary)', Settings)}Settings</CommandItem>
          <CommandItem className={item} onSelect={run(() => window.open(url, '_blank'))}>{chip('var(--secondary)', Eye)}View live page</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
