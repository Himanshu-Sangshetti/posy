import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { providers } from '@/lib/auth';
import { currentUser } from '@/lib/session';
import { SITE_HOST } from '@/lib/site';
import { edition } from '@/edition';

export const metadata: Metadata = { title: 'Log in · Posy' };

export default async function LoginPage() {
  if (await currentUser()) redirect('/edit');
  return <Suspense><AuthForm mode="login" host={SITE_HOST()} providers={{ ...providers, google: providers.google || edition.id === 'cloud', googleReady: providers.google }} /></Suspense>;
}
