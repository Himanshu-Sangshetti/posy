'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Download, Loader2, Upload, X } from 'lucide-react';
import { exportFile, readImport } from '@/lib/portable';
import { authClient } from '@/lib/auth-client';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const card = 'app-card';
const btn = 'inline-flex h-11 items-center gap-2 rounded-full px-5 text-[14.5px] font-medium disabled:opacity-50';

export function SettingsPanel({ username, email, host }: { username: string; email: string; host: string }) {
  const router = useRouter();
  const [name, setName] = useState(username);
  const [check, setCheck] = useState<{ ok: boolean; reason?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [delError, setDelError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [incoming, setIncoming] = useState<{ file: string; page: Record<string, unknown> } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string[] } | null>(null);

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
    a.href = URL.createObjectURL(new Blob([JSON.stringify(exportFile(d.page, window.location.origin), null, 2)], { type: 'application/json' }));
    a.download = `${username}-posy.json`; a.click();
  }

  async function pickFile(f: File | undefined) {
    if (!f) return;
    setImportMsg(null);
    try { setIncoming({ file: f.name, page: readImport(await f.text()) }); }
    catch (e) { setImportMsg({ ok: false, text: [(e as Error).message] }); }
    if (fileRef.current) fileRef.current.value = '';
  }

  async function importJson() {
    if (!incoming) return;
    setImporting(true);
    const cur = await fetch('/api/v1/page');
    const base = cur.ok ? (await cur.json()).version : undefined;
    const r = await fetch('/api/v1/page', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: incoming.page, baseVersion: base }) });
    const d = await r.json().catch(() => ({}));
    setImporting(false); setIncoming(null);
    if (r.ok) { setImportMsg({ ok: true, text: ['Imported into your draft. Open the editor to review it, then press Publish to make it live.'] }); router.refresh(); return; }
    setImportMsg({ ok: false, text: d.issues ?? [d.error ?? 'Could not import that file.'] });
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
        <h2 className="app-h2">Your address</h2>
        <p className="mt-1 text-[14.5px] text-[#8d8379]">Changing it breaks links you&apos;ve already shared.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="flex h-11 min-w-[280px] flex-1 items-center rounded-full border border-[rgb(45_39_35/.14)] bg-white px-4 text-[15px] focus-within:ring-2 focus-within:ring-[var(--ring)]">
            <span className="text-[#8d8379]">{host}/</span>
            <input aria-label="Username" value={name} onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} className="min-w-0 flex-1 bg-transparent font-medium outline-none" />
            {check?.ok && <Check className="size-4 text-[#2f9e62]" />}
            {check && !check.ok && <span className="flex items-center gap-1 text-[13px] text-[#c2453c]"><X className="size-4" />{check.reason}</span>}
          </label>
          <button type="button" onClick={rename} disabled={!check?.ok || saving} className={`${btn} bg-[#2d2723] text-white`}>{saving && <Loader2 className="size-4 animate-spin" />}Save</button>
        </div>
        {msg && <p className="mt-3 text-[14px]" role="status">{msg}</p>}
      </section>

      <section className={card}>
        <h2 className="app-h2">Own your page</h2>
        <p className="mt-1 max-w-[58ch] text-[14.5px] text-[#8d8379]">Your page is one JSON file. Download it, or import one from another Posy.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={exportJson} className={`${btn} border border-[rgb(45_39_35/.16)] hover:bg-[rgb(45_39_35/.05)]`}><Download className="size-4" />Download page.json</button>
          <button type="button" onClick={() => fileRef.current?.click()} className={`${btn} border border-[rgb(45_39_35/.16)] hover:bg-[rgb(45_39_35/.05)]`}><Upload className="size-4" />Import page.json</button>
          <input ref={fileRef} type="file" accept="application/json,.json" aria-label="Page file" className="hidden" onChange={e => pickFile(e.target.files?.[0])} />
        </div>
        <p className="mt-3 max-w-[58ch] text-[13.5px] text-[#8d8379]">Works between any two Posy instances, self-hosted or posy.page. Photos you uploaded are saved as full links, so they keep loading from the original server.</p>
        {importMsg && (
          <div role="status" className={`mt-3 text-[14px] ${importMsg.ok ? '' : 'text-[#c2453c]'}`}>
            {importMsg.text.slice(0, 6).map(t => <p key={t}>{t}</p>)}
          </div>
        )}
        <Dialog open={!!incoming} onOpenChange={o => !o && setIncoming(null)}>
          <DialogContent className="max-w-[420px] rounded-[22px]">
            <DialogHeader><DialogTitle>Replace your draft?</DialogTitle><DialogDescription>{incoming?.file} has {Array.isArray(incoming?.page.tiles) ? incoming.page.tiles.length : 0} tiles. It replaces your current draft. Your live page stays as it is until you publish.</DialogDescription></DialogHeader>
            <button type="button" onClick={importJson} disabled={importing} className={`${btn} justify-center bg-[#2d2723] text-white`}>{importing && <Loader2 className="size-4 animate-spin" />}Replace draft</button>
          </DialogContent>
        </Dialog>
      </section>

      <section className={card}>
        <h2 className="app-h2">Account</h2>
        <p className="mt-1 text-[14.5px] text-[#8d8379]">Signed in as {email}</p>
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
