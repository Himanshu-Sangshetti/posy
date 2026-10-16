import { describe, it, expect } from 'vitest';
import { starterPage } from '@/lib/templates';
import { STYLE_IDS } from '@/lib/styles';

describe('starter pages', () => {
  it('an empty page carries none of the sample persona, in every look', () => {
    for (const style of STYLE_IDS) {
      const p = starterPage({ name: 'Ada Lovelace', style, empty: true });
      expect(p.tiles).toEqual([]);
      expect(p.profile.name).toBe('Ada Lovelace');
      expect(p.profile.bio ?? '').toBe('');
      expect(p.profile.avatar).toBeFalsy();
      expect(p.profile.location).toBeFalsy();
    }
  });
  it('a sample page keeps its sample content', () => {
    expect(starterPage({ name: 'Ada', style: 'cobalt' }).tiles.length).toBeGreaterThan(5);
  });
});
