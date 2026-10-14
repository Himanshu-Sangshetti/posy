import os from 'node:os';
import path from 'node:path';

/**
 * Where local data (SQLite + uploads) lives.
 * Development uses ~/.posy so database writes don't trigger the dev server's file watcher (reload loops).
 * Production uses ./.data unless POSY_DATA_DIR or DATABASE_URL (Turso) is set.
 */
export const DATA_DIR = path.resolve(
  process.env.POSY_DATA_DIR || (process.env.NODE_ENV === 'production' ? '.data' : path.join(os.homedir(), '.posy')),
);
export const LOCAL_DB_URL = `file:${path.join(DATA_DIR, 'posy.db')}`;
