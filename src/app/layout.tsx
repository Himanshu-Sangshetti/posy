import type { Metadata } from 'next';
import { fontVariables } from '@/lib/fonts';
import { siteUrl } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: 'Posy · A beautiful link in bio', template: '%s' },
  description: 'Posy is a link-in-bio page that looks hand-made. Pick a look, add your links, publish. Edit it yourself or let your AI do it.',
  openGraph: { siteName: 'Posy', type: 'website', images: [{ url: '/brand/og.png', width: 1200, height: 630, alt: 'Posy: a link in bio that looks like you made it by hand' }] },
  twitter: { card: 'summary_large_image', images: ['/brand/og.png'] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
