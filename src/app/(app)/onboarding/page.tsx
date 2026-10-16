import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { pageForUser } from '@/lib/pages';
import { STYLE_IDS, STYLE_INFO, PREMIUM_STYLES } from '@/lib/styles';
import { THEMES, PREMIUM_THEMES } from '@/lib/themes';
import { entitlementsFor } from '@/lib/entitlements';
import { Onboarding } from '@/components/auth/Onboarding';
import { Logo } from '@/components/brand';
import { AppFrame } from '@/components/dash/ui';
import { SITE_HOST } from '@/lib/site';

export const metadata: Metadata = { title: 'Claim your page · Posy' };

/** The look picked on the landing page ("desk" is the Desk style's public name), if it's one this person can use. */
function pickLook(look: string | undefined, premium: boolean) {
  const id = look === 'desk' ? 'cozy' : look;
  return STYLE_IDS.find(s => s === id && (premium || !PREMIUM_STYLES.has(s))) ?? 'painted';
}

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ username?: string; look?: string }> }) {
  const user = await requireUser();
  if (await pageForUser(user.id)) redirect('/edit');
  const { username, look } = await searchParams;
  const premium = (await entitlementsFor(user.id)).premium;
  // Each look is shown as a small picture, not a live page: six live scenes decode hundreds of MB of art, and phones
  // (iOS Safari, in-app browsers) kill and reload the tab. The live preview below still shows the chosen look for real.
  const styles = STYLE_IDS.map(id => ({
    id, label: STYLE_INFO[id].label, note: STYLE_INFO[id].note, preset: STYLE_INFO[id].preset, layout: STYLE_INFO[id].layout, locked: !premium && PREMIUM_STYLES.has(id),
    // eslint-disable-next-line @next/next/no-img-element
    preview: <img key={id} src={`/looks/swatches/${id}.jpg`} alt="" loading="lazy" decoding="async" className="size-full object-cover object-top" />,
  }));
  const themes = Object.values(THEMES).map(t => ({ id: t.id, name: t.name, bg: t.bg, accent: t.accent, text: t.text, dark: t.dark, locked: !premium && PREMIUM_THEMES.has(t.id) }));
  return (
    <AppFrame>
      <header className="mx-auto flex max-w-[1120px] items-center px-6 py-5 sm:px-10"><Logo /></header>
      <main className="mx-auto max-w-[1120px] px-5 pb-16 pt-6 sm:px-10"><Onboarding initialUsername={username ?? ''} initialStyle={pickLook(look, premium)} styles={styles} themes={themes} host={SITE_HOST()} /></main>
    </AppFrame>
  );
}
