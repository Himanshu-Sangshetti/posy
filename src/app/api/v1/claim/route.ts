import { authed, json } from '@/lib/api';
import { createPageFor, PageExistsError } from '@/lib/page-ops';

/**
 * Claim a username and create the page. Either pick a starter `template`, or choose
 * `style`, `layout` and `preset` (colours) independently, with `empty` for a blank page.
 */
export const POST = authed(async (userId, req) => {
  try {
    const { username } = await createPageFor(userId, await req.json());
    return json({ username }, 201);
  } catch (e) {
    if (e instanceof PageExistsError) return json({ error: e.message }, 409);
    throw e; // EntitlementError and ZodError are mapped by `authed`
  }
});
