'use client';

import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { MapPin, ImagePlus, X } from 'lucide-react';
import type { Page, Tile } from '@/lib/schema';
import { PageFrame, TileShell, Avatar, sections, ordinals } from '@/components/page/PageView';
import { StyleHeader, StyleTile, StyleRow, headerClass, socialsInHeader, sceneFor, type StyleId } from '@/components/page/styles';
import type { HeaderSlots } from '@/components/page/styles/types';
import type { Device, PieceFn } from '@/components/page/styles/scene';
import { TileContent, ListItem, BrandIcon } from '@/components/page/tiles';
import { tileBackground } from '@/lib/style';
import { brandHex } from '@/components/page/tiles';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useStudio } from './store';
import { TileToolbar, ImagePicker } from './TileControls';
import { PLATFORMS } from '@/lib/platforms';
import { MotionShell } from '@/components/page/motion';
import { CanvasEditor } from './CanvasEditor';

const LABEL: Record<Tile['type'], string> = { link: 'Link', social: 'Social', text: 'Note', heading: 'Section title', image: 'Image', video: 'Video', music: 'Music', github: 'GitHub repo' };
export function tileLabel(t: Tile) {
  if (t.type === 'social') return `${PLATFORMS[t.platform].label} tile`;
  if (t.type === 'link' && t.title) return `${t.title} tile`;
  return `${LABEL[t.type]} tile`;
}

const blank = 'w-full resize-none bg-transparent outline-none [field-sizing:content] placeholder:text-[var(--muted)]/60';

function AvatarPicker({ page, className }: { page: Page; className?: string }) {
  const update = useStudio(s => s.updateProfile);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label="Change photo" className={cn('group relative block w-full', className)}>
          <Avatar page={page} />
          <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/25 group-hover:opacity-100"><ImagePlus className="size-6" /></span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto" align="start">
        <div className="flex gap-2">
          <ImagePicker label="Upload photo" onPick={src => update({ avatar: src })} />
          {page.profile.avatar && <button type="button" onClick={() => update({ avatar: undefined })} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[13.5px] text-[var(--muted)] hover:bg-[var(--secondary)]"><X className="size-4" />Remove</button>}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function useEditableSlots(page: Page): HeaderSlots {
  const update = useStudio(s => s.updateProfile);
  const { name, bio, location } = page.profile;
  const style = page.theme.style;
  return {
        avatar: page.theme.avatar === 'hidden' ? null : <AvatarPicker page={page} />,
        name: <textarea aria-label="Name" rows={1} value={name} placeholder="Your name" onChange={e => update({ name: e.target.value })} className={cn(blank, 'st-edit-name')} />,
        bio: <textarea aria-label="Bio" value={bio} placeholder="A line about you" onChange={e => update({ bio: e.target.value })} className={cn(blank, 'st-edit-bio')} />,
        caption: <input aria-label="Location" value={location ?? ''} placeholder={style === 'cozy' ? 'a caption' : 'Add location'} onChange={e => update({ location: e.target.value || undefined })} className={cn(blank, 'st-edit-caption')} />,
        socials: (
          <div className="posy-social-row" onClick={e => e.stopPropagation()}>
            {page.tiles.filter((t): t is Extract<Tile, { type: 'social' }> => t.type === 'social').map(t => <SortableSocialIcon key={t.id} tile={t} desk={style === 'cozy'} />)}
          </div>
        ),
  };
}

function EditableStyledProfile({ page }: { page: Page }) {
  const slots = useEditableSlots(page);
  return (
    <header className={headerClass(page.theme.style)} onClick={() => useStudio.getState().select(null)}>
      <StyleHeader page={page} slots={slots} />
    </header>
  );
}

/** A piece of a scene in the editor: click to select it, drag to reorder it among the others. */
function ScenePiece({ tile, children, className, style }: { tile: Tile; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const selected = useStudio(s => s.selected === tile.id);
  const select = useStudio(s => s.select);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tile.id });
  return (
    <div ref={setNodeRef} data-tile={tile.id} aria-label={tileLabel(tile)}
      className={cn('sc-piece relative cursor-grab active:cursor-grabbing', className, isDragging && 'opacity-30', selected && 'sc-selected')}
      style={{ ...style, transform: CSS.Translate.toString(transform), transition, zIndex: selected ? 20 : style?.zIndex }}
      onClick={e => { e.preventDefault(); e.stopPropagation(); select(tile.id); }} {...attributes} {...listeners}>
      {children}
      {selected && <TileToolbar tile={tile} />}
    </div>
  );
}

const editPiece: PieceFn = (tile, node, o) => <ScenePiece key={o.key} tile={tile} className={o.className} style={o.style}>{node}</ScenePiece>;

function EditableScene({ page, device }: { page: Page; device: Device }) {
  const Scene = sceneFor(page.theme.style)!;
  const slots = useEditableSlots(page);
  return <Scene page={page} slots={slots} piece={editPiece} only={device} editing />;
}

function EditableProfile({ page }: { page: Page }) {
  const update = useStudio(s => s.updateProfile);
  const { name, bio, location, avatar } = page.profile;
  if (page.theme.style !== 'minimal') return <EditableStyledProfile page={page} />;
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
            <ImagePicker label="Upload photo" onPick={src => update({ avatar: src })} />
            {avatar && <button type="button" onClick={() => update({ avatar: undefined })} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[13.5px] text-[var(--muted)] hover:bg-[var(--secondary)]"><X className="size-4" />Remove</button>}
          </div>
        </PopoverContent>
      </Popover>
      <textarea aria-label="Name" rows={1} value={name} placeholder="Your name" onChange={e => update({ name: e.target.value })}
        className={cn(blank, 'posy-head mt-3 text-[42px] leading-[1.02] sm:text-[50px]', (page.theme.layout !== 'bento' || page.theme.align === 'center') && 'text-center')} />
      <textarea aria-label="Bio" value={bio} placeholder="A line about you" onChange={e => update({ bio: e.target.value })}
        className={cn(blank, 'max-w-[34ch] text-[17px] leading-relaxed text-[var(--muted)]', (page.theme.layout !== 'bento' || page.theme.align === 'center') && 'text-center')} />
      <label className="posy-meta">
        <MapPin className="size-4 shrink-0" />
        <input aria-label="Location" value={location ?? ''} placeholder="Add location" onChange={e => update({ location: e.target.value || undefined })} className={cn(blank, 'w-auto min-w-[8ch] [field-sizing:content]')} />
      </label>
      {page.theme.layout === 'list' && (
        <div className="posy-social-row" onClick={e => e.stopPropagation()}>
          {page.tiles.filter((t): t is Extract<Tile, { type: 'social' }> => t.type === 'social').map(t => <SortableSocialIcon key={t.id} tile={t} />)}
        </div>
      )}
    </header>
  );
}

/** Clicking into a note continues it, rather than starting before the first word. */
const caretToEnd = (e: React.FocusEvent<HTMLTextAreaElement>) => { const v = e.currentTarget; v.setSelectionRange(v.value.length, v.value.length); };

function InlineText({ tile, desk }: { tile: Extract<Tile, { type: 'text' }>; desk?: boolean }) {
  const update = useStudio(s => s.updateTile);
  const big = tile.size === 'l' || tile.size === 't';
  if (desk) {
    return (
      <div className={cn('dk-note', `dk-note-${tile.size}`)} style={{ '--paper': tile.color === 'auto' ? 'var(--tint-butter)' : tile.color === 'surface' ? 'var(--surface)' : tile.color === 'accent' ? 'color-mix(in oklab, var(--accent) 30%, var(--surface))' : `var(--tint-${tile.color})` } as React.CSSProperties}>
        <textarea autoFocus aria-label="Note" value={tile.text} onFocus={caretToEnd} onChange={e => update(tile.id, { text: e.target.value })}
          onPointerDown={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}
          rows={Math.max(1, Math.ceil(tile.text.length / 22))} style={{ fieldSizing: 'content' } as React.CSSProperties}
          className={cn(blank, 'dk-hand max-h-full text-[25px] leading-[1.12]')} />
      </div>
    );
  }
  return (
    <div className={cn('flex h-full p-5', big ? 'items-end' : 'items-center')}>
      <textarea autoFocus aria-label="Note" value={tile.text} onFocus={caretToEnd} onChange={e => update(tile.id, { text: e.target.value })}
        onPointerDown={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}
        className={cn(blank, 'max-h-full font-medium leading-snug tracking-[-0.015em]', tile.size === 's' ? 'text-[15px]' : big ? 'text-[21px] leading-[1.3]' : 'text-[17px] leading-[1.45]')} />
    </div>
  );
}

function SortableTile({ tile, index, look }: { tile: Tile; index: number; look: StyleId }) {
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
      <TileShell tile={tile} index={index} editing look={look} className={cn('size-full cursor-grab active:cursor-grabbing', selected && 'outline outline-2 outline-offset-[3px] outline-[#e4572e]')}>
        {selected && tile.type === 'text' && tile.look !== 'stamp' && (look === 'minimal' || look === 'cozy') ? <InlineText tile={tile} desk={look === 'cozy'} /> : undefined}
      </TileShell>
      {selected && <TileToolbar tile={tile} />}
    </div>
  );
}

function SortableRow({ tile, index, ord, look }: { tile: Tile; index: number; ord?: number; look: StyleId }) {
  const selected = useStudio(s => s.selected === tile.id);
  const select = useStudio(s => s.select);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tile.id });
  return (
    <div ref={setNodeRef} data-tile={tile.id} aria-label={tileLabel(tile)} className={cn('relative', isDragging && 'opacity-30')}
      style={{ transform: CSS.Translate.toString(transform), transition, zIndex: selected ? 20 : undefined }}
      onClick={e => { e.stopPropagation(); select(tile.id); }} {...attributes} {...listeners}>
      <MotionShell index={index} lift={false} className={cn(look === 'minimal' ? 'posy-tile posy-row' : 'posy-row-st', 'group block cursor-grab active:cursor-grabbing', `posy-type-${tile.type}`, `posy-size-${tile.size}`, selected && 'outline outline-2 outline-offset-[3px] outline-[#e4572e]')}
        style={{ '--tile-bg': tileBackground(tile, index, brandHex(tile)) } as React.CSSProperties}>
        {look !== 'minimal' ? <StyleRow style={look} tile={tile} index={ord ?? index} /> : selected && tile.type === 'text' ? <InlineText tile={tile} /> : <ListItem tile={tile} />}
      </MotionShell>
      {selected && <TileToolbar tile={tile} />}
    </div>
  );
}

function SortableSocialIcon({ tile, desk }: { tile: Extract<Tile, { type: 'social' }>; desk?: boolean }) {
  const selected = useStudio(s => s.selected === tile.id);
  const select = useStudio(s => s.select);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tile.id });
  const p = PLATFORMS[tile.platform];
  return (
    <div ref={setNodeRef} data-tile={tile.id} aria-label={tileLabel(tile)} className={cn('relative', isDragging && 'opacity-30')}
      style={{ transform: CSS.Translate.toString(transform), transition, zIndex: selected ? 20 : undefined }}
      onClick={e => { e.stopPropagation(); select(tile.id); }} {...attributes} {...listeners}>
      <span className={cn(desk ? 'dk-stk cursor-grab' : 'grid size-11 cursor-grab place-items-center rounded-full border border-[color-mix(in_oklab,var(--text)_8%,transparent)] bg-[color-mix(in_oklab,var(--surface)_70%,transparent)]', selected && 'outline outline-2 outline-offset-2 outline-[#e4572e]')}>
        {p.icon?.path ? <BrandIcon path={p.icon.path} size={19} /> : tile.platform === 'email' ? <span className="text-[17px]">@</span> : <span className="text-[14px] font-bold">in</span>}
      </span>
      <span className="posy-social-label">{p.label}</span>
      {selected && <TileToolbar tile={tile} />}
    </div>
  );
}

function SortableHeading({ tile, list }: { tile: Extract<Tile, { type: 'heading' }>; list?: boolean }) {
  const selected = useStudio(s => s.selected === tile.id);
  const { select, updateTile } = useStudio();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tile.id });
  return (
    <div ref={setNodeRef} data-tile={tile.id} aria-label={tileLabel(tile)} className={cn('relative w-fit min-w-[12ch] px-1', list ? 'mx-auto mt-3 text-center' : 'mb-4', isDragging && 'opacity-30')}
      style={{ transform: CSS.Translate.toString(transform), transition }} onClick={e => { e.stopPropagation(); select(tile.id); }} {...attributes} {...listeners}>
      <input aria-label="Section title" value={tile.text} onChange={e => updateTile(tile.id, { text: e.target.value })} onPointerDown={e => selected && e.stopPropagation()} onKeyDown={e => e.stopPropagation()}
        className={cn(blank, 'posy-head rounded-md leading-tight [field-sizing:content]', list ? 'text-center text-[20px]' : 'text-[26px]', selected && 'outline outline-2 outline-offset-4 outline-[#e4572e]')} />
      {selected && <TileToolbar tile={tile} />}
    </div>
  );
}

function CanvasHeading({ tile, selected }: { tile: Extract<Tile, { type: 'heading' }>; selected: boolean }) {
  const updateTile = useStudio(s => s.updateTile);
  return (
    <input aria-label="Section title" value={tile.text} onChange={e => updateTile(tile.id, { text: e.target.value })}
      onPointerDown={e => selected && e.stopPropagation()} onKeyDown={e => e.stopPropagation()}
      className={cn(blank, 'posy-head posy-section w-full cursor-[inherit] text-[26px] leading-tight', selected && 'cursor-text')} />
  );
}

export function EditableCanvas({ page, device = 'desktop' }: { page: Page; device?: Device }) {
  const { moveTile, select } = useStudio();
  const [active, setActive] = useState<Tile | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onStart = (e: DragStartEvent) => { setActive(page.tiles.find(t => t.id === e.active.id) ?? null); select(String(e.active.id)); };
  const onEnd = (e: DragEndEvent) => { setActive(null); if (e.over && e.active.id !== e.over.id) moveTile(String(e.active.id), String(e.over.id)); };

  const list = page.theme.layout === 'list';
  const canvas = page.theme.layout === 'canvas';
  const look = page.theme.style;
  const gridTiles = socialsInHeader(page) ? page.tiles.filter(t => t.type !== 'social') : page.tiles;
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onStart} onDragEnd={onEnd} onDragCancel={() => setActive(null)}>
      <SortableContext items={page.tiles.map(t => t.id)} strategy={rectSortingStrategy}>
    {sceneFor(look) ? (
      <PageFrame page={{ ...page, badge: false }} className="posy-scene" profile={<></>} interactive={false}>
        <div onClick={() => select(null)}><EditableScene page={page} device={device} /></div>
      </PageFrame>
    ) : (
    <PageFrame page={{ ...page, badge: false }} profile={<EditableProfile page={page} />} interactive={false}>
          <div onClick={() => select(null)} className="min-h-[50vh] pb-40">
            {list && (
              <div className="posy-list">
                {page.tiles.map((tile, index) => tile.type === 'social' ? null : tile.type === 'heading' ? <SortableHeading key={tile.id} tile={tile} list /> : <SortableRow key={tile.id} tile={tile} index={index} ord={ordinals(page.tiles).get(tile.id)} look={look} />)}
              </div>
            )}
            {canvas && (
              <CanvasEditor page={page} labelFor={tileLabel}
                renderTile={(tile, index, selected) => (
                  <TileShell tile={tile} index={index} editing look={look} lift={false}>
                    {selected && tile.type === 'text' && tile.look !== 'stamp' && (look === 'minimal' || look === 'cozy') ? <InlineText tile={tile} desk={look === 'cozy'} /> : undefined}
                  </TileShell>
                )}
                renderHeading={(tile, selected) => <CanvasHeading tile={tile} selected={selected} />} />
            )}
            {!list && !canvas && sections(gridTiles).map((s, i) => (
              <section key={s.heading?.id ?? `top-${i}`} className="posy-grid-wrap">
                {s.heading && <SortableHeading tile={s.heading} />}
                <div className="posy-grid">
                  {s.tiles.map(({ tile, index }) => <SortableTile key={tile.id} tile={tile} index={index} look={look} />)}
                </div>
              </section>
            ))}
            {page.tiles.length === 0 && (
              <div className="grid h-[40vh] place-items-center rounded-[var(--radius-tile)] border-2 border-dashed border-[var(--line)] text-center text-[15px] text-[var(--muted)]">
                Paste any link to add your first tile
              </div>
            )}
          </div>
    </PageFrame>
    )}
        </SortableContext>
        <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' }}>
          {active && look !== 'minimal' && active.type !== 'heading' && active.type !== 'social' && (
            <div className="posy-obj rotate-[2deg] scale-[1.03]" style={{ width: '100%', height: '100%' }}>{list ? <StyleRow style={look} tile={active} index={page.tiles.indexOf(active)} /> : <StyleTile style={look} tile={active} index={page.tiles.indexOf(active)} editing />}</div>
          )}
          {active && look === 'minimal' && active.type !== 'heading' && !(list && active.type === 'social') && (
            <div className={cn('posy-tile shadow-2xl', 'rotate-[1.5deg] scale-[1.03]', list && 'posy-row')} style={{ '--tile-bg': tileBackground(active, page.tiles.indexOf(active), brandHex(active)), width: '100%', height: '100%' } as React.CSSProperties}>
              {list ? <ListItem tile={active} /> : <TileContent tile={active} editing />}
            </div>
          )}
        </DragOverlay>
      </DndContext>
  );
}
