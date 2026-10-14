import Link from 'next/link';
import { Logo } from '@/components/brand';
import { Thumbnail } from '@/components/page/Thumbnail';
import { template } from '@/lib/templates';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const preview = template('desk', 'Your Name');
  return (
    <div className="posy-page posy-app posy-layout-desk posy-bg-solid posy-grain posy-motion min-h-dvh">
      <div aria-hidden className="posy-backdrop"><span className="posy-noise" /></div>
      <header className="relative z-10 px-6 py-5 sm:px-10"><Link href="/" aria-label="Posy home"><Logo /></Link></header>
      <main className="relative z-10 mx-auto grid min-h-[calc(100dvh-80px)] max-w-[1080px] items-center gap-16 px-5 pb-16 lg:grid-cols-[400px_1fr]">
        {children}
        <figure aria-hidden className="relative hidden rotate-[2.5deg] bg-[var(--dk-white)] p-3.5 pb-14 shadow-[var(--dk-shadow)] lg:block">
          <span className="app-tape" />
          <Thumbnail page={preview} width={1100} height={860} scale={0.52} />
          <figcaption className="app-hand absolute inset-x-0 bottom-3 text-center text-[26px] text-[#5b5049]">your page, a minute from now ✿</figcaption>
        </figure>
      </main>
    </div>
  );
}
