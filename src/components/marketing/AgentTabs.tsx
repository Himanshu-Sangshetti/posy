'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeBlock } from '@/components/dash/CodeBlock';

/** Same snippets as the dashboard's Agents panel, with a placeholder key. */
export function AgentTabs({ site }: { site: string }) {
  const mcp = `${site}/api/mcp`;
  const key = 'posy_YOUR_KEY';
  return (
    <Tabs defaultValue="claude">
      <TabsList className="h-11 flex-wrap rounded-[14px] bg-[var(--secondary)] p-1">
        {[['claude', 'Claude Code'], ['cursor', 'Cursor'], ['codex', 'Codex']].map(([v, l]) => (
          <TabsTrigger key={v} value={v} className="rounded-[10px] px-4 text-[14px] data-[state=active]:bg-[var(--surface)]">{l}</TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="claude" className="mt-3"><CodeBlock label="Terminal" code={`claude mcp add --transport http posy ${mcp} \\\n  --header "Authorization: Bearer ${key}"`} /></TabsContent>
      <TabsContent value="cursor" className="mt-3"><CodeBlock label="~/.cursor/mcp.json" code={JSON.stringify({ mcpServers: { posy: { url: mcp, headers: { Authorization: `Bearer ${key}` } } } }, null, 2)} /></TabsContent>
      <TabsContent value="codex" className="mt-3 grid gap-2">
        <CodeBlock label="~/.codex/config.toml" code={`[mcp_servers.posy]\nurl = "${mcp}"\nbearer_token_env_var = "POSY_API_KEY"`} />
        <CodeBlock label="Shell" code={`export POSY_API_KEY=${key}`} />
      </TabsContent>
    </Tabs>
  );
}
