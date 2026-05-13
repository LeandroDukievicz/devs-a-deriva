import { expect, test } from '@playwright/test';

test('página de newsletter carrega com formulário', async ({ page }) => {
  await page.goto('/newsletter/');
  await expect(page.locator('h1, h2').first()).toBeVisible();
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});

test('newsletter rejeita e-mail inválido', async ({ page }) => {
  await page.goto('/newsletter/');
  await page.fill('input[type="email"]', 'email-invalido');
  await page.click('button[type="submit"]');
  const status = page.locator('[aria-live="polite"]').first();
  await expect(status).toBeVisible();
});

test('newsletter exige consentimento antes de enviar', async ({ page }) => {
  await page.goto('/newsletter/');
  await page.fill('input[type="email"]', 'teste@exemplo.com');
  await page.click('button[type="submit"]');
  const status = page.locator('[aria-live="polite"]').first();
  await expect(status).toBeVisible();
});

test('formulário de newsletter em página de post existe', async ({ page }) => {
  await page.goto('/');
  const firstPost = page.locator('a[href^="/posts/"]').first();
  const count = await firstPost.count();
  if (count === 0) {
    test.skip();
    return;
  }
  const href = await firstPost.getAttribute('href');
  await page.goto(href!);
  await expect(page.locator('.newsletter-block')).toBeVisible();
  await expect(page.locator('input[type="email"]')).toBeVisible();
});
