// Lofi's component lab: every component in every state and content case, at real size.
import type { Tile } from '@/lib/schema';
import { starterPage } from '@/lib/templates';
import { PageFrame } from '@/components/page/PageView';
import * as K from '@/components/page/styles/lofi-scene';
import { cn } from '@/lib/utils';


const L = (o: Partial<Extract<Tile, { type: 'link' }>> & { url: string }): Tile => ({ id: 'l' + Math.random().toString(36).slice(2, 7), type: 'link', size: 'w', color: 'auto', ...o } as Tile);
const LINKS: [string, Tile][] = [
  ['rich', L({ url: 'https://himanshu.substack.com/p/by-hand', title: 'Why I write everything by hand first', description: 'On slow drafts, fast coffee and the joy of crossing things out.', image: '/samples/tea.jpg' })],
  ['long scraped title, no image', L({ url: 'https://himanshu.dev', title: 'Himanshu Kumar | Experienced Full Stack Software Engineer | Portfolio website built with React.js and Next', description: 'Himanshu Kumar | Experienced Full Stack Software Engineer | Portfolio' })],
  ['very short', L({ url: 'https://shop.example.com', title: 'Shop' })],
  ['newsletter', L({ url: 'https://buttondown.email/mira', title: 'Studio letters', description: 'New work, once a month' })],
  ['repo', { id: 'g1', type: 'github', repo: 'vercel/next.js', size: 'w', color: 'auto', stars: 131000, language: 'JavaScript', description: 'The React Framework' } as Tile],
  ['broken image', L({ url: 'https://example.com/post', title: 'A post whose preview image is gone', image: 'https://example.invalid/nope.jpg' })],
];
const STATES = ['rest', 'hover', 'press'] as const;
const PHOTOS: [string, Tile][] = [
  ['landscape + caption', { id: 'p1', type: 'image', src: '/looks/lofi/photo1.jpg', alt: '', caption: 'my desk at 2 a.m.', size: 'l', color: 'auto' } as Tile],
  ['portrait, no caption', { id: 'p2', type: 'image', src: '/looks/lofi/avatar.jpg', alt: '', size: 's', color: 'auto' } as Tile],
  ['long caption', { id: 'p3', type: 'image', src: '/looks/lofi/photo2.jpg', alt: '', caption: 'the synth I built over three very long weekends, finally making noise', size: 's', color: 'auto' } as Tile],
];
const NOTES: [string, Tile][] = [
  ['note, short', { id: 'n1', type: 'text', text: 'Say hi!', size: 's', color: 'auto' } as Tile],
  ['note, long', { id: 'n2', type: 'text', text: 'Now: shipping a tiny synth in the browser. Also learning to make **good coffee**. Ask me about either.', size: 's', color: 'auto' } as Tile],
  ['sticker, short', { id: 'n3', type: 'text', text: 'Live now', look: 'stamp', size: 's', color: 'auto' } as Tile],
  ['sticker, long', { id: 'n4', type: 'text', text: 'Open for freelance work', look: 'stamp', size: 's', color: 'auto' } as Tile],
];
const M = (o: Record<string, unknown>): Tile => ({ id: 'm' + Math.random().toString(36).slice(2, 7), size: 'w', color: 'auto', ...o } as Tile);
const MEDIA: [string, Tile][] = [
  ['music, cover', M({ type: 'music', url: 'https://open.spotify.com/playlist/x', title: 'Midnight mix vol. 3', artist: 'Mira Sol', image: '/looks/lofi/music.jpg' })],
  ['music, long title', M({ type: 'music', url: 'https://open.spotify.com/album/x', title: 'Songs for the long drive home when the city is asleep', artist: 'Various artists, mostly ones you never heard of', image: '/looks/lofi/photo1.jpg' })],
  ['music, no cover', M({ type: 'music', url: 'https://open.spotify.com/track/x', title: 'On repeat', artist: 'Spotify' })],
  ['video, thumb', M({ type: 'video', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', title: 'Arcade sessions, ep. 7', image: '/looks/lofi/video.jpg' })],
];

export function LofiLab({ p }: { p?: string }) {
  const page = { ...starterPage({ name: 'Mira Sol', style: 'lofi', preset: p ?? 'daydream' }), badge: false };
  const piece = (state: string, node: React.ReactNode, className?: string) => <div className={cn('sc-piece', state !== 'rest' && `is-${state}`, className)}>{node}</div>;
  return (
    <PageFrame page={page} className="posy-scene lab" interactive={false} profile={<></>}>
      <div className={cn('lfs lab-wrap', page.theme.preset === 'daydream' ? 'lfs-day' : 'lfs-night')}>
        <h2 className="lab-h">Link · desktop window (featured)</h2>
        {LINKS.map(([name, t]) => (
          <div key={name} className="lab-row"><span className="lab-case">{name}</span>
            {STATES.map(s => <div key={s} className="lab-cell lab-win"><span className="lab-state">{s}</span>{piece(s, <K.LofiBrowser tile={t} />)}</div>)}
            <div className="lab-cell lab-win-sm"><span className="lab-state">small</span>{piece('rest', <K.LofiBrowser tile={t} />)}</div>
          </div>
        ))}
        <h2 className="lab-h">Music and video · desktop</h2>
        {MEDIA.map(([name, t]) => (
          <div key={name} className="lab-row"><span className="lab-case">{name}</span>
            {(['rest', 'hover'] as const).map(st => <div key={st} className="lab-cell lab-media"><span className="lab-state">{st}</span>{piece(st, <K.LofiPlayer tile={t as Extract<Tile, { type: 'music' | 'video' }>} editing />)}</div>)}
          </div>
        ))}
        <h2 className="lab-h">Photo · note · sticker</h2>
        <div className="lab-row">
          {PHOTOS.map(([name, t]) => (['rest', 'hover'] as const).map(st => <div key={name + st} className="lab-cell lab-photo"><span className="lab-state">{name} · {st}</span>{piece(st, <K.LofiPhoto tile={t as Extract<Tile, { type: 'image' }>} />)}</div>))}
        </div>
        <div className="lab-row">
          {NOTES.map(([name, t]) => (['rest', 'hover'] as const).map(st => <div key={name + st} className="lab-cell lab-note"><span className="lab-state">{name} · {st}</span>{piece(st, (t as { look?: string }).look === 'stamp' ? <K.LofiSticker tile={t as Extract<Tile, { type: 'text' }>} /> : <K.LofiSticky tile={t as Extract<Tile, { type: 'text' }>} />)}</div>))}
        </div>
        <h2 className="lab-h">Link · desktop icon (shelf)</h2>
        <div className="lab-row lab-icons">
          {LINKS.map(([name, t]) => STATES.map(s => (
            <div key={name + s} className="lab-cell"><span className="lab-state">{name} · {s}</span>{piece(s, <><K.LofiAppIcon tile={t} /><span className="lfs-label">{K.lofiLabel(t)}</span></>, 'lfs-desk-icon')}</div>
          )))}
        </div>
        <h2 className="lab-h">Link · phone</h2>
        <div className="lab-row lab-phone">
          {LINKS.map(([name, t]) => (
            <div key={name} className="lab-cell lab-phonecol"><span className="lab-state">{name}</span>
              <div className="lfs-phone lab-phone-inner">
                {piece('rest', <div className="lfs-widget lfs-w-link"><K.LofiAppIcon tile={t} /><span className="lfs-w-text"><b>{t.type === 'link' ? t.title : 'vercel/next.js'}</b><span>{t.type === 'link' ? new URL(t.url).host : 'github.com'}</span></span></div>)}
                <div className="lfs-apps">{piece('rest', <><K.LofiAppIcon tile={t} /><span className="lfs-label">{K.lofiLabel(t)}</span></>, 'lfs-app')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageFrame>
  );
}
