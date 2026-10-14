import { defineConfig } from '@playwright/test';

// The studio test edits a throwaway copy of the page, never content/page.json.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:3211', channel: process.env.CI ? undefined : 'chrome', launchOptions: { args: ['--mute-audio'] } },
  webServer: {
    command: 'mkdir -p .scratch && cp content/page.json .scratch/e2e-page.json && POSY_CONTENT=.scratch/e2e-page.json npx next dev -p 3211',
    url: 'http://localhost:3211',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
