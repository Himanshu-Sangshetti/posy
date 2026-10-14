'use client';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { Page } from '@/lib/schema';
import { cn } from '@/lib/utils';
import { CHROME } from './chrome';
import { ThemePanel, type DesignTab } from './ThemePanel';

/** The design inspector. Non-modal, so tiles stay editable while it is open. */
export function DesignSheet({ open, onOpenChange, page, tab, onTab }: {
  open: boolean; onOpenChange: (o: boolean) => void; page: Page; tab: DesignTab; onTab: (t: DesignTab) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent side="right" overlay={false}
        onInteractOutside={e => e.preventDefault()} onOpenAutoFocus={e => e.preventDefault()}
        className={cn(CHROME, 'sc-pop gap-0 border-[var(--line)] bg-[var(--surface)] p-0',
          'inset-x-0 bottom-0 top-auto h-[64dvh] w-full rounded-t-[22px] border-l-0 border-t sm:inset-x-auto sm:bottom-0 sm:right-0 sm:top-14 sm:h-[calc(100dvh-3.5rem)] sm:w-[380px] sm:max-w-[380px] sm:rounded-none sm:border-l sm:border-t-0')}>
        <SheetHeader className="gap-0.5 px-5 pb-4 pt-5">
          <p className="sc-eyebrow">Look and feel</p>
          <SheetTitle className="sc-title text-[28px] font-normal leading-none">Design</SheetTitle>
          <SheetDescription className="sr-only">Change the style, colours, type, layout and backdrop of your page.</SheetDescription>
        </SheetHeader>
        <ThemePanel page={page} tab={tab} onTab={onTab} />
      </SheetContent>
    </Sheet>
  );
}
