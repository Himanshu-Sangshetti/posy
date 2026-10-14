'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { NavMenu } from '@/components/studio/TopBar';

const TABS = [['/edit', 'Editor'], ['/analytics', 'Analytics'], ['/agents', 'Agents'], ['/settings', 'Settings']] as const;

export function DashHeader({ username, site, extra = [] }: { username: string; site: string; extra?: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-[1000px] items-center justify-between gap-3 px-5 pt-5 sm:px-8">
      <NavMenu username={username} site={site} current={path} />
      <nav aria-label="Sections" className="app-nav">
        {[...TABS, ...extra.map(e => [e.href, e.label] as const)].map(([href, label]) => (
          <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}>{label}</Link>
        ))}
      </nav>
      <a href={`${site}/${username}`} target="_blank" rel="noopener" className="hidden items-center gap-1 text-[14px] text-[var(--muted)] hover:text-[var(--text)] sm:inline-flex">View page<ArrowUpRight className="size-4" /></a>
    </header>
  );
}
