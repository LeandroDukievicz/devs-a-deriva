import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      localStorage.setItem('intro_last_shown', today);
      localStorage.setItem('dda-cookie-consent-v1', 'accepted');
    });
    await page.route(/googletagmanager\.com|google-analytics\.com|vercel-insights\.com|vercel-scripts\.com/, route => route.abort());
    await use(page);
  },
});
export { expect };
