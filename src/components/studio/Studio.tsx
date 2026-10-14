'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { Page, Tile } from '@/lib/schema';
import { newId } from '@/lib/schema';
import { tileFromInput } from '@/lib/detect';
import { pageStyle, isDark } from '@/lib/style';
import { cn } from '@/lib/utils';
import { useStudio, undo, redo, useHistory } from './store';
import { load, save, remoteMtime, enrich, storeImage, Conflict, type Mode } from './storage';
import { EditableCanvas } from './EditableCanvas';
import { Dock, useAddTile, type Device, type SaveState } from './Dock';

const typing = () => {
  const el = document.activeElement as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
};

export function Studio({ initial }: { initial: Page }) {
  const page = useStudio(s => s.page);
  const [mode, setMode] = useState<Mode>('local');
  const [device, setDevice] = useState<Device>('desktop');
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const ready = useRef(false);
  const written = useRef<number | undefined>(undefined);
  const skipSave = useRef(true); // loads and live-syncs must never trigger a save
  useHistory(s => s.pastStates.length + s.futureStates.length * 1000); // re-render the dock when history changes

  // Load once.
  useEffect(() => {
    load(initial).then(({ mode, page, mtime }) => {
      setMode(mode);
      written.current = mtime;
      skipSave.current = true;
      useStudio.getState().setPage(page);
      useStudio.temporal.getState().clear();
      ready.current = true;
      for (const t of page.tiles) if (t.type === 'github' && t.stars === undefined)
        enrich(mode, t).then(patch => patch && useStudio.getState().updateTile(t.id, patch));
    });
  }, [initial]);

  // Autosave (debounced).
  useEffect(() => {
    if (!ready.current || !page) return;
    if (skipSave.current) { skipSave.current = false; return; }
    setSaveState('saving');
    const t = setTimeout(async () => {
      try { const m = await save(mode, page, written.current); if (m) written.current = m; setSaveState('saved'); }
      catch (err) {
        if (err instanceof Conflict) await pullRemote();
        else setSaveState('error');
      }
    }, 450);
    return () => clearTimeout(t);
  }, [page, mode]);

  // Live sync: if an agent (or you, in your editor) changes page.json, pull it in.
  const pullRemote = useCallback(async () => {
    const r = await remoteMtime();
    if (!r || (written.current && Math.abs(r.mtime - written.current) <= 1)) return;
    written.current = r.mtime;
    skipSave.current = true;
    useStudio.getState().setPage(r.page);
    setSaveState('saved');
    toast('Updated from page.json');
  }, []);
  useEffect(() => {
    if (mode !== 'file') return;
    const id = setInterval(pullRemote, 1500);
    return () => clearInterval(id);
  }, [mode, pullRemote]);

  const addTile = useAddTile(mode, useCallback(async (tile: Tile) => {
    const patch = await enrich(mode, tile);
    if (patch) useStudio.getState().updateTile(tile.id, patch);
  }, [mode]));

  // Paste anywhere, drop images anywhere, keyboard shortcuts.
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      if (typing()) return;
      const file = [...(e.clipboardData?.files ?? [])].find(f => f.type.startsWith('image/'));
      if (file) { e.preventDefault(); addTile({ id: newId(), type: 'image', src: await storeImage(mode, file), alt: '', size: 's', color: 'auto' }); return; }
      const text = e.clipboardData?.getData('text')?.trim();
      if (text) { e.preventDefault(); addTile(tileFromInput(text)); toast('Added from clipboard'); }
    };
    const onDrop = async (e: DragEvent) => {
      const files = [...(e.dataTransfer?.files ?? [])].filter(f => f.type.startsWith('image/'));
      if (!files.length) return;
      e.preventDefault();
      for (const f of files) addTile({ id: newId(), type: 'image', src: await storeImage(mode, f), alt: '', size: 's', color: 'auto' });
    };
    const onDragOver = (e: DragEvent) => { if (e.dataTransfer?.types.includes('Files')) e.preventDefault(); };
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z' && !typing()) { e.preventDefault(); (e.shiftKey ? redo : undo)(); return; }
      const { selected, removeTile, select } = useStudio.getState();
      if (e.key === 'Escape') { (document.activeElement as HTMLElement | null)?.blur(); select(null); return; }
      if (typing()) return;
      if ((e.key === 'Backspace' || e.key === 'Delete') && selected) { e.preventDefault(); removeTile(selected); }
    };
    window.addEventListener('paste', onPaste);
    window.addEventListener('drop', onDrop);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('paste', onPaste); window.removeEventListener('drop', onDrop); window.removeEventListener('dragover', onDragOver); window.removeEventListener('keydown', onKey); };
  }, [mode, addTile]);

  // Popovers and dialogs live in portals on <body>, so the theme goes on the document root too.
  useEffect(() => {
    if (!page) return;
    const root = document.documentElement;
    for (const [k, v] of Object.entries(pageStyle(page) as Record<string, string>)) root.style.setProperty(k, v);
    root.classList.toggle('dark', isDark(page));
    root.style.colorScheme = isDark(page) ? 'dark' : 'light';
  }, [page]);

  if (!page) return <div className="min-h-dvh bg-[var(--bg)]" />;

  const canvas = <EditableCanvas page={page} mode={mode} />;
  return (
    <TooltipProvider delayDuration={300}>
      <div onClick={() => useStudio.getState().select(null)} className={cn('min-h-dvh', isDark(page) && 'dark')} style={{ ...pageStyle(page), background: device === 'mobile' ? 'color-mix(in oklab, var(--bg) 82%, var(--text))' : undefined }}>
        {device === 'desktop' ? canvas : (
          <div className="flex justify-center px-4 pb-32 pt-8">
            <div className="h-[844px] w-[390px] overflow-y-auto overflow-x-hidden rounded-[44px] border-[10px] border-[var(--text)] shadow-[0_40px_90px_-40px_rgb(0_0_0/.55)] [scrollbar-width:none]">
              {canvas}
            </div>
          </div>
        )}
        <Dock page={page} mode={mode} device={device} setDevice={setDevice} save={saveState} add={addTile} />
        <Toaster position="top-center" toastOptions={{ className: '!rounded-[14px] !border-[var(--line)] !bg-[var(--surface)] !text-[var(--text)] !shadow-lg' }} />
      </div>
    </TooltipProvider>
  );
}
