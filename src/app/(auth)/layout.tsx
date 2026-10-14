import Link from 'next/link';
import { Logo } from '@/components/brand';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="posy-page posy-bg-mesh posy-grain posy-motion min-h-dvh">
      <div aria-hidden className="posy-backdrop"><span className="posy-noise" /></div>
      <header className="relative z-10 px-6 py-5 sm:px-10"><Link href="/" aria-label="Posy home"><Logo /></Link></header>
      <main className="relative z-10 grid min-h-[calc(100dvh-80px)] place-items-center px-5 pb-16">{children}</main>
    </div>
  );
}
