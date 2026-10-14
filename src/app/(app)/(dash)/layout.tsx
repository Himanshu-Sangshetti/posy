import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { pageForUser } from '@/lib/pages';
import { siteUrl } from '@/lib/site';
import { DashHeader } from '@/components/dash/DashHeader';
import { AppFrame } from '@/components/dash/ui';
import { edition } from '@/edition';

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const row = await pageForUser(user.id);
  if (!row) redirect('/onboarding');
  return (
    <AppFrame>
      <DashHeader username={row.username} email={user.email} site={siteUrl()} extra={edition.nav} />
      <main className="mx-auto w-full max-w-[1040px] px-5 pb-24 pt-10 sm:px-8">{children}</main>
      {edition.id === 'self-hosted' && (
        <p className="pb-8 text-center text-[13px] text-[var(--muted)]">
          Running your own Posy. Prefer not to run a server? <a href="https://posy.page" target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-[var(--text)]">posy.page</a> hosts it for you.
        </p>
      )}
    </AppFrame>
  );
}
