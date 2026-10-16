// Runs once when the server starts (Node.js only): check the environment, bring the database schema up to date,
// then start anonymous usage stats (self-hosted only, opt-out: see docs/telemetry.md).
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  (await import('./lib/env')).validateEnvOnBoot();
  if (!process.env.POSY_SKIP_MIGRATE) await import('./instrumentation-node');
  if ((await import('./edition')).edition.id === 'self-hosted') await (await import('./lib/telemetry-runtime')).startTelemetry();
}
