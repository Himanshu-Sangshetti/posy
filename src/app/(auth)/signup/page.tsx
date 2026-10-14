import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { providers } from '@/lib/auth';
import { currentUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Sign up · Posy' };

export default async function SignupPage() {
  if (await currentUser()) redirect('/edit');
  return <Suspense><AuthForm mode="signup" providers={providers} /></Suspense>;
}
