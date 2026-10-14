export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}
export const SITE_HOST = () => siteUrl().replace(/^https?:\/\//, '');
