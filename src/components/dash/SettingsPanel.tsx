'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Download, Loader2, X } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const card = 'rounded-[24px] border border-[color-mix(in_oklab,#fff_55%,transparent)] bg-[color-mix(in_oklab,var(--surface)_78%,transparent)] p-5 shadow-[0_20px_50px_-34px_rgb(0_0_0/.35)] backdrop-blur-xl sm:p-7';
const btn = 'inline-flex h-11 items-center gap-2 rounded-[12px] px-4 text-[14.5px] font-medium disabled:opacity-50';

export function SettingsPanel({ username, email, host }: { username: string; email: string; host: string }) {
  const router = useRouter();
  const [name, setName] = useState(username);
  const [check, setCheck] = useState<{ ok: boolean; reason?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [delError, setDelError] = useState('');

  useEffect(() => {
    if (name === username || !name) { setCheck(null); return; }
    const t = setTimeout(async () => setCheck(await (await fetch(`/api/v1/username?check=${encodeURIComponent(name)}`)).json()), 280);
    return () => clearTimeout(t);
  }, [name, username]);

  async function rename() {
    setSaving(true); setMsg('');
    const r = await fetch('/api/v1/username', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: name }) });
    setSaving(false);
    setMsg(r.ok ? 'Saved. Your page moved to the new address.' : (await r.json()).error);
    if (r.ok) router.refresh();
  }

  async function exportJson() {
    const d = await (await fetch('/api/v1/page')).json();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ $schema: 'https://posy.page/schema/page.schema.json', ...d.page }, null, 2)], { type: 'application/json' }));
    a.download = `${username}-posy.json`; a.click();
  }

  async function remove() {
    setDeleting(true); setDelError('');
    const r = await authClient.deleteUser({ password });
    if (r.error) { setDelError(r.error.message ?? 'Could not delete'); setDeleting(false); return; }
    window.location.href = '/';
  }

  return (
    <div className="grid gap-5">
      <section className={card}>
        <h2 className="text-[18px] font-semibold">Your address</h2>
        <p className="mt-1 text-[14.5px] text-[var(--muted)]">Changing it breaks links you&apos;ve already shared.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="flex h-11 min-w-[280px] flex-1 items-center rounded-[12px] border border-[var(--line)] bg-[var(--surface)] px-3.5 text-[15px] focus-within:ring-2 focus-within:ring-[var(--ring)]">
            <span className="text-[var(--muted)]">{host}/</span>
            <input aria-label="Username" value={name} onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} className="min-w-0 flex-1 bg-transparent font-medium outline-none" />
            {check?.ok && <Check className="size-4 text-[#2f9e62]" />}
            {check && !check.ok && <span className="flex items-center gap-1 text-[13px] text-[#c2453c]"><X className="size-4" />{check.reason}</span>}
          </label>
          <button type="button" onClick={rename} disabled={!check?.ok || saving} className={`${btn} bg-[var(--text)] text-[var(--surface)]`}>{saving && <Loader2 className="size-4 animate-spin" />}Save</button>
        </div>
        {msg && <p className="mt-3 text-[14px]" role="status">{msg}</p>}
      </section>

      <section className={card}>
        <h2 className="text-[18px] font-semibold">Own your page</h2>
        <p className="mt-1 max-w-[58ch] text-[14.5px] text-[var(--muted)]">Download your page as one JSON file. Posy is open source, so you can host it yourself any time.</p>
        <button type="button" onClick={exportJson} className={`${btn} mt-4 border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--secondary)]`}><Download className="size-4" />Download page.json</button>
      </section>

      <section className={card}>
        <h2 className="text-[18px] font-semibold">Account</h2>
        <p className="mt-1 text-[14.5px] text-[var(--muted)]">Signed in as {email}</p>
        <Dialog>
          <DialogTrigger asChild><button type="button" className={`${btn} mt-4 border border-[#e7c3bf] text-[#c2453c] hover:bg-[#fbecea]`}>Delete account</button></DialogTrigger>
          <DialogContent className="max-w-[420px] rounded-[22px]">
            <DialogHeader><DialogTitle>Delete your account?</DialogTitle><DialogDescription>Your page, analytics and keys are removed for good. {host}/{username} becomes free for anyone.</DialogDescription></DialogHeader>
            <Input type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} className="h-11" />
            {delError && <p className="text-[14px] text-[#c2453c]">{delError}</p>}
            <button type="button" onClick={remove} disabled={!password || deleting} className={`${btn} justify-center bg-[#c2453c] text-white`}>{deleting && <Loader2 className="size-4 animate-spin" />}Delete forever</button>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}
