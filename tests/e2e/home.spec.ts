import { expect, test } from '@playwright/test';

test('home carrega e exibe pelo menos um post', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1, h2').first()).toBeVisible();
  await expect(page.locator('a[href^="/posts/"]').first()).toBeVisible();
});

test('página de post abre e exibe conteúdo', async ({ page }) => {
  await page.goto('/');
  const firstPost = page.locator('a[href^="/posts/"]').first();
  const href = await firstPost.getAttribute('href');

  expect(href).toBeTruthy();

  await page.goto(href ?? '/');
  await expect(page.locator('article')).toBeVisible();
  await expect(page.locator('h1')).toBeVisible();
});
