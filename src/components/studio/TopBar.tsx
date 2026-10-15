'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, BarChart3, Bot, Check, ChevronDown, Command, Copy, Loader2, LogOut, PenLine, Send, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { signOut } from '@/lib/auth-client';
import { PosyMark } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CHROME } from './chrome';
import type { SaveState } from './Dock';

const NAV = [
  { href: '/edit', label: 'Editor', icon: PenLine },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/agents', label: 'Agents', icon: Bot },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function NavMenu({ username, site, current }: { username: string; site: string; current: string }) {
  const item = 'flex h-9 w-full items-center gap-2.5 rounded-[9px] px-2.5 text-[13.5px] transition-colors hover:bg-[var(--secondary)]';
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label="Menu" className="group flex h-9 items-center gap-1.5 rounded-[10px] pl-1 pr-2 transition-colors hover:bg-[var(--secondary)] data-[state=open]:bg-[var(--secondary)]">
          <PosyMark className="size-6" /><ChevronDown className="size-3.5 text-[var(--muted)] transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className={cn(CHROME, 'sc-pop w-56 rounded-[14px] p-1.5')}>
        <p className="sc-eyebrow px-2.5 pb-1.5 pt-1">Posy</p>
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={cn(item, current === href && 'bg-[var(--sc-on)] font-medium')}>
            <Icon className="size-4 text-[var(--muted)]" />{label}
          </Link>
        ))}
        <div className="my-1.5 h-px bg-[var(--line)]" />
        <a href={`${site}/${username}`} target="_blank" rel="noopener" className={item}><ArrowUpRight className="size-4 text-[var(--muted)]" />View my page</a>
        <button type="button" onClick={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = '/'; } } })} className={item}>
          <LogOut className="size-4 text-[var(--muted)]" />Log out
        </button>
      </PopoverContent>
    </Popover>
  );
}

export function TopBar({ username, site, saveState, unpublished, publishing, onPublish, onShare, onCommand }: {
  username: string; site: string; saveState: SaveState; unpublished: boolean; publishing: boolean;
  onPublish: () => void; onShare: () => void; onCommand: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const host = site.replace(/^https?:\/\//, '');
  const status = saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Couldn’t save' : unpublished ? 'Unpublished changes' : 'Live';
  const dot = saveState === 'error' ? 'sc-dot-error' : saveState === 'saving' ? 'sc-dot-saving' : unpublished ? 'sc-dot-draft' : 'sc-dot-live';
  const copy = async () => {
    await navigator.clipboard.writeText(`${site}/${username}`);
    setCopied(true); toast.success('Link copied'); setTimeout(() => setCopied(false), 1400);
  };
  return (
    <header onClick={e => e.stopPropagation()} className={cn(CHROME, 'sc-bar fixed inset-x-0 top-0 z-40 grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 sm:px-4')}>
      <div className="flex items-center gap-1">
        <NavMenu username={username} site={site} current="/edit" />
        <span className="mx-1 hidden h-4 w-px bg-[var(--line)] sm:block" />
        <span className="sc-title hidden text-[19px] leading-none sm:block">Editor</span>
      </div>

      <div className="hidden items-center gap-0.5 rounded-full border border-[var(--line)] bg-[var(--surface)] py-0.5 pl-3.5 pr-0.5 text-[13px] sm:flex">
        <a href={`${site}/${username}`} target="_blank" rel="noopener" className="sc-mono text-[12.5px] text-[var(--muted)] transition-colors hover:text-[var(--text)]">{host}/<span className="font-medium text-[var(--text)]">{username}</span></a>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Copy link" onClick={copy} className="ml-1 size-7 rounded-full text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--text)]">
              {copied ? <Check className="size-3.5 text-[var(--sc-deep)]" /> : <Copy className="size-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent className={CHROME}>Copy link</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center justify-end gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="sm" aria-label="Search commands" onClick={onCommand} className="h-8 gap-1.5 rounded-[10px] px-2 text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--text)]">
              <Command className="size-4" /><span className="hidden md:inline-flex"><span className="sc-kbd">⌘K</span></span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className={CHROME}>Commands</TooltipContent>
        </Tooltip>
        <span className="mx-1 hidden items-center gap-2 rounded-full bg-[var(--secondary)] py-1 pl-2.5 pr-3 text-[12.5px] text-[var(--muted)] md:flex" role="status" aria-label={status}>
          <span className={cn('sc-dot', dot)} />{status}
        </span>
        <span className="flex md:hidden" role="status" aria-label={status}><span className={cn('sc-dot mx-1', dot)} /></span>
        <Button type="button" variant="outline" size="sm" aria-label="Share" onClick={onShare} className="h-9 gap-1.5 rounded-[10px] border-[var(--line)] bg-[var(--surface)] px-3 text-[13.5px] shadow-none hover:bg-[var(--secondary)]">
          <Send className="size-3.5" /><span className="hidden sm:inline">Share</span>
        </Button>
        <Button type="button" data-publish onClick={onPublish} disabled={!unpublished || publishing || saveState !== 'saved'}
          className="h-9 gap-1.5 rounded-[10px] bg-[var(--text)] px-4 text-[13.5px] text-[var(--surface)] shadow-[0_6px_16px_-8px_rgb(22_20_15/.7)] hover:bg-[#3a3248] disabled:opacity-100 disabled:shadow-none disabled:bg-[var(--sc-on)] disabled:text-[var(--muted)]">
          {publishing && <Loader2 className="size-3.5 animate-spin" />}Publish
        </Button>
      </div>
    </header>
  );
}
