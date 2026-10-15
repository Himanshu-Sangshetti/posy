'use client';
// The app's sections as one tab bar, the same in the editor and on every dashboard page. The highlight slides
// between tabs. Hosted editions can add sections (e.g. Plan).
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export const APP_TABS = [{ href: '/edit', label: 'Editor' }, { href: '/analytics', label: 'Analytics' }, { href: '/agents', label: 'Agents' }, { href: '/settings', label: 'Settings' }];

export function AppTabs({ extra = [], className }: { extra?: { href: string; label: string }[]; className?: string }) {
  const path = usePathname();
  return (
    <nav aria-label="Sections" className={cn('app-tabs', className)}>
      {[...APP_TABS, ...extra].map(({ href, label }) => {
        const on = path === href;
        return (
          <Link key={href} href={href} aria-current={on ? 'page' : undefined}>
            {on && <motion.span layoutId="app-tab" className="app-tab-on" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span className="relative">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
