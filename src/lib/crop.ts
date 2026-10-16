import type { CSSProperties } from 'react';
import type { FocusPoint } from './schema';

type Cropped = { focus?: FocusPoint; zoom?: number };

/** Style for the <img> inside a clipped frame: keeps `focus` in view and zooms around it. Nothing is set for an uncropped picture. */
export function cropStyle(tile: object | undefined): CSSProperties | undefined {
  const c = tile as Cropped | undefined;
  if (!c || (!c.focus && !(c.zoom && c.zoom > 1))) return undefined;
  const x = c.focus?.x ?? 50, y = c.focus?.y ?? 50, z = c.zoom ?? 1;
  const s: CSSProperties = { objectPosition: `${x}% ${y}%` };
  if (z > 1) { s.transform = `scale(${z})`; s.transformOrigin = `${x}% ${y}%`; }
  return s;
}

/** The same, for the profile avatar. */
export const avatarCrop = (p: { avatarFocus?: FocusPoint; avatarZoom?: number }) => cropStyle({ focus: p.avatarFocus, zoom: p.avatarZoom });

/** The zoom a crop style carries (1 when none). */
export const zoomOf = (s: CSSProperties | undefined) => Number(/scale\(([\d.]+)\)/.exec(String(s?.transform ?? ''))?.[1]) || 1;
