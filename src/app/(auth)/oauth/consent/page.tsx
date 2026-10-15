import { Suspense } from 'react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { currentUser } from '@/lib/session';
import { ConsentForm } from '@/components/auth/ConsentForm';

export const metadata: Metadata = { title: 'Allow access · Posy', robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function ConsentPage({ searchParams }: Props) {
  const q = await searchParams;
  const user = await currentUser();
  if (!user) redirect('/login');
  let app = { name: 'An app', host: '' };
  if (q.client_id) {
    const c = await auth.api.getOAuthClientPublic({ query: { client_id: q.client_id }, headers: await headers() }).catch(() => null) as { client_name?: string; client_uri?: string; redirect_uris?: string[] } | null;
    const uri = c?.client_uri ?? c?.redirect_uris?.[0];
    let host = '';
    try { host = uri ? new URL(uri).host : ''; } catch { /* ignore */ }
    app = { name: c?.client_name || host || 'An app', host };
  }
  return (
    <main className="au-main" style={{ gridTemplateColumns: '1fr' }}>
      <div className="au-side" style={{ placeItems: 'center' }}>
        <div className="au-card ac-rise" style={{ justifySelf: 'center' }}>
          <Suspense><ConsentForm app={app} email={user.email} /></Suspense>
        </div>
      </div>
    </main>
  );
}
