import { describe, expect, it, vi, afterEach } from 'vitest';
import { bucket, telemetryOffReason, telemetryEnabled, send, DEFAULT_KEY, dbKind } from '@/lib/telemetry';

const on = { NODE_ENV: 'production', POSY_TELEMETRY_KEY: 'phc_real' };

describe('telemetry', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('is on in production with a key', () => expect(telemetryEnabled(on)).toBe(true));
  it('is on in production with the built-in key, off with the placeholder', () => {
    expect(telemetryOffReason({ NODE_ENV: 'production' })).toBe(null);
    expect(telemetryOffReason({ NODE_ENV: 'production', POSY_TELEMETRY_KEY: 'phc_REPLACE_ME' })).toBe('no project key');
  });
  it('honours opt-outs and non-production', () => {
    for (const extra of [{ POSY_TELEMETRY: '0' }, { POSY_TELEMETRY: 'false' }, { DO_NOT_TRACK: '1' }, { CI: 'true' }, { POSY_E2E: '1' }, { NODE_ENV: 'development' }, { NODE_ENV: 'test' }, { NEXT_PHASE: 'phase-production-build' }])
      expect(telemetryEnabled({ ...on, ...extra })).toBe(false);
  });
  it('buckets counts', () => {
    expect([0, 1, 3, 8, 20, 70, 300, 900, 5000].map(bucket)).toEqual(['0', '1', '2-5', '6-10', '11-50', '51-100', '101-500', '501-1000', '1000+']);
  });
  it('detects the database kind', () => {
    expect(dbKind({})).toBe('libsql-file');
    expect(dbKind({ DATABASE_URL: 'libsql://x.turso.io' })).toBe('turso');
  });
  it('sends nothing when off', async () => {
    const f = vi.fn(); vi.stubGlobal('fetch', f);
    expect(await send('e', 'id', {}, { NODE_ENV: 'production', POSY_TELEMETRY: '0' })).toBe(false);
    expect(await send('e', 'id', {}, { NODE_ENV: 'production', DO_NOT_TRACK: '1' })).toBe(false);
    expect(await send('e', 'id', {}, { NODE_ENV: 'production', POSY_TELEMETRY_KEY: 'phc_REPLACE_ME' })).toBe(false);
    expect(f).not.toHaveBeenCalled();
    expect(DEFAULT_KEY).toMatch(/^phc_/);
  });
  it('posts to PostHog without profile or geo, and never throws', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true }); vi.stubGlobal('fetch', f);
    expect(await send('posy.page.published', 'id', { look: 'washi' }, on)).toBe(true);
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('https://us.i.posthog.com/capture/');
    const body = JSON.parse(init.body);
    expect(body.properties).toMatchObject({ look: 'washi', $process_person_profile: false, $geoip_disable: true });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    expect(await send('e', 'id', {}, on)).toBe(false);
  });
});
