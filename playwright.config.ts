import { defineConfig, devices } from '@playwright/test';

const external = Boolean(process.env.PLAYWRIGHT_BASE_URL);

export default defineConfig({
  testDir: 'tests/e2e',
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4322',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    reducedMotion: 'reduce',
    launchOptions: { channel: process.env.PLAYWRIGHT_CHANNEL },
  },
  webServer: external ? undefined : [
    { command: 'node tests/fixtures/dashboard.mjs', url: 'http://127.0.0.1:3001/health', reuseExistingServer: !process.env.CI },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 4322 --ignore-lock',
      url: 'http://127.0.0.1:4322',
      env: { PUBLIC_DASHBOARD_URL: 'http://127.0.0.1:3001', PLAYWRIGHT_TEST: '1' },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 1000 } },
    },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
});
