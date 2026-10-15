import { parsePage, newId, type Page } from './schema';
import type { StyleId } from './styles';

export const TEMPLATES = {
  desk: { label: 'Desk', note: 'Polaroids and notes in the afternoon sun' },
  writer: { label: 'Washi', note: 'Paper, ink and a red seal' },
  developer: { label: 'Developer', note: 'Repos up front, in ink' },
  night: { label: 'Lofi', note: 'A desktop left open' },
  creator: { label: 'Minimal', note: 'Ink and paper, photos in 1-bit' },
  links: { label: 'Links', note: 'A clean list, like Linktree' },
  blank: { label: 'Blank', note: 'Start from nothing' },
} as const;
export type TemplateId = keyof typeof TEMPLATES;

const ids = (tiles: Record<string, unknown>[]) => tiles.map(t => ({ ...t, id: newId() }));

/** Starter pages. Links point to the platforms' home pages until the user edits them. */
export function template(id: TemplateId, name: string): Page {
  // A small painted posy stands in for a photo until people add their own.
  const profile = { name: name || 'Your name', bio: '', avatar: '/samples/posy.jpg' };
  switch (id) {
    case 'desk':
      return parsePage({
        profile: { ...profile, bio: 'I make small, soft things on the internet. Say hi.', location: 'hello from home' },
        theme: { style: 'cozy', preset: 'cream', font: 'editorial', layout: 'canvas', avatar: 'square' },
        tiles: ids([
          { type: 'social', platform: 'instagram', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'x', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'youtube', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'email', handle: 'you@example.com', size: 's' },
          { type: 'image', src: '/samples/flowers.jpg', caption: 'spring, again ✿', size: 'l' },
          { type: 'text', text: 'Currently working on something new. Updates soon!', size: 's' },
          { type: 'text', text: 'Open for work', look: 'stamp', color: 'lilac', size: 's' },
          { type: 'music', url: 'https://open.spotify.com/', title: 'My song of the week', artist: 'Spotify', image: '/samples/petunia.jpg', size: 'w' },
          { type: 'heading', text: 'things I make' },
          { type: 'link', url: 'https://substack.com', title: 'My newsletter', description: 'Dear friend, this week I tried something new…', image: '/samples/tea.jpg', size: 'w' },
          { type: 'link', url: 'https://example.com', title: 'My website', size: 'w' },
          { type: 'link', url: 'https://gumroad.com', title: 'Shop', image: '/samples/berries.jpg', size: 's' },
          { type: 'image', src: '/samples/lemon.jpg', caption: 'lately', size: 's' },
        ]),
      });
    case 'writer':
      return parsePage({
        profile: { ...profile, bio: 'Writer and editor. Essays about small things, mostly.', location: 'Lisbon' },
        theme: { style: 'washi', preset: 'kinari', font: 'washi', layout: 'bento', avatar: 'square' },
        tiles: ids([
          { type: 'social', platform: 'substack', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'x', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'email', handle: 'you@example.com', size: 's' },
          { type: 'link', url: 'https://substack.com', title: 'The newsletter', description: 'A letter every other Sunday about the things I noticed.', image: '/samples/tea.jpg', size: 'l' },
          { type: 'text', text: 'The best ideas arrive on long walks.', size: 'w' },
          { type: 'link', url: 'https://example.com/essays', title: 'Selected essays', description: 'Ten pieces I still like', size: 'w' },
          { type: 'heading', text: 'Elsewhere' },
          { type: 'image', src: '/samples/lemon.jpg', caption: 'Notes from the kitchen', size: 's' },
          { type: 'link', url: 'https://example.com', title: 'Talks and interviews', size: 's' },
        ]),
      });
    case 'night':
      return parsePage({
        profile: { ...profile, bio: 'Building weird things after dark. Synths, shaders, side projects.', location: 'online now' },
        theme: { style: 'lofi', preset: 'daydream', font: 'lofi', layout: 'canvas' },
        // A collage: windows overlap and lean a little, like a desktop left open.
        tiles: ids([
          { type: 'social', platform: 'github', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'x', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'youtube', handle: 'yourname', size: 's' },
          { type: 'image', src: '/samples/flowers.jpg', caption: 'render_042.png', size: 'l', pos: { x: 16, y: 40, w: 600, h: 452, r: -1.5, z: 1 } },
          { type: 'text', text: 'Now: shipping a tiny synth in the browser.', size: 's', pos: { x: 560, y: 0, w: 300, h: 232, r: 2.5, z: 3 } },
          { type: 'github', repo: 'vercel/next.js', size: 's', pos: { x: 900, y: 56, w: 284, h: 284, r: -2, z: 2 } },
          { type: 'music', url: 'https://open.spotify.com/', title: 'Night drive', artist: 'Spotify', image: '/samples/petunia.jpg', size: 'w', pos: { x: 640, y: 300, w: 544, h: 252, r: 1, z: 4 } },
          { type: 'link', url: 'https://example.com', title: 'Devlog', description: 'What I built this week', size: 'w', pos: { x: 96, y: 520, w: 480, h: 228, r: 1.5, z: 5 } },
        ]),
      });
    case 'creator':
      return parsePage({
        profile: { ...profile, bio: 'Making things on the internet. Say hi.' },
        theme: { style: 'minimal', preset: 'paper', font: 'editorial', layout: 'bento', align: 'side' },
        tiles: ids([
          { type: 'social', platform: 'instagram', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'youtube', handle: 'yourname', size: 's' },
          { type: 'image', src: '/samples/flowers.jpg', caption: 'lately', size: 'l' },
          { type: 'text', text: 'Currently working on **something new**. Updates soon.', size: 'w' },
          { type: 'heading', text: 'Latest' },
          { type: 'link', url: 'https://example.com', title: 'My latest project', description: 'What I made this month', image: '/samples/tea.jpg', size: 'w' },
          { type: 'music', url: 'https://open.spotify.com/', title: 'On repeat', artist: 'Spotify', image: '/samples/petunia.jpg', size: 'w' },
          { type: 'image', src: '/samples/lemon.jpg', size: 's' },
          { type: 'social', platform: 'email', handle: 'you@example.com', size: 's' },
        ]),
      });
    case 'developer':
      return parsePage({
        profile: { ...profile, bio: 'I build tools for developers.' },
        theme: { style: 'minimal', preset: 'ink', font: 'mono', layout: 'bento', radius: 'sharp' },
        tiles: ids([
          { type: 'social', platform: 'github', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'x', handle: 'yourname', size: 's' },
          { type: 'text', text: 'Now: shipping a **tiny CLI**.', size: 'w' },
          { type: 'heading', text: 'Projects' },
          { type: 'github', repo: 'vercel/next.js', size: 'w' },
          { type: 'link', url: 'https://example.com', title: 'Blog', size: 'w' },
        ]),
      });
    case 'links':
      return parsePage({
        profile: { ...profile, bio: 'All my links in one place.' },
        theme: { style: 'minimal', preset: 'white', font: 'editorial', layout: 'list', radius: 'soft', avatar: 'circle' },
        tiles: ids([
          { type: 'social', platform: 'instagram', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'tiktok', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'youtube', handle: 'yourname', size: 's' },
          { type: 'link', url: 'https://example.com', title: 'My website', size: 's' },
          { type: 'link', url: 'https://example.com/shop', title: 'Shop', size: 's' },
        ]),
      });
    default:
      return parsePage({ profile, theme: { style: 'cozy', preset: 'cream', font: 'editorial', layout: 'bento' }, tiles: [] });
  }
}

/** The sample content shown for each style when you start from it. */
export const STYLE_STARTERS: Record<StyleId, TemplateId> = { cozy: 'desk', minimal: 'creator', washi: 'writer', lofi: 'night' };

/** A new page from independent choices: style, layout and colours (plus sample content or an empty page). */
export function starterPage(o: { name: string; style: StyleId; layout?: 'bento' | 'list' | 'canvas'; preset?: string; empty?: boolean }): Page {
  const base = template(STYLE_STARTERS[o.style], o.name);
  return parsePage({
    ...base,
    theme: { ...base.theme, ...(o.layout ? { layout: o.layout } : {}), ...(o.preset ? { preset: o.preset } : {}) },
    tiles: o.empty ? [] : base.tiles,
  });
}
