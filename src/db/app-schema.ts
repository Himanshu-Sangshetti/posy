import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { user } from './auth-schema';

/** One page per account. `draft` autosaves; `published` is what visitors see. */
export const pages = sqliteTable('pages', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  username: text('username').notNull().unique(),
  draft: text('draft', { mode: 'json' }).notNull(),
  published: text('published', { mode: 'json' }),
  version: integer('version').notNull().default(1),
  publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

/** Privacy-friendly analytics: no cookies, no IPs. */
export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  kind: text('kind', { enum: ['view', 'click'] }).notNull(),
  tileId: text('tile_id'),
  referrer: text('referrer'),
  country: text('country'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
}, t => [index('events_page_time').on(t.pageId, t.createdAt)]);
