import 'server-only';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import { db } from '@/db';
import { pages } from '@/db/app-schema';
import { parsePage, Page, type Page as PageData } from './schema';
import { template, type TemplateId } from './templates';
import { entitlementsFor, assertAllowed, applyEntitlements } from './entitlements';

export const USERNAME_RE = /^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])$/;
const RESERVED = new Set(('about admin agents analytics api app apps assets auth blog dashboard demo docs edit editor explore faq ' +
  'billing checkout d domains help home legal login logout mcp new onboarding posy plan pricing privacy pro settings signin signout signup static status support ' +
  'team templates terms u upgrade user users www _next favicon robots sitemap llms oauth well-known .well-known openapi schema uploads track unfurl').split(' '));

export type UsernameCheck = { ok: true } | { ok: false; reason: string };

export async function checkUsername(raw: string): Promise<UsernameCheck> {
  const u = raw.trim().toLowerCase();
  if (!USERNAME_RE.test(u)) return { ok: false, reason: '3–30 letters, numbers, - or _' };
  if (RESERVED.has(u)) return { ok: false, reason: 'That name is reserved' };
  const taken = await db.select({ id: pages.id }).from(pages).where(eq(pages.username, u)).get();
  return taken ? { ok: false, reason: 'Already taken' } : { ok: true };
}

export type PageRow = typeof pages.$inferSelect;

export async function pageForUser(userId: string) {
  return db.select().from(pages).where(eq(pages.userId, userId)).get();
}

export async function createPage(userId: string, username: string, name: string, tpl: TemplateId, page?: PageData) {
  const u = username.trim().toLowerCase();
  const check = await checkUsername(u);
  if (!check.ok) throw new Error(check.reason);
  const data = page ?? template(tpl, name);
  const row = { id: nanoid(12), userId, username: u, draft: data, published: data, version: 1, publishedAt: new Date() };
  await db.insert(pages).values(row);
  return row;
}

export class VersionConflict extends Error {
  constructor(public current: PageRow) { super('The page changed since you loaded it'); }
}

/** Compare-and-set save of the draft. Pass the version you loaded; a mismatch throws VersionConflict. */
export async function saveDraft(userId: string, data: unknown, baseVersion?: number) {
  const page = parsePage(data);
  const row = await pageForUser(userId);
  if (!row) throw new Error('No page yet');
  assertAllowed(page, await entitlementsFor(userId));
  if (baseVersion !== undefined && baseVersion !== row.version) throw new VersionConflict(row);
  const version = row.version + 1;
  const res = await db.update(pages).set({ draft: page, version, updatedAt: new Date() })
    .where(and(eq(pages.id, row.id), eq(pages.version, row.version))).returning({ version: pages.version });
  if (!res.length) throw new VersionConflict((await pageForUser(userId))!);
  return { version, page };
}

export async function publish(userId: string) {
  const row = await pageForUser(userId);
  if (!row) throw new Error('No page yet');
  await db.update(pages).set({ published: row.draft, publishedAt: new Date() }).where(eq(pages.id, row.id));
  revalidatePath(`/${row.username}`);
  return { username: row.username };
}

export async function changeUsername(userId: string, next: string) {
  const row = await pageForUser(userId);
  if (!row) throw new Error('No page yet');
  const u = next.trim().toLowerCase();
  if (u === row.username) return row.username;
  const check = await checkUsername(u);
  if (!check.ok) throw new Error(check.reason);
  await db.update(pages).set({ username: u }).where(eq(pages.id, row.id));
  revalidatePath(`/${row.username}`); revalidatePath(`/${u}`);
  return u;
}

export async function publicPage(username: string): Promise<{ row: PageRow; page: PageData } | null> {
  const row = await db.select().from(pages).where(eq(pages.username, username.toLowerCase())).get();
  if (!row?.published) return null;
  const parsed = Page.safeParse(row.published);
  return parsed.success ? { row, page: applyEntitlements(parsed.data, await entitlementsFor(row.userId)) } : null;
}

/** The instance owner's page (self-hosted root): the oldest page. */
export async function ownerUsername(): Promise<string | null> {
  const row = await db.select({ username: pages.username }).from(pages).orderBy(pages.createdAt).limit(1).get();
  return row?.username ?? null;
}

export function hasUnpublished(row: PageRow) {
  return JSON.stringify(row.draft) !== JSON.stringify(row.published);
}
