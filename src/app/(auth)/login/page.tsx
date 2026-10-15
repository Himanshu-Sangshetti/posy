import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { providers } from '@/lib/auth';
import { currentUser } from '@/lib/session';
import { SITE_HOST } from '@/lib/site';
import { edition } from '@/edition';

export const metadata: Metadata = { title: 'Log in · Posy' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (await currentUser()) redirect('/edit');
  const query = new URLSearchParams(Object.entries(await searchParams).flatMap(([k, v]) => (Array.isArray(v) ? v : v === undefined ? [] : [v]).map(x => [k, x] as [string, string]))).toString();
  return <AuthForm mode="login" host={SITE_HOST()} query={query} providers={{ ...providers, google: providers.google || edition.id === 'cloud', googleReady: providers.google }} />;
}
