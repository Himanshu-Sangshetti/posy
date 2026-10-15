'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Copy, Loader2, TriangleAlert, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { PageView } from '@/components/page/PageView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BriefError, briefPrompt, briefToPage, decodeBrief, extractJson, type BriefResult } from '@/lib/brief';

const KEY = 'posy:brief';

/** Paste or upload a Posy page file, preview it, and make it yours. Also finishes the job after sign-up (?finish=1). */
export function NewFromFile({ signedIn, hasPage, site }: { signedIn: boolean; hasPage: boolean; site: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const finish = params.get('finish') === '1';
  const [text, setText] = useState('');
  const [username, setUsername] = useState(params.get('username') ?? '');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [serverError, setServerError] = useState('');
  const file = useRef<HTMLInputElement>(null);

  // /new#p=<encoded brief> (a link a chat can hand out), or the draft saved before sign-up
  useEffect(() => {
    try {
      const h = window.location.hash.match(/^#p=(.+)$/);
      if (h) { setText(JSON.stringify(decodeBrief(h[1]), null, 2)); return; }
      const saved = localStorage.getItem(KEY);
      if (saved && (finish || signedIn)) setText(saved);
    } catch { /* a bad link just starts empty */ }
  }, [finish, signedIn]);

  const read = useMemo((): { ok: true; r: BriefResult } | { ok: false; error: string } | null => {
    if (!text.trim()) return null;
    try { return { ok: true, r: briefToPage(extractJson(text)) }; }
    catch (e) { return { ok: false, error: e instanceof BriefError ? e.message : (e as Error).message }; }
  }, [text]);
  const parsed = read?.ok ? read.r : null;

  useEffect(() => { if (parsed?.username && !username) setUsername(parsed.username); }, [parsed, username]);

  const host = site.replace(/^https?:\/\//, '');
  async function copyPrompt() {
    await navigator.clipboard.writeText(briefPrompt(site));
    setCopied(true); toast.success('Copied. Paste it into ChatGPT, Claude or Gemini.');
    setTimeout(() => setCopied(false), 2000);
  }

  async function load(f: File | undefined) { if (f) setText(await f.text()); }

  async function claim() {
    if (!parsed) return;
    setServerError('');
    try { localStorage.setItem(KEY, text); } catch { /* private mode: they can paste again */ }
    if (!signedIn) { router.push(`/signup?draft=1${username ? `&username=${encodeURIComponent(username)}` : ''}`); return; }
    setBusy(true);
    const res = await fetch('/api/v1/page/import', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ file: text, username: username || undefined, replace: hasPage }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setServerError(data.error ?? 'That did not work. Try again.'); return; }
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    router.push('/edit'); router.refresh();
  }

  const needsName = signedIn && !hasPage;
  return (
    <main className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 pb-20 pt-28 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-14">
      <section className="ac-rise">
        <h1 className="ac-display text-[44px] leading-[1.02] sm:text-[56px]">{finish ? <>Almost <i>there</i></> : <>Make a page from a <i>file</i></>}</h1>
        <p className="ac-lede mt-4">
          {finish ? 'You’re signed in. Pick an address and your page is ready.' : 'Ask any chat to write it, then paste the result. Nothing is saved until you say so.'}
        </p>

        {!finish && (
          <div className="mt-7 flex flex-wrap gap-2.5">
            <Button type="button" onClick={copyPrompt} className="ac-btn ac-btn-primary">{copied ? <Check className="size-4" /> : <Copy className="size-4" />}Copy a prompt for your chat</Button>
            <Button type="button" variant="outline" onClick={() => file.current?.click()} className="ac-btn ac-btn-soft"><Upload className="size-4" />Upload a file</Button>
            <input ref={file} type="file" accept=".json,application/json,text/plain" hidden onChange={e => load(e.target.files?.[0])} />
          </div>
        )}

        <div className="mt-6 grid gap-1.5">
          <Label htmlFor="brief">{finish ? 'Your page file' : 'Paste the chat’s reply here'}</Label>
          <textarea id="brief" value={text} onChange={e => setText(e.target.value)} spellCheck={false} rows={finish ? 5 : 12}
            placeholder={'{ "name": "Mira Sol", "links": ["https://github.com/mira"] }'}
            className="ac-input !h-auto min-h-40 w-full resize-y !py-3 font-mono !text-[13px] leading-relaxed" />
        </div>

        {read && !read.ok && (
          <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--ac-rose-bg)] px-3.5 py-2.5 text-[14px] text-[#a43f5c]"><TriangleAlert className="mt-0.5 size-4 shrink-0" />{read.error}</p>
        )}
        {parsed && parsed.warnings.length > 0 && (
          <ul className="mt-3 grid gap-1 rounded-xl bg-[var(--surface)] px-3.5 py-2.5 text-[13.5px] text-[var(--muted)]">{parsed.warnings.map(w => <li key={w}>{w}</li>)}</ul>
        )}

        {parsed && (
          <div className="mt-6 grid gap-4">
            {(needsName || !signedIn) && (
              <div className="grid gap-1.5">
                <Label htmlFor="username">Your address</Label>
                <div className="flex items-center gap-2"><span className="ac-mono text-[14px] text-[var(--muted)]">{host}/</span>
                  <Input id="username" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} placeholder="yourname" className="ac-input" /></div>
              </div>
            )}
            {serverError && <p role="alert" className="text-[14px] text-[#a43f5c]">{serverError}</p>}
            <Button type="button" disabled={busy || (needsName && !username)} onClick={claim} className="ac-btn ac-btn-primary h-12 text-[15px]">
              {busy && <Loader2 className="size-4 animate-spin" />}
              {!signedIn ? 'Make it mine' : hasPage ? 'Replace my draft with this' : 'Create my page'}
            </Button>
            {!signedIn && <p className="text-center text-[14px] text-[var(--muted)]">Free. You’ll sign up, then this page is waiting. Already have an account? <Link href="/login" className="font-medium text-[var(--ac-deep)] underline-offset-4 hover:underline">Log in</Link></p>}
            {hasPage && <p className="text-[13.5px] text-[var(--muted)]">Your current draft is replaced. Your published page stays as it is until you publish.</p>}
          </div>
        )}
      </section>

      <section aria-label="Preview" className="min-w-0">
        {parsed ? (
          <div className="overflow-hidden rounded-[22px] border border-[var(--input)] shadow-[0_30px_60px_-30px_rgb(22_20_15/.35)]">
            <div className="relative isolate h-[min(760px,80svh)] overflow-y-auto [transform:translateZ(0)]"><div className="relative min-h-full"><PageView page={parsed.page} contained /></div></div>
          </div>
        ) : (
          <div className="grid h-full min-h-72 place-items-center rounded-[22px] border border-dashed border-[var(--input)] p-8 text-center text-[var(--muted)]">
            <p className="max-w-[28ch] text-[15px]">Your page shows up here as soon as there is something to read.</p>
          </div>
        )}
      </section>
    </main>
  );
}
