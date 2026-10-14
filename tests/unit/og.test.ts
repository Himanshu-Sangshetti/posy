import { describe, it, expect } from 'vitest';
import { alpha, blockPattern, clip, faviconKind, fitSize, glowFor, initials, mix, pickTiles, plain, safe, slug } from '@/lib/og/util';

describe('share image helpers', () => {
  it('clips on a word boundary', () => {
    expect(clip('short', 20)).toBe('short');
    expect(clip('one two three four', 12)).toBe('one two…');
    expect(clip('Supercalifragilistic', 8)).toBe('Supercal…');
  });
  it('strips markup and symbols the fonts cannot draw', () => {
    expect(plain('a **bold** [link](https://x.com) b')).toBe('a bold link b');
    expect(safe('garden study, spring ✿ 🌸 café')).toBe('garden study, spring café');
  });
  it('mixes and fades hex colours', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(alpha('#ff0000', 0.5)).toBe('rgba(255,0,0,0.5)');
  });
  it('makes shell-friendly slugs and initials', () => {
    expect(slug('Mira Sol!')).toBe('mira-sol');
    expect(slug('***')).toBe('me');
    expect(initials('mira sol')).toBe('MS');
  });
  it('shrinks the name until it fits', () => {
    expect(fitSize('Jo', [100, 80, 60], 600, 0.5)).toBe(100);
    expect(fitSize('A very long display name', [100, 80, 60], 600, 0.5)).toBe(60);
  });
  it('picks pictures first, never headings or socials, and keeps page order', () => {
    const tiles = [
      { type: 'heading' }, { type: 'social' }, { type: 'text' }, { type: 'link' }, { type: 'image' }, { type: 'music' },
    ];
    expect(pickTiles(tiles, 3).map(t => t.type)).toEqual(['link', 'image', 'music']);
    expect(pickTiles([], 3)).toEqual([]);
  });
  it('draws the same little glyph for the same name, mirrored', () => {
    const a = blockPattern('Mira Sol', 9, 5);
    expect(a).toEqual(blockPattern('Mira Sol', 9, 5));
    expect(a).not.toEqual(blockPattern('Someone Else', 9, 5));
    for (const row of a) expect(row).toEqual([...row].reverse());
    expect(a).toHaveLength(5);
  });
  it('colours neon panels like the page does', () => {
    expect(glowFor('#ff3ea5', 'mint', 0)).toBe('#3dffb5');
    expect(glowFor('#ff3ea5', 'accent', 2)).toBe('#ff3ea5');
    expect(glowFor('#ff3ea5', 'auto', 1)).toBe('#2be4ff');
  });
  it('maps each style to its favicon drawing, and falls back to cozy', () => {
    expect(faviconKind('lofi')).toBe('neon');
    expect(faviconKind('washi')).toBe('editorial');
    expect(faviconKind('minimal')).toBe('soft');
    expect(faviconKind('whatever')).toBe('cozy');
    expect(faviconKind(undefined)).toBe('cozy');
  });
});
