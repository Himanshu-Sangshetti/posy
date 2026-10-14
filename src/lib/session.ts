import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './auth';

export async function currentUser() {
  const s = await auth.api.getSession({ headers: await headers() });
  return s?.user ?? null;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect('/login');
  return user;
}

/** API auth: a session cookie, or an API key in `Authorization: Bearer posy_…` / `x-api-key`. */
export async function userIdFromRequest(req: Request): Promise<string | null> {
  const bearer = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  const key = bearer || req.headers.get('x-api-key');
  if (key) {
    const r = await auth.api.verifyApiKey({ body: { key } }).catch(() => null);
    return r?.valid && r.key ? r.key.referenceId : null;
  }
  const s = await auth.api.getSession({ headers: req.headers }).catch(() => null);
  return s?.user.id ?? null;
}
