'use client';

import { useEffect, useState } from 'react';
import { Copy, ExternalLink, KeyRound, Loader2, ShieldAlert, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CodeBlock } from './CodeBlock';
import { Panel } from './ui';
import { briefPrompt } from '@/lib/brief';

type Key = { id: string; name: string | null; start: string | null; createdAt: Date | string };

const PROMPTS = [
  'Add my GitHub repo owner/name as a wide tile under a "Projects" section.',
  'Switch my page to the lavender theme with an aurora backdrop and glass tiles, then publish.',
  'Add my latest YouTube video and move it to the top.',
  'Rewrite my bio to sound warmer and shorter. Show me before publishing.',
];
const TONES = ['rose', 'lilac', 'mint', 'sky'] as const;
const day = (d: Date | string) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });

export function AgentsPanel({ site, username }: { site: string; username: string }) {
  const [keys, setKeys] = useState<Key[] | null>(null);
  const [name, setName] = useState('My agent');
  const [fresh, setFresh] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [doomed, setDoomed] = useState<Key | null>(null);
  const [revoking, setRevoking] = useState(false);
  const mcp = `${site}/api/mcp`;
  const key = fresh ?? 'posy_YOUR_KEY';
  const cursorLink = `cursor://anysphere.cursor-deeplink/mcp/install?name=posy&config=${typeof btoa === 'function' ? btoa(JSON.stringify({ url: mcp })) : ''}`;
  const vscodeLink = `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name: 'posy', type: 'http', url: mcp }))}`;

  const load = async () => {
    const r = await authClient.apiKey.list();
    const list = (Array.isArray(r.data) ? r.data : (r.data as { apiKeys?: Key[] } | null)?.apiKeys) ?? [];
    setKeys(list as Key[]);
  };
  useEffect(() => { load(); }, []);

  async function create() {
    setBusy(true);
    const r = await authClient.apiKey.create({ name: name.trim() || 'Agent' });
    setBusy(false);
    if (r.data?.key) { setFresh(r.data.key); toast.success('Key created', { description: 'Copy it now. It will not be shown again.' }); load(); }
    else toast.error(r.error?.message ?? 'Could not create a key');
  }
  async function revoke() {
    if (!doomed) return;
    setRevoking(true);
    await authClient.apiKey.delete({ keyId: doomed.id });
    setRevoking(false);
    toast.success(`Revoked ${doomed.name ?? 'key'}`);
    setDoomed(null);
    load();
  }
  const copy = async (text: string, msg: string) => { await navigator.clipboard.writeText(text); toast.success(msg); };

  return (
    <div className="grid gap-5">
      <Panel eyebrow="Connect" tone="lilac" title={<>Connect your <i>AI</i></>} desc="Sign in to Posy from your AI app. There is nothing to install and no key to copy.">
        <Tabs defaultValue="claude">
          <TabsList className="ac-seg !h-auto flex-wrap">
            {[['claude', 'Claude'], ['chatgpt', 'ChatGPT'], ['cursor', 'Cursor'], ['vscode', 'VS Code'], ['code', 'Claude Code'], ['codex', 'Codex']].map(([v, l]) => (
              <TabsTrigger key={v} value={v} className="!h-[34px] flex-none rounded-full px-3.5 text-[14px] shadow-none">{l}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="claude" className="mt-4 grid gap-3">
            <p className="text-[14.5px] leading-relaxed text-[var(--muted)]">In claude.ai or the Claude app: <b className="font-medium text-[var(--text)]">Settings → Connectors → Add custom connector</b>. Name it Posy, paste the address, and sign in when it asks.</p>
            <CodeBlock label="Connector address" code={mcp} />
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => copy(mcp, 'Address copied')} className="ac-btn ac-btn-primary"><Copy className="size-4" />Copy address</Button>
              <Button asChild variant="outline" className="ac-btn ac-btn-soft"><a href="https://claude.ai/settings/connectors" target="_blank" rel="noopener"><ExternalLink className="size-4" />Open Claude connectors</a></Button>
            </div>
          </TabsContent>
          <TabsContent value="chatgpt" className="mt-4 grid gap-3">
            <p className="text-[14.5px] leading-relaxed text-[var(--muted)]">In ChatGPT: <b className="font-medium text-[var(--text)]">Settings → Apps &amp; Connectors → Advanced → Developer mode</b>, then <b className="font-medium text-[var(--text)]">Create</b>. Paste the address, choose OAuth, and sign in.</p>
            <CodeBlock label="Connector address" code={mcp} />
            <div className="flex flex-wrap gap-2"><Button type="button" onClick={() => copy(mcp, 'Address copied')} className="ac-btn ac-btn-primary"><Copy className="size-4" />Copy address</Button></div>
          </TabsContent>
          <TabsContent value="cursor" className="mt-4 grid gap-3">
            <p className="text-[14.5px] leading-relaxed text-[var(--muted)]">One click adds Posy to Cursor. It opens a Posy sign-in the first time you use it.</p>
            <div className="flex flex-wrap gap-2"><Button asChild className="ac-btn ac-btn-primary"><a href={cursorLink}>Add to Cursor</a></Button></div>
          </TabsContent>
          <TabsContent value="vscode" className="mt-4 grid gap-3">
            <CodeBlock label="Terminal" code={`code --add-mcp '${JSON.stringify({ name: 'posy', type: 'http', url: mcp })}'`} />
            <div className="flex flex-wrap gap-2"><Button asChild variant="outline" className="ac-btn ac-btn-soft"><a href={vscodeLink}>Install in VS Code</a></Button></div>
          </TabsContent>
          <TabsContent value="code" className="mt-4 grid gap-3">
            <CodeBlock label="Terminal" code={`claude mcp add --transport http posy ${mcp}`} />
            <p className="text-[14.5px] leading-relaxed text-[var(--muted)]">Then run <code className="ac-mono">/mcp</code> in Claude Code and choose <b className="font-medium text-[var(--text)]">Authenticate</b>.</p>
          </TabsContent>
          <TabsContent value="codex" className="mt-4"><CodeBlock label="Terminal" code={`codex mcp add posy --url ${mcp}`} /></TabsContent>
        </Tabs>
      </Panel>

      <Panel eyebrow="Any chat" tone="mint" title={<>No connector? Use a <i>file</i></>} desc="Ask ChatGPT, Gemini or any chat to write your page as a small JSON file, then load it here.">
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => copy(briefPrompt(site), 'Prompt copied. Paste it into your chat.')} className="ac-btn ac-btn-primary"><Copy className="size-4" />Copy a prompt for your chat</Button>
          <Button asChild variant="outline" className="ac-btn ac-btn-soft"><a href="/new">Load a page file</a></Button>
          <Button asChild variant="ghost" className="ac-btn"><a href="/docs/format" target="_blank" rel="noopener">How the file works</a></Button>
        </div>
      </Panel>

      <Panel eyebrow="Try it" tone="rose" title={<>Ask for what you <i>want</i></>} desc="Click a prompt to copy it, then paste it into your agent.">
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {PROMPTS.map((p, i) => (
            <li key={p}>
              <button type="button" onClick={() => copy(p, 'Prompt copied')} className={`ac-tone-${TONES[i % 4]} group h-full w-full rounded-2xl p-4 text-left text-[14.5px] leading-snug outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[var(--ring)]`}>
                <span className="ac-mono mb-2 flex items-center justify-between text-[10.5px] uppercase tracking-[.08em] opacity-70">Prompt {i + 1}<Copy className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" /></span>
                &ldquo;{p}&rdquo;
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-[14px] leading-relaxed text-[var(--muted)]">
          Edits land in your draft and show up in the editor live. Your agent publishes only when you ask. Anyone&apos;s agent can read your published page at{' '}
          <a className="ac-mono text-[12.5px] text-[var(--ac-deep)] underline underline-offset-4" href={`${site}/${username}/llms.txt`} target="_blank" rel="noopener">/{username}/llms.txt</a> and{' '}
          <a className="ac-mono text-[12.5px] text-[var(--ac-deep)] underline underline-offset-4" href={`${site}/api/v1/public/${username}`} target="_blank" rel="noopener">JSON</a>.
        </p>
      </Panel>

      <Panel eyebrow="Advanced" tone="butter" title={<>API <i>keys</i></>} desc="For scripts and tools that cannot sign in with a browser. A key lets them edit your page. You can revoke it any time.">
        <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); create(); }}>
          <Input aria-label="Key name" value={name} onChange={e => setName(e.target.value)} className="ac-input max-w-[280px]" />
          <Button type="submit" disabled={busy} className="ac-btn ac-btn-primary">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}Create key
          </Button>
        </form>
        {fresh && (
          <div className="ac-rise mt-4 grid gap-2 rounded-2xl border border-[#e3d7a6] bg-[var(--ac-butter-bg)] p-4">
            <p className="flex items-center gap-2 text-[14px] font-medium text-[#7a5b0c]"><ShieldAlert className="size-4" />Copy it now. It won&apos;t be shown again.</p>
            <div className="flex items-center gap-2 rounded-xl bg-[var(--surface)] p-1.5 pl-3.5">
              <code className="ac-mono min-w-0 flex-1 truncate text-[13px]">{fresh}</code>
              <Button type="button" size="sm" onClick={() => copy(fresh, 'Key copied')} className="ac-btn ac-btn-primary ac-btn-sm"><Copy className="size-3.5" />Copy</Button>
            </div>
          </div>
        )}
        <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--line)]">
          <Table className="ac-table">
            <TableHeader><TableRow className="bg-[var(--secondary)]/60 hover:bg-transparent"><TableHead className="pl-4">Name</TableHead><TableHead>Key</TableHead><TableHead className="hidden sm:table-cell">Created</TableHead><TableHead className="pr-4 text-right"><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
            <TableBody>
              {keys === null && [0, 1].map(i => <TableRow key={i}><TableCell colSpan={4} className="px-4"><Skeleton className="h-5 w-full bg-[var(--ac-lilac-bg)]" /></TableCell></TableRow>)}
              {keys?.length === 0 && <TableRow className="hover:bg-transparent"><TableCell colSpan={4} className="px-4 py-8 text-center text-[14px] text-[var(--muted)]">No keys yet. Create one above and it will show up here.</TableCell></TableRow>}
              {keys?.map(k => (
                <TableRow key={k.id}>
                  <TableCell className="pl-4 font-medium">{k.name ?? 'Key'}</TableCell>
                  <TableCell className="ac-mono text-[13px] text-[var(--muted)]">{k.start}…</TableCell>
                  <TableCell className="hidden text-[13.5px] text-[var(--muted)] sm:table-cell">{day(k.createdAt)}</TableCell>
                  <TableCell className="pr-3 text-right">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setDoomed(k)} aria-label={`Revoke ${k.name}`} className="rounded-full text-[var(--muted)] hover:bg-[var(--ac-rose-bg)] hover:text-[#a43f5c]"><Trash2 className="size-4" />Revoke</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Tabs defaultValue="claude" className="mt-6">
          <TabsList className="ac-seg !h-auto flex-wrap">
            {[['claude', 'Claude Code'], ['cursor', 'Cursor'], ['codex', 'Codex'], ['other', 'Other apps'], ['rest', 'REST']].map(([v, l]) => (
              <TabsTrigger key={v} value={v} className="!h-[34px] flex-none rounded-full px-3.5 text-[14px] shadow-none">{l}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="claude" className="mt-4"><CodeBlock label="Terminal" code={`claude mcp add --transport http posy ${mcp} \\\n  --header "Authorization: Bearer ${key}"`} /></TabsContent>
          <TabsContent value="cursor" className="mt-4"><CodeBlock label="~/.cursor/mcp.json" code={JSON.stringify({ mcpServers: { posy: { url: mcp, headers: { Authorization: `Bearer ${key}` } } } }, null, 2)} /></TabsContent>
          <TabsContent value="codex" className="mt-4 grid gap-3">
            <CodeBlock label="~/.codex/config.toml" code={`[mcp_servers.posy]\nurl = "${mcp}"\nbearer_token_env_var = "POSY_API_KEY"`} />
            <CodeBlock label="Shell" code={`export POSY_API_KEY=${key}`} />
          </TabsContent>
          <TabsContent value="other" className="mt-4"><CodeBlock label="Any MCP client (stdio bridge)" code={`npx -y mcp-remote ${mcp} --header "Authorization: Bearer ${key}"`} /></TabsContent>
          <TabsContent value="rest" className="mt-4 grid gap-3">
            <CodeBlock label="Add a tile" code={`curl -X POST ${site}/api/v1/page/tiles \\\n  -H "Authorization: Bearer ${key}" -H "Content-Type: application/json" \\\n  -d '{"input": "https://github.com/owner/repo"}'`} />
            <CodeBlock label="Publish" code={`curl -X POST ${site}/api/v1/page/publish -H "Authorization: Bearer ${key}"`} />
          </TabsContent>
        </Tabs>
      </Panel>

      <Dialog open={!!doomed} onOpenChange={o => !o && setDoomed(null)}>
        <DialogContent className="max-w-[420px] rounded-3xl border-[var(--line)]">
          <DialogHeader><DialogTitle className="ac-display text-[24px]">Revoke this key?</DialogTitle><DialogDescription>Any agent using &ldquo;{doomed?.name ?? 'this key'}&rdquo; loses access straight away.</DialogDescription></DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setDoomed(null)} className="ac-btn ac-btn-soft">Cancel</Button>
            <Button type="button" onClick={revoke} disabled={revoking} className="ac-btn bg-[var(--destructive)] text-white hover:bg-[#a63a4b]">{revoking && <Loader2 className="size-4 animate-spin" />}Revoke key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
