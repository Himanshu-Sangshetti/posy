// Runs once when the server starts (Node.js only): bring the database schema up to date.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && !process.env.POSY_SKIP_MIGRATE) await import('./instrumentation-node');
}
