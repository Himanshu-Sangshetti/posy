import { requireUser } from '@/lib/session';
import { PageView } from '@/components/page/PageView';
import { starterPage } from '@/lib/templates';
import { STYLE_IDS, type StyleId } from '@/lib/styles';
import { THEMES } from '@/lib/themes';

export const dynamic = 'force-dynamic';

/** The live preview inside onboarding: a sample page in the chosen style, layout and colours. */
export default async function OnboardingPreview({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const q = await searchParams;
  const style = (STYLE_IDS.includes(q.style as StyleId) ? q.style : 'cozy') as StyleId;
  const page = starterPage({
    name: user.name, style,
    layout: q.layout === 'list' ? 'list' : 'bento',
    preset: q.preset && q.preset in THEMES ? q.preset : undefined,
    empty: q.empty === '1',
  });
  return (
    <>
      <style>{`html,body{background:${THEMES[page.theme.preset].bg}}`}</style>
      <PageView page={page} />
    </>
  );
}
