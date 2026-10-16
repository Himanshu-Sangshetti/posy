import { describe, expect, it } from 'vitest';
import { checkEnv, validateEnvOnBoot, DEV_AUTH_SECRET, COMPOSE_PLACEHOLDER } from '@/lib/env';

const good = { NODE_ENV: 'production', BETTER_AUTH_SECRET: 'x'.repeat(40), BETTER_AUTH_URL: 'https://links.example.com', NEXT_PUBLIC_SITE_URL: 'https://links.example.com' };

describe('env validation', () => {
  it('accepts an empty development env', () => expect(checkEnv({ NODE_ENV: 'development' }).ok).toBe(true));
  it('accepts a complete production env', () => expect(checkEnv(good).ok).toBe(true));
  it('lists everything missing in production', () => {
    const r = checkEnv({ NODE_ENV: 'production' });
    expect(r.ok).toBe(false);
    expect(r.errors.join('\n')).toMatch(/BETTER_AUTH_SECRET[\s\S]*NEXT_PUBLIC_SITE_URL[\s\S]*BETTER_AUTH_URL/);
  });
  it('refuses the dev fallback and the compose placeholder', () => {
    expect(checkEnv({ ...good, BETTER_AUTH_SECRET: DEV_AUTH_SECRET }).ok).toBe(false);
    expect(checkEnv({ ...good, BETTER_AUTH_SECRET: COMPOSE_PLACEHOLDER }).errors[0]).toMatch(/placeholder/);
  });
  it('refuses short secrets', () => expect(checkEnv({ ...good, BETTER_AUTH_SECRET: 'short' }).ok).toBe(false));
  it('requires matching URLs', () => expect(checkEnv({ ...good, BETTER_AUTH_URL: 'https://other.example.com' }).ok).toBe(false));
  it('rejects bad values in any mode', () => {
    expect(checkEnv({ NODE_ENV: 'development', POSY_SIGNUP: 'nope' }).ok).toBe(false);
    expect(checkEnv({ NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'links.example.com' }).ok).toBe(false);
  });
  it('requires Turso for Vercel and a token for remote databases', () => {
    expect(checkEnv({ ...good, VERCEL: '1' }).ok).toBe(false);
    expect(checkEnv({ ...good, VERCEL: '1', DATABASE_URL: 'libsql://x.turso.io' }).ok).toBe(false);
    expect(checkEnv({ ...good, VERCEL: '1', DATABASE_URL: 'libsql://x.turso.io', DATABASE_AUTH_TOKEN: 't' }).ok).toBe(true);
  });
  it('lets the e2e production server boot without secrets', () => expect(checkEnv({ NODE_ENV: 'production', POSY_E2E: '1' }).ok).toBe(true));
  it('does not throw during next build, and throws at production start', () => {
    expect(() => validateEnvOnBoot({ NODE_ENV: 'production', NEXT_PHASE: 'phase-production-build' })).not.toThrow();
    expect(() => validateEnvOnBoot({ NODE_ENV: 'production' })).toThrow(/can't start/);
  });
});
