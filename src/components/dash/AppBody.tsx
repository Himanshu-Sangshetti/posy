'use client';

import { useEffect } from 'react';
import { Toaster } from 'sonner';

/** Puts the app tokens on <body> so dialogs, menus and toasts (rendered in portals) match, and mounts the toaster. */
export function AppBody() {
  useEffect(() => {
    document.body.classList.add('ac-body', 'posy-app');
    return () => document.body.classList.remove('ac-body', 'posy-app');
  }, []);
  return (
    <Toaster position="bottom-center" closeButton
      toastOptions={{ classNames: { toast: '!rounded-[14px] !border !border-[var(--line)] !bg-[var(--surface)] !text-[var(--text)] !shadow-[0_12px_32px_-14px_rgb(80_50_130/.35)] !font-sans', description: '!text-[var(--muted)]' } }} />
  );
}
