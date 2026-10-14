import { defineConfig } from 'drizzle-kit';
import { LOCAL_DB_URL } from './src/lib/data-dir';

export default defineConfig({
  dialect: process.env.DATABASE_URL?.startsWith('libsql:') ? 'turso' : 'sqlite',
  schema: ['./src/db/auth-schema.ts', './src/db/app-schema.ts'],
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL || LOCAL_DB_URL, authToken: process.env.DATABASE_AUTH_TOKEN },
} as Parameters<typeof defineConfig>[0]);
