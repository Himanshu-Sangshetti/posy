import { describe, it, expect } from 'vitest';
import { tileFromInput, youtubeId, spotifyEmbed, isImageRef } from '@/lib/detect';

const t = (s: string) => tileFromInput(s);
describe('pasting a link picks the right tile', () => {
  it('social profiles', () => {
    expect(t('https://x.com/himanshutwtxs')).toMatchObject({ type: 'social', platform: 'x', handle: 'himanshutwtxs' });
    expect(t('twitter.com/jack')).toMatchObject({ type: 'social', platform: 'x', handle: 'jack' });
    expect(t('https://www.instagram.com/someone/')).toMatchObject({ platform: 'instagram', handle: 'someone' });
    expect(t('https://linkedin.com/in/jane-doe')).toMatchObject({ platform: 'linkedin', handle: 'jane-doe' });
    expect(t('https://www.youtube.com/@creator')).toMatchObject({ platform: 'youtube', handle: 'creator' });
    expect(t('https://bsky.app/profile/me.bsky.social')).toMatchObject({ platform: 'bluesky', handle: 'me.bsky.social' });
    expect(t('https://writer.substack.com')).toMatchObject({ platform: 'substack', handle: 'writer' });
    expect(t('https://github.com/octocat')).toMatchObject({ platform: 'github', handle: 'octocat' });
    expect(t('hello@example.com')).toMatchObject({ platform: 'email', handle: 'hello@example.com' });
  });
  it('rich tiles', () => {
    expect(t('https://github.com/vercel/next.js')).toMatchObject({ type: 'github', repo: 'vercel/next.js', size: 'w' });
    expect(t('vercel/next.js')).toMatchObject({ type: 'github', repo: 'vercel/next.js' });
    expect(t('pmndrs/zustand')).toMatchObject({ type: 'github', repo: 'pmndrs/zustand' });
    expect(t('example.com/about')).toMatchObject({ type: 'link' });
    expect(t('https://youtu.be/dQw4w9WgXcQ')).toMatchObject({ type: 'video' });
    expect(t('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toMatchObject({ type: 'video' });
    expect(t('https://open.spotify.com/track/abc123')).toMatchObject({ type: 'music' });
    expect(t('https://cdn.site.com/pic.webp')).toMatchObject({ type: 'image' });
  });
  it('falls back sensibly', () => {
    expect(t('https://example.com/blog/post')).toMatchObject({ type: 'link' });
    expect(t('just a thought')).toMatchObject({ type: 'text', text: 'just a thought' });
    expect(t('https://x.com/home')).toMatchObject({ type: 'link' });
  });
  it('helpers', () => {
    expect(youtubeId('https://youtube.com/shorts/abcDEF123')).toBe('abcDEF123');
    expect(spotifyEmbed('https://open.spotify.com/intl-de/album/XyZ')).toBe('https://open.spotify.com/embed/album/XyZ');
  });
});

describe('pasting a picture address makes an image tile', () => {
  it('on any host, even without a dot, and for bare paths', () => {
    expect(t('http://localhost:3200/samples/lemon.jpg')).toMatchObject({ type: 'image', src: 'http://localhost:3200/samples/lemon.jpg' });
    expect(t('/samples/tea.jpg')).toMatchObject({ type: 'image', src: '/samples/tea.jpg' });
    expect(t('samples/tea.png')).toMatchObject({ type: 'image' });
    expect(t('https://cdn.site.com/a/b.AVIF?w=400')).toMatchObject({ type: 'image' });
    for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg']) expect(t(`/x/pic.${ext}`)).toMatchObject({ type: 'image' });
  });
  it('leaves everything else alone', () => {
    expect(isImageRef('a photo of tea.jpg')).toBe(false);
    expect(isImageRef('tea.jpg')).toBe(false);
    expect(t('/samples/tea.pdf')).toMatchObject({ type: 'text' });
    expect(t('vercel/next.js')).toMatchObject({ type: 'github' });
  });
});
