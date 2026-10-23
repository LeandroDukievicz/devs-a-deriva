import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      localStorage.setItem('intro_last_shown', new Date().toISOString().slice(0, 10));
      localStorage.setItem('dda-cookie-consent-v1', 'accepted');
    });
    await page.route(/googletagmanager\.com|google-analytics\.com|vercel-insights\.com|vercel-scripts\.com/, route => route.abort());
    await use(page);
  },
});
export { expect };
