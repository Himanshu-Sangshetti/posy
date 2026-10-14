'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff, Loader2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { signIn, signUp } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { siGithub, siGoogle } from 'simple-icons';

type Mode = 'login' | 'signup';

function Social({ provider, label, path, next }: { provider: 'github' | 'google'; label: string; path: string; next: string }) {
  return (
    <Button type="button" variant="outline" onClick={() => signIn.social({ provider, callbackURL: next })} className="ac-btn ac-btn-soft w-full">
      <svg viewBox="0 0 24 24" className="!size-[18px]" fill="currentColor" aria-hidden><path d={path} /></svg>{label}
    </Button>
  );
}

export function AuthForm({ mode, providers }: { mode: Mode; providers: { github: boolean; google: boolean } }) {
  const router = useRouter();
  const params = useSearchParams();
  const wanted = params.get('username') ?? '';
  const next = mode === 'signup' ? `/onboarding${wanted ? `?username=${encodeURIComponent(wanted)}` : ''}` : '/edit';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError('');
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email')), password = String(f.get('password'));
    const res = mode === 'signup'
      ? await signUp.email({ email, password, name: String(f.get('name') || email.split('@')[0]) })
      : await signIn.email({ email, password });
    if (res.error) { const m = res.error.message ?? 'Something went wrong'; setError(m); toast.error(m); setBusy(false); return; }
    router.push(next);
    router.refresh();
  }

  const signup = mode === 'signup';
  return (
    <div className="ac-rise ac-card mx-auto w-full max-w-[420px] p-7 sm:p-9">
      <p className="ac-eyebrow">{signup ? 'Step 1 of 2 · Account' : 'Welcome back'}</p>
      <h1 className="ac-display mt-3 text-[40px]">{signup ? <>Make your <i>page</i></> : <>Log <i>in</i></>}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
        {signup ? (wanted ? <>Claim <b className="ac-mono text-[13.5px] font-medium text-[var(--text)]">posy.page/{wanted}</b> in a minute.</> : 'Free, and it takes a minute.') : 'Pick up where you left off.'}
      </p>
      {(providers.github || providers.google) && (
        <div className="mt-6 grid gap-2.5">
          {providers.github && <Social provider="github" label="Continue with GitHub" path={siGithub.path} next={next} />}
          {providers.google && <Social provider="google" label="Continue with Google" path={siGoogle.path} next={next} />}
          <div className="ac-eyebrow my-1.5 flex items-center gap-3"><span className="h-px flex-1 bg-[var(--line)]" />or<span className="h-px flex-1 bg-[var(--line)]" /></div>
        </div>
      )}
      <form onSubmit={submit} className="mt-6 grid gap-4">
        {signup && (
          <div className="grid gap-1.5"><Label htmlFor="name">Name</Label><Input id="name" name="name" autoComplete="name" placeholder="Ada Lovelace" className="ac-input" /></div>
        )}
        <div className="grid gap-1.5"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="ac-input" /></div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input id="password" name="password" type={show ? 'text' : 'password'} required minLength={8} autoComplete={signup ? 'new-password' : 'current-password'} placeholder={signup ? 'At least 8 characters' : ''} className="ac-input pr-11" aria-describedby={error ? 'auth-error' : undefined} />
            <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}
              className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-[var(--muted)] outline-none transition-colors hover:bg-[var(--ac-lilac-bg)] hover:text-[var(--ac-deep)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        {error && <p id="auth-error" role="alert" className="flex items-start gap-2 rounded-xl bg-[var(--ac-rose-bg)] px-3.5 py-2.5 text-[14px] text-[#a43f5c]"><TriangleAlert className="mt-0.5 size-4 shrink-0" />{error}</p>}
        <Button type="submit" disabled={busy} className="ac-btn ac-btn-primary mt-1 h-12 text-[15px]">
          {busy && <Loader2 className="size-4 animate-spin" />}{signup ? 'Create account' : 'Log in'}
        </Button>
      </form>
      <p className="mt-6 text-center text-[14px] text-[var(--muted)]">
        {signup ? <>Already have a page? <Link href="/login" className="font-medium text-[var(--ac-deep)] underline-offset-4 hover:underline">Log in</Link></>
          : <>New here? <Link href={`/signup${wanted ? `?username=${wanted}` : ''}`} className="font-medium text-[var(--ac-deep)] underline-offset-4 hover:underline">Make your page</Link></>}
      </p>
    </div>
  );
}
