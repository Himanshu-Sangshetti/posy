import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import fs from 'node:fs';
import * as authSchema from './auth-schema';
import * as appSchema from './app-schema';
import { DATA_DIR, LOCAL_DB_URL } from '@/lib/data-dir';

export const schema = { ...authSchema, ...appSchema };

// Local: a SQLite file (see data-dir.ts). Production: a Turso / libSQL URL + token.
const url = process.env.DATABASE_URL || LOCAL_DB_URL;
if (url.startsWith('file:')) fs.mkdirSync(DATA_DIR, { recursive: true });

const g = globalThis as unknown as { posyDb?: ReturnType<typeof drizzle<typeof schema>> };
export const db = g.posyDb ?? drizzle(createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN }), { schema });
if (process.env.NODE_ENV !== 'production') g.posyDb = db;
