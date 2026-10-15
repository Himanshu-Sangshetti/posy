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
import { PaintedScene } from '@/components/art/PaintedScene';
import { launchKite } from '@/components/studio/kite-launch';
import { LivePreview } from './LivePreview';

type Mode = 'login' | 'signup';

function Social({ provider, label, path, next, ready = true }: { provider: 'github' | 'google'; label: string; path: string; next: string; ready?: boolean }) {
  return (
    <Button type="button" variant="outline" onClick={() => (ready ? signIn.social({ provider, callbackURL: next }) : toast('Google sign-in is almost here', { description: 'It switches on once the server has its Google keys (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET).' }))} className="au-social">
      <svg viewBox="0 0 24 24" className="!size-[18px]" fill="currentColor" aria-hidden><path d={path} /></svg>{label}
    </Button>
  );
}

export function AuthForm({ mode, providers, host }: { mode: Mode; providers: { github: boolean; google: boolean; googleReady?: boolean }; host: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const wanted = params.get('username') ?? '';
  // the look someone picked on the landing page carries through to onboarding
  const carry = new URLSearchParams();
  if (wanted) carry.set('username', wanted);
  if (params.get('look')) carry.set('look', params.get('look')!);
  // Arrived from an AI app's connect flow: Better Auth sends the browser back to it after sign-in, so don't go to /edit.
  const oauth = params.has('sig');
  // A page file was loaded on /new: finish creating it there instead of going through onboarding.
  const draft = params.get('draft') === '1';
  const next = draft ? `/new?finish=1${wanted ? `&username=${encodeURIComponent(wanted)}` : ''}` : mode === 'signup' ? `/onboarding${carry.size ? `?${carry}` : ''}` : '/edit';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [typing, setTyping] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError('');
    const form = e.currentTarget;
    const f = new FormData(form);
    const email = String(f.get('email')), password = String(f.get('password'));
    const res = mode === 'signup'
      ? await signUp.email({ email, password, name: String(f.get('name') || email.split('@')[0]) })
      : await signIn.email({ email, password });
    if (res.error) { const m = res.error.message ?? 'Something went wrong'; setError(m); toast.error(m); setBusy(false); return; }
    launchKite(form.querySelector('button[type=submit]'));
    await new Promise(r => setTimeout(r, 900));
    if (oauth) return; // the OAuth redirect is already on its way
    router.push(next);
    router.refresh();
  }

  const signup = mode === 'signup';
  return (
    <main className={`au-main au-${mode}`}>
      <div className="au-side">
        <div className="au-card ac-rise">
          <h1 className="au-title">{signup ? <>Make your <i>page</i></> : <>Welcome <i>back</i></>}</h1>
          <p className="au-lede">
            {signup ? (wanted ? <>Claim <b className="ac-mono text-[14px] font-medium text-[var(--text)]">{host}/{wanted}</b>. It takes about a minute.</> : 'Free, open source, and it takes about a minute.') : 'Your page is right where you left it.'}
          </p>
      {(providers.github || providers.google) && (
        <div className="mt-6 grid gap-2.5">
          {providers.google && <Social provider="google" label="Continue with Google" path={siGoogle.path} next={next} ready={providers.googleReady ?? true} />}
          {providers.github && <Social provider="github" label="Continue with GitHub" path={siGithub.path} next={next} />}
          <div className="au-or"><span />or with email<span /></div>
        </div>
      )}
      <form onSubmit={submit} className="mt-6 grid gap-4" onFocus={() => setTyping(true)} onBlur={() => setTyping(false)}>
        {signup && (
          <div className="grid gap-1.5"><Label htmlFor="name">Name</Label><Input id="name" name="name" autoComplete="name" placeholder="Mira Sol" className="ac-input" value={name} onChange={e => setName(e.target.value)} /></div>
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
        {signup ? <>Already have a page? <Link href={oauth ? `/login?${params}` : '/login'} className="font-medium text-[var(--ac-deep)] underline-offset-4 hover:underline">Log in</Link></>
          : <>New here? <Link href={oauth ? `/signup?${params}` : `/signup${wanted ? `?username=${wanted}` : ''}`} className="font-medium text-[var(--ac-deep)] underline-offset-4 hover:underline">Make your page</Link></>}
      </p>
        </div>
      </div>
      <figure className="au-frame">
        <PaintedScene scene={signup ? 'signup' : 'login'} className={typing ? 'is-typing' : undefined} />
        {signup && <LivePreview name={name} username={wanted} host={host} />}
        <figcaption>{signup ? 'Good morning. Let’s make something.' : 'Still up? Your page kept the light on.'}</figcaption>
      </figure>
    </main>
  );
}
