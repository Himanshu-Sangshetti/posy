'use client';

import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { MapPin, ImagePlus, X } from 'lucide-react';
import type { Page, Tile } from '@/lib/schema';
import { PageFrame, TileShell, Avatar, sections } from '@/components/page/PageView';
import { TileContent } from '@/components/page/tiles';
import { tileBackground } from '@/lib/style';
import { brandHex } from '@/components/page/tiles';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useStudio } from './store';
import { TileToolbar, ImagePicker } from './TileControls';
import type { Mode } from './storage';
import { PLATFORMS } from '@/lib/platforms';

const LABEL: Record<Tile['type'], string> = { link: 'Link', social: 'Social', text: 'Note', heading: 'Section title', image: 'Image', video: 'Video', music: 'Music', github: 'GitHub repo' };
export function tileLabel(t: Tile) {
  if (t.type === 'social') return `${PLATFORMS[t.platform].label} tile`;
  if (t.type === 'link' && t.title) return `${t.title} tile`;
  return `${LABEL[t.type]} tile`;
}

const blank = 'w-full resize-none bg-transparent outline-none [field-sizing:content] placeholder:text-[var(--muted)]/60';

function EditableProfile({ page, mode }: { page: Page; mode: Mode }) {
  const update = useStudio(s => s.updateProfile);
  const { name, bio, location, avatar } = page.profile;
  return (
    <header className="posy-profile" onClick={() => useStudio.getState().select(null)}>
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" aria-label="Change photo" className="group relative w-fit rounded-[36%]">
            <Avatar page={page} />
            <span className="absolute inset-0 grid place-items-center rounded-[36%] bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/25 group-hover:opacity-100"><ImagePlus className="size-6" /></span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto" align="start">
          <div className="flex gap-2">
            <ImagePicker mode={mode} label="Upload photo" onPick={src => update({ avatar: src })} />
            {avatar && <button type="button" onClick={() => update({ avatar: undefined })} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[13.5px] text-[var(--muted)] hover:bg-[var(--secondary)]"><X className="size-4" />Remove</button>}
          </div>
        </PopoverContent>
      </Popover>
      <textarea aria-label="Name" rows={1} value={name} placeholder="Your name" onChange={e => update({ name: e.target.value })}
        className={cn(blank, 'posy-head mt-3 text-[42px] leading-[1.02] sm:text-[50px]', page.theme.layout === 'stack' && 'text-center')} />
      <textarea aria-label="Bio" value={bio} placeholder="A line about you" onChange={e => update({ bio: e.target.value })}
        className={cn(blank, 'max-w-[34ch] text-[17px] leading-relaxed text-[var(--muted)]', page.theme.layout === 'stack' && 'text-center')} />
      <label className="inline-flex items-center gap-1.5 text-[14px] text-[var(--muted)]">
        <MapPin className="size-4 shrink-0" />
        <input aria-label="Location" value={location ?? ''} placeholder="Add location" onChange={e => update({ location: e.target.value || undefined })} className={cn(blank, 'w-auto min-w-[8ch]')} />
      </label>
    </header>
  );
}

function InlineText({ tile }: { tile: Extract<Tile, { type: 'text' }> }) {
  const update = useStudio(s => s.updateTile);
  const big = tile.size === 'l' || tile.size === 't';
  return (
    <div className={cn('flex h-full p-5', big ? 'items-end' : 'items-center')}>
      <textarea autoFocus aria-label="Note" value={tile.text} onChange={e => update(tile.id, { text: e.target.value })}
        onPointerDown={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}
        className={cn(blank, 'max-h-full font-medium leading-snug tracking-[-0.015em]', tile.size === 's' ? 'text-[15px]' : big ? 'text-[21px] leading-[1.3]' : 'text-[17px] leading-[1.45]')} />
    </div>
  );
}

function SortableTile({ tile, index, mode }: { tile: Tile; index: number; mode: Mode }) {
  const selected = useStudio(s => s.selected === tile.id);
  const select = useStudio(s => s.select);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tile.id });
  return (
    <div
      ref={setNodeRef}
      data-tile={tile.id}
      aria-label={tileLabel(tile)}
      className={cn('relative', `posy-size-${tile.size}`, isDragging && 'opacity-30')}
      style={{ transform: CSS.Translate.toString(transform), transition, zIndex: selected ? 20 : undefined }}
      onClick={e => { e.stopPropagation(); select(tile.id); }}
      {...attributes}
      {...listeners}
    >
      <TileShell tile={tile} index={index} editing className={cn('size-full cursor-grab active:cursor-grabbing', selected && 'outline outline-2 outline-offset-[3px] outline-[var(--accent)]')}>
        {selected && tile.type === 'text' ? <InlineText tile={tile} /> : undefined}
      </TileShell>
      {selected && <TileToolbar tile={tile} mode={mode} />}
    </div>
  );
}

function SortableHeading({ tile }: { tile: Extract<Tile, { type: 'heading' }> }) {
  const selected = useStudio(s => s.selected === tile.id);
  const { select, updateTile } = useStudio();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tile.id });
  return (
    <div ref={setNodeRef} data-tile={tile.id} aria-label={tileLabel(tile)} className={cn('relative mb-4 w-fit min-w-[12ch] px-1', isDragging && 'opacity-30')}
      style={{ transform: CSS.Translate.toString(transform), transition }} onClick={e => { e.stopPropagation(); select(tile.id); }} {...attributes} {...listeners}>
      <input aria-label="Section title" value={tile.text} onChange={e => updateTile(tile.id, { text: e.target.value })} onPointerDown={e => selected && e.stopPropagation()} onKeyDown={e => e.stopPropagation()}
        className={cn(blank, 'posy-head rounded-md text-[26px] leading-tight [field-sizing:content]', selected && 'outline outline-2 outline-offset-4 outline-[var(--accent)]')} />
      {selected && <TileToolbar tile={tile} mode="file" />}
    </div>
  );
}

export function EditableCanvas({ page, mode }: { page: Page; mode: Mode }) {
  const { moveTile, select } = useStudio();
  const [active, setActive] = useState<Tile | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onStart = (e: DragStartEvent) => { setActive(page.tiles.find(t => t.id === e.active.id) ?? null); select(String(e.active.id)); };
  const onEnd = (e: DragEndEvent) => { setActive(null); if (e.over && e.active.id !== e.over.id) moveTile(String(e.active.id), String(e.over.id)); };

  return (
    <PageFrame page={{ ...page, badge: false }} profile={<EditableProfile page={page} mode={mode} />}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onStart} onDragEnd={onEnd} onDragCancel={() => setActive(null)}>
        <SortableContext items={page.tiles.map(t => t.id)} strategy={rectSortingStrategy}>
          <div onClick={() => select(null)} className="min-h-[50vh] pb-40">
            {sections(page.tiles).map((s, i) => (
              <section key={s.heading?.id ?? `top-${i}`} className="posy-grid-wrap">
                {s.heading && <SortableHeading tile={s.heading} />}
                <div className="posy-grid">
                  {s.tiles.map(({ tile, index }) => <SortableTile key={tile.id} tile={tile} index={index} mode={mode} />)}
                </div>
              </section>
            ))}
            {page.tiles.length === 0 && (
              <div className="grid h-[40vh] place-items-center rounded-[var(--radius-tile)] border-2 border-dashed border-[var(--line)] text-center text-[15px] text-[var(--muted)]">
                Paste any link to add your first tile
              </div>
            )}
          </div>
        </SortableContext>
        <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' }}>
          {active && active.type !== 'heading' && (
            <div className={cn('posy-tile shadow-2xl', 'rotate-[1.5deg] scale-[1.03]')} style={{ background: tileBackground(active, page.tiles.indexOf(active), brandHex(active)), width: '100%', height: '100%' }}>
              <TileContent tile={active} editing />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </PageFrame>
  );
}
