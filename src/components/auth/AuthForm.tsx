'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { signIn, signUp } from '@/lib/auth-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { siGithub, siGoogle } from 'simple-icons';

type Mode = 'login' | 'signup';

function Social({ provider, label, path, next }: { provider: 'github' | 'google'; label: string; path: string; next: string }) {
  return (
    <button type="button" onClick={() => signIn.social({ provider, callbackURL: next })}
      className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-[rgb(45_39_35/.16)] bg-white text-[14.5px] font-medium transition-colors hover:bg-[rgb(45_39_35/.04)]">
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden><path d={path} /></svg>{label}
    </button>
  );
}

export function AuthForm({ mode, providers }: { mode: Mode; providers: { github: boolean; google: boolean } }) {
  const router = useRouter();
  const params = useSearchParams();
  const wanted = params.get('username') ?? '';
  const next = mode === 'signup' ? `/onboarding${wanted ? `?username=${encodeURIComponent(wanted)}` : ''}` : '/edit';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError('');
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email')), password = String(f.get('password'));
    const res = mode === 'signup'
      ? await signUp.email({ email, password, name: String(f.get('name') || email.split('@')[0]) })
      : await signIn.email({ email, password });
    if (res.error) { setError(res.error.message ?? 'Something went wrong'); setBusy(false); return; }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="posy-rise app-card mx-auto w-full max-w-[400px] -rotate-[0.6deg] !p-7 sm:!p-9">
      <h1 className="app-h1 !text-[46px]">{mode === 'signup' ? <>Make your <i>page</i></> : <>Welcome <i>back</i></>}</h1>
      <p className="mt-3 text-[15px] text-[#8d8379]">
        {mode === 'signup' ? (wanted ? <>Claim <b className="font-medium text-[var(--text)]">posy.page/{wanted}</b> in a minute.</> : 'Free, and it takes a minute.') : 'Log in to edit your page.'}
      </p>
      {(providers.github || providers.google) && (
        <div className="mt-6 grid gap-2.5">
          {providers.github && <Social provider="github" label="Continue with GitHub" path={siGithub.path} next={next} />}
          {providers.google && <Social provider="google" label="Continue with Google" path={siGoogle.path} next={next} />}
          <div className="my-2 flex items-center gap-3 text-[13px] text-[var(--muted)]"><span className="h-px flex-1 bg-[var(--line)]" />or<span className="h-px flex-1 bg-[var(--line)]" /></div>
        </div>
      )}
      <form onSubmit={submit} className="mt-6 grid gap-4">
        {mode === 'signup' && (
          <div className="grid gap-1.5"><Label htmlFor="name">Name</Label><Input id="name" name="name" autoComplete="name" placeholder="Ada Lovelace" className="h-11" /></div>
        )}
        <div className="grid gap-1.5"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="h-11" /></div>
        <div className="grid gap-1.5"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder={mode === 'signup' ? 'At least 8 characters' : ''} className="h-11" /></div>
        {error && <p role="alert" className="text-[14px] text-[#c2453c]">{error}</p>}
        <button type="submit" disabled={busy}
          className="app-btn mt-1 h-12 text-[15px]">
          {busy && <Loader2 className="size-4 animate-spin" />}{mode === 'signup' ? 'Create account' : 'Log in'}
        </button>
      </form>
      <p className="mt-6 text-center text-[14px] text-[#8d8379]">
        {mode === 'signup' ? <>Already have a page? <Link href="/login" className="font-medium text-[#2d2723] underline-offset-4 hover:underline">Log in</Link></>
          : <>New here? <Link href={`/signup${wanted ? `?username=${wanted}` : ''}`} className="font-medium text-[#2d2723] underline-offset-4 hover:underline">Make your page</Link></>}
      </p>
    </div>
  );
}
