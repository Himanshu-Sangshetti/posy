import Link from 'next/link';
import { Logo } from '@/components/brand';
import { Thumbnail } from '@/components/page/Thumbnail';
import { AppFrame } from '@/components/dash/ui';
import { BlurFade } from '@/components/ui/blur-fade';
import { template } from '@/lib/templates';
import { SITE_HOST } from '@/lib/site';

const POINTS = [
  ['rose', 'Five styles', 'Soft, editorial, terminal, neon, cozy.'],
  ['mint', 'Edited by your AI', 'Claude, Cursor and Codex over MCP.'],
  ['sky', 'Yours to keep', 'One JSON file, free and open source.'],
] as const;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const preview = template('desk', 'Your Name');
  return (
    <AppFrame>
      <header className="mx-auto flex max-w-[1180px] items-center px-6 py-5 sm:px-10"><Link href="/" aria-label="Posy home" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"><Logo /></Link></header>
      <main className="mx-auto grid min-h-[calc(100dvh-84px)] max-w-[1180px] items-center gap-10 px-5 pb-14 sm:px-10 lg:grid-cols-[420px_1fr] lg:gap-16">
        {children}
        <BlurFade delay={0.12} className="hidden lg:block">
          <figure aria-hidden className="relative overflow-hidden rounded-[20px] border border-[var(--line)] bg-[linear-gradient(180deg,#eceef0_0%,#f3f1ec_100%)] p-8">
            <div className="mx-auto w-fit overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_30px_60px_-30px_rgb(22_20_15/.45)]">
              <div className="flex h-9 items-center gap-1.5 border-b border-[var(--line)] px-3.5">
                <i className="size-2.5 rounded-full border border-[var(--line)]" /><i className="size-2.5 rounded-full border border-[var(--line)]" /><i className="size-2.5 rounded-full border border-[var(--line)]" />
                <span className="ac-mono mx-auto px-3 py-0.5 text-[11.5px] text-[var(--muted)]">{SITE_HOST()}/yourname</span><span className="w-10" />
              </div>
              <Thumbnail page={preview} width={1100} height={860} scale={0.5} />
            </div>
            <figcaption className="mt-7 grid grid-cols-3 gap-4">
              {POINTS.map(([tone, t, d]) => (
                <div key={t}><span className={`ac-pill ac-tone-${tone}`}>{t}</span><p className="mt-2 text-[13.5px] leading-snug text-[var(--muted)]">{d}</p></div>
              ))}
            </figcaption>
          </figure>
        </BlurFade>
      </main>
    </AppFrame>
  );
}
