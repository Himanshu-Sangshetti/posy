// Visual styles: each draws the same page its own way. Layout (grid, list or canvas) is chosen separately.
// Minimal is the base renderer (PageView's cards); every other style registers its own header, tile and list row.
import type { ComponentType } from 'react';
import type { Page, Tile } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { DeskTile, CozyHeader, CozyRow } from '../desk';
import { WashiHeader, WashiTile, WashiRow } from './washi';
import { LofiHeader, LofiTile, LofiRow } from './lofi';
import { PressHeader, PressTile, PressRow } from './press';
import { GalleryHeader, GalleryTile, GalleryRow } from './gallery';
import { PaintedHeader, PaintedTile, PaintedRow } from './painted';
import { NightHeader, NightTile, NightRow } from './night';
import type { HeaderSlots } from './types';
import './styles.css';
import './minimal.css';
import './washi.css';
import './lofi.css';
import './press.css';
import './gallery.css';
import './painted.css';
import './night.css';

export type StyleId = Page['theme']['style'];

type Renderer = {
  Header: ComponentType<{ page: Page; slots: HeaderSlots }>;
  Tile: ComponentType<{ tile: Tile; index: number; editing?: boolean }>;
  Row: ComponentType<{ tile: Tile; index: number }>;
};

const RENDERERS: Partial<Record<StyleId, Renderer>> = {
  cozy: { Header: ({ slots }) => <CozyHeader slots={slots} />, Tile: DeskTile, Row: CozyRow },
  washi: { Header: WashiHeader, Tile: WashiTile, Row: WashiRow },
  lofi: { Header: ({ page, slots }) => <LofiHeader name={page.profile.name} slots={slots} />, Tile: LofiTile, Row: LofiRow },
  press: { Header: PressHeader, Tile: PressTile, Row: PressRow },
  gallery: { Header: GalleryHeader, Tile: GalleryTile, Row: GalleryRow },
  painted: { Header: PaintedHeader, Tile: PaintedTile, Row: PaintedRow },
  night: { Header: NightHeader, Tile: NightTile, Row: NightRow },
};

/** Every style except Minimal shows social links as a row in the header rather than as tiles. */
export const socialsInHeader = (page: Page) => page.theme.style !== 'minimal' || page.theme.layout === 'list';

export function StyleHeader({ page, slots }: { page: Page; slots: HeaderSlots }) {
  const R = RENDERERS[page.theme.style];
  // display: contents keeps the header's own layout; the variable lets long names scale down in CSS.
  return <div style={{ display: 'contents', '--nlen': page.profile.name.length } as React.CSSProperties}>{R && <R.Header page={page} slots={slots} />}</div>;
}

export function StyleTile({ style, tile, index, editing }: { style: StyleId; tile: Tile; index: number; editing?: boolean }) {
  const R = RENDERERS[style];
  return R ? <R.Tile tile={tile} index={index} editing={editing} /> : null;
}

export function StyleRow({ style, tile, index }: { style: StyleId; tile: Tile; index: number }) {
  const R = RENDERERS[style];
  return R ? <R.Row tile={tile} index={index} /> : null;
}

export const headerClass = (style: StyleId) => cn('posy-profile', `st-head st-head-${style}`, style === 'cozy' && 'dk-profile');
