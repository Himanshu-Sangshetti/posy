import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { Page, parsePage } from '@/lib/schema';
import { THEMES, TINTS, themeVars } from '@/lib/themes';
import { tileBackground } from '@/lib/style';

describe('page format', () => {
  it('fills sensible defaults from a minimal page', () => {
    const p = parsePage({ profile: { name: 'Ada' } });
    expect(p.theme).toMatchObject({ preset: 'cream', font: 'editorial', radius: 'round', style: 'cozy', layout: 'bento', align: 'side', tileStyle: 'soft', effect: 'lift', motion: true });
    expect(p.theme.background).toMatchObject({ style: 'solid', grain: true });
    expect(p.version).toBe(2);
    expect(p.tiles).toEqual([]);
    expect(p.badge).toBe(true);
  });
  it('migrates v1 layouts', () => {
    expect(parsePage({ version: 1, profile: { name: 'A' }, theme: { layout: 'split' } }).theme).toMatchObject({ layout: 'bento', align: 'side' });
    expect(parsePage({ version: 1, profile: { name: 'A' }, theme: { layout: 'stack' } }).theme).toMatchObject({ layout: 'bento', align: 'center' });
  });
  it('rejects bad input with a useful path', () => {
    const r = Page.safeParse({ profile: { name: 'Ada' }, tiles: [{ id: 'x', type: 'github', repo: 'not a repo' }] });
    expect(r.success).toBe(false);
    expect(r.error!.issues[0].path).toEqual(['tiles', 0, 'repo']);
  });
  it('ships valid content and examples', () => {
    for (const f of fs.readdirSync('examples').map(f => `examples/${f}`))
      expect(Page.safeParse(JSON.parse(fs.readFileSync(f, 'utf8'))).success, f).toBe(true);
  });
  it('tile ids are unique in shipped pages', () => {
    for (const f of fs.readdirSync('examples').map(f => `examples/${f}`)) {
      const ids = JSON.parse(fs.readFileSync(f, 'utf8')).tiles.map((t: { id: string }) => t.id);
      expect(new Set(ids).size, f).toBe(ids.length);
    }
  });
});

describe('themes', () => {
  it('every theme defines every token', () => {
    for (const t of Object.values(THEMES)) {
      for (const k of TINTS) expect(t.tints[k], `${t.id}.${k}`).toMatch(/^#[0-9a-f]{6}$/i);
      for (const k of ['bg', 'surface', 'text', 'muted', 'line', 'accent'] as const) expect(t[k], `${t.id}.${k}`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
  it('accent override wins', () => {
    expect(themeVars('cream', '#123456')['--accent']).toBe('#123456');
  });
  it('keeps auto tiles plain, and uses a colour only when one was picked', () => {
    const x = { id: 'a', type: 'social', platform: 'x', handle: 'a', size: 's', color: 'auto' } as const;
    expect(tileBackground(x, 0, '000000')).toBe('var(--surface)');
    expect(tileBackground({ ...x, platform: 'instagram' }, 3, 'FF0069')).toBe('var(--surface)');
    expect(tileBackground({ ...x, color: 'mint' }, 0)).toBe('var(--tint-mint)');
  });
});

describe('styles', () => {
  it('turns the old desk layout into the cozy style, and moves retired styles to the closest new one', () => {
    expect(parsePage({ profile: { name: 'A' }, theme: { layout: 'desk' } }).theme).toMatchObject({ style: 'cozy', layout: 'bento' });
    expect(parsePage({ profile: { name: 'A' }, theme: { layout: 'list' } }).theme).toMatchObject({ style: 'minimal', layout: 'list' });
    expect(parsePage({ profile: { name: 'A' }, theme: { style: 'neon', layout: 'list' } }).theme.style).toBe('lofi');
    for (const s of ['soft', 'editorial', 'terminal']) expect(parsePage({ profile: { name: 'A' }, theme: { style: s } }).theme.style).toBe('minimal');
    expect(parsePage({ profile: { name: 'A' }, theme: { style: 'washi' } }).theme.style).toBe('washi');
  });

  it('turns blended backgrounds into a solid colour', () => {
    for (const b of ['gradient', 'mesh', 'aurora']) expect(parsePage({ profile: { name: 'A' }, theme: { background: { style: b } } }).theme.background.style).toBe('solid');
    expect(parsePage({ profile: { name: 'A' }, theme: { background: { style: 'dots' } } }).theme.background.style).toBe('dots');
  });
});

describe('desk layout', () => {
  it('keeps the note look and music cover art', () => {
    const p = parsePage({ profile: { name: 'Ada' }, tiles: [
      { id: 'a', type: 'text', text: 'Open for work', look: 'stamp' },
      { id: 'b', type: 'music', url: 'https://open.spotify.com/track/x', title: 'Song', image: 'https://i.scdn.co/image/x' },
    ] });
    expect(p.tiles[0]).toMatchObject({ look: 'stamp' });
    expect(p.tiles[1]).toMatchObject({ title: 'Song', image: 'https://i.scdn.co/image/x' });
  });
  it('tilts each tile the same way every time, within a small range', async () => {
    const { deskTilt } = await import('../../src/components/page/desk');
    const t = { id: 't-abc1234', type: 'text', text: 'hi', size: 's', color: 'auto' } as const;
    expect(deskTilt(t)).toBe(deskTilt(t));
    expect(Math.abs(deskTilt(t))).toBeLessThanOrEqual(2.8);
  });
});

describe('canvas layout', () => {
  it('accepts the canvas layout and free tile positions', () => {
    const p = parsePage({ profile: { name: 'A' }, theme: { layout: 'canvas' }, tiles: [{ id: 'a', type: 'text', text: 'hi', pos: { x: 10, y: 20, w: 300, h: 200 } }] });
    expect(p.theme.layout).toBe('canvas');
    expect(p.tiles[0].pos).toEqual({ x: 10, y: 20, w: 300, h: 200, r: 0, z: 0 });
  });
  it('keeps old pages valid without positions', () => {
    const p = parsePage({ profile: { name: 'A' }, tiles: [{ id: 'a', type: 'text', text: 'hi' }] });
    expect(p.tiles[0].pos).toBeUndefined();
  });
  it('rejects rotations beyond ±15 and positions off the canvas', () => {
    const bad = (pos: object) => Page.safeParse({ profile: { name: 'A' }, tiles: [{ id: 'a', type: 'text', text: 'hi', pos: { x: 0, y: 0, w: 100, h: 100, ...pos } }] }).success;
    expect(bad({ r: 20 })).toBe(false);
    expect(bad({ x: 1300 })).toBe(false);
    expect(bad({ w: 2000 })).toBe(false);
    expect(bad({ z: 1.5 })).toBe(false);
    expect(bad({ r: -15, z: -3 })).toBe(true);
  });
});
