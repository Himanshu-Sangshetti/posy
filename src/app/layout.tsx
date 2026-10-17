import { EditionScripts } from '@/edition/scripts';
import type { Metadata } from 'next';
import { fontVariables } from '@/lib/fonts';
import { siteUrl } from '@/lib/site';
import { ENTITY_DESCRIPTION } from '@/lib/meta';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: 'Posy · A beautiful link in bio', template: '%s' },
  description: ENTITY_DESCRIPTION,
  openGraph: { siteName: 'Posy', type: 'website', images: [{ url: '/brand/og.png', width: 1200, height: 630, alt: 'Posy: a link in bio that looks like you made it by hand' }] },
  twitter: { card: 'summary_large_image', images: ['/brand/og.png'] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}<EditionScripts /></body>
    </html>
  );
}
