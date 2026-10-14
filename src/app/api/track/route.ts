import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { pages, events } from '@/db/app-schema';

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|headless/i;

/** Cookie-free view/click counting. Body: { u: username, k: "view" | "click", t?: tileId }. */
export async function POST(req: Request) {
  if (BOT.test(req.headers.get('user-agent') ?? '')) return new Response(null, { status: 204 });
  let body: { u?: string; k?: string; t?: string; r?: string };
  try { body = JSON.parse(await req.text()); } catch { return new Response(null, { status: 400 }); }
  if (!body.u || (body.k !== 'view' && body.k !== 'click')) return new Response(null, { status: 400 });
  const page = await db.select({ id: pages.id }).from(pages).where(eq(pages.username, body.u.toLowerCase())).get();
  if (!page) return new Response(null, { status: 404 });
  let referrer: string | null = null;
  try { referrer = body.r ? new URL(body.r).hostname.replace(/^www\./, '') : null; } catch { /* ignore */ }
  await db.insert(events).values({
    pageId: page.id, kind: body.k, tileId: body.k === 'click' ? (body.t ?? null)?.slice(0, 40) ?? null : null,
    referrer, country: req.headers.get('x-vercel-ip-country') ?? req.headers.get('cf-ipcountry'),
  });
  return new Response(null, { status: 204 });
}
