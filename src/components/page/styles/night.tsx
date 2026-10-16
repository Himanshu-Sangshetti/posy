// Night: a netrunner's heads-up display, after dark. The header is an ID badge (a scanned portrait, a clearance
// barcode, a status light); links are HUD panels with cut corners and node numbers; every photo comes through a
// two-tone scanner in the palette's signal colour, and glitches when you point at it; a link without a picture gets its
// own circuit, a repo its commit graph, a shop a code to scan, a newsletter an uplink. Notes are decrypted messages,
// music is a cassette, video is a playback feed, and a stamp note is a hazard label.
import { ArrowUpRight, Play, Star } from 'lucide-react';
import type { Page, Tile } from '@/lib/schema';
import { THEMES } from '@/lib/themes';
import { asset, cn } from '@/lib/utils';
import { hostOf, youtubeId } from '@/lib/url';
import { VideoPlayer } from '../islands';
import { RichText } from '../tiles';
import { tileMeta, compact, seeded } from './meta';
import type { HeaderSlots } from './types';

const rgb = (h: string) => { const n = parseInt(h.replace('#', '').padEnd(6, '0').slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => v / 255); };
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);

/**
 * The scanner every picture goes through, so a sunny selfie or a pastel album cover comes out as the same kind of object:
 * a hard, five-step scan from the dark of the page up to the signal colour. A second filter tears it into sideways bands
 * for the glitch when you point at a panel. Both are drawn for the page's own palette.
 */
function Scanner({ preset }: { preset: string }) {
  const t = THEMES[preset] ?? THEMES.netrunner;
  const ink = rgb(t.dark ? t.bg : t.text), lit = rgb(t.dark ? t.accent : t.bg), hi = mix(lit, [1, 1, 1], t.dark ? 0.45 : 0.6);
  const tones = [ink, mix(ink, lit, 0.22), mix(ink, lit, 0.5), lit, hi];
  const ch = (i: number) => tones.map(c => c[i].toFixed(3)).join(' ');
  const chain = (src: string) => <>
    <feColorMatrix in={src} type="matrix" values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0" />
    <feComponentTransfer>{['R', 'G', 'B'].map(c => { const F = `feFunc${c}` as 'feFuncR'; return <F key={c} type="linear" slope="1.3" intercept="-0.12" />; })}</feComponentTransfer>
    <feComponentTransfer>{['R', 'G', 'B'].map(c => { const F = `feFunc${c}` as 'feFuncR'; return <F key={c} type="discrete" tableValues="0 .25 .5 .75 1" />; })}</feComponentTransfer>
    <feComponentTransfer><feFuncR type="table" tableValues={ch(0)} /><feFuncG type="table" tableValues={ch(1)} /><feFuncB type="table" tableValues={ch(2)} /></feComponentTransfer>
  </>;
  return (
    <svg aria-hidden width="0" height="0" style={{ position: 'absolute', width: 0, height: 0 }}>
      <filter id={`nr-scan-${preset}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">{chain('SourceGraphic')}</filter>
      <filter id={`nr-glitch-${preset}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.0001 0.06" numOctaves="1" seed="4" result="bands" />
        <feColorMatrix in="bands" type="matrix" values="1.6 0 0 0 -.3  0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 1" result="shift" />
        <feDisplacementMap in="SourceGraphic" in2="shift" scale="34" xChannelSelector="R" yChannelSelector="G" result="torn" />
        {chain('torn')}
      </filter>
    </svg>
  );
}

const Img = ({ src, alt = '' }: { src: string; alt?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={asset(src)} alt={alt} loading="lazy" draggable={false} />
);

/** A picture through the scanner, with scanlines and the corner brackets of a viewfinder. */
const Scan = ({ src, alt, className, children }: { src: string; alt?: string; className?: string; children?: React.ReactNode }) => (
  <span className={cn('nr-scan', className)}><Img src={src} alt={alt} /><i className="nr-brackets" aria-hidden />{children}</span>
);

const hex = (r: () => number, n = 4) => Array.from({ length: n }, () => Math.floor(r() * 16).toString(16)).join('').toUpperCase();
/** Every panel is a numbered node on the network. */
const node = (index: number) => `NODE_${String(index + 1).padStart(2, '0')}`;
const f1 = (n: number) => Math.round(n * 10) / 10;

/** A barcode from a seed: the clearance strip on a badge, the tag on a listing. */
function Barcode({ seed, className }: { seed: string; className?: string }) {
  const r = seeded(seed);
  let x = 0, d = '';
  while (x < 96) { const w = 0.8 + Math.floor(r() * 3) * 0.9; if (r() > 0.38) d += `M${f1(x)} 0h${f1(w)}v20h${-f1(w)}Z`; x += w + 0.7 + r() * 1.2; }
  return <svg viewBox="0 0 96 20" preserveAspectRatio="none" className={cn('nr-barcode', className)} aria-hidden><path d={d} /></svg>;
}

type ArtKind = 'link' | 'repo' | 'shop' | 'letter';
/**
 * A panel's own little readout, drawn from its id so it never changes: circuit traces running into a chip for a link,
 * a commit graph for a repository, a code to scan for a shop and an uplink for a newsletter.
 */
function Readout({ seed, kind }: { seed: string; kind: ArtKind }) {
  const r = seeded(seed + kind);
  const W = 200, H = 120;
  let lines = '', fill = '', faint = '';
  const pads: [number, number, number][] = [];
  if (kind === 'link') {
    const cx = 112 + r() * 46, cy = 36 + r() * 48, cw = 34, chh = 30;
    fill += `M${f1(cx)} ${f1(cy)}h${cw}v${chh}h${-cw}Z`;
    for (let i = 0; i < 5; i++) {
      const py = cy + 3 + i * 6, y0 = 8 + Math.floor(r() * 11) * 10, x1 = 14 + r() * 50, dy = py - y0, x2 = Math.min(x1 + Math.abs(dy), cx - 6);
      lines += `M0 ${y0}H${f1(x1)}L${f1(x2)} ${f1(py)}H${f1(cx)}`;
      if (r() > 0.6) pads.push([x1, y0, 2]);
    }
    for (let i = 0; i < 3; i++) {
      const py = cy + 6 + i * 9, x1 = cx + cw + 8 + r() * 14, y1 = 6 + Math.floor(r() * 11) * 10;
      lines += `M${f1(cx + cw)} ${f1(py)}H${f1(x1)}L${f1(x1 + Math.abs(y1 - py))} ${f1(y1)}H${W}`;
    }
    for (let i = 0; i < 4; i++) { const x = 10 + r() * 90, y = 10 + Math.floor(r() * 10) * 10, l = 16 + r() * 30; faint += `M${f1(x)} ${y}h${f1(l)}`; pads.push([x + l, y, 1.8]); }
    for (let i = 0; i < 4; i++) faint += `M${f1(cx + 6 + i * 7)} ${f1(cy)}v-5M${f1(cx + 6 + i * 7)} ${f1(cy + chh)}v5`;
  } else if (kind === 'repo') {
    const lanes = [30, 60, 90];
    lines += `M0 60H${W}`;
    let x = 8 + r() * 10;
    while (x < W - 30) {
      const lane = lanes[r() > 0.5 ? 0 : 2], a = x, b = Math.min(W - 10, a + 40 + r() * 60);
      lines += `M${f1(a)} 60C${f1(a + 12)} 60 ${f1(a + 4)} ${lane} ${f1(a + 16)} ${lane}H${f1(b - 16)}C${f1(b - 4)} ${lane} ${f1(b - 12)} 60 ${f1(b)} 60`;
      for (let c = a + 22; c < b - 18; c += 12 + r() * 14) pads.push([c, lane, 2.4]);
      pads.push([a, 60, 3]); x = b + 10 + r() * 20;
    }
    for (let c = 6; c < W; c += 14 + r() * 16) pads.push([c, 60, 2.4]);
    pads.push([W - 14, 60, 4.2]);
  } else if (kind === 'shop') {
    const n = 21, s = 4.4, ox = (W - n * s) / 2, oy = (H - n * s) / 2;
    // three finder squares in the corners, a clear ring round each, and random modules everywhere else
    const finders = [[0, 0], [n - 7, 0], [0, n - 7]];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const f = finders.find(([a, b]) => i >= a && i < a + 7 && j >= b && j < b + 7);
      const ring = (i < 8 && j < 8) || (i >= n - 8 && j < 8) || (i < 8 && j >= n - 8);
      const on = f ? Math.min(i - f[0], j - f[1], f[0] + 6 - i, f[1] + 6 - j) !== 1 : !ring && r() > 0.52;
      if (on) fill += `M${f1(ox + i * s)} ${f1(oy + j * s)}h${s}v${s}h${-s}Z`;
    }
    faint += `M${f1(ox - 10)} ${f1(oy - 4)}v-6h6M${f1(ox + n * s + 10)} ${f1(oy - 4)}v-6h-6M${f1(ox - 10)} ${f1(oy + n * s + 4)}v6h6M${f1(ox + n * s + 10)} ${f1(oy + n * s + 4)}v6h-6`;
  } else {
    const ox = 26 + r() * 30, oy = 96;
    for (let rad = 14; rad < 200; rad += 11 + r() * 4) lines += `M${f1(ox - rad * 0.7)} ${f1(oy - rad * 0.7)}A${f1(rad)} ${f1(rad)} 0 0 1 ${f1(ox + rad * 0.7)} ${f1(oy - rad * 0.7)}`;
    fill += `M${ox} ${oy - 6}l-9 26h18Z`;
    for (let i = 0; i < 5; i++) { const h = 6 + i * 6; fill += `M${150 + i * 8} ${104 - h}h5v${h}h-5Z`; }
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="nr-readout" aria-hidden>
      {faint && <path d={faint} className="nr-r-faint" />}
      {lines && <path d={lines} className={cn('nr-r-line', kind === 'letter' && 'nr-r-dash')} />}
      {fill && <path d={fill} className="nr-r-fill" />}
      {pads.map(([x, y, rr], i) => <circle key={i} cx={f1(x)} cy={f1(y)} r={rr} className={i === pads.length - 1 && kind === 'repo' ? 'nr-r-head' : 'nr-r-pad'} />)}
    </svg>
  );
}

export function NightHeader({ page, slots }: { page: Page; slots: HeaderSlots }) {
  const r = seeded(page.profile.name || 'posy');
  const id = `${hex(r, 2)}-${hex(r, 2)}-${hex(r, 2)}`;
  return (
    <>
      <Scanner preset={page.theme.preset} />
      <style>{`.posy-preset-${page.theme.preset}{--nr-filter:url(#nr-scan-${page.theme.preset});--nr-glitch:url(#nr-glitch-${page.theme.preset})}`}</style>
      <div className="nr-hud" aria-hidden>
        <span className="nr-hud-tag">POSY//NET</span>
        <span className="nr-bars"><i /><i /><i /><i /><i /></span>
        <span className="nr-hud-fill" />
        <span>ID {id}</span>
      </div>
      <div className={cn('nr-badge', !slots.avatar && 'nr-badge-bare')}>
        {slots.avatar && (
          <div className="nr-photo">
            {slots.avatar}
            <i className="nr-brackets" aria-hidden />
            <i className="nr-sweep" aria-hidden />
            <span className="nr-photo-tag" aria-hidden>SUBJ. {hex(r, 4)}</span>
          </div>
        )}
        <div className="nr-intro">
          <span className="nr-label" aria-hidden>// IDENTITY VERIFIED</span>
          <h1 className="posy-head posy-name nr-name">{slots.name}</h1>
          {slots.bio && <div className="posy-bio nr-bio">{slots.bio}</div>}
          {slots.caption && <p className="nr-caption"><i aria-hidden />ONLINE<span aria-hidden>·</span>{slots.caption}</p>}
          <div className="nr-socials">{slots.socials}</div>
          <Barcode seed={id} className="nr-badge-code" />
        </div>
      </div>
    </>
  );
}

/** Top strip of a panel: its node, what it is, and the way out. */
const Strip = ({ index, kind, go = true }: { index: number; kind?: string; go?: boolean }) => (
  <div className="nr-strip">
    <span className="nr-node">{node(index)}</span>
    {kind && <span className="nr-kind">{kind}</span>}
    <span className="nr-dots" aria-hidden />
    {go && <span className="nr-go" aria-hidden><ArrowUpRight /></span>}
  </div>
);

export function NightTile({ tile, index, editing }: { tile: Tile; index: number; editing?: boolean }) {
  const m = tileMeta(tile);
  const r = seeded(tile.id);

  if (tile.type === 'text') {
    if (tile.look === 'stamp') return (
      <div className="nr-hazard-wrap">
        <div className="nr-hazard"><span className="nr-hazard-in"><small>⚠ NOTICE</small><b>{tile.text.replace(/[*[\]]|\(https?:[^)]+\)/g, '')}</b></span></div>
      </div>
    );
    return (
      <div className={cn('nr-panel nr-msg', `nr-msg-${tile.size}`)}>
        <div className="nr-in">
          <div className="nr-strip"><span className="nr-node">MSG_{hex(r, 3)}</span><span className="nr-kind">Decrypted</span><span className="nr-dots" aria-hidden /><span className="nr-ok" aria-hidden>✓</span></div>
          <blockquote><RichText text={tile.text} /><i className="nr-cursor" aria-hidden /></blockquote>
        </div>
      </div>
    );
  }

  if (tile.type === 'image') return (
    <figure className="nr-panel nr-feed">
      <div className="nr-in">
        <Scan src={tile.src} alt={tile.alt}>
          <span className="nr-feed-top" aria-hidden><span><i className="nr-rec" />CAM_{String(index + 1).padStart(2, '0')}</span><span>{String(Math.floor(r() * 24)).padStart(2, '0')}:{String(Math.floor(r() * 60)).padStart(2, '0')}:{String(Math.floor(r() * 60)).padStart(2, '0')}</span></span>
          <i className="nr-cross" aria-hidden />
        </Scan>
        {tile.caption && <figcaption className="nr-subtitle">{tile.caption}</figcaption>}
      </div>
    </figure>
  );

  if (tile.type === 'video') {
    const id = youtubeId(tile.url);
    return (
      <div className="nr-panel nr-feed nr-playback">
        <div className="nr-in">
          <span className="nr-scan nr-screen">
            {id ? <VideoPlayer id={id} title={tile.title} overlay={false} editing={editing} thumb={tile.image ? asset(tile.image) : undefined} /> : m.image && <Img src={m.image} />}
            <i className="nr-brackets" aria-hidden />
            <span className="nr-feed-top" aria-hidden><span><i className="nr-rec" />PLAYBACK</span><span>▮▮ {hex(r, 4)}</span></span>
          </span>
          <p className="nr-subtitle"><Play aria-hidden className="nr-play" /><span>{m.title}</span></p>
        </div>
      </div>
    );
  }

  if (tile.type === 'music') return (
    <div className="nr-panel nr-tape-panel">
      <div className="nr-in">
        <Strip index={index} kind="Audio" go={false} />
        <div className="nr-tape">
          <span className="nr-tape-label">
            {m.image && <Scan src={m.image} className="nr-tape-cover" />}
            <span className="nr-tape-text"><b className="nr-title">{m.title}</b><span className="nr-sub">{m.sub}</span></span>
            <span className="nr-tape-side" aria-hidden>A</span>
          </span>
          <span className="nr-tape-window" aria-hidden><i className="nr-reel" /><span className="nr-tape-band" /><i className="nr-reel" /></span>
        </div>
      </div>
    </div>
  );

  if (tile.type === 'github') return (
    <div className="nr-panel nr-card nr-card-art nr-repo">
      <div className="nr-in">
        <Strip index={index} kind="Repo" />
        <span className="nr-art"><Readout seed={tile.id} kind="repo" /></span>
        <div className="nr-body">
          <b className="nr-title nr-mono"><span aria-hidden>$ </span>{tile.repo}</b>
          {tile.description && <p className="nr-sub">{tile.description}</p>}
          {(tile.stars !== undefined || tile.language) && (
            <span className="nr-meta">{tile.stars !== undefined && <><Star aria-hidden className="nr-star" />{compact(tile.stars)}</>}{tile.language && <span className="nr-chip">{tile.language}</span>}</span>
          )}
        </div>
      </div>
    </div>
  );

  if (m.kind === 'newsletter') return (
    <div className="nr-panel nr-card nr-card-art nr-uplink">
      <div className="nr-in">
        <Strip index={index} kind="Uplink" />
        <span className="nr-art"><Readout seed={tile.id} kind="letter" /></span>
        <div className="nr-body">
          <b className="nr-title">{m.title}</b>
          {tile.type === 'link' && tile.description && <p className="nr-sub">{tile.description}</p>}
          <span className="nr-field" aria-hidden><span>&gt; enter_email<i className="nr-cursor" /></span><b>Subscribe</b></span>
        </div>
      </div>
    </div>
  );

  // links, shops and everything else: a HUD panel, with its picture scanned above on bigger panels
  const pic = tile.size !== 's' && m.image;
  const shop = m.kind === 'shop';
  const host = tile.type === 'link' ? hostOf(tile.url) : '';
  return (
    <article className={cn('nr-panel nr-card', pic ? 'nr-card-pic' : 'nr-card-art', shop && 'nr-shop')}>
      <div className="nr-in">
        <Strip index={index} kind={shop ? 'Market' : m.kind === 'link' ? host : m.kind} />
        {shop && <span className="nr-stripes" aria-hidden />}
        {pic ? <Scan src={m.image!} /> : <span className="nr-art"><Readout seed={tile.id} kind={shop ? 'shop' : 'link'} /></span>}
        <div className="nr-body">
          <b className="nr-title">{m.title}</b>
          {m.sub && m.sub !== m.title && m.sub !== host && <p className="nr-sub">{m.sub}</p>}
          {shop && <span className="nr-price"><Barcode seed={tile.id} /><b>Buy ▸</b></span>}
        </div>
      </div>
    </article>
  );
}

export function NightRow({ tile, index }: { tile: Tile; index: number }) {
  const m = tileMeta(tile);
  if (tile.type === 'text') return (
    <div className="nr-panel nr-msg nr-row-msg"><div className="nr-in"><blockquote><RichText text={tile.text} /><i className="nr-cursor" aria-hidden /></blockquote></div></div>
  );
  const kind: ArtKind = tile.type === 'github' ? 'repo' : m.kind === 'shop' ? 'shop' : m.kind === 'newsletter' ? 'letter' : 'link';
  return (
    <div className="nr-panel nr-row">
      <div className="nr-in">
        <span className="nr-node">{String(index + 1).padStart(2, '0')}</span>
        {m.image ? <Scan src={m.image} className="nr-row-pic" /> : <span className="nr-art nr-row-pic"><Readout seed={tile.id} kind={kind} /></span>}
        <span className="nr-text"><b className="nr-title">{m.title || 'Photo'}</b>{m.sub && m.sub !== m.title && tile.type !== 'image' && <span className="nr-sub">{m.sub}</span>}</span>
        <span className="nr-go" aria-hidden><ArrowUpRight /></span>
      </div>
    </div>
  );
}
