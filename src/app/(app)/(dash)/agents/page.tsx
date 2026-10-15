import type { Metadata } from 'next';
import { requireUser } from '@/lib/session';
import { pageForUser } from '@/lib/pages';
import { siteUrl } from '@/lib/site';
import { PageHead } from '@/components/dash/ui';
import { AgentsPanel } from '@/components/dash/AgentsPanel';

export const metadata: Metadata = { title: 'Agents · Posy' };

export default async function AgentsPage() {
  const user = await requireUser();
  const row = (await pageForUser(user.id))!;
  return (
    <div className="grid gap-8">
      <PageHead eyebrow="Agents · MCP" title={<>Let your <i>AI</i> edit your page</>} lede="Connect Claude, ChatGPT or Cursor once, then just ask: make my page, add a link, change the look, publish." />
      <AgentsPanel site={siteUrl()} username={row.username} />
    </div>
  );
}
