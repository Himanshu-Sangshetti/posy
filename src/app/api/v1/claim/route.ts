import { authed, json } from '@/lib/api';
import { createPage, pageForUser } from '@/lib/pages';
import { TEMPLATES, starterPage, type TemplateId } from '@/lib/templates';
import { STYLE_IDS, type StyleId } from '@/lib/styles';
import { THEMES } from '@/lib/themes';
import { assertAllowed, entitlementsFor, EntitlementError } from '@/lib/entitlements';
import { db } from '@/db';
import { user } from '@/db/auth-schema';
import { eq } from 'drizzle-orm';

/**
 * Claim a username and create the page. Either pick a starter `template`, or choose
 * `style`, `layout` and `preset` (colours) independently, with `empty` for a blank page.
 */
export const POST = authed(async (userId, req) => {
  if (await pageForUser(userId)) return json({ error: 'You already have a page' }, 409);
  const b = await req.json();
  const u = await db.select({ name: user.name }).from(user).where(eq(user.id, userId)).get();
  const name = u?.name ?? '';
  let page;
  if (STYLE_IDS.includes(b.style)) {
    page = starterPage({
      name, style: b.style as StyleId,
      layout: (['bento', 'list', 'canvas'] as const).find(l => l === b.layout),
      preset: typeof b.preset === 'string' && b.preset in THEMES ? b.preset : undefined,
      empty: b.empty === true,
    });
    try { assertAllowed(page, await entitlementsFor(userId)); } catch (e) { if (e instanceof EntitlementError) return json({ error: e.message }, 402); throw e; }
  }
  const tpl = (b.template in TEMPLATES ? b.template : 'blank') as TemplateId;
  const row = await createPage(userId, String(b.username ?? ''), name, tpl, page);
  return json({ username: row.username }, 201);
});
