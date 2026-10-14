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
  const [tpl, setTpl] = useState<TemplateId>('creator');
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
        <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.035em] sm:text-[42px]">Claim your name</h1>
        <label className="flex h-16 items-center rounded-[20px] border border-[color-mix(in_oklab,#fff_60%,transparent)] bg-[color-mix(in_oklab,var(--surface)_80%,transparent)] pl-5 pr-3 text-[18px] shadow-[0_20px_50px_-30px_rgb(0_0_0/.3)] backdrop-blur-xl focus-within:ring-2 focus-within:ring-[var(--ring)]">
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
        <h2 className="text-[20px] font-semibold tracking-[-0.02em]">Pick a starting point</h2>
        <p className="-mt-2 text-[15px] text-[var(--muted)]">You can change everything later.</p>
        <div role="radiogroup" aria-label="Starting point" className="grid grid-cols-2 gap-4 md:grid-cols-4"
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
              className={cn('group grid cursor-pointer gap-3 rounded-[22px] border outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] bg-[color-mix(in_oklab,var(--surface)_70%,transparent)] p-2.5 text-left backdrop-blur-xl transition-all',
                tpl === id ? 'border-[var(--text)] shadow-[0_18px_40px_-24px_rgb(0_0_0/.45)]' : 'border-[color-mix(in_oklab,#fff_55%,transparent)] hover:-translate-y-0.5')}>
              <div className="grid h-[156px] place-items-center overflow-hidden rounded-[16px] bg-[var(--bg)]">{previews[id]}</div>
              <span className="px-1.5 pb-1"><span className="block text-[15px] font-semibold">{TEMPLATES[id].label}</span><span className="block text-[13px] text-[var(--muted)]">{TEMPLATES[id].note}</span></span>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={create} disabled={!check?.ok || busy}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--text)] px-7 text-[15.5px] font-medium text-[var(--surface)] transition-all hover:scale-[1.02] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40">
          {busy && <Loader2 className="size-4 animate-spin" />}Create my page
        </button>
        {error && <p role="alert" className="text-[14px] text-[#c2453c]">{error}</p>}
      </div>
    </div>
  );
}
