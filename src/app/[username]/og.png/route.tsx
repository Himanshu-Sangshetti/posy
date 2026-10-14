import { publicPage, ownerUsername } from '@/lib/pages';
import { SITE_HOST } from '@/lib/site';
import { edition } from '@/edition';
import { ogFor } from '@/lib/og';

export const dynamic = 'force-dynamic';

/** Share image for links on X, WhatsApp, iMessage… Drawn by the page's share style (lib/og). */
export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const r = await publicPage((await params).username);
  if (!r) return new Response('Not found', { status: 404 });
  // The self-hosted owner's page also lives at "/", so print the bare address for it.
  const atRoot = edition.root === 'owner-page' && (await ownerUsername()) === r.row.username;
  return ogFor(r.page, { link: atRoot ? SITE_HOST() : `${SITE_HOST()}/${r.row.username}` });
}
