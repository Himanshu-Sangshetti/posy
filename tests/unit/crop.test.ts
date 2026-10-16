import { describe, expect, it } from 'vitest';
import { cropStyle, zoomOf } from '@/lib/crop';
import { parsePage } from '@/lib/schema';

describe('cropStyle', () => {
  it('leaves an uncropped picture alone', () => {
    expect(cropStyle({})).toBeUndefined();
    expect(cropStyle({ zoom: 1 })).toBeUndefined();
  });
  it('positions and zooms around the focal point', () => {
    expect(cropStyle({ focus: { x: 20, y: 80 }, zoom: 2 })).toEqual({ objectPosition: '20% 80%', transform: 'scale(2)', transformOrigin: '20% 80%' });
    expect(cropStyle({ focus: { x: 0, y: 100 } })).toEqual({ objectPosition: '0% 100%' });
    expect(zoomOf(cropStyle({ zoom: 1.5 }))).toBe(1.5);
  });
});

describe('crop in the page schema', () => {
  it('accepts focus and zoom on image tiles and the avatar, and rejects out-of-range values', () => {
    const ok = parsePage({ profile: { name: 'A', avatarFocus: { x: 10, y: 90 }, avatarZoom: 2 }, tiles: [{ id: 'a', type: 'image', src: '/x.jpg', focus: { x: 30, y: 40 }, zoom: 1.5 }] });
    expect(ok.tiles[0]).toMatchObject({ focus: { x: 30, y: 40 }, zoom: 1.5 });
    expect(() => parsePage({ profile: { name: 'A' }, tiles: [{ id: 'a', type: 'image', src: '/x.jpg', zoom: 5 }] })).toThrow();
    expect(() => parsePage({ profile: { name: 'A' }, tiles: [{ id: 'a', type: 'image', src: '/x.jpg', focus: { x: 120, y: 0 } }] })).toThrow();
  });
});
