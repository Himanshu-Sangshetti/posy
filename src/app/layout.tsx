import type { Metadata } from 'next';
import { fontVariables } from '@/lib/fonts';
import { siteUrl } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: 'Posy · A beautiful link in bio', template: '%s' },
  description: 'A link in bio that looks like you made it by hand. Eight looks, an editor your AI agent can use, free and open source.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
