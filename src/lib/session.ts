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

export type KeyAccess = 'read' | 'write';

/** What an API key may do with the page. Keys made before permissions existed (null) could always edit the page. */
export function keyAllows(permissions: Record<string, string[]> | null | undefined, access: KeyAccess) {
  return (permissions ?? { page: ['read', 'write'] }).page?.includes(access) ?? false;
}

/** The user an API key belongs to, if the key is valid and allows `access`. */
export async function userIdFromKey(key: string, access: KeyAccess): Promise<string | null> {
  const r = await auth.api.verifyApiKey({ body: { key } }).catch(() => null);
  return r?.valid && r.key && keyAllows(r.key.permissions, access) ? r.key.referenceId : null;
}

/**
 * API auth: a session cookie, or an API key in `Authorization: Bearer posy_…` / `x-api-key`.
 * Keys are only accepted when `keyAccess` is given (the page API); everywhere else they are refused.
 */
export async function userIdFromRequest(req: Request, keyAccess?: KeyAccess): Promise<string | null> {
  const bearer = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  const key = bearer || req.headers.get('x-api-key');
  if (key) return keyAccess ? userIdFromKey(key, keyAccess) : null;
  const s = await auth.api.getSession({ headers: req.headers }).catch(() => null);
  return s?.user.id ?? null;
}
