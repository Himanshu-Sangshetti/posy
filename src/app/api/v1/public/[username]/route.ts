import { publicPage } from '@/lib/pages';
import { siteUrl } from '@/lib/site';

/** Anyone (including AI agents) can read a published page as JSON. */
export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const r = await publicPage((await params).username);
  const headers = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=60' };
  if (!r) return Response.json({ error: 'Not found' }, { status: 404, headers });
  return Response.json({ username: r.row.username, url: `${siteUrl()}/${r.row.username}`, updatedAt: r.row.publishedAt, ...r.page }, { headers });
}
