// The public site's footer: a meadow you can paint into colour with your cursor, the name set huge, and the links.
import Link from 'next/link';
import { PosyMark } from '@/components/brand';
import type { SiteLinks } from '@/edition/types';
import { PaintReveal } from './PaintReveal';
import './site.css';

export function SiteFooter({ site, solo }: { site: SiteLinks; solo?: boolean }) {
  return (
    <footer className={solo ? 'lf lf-solo' : 'lf'}>
      <PaintReveal src="/art/meadow.jpg" sketch="/art/meadow-sketch.jpg" className="lf-art" />
      <p className="lf-word" aria-hidden>posy</p>
      <div className="lf-inner">
        <div className="lf-brand">
          <PosyMark className="lf-mark" />
          <p>{site.tagline ?? 'One link for everything you make.'}</p>
        </div>
        {site.footer.map(col => (
          <nav key={col.title} aria-label={col.title}>
            <h4>{col.title}</h4>
            {col.links.map(([label, href]) => href.startsWith('http')
              ? <a key={label} href={href} target="_blank" rel="noopener">{label}</a>
              : <Link key={label} href={href}>{label}</Link>)}
          </nav>
        ))}
      </div>
    </footer>
  );
}
