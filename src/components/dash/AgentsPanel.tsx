'use client';

import { useEffect, useState } from 'react';
import { KeyRound, Loader2, Trash2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeBlock } from './CodeBlock';

type Key = { id: string; name: string | null; start: string | null; createdAt: Date | string };
const card = 'app-card';

const PROMPTS = [
  'Add my GitHub repo owner/name as a wide tile under a "Projects" section.',
  'Switch my page to the lavender theme with an aurora backdrop and glass tiles, then publish.',
  'Add my latest YouTube video and move it to the top.',
  'Rewrite my bio to sound warmer and shorter. Show me before publishing.',
];

export function AgentsPanel({ site, username }: { site: string; username: string }) {
  const [keys, setKeys] = useState<Key[] | null>(null);
  const [name, setName] = useState('My agent');
  const [fresh, setFresh] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mcp = `${site}/api/mcp`;
  const key = fresh ?? 'posy_YOUR_KEY';

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
    if (r.data?.key) { setFresh(r.data.key); load(); }
  }
  async function revoke(id: string) {
    await authClient.apiKey.delete({ keyId: id });
    load();
  }

  return (
    <div className="grid gap-5">
      <section className={card}>
        <h2 className="app-h2"><span className="app-step">1</span>Create a key</h2>
        <p className="mt-1.5 text-[14.5px] text-[#8d8379]">A key lets an agent edit your page. You can revoke it any time.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Input aria-label="Key name" value={name} onChange={e => setName(e.target.value)} className="h-11 max-w-[260px]" />
          <button type="button" onClick={create} disabled={busy} className="app-btn">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}Create key
          </button>
        </div>
        {fresh && (
          <div className="mt-4 grid gap-2">
            <p className="text-[14px] font-medium">Copy it now. It won&apos;t be shown again.</p>
            <CodeBlock code={fresh} />
          </div>
        )}
        {keys && keys.length > 0 && (
          <ul className="mt-5 divide-y divide-[var(--line)] border-t border-[var(--line)]">
            {keys.map(k => (
              <li key={k.id} className="flex items-center justify-between py-3 text-[14px]">
                <span><span className="font-medium">{k.name ?? 'Key'}</span> <span className="ml-2 font-mono text-[13px] text-[#8d8379]">{k.start}…</span></span>
                <button type="button" onClick={() => revoke(k.id)} aria-label={`Revoke ${k.name}`} className="inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[13.5px] text-[#8d8379] hover:bg-[var(--secondary)] hover:text-[#c2453c]">
                  <Trash2 className="size-4" />Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card}>
        <h2 className="app-h2"><span className="app-step">2</span>Connect your agent</h2>
        <p className="mt-1.5 text-[14.5px] text-[#8d8379]">Posy speaks MCP, so it works with Claude, Cursor, Codex and anything else that does.</p>
        <Tabs defaultValue="claude" className="mt-4">
          <TabsList className="h-10 flex-wrap rounded-[12px] bg-[var(--secondary)] p-1">
            {[['claude', 'Claude Code'], ['cursor', 'Cursor'], ['codex', 'Codex'], ['other', 'Other apps'], ['rest', 'REST']].map(([v, l]) => (
              <TabsTrigger key={v} value={v} className="rounded-[9px] text-[13px] data-[state=active]:bg-[var(--surface)]">{l}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="claude" className="mt-3"><CodeBlock label="Terminal" code={`claude mcp add --transport http posy ${mcp} \\\n  --header "Authorization: Bearer ${key}"`} /></TabsContent>
          <TabsContent value="cursor" className="mt-3"><CodeBlock label="~/.cursor/mcp.json" code={JSON.stringify({ mcpServers: { posy: { url: mcp, headers: { Authorization: `Bearer ${key}` } } } }, null, 2)} /></TabsContent>
          <TabsContent value="codex" className="mt-3 grid gap-2">
            <CodeBlock label="~/.codex/config.toml" code={`[mcp_servers.posy]\nurl = "${mcp}"\nbearer_token_env_var = "POSY_API_KEY"`} />
            <CodeBlock label="Shell" code={`export POSY_API_KEY=${key}`} />
          </TabsContent>
          <TabsContent value="other" className="mt-3"><CodeBlock label="Any MCP client (stdio bridge)" code={`npx -y mcp-remote ${mcp} --header "Authorization: Bearer ${key}"`} /></TabsContent>
          <TabsContent value="rest" className="mt-3 grid gap-2">
            <CodeBlock label="Add a tile" code={`curl -X POST ${site}/api/v1/page/tiles \\\n  -H "Authorization: Bearer ${key}" -H "Content-Type: application/json" \\\n  -d '{"input": "https://github.com/owner/repo"}'`} />
            <CodeBlock label="Publish" code={`curl -X POST ${site}/api/v1/page/publish -H "Authorization: Bearer ${key}"`} />
          </TabsContent>
        </Tabs>
      </section>

      <section className={card}>
        <h2 className="app-h2"><span className="app-step">3</span>Ask for what you want</h2>
        <ul className="mt-4 grid gap-2.5">
          {PROMPTS.map(p => <li key={p} className="app-hand -rotate-[0.4deg] bg-[var(--tint-butter)] px-4 py-2.5 text-[21px] leading-snug text-[#5a4710] shadow-[0_8px_16px_-12px_rgb(90_70_0/.5)]">&ldquo;{p}&rdquo;</li>)}
        </ul>
        <p className="mt-5 text-[14px] text-[#8d8379]">
          Edits land in your draft and show up in the editor live. Your agent publishes only when you ask. Anyone&apos;s agent can read your published page at{' '}
          <a className="underline underline-offset-4" href={`${site}/${username}/llms.txt`} target="_blank" rel="noopener">/{username}/llms.txt</a> and{' '}
          <a className="underline underline-offset-4" href={`${site}/api/v1/public/${username}`} target="_blank" rel="noopener">JSON</a>.
        </p>
      </section>
    </div>
  );
}
