'use client';
// The public site's top bar (Aceternity Resizable Navbar): full width and clear at the top, a floating frosted pill
// once you scroll. `tone` says what is behind it at the top: a dark painting (white text) or light paper (ink).
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Navbar, NavBody, NavItems, MobileNav, MobileNavHeader, MobileNavMenu, MobileNavToggle } from '@/components/ui/resizable-navbar';
import { Logo } from '@/components/brand';
import { cn } from '@/lib/utils';
import './site.css';

/** `extra` sits before the account links, e.g. an edition's GitHub button. */
export function SiteNav({ items, tone = 'dark', signedIn, pinned, extra }: { items: { name: string; link: string }[]; tone?: 'dark' | 'light'; signedIn?: boolean; pinned?: boolean; extra?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ext = (href: string) => href.startsWith('http');
  return (
    <Navbar pinned={pinned} className={cn('lp-nav fixed top-0', `lp-nav-${tone}`)}>
      <NavBody className="lp-navbody">
        <Link href="/" aria-label="Posy home" className="relative z-20 lp-logo"><Logo /></Link>
        <NavItems items={items} className="lp-navitems" />
        <div className="relative z-20 flex items-center gap-1">
          {extra}
          {signedIn ? <Link href="/edit" className="lp-cta">Open my page</Link> : <>
            <Link href="/login" className="lp-link">Log in</Link>
            <Link href="/signup" className="lp-cta">Make my page</Link>
          </>}
        </div>
      </NavBody>
      <MobileNav className="lp-navbody">
        <MobileNavHeader>
          <Link href="/" aria-label="Posy home" className="lp-logo"><Logo /></Link>
          <MobileNavToggle isOpen={open} onClick={() => setOpen(v => !v)} />
        </MobileNavHeader>
        <MobileNavMenu isOpen={open} onClose={() => setOpen(false)}>
          {items.map(i => <a key={i.name} href={i.link} target={ext(i.link) ? '_blank' : undefined} rel={ext(i.link) ? 'noopener' : undefined} onClick={() => setOpen(false)} className="text-[17px] text-[#15141a]">{i.name}</a>)}
          {signedIn ? <Link href="/edit" className="lp-cta">Open my page</Link> : <>
            <Link href="/login" className="text-[17px] text-[#15141a]">Log in</Link>
            <Link href="/signup" className="lp-cta">Make my page</Link>
          </>}
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
