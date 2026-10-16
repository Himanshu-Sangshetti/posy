// Dependency-free URL helpers (safe to ship to the browser).

export function hostOf(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null;
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const m = u.pathname.match(/\/(shorts|live|embed)\/([\w-]{6,})/);
    return m ? m[2] : null;
  } catch { return null; }
}

export function spotifyEmbed(url: string): string | null {
  const m = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]+)/);
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null;
}

/** A short name for a site: "himanshu.substack.com" → "Substack", "shop.example.com" → "example.com", "himanshu.dev" stays. */
export function siteName(url: string) {
  const host = hostOf(url);
  const known: Record<string, string> = { 'substack.com': 'Substack', 'github.com': 'GitHub', 'youtube.com': 'YouTube', 'medium.com': 'Medium', 'gumroad.com': 'Gumroad', 'etsy.com': 'Etsy', 'notion.site': 'Notion', 'buttondown.email': 'Buttondown', 'beehiiv.com': 'beehiiv', 'ko-fi.com': 'Ko-fi', 'behance.net': 'Behance', 'dribbble.com': 'Dribbble' };
  for (const [d, name] of Object.entries(known)) if (host === d || host.endsWith('.' + d)) return name;
  return host.split('.').length > 2 && !/\.(co|com)\.[a-z]{2}$/.test(host) ? host.split('.').slice(-2).join('.') : host;
}

/** The path of a link as people read it in an address bar: "/p/by-hand", without query strings. */
export function pathOf(url: string) {
  try { const p = new URL(url).pathname.replace(/\/$/, ''); return p.length > 1 ? p : ''; } catch { return ''; }
}

/**
 * Scraped page titles are often "Name | Tagline | Site" or "Post title - Site". Split them into a clean title and an
 * optional tagline, dropping the site's own name; and drop a description that only repeats the title.
 */
export function cleanTitle(title: string, opts: { site?: string; description?: string } = {}) {
  const parts = title.split(/\s+[|·•–—-]\s+/).map(s => s.trim()).filter(Boolean);
  const site = opts.site?.toLowerCase();
  const kept = parts.length > 1 && site ? parts.filter(p => p.toLowerCase() !== site && !site.startsWith(p.toLowerCase())) : parts;
  const [head = title, ...rest] = kept.length ? kept : parts;
  let tagline = rest.join(' · ') || undefined;
  // a description that's just "Title | tagline" still carries the tagline
  if (!tagline && opts.description) {
    const dp = opts.description.split(/\s+[|·•–—-]\s+/).map(x => x.trim()).filter(Boolean);
    if (dp.length > 1 && dp[0].toLowerCase() === head.toLowerCase()) tagline = dp.slice(1).join(' · ');
  }
  const desc = opts.description?.trim();
  const repeats = (d: string) => { const a = d.toLowerCase(), b = head.toLowerCase(); return a.startsWith(b) || b.startsWith(a) || (tagline ? a.startsWith(tagline.toLowerCase()) : false); };
  return { title: head, tagline, description: desc && !repeats(desc) ? desc : undefined };
}

/** Where to look up a favicon: people's subdomains on publishing platforms share the platform's icon. */
export function faviconHost(url: string) {
  const host = hostOf(url);
  const roots = ['substack.com', 'medium.com', 'notion.site', 'github.io', 'wordpress.com', 'blogspot.com', 'tumblr.com', 'bearblog.dev', 'ghost.io', 'beehiiv.com', 'gumroad.com', 'myshopify.com', 'bigcartel.com', 'carrd.co', 'vercel.app', 'netlify.app', 'framer.website', 'webflow.io'];
  return roots.find(r => host.endsWith('.' + r)) ?? host;
}
