import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { pageForUser } from '@/lib/pages';
import { starterPage } from '@/lib/templates';
import { STYLE_IDS, STYLE_INFO, PREMIUM_STYLES } from '@/lib/styles';
import { THEMES, PREMIUM_THEMES } from '@/lib/themes';
import { entitlementsFor } from '@/lib/entitlements';
import { Thumbnail } from '@/components/page/Thumbnail';
import { Onboarding } from '@/components/auth/Onboarding';
import { Logo } from '@/components/brand';
import { SITE_HOST } from '@/lib/site';

export const metadata: Metadata = { title: 'Claim your page · Posy' };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ username?: string }> }) {
  const user = await requireUser();
  if (await pageForUser(user.id)) redirect('/edit');
  const { username } = await searchParams;
  const premium = (await entitlementsFor(user.id)).premium;
  const styles = STYLE_IDS.map(id => {
    const page = starterPage({ name: user.name, style: id });
    return { id, label: STYLE_INFO[id].label, note: STYLE_INFO[id].note, preset: STYLE_INFO[id].preset, locked: !premium && PREMIUM_STYLES.has(id), preview: <Thumbnail key={id} page={page} width={1100} height={960} scale={0.16} /> };
  });
  const themes = Object.values(THEMES).map(t => ({ id: t.id, name: t.name, bg: t.bg, accent: t.accent, text: t.text, dark: t.dark, locked: !premium && PREMIUM_THEMES.has(t.id) }));
  return (
    <div className="posy-page posy-app posy-style-cozy posy-bg-solid posy-grain posy-motion min-h-dvh">
      <div aria-hidden className="posy-backdrop"><span className="posy-noise" /></div>
      <header className="relative z-10 px-6 py-5 sm:px-10"><Logo /></header>
      <main className="relative z-10 mx-auto max-w-[1080px] px-5 pb-20 pt-4"><Onboarding initialUsername={username ?? ''} styles={styles} themes={themes} host={SITE_HOST()} /></main>
    </div>
  );
}
