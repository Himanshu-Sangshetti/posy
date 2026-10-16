import { describe, it, expect, vi, beforeAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

vi.mock('server-only', () => ({}));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'posy-rl-'));
process.env.DATABASE_URL = `file:${path.join(dir, 'test.db')}`;
delete process.env.POSY_E2E;
delete process.env.POSY_RATE_LIMIT;

const { db } = await import('@/db');
const { hit, limit, clientIp } = await import('@/lib/rate-limit');

beforeAll(async () => {
  const { migrate } = await import('drizzle-orm/libsql/migrator');
  await migrate(db, { migrationsFolder: path.resolve(__dirname, '../../drizzle') });
});

describe('rate limiter', () => {
  it('allows up to max in a window, then asks the caller to wait', async () => {
    for (let i = 0; i < 3; i++) expect(await hit('t:a', 3, 60)).toBe(0);
    const wait = await hit('t:a', 3, 60);
    expect(wait).toBeGreaterThan(0);
    expect(wait).toBeLessThanOrEqual(60);
    expect(await hit('t:b', 3, 60)).toBe(0);
  });

  it('starts a fresh window once the old one has passed', async () => {
    expect(await hit('t:c', 1, 1)).toBe(0);
    expect(await hit('t:c', 1, 1)).toBeGreaterThan(0);
    await new Promise(r => setTimeout(r, 1100));
    expect(await hit('t:c', 1, 1)).toBe(0);
  });

  it('returns a 429 with Retry-After', async () => {
    expect(await limit(['t:d', 1, 60])).toBeNull();
    const res = await limit(['t:d', 1, 60]);
    expect(res?.status).toBe(429);
    expect(Number(res?.headers.get('retry-after'))).toBeGreaterThan(0);
  });

  it('reads the client address from proxy headers', () => {
    expect(clientIp(new Request('http://x', { headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.1' } }))).toBe('203.0.113.5');
    expect(clientIp(new Request('http://x'))).toBe('unknown');
  });
});
