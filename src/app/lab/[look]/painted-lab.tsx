// Painted's component lab: every card in every state and content case, at real size, desktop and phone widths.
import type { Tile } from '@/lib/schema';
import { starterPage } from '@/lib/templates';
import { PageFrame, profileSlots } from '@/components/page/PageView';
import * as K from '@/components/page/styles/painted-scene';
import { cn } from '@/lib/utils';
import './painted-lab.css';

type Of<T extends Tile['type']> = Extract<Tile, { type: T }>;
const L = (o: Partial<Of<'link'>> & { url: string }): Of<'link'> => ({ id: 'l' + o.url.length + (o.title ?? '').length, type: 'link', size: 'w', color: 'auto', ...o } as Of<'link'>);
const LINKS: [string, Of<'link'> | Of<'github'>][] = [
  ['rich', L({ url: 'https://himanshu.substack.com/p/by-hand', title: 'Why I write everything by hand first', description: 'On slow drafts, fast coffee and the joy of crossing things out.', image: '/looks/painted/cover.jpg' })],
  ['long scraped title, no image', L({ url: 'https://himanshu.dev', title: 'Himanshu Kumar | Experienced Full Stack Software Engineer | Portfolio website built with React.js', description: 'Himanshu Kumar | Experienced Full Stack Software Engineer | Portfolio' })],
  ['very short', L({ url: 'https://shop.example.com', title: 'Shop' })],
  ['newsletter', L({ url: 'https://buttondown.email/mira', title: 'Studio letters', description: 'New work, once a month' })],
  ['repo', { id: 'g1', type: 'github', repo: 'vercel/next.js', size: 'w', color: 'auto', stars: 131000, language: 'JavaScript', description: 'The React Framework' } as Of<'github'>],
  ['broken image', L({ url: 'https://example.com/post', title: 'A post whose preview image is gone', image: 'https://example.invalid/nope.jpg' })],
];
const STATES = ['rest', 'hover', 'press'] as const;
const M = (o: Record<string, unknown>) => ({ id: 'm' + String(o.title).length, size: 'w', color: 'auto', ...o });
const MUSIC: [string, Of<'music'>][] = [
  ['music, cover', M({ type: 'music', url: 'https://open.spotify.com/playlist/x', title: 'Songs for drawing', artist: 'Mira Sol', image: '/looks/painted/music.jpg' }) as Of<'music'>],
  ['music, long title', M({ type: 'music', url: 'https://open.spotify.com/album/x', title: 'Songs for the long drive home when the city is asleep', artist: 'Various artists, mostly ones you never heard of', image: '/looks/painted/photo1.jpg' }) as Of<'music'>],
  ['music, no cover', M({ type: 'music', url: 'https://open.spotify.com/track/x', title: 'On repeat', artist: 'Spotify' }) as Of<'music'>],
];
const VIDEO = M({ type: 'video', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', title: 'How I paint skies', image: '/looks/painted/video.jpg' }) as Of<'video'>;
const PHOTOS: [string, Of<'image'>, boolean?][] = [
  ['landscape + caption', { id: 'p1', type: 'image', src: '/looks/painted/photo1.jpg', alt: '', caption: 'the island, again', size: 'l', color: 'auto' } as Of<'image'>],
  ['portrait, no caption', { id: 'p2', type: 'image', src: '/looks/painted/avatar.jpg', alt: '', size: 's', color: 'auto' } as Of<'image'>, true],
  ['long caption', { id: 'p3', type: 'image', src: '/looks/painted/photo2.jpg', alt: '', caption: 'the studio cat, who has opinions about every single page I paint', size: 's', color: 'auto' } as Of<'image'>],
];
const T = (id: string, text: string, stamp?: boolean) => ({ id, type: 'text', text, size: 's', color: 'auto', ...(stamp ? { look: 'stamp' } : {}) } as Of<'text'>);
const NOTES: [string, Of<'text'>][] = [['short', T('n1', 'Say hi!')], ['long', T('n2', 'Hello! New pages every Sunday. Right now: a picture book about a girl who flies her kite to the moon. Also learning to make **good coffee**. Thank you for reading.')]];
const STAMPS: [string, Of<'text'>][] = [['short', T('s1', 'Live now', true)], ['long', T('s2', 'Open for commissions', true)]];
const SOCIALS = (['instagram', 'youtube', 'x', 'github', 'email'] as const).map((platform, i) => ({ id: 'so' + i, type: 'social', platform, handle: 'mira', size: 's', color: 'auto' } as Of<'social'>));

export function PaintedLab({ p }: { p?: string }) {
  const page = { ...starterPage({ name: 'Mira Sol', style: 'painted', preset: p ?? 'morning' }), badge: false };
  const night = page.theme.preset === 'starry';
  const slots = profileSlots(page);
  const cell = (state: string, node: React.ReactNode, key?: string, className?: string) => <div key={key} className={cn('sc-piece', state !== 'rest' && `is-${state}`, className)}>{node}</div>;
  const piece = (_t: Tile, node: React.ReactNode, o: { key: string; className?: string }) => cell('rest', node, o.key, o.className);
  const longSlots = { ...slots, name: 'Anastasia Montgomery-Okafor', bio: 'Illustrator and picture-book maker. I paint skies, small houses and the cats who live in them, from a tiny studio by the sea.' };
  return (
    <PageFrame page={page} className="posy-scene lab" interactive={false} profile={<></>}>
      <div className={cn('ptk-lab lab-still', night && 'ptk-lab-night pts-night')}>
        <h2 className="plab-h">Profile</h2>
        <div className="plab-row">
          <div className="plab-cell plab-side"><span className="plab-state">desktop, stamp</span><K.PaintedProfile slots={slots} socials={SOCIALS} stamps={[STAMPS[1][1]]} piece={piece} nlen={8} /></div>
          <div className="plab-cell plab-side"><span className="plab-state">long name + bio</span><K.PaintedProfile slots={longSlots} socials={SOCIALS.slice(0, 3)} stamps={[]} piece={piece} nlen={27} /></div>
          <div className="plab-cell plab-ph"><span className="plab-state">phone, no avatar</span><div className="pts-phone plab-phone"><K.PaintedProfile slots={{ ...slots, avatar: null }} socials={SOCIALS} stamps={[STAMPS[0][1]]} piece={piece} nlen={8} /></div></div>
          <div className="plab-cell plab-ph"><span className="plab-state">phone</span><div className="pts-phone plab-phone"><K.PaintedProfile slots={slots} socials={SOCIALS} stamps={[]} piece={piece} nlen={8} /></div></div>
        </div>
        <h2 className="plab-h">Socials · stamp</h2>
        <div className="plab-row">
          {STATES.map(s => <div key={s} className="plab-cell"><span className="plab-state">{s}</span><div className="ptc-socials">{SOCIALS.map(t => cell(s, <K.PaintedSocial tile={t} />, t.id))}</div></div>)}
          {STAMPS.map(([name, t]) => STATES.map(s => <div key={name + s} className="plab-cell"><span className="plab-state">{name} · {s}</span>{cell(s, <K.PaintedSeal tile={t} />)}</div>))}
        </div>
        <h2 className="plab-h">Link · lead card (desktop 760 / narrow 420)</h2>
        {LINKS.map(([name, t]) => (
          <div key={name} className="plab-row"><span className="plab-case">{name}</span>
            {(['rest', 'hover'] as const).map(s => <div key={s} className="plab-cell plab-lead"><span className="plab-state">{s}</span>{cell(s, <K.PaintedLink tile={t} big />)}</div>)}
            <div className="plab-cell plab-ph"><span className="plab-state">phone</span><div className="pts-phone plab-phone">{cell('rest', <K.PaintedLink tile={t} big />)}</div></div>
          </div>
        ))}
        <h2 className="plab-h">Link · card</h2>
        {STATES.map(s => <div key={s} className="plab-row"><span className="plab-case">{s}</span>{LINKS.map(([name, t]) => <div key={name} className="plab-cell plab-col"><span className="plab-state">{name}</span>{cell(s, <K.PaintedLink tile={t} />)}</div>)}</div>)}
        <h2 className="plab-h">Music · video</h2>
        <div className="plab-row">
          {MUSIC.map(([name, t]) => (['rest', 'hover'] as const).map(s => <div key={name + s} className="plab-cell plab-col"><span className="plab-state">{name} · {s}</span>{cell(s, <K.PaintedMusic tile={t} />)}</div>))}
          {(['rest', 'hover'] as const).map(s => <div key={s} className="plab-cell plab-col"><span className="plab-state">video · {s}</span>{cell(s, <K.PaintedVideo tile={VIDEO} editing />)}</div>)}
        </div>
        <h2 className="plab-h">Photo · note</h2>
        <div className="plab-row">
          {PHOTOS.map(([name, t, tall]) => (['rest', 'hover'] as const).map(s => <div key={name + s} className="plab-cell plab-col"><span className="plab-state">{name} · {s}</span>{cell(s, <K.PaintedPhoto tile={t} tall={tall} />)}</div>))}
        </div>
        <div className="plab-row">
          {NOTES.map(([name, t]) => (['rest', 'hover'] as const).map(s => <div key={name + s} className="plab-cell plab-col"><span className="plab-state">{name} · {s}</span>{cell(s, <K.PaintedNote tile={t} />)}</div>))}
        </div>
      </div>
    </PageFrame>
  );
}
