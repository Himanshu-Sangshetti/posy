'use client';

import { launchKite } from './kite-launch';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { Page, Tile } from '@/lib/schema';
import { newId } from '@/lib/schema';
import { tileFromInput } from '@/lib/detect';
import { pageStyle, isDark } from '@/lib/style';
import { cn } from '@/lib/utils';
import { nudgeTile } from './canvas-ops';
import { useStudio, undo, redo, useHistory } from './store';
import { save, fetchRemote, enrich, storeImage, publish, Conflict } from './storage';
import { EditableCanvas } from './EditableCanvas';
import { Dock, useAddTile, type Device, type SaveState } from './Dock';
import { TopBar } from './TopBar';
import { DesignSheet } from './DesignSheet';
import { CommandPalette } from './CommandPalette';
import { ShareDialog } from './ShareDialog';
import { CHROME } from './chrome';
import type { DesignTab } from './ThemePanel';
import { Skeleton } from '@/components/ui/skeleton';
import { EntitlementsProvider } from './entitlements';
import type { Entitlements } from '@/edition/types';

const typing = () => {
  const el = document.activeElement as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
};

export type StudioInit = { page: Page; version: number; username: string; hasUnpublished: boolean; site: string; entitlements: Entitlements; nav?: { href: string; label: string }[] };

export function Studio({ init }: { init: StudioInit }) {
  const router = useRouter();
  const params = useSearchParams();
  const page = useStudio(s => s.page);
  const [device, setDevice] = useState<Device>('desktop');
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [unpublished, setUnpublished] = useState(init.hasUnpublished);
  const [publishing, setPublishing] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const [designTab, setDesignTab] = useState<DesignTab>('style');
  const [shareOpen, setShareOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const version = useRef(init.version);
  const skipSave = useRef(true); // loads and live-syncs must never trigger a save
  useHistory(s => s.pastStates.length + s.futureStates.length * 1000);

  // First load comes from the server render.
  useEffect(() => {
    skipSave.current = true;
    useStudio.getState().setPage(init.page);
    useStudio.temporal.getState().clear();
    if (params.get('welcome')) {
      toast('Your page is ready', { description: 'Paste a link anywhere to add it. Publish when you like it.' });
      router.replace('/edit');
    }
    for (const t of init.page.tiles) if (t.type === 'github' && t.stars === undefined)
      enrich(t).then(patch => patch && useStudio.getState().updateTile(t.id, patch));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adopt = useCallback((remote: { version: number; page: Page }, note?: string) => {
    version.current = remote.version;
    skipSave.current = true;
    useStudio.getState().setPage(remote.page);
    setSaveState('saved');
    if (note) toast(note);
  }, []);

  // Autosave (debounced, compare-and-set).
  useEffect(() => {
    if (!page) return;
    if (skipSave.current) { skipSave.current = false; return; }
    setSaveState('saving');
    const t = setTimeout(async () => {
      try { version.current = await save(page, version.current); setSaveState('saved'); setUnpublished(true); }
      catch (e) {
        if (e instanceof Conflict) adopt(e.remote, 'Updated with changes made elsewhere');
        else { setSaveState('error'); toast.error((e as Error).message); }
      }
    }, 450);
    return () => clearTimeout(t);
  }, [page, adopt]);

  // Live sync: an agent (MCP/API) or another tab changed the page.
  useEffect(() => {
    const id = setInterval(async () => {
      if (document.hidden) return;
      const r = await fetchRemote();
      if (!r) return;
      setUnpublished(r.hasUnpublishedChanges);
      if (r.version > version.current) adopt(r, 'Updated from your agent');
    }, 2000);
    return () => clearInterval(id);
  }, [adopt]);

  const addTile = useAddTile(useCallback(async (tile: Tile) => {
    const patch = await enrich(tile);
    if (patch) useStudio.getState().updateTile(tile.id, patch);
  }, []));

  async function doPublish() {
    setPublishing(true);
    try {
      const url = await publish();
      setUnpublished(false);
      launchKite(document.querySelector('[data-publish]'));
      toast.success('Your page is live', { description: 'Anyone with the link can see it now.', action: { label: 'View', onClick: () => window.open(url, '_blank') } });
    } catch { toast.error('Could not publish. Try again.'); }
    finally { setPublishing(false); }
  }

  // Paste anywhere, drop images anywhere, keyboard shortcuts.
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      if (typing()) return;
      const file = [...(e.clipboardData?.files ?? [])].find(f => f.type.startsWith('image/'));
      if (file) { e.preventDefault(); addTile({ id: newId(), type: 'image', src: await storeImage(file), alt: '', size: 's', color: 'auto' }); return; }
      const text = e.clipboardData?.getData('text')?.trim();
      if (text) { e.preventDefault(); addTile(tileFromInput(text)); toast('Added from clipboard'); }
    };
    const onDrop = async (e: DragEvent) => {
      const files = [...(e.dataTransfer?.files ?? [])].filter(f => f.type.startsWith('image/'));
      if (!files.length) return;
      e.preventDefault();
      for (const f of files) addTile({ id: newId(), type: 'image', src: await storeImage(f), alt: '', size: 's', color: 'auto' });
    };
    const onDragOver = (e: DragEvent) => { if (e.dataTransfer?.types.includes('Files')) e.preventDefault(); };
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmdOpen(o => !o); return; }
      if (mod && e.key.toLowerCase() === 'z' && !typing()) { e.preventDefault(); (e.shiftKey ? redo : undo)(); return; }
      const { selected, removeTile, select } = useStudio.getState();
      if (e.key === 'Escape') { (document.activeElement as HTMLElement | null)?.blur(); select(null); return; }
      if (typing()) return;
      if (!mod && !e.altKey && e.key.toLowerCase() === 'd') { e.preventDefault(); setDesignOpen(o => !o); return; }
      if ((e.key === 'Backspace' || e.key === 'Delete') && selected) { e.preventDefault(); removeTile(selected); }
      // canvas: arrow keys nudge the selected tile (shift = 10 units)
      const arrow = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (arrow && selected && !mod && useStudio.getState().page?.theme.layout === 'canvas') {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        nudgeTile(selected, arrow[0] * step, arrow[1] * step);
      }
    };
    window.addEventListener('paste', onPaste);
    window.addEventListener('drop', onDrop);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('paste', onPaste); window.removeEventListener('drop', onDrop); window.removeEventListener('dragover', onDragOver); window.removeEventListener('keydown', onKey); };
  }, [addTile]);

  // Popovers and dialogs live in portals on <body>, so the theme goes on the document root too.
  useEffect(() => {
    if (!page) return;
    const root = document.documentElement;
    for (const [k, v] of Object.entries(pageStyle(page) as Record<string, string>)) root.style.setProperty(k, v);
    root.classList.toggle('dark', isDark(page));
    root.style.colorScheme = isDark(page) ? 'dark' : 'light';
  }, [page]);

  if (!page) return (
    <div className={cn(CHROME, 'min-h-dvh bg-[var(--bg)]')} aria-busy>
      <div className="flex h-14 items-center justify-between border-b border-[var(--line)] px-4"><Skeleton className="h-8 w-28 rounded-[10px]" /><Skeleton className="h-8 w-56 rounded-full" /><Skeleton className="h-9 w-28 rounded-[10px]" /></div>
      <div className="mx-auto grid max-w-[880px] gap-4 px-6 pt-16"><Skeleton className="h-28 w-28 rounded-[24px]" /><Skeleton className="h-10 w-2/3 rounded-[12px]" /><div className="grid grid-cols-3 gap-4 pt-4">{[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-40 rounded-[22px]" />)}</div></div>
    </div>
  );

  const canvas = <EditableCanvas page={page} device={device} />;
  const url = `${init.site}/${init.username}`;
  const canPublish = unpublished && !publishing && saveState === 'saved';
  const openDesign = (tab: DesignTab) => { setDesignTab(tab); setDesignOpen(true); };
  return (
    <EntitlementsProvider value={init.entitlements}>
    <TooltipProvider delayDuration={300}>
      <div onClick={() => useStudio.getState().select(null)} className={cn('min-h-dvh', isDark(page) && 'dark')}
        style={{ ...pageStyle(page), background: device === 'mobile' ? 'color-mix(in oklab, var(--bg) 82%, var(--text))' : undefined }}>
        <TopBar extra={init.nav} username={init.username} site={init.site} saveState={saveState} unpublished={unpublished} publishing={publishing}
          onPublish={doPublish} onShare={() => setShareOpen(true)} onCommand={() => setCmdOpen(true)} />
        <div className={cn('transition-[padding] duration-300', designOpen && 'sm:pr-[380px]')}>
          {device === 'desktop' ? <div className="pt-14">{canvas}</div> : (
            <div className="flex justify-center px-4 pb-32 pt-24">
              <div className="h-[844px] w-[390px] overflow-y-auto overflow-x-hidden rounded-[44px] border-[10px] border-[var(--text)] shadow-[0_40px_90px_-40px_rgb(0_0_0/.55)] [scrollbar-width:none]">
                {canvas}
              </div>
            </div>
          )}
        </div>
        <Dock page={page} device={device} setDevice={setDevice} add={addTile} designOpen={designOpen} onDesign={() => setDesignOpen(o => !o)} addOpen={addOpen} setAddOpen={setAddOpen} />
        <DesignSheet open={designOpen} onOpenChange={setDesignOpen} page={page} tab={designTab} onTab={setDesignTab} />
        <ShareDialog open={shareOpen} onOpenChange={setShareOpen} url={url} live={!unpublished} />
        <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} add={addTile} url={url} canPublish={canPublish} onPublish={doPublish}
          onShare={() => setShareOpen(true)} setDevice={setDevice} openDesign={openDesign} />
        <Toaster position="top-center" offset={68} className={CHROME} toastOptions={{ classNames: { toast: 'sc-toast' } }} />
      </div>
    </TooltipProvider>
    </EntitlementsProvider>
  );
}
