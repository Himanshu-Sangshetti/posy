'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, BarChart3, Bot, Check, ChevronDown, Copy, Loader2, LogOut, PenLine, Settings } from 'lucide-react';
import { signOut } from '@/lib/auth-client';
import { PosyMark } from '@/components/brand';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { SaveState } from './Dock';

export function NavMenu({ username, site, current }: { username: string; site: string; current: string }) {
  const items = [
    { href: '/edit', label: 'Editor', icon: PenLine },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/agents', label: 'Agents', icon: Bot },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="flex h-10 items-center gap-2 rounded-[13px] pl-1.5 pr-2.5 transition-colors hover:bg-[var(--secondary)]" aria-label="Menu">
          <PosyMark className="size-7" /><ChevronDown className="size-4 text-[var(--muted)]" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-56 p-1.5">
        {items.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={cn('flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14px] transition-colors hover:bg-[var(--secondary)]', current === href && 'bg-[var(--secondary)] font-medium')}>
            <Icon className="size-4 text-[var(--muted)]" />{label}
          </Link>
        ))}
        <div className="my-1.5 h-px bg-[var(--line)]" />
        <a href={`${site}/${username}`} target="_blank" rel="noopener" className="flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14px] hover:bg-[var(--secondary)]">
          <ArrowUpRight className="size-4 text-[var(--muted)]" />View my page
        </a>
        <button type="button" onClick={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = '/'; } } })}
          className="flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-[14px] hover:bg-[var(--secondary)]">
          <LogOut className="size-4 text-[var(--muted)]" />Log out
        </button>
      </PopoverContent>
    </Popover>
  );
}

export function TopBar({ username, site, saveState, unpublished, publishing, onPublish }: {
  username: string; site: string; saveState: SaveState; unpublished: boolean; publishing: boolean; onPublish: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const host = site.replace(/^https?:\/\//, '');
  const status = saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Couldn’t save' : unpublished ? 'Unpublished changes' : 'Live';
  return (
    <header onClick={e => e.stopPropagation()} className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between gap-3 px-3 sm:px-5">
      <div className="pointer-events-auto rounded-[16px] border border-[var(--line)] bg-[color-mix(in_oklab,var(--surface)_85%,transparent)] p-1 shadow-[0_10px_30px_-18px_rgb(0_0_0/.3)] backdrop-blur-xl">
        <NavMenu username={username} site={site} current="/edit" />
      </div>
      <div className="pointer-events-auto hidden items-center gap-1 rounded-[16px] border border-[var(--line)] bg-[color-mix(in_oklab,var(--surface)_85%,transparent)] py-1 pl-4 pr-1 text-[14px] shadow-[0_10px_30px_-18px_rgb(0_0_0/.3)] backdrop-blur-xl sm:flex">
        <a href={`${site}/${username}`} target="_blank" rel="noopener" className="text-[var(--muted)] hover:text-[var(--text)]">{host}/<span className="font-medium text-[var(--text)]">{username}</span></a>
        <button type="button" aria-label="Copy link" onClick={async () => { await navigator.clipboard.writeText(`${site}/${username}`); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
          className="ml-1 grid size-8 place-items-center rounded-[10px] text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--text)]">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
      </div>
      <div className="pointer-events-auto flex items-center gap-1 rounded-[16px] border border-[var(--line)] bg-[color-mix(in_oklab,var(--surface)_85%,transparent)] p-1 pl-3.5 shadow-[0_10px_30px_-18px_rgb(0_0_0/.3)] backdrop-blur-xl">
        <span className="flex items-center gap-2 text-[13.5px] text-[var(--muted)]" role="status" aria-label={status}>
          <span className={cn('size-2 rounded-full', saveState === 'error' ? 'bg-[#e5534b]' : saveState === 'saving' ? 'bg-[var(--accent)]' : unpublished ? 'bg-[#e8a53a]' : 'bg-[#43b37a]')} />
          <span className="hidden md:inline">{status}</span>
        </span>
        <button type="button" onClick={onPublish} disabled={!unpublished || publishing || saveState !== 'saved'}
          className="ml-2 inline-flex h-10 items-center gap-2 rounded-[12px] bg-[var(--text)] px-4 text-[14px] font-medium text-[var(--surface)] transition-all active:scale-[.97] disabled:opacity-40">
          {publishing && <Loader2 className="size-4 animate-spin" />}Publish
        </button>
      </div>
    </header>
  );
}
