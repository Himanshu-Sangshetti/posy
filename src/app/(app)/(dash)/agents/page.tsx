import type { Metadata } from 'next';
import { requireUser } from '@/lib/session';
import { pageForUser } from '@/lib/pages';
import { siteUrl } from '@/lib/site';
import { AgentsPanel } from '@/components/dash/AgentsPanel';

export const metadata: Metadata = { title: 'Agents · Posy' };

export default async function AgentsPage() {
  const user = await requireUser();
  const row = (await pageForUser(user.id))!;
  return (
    <div className="posy-rise grid gap-7">
      <div className="mb-2 mt-6">
        <h1 className="app-h1">Let your <i>AI</i> edit your page</h1>
        <p className="app-lede">Connect Claude, Cursor or Codex once, then just ask: add a link, change the look, publish.</p>
      </div>
      <AgentsPanel site={siteUrl()} username={row.username} />
    </div>
  );
}
