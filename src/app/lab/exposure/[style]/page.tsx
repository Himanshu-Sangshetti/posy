// /lab/exposure/<style>?preset=<palette>&photos=natural|mono -> dark, flat, bright and colourful photos side by side on one look.
import { notFound } from 'next/navigation';
import { parsePage } from '@/lib/schema';
import { STYLES } from '@/lib/schema';
import { starterPage } from '@/lib/templates';
import { PageView } from '@/components/page/PageView';

const SRC = ['/samples/dark-test.jpg', '/samples/flat-test.jpg', '/looks/night/bg-street.jpg', '/looks/lofi/room-violet.jpg', '/looks/painted/sky-night.webp', '/samples/lemon.jpg', '/samples/flowers.jpg', '/samples/berries.jpg'];

export default async function Exposure({ params, searchParams }: { params: Promise<{ style: string }>; searchParams: Promise<{ preset?: string; photos?: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { style } = await params; const { preset, photos } = await searchParams;
  if (!(STYLES as readonly string[]).includes(style)) notFound();
  const base = starterPage({ name: 'Exposure', style: style as (typeof STYLES)[number] });
  const page = parsePage({
    ...base,
    profile: { name: 'Exposure', bio: 'Dark, flat, bright and colourful photos.', avatar: SRC[0] },
    theme: { ...base.theme, ...(preset ? { preset } : {}), ...(photos ? { photos } : {}) },
    tiles: SRC.map((src, i) => ({ id: `x${i}`, type: 'image', src, caption: src.split('/').pop(), size: i < 2 ? 'l' : 's' })),
  });
  return <PageView page={page} />;
}
