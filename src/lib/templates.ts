import { parsePage, newId, type Page } from './schema';

export const TEMPLATES = {
  creator: { label: 'Creator', note: 'Bento grid, soft pastels' },
  developer: { label: 'Developer', note: 'Dark, repos up front' },
  links: { label: 'Links', note: 'A clean list, like Linktree' },
  blank: { label: 'Blank', note: 'Start from nothing' },
} as const;
export type TemplateId = keyof typeof TEMPLATES;

const ids = (tiles: Record<string, unknown>[]) => tiles.map(t => ({ ...t, id: newId() }));

/** Starter pages. Links point to the platforms' home pages until the user edits them. */
export function template(id: TemplateId, name: string): Page {
  const profile = { name: name || 'Your name', bio: '' };
  switch (id) {
    case 'creator':
      return parsePage({
        profile: { ...profile, bio: 'Making things on the internet. Say hi.' },
        theme: { preset: 'cream', font: 'editorial', layout: 'bento', align: 'side', background: { style: 'mesh' }, tileStyle: 'glass' },
        tiles: ids([
          { type: 'social', platform: 'instagram', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'youtube', handle: 'yourname', size: 's' },
          { type: 'text', text: 'Currently working on **something new**. Updates soon.', size: 'w' },
          { type: 'heading', text: 'Latest' },
          { type: 'link', url: 'https://example.com', title: 'My latest project', size: 'w' },
          { type: 'social', platform: 'email', handle: 'you@example.com', size: 's' },
        ]),
      });
    case 'developer':
      return parsePage({
        profile: { ...profile, bio: 'I build tools for developers.' },
        theme: { preset: 'midnight', font: 'tech', layout: 'bento', align: 'side', background: { style: 'grid' }, tileStyle: 'soft', effect: 'glow' },
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
        theme: { preset: 'peach', font: 'classic', layout: 'list', radius: 'pill', background: { style: 'gradient' }, tileStyle: 'solid', avatar: 'circle' },
        tiles: ids([
          { type: 'social', platform: 'instagram', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'tiktok', handle: 'yourname', size: 's' },
          { type: 'social', platform: 'youtube', handle: 'yourname', size: 's' },
          { type: 'link', url: 'https://example.com', title: 'My website', size: 's' },
          { type: 'link', url: 'https://example.com/shop', title: 'Shop', size: 's' },
        ]),
      });
    default:
      return parsePage({ profile, theme: { preset: 'cream', layout: 'bento' }, tiles: [] });
  }
}
