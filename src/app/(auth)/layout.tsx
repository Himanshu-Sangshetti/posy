import Link from 'next/link';
import { Logo } from '@/components/brand';
import { AppFrame } from '@/components/dash/ui';

/** Sign up and log in: a painting from the Posy world fills the screen and the form sits on it (see AuthForm). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppFrame className="au">
      <header className="au-head"><Link href="/" aria-label="Posy home" className="au-logo"><Logo /></Link></header>
      {children}
    </AppFrame>
  );
}
