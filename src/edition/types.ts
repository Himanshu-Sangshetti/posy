/** What an instance (self-hosted Posy or the hosted platform) allows. */
export type Entitlements = {
  plan: string;              // e.g. "self-hosted", "free", "pro"
  removeBranding: boolean;   // may hide the "Made with Posy" footer
  analyticsDays: number;     // how far back analytics go
  analyticsExport: boolean;  // CSV export
  premium: boolean;          // premium themes & fonts (if the edition has any)
  customDomain: boolean;
};

export type Edition = {
  id: string;
  /** "first-user": the first sign-up owns the instance, then sign-ups close. "open": anyone can sign up. */
  signup: 'first-user' | 'open' | 'closed';
  /** What "/" shows: the owner's page (self-hosted) or a marketing site (platform). */
  root: 'owner-page' | 'marketing';
  entitlements: (userId: string) => Promise<Entitlements>;
};
