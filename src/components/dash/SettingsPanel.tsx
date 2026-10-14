'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Download, FileJson, Loader2, TriangleAlert, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { exportFile, readImport } from '@/lib/portable';
import { authClient } from '@/lib/auth-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Panel } from './ui';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';


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
    const ok = r.ok; const text = ok ? 'Saved. Your page moved to the new address.' : (await r.json()).error;
    setMsg(text); ok ? toast.success('Address saved') : toast.error(text);
    if (ok) router.refresh();
  }

  async function exportJson() {
    const d = await (await fetch('/api/v1/page')).json();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(exportFile(d.page, window.location.origin), null, 2)], { type: 'application/json' }));
    a.download = `${username}-posy.json`; a.click();
    toast.success('Downloaded page.json');
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
    if (r.ok) { toast.success('Imported into your draft'); setImportMsg({ ok: true, text: ['Imported into your draft. Open the editor to review it, then press Publish to make it live.'] }); router.refresh(); return; }
    setImportMsg({ ok: false, text: d.issues ?? [d.error ?? 'Could not import that file.'] });
  }

  async function remove() {
    setDeleting(true); setDelError('');
    const r = await authClient.deleteUser({ password });
    if (r.error) { setDelError(r.error.message ?? 'Could not delete'); setDeleting(false); return; }
    window.location.href = '/';
  }

  const ghost = 'ac-btn ac-btn-soft';
  return (
    <div className="grid gap-5">
      <Panel eyebrow="Profile" tone="lilac" title={<>Your <i>address</i></>} desc="Changing it breaks links you've already shared.">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="flex h-11 min-w-[260px] flex-1 items-center rounded-xl border border-[var(--input)] bg-[var(--surface)] px-3.5 text-[15px] transition-shadow focus-within:border-[var(--ac-deep)] focus-within:shadow-[0_0_0_4px_rgb(169_139_224/.22)]">
            <span className="ac-mono text-[13.5px] text-[var(--muted)]">{host}/</span>
            <input aria-label="Username" value={name} onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} className="min-w-0 flex-1 bg-transparent font-medium outline-none" />
            {check?.ok && <span className="ac-pill ac-tone-mint !normal-case !tracking-normal"><Check className="size-3.5" />Free</span>}
            {check && !check.ok && <span className="ac-pill ac-tone-rose !normal-case !tracking-normal"><X className="size-3.5" />{check.reason}</span>}
          </label>
          <Button type="button" onClick={rename} disabled={!check?.ok || saving} className="ac-btn ac-btn-primary">{saving && <Loader2 className="size-4 animate-spin" />}Save</Button>
        </div>
        {msg && <p className="mt-3 text-[14px] text-[var(--muted)]" role="status">{msg}</p>}
      </Panel>

      <Panel eyebrow="Portability" tone="mint" title={<>Own your <i>page</i></>} desc="Your page is one JSON file. Download it, or import one from another Posy.">
        <div className="flex flex-wrap gap-2.5">
          <Button type="button" variant="outline" onClick={exportJson} className={ghost}><Download className="size-4" />Download page.json</Button>
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className={ghost}><Upload className="size-4" />Import page.json</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" aria-label="Page file" className="hidden" onChange={e => pickFile(e.target.files?.[0])} />
        </div>
        <p className="mt-4 flex max-w-[62ch] gap-2.5 text-[13.5px] leading-relaxed text-[var(--muted)]"><FileJson className="mt-0.5 size-4 shrink-0" />Works between any two Posy instances, self-hosted or posy.page. Photos you uploaded are saved as full links, so they keep loading from the original server.</p>
        {importMsg && (
          <div role="status" className={`mt-4 rounded-xl px-4 py-3 text-[14px] ${importMsg.ok ? 'ac-tone-mint' : 'ac-tone-rose'}`}>
            {importMsg.text.slice(0, 6).map(t => <p key={t}>{t}</p>)}
          </div>
        )}
        <Dialog open={!!incoming} onOpenChange={o => !o && setIncoming(null)}>
          <DialogContent className="max-w-[420px] rounded-3xl border-[var(--line)]">
            <DialogHeader><DialogTitle className="ac-display text-[24px]">Replace your draft?</DialogTitle><DialogDescription>{incoming?.file} has {Array.isArray(incoming?.page.tiles) ? incoming.page.tiles.length : 0} tiles. It replaces your current draft. Your live page stays as it is until you publish.</DialogDescription></DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => setIncoming(null)} className={ghost}>Cancel</Button>
              <Button type="button" onClick={importJson} disabled={importing} className="ac-btn ac-btn-primary">{importing && <Loader2 className="size-4 animate-spin" />}Replace draft</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Panel>

      <Panel eyebrow="Careful" tone="rose" title={<>Danger <i>zone</i></>} desc={<>Signed in as <b className="font-medium text-[var(--text)]">{email}</b></>} className="border-[#f1d3db]">
        <Dialog>
          <DialogTrigger asChild><Button type="button" variant="outline" className="ac-btn ac-btn-danger">Delete account</Button></DialogTrigger>
          <DialogContent className="max-w-[420px] rounded-3xl border-[var(--line)]">
            <DialogHeader>
              <span className="mb-1 grid size-11 place-items-center rounded-full bg-[var(--ac-rose-bg)] text-[#a43f5c]"><TriangleAlert className="size-5" /></span>
              <DialogTitle className="ac-display text-[24px]">Delete your account?</DialogTitle>
              <DialogDescription>Your page, analytics and keys are removed for good. {host}/{username} becomes free for anyone.</DialogDescription>
            </DialogHeader>
            <Input type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} className="ac-input" />
            {delError && <p role="alert" className="text-[14px] text-[#a43f5c]">{delError}</p>}
            <Button type="button" onClick={remove} disabled={!password || deleting} className="ac-btn w-full bg-[var(--destructive)] text-white hover:bg-[#a63a4b]">{deleting && <Loader2 className="size-4 animate-spin" />}Delete forever</Button>
          </DialogContent>
        </Dialog>
      </Panel>
    </div>
  );
}
