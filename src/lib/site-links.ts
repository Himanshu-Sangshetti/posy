// The public site's top bar and footer links. The hosted platform's edition can replace these.
import type { SiteLinks } from '@/edition/types';

export const GITHUB = 'https://github.com/Himanshu-Sangshetti/posy';

export const DEFAULT_SITE: SiteLinks = {
  nav: [{ name: 'GitHub', link: GITHUB }, { name: 'For AI agents', link: `${GITHUB}/blob/main/docs/ai-agents.md` }],
  footer: [
    { title: 'Posy', links: [['Make a page', '/signup'], ['Log in', '/login']] },
    { title: 'Open source', links: [['GitHub', GITHUB], ['Run it yourself', `${GITHUB}#self-hosting`], ['For AI agents', `${GITHUB}/blob/main/docs/ai-agents.md`]] },
  ],
  tagline: 'One link for everything you make.',
};
