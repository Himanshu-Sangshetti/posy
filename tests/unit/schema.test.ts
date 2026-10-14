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
  it('black brands get a pastel, colourful brands a tint of their own colour', () => {
    const x = { id: 'a', type: 'social', platform: 'x', handle: 'a', size: 's', color: 'auto' } as const;
    expect(tileBackground(x, 0, '000000')).toBe('var(--tint-peach)');
    expect(tileBackground({ ...x, platform: 'instagram' }, 0, 'FF0069')).toContain('#FF0069');
  });
});

describe('styles', () => {
  it('turns the old desk layout into the cozy style, and keeps older pages soft', () => {
    expect(parsePage({ profile: { name: 'A' }, theme: { layout: 'desk' } }).theme).toMatchObject({ style: 'cozy', layout: 'bento' });
    expect(parsePage({ profile: { name: 'A' }, theme: { layout: 'list' } }).theme).toMatchObject({ style: 'soft', layout: 'list' });
    expect(parsePage({ profile: { name: 'A' }, theme: { style: 'neon', layout: 'list' } }).theme.style).toBe('neon');
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
