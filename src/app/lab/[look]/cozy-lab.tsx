// Desk's component lab: every object in every state and content case, at real size, on the real desk.
import type { Tile } from '@/lib/schema';
import { starterPage } from '@/lib/templates';
import { PageFrame, profileSlots } from '@/components/page/PageView';
import * as K from '@/components/page/styles/desk-scene';
import { cn } from '@/lib/utils';

type Of<T extends Tile['type']> = Extract<Tile, { type: T }>;
let seq = 0;
const id = () => 'lab' + (seq++).toString(36);
const L = (o: Partial<Of<'link'>> & { url: string }): Of<'link'> => ({ id: id(), type: 'link', size: 'w', color: 'auto', ...o } as Of<'link'>);
const LINKS: [string, Of<'link'> | Of<'github'>][] = [
  ['rich, with image', L({ url: 'https://himanshu.dev/writing/by-hand', title: 'Why I write everything by hand first', description: 'On slow drafts, fast coffee and the joy of crossing things out.', image: '/looks/desk/cover.jpg' })],
  ['long scraped title, no image', L({ url: 'https://himanshu.dev', title: 'Himanshu Kumar | Experienced Full Stack Software Engineer | Portfolio website built with React.js', description: 'Himanshu Kumar | Experienced Full Stack Software Engineer | Portfolio' })],
  ['very short', L({ url: 'https://shop.example.com', title: 'Shop' })],
  ['newsletter', L({ url: 'https://himanshu.substack.com', title: 'Studio letters', description: 'New work and notes, once a month' })],
  ['newsletter with image', L({ url: 'https://buttondown.email/mira', title: 'Mira’s Sunday letter', image: '/looks/desk/photo2.jpg' })],
  ['repo', { id: 'g1', type: 'github', repo: 'vercel/next.js', size: 'w', color: 'auto', stars: 131000, language: 'JavaScript', description: 'The React Framework for the web' } as Of<'github'>],
  ['broken image', L({ url: 'https://example.com/post', title: 'A post whose preview image is gone', image: 'https://example.invalid/nope.jpg' })],
];
const STATES = ['rest', 'hover', 'press'] as const;
const SOCIALS: Of<'social'>[] = (['instagram', 'x', 'youtube', 'github', 'email', 'linkedin', 'tiktok'] as const).map(p => ({ id: id(), type: 'social', platform: p, handle: 'mira', size: 's', color: 'auto' } as Of<'social'>));
const PHOTOS: [string, Of<'image'>][] = [
  ['landscape + caption', { id: 'p1', type: 'image', src: '/looks/desk/photo1.jpg', alt: '', caption: 'spring, again ✿', size: 'l', color: 'auto' } as Of<'image'>],
  ['portrait, no caption', { id: 'p2', type: 'image', src: '/looks/desk/avatar.jpg', alt: '', size: 's', color: 'auto' } as Of<'image'>],
  ['long caption', { id: 'p3', type: 'image', src: '/looks/desk/photo2.jpg', alt: '', caption: 'the mugs I glazed over three very long weekends, finally out of the kiln', size: 's', color: 'auto' } as Of<'image'>],
];
const NOTES: [string, Of<'text'>][] = [
  ['note, short', { id: 'n1', type: 'text', text: 'Say hi!', size: 's', color: 'auto' } as Of<'text'>],
  ['note, long', { id: 'n2', type: 'text', text: 'Now: shipping a tiny synth in the browser. Also learning to make **good coffee**. Ask me about either, or both, any time.', size: 's', color: 'auto' } as Of<'text'>],
  ['note, mint', { id: 'n5', type: 'text', text: 'Back in the studio on Monday', size: 's', color: 'mint' } as Of<'text'>],
];
const STAMPS: [string, Of<'text'>][] = [
  ['stamp, short', { id: 'n3', type: 'text', text: 'Live now', look: 'stamp', size: 's', color: 'auto' } as Of<'text'>],
  ['stamp, long', { id: 'n4', type: 'text', text: 'Open for freelance work', look: 'stamp', size: 's', color: 'auto' } as Of<'text'>],
  ['stamp, lilac', { id: 'n6', type: 'text', text: 'Open for work', look: 'stamp', size: 's', color: 'lilac' } as Of<'text'>],
];
const M = (o: Record<string, unknown>) => ({ id: id(), size: 'w', color: 'auto', ...o } as Of<'music'> | Of<'video'>);
const MEDIA: [string, Of<'music'> | Of<'video'>][] = [
  ['music, cover', M({ type: 'music', url: 'https://open.spotify.com/playlist/x', title: 'My song of the week', artist: 'Mira Sol', image: '/looks/desk/music.jpg' })],
  ['music, long title', M({ type: 'music', url: 'https://open.spotify.com/album/x', title: 'Songs for the long drive home when the city is asleep', artist: 'Various artists, mostly ones you never heard of', image: '/looks/desk/photo1.jpg' })],
  ['music, no cover', M({ type: 'music', url: 'https://open.spotify.com/track/x', title: 'On repeat', artist: 'Spotify' })],
  ['video, thumb', M({ type: 'video', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', title: 'A slow morning in the studio', image: '/looks/desk/video.jpg' })],
];

export function DeskLab({ p }: { p?: string }) {
  const page = { ...starterPage({ name: 'Mira Sol', style: 'cozy', preset: p ?? 'cream' }), badge: false };
  const slots = profileSlots(page);
  const long = profileSlots({ ...page, profile: { ...page.profile, name: 'Himanshu Sangshetti', bio: 'Building tools for indie devs. Writing about slow software, film cameras and the long way round. Say hi!' } });
  const bare = profileSlots({ ...page, profile: { ...page.profile, avatar: undefined, location: 'from Lisbon' }, theme: { ...page.theme, avatar: 'hidden' } });
  const piece = (state: string, node: React.ReactNode, className?: string) => <div className={cn('sc-piece', state !== 'rest' && `is-${state}`, className)}>{node}</div>;
  const pins = SOCIALS.slice(0, 4).map(t => <div key={t.id} className="sc-piece"><K.DeskPin tile={t} /></div>);
  const stamp = <div className="sc-piece"><K.DeskInkStamp tile={STAMPS[1][1]} uid="lab-letter" /></div>;
  return (
    <PageFrame page={page} className="posy-scene lab" interactive={false} profile={<></>}>
      <div className="dks dkl">
        <K.DeskDefs />
        <span className="dks-lamp" aria-hidden />
        <h2 className="dkl-h">You · a letter with your polaroid clipped on</h2>
        <div className="dkl-row">
          <div className="dkl-cell" style={{ width: 540 }}><span className="dkl-s">desktop</span><K.DeskLetter slots={slots} uid="l1" pins={pins} stamp={stamp} /></div>
          <div className="dkl-cell" style={{ width: 540 }}><span className="dkl-s">long name and bio</span><K.DeskLetter slots={long} uid="l2" pins={pins} /></div>
          <div className="dkl-cell" style={{ width: 460 }}><span className="dkl-s">no photo</span><K.DeskLetter slots={bare} uid="l3" pins={pins.slice(0, 2)} /></div>
        </div>
        <div className="dkl-row dks-phone dkl-phone">
          <div className="dkl-cell" style={{ width: 358 }}><span className="dkl-s">phone</span><K.DeskLetter slots={long} uid="l4" pins={pins} stamp={stamp} /></div>
          <div className="dkl-cell" style={{ width: 358 }}><span className="dkl-s">phone, no photo</span><K.DeskLetter slots={bare} uid="l5" pins={pins.slice(0, 3)} /></div>
        </div>

        <h2 className="dkl-h">Links · featured (the first two)</h2>
        {LINKS.map(([name, t]) => (
          <div key={name} className="dkl-row"><span className="dkl-case">{name}</span>
            {STATES.map(s => <div key={s} className="dkl-cell dkl-feat"><span className="dkl-s">{s}</span>{piece(s, <K.DeskLinkObject tile={t} featured uid={`f-${s}-${t.id}`} />)}</div>)}
          </div>
        ))}
        <h2 className="dkl-h">Links · the rest</h2>
        {LINKS.map(([name, t]) => (
          <div key={name} className="dkl-row"><span className="dkl-case">{name}</span>
            {STATES.map(s => <div key={s} className="dkl-cell dkl-tag"><span className="dkl-s">{s}</span>{piece(s, <K.DeskLinkObject tile={t} uid={`r-${s}-${t.id}`} />)}</div>)}
          </div>
        ))}
        <h2 className="dkl-h">Links · phone</h2>
        <div className="dkl-row dks-phone dkl-phone">
          {LINKS.map(([name, t]) => (
            <div key={name} className="dkl-cell dkl-phonecol"><span className="dkl-s">{name}</span>
              <div className="dks-m-links">
                {piece('rest', <K.DeskLinkObject tile={t} featured uid={`pf-${t.id}`} />)}
                {piece('rest', <K.DeskLinkObject tile={t} uid={`pr-${t.id}`} />)}
              </div>
            </div>
          ))}
        </div>

        <h2 className="dkl-h">Socials · enamel pins</h2>
        {STATES.map(s => (
          <div key={s} className="dkl-row"><span className="dkl-case">{s}</span>
            {SOCIALS.map(t => <div key={t.id} className="dkl-cell">{piece(s, <K.DeskPin tile={t} />)}</div>)}
          </div>
        ))}

        <h2 className="dkl-h">Music and video</h2>
        {MEDIA.map(([name, t]) => (
          <div key={name} className="dkl-row"><span className="dkl-case">{name}</span>
            {(['rest', 'hover'] as const).map(s => <div key={s} className="dkl-cell dkl-media"><span className="dkl-s">{s}</span>{piece(s, t.type === 'music' ? <K.DeskRecord tile={t} /> : <K.DeskTicket tile={t} editing />)}</div>)}
            <div className="dkl-cell dkl-media-sm"><span className="dkl-s">phone</span>{piece('rest', t.type === 'music' ? <K.DeskRecord tile={t} /> : <K.DeskTicket tile={t} editing />)}</div>
          </div>
        ))}

        <h2 className="dkl-h">Photos</h2>
        <div className="dkl-row">
          {PHOTOS.map(([name, t]) => (['rest', 'hover'] as const).map(s => (
            <div key={name + s} className={cn('dkl-cell', t.size === 'l' ? 'dkl-wide' : 'dkl-photo')}><span className="dkl-s">{name} · {s}</span>{piece(s, <K.DeskPolaroid tile={t} />)}</div>
          )))}
        </div>
        <h2 className="dkl-h">Notes and stamps</h2>
        <div className="dkl-row">
          {NOTES.map(([name, t]) => (['rest', 'hover'] as const).map(s => <div key={name + s} className="dkl-cell dkl-note"><span className="dkl-s">{name} · {s}</span>{piece(s, <K.DeskSticky tile={t} />)}</div>))}
        </div>
        <div className="dkl-row">
          {STAMPS.map(([name, t]) => (['rest', 'hover'] as const).map(s => <div key={name + s} className="dkl-cell dkl-stamp"><span className="dkl-s">{name} · {s}</span>{piece(s, <K.DeskInkStamp tile={t} uid={`s-${s}-${t.id}`} />)}</div>))}
        </div>
        <h2 className="dkl-h">Props</h2>
        <div className="dkl-row dkl-props">{['coffee', 'plant', 'sprig'].map(n => <div key={n} className="dkl-cell"><K.DeskProp name={n} /></div>)}</div>
      </div>
    </PageFrame>
  );
}
