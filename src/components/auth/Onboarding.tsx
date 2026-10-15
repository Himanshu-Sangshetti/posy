'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Lock, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { STYLE_PALETTES, type StyleId } from '@/lib/styles';

type StyleOpt = { id: string; label: string; note: string; preset: string; layout: Layout; locked: boolean; preview: ReactNode };
type Layout = 'bento' | 'list' | 'canvas';
type ThemeOpt = { id: string; name: string; bg: string; accent: string; text: string; dark: boolean; locked: boolean };
// Starter ids kept as data attributes so the choice is easy to script (the style's sample content).
const STARTER: Record<string, string> = { cozy: 'desk', minimal: 'creator', washi: 'writer', lofi: 'night', press: 'press', gallery: 'gallery', painted: 'painted', night: 'neon' };

export function Onboarding({ initialUsername, initialStyle = 'cozy', styles, themes, host }: { initialUsername: string; initialStyle?: string; styles: StyleOpt[]; themes: ThemeOpt[]; host: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialUsername.toLowerCase());
  const [check, setCheck] = useState<{ ok: boolean; reason?: string } | null>(null);
  const [style, setStyle] = useState(initialStyle);
  const [layout, setLayout] = useState<Layout>(styles.find(x => x.id === initialStyle)?.layout ?? 'bento');
  const [preset, setPreset] = useState(styles.find(x => x.id === initialStyle)?.preset ?? 'cream');
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
    if (!res.ok) { const m = (await res.json().catch(() => ({}))).error ?? 'Could not create your page'; setError(m); toast.error(m); setBusy(false); return; }
    router.push('/edit?welcome=1');
  }

  function pickStyle(id: string, focus = false) {
    setStyle(id);
    setPreset(styles.find(x => x.id === id)?.preset ?? 'cream');
    setLayout(styles.find(x => x.id === id)?.layout ?? 'bento');
    if (focus) setTimeout(() => (document.querySelector(`[data-style="${id}"]`) as HTMLElement | null)?.focus(), 0);
  }
  const previewSrc = `/onboarding/preview?style=${style}&layout=${layout}&preset=${preset}${empty ? '&empty=1' : ''}`;
  const previewKey = previewSrc;

  const styleLabel = styles.find(x => x.id === style)?.label ?? '';
  const themeName = themes.find(t => t.id === preset)?.name ?? '';
  return (
    <div className="ac-rise grid grid-cols-[minmax(0,1fr)] gap-8">
      <section className="ob-hero">
        <div className="ob-hero-copy">
          <div>
            <h1 className="ac-display ac-h1">Claim your <i>name</i></h1>
            <p className="ac-lede mt-3">This is where people will find you. Then pick a look below and watch your page come together.</p>
          </div>
          <label className="ac-card flex h-16 min-w-0 items-center pl-5 pr-4 text-[18px] transition-shadow focus-within:border-[var(--ac-deep)] focus-within:shadow-[0_0_0_4px_rgb(228_87_46/.22)]">
            <span className="ac-mono text-[15px] text-[var(--muted)]">{host}/</span>
            <input autoFocus aria-label="Username" value={name} onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} maxLength={30} placeholder="yourname"
              className="w-0 min-w-0 flex-1 bg-transparent font-medium outline-none placeholder:text-[var(--muted)]/50" />
            <span className="ml-2 flex shrink-0 items-center gap-1.5 text-[13.5px]" role="status" aria-live="polite">
              {name && !check && <Loader2 className="size-4 animate-spin text-[var(--muted)]" />}
              {check?.ok && <span className="ac-pill ac-tone-mint !normal-case !tracking-normal"><Check className="size-3.5" />Available</span>}
              {check && !check.ok && <span className="ac-pill ac-tone-rose !normal-case !tracking-normal"><X className="size-3.5" />{check.reason}</span>}
            </span>
          </label>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ob-hero-art" src="/art/onboard.jpg" alt="A girl on the floor choosing which photos and records to pin up, her cat batting at a postcard" />
      </section>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="grid min-w-0 gap-8">
          <section className="grid gap-4">
            <div><h2 className="ac-display ac-h2">The whole <i>feel</i></h2><p className="mt-1.5 text-[14.5px] text-[var(--muted)]">You can switch any time.</p></div>
            <div role="radiogroup" aria-label="Style" className="grid grid-cols-2 gap-3"
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
                  className="ac-opt">
                  <div className="grid h-[150px] place-items-center overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--bg)] sm:h-[176px]">{o.preview}</div>
                  <span className="px-0.5">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[15px] font-semibold leading-none">{o.label}</span>
                      {o.locked && <Badge variant="secondary" className="ac-pill ac-tone-butter !h-5 rounded-full"><Lock className="!size-3" aria-hidden />Pro</Badge>}
                      {style === o.id && !o.locked && <span aria-hidden className="grid size-5 place-items-center rounded-full bg-[var(--ac-deep)] text-white"><Check className="size-3" /></span>}
                    </span>
                    <span className="mt-1.5 block text-[12.5px] leading-snug text-[var(--muted)]">{o.note}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4">
            <div><h2 className="ac-display ac-h2">How tiles <i>sit</i></h2></div>
            <div role="radiogroup" aria-label="Layout" className="grid grid-cols-3 gap-3">
              {([['bento', 'Grid', 'A mosaic of tiles of different sizes.'], ['list', 'List', 'One clean column, like a link in bio.'], ['canvas', 'Canvas', 'Place anything anywhere, overlap and tilt.']] as const).map(([id, label, note]) => (
                <button key={id} type="button" role="radio" data-layout={id} aria-checked={layout === id} onClick={() => setLayout(id)} className="ac-opt">
                  <span aria-hidden className="grid h-14 content-center gap-1.5 rounded-[10px] bg-[var(--bg)] px-4">
                    {id === 'canvas'
                      ? <span className="relative mx-auto block h-11 w-3/4"><i className="absolute left-0 top-1 h-7 w-10 rotate-[-4deg] rounded-[3px] border border-[var(--text)] bg-[var(--surface)]" /><i className="absolute left-7 top-3 h-7 w-11 rotate-[3deg] rounded-[3px] border border-[var(--text)] bg-[var(--surface)]" /><i className="absolute right-0 top-0 h-6 w-8 rotate-[-2deg] rounded-[3px] border border-[var(--text)] bg-[var(--surface)]" /></span>
                      : id === 'bento'
                      ? <span className="grid grid-cols-3 grid-rows-2 gap-1.5"><i className="col-span-2 h-5 rounded-[5px] bg-[var(--ac-rose)]" /><i className="h-5 rounded-[5px] bg-[var(--ac-sky)]" /><i className="h-5 rounded-[5px] bg-[var(--ac-mint)]" /><i className="col-span-2 h-5 rounded-[5px] bg-[var(--ac-butter)]" /></span>
                      : <span className="mx-auto grid w-3/4 gap-1.5"><i className="h-3 rounded-full bg-[var(--ac-lilac)]" /><i className="h-3 rounded-full bg-[var(--ac-rose)]" /><i className="h-3 rounded-full bg-[var(--ac-mint)]" /></span>}
                  </span>
                  <span><span className="block text-[15px] font-semibold leading-none">{label}</span><span className="mt-1.5 block text-[12.5px] text-[var(--muted)]">{note}</span></span>
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-4">
            <div><h2 className="ac-display ac-h2">Pick a <i>palette</i></h2></div>
            <TooltipProvider delayDuration={150}>
              <div role="radiogroup" aria-label="Colours" className="flex flex-wrap gap-3">
                {(STYLE_PALETTES[style as StyleId] ?? []).map(id => themes.find(t => t.id === id)).filter(t => !!t).map(t => (
                  <Tooltip key={t.id}>
                    <TooltipTrigger asChild>
                      <button type="button" role="radio" data-preset={t.id} aria-checked={preset === t.id} aria-label={t.locked ? `${t.name} (Pro)` : t.name} onClick={() => setPreset(t.id)}
                        className={cn('relative grid size-12 place-items-center overflow-hidden rounded-full border border-[var(--line)] outline-none transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-[var(--ring)]', preset === t.id && 'ring-2 ring-[var(--ac-deep)] ring-offset-2 ring-offset-[var(--bg)]')}
                        style={{ background: t.bg }}>
                        <span className="size-4 rounded-full" style={{ background: t.accent }} />
                        {t.locked && <Lock className="absolute bottom-1 right-1 size-3" style={{ color: t.text }} aria-hidden />}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{t.locked ? `${t.name} · Pro` : t.name}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
            <p className="ac-mono text-[12.5px] text-[var(--muted)]">{themeName}</p>
          </section>

          <label className="flex cursor-pointer items-center gap-3 text-[14.5px] text-[var(--muted)]">
            <Checkbox data-empty checked={empty} onCheckedChange={v => setEmpty(v === true)} className="size-5 rounded-md data-[state=checked]:border-[var(--ac-deep)] data-[state=checked]:bg-[var(--ac-deep)]" />
            Start with an empty page (no sample links)
          </label>
        </div>

        <aside className="lg:sticky lg:top-6" aria-label="Preview">
          <div className="overflow-hidden rounded-[20px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--ac-shadow)]">
            <div className="flex h-10 items-center gap-1.5 border-b border-[var(--line)] px-3.5" aria-hidden>
              <i className="size-2.5 rounded-full bg-[var(--ac-rose)]" /><i className="size-2.5 rounded-full bg-[var(--ac-butter)]" /><i className="size-2.5 rounded-full bg-[var(--ac-mint)]" />
              <span className="ac-mono mx-auto max-w-[200px] truncate rounded-full bg-[var(--bg)] px-3 py-0.5 text-[11.5px] text-[var(--muted)]">{host}/{name || 'yourname'}</span><span className="w-10" />
            </div>
            <iframe key={previewKey} title="Live preview of your page" aria-hidden tabIndex={-1} src={previewSrc} className="pointer-events-none block h-[540px] w-full border-0 bg-[var(--bg)]" />
          </div>
        </aside>
      </div>

      <div className="ac-card sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 bg-[rgb(255_253_250/.92)] p-3 pl-5 backdrop-blur-md">
        <p className="ac-mono min-w-0 max-w-full flex-1 basis-60 truncate text-[12.5px] text-[var(--muted)]">
          <span className="text-[var(--text)]">{host}/{name || 'yourname'}</span> · {styleLabel} · {layout === 'bento' ? 'Grid' : layout === 'list' ? 'List' : 'Canvas'} · {themeName}
        </p>
        <div className="flex items-center gap-3">
          {error && <p role="alert" className="text-[13.5px] text-[#b23a1c]">{error}</p>}
          <Button type="button" onClick={create} disabled={!check?.ok || busy} className="ac-btn ac-btn-primary h-11 px-6">
            {busy && <Loader2 className="size-4 animate-spin" />}Create my page
          </Button>
        </div>
      </div>
    </div>
  );
}
