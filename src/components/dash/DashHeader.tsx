'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, BarChart3, Bot, LogOut, PenLine, Settings } from 'lucide-react';
import { signOut } from '@/lib/auth-client';
import { Logo } from '@/components/brand';
import { AppTabs } from './AppTabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const TABS = [['/edit', 'Editor', PenLine], ['/analytics', 'Analytics', BarChart3], ['/agents', 'Agents', Bot], ['/settings', 'Settings', Settings]] as const;

export function DashHeader({ username, email, site, extra = [] }: { username: string; email: string; site: string; extra?: { href: string; label: string }[] }) {
  const path = usePathname();
  const host = site.replace(/^https?:\/\//, '');
  return (
    <header className="ac-head">
      <div className="mx-auto flex w-full max-w-[1040px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3 sm:px-8">
        <Link href="/" aria-label="Posy home" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"><Logo /></Link>
        <AppTabs extra={extra} className="order-3 w-full justify-between overflow-x-auto sm:order-none sm:w-auto sm:justify-start" />
        <div className="flex items-center gap-1.5">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <a href={`${site}/${username}`} target="_blank" rel="noopener" className="ac-mono hidden h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-[var(--muted)] outline-none transition-colors hover:bg-[var(--ac-lilac-bg)] hover:text-[var(--ac-deep)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] md:inline-flex">
                  {host}/{username}<ArrowUpRight className="size-3.5" />
                </a>
              </TooltipTrigger>
              <TooltipContent>Open your live page</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Account menu" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
              <Avatar className="size-9 border border-[var(--line)]">
                <AvatarFallback className="bg-[var(--ac-lilac)] text-[13px] font-semibold text-[var(--ac-deep)]">{(username[0] ?? 'p').toUpperCase()}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-2xl border-[var(--line)] p-1.5">
              <DropdownMenuLabel className="px-2.5 py-2">
                <span className="block text-[14px] font-medium">{username}</span>
                <span className="block truncate text-[12.5px] font-normal text-[var(--muted)]">{email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {TABS.map(([href, label, Icon]) => (
                <DropdownMenuItem key={href} asChild className="h-9 rounded-[10px] px-2.5"><Link href={href}><Icon className="size-4 text-[var(--muted)]" />{label}</Link></DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="h-9 rounded-[10px] px-2.5"><a href={`${site}/${username}`} target="_blank" rel="noopener"><ArrowUpRight className="size-4 text-[var(--muted)]" />View my page</a></DropdownMenuItem>
              <DropdownMenuItem className="h-9 rounded-[10px] px-2.5" onSelect={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = '/'; } } })}>
                <LogOut className="size-4 text-[var(--muted)]" />Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
