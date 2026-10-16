import 'server-only';
import { lt, sql } from 'drizzle-orm';
import { db } from '@/db';
import { rateLimits } from '@/db/app-schema';

const off = () => process.env.POSY_RATE_LIMIT === 'off' || !!process.env.POSY_E2E;

/** The caller's address as the platform reports it (Vercel and most proxies put the client first in x-forwarded-for). */
export function clientIp(req: Request) {
  const h = req.headers;
  return (h.get('x-vercel-forwarded-for') ?? h.get('x-real-ip') ?? h.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
}

/**
 * Fixed-window limiter backed by the database, so the count holds across serverless instances.
 * Returns how long to wait in seconds when the limit is hit, or 0. Fails open if the database is unavailable.
 */
export async function hit(key: string, max: number, windowSec: number): Promise<number> {
  if (off()) return 0;
  const now = Date.now();
  const reset = now + windowSec * 1000;
  try {
    const row = await db.insert(rateLimits).values({ key, count: 1, resetAt: reset })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          count: sql`CASE WHEN ${rateLimits.resetAt} <= ${now} THEN 1 ELSE ${rateLimits.count} + 1 END`,
          resetAt: sql`CASE WHEN ${rateLimits.resetAt} <= ${now} THEN ${reset} ELSE ${rateLimits.resetAt} END`,
        },
      })
      .returning({ count: rateLimits.count, resetAt: rateLimits.resetAt }).get();
    if (Math.random() < 0.01) db.delete(rateLimits).where(lt(rateLimits.resetAt, now)).run().catch(() => {});
    return row.count > max ? Math.max(1, Math.ceil((row.resetAt - now) / 1000)) : 0;
  } catch { return 0; }
}

export const tooMany = (retryAfter: number) =>
  Response.json({ error: 'Too many requests. Try again shortly.' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });

export class RateLimitError extends Error {
  constructor(public retryAfter: number) { super('Too many requests. Try again shortly.'); }
}

/** Throws RateLimitError when the limit is exceeded (mapped to 429 by `authed`). */
export async function enforce(key: string, max: number, windowSec: number) {
  const wait = await hit(key, max, windowSec);
  if (wait) throw new RateLimitError(wait);
}

/** 429 response when any of the given limits is exceeded, else null. */
export async function limit(...rules: [key: string, max: number, windowSec: number][]) {
  for (const [key, max, windowSec] of rules) {
    const wait = await hit(key, max, windowSec);
    if (wait) return tooMany(wait);
  }
  return null;
}
