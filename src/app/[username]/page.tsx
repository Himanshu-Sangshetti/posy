import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { PageView } from '@/components/page/PageView';
import { PageAnalytics } from '@/components/page/islands';
import { publicPage } from '@/lib/pages';
import { withLiveData } from '@/lib/live-data';
import { THEMES } from '@/lib/themes';
import { siteUrl } from '@/lib/site';

export const revalidate = 3600; // refreshed instantly on publish, hourly otherwise (GitHub stars)

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const r = await publicPage(username);
  if (!r) return { title: 'Not found' };
  const { profile, seo } = r.page;
  const title = seo.title || profile.name;
  const description = seo.description || profile.bio || `${profile.name} on Posy`;
  const url = `${siteUrl()}/${r.row.username}`;
  return {
    title, description,
    alternates: { canonical: url, types: { 'application/json': `/api/v1/public/${r.row.username}` } },
    icons: { icon: `/${r.row.username}/favicon.png` },
    openGraph: { title, description, url, type: 'profile', images: [{ url: `/${r.row.username}/og.png`, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description, images: [`/${r.row.username}/og.png`] },
  };
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const r = await publicPage((await params).username);
  return { themeColor: THEMES[r?.page.theme.preset ?? 'cream'].bg };
}

export default async function UserPage({ params }: Props) {
  const r = await publicPage((await params).username);
  if (!r) notFound();
  const page = await withLiveData(r.page);
  const bg = THEMES[page.theme.preset].bg;
  const url = `${siteUrl()}/${r.row.username}`;
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'ProfilePage', url, dateModified: r.row.publishedAt?.toISOString(),
    mainEntity: {
      '@type': 'Person', name: page.profile.name, description: page.profile.bio || undefined, url,
      ...(page.profile.avatar ? { image: page.profile.avatar.startsWith('http') ? page.profile.avatar : `${siteUrl()}${page.profile.avatar}` } : {}),
      sameAs: page.tiles.flatMap(t => (t.type === 'link' || t.type === 'social') && t.url?.startsWith('http') ? [t.url] : []),
    },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <style>{`html,body{background:${bg}}`}</style>
      <PageView page={page} />
      <PageAnalytics username={r.row.username} />
    </>
  );
}
