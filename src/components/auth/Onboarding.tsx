'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Lock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type StyleOpt = { id: string; label: string; note: string; preset: string; locked: boolean; preview: ReactNode };
type ThemeOpt = { id: string; name: string; bg: string; accent: string; text: string; dark: boolean; locked: boolean };
// Starter ids kept as data attributes so the choice is easy to script (the style's sample content).
const STARTER: Record<string, string> = { cozy: 'desk', editorial: 'writer', terminal: 'developer', neon: 'night', soft: 'creator' };

export function Onboarding({ initialUsername, styles, themes, host }: { initialUsername: string; styles: StyleOpt[]; themes: ThemeOpt[]; host: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialUsername.toLowerCase());
  const [check, setCheck] = useState<{ ok: boolean; reason?: string } | null>(null);
  const [style, setStyle] = useState('cozy');
  const [layout, setLayout] = useState<'bento' | 'list'>('bento');
  const [preset, setPreset] = useState(styles.find(x => x.id === 'cozy')?.preset ?? 'cream');
  const [empty, setEmpty] = useState(false);
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
    const res = await fetch('/api/v1/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: name, style, layout, preset, empty }) });
    if (!res.ok) { setError((await res.json()).error ?? 'Could not create your page'); setBusy(false); return; }
    router.push('/edit?welcome=1');
  }

  function pickStyle(id: string, focus = false) {
    setStyle(id);
    setPreset(styles.find(x => x.id === id)?.preset ?? 'cream');
    if (focus) setTimeout(() => (document.querySelector(`[data-style="${id}"]`) as HTMLElement | null)?.focus(), 0);
  }
  const previewSrc = `/onboarding/preview?style=${style}&layout=${layout}&preset=${preset}${empty ? '&empty=1' : ''}`;
  const previewKey = previewSrc;

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

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-10">
          <section className="grid gap-4">
            <h2 className="app-h2">Pick a <i>style</i></h2>
            <p className="-mt-2 text-[15px] text-[var(--muted)]">The whole feel of your page. You can switch any time.</p>
            <div role="radiogroup" aria-label="Style" className="grid grid-cols-2 gap-x-5 gap-y-7 pt-2 sm:grid-cols-3"
              onKeyDown={e => {
                const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
                if (!d) return;
                e.preventDefault();
                const i = styles.findIndex(x => x.id === style);
                pickStyle(styles[(i + d + styles.length) % styles.length].id, true);
              }}>
              {styles.map(o => (
                <div key={o.id} role="radio" data-tpl={STARTER[o.id]} data-style={o.id} aria-checked={style === o.id} tabIndex={style === o.id ? 0 : -1}
                  onClick={() => pickStyle(o.id)} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); pickStyle(o.id); } }}
                  className={cn('group relative grid cursor-pointer gap-2 bg-[var(--dk-white)] p-2.5 pb-3 text-left text-[#2d2723] shadow-[var(--dk-shadow)] outline-none transition-[rotate,translate,box-shadow] duration-500 [transition-timing-function:cubic-bezier(.2,.9,.25,1.15)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                    style === o.id ? 'rotate-0 -translate-y-1 shadow-[var(--dk-shadow-hi)] ring-2 ring-[color-mix(in_oklab,var(--accent)_70%,transparent)]' : 'odd:-rotate-[1.6deg] even:rotate-[1.4deg] hover:rotate-0')}>
                  {style === o.id && <span aria-hidden className="absolute -right-3 -top-3 z-10 grid size-9 rotate-12 place-items-center rounded-full border-[3px] border-[var(--dk-white)] bg-[var(--tint-mint)] shadow-md"><Check className="size-4" /></span>}
                  <div className="grid h-[132px] place-items-center overflow-hidden bg-[var(--bg)]">{o.preview}</div>
                  <span className="px-1">
                    <span className="app-hand flex items-center gap-1.5 text-[24px] leading-none">{o.label}{o.locked && <span className="inline-flex items-center gap-1 font-sans text-[12px] font-medium text-[#8d8379]"><Lock className="size-3" aria-hidden />Pro</span>}</span>
                    <span className="mt-1 block text-[13px] text-[#8d8379]">{o.note}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4">
            <h2 className="app-h2"><i>Layout</i></h2>
            <div role="radiogroup" aria-label="Layout" className="grid max-w-[460px] grid-cols-2 gap-4">
              {([['bento', 'Grid', 'Tiles in a tidy grid'], ['list', 'List', 'Stacked links, like Linktree']] as const).map(([id, label, note]) => (
                <button key={id} type="button" role="radio" data-layout={id} aria-checked={layout === id} onClick={() => setLayout(id)}
                  className={cn('grid gap-3 rounded-[6px] bg-[var(--dk-white)] p-4 text-left text-[#2d2723] shadow-[var(--dk-shadow)] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                    layout === id && 'ring-2 ring-[color-mix(in_oklab,var(--accent)_70%,transparent)]')}>
                  <span aria-hidden className="grid h-14 content-center gap-1.5">
                    {id === 'bento'
                      ? <span className="grid grid-cols-3 grid-rows-2 gap-1.5"><i className="col-span-2 h-6 rounded-[3px] bg-[#e7dfd3]" /><i className="h-6 rounded-[3px] bg-[#efe8de]" /><i className="h-6 rounded-[3px] bg-[#efe8de]" /><i className="col-span-2 h-6 rounded-[3px] bg-[#e7dfd3]" /></span>
                      : <span className="mx-auto grid w-3/4 gap-1.5"><i className="h-3.5 rounded-full bg-[#e7dfd3]" /><i className="h-3.5 rounded-full bg-[#efe8de]" /><i className="h-3.5 rounded-full bg-[#e7dfd3]" /></span>}
                  </span>
                  <span><span className="app-hand block text-[24px] leading-none">{label}</span><span className="mt-1 block text-[13px] text-[#8d8379]">{note}</span></span>
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-4">
            <h2 className="app-h2"><i>Colours</i></h2>
            <div role="radiogroup" aria-label="Colours" className="flex flex-wrap gap-3">
              {themes.map(t => (
                <button key={t.id} type="button" role="radio" data-preset={t.id} aria-checked={preset === t.id} aria-label={t.locked ? `${t.name} (Pro)` : t.name} title={t.locked ? `${t.name} · Pro` : t.name}
                  onClick={() => setPreset(t.id)}
                  className={cn('relative grid size-11 place-items-center overflow-hidden rounded-full outline-none shadow-[var(--dk-shadow)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]', preset === t.id && 'ring-2 ring-offset-2 ring-offset-[var(--bg)] ring-[#2d2723]')}
                  style={{ background: t.bg }}>
                  <span className="size-4 rounded-full" style={{ background: t.accent }} />
                  {t.locked && <Lock className="absolute bottom-0.5 right-0.5 size-3" style={{ color: t.text }} aria-hidden />}
                </button>
              ))}
            </div>
            <p className="text-[14px] text-[var(--muted)]">{themes.find(t => t.id === preset)?.name}</p>
          </section>

          <label className="flex cursor-pointer items-center gap-3 text-[15px] text-[var(--muted)]">
            <input type="checkbox" data-empty checked={empty} onChange={e => setEmpty(e.target.checked)} className="size-4 accent-[#2d2723]" />
            Start with an empty page (no sample links)
          </label>
        </div>

        <aside className="lg:sticky lg:top-6" aria-label="Preview">
          <div className="overflow-hidden rounded-[10px] bg-[var(--dk-white)] shadow-[var(--dk-shadow)]">
            <div className="flex h-8 items-center gap-1.5 border-b border-[#efe8de] px-3" aria-hidden>
              <i className="size-2.5 rounded-full bg-[#e6ddd2]" /><i className="size-2.5 rounded-full bg-[#e6ddd2]" /><i className="size-2.5 rounded-full bg-[#e6ddd2]" />
              <span className="mx-auto rounded bg-[#f6f1e9] px-3 py-0.5 text-[12px] text-[#8d8379]">{host}/{name || 'yourname'}</span><span className="w-8" />
            </div>
            <iframe key={previewKey} title="Live preview of your page" aria-hidden tabIndex={-1} src={previewSrc} className="pointer-events-none block h-[540px] w-full border-0 bg-[var(--bg)]" />
          </div>
        </aside>
      </div>

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
