import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { pages, events } from '@/db/app-schema';
import { clientIp, hit } from '@/lib/rate-limit';

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|headless/i;

// The platform's geo header: Vercel's on Vercel, otherwise Cloudflare's (only meaningful behind Cloudflare).
const country = (req: Request) => {
  const c = (process.env.VERCEL ? req.headers.get('x-vercel-ip-country') : req.headers.get('cf-ipcountry'))?.toUpperCase();
  return c && /^[A-Z]{2}$/.test(c) ? c : null;
};

/** Cookie-free view/click counting. Body: { u: username, k: "view" | "click", t?: tileId }. */
export async function POST(req: Request) {
  if (BOT.test(req.headers.get('user-agent') ?? '')) return new Response(null, { status: 204 });
  let body: { u?: string; k?: string; t?: string; r?: string };
  try { body = JSON.parse(await req.text()); } catch { return new Response(null, { status: 400 }); }
  if (!body.u || (body.k !== 'view' && body.k !== 'click')) return new Response(null, { status: 400 });
  // Per visitor address: a few dozen events per page, a few hundred overall. Extra events are dropped quietly.
  const ip = clientIp(req);
  if (await hit(`track:${ip}:${body.u.toLowerCase().slice(0, 40)}`, 40, 600) || await hit(`track:${ip}`, 300, 3600)) return new Response(null, { status: 204 });
  const page = await db.select({ id: pages.id }).from(pages).where(eq(pages.username, body.u.toLowerCase())).get();
  if (!page) return new Response(null, { status: 404 });
  let referrer: string | null = null;
  try { referrer = body.r ? new URL(body.r).hostname.replace(/^www\./, '') : null; } catch { /* ignore */ }
  await db.insert(events).values({
    pageId: page.id, kind: body.k, tileId: body.k === 'click' ? (body.t ?? null)?.slice(0, 40) ?? null : null,
    referrer, country: country(req),
  });
  return new Response(null, { status: 204 });
}
