import { authed, json } from '@/lib/api';
import { importBrief } from '@/lib/page-ops';
import { BriefError } from '@/lib/brief';

/**
 * Load a Posy brief (see /docs/format) or a full page file. Body: `{ file, username?, replace? }`, where `file` is the JSON
 * object or the raw text a chat produced. Creates the page when you have none; `replace: true` overwrites the draft.
 */
export const POST = authed(async (userId, req) => {
  const b = await req.json();
  try {
    return json(await importBrief(userId, b.file ?? b.brief ?? b, { username: b.username, replace: b.replace === true }), 201);
  } catch (e) {
    if (e instanceof BriefError) return json({ error: e.message }, 400);
    throw e;
  }
});
