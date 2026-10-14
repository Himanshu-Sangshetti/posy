import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: process.env.DATABASE_URL?.startsWith('libsql:') ? 'turso' : 'sqlite',
  schema: ['./src/db/auth-schema.ts', './src/db/app-schema.ts'],
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL || 'file:.data/posy.db', authToken: process.env.DATABASE_AUTH_TOKEN },
} as Parameters<typeof defineConfig>[0]);
