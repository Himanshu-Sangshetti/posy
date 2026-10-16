import { PLATFORMS, type PlatformId } from './platforms';
import { isImageRef } from './url';
import { newId, type Tile } from './schema';

const RESERVED: Record<string, string[]> = {
  github: ['orgs', 'sponsors', 'topics', 'features', 'explore', 'marketplace', 'settings', 'pulls', 'issues'],
  x: ['home', 'explore', 'search', 'i', 'settings', 'intent'],
};

/** Turn anything a person pastes into the most fitting tile. */
export function tileFromInput(input: string): Tile {
  const raw = input.trim();
  const id = newId();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return { id, type: 'social', platform: 'email', handle: raw, size: 's', color: 'auto' };
  if (isImageRef(raw)) return { id, type: 'image', src: raw, alt: '', size: 's', color: 'auto' };
  // owner/repo (owners never contain dots; repo names can, e.g. vercel/next.js)
  if (/^[\w-]+\/[\w.-]+$/.test(raw) && !/^[\w-]+\.[a-z]{2,}\//i.test(raw)) return { id, type: 'github', repo: raw.replace(/\.git$/, ''), size: 'w', color: 'auto' };

  let u: URL;
  try { u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`); } catch { return { id, type: 'text', text: raw, size: 'w', color: 'auto' }; }
  if (!u.hostname.includes('.')) return { id, type: 'text', text: raw, size: 'w', color: 'auto' };

  const host = u.hostname.replace(/^(www|m|open|music)\./, '');
  const parts = u.pathname.split('/').filter(Boolean);
  const href = u.toString();

  if (host === 'youtu.be' || (host === 'youtube.com' && (u.searchParams.get('v') || parts[0] === 'shorts' || parts[0] === 'live')))
    return { id, type: 'video', url: href, size: 'w', color: 'auto' };
  if (u.hostname.startsWith('open.spotify.com') || host === 'spotify.com')
    return { id, type: 'music', url: href, size: 'w', color: 'auto' };
  if (host === 'github.com' && parts.length >= 2 && !RESERVED.github.includes(parts[0]))
    return { id, type: 'github', repo: `${parts[0]}/${parts[1].replace(/\.git$/, '')}`, size: 'w', color: 'auto' };
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(u.pathname))
    return { id, type: 'image', src: href, alt: '', size: 's', color: 'auto' };

  for (const [pid, p] of Object.entries(PLATFORMS) as [PlatformId, (typeof PLATFORMS)[PlatformId]][]) {
    const hit = p.hosts.some(h => host === h || host.endsWith('.' + h));
    if (!hit) continue;
    let handle = parts[0] ?? '';
    if (pid === 'linkedin' && parts[0] === 'in') handle = parts[1] ?? '';
    if (pid === 'reddit' && ['u', 'user'].includes(parts[0])) handle = parts[1] ?? '';
    if (pid === 'bluesky' && parts[0] === 'profile') handle = parts[1] ?? '';
    if (['substack', 'itch'].includes(pid) && host !== p.hosts[0]) handle = host.split('.')[0];
    handle = handle.replace(/^@/, '');
    if (handle && !(RESERVED[pid] ?? []).includes(handle)) return { id, type: 'social', platform: pid, handle, size: 's', color: 'auto' };
  }
  return { id, type: 'link', url: href, size: 's', color: 'auto' };
}

export { hostOf, youtubeId, spotifyEmbed, isImageRef } from './url';
