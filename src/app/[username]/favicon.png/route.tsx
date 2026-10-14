import { publicPage } from '@/lib/pages';
import { faviconFor } from '@/lib/og';

export const dynamic = 'force-dynamic';

/** The page's browser-tab icon: the avatar cropped round, or the first initial on the accent colour. */
export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const r = await publicPage((await params).username);
  return faviconFor(r?.page ?? null);
}
