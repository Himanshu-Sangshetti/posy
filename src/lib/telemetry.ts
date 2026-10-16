import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { DATA_DIR } from './data-dir';
import pkg from '../../package.json';

/**
 * Anonymous, opt-out usage stats for self-hosted instances. What is sent is listed in docs/telemetry.md.
 * Nothing here may ever throw or block a request.
 */

/** Replace with the PostHog project key (or set POSY_TELEMETRY_KEY). While it is the placeholder, nothing is sent. */
export const DEFAULT_KEY = 'phc_uXdSw25EpskfdCp56u7W2q9PyYX5ZpYXJskpNYZbvWJF';
export const DEFAULT_HOST = 'https://us.i.posthog.com';
export const DOCS_URL = 'https://docs.posy.page/self-host/telemetry';

type Env = Record<string, string | undefined>;
const OFF = /^(0|false|off|no)$/i;
const ON = /^(1|true|yes|on)$/i;

export function telemetryKey(env: Env = process.env) { return env.POSY_TELEMETRY_KEY?.trim() || DEFAULT_KEY; }
export function telemetryHost(env: Env = process.env) { return (env.POSY_TELEMETRY_HOST?.trim() || DEFAULT_HOST).replace(/\/+$/, ''); }

/** Why telemetry is off, or null when it is on. */
export function telemetryOffReason(env: Env = process.env): string | null {
  if (env.POSY_TELEMETRY && OFF.test(env.POSY_TELEMETRY.trim())) return 'POSY_TELEMETRY=0';
  if (env.DO_NOT_TRACK && ON.test(env.DO_NOT_TRACK.trim())) return 'DO_NOT_TRACK';
  if (env.NODE_ENV !== 'production') return 'not production';
  if (env.CI) return 'CI';
  if (env.POSY_E2E) return 'e2e';
  if (env.NEXT_PHASE === 'phase-production-build') return 'build';
  if (!telemetryKey(env) || telemetryKey(env) === 'phc_REPLACE_ME') return 'no project key';
  return null;
}
export const telemetryEnabled = (env: Env = process.env) => telemetryOffReason(env) === null;

/** Counts are bucketed so an instance can't be singled out by an exact number. */
export function bucket(n: number): string {
  if (!(n > 0)) return '0';
  for (const [max, label] of [[1, '1'], [5, '2-5'], [10, '6-10'], [50, '11-50'], [100, '51-100'], [500, '101-500'], [1000, '501-1000']] as const) if (n <= max) return label;
  return '1000+';
}

export function deployType(env: Env = process.env): 'vercel' | 'docker' | 'node' {
  if (env.VERCEL) return 'vercel';
  if (env.POSY_DOCKER || fs.existsSync('/.dockerenv')) return 'docker';
  return 'node';
}
export function dbKind(env: Env = process.env): 'turso' | 'libsql-file' {
  return env.DATABASE_URL && /^(libsql|https?|wss?):\/\//.test(env.DATABASE_URL) ? 'turso' : 'libsql-file';
}

/** Properties of `posy.instance.started`. */
export function startedProps(env: Env = process.env) {
  return { version: pkg.version, node_version: process.versions.node, os: os.platform(), arch: os.arch(), deploy: deployType(env), db: dbKind(env) };
}

const STATE = path.join(DATA_DIR, 'telemetry.json');
type State = { id: string; lastAlive?: number };

/** The anonymous instance id lives in the data dir. Falls back to a hash of the auth secret when the dir isn't writable (e.g. Vercel). */
export function loadState(env: Env = process.env): { state: State; created: boolean; persisted: boolean } {
  try {
    const s = JSON.parse(fs.readFileSync(STATE, 'utf8')) as State;
    if (typeof s.id === 'string' && s.id) return { state: s, created: false, persisted: true };
  } catch { /* first start */ }
  const state: State = { id: crypto.randomUUID() };
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STATE, JSON.stringify(state));
    return { state, created: true, persisted: true };
  } catch {
    const seed = env.BETTER_AUTH_SECRET || state.id;
    return { state: { id: crypto.createHash('sha256').update(`posy-instance:${seed}`).digest('hex').slice(0, 32) }, created: true, persisted: false };
  }
}
export function saveState(state: State) { try { fs.writeFileSync(STATE, JSON.stringify(state)); } catch { /* read-only: fine */ } }

export const NOTICE = `Posy sends anonymous usage stats (no content, no personal data). Set POSY_TELEMETRY=0 to turn off. Details: ${DOCS_URL}`;

/** Fire-and-forget. Resolves to true if PostHog accepted it; never throws, gives up after 2 seconds. */
export async function send(event: string, distinctId: string, properties: Record<string, unknown>, env: Env = process.env): Promise<boolean> {
  if (!telemetryEnabled(env)) return false;
  try {
    const res = await fetch(`${telemetryHost(env)}/capture/`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        api_key: telemetryKey(env), event, distinct_id: distinctId, timestamp: new Date().toISOString(),
        // No person profile, and ask PostHog not to look up a location from the server's IP.
        properties: { ...properties, $process_person_profile: false, $geoip_disable: true, $lib: 'posy' },
      }),
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch { return false; }
}
