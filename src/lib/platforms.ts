import {
  siX, siInstagram, siGithub, siYoutube, siTiktok, siThreads, siBluesky, siMastodon, siDribbble, siBehance,
  siSpotify, siTwitch, siDiscord, siSubstack, siMedium, siReddit, siPinterest, siProducthunt, siPeerlist,
  siDevdotto, siHashnode, siItchdotio, siKofi, siBuymeacoffee, siPatreon, siSoundcloud, siFacebook, siTelegram,
} from 'simple-icons';
import { safeHref } from './url';

type Icon = { path: string; hex: string };
export type Platform = {
  label: string;
  icon: Icon | null;            // null = drawn as a monogram
  hosts: string[];              // used to detect pasted URLs
  url: (handle: string) => string;
};

// LinkedIn isn't in Simple Icons; it is rendered as an "in" monogram in its brand blue.
const LINKEDIN: Icon = { path: '', hex: '0A66C2' };

export const PLATFORMS = {
  x: { label: 'X', icon: siX, hosts: ['x.com', 'twitter.com'], url: h => `https://x.com/${h}` },
  instagram: { label: 'Instagram', icon: siInstagram, hosts: ['instagram.com'], url: h => `https://instagram.com/${h}` },
  github: { label: 'GitHub', icon: siGithub, hosts: ['github.com'], url: h => `https://github.com/${h}` },
  linkedin: { label: 'LinkedIn', icon: LINKEDIN, hosts: ['linkedin.com'], url: h => `https://linkedin.com/in/${h}` },
  youtube: { label: 'YouTube', icon: siYoutube, hosts: ['youtube.com'], url: h => `https://youtube.com/@${h}` },
  tiktok: { label: 'TikTok', icon: siTiktok, hosts: ['tiktok.com'], url: h => `https://tiktok.com/@${h}` },
  threads: { label: 'Threads', icon: siThreads, hosts: ['threads.net', 'threads.com'], url: h => `https://threads.net/@${h}` },
  bluesky: { label: 'Bluesky', icon: siBluesky, hosts: ['bsky.app'], url: h => `https://bsky.app/profile/${h}` },
  mastodon: { label: 'Mastodon', icon: siMastodon, hosts: ['mastodon.social'], url: h => (h.includes('@') ? `https://${h.split('@').filter(Boolean)[1]}/@${h.split('@').filter(Boolean)[0]}` : `https://mastodon.social/@${h}`) },
  dribbble: { label: 'Dribbble', icon: siDribbble, hosts: ['dribbble.com'], url: h => `https://dribbble.com/${h}` },
  behance: { label: 'Behance', icon: siBehance, hosts: ['behance.net'], url: h => `https://behance.net/${h}` },
  spotify: { label: 'Spotify', icon: siSpotify, hosts: [], url: h => `https://open.spotify.com/user/${h}` },
  twitch: { label: 'Twitch', icon: siTwitch, hosts: ['twitch.tv'], url: h => `https://twitch.tv/${h}` },
  discord: { label: 'Discord', icon: siDiscord, hosts: ['discord.gg', 'discord.com'], url: h => `https://discord.gg/${h}` },
  substack: { label: 'Substack', icon: siSubstack, hosts: ['substack.com'], url: h => `https://${h}.substack.com` },
  medium: { label: 'Medium', icon: siMedium, hosts: ['medium.com'], url: h => `https://medium.com/@${h}` },
  reddit: { label: 'Reddit', icon: siReddit, hosts: ['reddit.com'], url: h => `https://reddit.com/user/${h}` },
  pinterest: { label: 'Pinterest', icon: siPinterest, hosts: ['pinterest.com'], url: h => `https://pinterest.com/${h}` },
  producthunt: { label: 'Product Hunt', icon: siProducthunt, hosts: ['producthunt.com'], url: h => `https://www.producthunt.com/@${h}` },
  peerlist: { label: 'Peerlist', icon: siPeerlist, hosts: ['peerlist.io'], url: h => `https://peerlist.io/${h}` },
  devto: { label: 'DEV', icon: siDevdotto, hosts: ['dev.to'], url: h => `https://dev.to/${h}` },
  hashnode: { label: 'Hashnode', icon: siHashnode, hosts: ['hashnode.com'], url: h => `https://hashnode.com/@${h}` },
  itch: { label: 'itch.io', icon: siItchdotio, hosts: ['itch.io'], url: h => `https://${h}.itch.io` },
  kofi: { label: 'Ko-fi', icon: siKofi, hosts: ['ko-fi.com'], url: h => `https://ko-fi.com/${h}` },
  buymeacoffee: { label: 'Buy Me a Coffee', icon: siBuymeacoffee, hosts: ['buymeacoffee.com'], url: h => `https://buymeacoffee.com/${h}` },
  patreon: { label: 'Patreon', icon: siPatreon, hosts: ['patreon.com'], url: h => `https://patreon.com/${h}` },
  soundcloud: { label: 'SoundCloud', icon: siSoundcloud, hosts: ['soundcloud.com'], url: h => `https://soundcloud.com/${h}` },
  facebook: { label: 'Facebook', icon: siFacebook, hosts: ['facebook.com'], url: h => `https://facebook.com/${h}` },
  telegram: { label: 'Telegram', icon: siTelegram, hosts: ['t.me'], url: h => `https://t.me/${h}` },
  email: { label: 'Email', icon: null, hosts: [], url: h => `mailto:${h}` },
} satisfies Record<string, Platform>;

export type PlatformId = keyof typeof PLATFORMS;
export const PLATFORM_IDS = Object.keys(PLATFORMS) as [PlatformId, ...PlatformId[]];

export function profileUrl(platform: PlatformId, handle: string, override?: string) {
  return safeHref(override) ?? PLATFORMS[platform].url(handle.replace(/^@/, ''));
}
