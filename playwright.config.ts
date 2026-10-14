import { defineConfig } from '@playwright/test';

// Runs against a throwaway database in .scratch/e2e-data (never your real data).
const env = 'POSY_DATA_DIR=.scratch/e2e-data POSY_SIGNUP=open POSY_RATE_LIMIT=off NEXT_PUBLIC_SITE_URL=http://localhost:3211';
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://localhost:3211', channel: process.env.CI ? undefined : 'chrome', launchOptions: { args: ['--mute-audio'] } },
  webServer: {
    // Production build: stable and close to what visitors get. Migrations run on start (instrumentation.ts).
    command: `rm -rf .scratch/e2e-data && mkdir -p .scratch/e2e-data && ${env} npx next build && ${env} npx next start -p 3211`,
    url: 'http://localhost:3211/api/v1/username?check=ping',
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
