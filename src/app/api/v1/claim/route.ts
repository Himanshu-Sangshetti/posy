import { authed, json } from '@/lib/api';
import { createPage, pageForUser } from '@/lib/pages';
import { TEMPLATES, type TemplateId } from '@/lib/templates';
import { db } from '@/db';
import { user } from '@/db/auth-schema';
import { eq } from 'drizzle-orm';

/** Claim a username and create the page from a starter template. */
export const POST = authed(async (userId, req) => {
  if (await pageForUser(userId)) return json({ error: 'You already have a page' }, 409);
  const b = await req.json();
  const tpl = (b.template in TEMPLATES ? b.template : 'blank') as TemplateId;
  const u = await db.select({ name: user.name }).from(user).where(eq(user.id, userId)).get();
  const row = await createPage(userId, String(b.username ?? ''), u?.name ?? '', tpl);
  return json({ username: row.username }, 201);
});
