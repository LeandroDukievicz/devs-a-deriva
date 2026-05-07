import { expect, test } from '@playwright/test';

async function getFirstPostHref(page: import('@playwright/test').Page): Promise<string | null> {
  await page.goto('/');
  const link = page.locator('a[href^="/posts/"]').first();
  if (await link.count() === 0) return null;
  return link.getAttribute('href');
}

// ── Comentários ───────────────────────────────────────────────────────────────

test('seção de comentários é visível na página do post', async ({ page }) => {
  const href = await getFirstPostHref(page);
  if (!href) { test.skip(); return; }

  await page.goto(href);
  await expect(page.locator('#comments')).toBeVisible();
});

test('textarea de comentário aceita input', async ({ page }) => {
  const href = await getFirstPostHref(page);
  if (!href) { test.skip(); return; }

  await page.goto(href);
  const textarea = page.locator('#comments-textarea');
  await expect(textarea).toBeVisible();

  await textarea.fill('Ótimo post!');
  await expect(textarea).toHaveValue('Ótimo post!');
});

test('botão Comentar está presente e habilitado', async ({ page }) => {
  const href = await getFirstPostHref(page);
  if (!href) { test.skip(); return; }

  await page.goto(href);
  const btn = page.locator('#btn-comentar');
  await expect(btn).toBeVisible();
  await expect(btn).toBeEnabled();
});

test('contador de caracteres atualiza ao digitar', async ({ page }) => {
  const href = await getFirstPostHref(page);
  if (!href) { test.skip(); return; }

  await page.goto(href);
  await page.locator('#comments-textarea').fill('Olá!');
  await expect(page.locator('#comments-char-count')).toContainText('4');
});

// ── Newsletter ────────────────────────────────────────────────────────────────

test('formulário de newsletter está presente na página do post', async ({ page }) => {
  const href = await getFirstPostHref(page);
  if (!href) { test.skip(); return; }

  await page.goto(href);
  await expect(page.locator('#newsletter-form')).toBeVisible();
});

test('campo de e-mail da newsletter aceita input', async ({ page }) => {
  const href = await getFirstPostHref(page);
  if (!href) { test.skip(); return; }

  await page.goto(href);
  const emailInput = page.locator('#newsletter-email');
  await expect(emailInput).toBeVisible();

  await emailInput.fill('teste@exemplo.com');
  await expect(emailInput).toHaveValue('teste@exemplo.com');
});

test('botão de submit da newsletter está presente', async ({ page }) => {
  const href = await getFirstPostHref(page);
  if (!href) { test.skip(); return; }

  await page.goto(href);
  await expect(page.locator('.newsletter-btn')).toBeVisible();
});

test('checkbox de consentimento da newsletter existe e pode ser marcado', async ({ page }) => {
  const href = await getFirstPostHref(page);
  if (!href) { test.skip(); return; }

  await page.goto(href);
  const checkbox = page.locator('#newsletter-consent');
  await expect(checkbox).toBeVisible();

  await checkbox.check();
  await expect(checkbox).toBeChecked();
});
