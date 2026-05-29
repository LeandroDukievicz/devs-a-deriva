import { expect, test } from '@playwright/test';

test('home carrega e exibe posts ou estado vazio', async ({ page }) => {
  await page.goto('/');
  const firstPost = page.locator('a[href^="/posts/"]').first();
  const emptyState = page.locator('.empty-state');

  if (await firstPost.count() > 0) {
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(firstPost).toBeVisible();
    return;
  }

  await expect(emptyState).toBeVisible();
});

test('página de post abre e exibe conteúdo', async ({ page }) => {
  await page.goto('/');
  const firstPost = page.locator('a[href^="/posts/"]').first();
  if (await firstPost.count() === 0) test.skip();

  const href = await firstPost.getAttribute('href');

  expect(href).toBeTruthy();

  await page.goto(href ?? '/');
  await expect(page.locator('article')).toBeVisible();
  await expect(page.locator('h1')).toBeVisible();
});

test('página de post expõe JSON-LD Article pelo layout específico', async ({ page }) => {
  await page.goto('/');
  const firstPost = page.locator('a[href^="/posts/"]').first();
  if (await firstPost.count() === 0) test.skip();

  const href = await firstPost.getAttribute('href');

  expect(href).toBeTruthy();

  await page.goto(href ?? '/');
  const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) =>
    nodes.map((node) => JSON.parse(node.textContent || '{}'))
  );

  expect(schemas.some((schema) => schema['@type'] === 'Article')).toBe(true);
});
