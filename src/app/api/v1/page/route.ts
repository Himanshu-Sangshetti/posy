import { authed, json } from '@/lib/api';
import { getState } from '@/lib/page-ops';
import { saveDraft, VersionConflict } from '@/lib/pages';

/** Your page: draft, version and publish state. */
export const GET = authed(async userId => {
  const s = await getState(userId);
  return s ? json(s) : json({ error: 'No page yet' }, 404);
});

/** Replace the draft. Send `baseVersion` to avoid overwriting newer changes (409 on conflict). */
export const PUT = authed(async (userId, req) => {
  const body = await req.json();
  try {
    const r = await saveDraft(userId, body.page, body.baseVersion);
    return json({ version: r.version });
  } catch (e) {
    if (e instanceof VersionConflict) return json({ error: 'conflict', version: e.current.version, page: e.current.draft }, 409);
    throw e;
  }
});
