import type { Metadata, Viewport } from 'next';
import { fontVariables } from '@/lib/fonts';
import { readPage } from '@/lib/content';
import { THEMES } from '@/lib/themes';
import './globals.css';

export function generateMetadata(): Metadata {
  const page = readPage();
  const title = page.seo.title || page.profile.name;
  const description = page.seo.description || page.profile.bio || `${page.profile.name} on the web`;
  // Absolute URL of the site (seo.url wins; the GitHub Pages workflow passes POSY_SITE_URL).
  const site = (page.seo.url || process.env.POSY_SITE_URL || '').replace(/\/$/, '');
  const base = process.env.POSY_BASE_PATH || '';
  const origin = site ? new URL(site).origin : undefined;
  const og = site ? `${origin}${base}/og.png` : undefined;
  return {
    title, description,
    metadataBase: origin ? new URL(origin) : undefined,
    openGraph: { title, description, type: 'profile', ...(og && { images: [{ url: og, width: 1200, height: 630 }] }), ...(site && { url: site }) },
    twitter: { card: 'summary_large_image', title, description, ...(og && { images: [og] }) },
    icons: { icon: `${process.env.POSY_BASE_PATH || ''}/favicon.png` },
  };
}

export function generateViewport(): Viewport {
  const page = readPage();
  return { themeColor: THEMES[page.theme.preset].bg, width: 'device-width', initialScale: 1 };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
