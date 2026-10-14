import 'server-only';
import { ZodError } from 'zod';
import { userIdFromRequest } from './session';
import { EntitlementError } from './entitlements';

export const json = (data: unknown, status = 200, headers?: HeadersInit) => Response.json(data, { status, headers });

/** Wraps an authenticated API handler: 401 without a session or API key, readable 400s for bad input. */
export function authed<C>(fn: (userId: string, req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C) => {
    const userId = await userIdFromRequest(req);
    if (!userId) return json({ error: 'Unauthorized. Sign in, or send an API key as "Authorization: Bearer posy_…".' }, 401);
    try { return await fn(userId, req, ctx); }
    catch (e) {
      if (e instanceof EntitlementError) return json({ error: e.message, upgrade: true }, 402);
      if (e instanceof ZodError) return json({ error: 'Invalid input', issues: e.issues.map(i => `${i.path.join('.') || '(root)'}: ${i.message}`) }, 400);
      return json({ error: (e as Error).message }, 400);
    }
  };
}
