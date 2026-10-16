import { z } from 'zod';

/**
 * Environment validation, run once when the server boots (src/instrumentation.ts).
 * Development is forgiving (everything has a default); production refuses to start on a missing,
 * placeholder or insecure setting and says exactly what to change.
 * Pure on purpose: pass any env object in, so it is easy to test.
 */

/** The fallback secret in src/lib/auth.ts. Fine for a laptop, never for a server. */
export const DEV_AUTH_SECRET = 'dev-only-secret-change-me-in-production-0123456789';
/** The placeholder in docker-compose.yml. */
export const COMPOSE_PLACEHOLDER = 'change-me-to-a-long-random-string';

type Env = Record<string, string | undefined>;
export type EnvReport = { ok: boolean; errors: string[]; warnings: string[]; production: boolean };

const blank = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const optional = z.preprocess(blank, z.string().optional());
const url = z.preprocess(blank, z.string().url('must be a full URL such as https://links.example.com').refine(u => /^https?:\/\//.test(u), 'must start with http:// or https://').optional());

const Schema = z.object({
  NEXT_PUBLIC_SITE_URL: url,
  BETTER_AUTH_URL: url,
  BETTER_AUTH_SECRET: optional,
  DATABASE_URL: optional,
  DATABASE_AUTH_TOKEN: optional,
  BLOB_READ_WRITE_TOKEN: optional,
  POSY_SIGNUP: z.preprocess(blank, z.enum(['first-user', 'open', 'closed'], { message: 'must be first-user, open or closed' }).optional()),
  POSY_DATA_DIR: optional,
  GITHUB_CLIENT_ID: optional, GITHUB_CLIENT_SECRET: optional,
  GOOGLE_CLIENT_ID: optional, GOOGLE_CLIENT_SECRET: optional,
  GITHUB_TOKEN: optional,
});

const REMOTE_DB = /^(libsql|https?|wss?):\/\//;

/** Check an environment. Never throws. `production` defaults to NODE_ENV === 'production'. */
export function checkEnv(env: Env = process.env, opts: { production?: boolean } = {}): EnvReport {
  const production = opts.production ?? env.NODE_ENV === 'production';
  const errors: string[] = [];
  const warnings: string[] = [];

  const parsed = Schema.safeParse(env);
  if (!parsed.success) {
    for (const i of parsed.error.issues) errors.push(`${String(i.path[0])}: ${i.message}. Fix it in your .env (see .env.example).`);
  }
  const v = parsed.success ? parsed.data : ({} as z.infer<typeof Schema>);

  // Half-configured social sign-in is almost always a typo, in any mode.
  for (const [name, id, secret] of [['GitHub', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'], ['Google', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']] as const) {
    if (!!env[id]?.trim() !== !!env[secret]?.trim()) warnings.push(`${name} sign-in needs both ${id} and ${secret}; with only one set it stays switched off.`);
  }
  if (v.DATABASE_URL && REMOTE_DB.test(v.DATABASE_URL) && !v.DATABASE_URL.startsWith('file:') && !v.DATABASE_AUTH_TOKEN && !/localhost|127\.0\.0\.1/.test(v.DATABASE_URL)) {
    (production ? errors : warnings).push('DATABASE_AUTH_TOKEN: a remote DATABASE_URL (Turso / libSQL) needs its token. Create one with `turso db tokens create <db>`.');
  }

  if (!production) return { ok: errors.length === 0, errors, warnings, production };

  // The e2e suite runs a production build with a throwaway database and no secrets.
  if (env.POSY_E2E) return { ok: errors.length === 0, errors, warnings, production };

  const secret = v.BETTER_AUTH_SECRET;
  if (!secret) errors.push('BETTER_AUTH_SECRET is missing. Generate one with `openssl rand -base64 32` and set it.');
  else if (secret === DEV_AUTH_SECRET) errors.push('BETTER_AUTH_SECRET is the built-in development secret. Generate your own with `openssl rand -base64 32`.');
  else if (secret === COMPOSE_PLACEHOLDER || /change-?me/i.test(secret)) errors.push(`BETTER_AUTH_SECRET is still the placeholder (${COMPOSE_PLACEHOLDER}). Generate your own with \`openssl rand -base64 32\`.`);
  else if (secret.length < 32) errors.push('BETTER_AUTH_SECRET is too short (under 32 characters). Generate one with `openssl rand -base64 32`.');

  if (!v.NEXT_PUBLIC_SITE_URL) errors.push('NEXT_PUBLIC_SITE_URL is missing. Set it to your public URL, e.g. https://links.example.com (before `npm run build`, it is baked into the build).');
  if (!v.BETTER_AUTH_URL) errors.push('BETTER_AUTH_URL is missing. Set it to the same public URL as NEXT_PUBLIC_SITE_URL.');
  if (v.NEXT_PUBLIC_SITE_URL && v.BETTER_AUTH_URL) {
    const a = new URL(v.NEXT_PUBLIC_SITE_URL), b = new URL(v.BETTER_AUTH_URL);
    if (a.protocol !== b.protocol || a.host !== b.host) errors.push(`NEXT_PUBLIC_SITE_URL (${a.origin}) and BETTER_AUTH_URL (${b.origin}) must use the same scheme and host.`);
  }
  for (const u of [v.NEXT_PUBLIC_SITE_URL, v.BETTER_AUTH_URL]) {
    if (u && u.startsWith('http://') && !/\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(u)) { warnings.push(`${u} is plain http. Put HTTPS in front of Posy (sessions use secure cookies on https).`); break; }
  }

  if (env.VERCEL) {
    if (!v.DATABASE_URL || !REMOTE_DB.test(v.DATABASE_URL)) errors.push('DATABASE_URL must be a Turso / libSQL URL on Vercel (the file system is read-only and temporary). Create a database with `turso db create posy`.');
    if (!v.BLOB_READ_WRITE_TOKEN) warnings.push('BLOB_READ_WRITE_TOKEN is not set, so image uploads will fail on Vercel. Add a Blob store to the project.');
  }
  return { ok: errors.length === 0, errors, warnings, production };
}

export function formatEnvReport(r: EnvReport): string {
  const lines: string[] = [];
  if (r.errors.length) {
    lines.push('', `Posy can't start: ${r.errors.length} problem${r.errors.length > 1 ? 's' : ''} with the environment.`, '');
    r.errors.forEach(e => lines.push(`  ✖ ${e}`));
    lines.push('', 'Every variable is listed in .env.example and docs/self-hosting.md.', '');
  }
  r.warnings.forEach(w => lines.push(`  ! ${w}`));
  return lines.join('\n');
}

/** Called once at server start. Throws (so the process exits) in production; warns in development. */
export function validateEnvOnBoot(env: Env = process.env) {
  // `next build` imports the app with the build machine's env; the real check is when the server starts.
  if (env.NEXT_PHASE === 'phase-production-build') return;
  const r = checkEnv(env);
  const msg = formatEnvReport(r);
  if (!r.ok) {
    if (r.production) throw new Error(msg);
    console.warn(msg);
  } else if (msg) console.warn(msg);
}
