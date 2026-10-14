'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, X } from 'lucide-react';
import { TEMPLATES, type TemplateId } from '@/lib/templates';
import { cn } from '@/lib/utils';

export function Onboarding({ initialUsername, previews, host }: { initialUsername: string; previews: Record<string, ReactNode>; host: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialUsername.toLowerCase());
  const [check, setCheck] = useState<{ ok: boolean; reason?: string } | null>(null);
  const [tpl, setTpl] = useState<TemplateId>('desk');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!name) { setCheck(null); return; }
    setCheck(null);
    const t = setTimeout(async () => setCheck(await (await fetch(`/api/v1/username?check=${encodeURIComponent(name)}`)).json()), 280);
    return () => clearTimeout(t);
  }, [name]);

  async function create() {
    setBusy(true); setError('');
    const res = await fetch('/api/v1/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: name, template: tpl }) });
    if (!res.ok) { setError((await res.json()).error ?? 'Could not create your page'); setBusy(false); return; }
    router.push('/edit?welcome=1');
  }

  return (
    <div className="posy-rise grid gap-10">
      <section className="grid gap-4">
        <h1 className="app-h1">Claim your <i>name</i></h1>
        <label className="flex h-16 items-center rounded-[6px] bg-[var(--dk-white)] pl-5 pr-3 text-[18px] text-[#2d2723] shadow-[var(--dk-shadow)] focus-within:ring-2 focus-within:ring-[var(--ring)]">
          <span className="text-[var(--muted)]">{host}/</span>
          <input autoFocus aria-label="Username" value={name} onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} maxLength={30} placeholder="yourname"
            className="min-w-0 flex-1 bg-transparent font-medium outline-none placeholder:text-[var(--muted)]/50" />
          <span className="ml-2 flex items-center gap-1.5 text-[14px]" role="status" aria-live="polite">
            {name && !check && <Loader2 className="size-4 animate-spin text-[var(--muted)]" />}
            {check?.ok && <><Check className="size-4 text-[#2f9e62]" /><span className="text-[#2f9e62]">Available</span></>}
            {check && !check.ok && <><X className="size-4 text-[#c2453c]" /><span className="text-[#c2453c]">{check.reason}</span></>}
          </span>
        </label>
      </section>

      <section className="grid gap-4">
        <h2 className="app-h2">Pick a starting <i>point</i></h2>
        <p className="-mt-2 text-[15px] text-[var(--muted)]">You can change everything later.</p>
        <div role="radiogroup" aria-label="Starting point" className="grid grid-cols-2 gap-x-5 gap-y-8 pt-2 md:grid-cols-3"
          onKeyDown={e => {
            const ids = Object.keys(TEMPLATES) as TemplateId[];
            const i = ids.indexOf(tpl), d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
            if (!d) return;
            e.preventDefault();
            const next = ids[(i + d + ids.length) % ids.length];
            setTpl(next);
            (e.currentTarget.querySelector(`[data-tpl="${next}"]`) as HTMLElement | null)?.focus();
          }}>
          {(Object.keys(TEMPLATES) as TemplateId[]).map(id => (
            <div key={id} role="radio" data-tpl={id} aria-checked={tpl === id} tabIndex={tpl === id ? 0 : -1}
              onClick={() => setTpl(id)} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setTpl(id); } }}
              className={cn('group relative grid cursor-pointer gap-2 bg-[var(--dk-white)] p-2.5 pb-3 text-left text-[#2d2723] shadow-[var(--dk-shadow)] outline-none transition-[rotate,translate,box-shadow] duration-500 [transition-timing-function:cubic-bezier(.2,.9,.25,1.15)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                tpl === id ? 'rotate-0 -translate-y-1 shadow-[var(--dk-shadow-hi)] ring-2 ring-[color-mix(in_oklab,var(--accent)_70%,transparent)]' : 'odd:-rotate-[1.6deg] even:rotate-[1.4deg] hover:rotate-0')}>
              {tpl === id && <span aria-hidden className="absolute -right-3 -top-3 z-10 grid size-9 rotate-12 place-items-center rounded-full border-[3px] border-[var(--dk-white)] bg-[var(--tint-mint)] shadow-md"><Check className="size-4" /></span>}
              <div className="grid h-[156px] place-items-center overflow-hidden bg-[var(--bg)]">{previews[id]}</div>
              <span className="px-1"><span className="app-hand block text-[24px] leading-none">{TEMPLATES[id].label}</span><span className="mt-1 block text-[13px] text-[#8d8379]">{TEMPLATES[id].note}</span></span>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={create} disabled={!check?.ok || busy}
          className="app-btn h-12 px-7 text-[15.5px] disabled:cursor-not-allowed">
          {busy && <Loader2 className="size-4 animate-spin" />}Create my page
        </button>
        {error && <p role="alert" className="text-[14px] text-[#c2453c]">{error}</p>}
      </div>
    </div>
  );
}
