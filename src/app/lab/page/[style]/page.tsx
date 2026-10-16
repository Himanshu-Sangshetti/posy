// A real page in any look, with realistic content (development only), for checking how a look arranges a whole page:
//   /lab/page/<style>?set=starter|rich|sparse|one|photos&preset=<palette>&layout=bento|list|canvas
// "rich" is what a real person's page tends to hold; "sparse" is a first-day page; "photos" is someone's own pictures.
import { notFound } from 'next/navigation';
import { PageView } from '@/components/page/PageView';
import { parsePage, newId, STYLES } from '@/lib/schema';
import { starterPage } from '@/lib/templates';
import { STYLE_INFO } from '@/lib/styles';

export const dynamic = 'force-dynamic';

const ids = (tiles: Record<string, unknown>[]) => tiles.map(t => ({ ...t, id: newId() }));
const SOCIALS = [
  { type: 'social', platform: 'instagram', handle: 'himanshu', size: 's' },
  { type: 'social', platform: 'x', handle: 'himanshu', size: 's' },
  { type: 'social', platform: 'youtube', handle: 'himanshu', size: 's' },
  { type: 'social', platform: 'substack', handle: 'himanshu', size: 's' },
  { type: 'social', platform: 'github', handle: 'himanshu', size: 's' },
  { type: 'social', platform: 'email', handle: 'hi@himanshu.dev', size: 's' },
];
const SETS: Record<string, { bio: string; location?: string; avatar?: string; tiles: Record<string, unknown>[] }> = {
  rich: {
    bio: 'I build small tools and write about how the internet feels. Currently making a link-in-bio that looks hand made.', location: 'Pune, India', avatar: '/looks/painted/avatar.jpg',
    tiles: [
      ...SOCIALS,
      { type: 'link', url: 'https://himanshu.substack.com', title: 'The Slow Web', description: 'A letter every other Sunday about tools, craft and the internet', size: 'w' },
      { type: 'link', url: 'https://himanshu.dev', title: 'Portfolio', description: 'Selected work, 2019 to now', image: '/looks/lofi/photo1.jpg', size: 'l' },
      { type: 'github', repo: 'vercel/next.js', description: 'The React framework for the web', stars: 128000, language: 'TypeScript', size: 'w' },
      { type: 'text', text: 'Now: shipping Posy, a link in bio that looks like you made it by hand.', size: 'w' },
      { type: 'heading', text: 'Things I make' },
      { type: 'video', url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', title: 'How I design a page in ten minutes', size: 'w' },
      { type: 'music', url: 'https://open.spotify.com/track/1', title: 'Weightless', artist: 'Marconi Union', size: 'w' },
      { type: 'image', src: '/samples/tea.jpg', caption: 'Morning desk', size: 's' },
      { type: 'image', src: '/samples/flowers.jpg', caption: 'From the walk', size: 's' },
      { type: 'link', url: 'https://gumroad.com/himanshu', title: 'Notion templates', description: 'The planner I use every day', size: 's' },
      { type: 'link', url: 'https://cal.com/himanshu', title: 'Book a call', size: 's' },
      { type: 'text', text: 'Say hello', look: 'stamp', size: 's' },
      { type: 'heading', text: 'Elsewhere' },
      { type: 'link', url: 'https://medium.com/@himanshu/a-very-long-title-about-building-things-slowly-and-carefully-in-public', size: 'w' },
      { type: 'link', url: 'https://linkedin.com/in/himanshu', title: 'LinkedIn', size: 's' },
    ],
  },
  one: {
    bio: 'Writer. Mostly about trains.', tiles: [
      { type: 'social', platform: 'instagram', handle: 'ana', size: 's' },
      { type: 'link', url: 'https://ana.substack.com', title: 'My newsletter', size: 'w' },
    ],
  },
  sparse: {
    bio: 'Designer.', tiles: [
      { type: 'social', platform: 'instagram', handle: 'ana', size: 's' },
      { type: 'link', url: 'https://ana.design', title: 'My website', size: 'w' },
      { type: 'link', url: 'https://dribbble.com/ana', title: 'Dribbble', size: 's' },
      { type: 'link', url: 'https://ana.substack.com', title: 'Newsletter', size: 's' },
    ],
  },
  photos: {
    bio: 'Photos that are nothing like the sample art: dark, bright, colourful and plain.', avatar: '/samples/flowers.jpg', tiles: [
      { type: 'social', platform: 'instagram', handle: 'me', size: 's' },
      { type: 'image', src: '/looks/night/bg-street.jpg', caption: 'A dark street at night', size: 'l' },
      { type: 'image', src: '/samples/lemon.jpg', caption: 'A bright lemon', size: 's' },
      { type: 'image', src: '/samples/berries.jpg', caption: 'Berries', size: 's' },
      { type: 'link', url: 'https://example.com', title: 'A link with a dark picture', image: '/looks/lofi/room-violet.jpg', size: 'w' },
      { type: 'image', src: '/samples/petunia.jpg', caption: 'Petunia', size: 't' },
      { type: 'music', url: 'https://open.spotify.com/', title: 'A colourful album', artist: 'Someone', image: '/looks/night/music.jpg', size: 'w' },
    ],
  },
};

export default async function SamplePage({ params, searchParams }: { params: Promise<{ style: string }>; searchParams: Promise<{ set?: string; preset?: string; layout?: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { style } = await params; const { set = 'rich', preset, layout } = await searchParams;
  if (!(STYLES as readonly string[]).includes(style)) notFound();
  const s = style as keyof typeof STYLE_INFO;
  const base = starterPage({ name: 'Himanshu Sangshetti', style: s });
  const data = SETS[set];
  const page = parsePage({
    ...base,
    profile: data ? { name: 'Himanshu Sangshetti', bio: data.bio, location: data.location, avatar: data.avatar } : base.profile,
    theme: { ...base.theme, ...(preset ? { preset } : {}), ...(layout ? { layout } : {}) },
    tiles: data ? ids(data.tiles) : base.tiles,
  });
  return <PageView page={page} />;
}
