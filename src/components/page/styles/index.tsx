// Visual styles: each draws the same page its own way. Layout (grid or list) is chosen separately.
import type { Page, Tile } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { DeskTile, CozyHeader, CozyRow } from '../desk';
import { TerminalHeader, TerminalTile, TerminalRow } from './terminal';
import { NeonHeader, NeonTile, NeonRow } from './neon';
import { EditorialHeader, EditorialTile, EditorialRow } from './editorial';
import type { HeaderSlots } from './types';
import './styles.css';

export type StyleId = Page['theme']['style'];

/** Every style except Soft shows social links as a row in the header rather than as tiles. */
export const socialsInHeader = (page: Page) => page.theme.style !== 'soft' || page.theme.layout === 'list';

export function StyleHeader({ page, slots }: { page: Page; slots: HeaderSlots }) {
  switch (page.theme.style) {
    case 'cozy': return <CozyHeader slots={slots} />;
    case 'terminal': return <TerminalHeader name={page.profile.name} slots={slots} />;
    case 'neon': return <NeonHeader name={page.profile.name} slots={slots} />;
    case 'editorial': return <EditorialHeader slots={slots} />;
    default: return null;
  }
}

export function StyleTile({ style, tile, index, editing }: { style: StyleId; tile: Tile; index: number; editing?: boolean }) {
  switch (style) {
    case 'cozy': return <DeskTile tile={tile} editing={editing} />;
    case 'terminal': return <TerminalTile tile={tile} editing={editing} />;
    case 'neon': return <NeonTile tile={tile} index={index} editing={editing} />;
    case 'editorial': return <EditorialTile tile={tile} index={index} editing={editing} />;
    default: return null;
  }
}

export function StyleRow({ style, tile, index }: { style: StyleId; tile: Tile; index: number }) {
  switch (style) {
    case 'cozy': return <CozyRow tile={tile} />;
    case 'terminal': return <TerminalRow tile={tile} />;
    case 'neon': return <NeonRow tile={tile} index={index} />;
    case 'editorial': return <EditorialRow tile={tile} index={index} />;
    default: return null;
  }
}

export const headerClass = (style: StyleId) => cn('posy-profile', `st-head st-head-${style}`, style === 'cozy' && 'dk-profile');
