import { expect, test } from '@playwright/test';

const CATEGORIAS = [
  { slug: 'tech',           label: 'Tech' },
  { slug: 'carreira',       label: 'Carreira' },
  { slug: 'aleatoriedades', label: 'Aleatoriedades' },
  { slug: 'livros',         label: 'Livros' },
  { slug: 'musica',         label: 'Música' },
  { slug: 'noticias',       label: 'Notícias' },
];

for (const { slug, label } of CATEGORIAS) {
  test(`categoria ${label} carrega com título e contador de posts`, async ({ page }) => {
    await page.goto(`/categorias/${slug}/`);

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.categoria-count')).toBeVisible();
  });
}

test('categoria tech exibe posts ou estado vazio', async ({ page }) => {
  await page.goto('/categorias/tech/');

  const hasPosts = await page.locator('.categoria-post-card, .post-card').count();
  const hasEmpty = await page.locator('.empty-state, [class*="empty"]').count();

  expect(hasPosts + hasEmpty).toBeGreaterThan(0);
});

test('link de post em categoria navega para a página do post', async ({ page }) => {
  await page.goto('/categorias/tech/');

  const postLink = page.locator('a[href^="/posts/"]').first();
  const count = await postLink.count();

  if (count === 0) {
    test.skip();
    return;
  }

  const href = await postLink.getAttribute('href');
  expect(href).toBeTruthy();

  await page.goto(href!);
  await expect(page.locator('article')).toBeVisible();
});
