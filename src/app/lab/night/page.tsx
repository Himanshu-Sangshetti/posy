// Component lab for Night (development only): every kind of tile in its states and awkward content, at real size, on a
// laptop-width and a phone-width page, in each of the look's palettes. Pages are real PageView renders, so what passes here
// is what visitors get.
import { notFound } from 'next/navigation';
import { PageView } from '@/components/page/PageView';
import { parsePage, newId, type Page } from '@/lib/schema';
import { template } from '@/lib/templates';
import { STYLE_PALETTES } from '@/lib/styles';
import { THEMES } from '@/lib/themes';

export const dynamic = 'force-dynamic';

const pic = (n: string) => `/looks/night/${n}.jpg`;
const t = (tiles: Record<string, unknown>[]) => tiles.map(x => ({ ...x, id: newId() }));
const page = (name: string, preset: string, tiles: Record<string, unknown>[], bio = '', avatar = pic('avatar')): Page =>
  parsePage({ profile: { name, bio, avatar, location: 'Sector 7' }, theme: { style: 'night', preset, font: 'night', layout: 'bento', avatar: 'squircle' }, tiles: t(tiles) });

/** Pictures that are nothing like ours: a sunny selfie, flowers, a cream print, berries, a lemon. */
const THEIRS: Record<string, unknown>[] = [
  { type: 'image', src: '/samples/flowers.jpg', caption: 'Flowers in the sun (their photo)', size: 'l' },
  { type: 'link', url: 'https://example.com/shop', title: 'My shop', description: 'Handmade ceramics', image: '/samples/berries.jpg', size: 'w' },
  { type: 'image', src: '/looks/cobalt/photo1.jpg', caption: 'A cream print', size: 's' },
  { type: 'image', src: '/samples/tea.jpg', size: 't' },
  { type: 'video', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', title: 'A bright, busy thumbnail', image: '/looks/painted/video.jpg', size: 'w' },
  { type: 'music', url: 'https://open.spotify.com/', title: 'A pastel album', artist: 'Someone else', image: '/looks/painted/music.jpg', size: 'w' },
  { type: 'link', url: 'https://example.com/blog', title: 'Blog post with a screenshot', image: '/samples/lemon.jpg', size: 'w' },
];

const SETS: [string, Record<string, unknown>[]][] = [
  ['Panels: links in every size and length', [
    { type: 'link', url: 'https://example.com', title: 'Website', size: 's' },
    { type: 'link', url: 'https://kai.zero/logs/how-i-wired-the-flat', size: 's' },
    { type: 'link', url: 'https://example.com/a', title: 'A very long scraped title: How I rebuilt my whole studio rig from salvaged parts and a lot of late nights', description: 'And a long description that goes on past where it should, to check that it is trimmed cleanly instead of running off the panel.', size: 'w' },
    { type: 'link', url: 'https://example.com/b', title: 'Portfolio', description: 'Selected work, 2019 to now', image: pic('photo1'), size: 'l' },
    { type: 'link', url: 'https://example.com/c', title: 'Tall panel with a picture', image: pic('photo2'), size: 't' },
    { type: 'link', url: 'https://gumroad.com', title: 'Sample packs', description: 'Drums, noise and field recordings', size: 'w' },
    { type: 'link', url: 'https://substack.com', title: 'Transmissions', description: 'A short letter each month', size: 'w' },
    { type: 'link', url: 'https://buttondown.email', title: 'Letters', size: 's' },
    { type: 'github', repo: 'kai/ghostwire', description: 'A tiny synth that turns network traffic into sound.', stars: 1240, language: 'Rust', size: 'w' },
    { type: 'github', repo: 'kai/a-very-long-repository-name-that-keeps-going', size: 's' },
  ]],
  ['Feeds: photos, video and music', [
    { type: 'image', src: pic('photo1'), caption: 'The walk home, 2 a.m.', size: 'l' },
    { type: 'image', src: pic('photo2'), size: 't' },
    { type: 'image', src: pic('cover'), caption: 'A caption long enough that it has to be cut short at the end of the line', size: 'w' },
    { type: 'image', src: '/samples/flowers.jpg', caption: 'Any photo, scanned', size: 's' },
    { type: 'video', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', title: 'Arcade sessions, ep. 7', image: pic('video'), size: 'w' },
    { type: 'music', url: 'https://open.spotify.com/', title: 'Midnight mix vol. 3', artist: 'Kai Zero', image: pic('music'), size: 'w' },
    { type: 'music', url: 'https://open.spotify.com/', title: 'A song with a much longer title than usual', artist: 'Artist', image: pic('music'), size: 's' },
    { type: 'music', url: 'https://open.spotify.com/', title: 'No cover', size: 's' },
  ]],
  ['Words: notes, stamps and sections', [
    { type: 'heading', text: 'A section title' },
    { type: 'text', text: 'Short line.', size: 's' },
    { type: 'text', text: 'The city never sleeps. Neither does the signal.', size: 'w' },
    { type: 'text', text: 'A long note, shown as a decrypted message. It should keep its measure and stop cleanly when it runs out of room, instead of spilling past the edge of the panel and into the next one, which would look broken.', size: 'l' },
    { type: 'text', text: 'Live tonight', look: 'stamp', size: 's' },
    { type: 'text', text: 'Open for commissions this spring', look: 'stamp', size: 's' },
    { type: 'heading', text: 'Elsewhere' },
    { type: 'link', url: 'https://example.com', title: 'Under a heading', size: 'w' },
  ]],
];

const Frame = ({ w, p }: { w: number; p: Page }) => <div className="lab-frame" style={{ width: w }}><PageView page={p} contained /></div>;

export default function NightLab() {
  if (process.env.NODE_ENV === 'production') notFound();
  const palettes = STYLE_PALETTES.night;
  const [main, alt] = [palettes[0], palettes[palettes.length - 1]];
  return (
    <main style={{ padding: '40px 32px 120px', background: '#d9d5cc', fontFamily: 'var(--font-geist), system-ui', color: '#16140f' }}>
      <style>{`.lab-frame{position:relative;overflow:hidden;border-radius:14px;box-shadow:0 20px 60px -30px rgb(0 0 0/.5);background:#fff}.lab-row{display:flex;gap:28px;align-items:flex-start;overflow-x:auto;padding-bottom:12px}.lab-h{font-family:var(--font-serif);font-weight:400;font-size:34px;margin:56px 0 14px}.lab-k{font-size:13px;color:#6b665c;margin:0 0 8px}`}</style>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: 54, margin: 0 }}>Night · component lab</h1>
      <p style={{ color: '#6b665c', margin: '6px 0 0' }}>Every tile in its awkward cases, laptop and phone width, in each palette. Point at things: panels glitch, tapes turn, cursors blink.</p>
      {SETS.map(([title, tiles]) => (
        <section key={title}>
          <h2 className="lab-h">{title}</h2>
          {[main, alt].map(preset => (
            <div key={preset}>
              <p className="lab-k">{THEMES[preset].name}</p>
              <div className="lab-row"><Frame w={1200} p={page('Kai Zero', preset, tiles)} /><Frame w={390} p={page('Kai Zero', preset, tiles)} /></div>
            </div>
          ))}
        </section>
      ))}
      <h2 className="lab-h">Their own pictures: the look has to survive them</h2>
      {[main, alt].map(preset => (
        <div key={preset}><p className="lab-k">{THEMES[preset].name}</p>
          <div className="lab-row"><Frame w={1200} p={page('Kai Zero', preset, THEIRS, 'With a selfie and photos that are nothing like the sample art.', '/samples/flowers.jpg')} /><Frame w={390} p={page('Kai Zero', preset, THEIRS, 'With a selfie and photos that are nothing like the sample art.', '/samples/flowers.jpg')} /></div>
        </div>
      ))}
      <h2 className="lab-h">The starter page in every palette</h2>
      {palettes.map(preset => {
        const p = template('neon', 'Kai Zero'); const q = parsePage({ ...p, theme: { ...p.theme, preset } });
        return <div key={preset}><p className="lab-k">{THEMES[preset].name}</p><div className="lab-row"><Frame w={1200} p={q} /><Frame w={390} p={q} /></div></div>;
      })}
      <h2 className="lab-h">Long name, no bio, no avatar</h2>
      <div className="lab-row"><Frame w={1200} p={parsePage({ ...page('Alexandrina Montgomery-Okafor', main, SETS[0][1].slice(0, 4)), profile: { name: 'Alexandrina Montgomery-Okafor', bio: '' } })} /><Frame w={390} p={parsePage({ ...page('Alexandrina Montgomery-Okafor', main, SETS[0][1].slice(0, 4)), profile: { name: 'Alexandrina Montgomery-Okafor', bio: '' } })} /></div>
    </main>
  );
}
