import type { Metadata } from 'next';
import { fontVariables } from '@/lib/fonts';
import { siteUrl } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: 'Posy · A beautiful link in bio', template: '%s' },
  description: 'One beautiful page for all your links. Pastel themes, soft motion, and an editor your AI agent can use. Free and open source.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
