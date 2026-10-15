import { AppFrame } from '@/components/dash/ui';
import { SiteNav } from '@/components/site/SiteNav';
import { SiteFooter } from '@/components/site/SiteFooter';
import { edition } from '@/edition';
import { DEFAULT_SITE } from '@/lib/site-links';

/** Sign up and log in: the site's own top bar and footer around the form and its painting (see AuthForm). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const site = edition.site ?? DEFAULT_SITE;
  return (
    <AppFrame className="au">
      <SiteNav items={site.nav} tone="light" pinned />
      {children}
      <SiteFooter site={site} solo />
    </AppFrame>
  );
}
