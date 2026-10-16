/** What an instance (self-hosted Posy or the hosted platform) allows. */
export type Entitlements = {
  plan: string;              // e.g. "self-hosted", "free", "pro"
  removeBranding: boolean;   // may hide the "Made with Posy" footer
  analyticsDays: number;     // how far back analytics go
  analyticsExport: boolean;  // CSV export
  premium: boolean;          // premium themes & fonts (if the edition has any)
  customDomain: boolean;
};

/** Things worth counting. Editions decide what to do with them (the open-source edition ignores all but page.published, see lib/telemetry-events.ts). */
export type ProductEvent =
  | { type: 'account.created'; userId: string }
  | { type: 'onboarding.completed'; userId: string; look: string; layout: string }
  | { type: 'page.published'; userId: string; page: unknown };

export type Edition = {
  id: string;
  /** "first-user": the first sign-up owns the instance, then sign-ups close. "open": anyone can sign up. */
  signup: 'first-user' | 'open' | 'closed';
  /** What "/" shows: the owner's page (self-hosted) or a marketing site (platform). */
  root: 'owner-page' | 'marketing';
  entitlements: (userId: string) => Promise<Entitlements>;
  /** Extra dashboard sections, e.g. the hosted platform's billing page. */
  nav?: { href: string; label: string }[];
  /** The public site's top bar and footer (sign up, log in, marketing pages). */
  site?: SiteLinks;
  /** Product analytics hook. Optional; must be fire-and-forget. */
  track?: (e: ProductEvent) => void;
};

export type SiteLinks = {
  nav: { name: string; link: string }[];
  footer: { title: string; links: [label: string, href: string][] }[];
  tagline?: string;
};
