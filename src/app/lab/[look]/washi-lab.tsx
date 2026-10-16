// Washi's component lab: every component in every state and content case, at real size, on the screen's ground
// (computer) and on the scroll's paper (phone).
import type { Tile } from '@/lib/schema';
import { starterPage } from '@/lib/templates';
import { PageFrame } from '@/components/page/PageView';
import * as K from '@/components/page/styles/washi-scene';
import { cn } from '@/lib/utils';
import './washi-lab.css';

type Link = Extract<Tile, { type: 'link' | 'github' }>;
const L = (id: string, o: Record<string, unknown>): Link => ({ id, type: 'link', size: 'w', color: 'auto', ...o } as Link);
const LINKS: [string, Link, boolean?][] = [
  ['rich, featured', L('l1', { url: 'https://himanshu.substack.com/p/by-hand', title: 'Why I write everything by hand first', description: 'On slow drafts, fast coffee and the joy of crossing things out.', image: '/looks/washi/cover.jpg' }), true],
  ['long scraped title, no image', L('l2', { url: 'https://himanshu.dev', title: 'Himanshu Kumar | Experienced Full Stack Software Engineer | Portfolio website built with React.js', description: 'Himanshu Kumar | Experienced Full Stack Software Engineer | Portfolio' })],
  ['very short', L('l3', { url: 'https://shop.example.com', title: 'Shop' })],
  ['newsletter', L('l4', { url: 'https://buttondown.email/mira', title: 'Studio letters', description: 'New work, once a month' })],
  ['repo', { id: 'g1', type: 'github', repo: 'vercel/next.js', size: 'w', color: 'auto', stars: 131000, language: 'JavaScript', description: 'The React Framework' } as Link],
  ['broken image, featured', L('l5', { url: 'https://example.com/post', title: 'A post whose preview image is gone', image: 'https://example.invalid/nope.jpg' }), true],
];
const STATES = ['rest', 'hover', 'press'] as const;
const M = (id: string, o: Record<string, unknown>) => ({ id, size: 'w', color: 'auto', ...o } as Tile);
const MUSIC: [string, Extract<Tile, { type: 'music' }>][] = [
  ['music, cover', M('m1', { type: 'music', url: 'https://open.spotify.com/playlist/x', title: 'Rain on the engawa', artist: 'Mira Sol', image: '/looks/washi/music.jpg' }) as Extract<Tile, { type: 'music' }>],
  ['music, long', M('m2', { type: 'music', url: 'https://open.spotify.com/album/x', title: 'Songs for the long drive home when the city is asleep', artist: 'Various artists, mostly ones you never heard of', image: '/looks/washi/photo1.jpg' }) as Extract<Tile, { type: 'music' }>],
  ['music, no cover', M('m3', { type: 'music', url: 'https://open.spotify.com/track/x', title: 'On repeat', artist: 'Spotify' }) as Extract<Tile, { type: 'music' }>],
];
const VIDEO = M('v1', { type: 'video', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', title: 'A morning at the kiln, ep. 7', image: '/looks/washi/video.jpg' }) as Extract<Tile, { type: 'video' }>;
const PHOTOS: [string, Extract<Tile, { type: 'image' }>][] = [
  ['landscape + caption', M('p1', { type: 'image', src: '/looks/washi/photo1.jpg', alt: '', caption: 'rain in the garden' }) as Extract<Tile, { type: 'image' }>],
  ['portrait, no caption', M('p2', { type: 'image', src: '/looks/washi/cranes-pine.jpg', alt: '' }) as Extract<Tile, { type: 'image' }>],
  ['long caption', M('p3', { type: 'image', src: '/looks/washi/photo2.jpg', alt: '', caption: 'the tea bowls I threw over three very long weekends, finally glazed' }) as Extract<Tile, { type: 'image' }>],
];
type Text = Extract<Tile, { type: 'text' }>;
const NOTES: [string, Text][] = [
  ['short', M('n1', { type: 'text', text: 'Say hi!' }) as Text],
  ['medium', M('n2', { type: 'text', text: 'The best ideas arrive on long walks.' }) as Text],
  ['long', M('n3', { type: 'text', text: 'Now: finishing a small book of essays about kitchens. Also learning to make **good tea**. Ask me about either, or both, over a long walk.' }) as Text],
];
const STAMPS: [string, Text][] = [
  ['short', M('s1', { type: 'text', text: 'Live now', look: 'stamp' }) as Text],
  ['medium', M('s2', { type: 'text', text: 'Open for work', look: 'stamp' }) as Text],
  ['long', M('s3', { type: 'text', text: 'Open for freelance writing', look: 'stamp' }) as Text],
];
const SOCIALS = (['github', 'x', 'instagram', 'youtube', 'substack', 'email'] as const).map((platform, i) => ({ id: 'so' + i, type: 'social', platform, handle: 'mira', size: 's', color: 'auto' }) as Extract<Tile, { type: 'social' }>);

export function WashiLab({ p }: { p?: string }) {
  const preset = p ?? 'kinari';
  const page = { ...starterPage({ name: 'Mira Sol', style: 'washi', preset }), badge: false };
  const dark = preset === 'sumi';
  const piece = (state: string, node: React.ReactNode, className?: string, style?: React.CSSProperties) => <div className={cn('sc-piece', state !== 'rest' && `is-${state}`, className)} style={style}>{node}</div>;
  const longName = { ...page, profile: { ...page.profile, name: 'Himanshu Sangshetti' } };
  const slots = (pg: typeof page) => ({ avatar: <div className="posy-avatar">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/looks/washi/avatar.jpg" alt="" /></div>, name: pg.profile.name, bio: 'Writer and editor. Essays about small things, mostly.', caption: 'Lisbon', socials: null });
  const noop = (_t: Tile, node: React.ReactNode, o: { key: string; className?: string; style?: React.CSSProperties }) => <div key={o.key} className={cn('sc-piece', o.className)} style={o.style}>{node}</div>;
  return (
    <PageFrame page={page} className="posy-scene lab" interactive={false} profile={<></>}>
      <div className={cn('wss wss-editing wsl-lab', dark ? 'wss-dark' : 'wss-light')}>
        <h2 className="wsl-h">Link · hanging poem slip (computer) — rest · hover · press</h2>
        <div className="wsl-ground">
          {LINKS.map(([name, t, feat]) => (
            <div key={name} className="wsl-row"><span className="wsl-case">{name}</span>
              {STATES.map(s => <div key={s} className="wsl-cell wsl-tz"><span className="wsl-state">{s}</span>{piece(s, <K.Slip tile={t} form="tanzaku" feature={feat} />, 'wss-hang')}</div>)}
              {feat && <div className="wsl-cell wsl-tz"><span className="wsl-state">not featured</span>{piece('rest', <K.Slip tile={t} form="tanzaku" />, 'wss-hang')}</div>}
            </div>
          ))}
        </div>

        <h2 className="wsl-h">Link · pasted slip (phone) — rest · hover · press</h2>
        <div className="wsl-paper">
          {LINKS.map(([name, t, feat]) => (
            <div key={name} className="wsl-row"><span className="wsl-case">{name}</span>
              {STATES.map(s => <div key={s} className="wsl-cell wsl-strip"><span className="wsl-state">{s}</span>{piece(s, <K.Slip tile={t} form="strip" feature={feat} />, 'wss-strip-piece')}</div>)}
            </div>
          ))}
        </div>

        <h2 className="wsl-h">Socials · ink stamps — rest · hover · press</h2>
        <div className="wsl-ground"><div className="wsl-row">
          {STATES.map(s => <div key={s} className="wsl-cell"><span className="wsl-state">{s}</span><div className="wss-stamps">{SOCIALS.map((t, i) => piece(s, <K.InkStamp tile={t} i={i} />))}</div></div>)}
        </div></div>

        <h2 className="wsl-h">Music · round fan, video · mounted print</h2>
        <div className="wsl-ground">
          {MUSIC.map(([name, t]) => (
            <div key={name} className="wsl-row"><span className="wsl-case">{name}</span>
              {(['rest', 'hover'] as const).map(s => <div key={s} className="wsl-cell"><span className="wsl-state">{s} · computer</span>{piece(s, <K.Uchiwa tile={t} />)}</div>)}
              <div className="wsl-cell wsl-strip wsl-on-paper"><span className="wsl-state">phone</span>{piece('rest', <K.Uchiwa tile={t} form="strip" />)}</div>
            </div>
          ))}
          <div className="wsl-row"><span className="wsl-case">video</span>
            {(['rest', 'hover'] as const).map(s => <div key={s} className="wsl-cell wsl-video"><span className="wsl-state">{s}</span>{piece(s, <K.Screen tile={VIDEO} editing />)}</div>)}
          </div>
        </div>

        <h2 className="wsl-h">Photo · folding fan (computer), mounted print (phone)</h2>
        <div className="wsl-ground">
          {PHOTOS.map(([name, t]) => (
            <div key={name} className="wsl-row"><span className="wsl-case">{name}</span>
              {(['rest', 'hover'] as const).map(s => <div key={s} className="wsl-cell"><span className="wsl-state">fan · {s}</span>{piece(s, <K.Ogi tile={t} />)}</div>)}
              {(['rest', 'hover'] as const).map(s => <div key={'p' + s} className="wsl-cell wsl-print"><span className="wsl-state">print · {s}</span>{piece(s, <K.Print tile={t} />)}</div>)}
            </div>
          ))}
        </div>

        <h2 className="wsl-h">Note · poem card · and stamp · red seal</h2>
        <div className="wsl-ground">
          <div className="wsl-row">
            {NOTES.map(([name, t]) => (['rest', 'hover'] as const).map(s => <div key={name + s} className="wsl-cell"><span className="wsl-state">{name} · {s}</span>{piece(s, <K.Shikishi tile={t} />)}</div>))}
          </div>
          <div className="wsl-row">
            {NOTES.map(([name, t]) => <div key={name} className="wsl-cell wsl-strip wsl-on-paper"><span className="wsl-state">{name} · phone</span>{piece('rest', <K.Shikishi tile={t} form="strip" />)}</div>)}
          </div>
          <div className="wsl-row">
            {STAMPS.map(([name, t]) => STATES.map(s => <div key={name + s} className="wsl-cell"><span className="wsl-state">{name} · {s}</span>{piece(s, <K.Hanko tile={t} />)}</div>))}
          </div>
        </div>

        <h2 className="wsl-h">Profile and the whole thing · computer</h2>
        <K.WashiScene page={page} slots={slots(page)} piece={noop} only="desktop" editing />
        <h2 className="wsl-h">Long name · computer</h2>
        <K.WashiScene page={longName} slots={slots(longName)} piece={noop} only="desktop" editing />
        <h2 className="wsl-h">Phone · short and long name</h2>
        <div className="wsl-row wsl-phones">
          <div className="wsl-phone"><K.WashiScene page={page} slots={slots(page)} piece={noop} only="mobile" editing /></div>
          <div className="wsl-phone"><K.WashiScene page={longName} slots={slots(longName)} piece={noop} only="mobile" editing /></div>
        </div>
      </div>
    </PageFrame>
  );
}
