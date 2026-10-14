'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { NavMenu } from '@/components/studio/TopBar';
import { cn } from '@/lib/utils';

const TABS = [['/edit', 'Editor'], ['/analytics', 'Analytics'], ['/agents', 'Agents'], ['/settings', 'Settings']] as const;

export function DashHeader({ username, site }: { username: string; site: string }) {
  const path = usePathname();
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-[1000px] items-center justify-between gap-3 px-5 pt-5 sm:px-8">
      <NavMenu username={username} site={site} current={path} />
      <nav aria-label="Sections" className="flex items-center gap-1 rounded-[16px] border border-[color-mix(in_oklab,#fff_55%,transparent)] bg-[color-mix(in_oklab,var(--surface)_75%,transparent)] p-1 backdrop-blur-xl">
        {TABS.map(([href, label]) => (
          <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}
            className={cn('rounded-[12px] px-3.5 py-2 text-[14px] transition-colors', path === href ? 'bg-[var(--text)] text-[var(--surface)]' : 'text-[var(--muted)] hover:text-[var(--text)]')}>
            {label}
          </Link>
        ))}
      </nav>
      <a href={`${site}/${username}`} target="_blank" rel="noopener" className="hidden items-center gap-1 text-[14px] text-[var(--muted)] hover:text-[var(--text)] sm:inline-flex">View page<ArrowUpRight className="size-4" /></a>
    </header>
  );
}
