'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

/** "Allow <app> to edit your Posy page?" The OAuth flow resumes from here once the user answers. */
export function ConsentForm({ app, email }: { app: { name: string; host: string }; email: string }) {
  const [busy, setBusy] = useState<'allow' | 'deny' | null>(null);
  const [error, setError] = useState('');

  async function answer(accept: boolean) {
    setBusy(accept ? 'allow' : 'deny'); setError('');
    const res = await authClient.oauth2.consent({ accept });
    const url = (res.data as { redirect_uri?: string; url?: string } | null)?.redirect_uri ?? (res.data as { url?: string } | null)?.url;
    if (res.error || !url) { setError(res.error?.message ?? 'Something went wrong. Try connecting again from the app.'); setBusy(null); return; }
    window.location.href = url;
  }

  return (
    <>
      <h1 className="au-title">Allow <i>{app.name}</i>?</h1>
      <p className="au-lede">
        {app.name}{app.host ? <> ({app.host})</> : null} wants to read and edit your Posy page as <b className="font-medium text-[var(--text)]">{email}</b>.
        It can add and change tiles and your theme, and publish. It can’t see your password or delete your account.
      </p>
      {error && <p role="alert" className="mt-4 rounded-xl bg-[var(--ac-rose-bg)] px-3.5 py-2.5 text-[14px] text-[#a43f5c]">{error}</p>}
      <div className="mt-7 grid gap-2.5">
        <Button type="button" disabled={!!busy} onClick={() => answer(true)} className="ac-btn ac-btn-primary h-12 text-[15px]">
          {busy === 'allow' && <Loader2 className="size-4 animate-spin" />}Allow
        </Button>
        <Button type="button" variant="outline" disabled={!!busy} onClick={() => answer(false)} className="au-social">Cancel</Button>
      </div>
    </>
  );
}
