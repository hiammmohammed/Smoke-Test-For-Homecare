import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

loadEnv({ path: path.join(__dirname, '.env'), quiet: true });

const baseURL = process.env.E2E_BASE_URL ?? 'https://stage-dashboard.phlebotex.com';

/** Where the signed-in session is kept: the tests sign in ONCE and reuse it. */
export const ADMIN_STATE = path.resolve(__dirname, '.auth/admin.json');

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: Number(process.env.E2E_WORKERS ?? 2),
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    locale: 'en-US',
    timezoneId: 'Asia/Riyadh',
    viewport: { width: 1440, height: 900 },
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'smoke',
      testIgnore: /auth\.setup\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, storageState: ADMIN_STATE }
    }
  ]
});
