'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

/** A plain GET form: it works with JS off. JS only tidies what you type. */
export function ClaimForm({ host, id = 'claim' }: { host: string; id?: string }) {
  const [name, setName] = useState('');
  return (
    <form action="/signup" method="get" className="flex w-full max-w-[520px] flex-col gap-3 sm:flex-row">
      <label htmlFor={id} className="flex h-14 w-full min-w-0 items-center sm:flex-1 rounded-[18px] border border-[var(--line)] bg-[var(--surface)] px-4 text-[16px] shadow-[0_14px_34px_-24px_rgb(0_0_0/.3)] focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-[color-mix(in_oklab,var(--accent)_25%,transparent)]">
        <span className="shrink-0 text-[var(--muted)]">{host}/</span>
        <input id={id} name="username" value={name} onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30))}
          placeholder="yourname" autoComplete="off" autoCapitalize="none" spellCheck={false} minLength={3} maxLength={30} pattern="[a-z0-9][a-z0-9_\-]{1,28}[a-z0-9]"
          title="3–30 letters, numbers, - or _" className="h-full min-w-0 flex-1 bg-transparent pl-0.5 font-medium outline-none placeholder:font-normal placeholder:text-[color-mix(in_oklab,var(--muted)_70%,transparent)]" />
      </label>
      <button type="submit" className="inline-flex h-14 items-center justify-center gap-2 rounded-[18px] bg-[var(--text)] px-6 text-[16px] font-medium text-[var(--surface)] transition-transform hover:-translate-y-0.5 active:scale-[.98]">
        Claim it<ArrowRight className="size-[18px]" />
      </button>
    </form>
  );
}
