import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { pageForUser } from '@/lib/pages';
import { siteUrl } from '@/lib/site';
import { DashHeader } from '@/components/dash/DashHeader';
import { edition } from '@/edition';

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const row = await pageForUser(user.id);
  if (!row) redirect('/onboarding');
  return (
    <div className="posy-page posy-app posy-style-cozy posy-bg-solid posy-grain min-h-dvh">
      <div aria-hidden className="posy-backdrop"><span className="posy-noise" /></div>
      <DashHeader username={row.username} site={siteUrl()} extra={edition.nav} />
      <main className="relative z-10 mx-auto w-full max-w-[1000px] px-5 pb-24 pt-8 sm:px-8">{children}</main>
      {edition.id === 'self-hosted' && (
        <p className="relative z-10 pb-8 text-center text-[13px] text-[var(--muted)]">
          Running your own Posy. Prefer not to run a server? <a href="https://posy.page" target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-[var(--text)]">posy.page</a> hosts it for you.
        </p>
      )}
    </div>
  );
}
