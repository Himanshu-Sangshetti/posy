'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import type { Page } from '@/lib/schema';
import { FONTS, RADII, BACKGROUNDS, TILE_STYLES, EFFECTS, AVATARS, PHOTO_LOOKS } from '@/lib/schema';
import { THEMES, THEME_IDS, PREMIUM_THEMES, type ThemeId } from '@/lib/themes';
import { ALL_FONT_PAIRS as FONT_PAIRS, FONT_VARS, PREMIUM_FONTS, photoLook } from '@/lib/style';
import { useEntitlements } from './entitlements';
import { STYLE_IDS, STYLE_INFO, STYLE_PALETTES, PREMIUM_STYLES, type StyleId } from '@/lib/styles';
import { sceneFor } from '@/components/page/styles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useStudio } from './store';
import { storeImage } from './storage';

/** Soft page colours to start from: paper, blush, sage, sky, lilac, butter, clay, night. */
const PAGE_COLOURS = ['#f6f1e7', '#f6e4e1', '#e3ebdf', '#e0e9f2', '#e9e3f3', '#f5ecd2', '#ead9cc', '#1d1b22'];
const ACCENTS = ['#e39b6f', '#e8886a', '#d97a9a', '#9a86d8', '#5e9bd6', '#5fb08a', '#c9a227', '#161616'];
const choice = (on: boolean) => cn('sc-choice', on && 'is-on');
const Label = ({ children, hint }: { children: React.ReactNode; hint?: string }) => (
  <div className="flex items-baseline justify-between gap-3"><p className="sc-eyebrow">{children}</p>{hint && <p className="text-[11.5px] text-[var(--muted)]">{hint}</p>}</div>
);

const BG_LABEL: Record<(typeof BACKGROUNDS)[number], string> = { solid: 'Solid', dots: 'Dots', grid: 'Grid', image: 'Photo' };
const TILE_LABEL: Record<(typeof TILE_STYLES)[number], string> = { soft: 'Soft', glass: 'Glass', outline: 'Outline', solid: 'Solid' };
const FX_LABEL: Record<(typeof EFFECTS)[number], string> = { lift: 'Lift', tilt: 'Tilt', glow: 'Glow', none: 'None' };
const AVATAR_LABEL: Record<(typeof AVATARS)[number], string> = { squircle: 'Squircle', circle: 'Circle', square: 'Square', hidden: 'Hidden' };
const RADIUS_GLYPH: Record<(typeof RADII)[number], string> = { sharp: '3px', soft: '7px', round: '11px', pill: '20px' };

/** Mini swatch that previews a background style with the current theme. */
function BgSwatch({ style, page }: { style: (typeof BACKGROUNDS)[number]; page: Page }) {
  const t = THEMES[page.theme.preset as ThemeId];
  const bg: Record<string, string> = {
    solid: t.bg,
    dots: `radial-gradient(${t.muted}55 1px, transparent 1.4px) 0 0 / 8px 8px, ${t.bg}`,
    grid: `linear-gradient(${t.muted}30 1px, transparent 1px) 0 0 / 12px 12px, linear-gradient(90deg, ${t.muted}30 1px, transparent 1px) 0 0 / 12px 12px, ${t.bg}`,
    image: page.theme.background.image ? `center / cover url("${page.theme.background.image}")` : `linear-gradient(135deg, ${t.muted}55, ${t.bg})`,
  };
  return <span className="block h-12 w-full rounded-[9px] border border-[var(--line)]" style={{ background: bg[style] }} />;
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
/** A small real render of each look (public/looks/swatches). */
function StyleSwatch({ id }: { id: StyleId }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/looks/swatches/${id}.jpg`} alt="" loading="lazy" className="block h-[84px] w-full rounded-[9px] object-cover object-left-top" />;
}

function SwitchRow({ title, note, checked, onChange, disabled }: { title: string; note: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span className="grid gap-0.5"><span className="text-[14px] font-medium">{title}</span><span className="text-[12.5px] text-[var(--muted)]">{note}</span></span>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </label>
  );
}

const proNote = () => toast('Part of Posy Pro', { description: 'Upgrade from Settings to use premium themes, fonts and more.' });

const PHOTO_LABEL: Record<(typeof PHOTO_LOOKS)[number], string> = { natural: 'Colour', mono: 'B&W', dither: 'Dither', ascii: 'ASCII' };

export type DesignTab = 'style' | 'colour' | 'type' | 'layout' | 'background';
const TAB_LABEL: Record<DesignTab, string> = { style: 'Style', colour: 'Colour', type: 'Type', layout: 'Layout', background: 'Backdrop' };

export function ThemePanel({ page, tab = 'style', onTab }: { page: Page; tab?: DesignTab; onTab?: (t: DesignTab) => void }) {
  const { updateTheme, setBadge } = useStudio();
  const ent = useEntitlements();
  const locked = (premium: boolean) => premium && !ent.premium;
  const t = page.theme;
  const bg = t.background;
  const setBg = (patch: Partial<typeof bg>) => updateTheme({ background: { ...bg, ...patch } });
  const file = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <Tabs value={tab} onValueChange={v => onTab?.(v as DesignTab)} className="min-h-0 flex-1 gap-0">
      <TabsList className="mx-5 mb-4 grid h-10 w-auto shrink-0 grid-cols-5 rounded-full bg-[var(--secondary)] p-1">
        {(Object.keys(TAB_LABEL) as DesignTab[]).map(k => (
          <TabsTrigger key={k} value={k} className="rounded-full px-1 text-[12.5px] text-[var(--muted)] data-[state=active]:bg-[var(--surface)] data-[state=active]:text-[var(--text)] data-[state=active]:shadow-[0_1px_3px_rgb(22_20_15/.18)]">{TAB_LABEL[k]}</TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="style" className="grid min-h-0 content-start gap-6 overflow-y-auto px-5 pb-8 pt-1">
        <div className="grid grid-cols-2 gap-2.5">
          {STYLE_IDS.map(id => {
            const info = STYLE_INFO[id];
            const lock = locked(PREMIUM_STYLES.has(id));
            return (
              <button key={id} type="button" aria-pressed={t.style === id} aria-label={`${info.label} style`}
                onClick={() => (lock ? proNote() : t.style !== id && updateTheme({ style: id, preset: info.preset, font: info.font, accent: undefined }))}
                className={cn('relative grid content-start gap-2 p-2 text-left', choice(t.style === id))}>
                {lock && <Lock className="absolute right-3 top-3 z-10 size-3.5 text-white mix-blend-difference" />}
                <StyleSwatch id={id} />
                <span className="px-1 pb-0.5"><span className="block text-[13.5px] font-medium">{info.label}</span><span className="block text-[12px] text-[var(--muted)]">{info.note}</span></span>
              </button>
            );
          })}
        </div>
        {t.style === 'minimal' && (
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
        {t.style === 'minimal' && (
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
        <div className="grid gap-2.5">
          <Label>Photos</Label>
          <div className="grid grid-cols-4 gap-2">
            {PHOTO_LOOKS.map(f => (
              <button key={f} type="button" aria-pressed={photoLook(page) === f} onClick={() => updateTheme({ photos: f })} className={cn('h-10 text-[13px]', choice(photoLook(page) === f))}>{PHOTO_LABEL[f]}</button>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="colour" className="grid min-h-0 content-start gap-6 overflow-y-auto px-5 pb-8 pt-1">
        <div className="grid gap-2.5">
          <Label>Colours</Label>
          <div className="grid grid-cols-4 gap-2">
            {(STYLE_PALETTES[t.style] ?? THEME_IDS).map(id => {
              const th = THEMES[id];
              return (
                <button key={id} type="button" onClick={() => (locked(PREMIUM_THEMES.has(id)) ? proNote() : updateTheme({ preset: id, accent: undefined }))} aria-pressed={t.preset === id} aria-label={th.name}
                  className="group relative grid gap-1.5 text-center text-[12px] text-[var(--muted)]">
                  {locked(PREMIUM_THEMES.has(id)) && <Lock className="absolute right-1.5 top-1.5 z-10 size-3.5 text-[var(--muted)]" />}
                  <span className={cn('grid h-14 place-items-center overflow-hidden rounded-[13px] border transition-transform group-hover:scale-[1.04]', t.preset === id ? 'border-[var(--sc-deep)] ring-1 ring-[var(--sc-deep)]' : 'border-[var(--line)]')} style={{ background: th.bg }}>
                    <span className="flex items-center gap-1.5"><span className="font-[family-name:var(--font-serif)] text-[19px] leading-none" style={{ color: th.text }}>Aa</span><span className="size-2.5 rounded-full" style={{ background: th.accent }} /></span>
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
                className={cn('size-7 rounded-full transition-transform hover:scale-110', (t.accent ?? THEMES[t.preset as ThemeId].accent) === c && 'ring-2 ring-[var(--sc-deep)] ring-offset-2 ring-offset-[var(--surface)]')} style={{ background: c }} />
            ))}
            <label className="relative size-7 cursor-pointer overflow-hidden rounded-full border border-[var(--line)]" style={{ background: 'conic-gradient(#f87171, #fbbf24, #a3e635, #22d3ee, #818cf8, #e879f9, #f87171)' }} aria-label="Custom accent">
              <input type="color" value={t.accent ?? THEMES[t.preset as ThemeId].accent} onChange={e => updateTheme({ accent: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" />
            </label>
          </div>
        </div>
        <div className="grid gap-2.5">
          <Label hint="Under the textures and art">Page colour</Label>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setBg({ color: undefined })} aria-pressed={!bg.color}
              className={cn('h-7 rounded-full border border-[var(--line)] px-3 text-[12px]', !bg.color && 'ring-2 ring-[var(--sc-deep)] ring-offset-2 ring-offset-[var(--surface)]')}>Palette</button>
            {PAGE_COLOURS.map(c => (
              <button key={c} type="button" aria-label={`Page colour ${c}`} onClick={() => setBg({ color: c })}
                className={cn('size-7 rounded-full border border-[var(--line)] transition-transform hover:scale-110', bg.color === c && 'ring-2 ring-[var(--sc-deep)] ring-offset-2 ring-offset-[var(--surface)]')} style={{ background: c }} />
            ))}
            <label className="relative size-7 cursor-pointer overflow-hidden rounded-full border border-[var(--line)]" style={{ background: 'conic-gradient(#f87171, #fbbf24, #a3e635, #22d3ee, #818cf8, #e879f9, #f87171)' }} aria-label="Custom page colour">
              <input type="color" value={bg.color ?? THEMES[t.preset as ThemeId].bg} onChange={e => setBg({ color: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" />
            </label>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="background" className="grid min-h-0 content-start gap-6 overflow-y-auto px-5 pb-8 pt-1">
        <div className="grid gap-2.5"><Label>Backdrop</Label>
        <div className="grid grid-cols-4 gap-2">
          {BACKGROUNDS.map(b => (
            <button key={b} type="button" aria-pressed={bg.style === b} onClick={() => (b === 'image' && !bg.image ? file.current?.click() : setBg({ style: b }))}
              className={cn('grid gap-1.5 p-1.5 text-center text-[12px]', choice(bg.style === b))}>
              <BgSwatch style={b} page={page} />{BG_LABEL[b]}
            </button>
          ))}
        </div></div>
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
            <label className="grid gap-2.5 text-[13px] font-medium"><span className="flex justify-between">Darken<span className="sc-mono text-[11.5px] font-normal text-[var(--muted)]">{bg.dim}%</span></span> <Slider value={[bg.dim]} min={0} max={80} step={1} onValueChange={([v]) => setBg({ dim: v })} /></label>
            <label className="grid gap-2.5 text-[13px] font-medium"><span className="flex justify-between">Blur<span className="sc-mono text-[11.5px] font-normal text-[var(--muted)]">{bg.blur}px</span></span> <Slider value={[bg.blur]} min={0} max={24} step={1} onValueChange={([v]) => setBg({ blur: v })} /></label>
          </div>
        )}
        <SwitchRow title="Film grain" note="A faint paper texture over the backdrop" checked={bg.grain} onChange={v => setBg({ grain: v })} />
        <SwitchRow title="Ambience" note="Light through leaves on Desk, clouds and rain on Lofi" checked={t.ambient} onChange={v => updateTheme({ ambient: v })} />
      </TabsContent>

      <TabsContent value="type" className="grid min-h-0 grid-cols-2 content-start gap-2 overflow-y-auto px-5 pb-8 pt-1">
        <div className="col-span-2"><Label hint="Headings and body">Typeface pairs</Label></div>
        {FONTS.map(f => (
          <button key={f} type="button" aria-pressed={t.font === f} aria-label={`${FONT_PAIRS[f].label} font`} onClick={() => (locked(PREMIUM_FONTS.has(f)) ? proNote() : updateTheme({ font: f }))}
            className={cn('relative grid gap-1 px-3 py-3 text-left', choice(t.font === f))} style={FONT_VARS[f] as React.CSSProperties}>
            {locked(PREMIUM_FONTS.has(f)) && <Lock className="absolute right-2.5 top-2.5 size-3.5 text-[var(--muted)]" />}
            <span className="posy-head text-[24px] leading-none">Aa Bb</span>
            <span className="text-[12px] text-[var(--muted)]">{FONT_PAIRS[f].label}</span>
          </button>
        ))}
      </TabsContent>

      <TabsContent value="layout" className="grid min-h-0 content-start gap-6 overflow-y-auto px-5 pb-8 pt-1">
        {/* looks with their own scene arrange the page themselves */}
        <div className="grid gap-2.5" hidden={!!sceneFor(t.style)}>
          <Label>Layout</Label>
          <div className={cn('grid gap-2', t.style === 'minimal' ? 'grid-cols-2' : 'grid-cols-3')}>
            {(t.style === 'minimal'
              ? [['bento', 'side', 'Grid, profile beside'], ['bento', 'center', 'Grid, profile on top'], ['list', 'center', 'List'], ['canvas', 'center', 'Canvas']] as const
              : [['bento', 'side', 'Grid'], ['list', 'center', 'List'], ['canvas', 'center', 'Canvas']] as const).map(([layout, align, label]) => {
              const on = t.layout === layout && (layout !== 'bento' || t.style !== 'minimal' || t.align === align);
              return (
                <button key={label} type="button" aria-pressed={on} onClick={() => updateTheme({ layout, align })} className={cn('grid gap-1.5 p-2 text-center text-[12px]', choice(on))}>
                  <span className="grid h-12 place-items-center rounded-[8px] bg-[var(--bg)]">
                    {layout === 'list'
                      ? <span className="grid w-10 gap-1">{[0, 1, 2].map(i => <span key={i} className="h-1.5 rounded-full bg-[var(--muted)]/40" />)}</span>
                      : layout === 'canvas'
                        ? <span className="relative block h-9 w-12">
                            <span className="absolute left-0 top-0.5 h-5 w-6 -rotate-6 rounded-[3px] bg-[var(--muted)]/40" />
                            <span className="absolute right-0 top-0 size-4 rotate-6 rounded-[3px] bg-[var(--muted)]/40" />
                            <span className="absolute bottom-0 left-4 h-3.5 w-7 rounded-[3px] bg-[var(--muted)]/55" />
                          </span>
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
          <SwitchRow title="Animations" note="Tiles drop in and move on hover" checked={t.motion} onChange={v => updateTheme({ motion: v })} />
          <SwitchRow title="“Made with Posy” link" note={ent.removeBranding ? 'A small credit at the bottom of your page' : 'Pro can hide it'} checked={page.badge} disabled={!ent.removeBranding} onChange={setBadge} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
