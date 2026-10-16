// A Scene is a look that composes the whole page itself, instead of laying tiles on the shared grid.
// It draws a phone and a desktop arrangement of the same things (the public page shows the one that fits the width;
// the editor asks for the device it previews), and wraps every tile in `piece`, which the public page turns into a
// link and the editor into something you can select and drag.
import type { CSSProperties, ReactNode } from 'react';
import type { Page, Tile } from '@/lib/schema';
import type { HeaderSlots } from './types';

export type Device = 'desktop' | 'mobile';
export type PieceOpts = { key: string; className?: string; style?: CSSProperties };
export type PieceFn = (tile: Tile, node: ReactNode, opts: PieceOpts) => ReactNode;
export type SceneProps = { page: Page; slots: HeaderSlots; piece: PieceFn; only?: Device; editing?: boolean };

type Of<T extends Tile['type']> = Extract<Tile, { type: T }>;

/** Sorts tiles into the parts a scene arranges. */
function sort(tiles: Tile[]) {
  const is = <T extends Tile['type']>(t: Tile, type: T): t is Of<T> => t.type === type;
  return {
    socials: tiles.filter((t): t is Of<'social'> => is(t, 'social')),
    links: tiles.filter((t): t is Of<'link'> | Of<'github'> => is(t, 'link') || is(t, 'github')),
    media: tiles.filter((t): t is Of<'music'> | Of<'video'> => is(t, 'music') || is(t, 'video')),
    photos: tiles.filter((t): t is Of<'image'> => is(t, 'image')),
    notes: tiles.filter((t): t is Of<'text'> => is(t, 'text') && t.look !== 'stamp'),
    stamps: tiles.filter((t): t is Of<'text'> => is(t, 'text') && t.look === 'stamp'),
  };
}

/**
 * What's on a page, sorted into the parts a scene arranges. Order within each part is the page's own order.
 * `groups` is the same split once per section: the tiles before the first heading (no `heading`), then one group per
 * heading holding the tiles up to the next one. The flat parts are unchanged, so a scene that ignores headings still works.
 */
export function anatomy(tiles: Tile[]) {
  const groups: ({ heading?: Of<'heading'> } & ReturnType<typeof sort>)[] = [];
  let heading: Of<'heading'> | undefined, run: Tile[] = [];
  const flush = () => { if (heading || run.length) groups.push({ heading, ...sort(run) }); };
  for (const t of tiles) {
    if (t.type === 'heading') { flush(); heading = t; run = []; } else run.push(t);
  }
  flush();
  return { ...sort(tiles), headings: tiles.filter((t): t is Of<'heading'> => t.type === 'heading'), groups };
}

/** Both arrangements on the public page (CSS shows the one that fits); just one in the editor. */
export function Arrangements({ only, desktop, mobile }: { only?: Device; desktop: () => ReactNode; mobile: () => ReactNode }) {
  return (
    <>
      {only !== 'mobile' && <div className="sc-desktop" data-only={only}>{desktop()}</div>}
      {only !== 'desktop' && <div className="sc-mobile" data-only={only}>{mobile()}</div>}
    </>
  );
}
