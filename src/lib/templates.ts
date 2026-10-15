import { parsePage, newId, type Page } from './schema';
import type { StyleId } from './styles';

export const TEMPLATES = {
  desk: { label: 'Desk', note: 'Polaroids and notes in the afternoon sun' },
  writer: { label: 'Washi', note: 'Paper, ink and a red seal' },
  developer: { label: 'Developer', note: 'Repos up front, in ink' },
  night: { label: 'Lofi', note: 'A desktop left open' },
  creator: { label: 'Minimal', note: 'Ink and paper, photos in 1-bit' },
  links: { label: 'Links', note: 'A clean list, like Linktree' },
  press: { label: 'Press', note: 'A weekend paper' },
  gallery: { label: 'Gallery', note: 'Work on the wall' },
  painted: { label: 'Painted', note: 'A watercolour sky' },
  neon: { label: 'Night', note: 'Neon after rain' },
  blank: { label: 'Blank', note: 'Start from nothing' },
} as const;
export type TemplateId = keyof typeof TEMPLATES;

const ids = (tiles: Record<string, unknown>[]) => tiles.map(t => ({ ...t, id: newId() }));
/** Painted placeholder art for each look (public/looks/<look>/). */
const art = (look: string, name: string) => `/looks/${look}/${name}.jpg`;
const VIDEO = 'https://www.youtube.com/watch?v=jfKfPfyJRdk';

/** Starter pages. Links point to the platforms' home pages until the user edits them. */
export function template(id: TemplateId, name: string): Page {
  // A small painted posy stands in for a photo until people add their own.
  const profile = { name: name || 'Your name', bio: '', avatar: '/samples/posy.jpg' };
  switch (id) {
    case 'desk':
      return parsePage({
        profile: { ...profile, avatar: art('desk', 'avatar'), bio: 'I make small, soft things on the internet. Say hi.', location: 'hello from home' },
        theme: { style: 'cozy', preset: 'cream', font: 'editorial', layout: 'canvas', avatar: 'square' },
        tiles: ids([
          { type: 'social', platform: 'instagram', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'x', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'youtube', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'email', handle: 'you@example.com', size: 's' },
          { type: 'image', src: art('desk', 'photo1'), caption: 'spring, again ✿', size: 'l' },
          { type: 'text', text: 'Currently working on something new. Updates soon!', size: 's' },
          { type: 'text', text: 'Open for work', look: 'stamp', color: 'lilac', size: 's' },
          { type: 'music', url: 'https://open.spotify.com/', title: 'My song of the week', artist: 'Spotify', image: art('desk', 'music'), size: 'w' },
          { type: 'heading', text: 'things I make' },
          { type: 'link', url: 'https://substack.com', title: 'My newsletter', description: 'Dear friend, this week I tried something new…', image: art('desk', 'cover'), size: 'w' },
          { type: 'link', url: 'https://example.com', title: 'My website', description: 'Portfolio, shop and the odd blog post', size: 'w' },
          { type: 'link', url: 'https://gumroad.com', title: 'Shop', image: art('desk', 'photo2'), size: 's' },
          { type: 'image', src: art('desk', 'video'), caption: 'lately', size: 's' },
        ]),
      });
    case 'writer':
      return parsePage({
        profile: { ...profile, avatar: art('washi', 'avatar'), bio: 'Writer and editor. Essays about small things, mostly.', location: 'Lisbon' },
        theme: { style: 'washi', preset: 'kinari', font: 'washi', layout: 'bento', avatar: 'square' },
        tiles: ids([
          { type: 'social', platform: 'substack', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'x', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'email', handle: 'you@example.com', size: 's' },
          { type: 'link', url: 'https://substack.com', title: 'The newsletter', description: 'A letter every other Sunday about the things I noticed.', image: art('washi', 'cover'), size: 'l' },
          { type: 'text', text: 'The best ideas arrive on long walks.', size: 'w' },
          { type: 'link', url: 'https://example.com/essays', title: 'Selected essays', description: 'Ten pieces I still like', image: art('washi', 'photo1'), size: 'w' },
          { type: 'heading', text: 'Elsewhere' },
          { type: 'image', src: art('washi', 'photo2'), caption: 'Notes from the kitchen', size: 's' },
          { type: 'link', url: 'https://example.com', title: 'Talks and interviews', image: art('washi', 'video'), size: 'w' },
        ]),
      });
    case 'night':
      return parsePage({
        profile: { ...profile, avatar: art('lofi', 'avatar'), bio: 'Building weird things after dark. Synths, shaders, side projects.', location: 'online now' },
        theme: { style: 'lofi', preset: 'daydream', font: 'lofi', layout: 'canvas' },
        // A collage: windows overlap and lean a little, like a desktop left open.
        tiles: ids([
          { type: 'social', platform: 'github', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'x', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'youtube', handle: 'yourname', size: 's' },
          { type: 'image', src: art('lofi', 'photo1'), caption: 'render_042.png', size: 'l', pos: { x: 16, y: 40, w: 600, h: 452, r: -1.5, z: 1 } },
          { type: 'text', text: 'Now: shipping a tiny synth in the browser.', size: 's', pos: { x: 560, y: 0, w: 300, h: 232, r: 2.5, z: 3 } },
          { type: 'github', repo: 'vercel/next.js', size: 's', pos: { x: 900, y: 56, w: 284, h: 284, r: -2, z: 2 } },
          { type: 'music', url: 'https://open.spotify.com/', title: 'Night drive', artist: 'Spotify', image: art('lofi', 'music'), size: 'w', pos: { x: 640, y: 300, w: 544, h: 252, r: 1, z: 4 } },
          { type: 'link', url: 'https://example.com', title: 'Devlog', description: 'What I built this week', image: art('lofi', 'cover'), size: 'w', pos: { x: 96, y: 520, w: 480, h: 228, r: 1.5, z: 5 } },
        ]),
      });
    case 'creator':
      return parsePage({
        profile: { ...profile, avatar: art('minimal', 'avatar'), bio: 'Making things on the internet. Say hi.' },
        theme: { style: 'minimal', preset: 'paper', font: 'editorial', layout: 'bento', align: 'side' },
        tiles: ids([
          { type: 'social', platform: 'instagram', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'youtube', handle: 'yourname', size: 's' },
          { type: 'image', src: art('minimal', 'photo1'), caption: 'lately', size: 'l' },
          { type: 'text', text: 'Currently working on **something new**. Updates soon.', size: 'w' },
          { type: 'heading', text: 'Latest' },
          { type: 'link', url: 'https://example.com', title: 'My latest project', description: 'What I made this month', image: art('minimal', 'cover'), size: 'w' },
          { type: 'music', url: 'https://open.spotify.com/', title: 'On repeat', artist: 'Spotify', image: art('minimal', 'music'), size: 'w' },
          { type: 'image', src: art('minimal', 'photo2'), size: 's' },
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
    case 'press':
      return parsePage({
        profile: { ...profile, avatar: art('press', 'avatar'), bio: 'Writer and podcaster. A letter every Sunday about what I read, cooked and noticed.', location: 'Sunday edition' },
        theme: { style: 'press', preset: 'newsprint', font: 'press', layout: 'bento', avatar: 'circle' },
        tiles: ids([
          { type: 'social', platform: 'substack', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'x', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'email', handle: 'you@example.com', size: 's' },
          { type: 'link', url: 'https://example.com/essays/by-hand', title: 'Why I write everything by hand first', description: 'On slow drafts, fast coffee and the joy of crossing things out.', image: art('press', 'cover'), size: 'l' },
          { type: 'link', url: 'https://substack.com', title: 'The Sunday Edition', description: 'One letter a week. No noise, just the good bits.', size: 'w' },
          { type: 'text', text: 'Write the thing you wish someone had written for you.', size: 'w' },
          { type: 'heading', text: 'The podcast' },
          { type: 'video', url: VIDEO, title: 'Small towns, big stories', image: art('press', 'video'), size: 'w' },
          { type: 'music', url: 'https://open.spotify.com/', title: 'Desk radio', artist: 'A playlist for writing', image: art('press', 'music'), size: 'w' },
          { type: 'image', src: art('press', 'photo1'), caption: 'The corner newsstand, Saturday morning', size: 'w' },
          { type: 'link', url: 'https://gumroad.com', title: 'Zine back issues', description: 'Printed, stapled, posted by hand', size: 's' },
          { type: 'text', text: 'Taking pitches', look: 'stamp', size: 's' },
        ]),
      });
    case 'gallery':
      return parsePage({
        profile: { ...profile, avatar: art('gallery', 'avatar'), bio: 'Paintings about small, quiet afternoons.', location: 'Studio in Porto' },
        theme: { style: 'gallery', preset: 'white-cube', font: 'gallery', layout: 'bento', avatar: 'square' },
        tiles: ids([
          { type: 'social', platform: 'instagram', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'behance', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'email', handle: 'you@example.com', size: 's' },
          { type: 'image', src: art('gallery', 'photo1'), caption: 'Kite Hill, gouache', size: 'l' },
          { type: 'image', src: art('gallery', 'photo2'), caption: 'Afternoon nap, risograph', size: 's' },
          { type: 'text', text: 'Available for commissions', look: 'stamp', size: 's' },
          { type: 'text', text: 'I paint the quiet parts of the day.', size: 'w' },
          { type: 'heading', text: 'New work' },
          { type: 'link', url: 'https://example.com/seaside', title: 'Seaside', description: 'Twelve oil paintings, spring 2026', image: art('gallery', 'cover'), size: 'w' },
          { type: 'music', url: 'https://open.spotify.com/', title: 'Painting playlist', artist: 'Spotify', image: art('gallery', 'music'), size: 's' },
          { type: 'link', url: 'https://buttondown.email', title: 'Studio letters', description: 'New work, once a month', size: 's' },
          { type: 'video', url: VIDEO, title: 'A day in the studio', image: art('gallery', 'video'), size: 'w' },
          { type: 'link', url: 'https://gumroad.com', title: 'Print shop', description: 'Signed giclée prints', size: 'w' },
        ]),
      });
    case 'painted':
      return parsePage({
        profile: { ...profile, avatar: art('painted', 'avatar'), bio: 'Drawing a little world, one page at a time. Picture books, prints and the odd kite.', location: 'somewhere above the clouds' },
        theme: { style: 'painted', preset: 'morning', font: 'painted', layout: 'bento', avatar: 'circle' },
        tiles: ids([
          { type: 'social', platform: 'instagram', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'youtube', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'email', handle: 'you@example.com', size: 's' },
          { type: 'image', src: art('painted', 'photo1'), caption: 'the island, again', size: 'l' },
          { type: 'text', text: 'Hello! New pages every Sunday. Thank you for reading.', size: 's' },
          { type: 'text', text: 'Open for commissions', look: 'stamp', size: 's' },
          { type: 'music', url: 'https://open.spotify.com/', title: 'Songs for drawing', artist: 'Spotify', image: art('painted', 'music'), size: 'w' },
          { type: 'heading', text: 'Stories' },
          { type: 'link', url: 'https://example.com/rooftop', title: 'Letters from the rooftop', description: "A picture book I'm making, a page a week.", image: art('painted', 'cover'), size: 'w' },
          { type: 'link', url: 'https://substack.com', title: 'The kite post', description: 'A painted letter every month', size: 's' },
          { type: 'image', src: art('painted', 'photo2'), caption: 'studio cat', size: 's' },
          { type: 'video', url: VIDEO, title: 'How I paint skies', image: art('painted', 'video'), size: 'w' },
          { type: 'link', url: 'https://etsy.com', title: 'Prints', description: 'Small runs, signed', size: 'w' },
        ]),
      });
    case 'neon':
      return parsePage({
        profile: { ...profile, avatar: art('night', 'avatar'), bio: 'Late sets and slow beats. Live every Friday after midnight.', location: 'live fridays' },
        theme: { style: 'night', preset: 'neon', font: 'night', layout: 'bento', avatar: 'squircle' },
        tiles: ids([
          { type: 'social', platform: 'twitch', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'soundcloud', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'instagram', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'discord', handle: 'yourname', size: 's' },
          { type: 'image', src: art('night', 'photo1'), caption: 'the walk home, 2 a.m.', size: 'l' },
          { type: 'text', text: 'Live tonight', look: 'stamp', size: 's' },
          { type: 'text', text: 'Bring headphones. Stay till sunrise.', size: 's' },
          { type: 'music', url: 'https://open.spotify.com/', title: 'Midnight mix vol. 3', artist: 'Spotify', image: art('night', 'music'), size: 'w' },
          { type: 'heading', text: 'This week' },
          { type: 'video', url: VIDEO, title: 'Arcade sessions, ep. 7', image: art('night', 'video'), size: 'w' },
          { type: 'link', url: 'https://example.com/tapes', title: 'Rooftop tapes', description: 'New EP, out now', image: art('night', 'cover'), size: 'w' },
          { type: 'link', url: 'https://shop.example.com', title: 'Merch', description: 'Hoodies, tapes, stickers', size: 's' },
          { type: 'image', src: art('night', 'photo2'), caption: 'the booth', size: 's' },
        ]),
      });
    default:
      return parsePage({ profile, theme: { style: 'cozy', preset: 'cream', font: 'editorial', layout: 'bento' }, tiles: [] });
  }
}

/** The sample content shown for each style when you start from it. */
export const STYLE_STARTERS: Record<StyleId, TemplateId> = { cozy: 'desk', minimal: 'creator', washi: 'writer', lofi: 'night', press: 'press', gallery: 'gallery', painted: 'painted', night: 'neon' };

/** A new page from independent choices: style, layout and colours (plus sample content or an empty page). */
export function starterPage(o: { name: string; style: StyleId; layout?: 'bento' | 'list' | 'canvas'; preset?: string; empty?: boolean }): Page {
  const base = template(STYLE_STARTERS[o.style], o.name);
  return parsePage({
    ...base,
    // an empty page is yours from the start: no sample face, bio or caption from the starter's persona
    profile: o.empty ? { name: base.profile.name } : base.profile,
    theme: { ...base.theme, ...(o.layout ? { layout: o.layout } : {}), ...(o.preset ? { preset: o.preset } : {}) },
    tiles: o.empty ? [] : base.tiles,
  });
}
