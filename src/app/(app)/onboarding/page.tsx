import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { pageForUser } from '@/lib/pages';
import { template, TEMPLATES, type TemplateId } from '@/lib/templates';
import { Thumbnail } from '@/components/page/Thumbnail';
import { Onboarding } from '@/components/auth/Onboarding';
import { Logo } from '@/components/brand';
import { SITE_HOST } from '@/lib/site';

export const metadata: Metadata = { title: 'Claim your page · Posy' };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ username?: string }> }) {
  const user = await requireUser();
  if (await pageForUser(user.id)) redirect('/edit');
  const { username } = await searchParams;
  const previews = Object.fromEntries((Object.keys(TEMPLATES) as TemplateId[]).map(id => {
    const page = template(id, user.name);
    const list = page.theme.layout === 'list';
    return [id, <Thumbnail key={id} page={page} width={list ? 640 : 1100} height={list ? 780 : 960} scale={list ? 0.2 : 0.16} />];
  }));
  return (
    <div className="posy-page posy-app posy-layout-desk posy-bg-solid posy-grain posy-motion min-h-dvh">
      <div aria-hidden className="posy-backdrop"><span className="posy-noise" /></div>
      <header className="relative z-10 px-6 py-5 sm:px-10"><Logo /></header>
      <main className="relative z-10 mx-auto max-w-[880px] px-5 pb-20 pt-4"><Onboarding initialUsername={username ?? ''} previews={previews} host={SITE_HOST()} /></main>
    </div>
  );
}
