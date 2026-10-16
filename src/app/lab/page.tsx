// Development only: links to the demo pages and component labs of the looks being redesigned.
import Link from 'next/link';
import { notFound } from 'next/navigation';

const LOOKS = [['lofi', 'Lofi', 'lofi'], ['washi', 'Washi', 'washi'], ['painted', 'Painted', 'painted'], ['desk', 'Desk', 'cozy']] as const;

export default function LabIndex() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '72px 24px', fontFamily: 'var(--font-geist), system-ui', color: '#16140f' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: 52, margin: '0 0 8px' }}>Looks in progress</h1>
      <p style={{ color: '#6b665c', margin: '0 0 40px' }}>Open each on a laptop and on a phone (or narrow the window below 760px).</p>
      {LOOKS.map(([slug, name, lab]) => (
        <section key={slug} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16, alignItems: 'baseline', padding: '18px 0', borderTop: '1px solid #e7e1d6' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: 30 }}>{name}</h2>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 15 }}>
            <Link href={`/${slug}-real`} style={{ color: '#c8402b' }}>Real links</Link>
            <Link href={`/${slug}-starter`} style={{ color: '#c8402b' }}>Starter page</Link>
            <Link href={`/lab/${lab}`} style={{ color: '#6b665c' }}>Component lab</Link>
          </div>
        </section>
      ))}
    </main>
  );
}
