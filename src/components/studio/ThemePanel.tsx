'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import type { Page } from '@/lib/schema';
import { FONTS, RADII, BACKGROUNDS, TILE_STYLES, EFFECTS, AVATARS } from '@/lib/schema';
import { THEMES, THEME_IDS, PREMIUM_THEMES, type ThemeId } from '@/lib/themes';
import { ALL_FONT_PAIRS as FONT_PAIRS, FONT_VARS, PREMIUM_FONTS } from '@/lib/style';
import { useEntitlements } from './entitlements';
import { STYLE_IDS, STYLE_INFO, PREMIUM_STYLES, type StyleId } from '@/lib/styles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useStudio } from './store';
import { storeImage } from './storage';

const ACCENTS = ['#e39b6f', '#e8886a', '#d97a9a', '#9a86d8', '#5e9bd6', '#5fb08a', '#c9a227', '#161616'];
const choice = (on: boolean) => cn('rounded-[12px] border transition-all', on ? 'border-[var(--text)] bg-[var(--secondary)] shadow-[0_0_0_1px_var(--text)]' : 'border-[var(--line)] hover:bg-[var(--secondary)]');
const Label = ({ children }: { children: React.ReactNode }) => <p className="text-[12.5px] font-medium text-[var(--muted)]">{children}</p>;

const BG_LABEL: Record<(typeof BACKGROUNDS)[number], string> = { solid: 'Solid', gradient: 'Gradient', mesh: 'Mesh', aurora: 'Aurora', dots: 'Dots', grid: 'Grid', image: 'Photo' };
const TILE_LABEL: Record<(typeof TILE_STYLES)[number], string> = { soft: 'Soft', glass: 'Glass', outline: 'Outline', solid: 'Solid' };
const FX_LABEL: Record<(typeof EFFECTS)[number], string> = { lift: 'Lift', tilt: 'Tilt', glow: 'Glow', none: 'None' };
const AVATAR_LABEL: Record<(typeof AVATARS)[number], string> = { squircle: 'Squircle', circle: 'Circle', square: 'Square', hidden: 'Hidden' };
const RADIUS_GLYPH: Record<(typeof RADII)[number], string> = { sharp: '3px', soft: '7px', round: '11px', pill: '20px' };

/** Mini swatch that previews a background style with the current theme. */
function BgSwatch({ style, page }: { style: (typeof BACKGROUNDS)[number]; page: Page }) {
  const t = THEMES[page.theme.preset as ThemeId];
  const tt = t.tints;
  const bg: Record<string, string> = {
    solid: t.bg,
    gradient: `linear-gradient(160deg, ${tt.peach}, ${t.bg} 50%, ${tt.sky})`,
    mesh: `radial-gradient(at 15% 20%, ${tt.peach}, transparent 55%), radial-gradient(at 85% 15%, ${tt.lilac}, transparent 55%), radial-gradient(at 70% 85%, ${tt.mint}, transparent 55%), ${t.bg}`,
    aurora: `radial-gradient(at 30% 30%, ${tt.rose}, transparent 60%), radial-gradient(at 75% 60%, ${tt.sky}, transparent 60%), radial-gradient(at 40% 90%, ${tt.butter}, transparent 55%), ${t.bg}`,
    dots: `radial-gradient(${t.muted}55 1px, transparent 1.4px) 0 0 / 8px 8px, ${t.bg}`,
    grid: `linear-gradient(${t.muted}30 1px, transparent 1px) 0 0 / 12px 12px, linear-gradient(90deg, ${t.muted}30 1px, transparent 1px) 0 0 / 12px 12px, ${t.bg}`,
    image: page.theme.background.image ? `center / cover url("${page.theme.background.image}")` : `linear-gradient(135deg, ${t.muted}55, ${t.bg})`,
  };
  return <span className="block h-12 w-full rounded-[9px]" style={{ background: bg[style], filter: style === 'aurora' ? 'blur(.3px) saturate(1.2)' : undefined }} />;
}

function TileSwatch({ style }: { style: (typeof TILE_STYLES)[number] }) {
  const base = 'absolute h-6 w-9 rounded-[7px]';
  const s: Record<string, React.CSSProperties> = {
    soft: { background: 'var(--tint-peach)', boxShadow: '0 4px 10px -4px rgb(0 0 0 / .25)' },
    glass: { background: 'color-mix(in oklab, var(--surface) 55%, transparent)', backdropFilter: 'blur(6px)', border: '1px solid rgb(255 255 255 / .6)' },
    outline: { border: '1.5px solid color-mix(in oklab, var(--text) 30%, transparent)' },
    solid: { background: 'var(--surface)', boxShadow: '0 4px 10px -4px rgb(0 0 0 / .25)' },
  };
  return (
    <span className="relative block h-12 w-full overflow-hidden rounded-[9px]" style={{ background: 'radial-gradient(at 20% 30%, var(--tint-lilac), transparent 60%), radial-gradient(at 80% 70%, var(--tint-mint), transparent 60%), var(--bg)' }}>
      <span className={cn(base, 'left-3 top-3')} style={s[style]} />
      <span className={cn(base, 'left-14 top-5')} style={s[style]} />
    </span>
  );
}

/** A tiny drawing of each style, so people can tell them apart at a glance. */
function StyleSwatch({ id }: { id: StyleId }) {
  const box = 'relative block h-[74px] w-full overflow-hidden rounded-[9px]';
  switch (id) {
    case 'cozy': return (
      <span className={box} style={{ background: '#f5efe6' }}>
        <span className="absolute left-3 top-3 h-11 w-10 -rotate-6 bg-white p-1 pb-3 shadow-md"><span className="block size-full" style={{ background: 'linear-gradient(160deg,#bcd6ee,#f3b8b8)' }} /></span>
        <span className="absolute left-[60px] top-4 size-9 rotate-3 shadow-md" style={{ background: '#fbe9a6' }} />
        <span className="absolute right-3 top-5 size-9 rounded-full shadow-md" style={{ background: '#e4dcfb' }} />
      </span>);
    case 'soft': return (
      <span className={box} style={{ background: '#f1eef9' }}>
        <span className="absolute left-3 top-3 h-12 w-14 rounded-[10px]" style={{ background: '#fbe0d6' }} />
        <span className="absolute left-[72px] top-3 h-5 w-14 rounded-[8px]" style={{ background: '#dcefe2' }} />
        <span className="absolute left-[72px] top-[38px] h-5 w-14 rounded-[8px]" style={{ background: '#d9e6f8' }} />
      </span>);
    case 'editorial': return (
      <span className={box} style={{ background: '#f7f6f2', fontFamily: 'var(--font-dm-serif)' }}>
        <span className="absolute left-3 top-2 text-[26px] leading-none text-[#161616]">Aa</span>
        <span className="absolute inset-x-3 top-[38px] h-px bg-[#161616]" />
        <span className="absolute left-3 top-[46px] h-1.5 w-16 rounded-full bg-[#16161633]" /><span className="absolute left-3 top-[56px] h-1.5 w-10 rounded-full bg-[#16161622]" />
      </span>);
    case 'terminal': return (
      <span className={box} style={{ background: '#070b08', fontFamily: 'var(--font-geist-mono), monospace' }}>
        <span className="absolute left-3 top-2.5 text-[11px] text-[#6f9a76]">~ $ whoami</span>
        <span className="absolute left-3 top-6 text-[18px] font-semibold text-[#c9f7cf]">you<span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-[#3dff8b]" /></span>
        <span className="absolute inset-x-3 bottom-2.5 h-4 border border-dashed border-[#3dff8b80]" />
      </span>);
    case 'neon': return (
      <span className={box} style={{ background: 'linear-gradient(#08061a 55%, #1a0b30)' }}>
        <span className="absolute inset-x-0 bottom-0 h-7" style={{ background: 'linear-gradient(transparent 0 92%, #ff3ea5aa 92%) 0 0 / 100% 7px, linear-gradient(90deg, transparent 0 94%, #ff3ea5aa 94%) 0 0 / 12px 100%', maskImage: 'linear-gradient(transparent, #000)' }} />
        <span className="absolute left-3 top-3 h-8 w-14 border border-[#2be4ff] shadow-[0_0_10px_#2be4ff]" style={{ clipPath: 'polygon(0 0,85% 0,100% 30%,100% 100%,15% 100%,0 70%)' }} />
        <span className="absolute right-3 top-3 text-[15px] font-bold tracking-wider text-[#ff3ea5] [text-shadow:0_0_8px_#ff3ea5]" style={{ fontFamily: 'var(--font-chakra)' }}>NEON</span>
      </span>);
  }
}

const proNote = () => toast('Part of Posy Pro', { description: 'Upgrade from Settings to use premium themes, fonts and more.' });

export function ThemePanel({ page }: { page: Page }) {
  const { updateTheme, setBadge } = useStudio();
  const ent = useEntitlements();
  const locked = (premium: boolean) => premium && !ent.premium;
  const t = page.theme;
  const bg = t.background;
  const setBg = (patch: Partial<typeof bg>) => updateTheme({ background: { ...bg, ...patch } });
  const file = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <Tabs defaultValue="style" className="gap-4">
      <TabsList className="grid h-10 w-full grid-cols-5 rounded-[12px] bg-[var(--secondary)] p-1">
        {['style', 'colour', 'type', 'layout', 'background'].map(k => (
          <TabsTrigger key={k} value={k} className="rounded-[9px] text-[12.5px] capitalize data-[state=active]:bg-[var(--surface)] data-[state=active]:shadow-sm">{k === 'background' ? 'Backdrop' : k}</TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="style" className="grid max-h-[58vh] gap-5 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-2.5">
          {STYLE_IDS.map(id => {
            const info = STYLE_INFO[id];
            const lock = locked(PREMIUM_STYLES.has(id));
            return (
              <button key={id} type="button" aria-pressed={t.style === id} aria-label={`${info.label} style`}
                onClick={() => (lock ? proNote() : t.style !== id && updateTheme({ style: id, preset: info.preset, font: info.font, accent: undefined }))}
                className={cn('relative grid gap-2 p-2 text-left', choice(t.style === id))}>
                {lock && <Lock className="absolute right-3 top-3 z-10 size-3.5 text-white mix-blend-difference" />}
                <StyleSwatch id={id} />
                <span className="px-1 pb-0.5"><span className="block text-[13.5px] font-medium">{info.label}</span><span className="block text-[12px] text-[var(--muted)]">{info.note}</span></span>
              </button>
            );
          })}
        </div>
        {t.style === 'soft' && (
          <div className="grid gap-2.5">
            <Label>Card finish</Label>
            <div className="grid grid-cols-4 gap-2">
              {TILE_STYLES.map(s => (
                <button key={s} type="button" aria-pressed={t.tileStyle === s} onClick={() => updateTheme({ tileStyle: s })} className={cn('grid gap-1.5 p-1.5 text-center text-[12px]', choice(t.tileStyle === s))}>
                  <TileSwatch style={s} />{TILE_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        )}
        {(t.style === 'soft' || t.style === 'neon' || t.style === 'terminal') && (
          <div className="grid gap-2.5">
            <Label>Corners</Label>
            <div className="grid grid-cols-4 gap-2">
              {RADII.map(r => (
                <button key={r} type="button" aria-label={`${r} corners`} aria-pressed={t.radius === r} onClick={() => updateTheme({ radius: r })} className={cn('grid h-11 place-items-center', choice(t.radius === r))}>
                  <span className="size-5 border-l-2 border-t-2 border-current" style={{ borderTopLeftRadius: RADIUS_GLYPH[r] }} />
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="grid gap-2.5">
          <Label>On hover</Label>
          <div className="grid grid-cols-4 gap-2">
            {EFFECTS.map(f => (
              <button key={f} type="button" aria-pressed={t.effect === f} onClick={() => updateTheme({ effect: f })} className={cn('h-10 text-[13px]', choice(t.effect === f))}>{FX_LABEL[f]}</button>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="colour" className="grid max-h-[58vh] gap-5 overflow-y-auto pr-1">
        <div className="grid gap-2.5">
          <Label>Colours</Label>
          <div className="grid grid-cols-4 gap-2">
            {THEME_IDS.map(id => {
              const th = THEMES[id];
              return (
                <button key={id} type="button" onClick={() => (locked(PREMIUM_THEMES.has(id)) ? proNote() : updateTheme({ preset: id, accent: undefined }))} aria-pressed={t.preset === id} aria-label={th.name}
                  className="group relative grid gap-1.5 text-center text-[12px] text-[var(--muted)]">
                  {locked(PREMIUM_THEMES.has(id)) && <Lock className="absolute right-1.5 top-1.5 z-10 size-3.5 text-[var(--muted)]" />}
                  <span className={cn('grid h-14 place-items-center overflow-hidden rounded-[13px] border transition-transform group-hover:scale-[1.04]', t.preset === id ? 'border-[var(--text)] ring-1 ring-[var(--text)]' : 'border-[var(--line)]')} style={{ background: th.bg }}>
                    <span className="flex gap-1">{(['peach', 'mint', 'lilac'] as const).map(k => <span key={k} className="size-3.5 rounded-full" style={{ background: th.tints[k], boxShadow: `inset 0 0 0 1px ${th.line}` }} />)}</span>
                  </span>
                  {th.name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-2.5">
          <Label>Accent</Label>
          <div className="flex flex-wrap items-center gap-2">
            {ACCENTS.map(c => (
              <button key={c} type="button" aria-label={`Accent ${c}`} onClick={() => updateTheme({ accent: c })}
                className={cn('size-7 rounded-full transition-transform hover:scale-110', (t.accent ?? THEMES[t.preset as ThemeId].accent) === c && 'ring-2 ring-[var(--text)] ring-offset-2 ring-offset-[var(--surface)]')} style={{ background: c }} />
            ))}
            <label className="relative size-7 cursor-pointer overflow-hidden rounded-full border border-[var(--line)]" style={{ background: 'conic-gradient(#f87171, #fbbf24, #a3e635, #22d3ee, #818cf8, #e879f9, #f87171)' }} aria-label="Custom accent">
              <input type="color" value={t.accent ?? THEMES[t.preset as ThemeId].accent} onChange={e => updateTheme({ accent: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" />
            </label>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="background" className="grid max-h-[58vh] gap-5 overflow-y-auto pr-1">
        <div className="grid grid-cols-4 gap-2">
          {BACKGROUNDS.map(b => (
            <button key={b} type="button" aria-pressed={bg.style === b} onClick={() => (b === 'image' && !bg.image ? file.current?.click() : setBg({ style: b }))}
              className={cn('grid gap-1.5 p-1.5 text-center text-[12px]', choice(bg.style === b))}>
              <BgSwatch style={b} page={page} />{BG_LABEL[b]}
            </button>
          ))}
        </div>
        <input ref={file} type="file" accept="image/*" className="hidden" onChange={async e => {
          const f = e.target.files?.[0]; if (!f) return;
          setUploading(true);
          try { setBg({ style: 'image', image: await storeImage(f, 2400) }); } catch (err) { toast.error((err as Error).message); }
          finally { setUploading(false); e.target.value = ''; }
        }} />
        {bg.style === 'image' && (
          <div className="grid gap-4 rounded-[14px] bg-[var(--secondary)] p-3.5">
            <button type="button" onClick={() => file.current?.click()} className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] text-[13.5px] font-medium hover:opacity-90">
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}{bg.image ? 'Change photo' : 'Upload photo'}
            </button>
            <label className="grid gap-2 text-[13px]">Darken <Slider value={[bg.dim]} min={0} max={80} step={1} onValueChange={([v]) => setBg({ dim: v })} /></label>
            <label className="grid gap-2 text-[13px]">Blur <Slider value={[bg.blur]} min={0} max={24} step={1} onValueChange={([v]) => setBg({ blur: v })} /></label>
          </div>
        )}
        <label className="flex items-center justify-between text-[14px]">Film grain <Switch checked={bg.grain} onCheckedChange={v => setBg({ grain: v })} /></label>
      </TabsContent>

      <TabsContent value="type" className="grid max-h-[58vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
        {FONTS.map(f => (
          <button key={f} type="button" aria-pressed={t.font === f} aria-label={`${FONT_PAIRS[f].label} font`} onClick={() => (locked(PREMIUM_FONTS.has(f)) ? proNote() : updateTheme({ font: f }))}
            className={cn('relative grid gap-1 px-3 py-3 text-left', choice(t.font === f))} style={FONT_VARS[f] as React.CSSProperties}>
            {locked(PREMIUM_FONTS.has(f)) && <Lock className="absolute right-2.5 top-2.5 size-3.5 text-[var(--muted)]" />}
            <span className="posy-head text-[24px] leading-none">Aa Bb</span>
            <span className="text-[12px] text-[var(--muted)]">{FONT_PAIRS[f].label}</span>
          </button>
        ))}
      </TabsContent>

      <TabsContent value="layout" className="grid max-h-[58vh] gap-5 overflow-y-auto pr-1">
        <div className="grid gap-2.5">
          <Label>Layout</Label>
          <div className={cn('grid gap-2', t.style === 'soft' ? 'grid-cols-3' : 'grid-cols-2')}>
            {(t.style === 'soft'
              ? [['bento', 'side', 'Grid, profile beside'], ['bento', 'center', 'Grid, profile on top'], ['list', 'center', 'List']] as const
              : [['bento', 'side', 'Grid'], ['list', 'center', 'List']] as const).map(([layout, align, label]) => {
              const on = t.layout === layout && (layout === 'list' || t.style !== 'soft' || t.align === align);
              return (
                <button key={label} type="button" aria-pressed={on} onClick={() => updateTheme({ layout, align })} className={cn('grid gap-1.5 p-2 text-center text-[12px]', choice(on))}>
                  <span className="grid h-12 place-items-center rounded-[8px] bg-[var(--bg)]">
                    {layout === 'list'
                      ? <span className="grid w-10 gap-1">{[0, 1, 2].map(i => <span key={i} className="h-1.5 rounded-full bg-[var(--muted)]/40" />)}</span>
                      : align === 'side'
                        ? <span className="flex gap-1.5"><span className="h-8 w-3 rounded-sm bg-[var(--muted)]/40" /><span className="grid grid-cols-2 gap-0.5">{[0, 1, 2, 3].map(i => <span key={i} className="size-3.5 rounded-[3px] bg-[var(--muted)]/40" />)}</span></span>
                        : <span className="grid justify-items-center gap-1"><span className="h-1.5 w-6 rounded-full bg-[var(--muted)]/40" /><span className="grid grid-cols-3 gap-0.5">{[0, 1, 2].map(i => <span key={i} className="size-3.5 rounded-[3px] bg-[var(--muted)]/40" />)}</span></span>}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-2.5">
          <Label>Photo shape</Label>
          <div className="grid grid-cols-4 gap-2">
            {AVATARS.map(a => (
              <button key={a} type="button" aria-pressed={t.avatar === a} onClick={() => updateTheme({ avatar: a })} className={cn('h-10 text-[13px]', choice(t.avatar === a))}>{AVATAR_LABEL[a]}</button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 border-t border-[var(--line)] pt-4">
          <label className="flex items-center justify-between text-[14px]">Animations <Switch checked={t.motion} onCheckedChange={v => updateTheme({ motion: v })} /></label>
          <label className="flex items-center justify-between text-[14px]">
            <span>“Made with Posy” link{!ent.removeBranding && <span className="ml-2 text-[12.5px] text-[var(--muted)]">Pro can hide it</span>}</span>
            <Switch checked={page.badge} disabled={!ent.removeBranding} onCheckedChange={setBadge} />
          </label>
        </div>
      </TabsContent>
    </Tabs>
  );
}
