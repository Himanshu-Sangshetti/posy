// Visual styles: each draws the same page its own way. Layout (grid or list) is chosen separately.
// Minimal is the base renderer (PageView's cards); Desk, Washi and Lofi draw their own header, tiles and rows.
import type { Page, Tile } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { DeskTile, CozyHeader, CozyRow } from '../desk';
import { WashiHeader, WashiTile, WashiRow } from './washi';
import { LofiHeader, LofiTile, LofiRow } from './lofi';
import type { HeaderSlots } from './types';
import './styles.css';
import './minimal.css';
import './washi.css';
import './lofi.css';

export type StyleId = Page['theme']['style'];

/** Every style except Minimal shows social links as a row in the header rather than as tiles. */
export const socialsInHeader = (page: Page) => page.theme.style !== 'minimal' || page.theme.layout === 'list';

export function StyleHeader({ page, slots }: { page: Page; slots: HeaderSlots }) {
  // display: contents keeps the header's own layout; the variable lets long names scale down in CSS.
  return <div style={{ display: 'contents', '--nlen': page.profile.name.length } as React.CSSProperties}>{styledHeader(page, slots)}</div>;
}

function styledHeader(page: Page, slots: HeaderSlots) {
  switch (page.theme.style) {
    case 'cozy': return <CozyHeader slots={slots} />;
    case 'washi': return <WashiHeader name={page.profile.name} slots={slots} />;
    case 'lofi': return <LofiHeader name={page.profile.name} slots={slots} />;
    default: return null;
  }
}

export function StyleTile({ style, tile, index, editing }: { style: StyleId; tile: Tile; index: number; editing?: boolean }) {
  switch (style) {
    case 'cozy': return <DeskTile tile={tile} editing={editing} />;
    case 'washi': return <WashiTile tile={tile} index={index} editing={editing} />;
    case 'lofi': return <LofiTile tile={tile} index={index} editing={editing} />;
    default: return null;
  }
}

export function StyleRow({ style, tile, index }: { style: StyleId; tile: Tile; index: number }) {
  switch (style) {
    case 'cozy': return <CozyRow tile={tile} />;
    case 'washi': return <WashiRow tile={tile} index={index} />;
    case 'lofi': return <LofiRow tile={tile} index={index} />;
    default: return null;
  }
}

export const headerClass = (style: StyleId) => cn('posy-profile', `st-head st-head-${style}`, style === 'cozy' && 'dk-profile');
