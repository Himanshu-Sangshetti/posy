// Development only: the component lab and sample pages for each look.
import Link from 'next/link';
import { notFound } from 'next/navigation';

const LOOKS = [['cozy', 'Desk'], ['washi', 'Washi'], ['lofi', 'Lofi'], ['painted', 'Painted'], ['cobalt', 'Cobalt'], ['night', 'Night']] as const;
const SETS = ['rich', 'sparse', 'photos', 'starter'] as const;

export default function LabIndex() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '72px 24px', fontFamily: 'var(--font-geist), system-ui', color: '#16140f' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: 52, margin: '0 0 8px' }}>Looks</h1>
      <p style={{ color: '#6b665c', margin: '0 0 40px' }}>
        Open each on a laptop and on a phone (or narrow the window below 760px). Sample pages live at <code>/lab/page/&lt;id&gt;?set=rich|sparse|photos|starter</code>.
      </p>
      {LOOKS.map(([id, name]) => (
        <section key={id} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16, alignItems: 'baseline', padding: '18px 0', borderTop: '1px solid #e7e1d6' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: 30 }}>{name}</h2>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 15 }}>
            <Link href={`/lab/${id}`} style={{ color: '#6b665c' }}>Component lab</Link>
            {SETS.map(set => <Link key={set} href={`/lab/page/${id}?set=${set}`} style={{ color: '#c8402b' }}>{set[0].toUpperCase() + set.slice(1)} page</Link>)}
          </div>
        </section>
      ))}
    </main>
  );
}
