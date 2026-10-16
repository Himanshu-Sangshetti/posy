// Visual styles: each draws the same page its own way. Layout (grid, list or canvas) is chosen separately.
// Minimal is the base renderer (PageView's cards); every other style registers its own header, tile and list row.
import type { ComponentType } from 'react';
import type { Page, Tile } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { CozyRow } from '../desk';
import { WashiRow } from './washi';
import { LofiRow } from './lofi';
import { LofiScene, LofiCanvasTile, LofiCanvasHeaderBase } from './lofi-scene';
import { WashiScene, WashiCanvasHeader, WashiCanvasTile } from './washi-scene';
import { PaintedScene, PaintedCanvasHeader, PaintedCanvasTile } from './painted-scene';
import { DeskScene, DeskCanvasHeader, DeskCanvasTile } from './desk-scene';
import { PaintedRow } from './painted';
import { NightHeader, NightTile, NightRow } from './night';
import { CobaltHeader, CobaltTile, CobaltRow } from './cobalt';
import type { HeaderSlots } from './types';
import type { SceneProps } from './scene';
import './styles.css';
import './minimal.css';
import './washi.css';
import './lofi.css';
import './scene.css';
import './lofi-scene.css';
import './washi-scene.css';
import './painted-scene.css';
import './desk-scene.css';
import './painted.css';
import './night.css';
import './cobalt.css';

export type StyleId = Page['theme']['style'];

type Renderer = {
  Header: ComponentType<{ page: Page; slots: HeaderSlots }>;
  Tile: ComponentType<{ tile: Tile; index: number; editing?: boolean }>;
  Row: ComponentType<{ tile: Tile; index: number }>;
  /** Looks that compose the whole page themselves (phone and desktop), instead of using the grid, list or canvas. */
  Scene?: ComponentType<SceneProps>;
};

const RENDERERS: Partial<Record<StyleId, Renderer>> = {
  // scene looks: Header and Tile are what the Canvas layout draws, in the look's own kit (Grid and List show the Scene)
  cozy: { Header: ({ slots }) => <DeskCanvasHeader slots={slots} />, Tile: DeskCanvasTile, Row: CozyRow, Scene: DeskScene },
  washi: { Header: WashiCanvasHeader, Tile: WashiCanvasTile, Row: WashiRow, Scene: WashiScene },
  lofi: { Header: ({ page, slots }) => <LofiCanvasHeaderBase name={page.profile.name} slots={slots} />, Tile: LofiCanvasTile, Row: LofiRow, Scene: LofiScene },
  painted: { Header: PaintedCanvasHeader, Tile: PaintedCanvasTile, Row: PaintedRow, Scene: PaintedScene },
  night: { Header: NightHeader, Tile: NightTile, Row: NightRow },
  cobalt: { Header: CobaltHeader, Tile: CobaltTile, Row: CobaltRow },
};

/** Every style except Minimal shows social links as a row in the header rather than as tiles. */
export const socialsInHeader = (page: Page) => page.theme.style !== 'minimal' || page.theme.layout === 'list';

type Layout = Pick<Page['theme'], 'style' | 'layout'>;
/**
 * The look's own page composition, if it has one and the layout uses it. Grid shows the scene (its desktop and phone
 * arrangements), List shows its phone arrangement at every width, Canvas places the look's tiles freely (no scene).
 */
export const sceneFor = (t: Layout) => t.layout === 'canvas' ? undefined : RENDERERS[t.style]?.Scene;
/** List keeps the scene's phone arrangement on every screen. */
export const sceneOnly = (t: Layout) => t.layout === 'list' ? 'mobile' as const : undefined;
/** The look composes its page itself in some layout (so it shows a scene in Grid and List). */
export const hasScene = (style: StyleId) => !!RENDERERS[style]?.Scene;

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
