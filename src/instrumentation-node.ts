// A fresh self-hosted install (or a new Turso database) just works: migrations run at startup.
import path from 'node:path';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from './db';

await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
