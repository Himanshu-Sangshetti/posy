import Link from 'next/link';
import { PaintedScene } from '@/components/art/PaintedScene';
import { Logo } from '@/components/brand';

export default function NotFound() {
  return (
    <main className="nf">
      <PaintedScene scene="lost" />
      <Link href="/" aria-label="Posy home" className="au-logo nf-logo"><Logo /></Link>
      <div className="nf-copy">
        <h1>This page <em>flew off</em>.</h1>
        <p>It doesn&apos;t exist, or it hasn&apos;t been published yet. If it&apos;s a name, it might still be free.</p>
        <div className="nf-actions">
          <Link href="/signup" className="nf-btn">Claim the name</Link>
          <Link href="/" className="nf-btn nf-btn-line">Go home</Link>
        </div>
      </div>
    </main>
  );
}
