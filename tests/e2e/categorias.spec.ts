import { expect, test } from '@playwright/test';

const CATEGORIAS = [
  { slug: 'tech',           label: 'Tech' },
  { slug: 'carreira',       label: 'Carreira' },
  { slug: 'aleatoriedades', label: 'Aleatoriedades' },
  { slug: 'livros',         label: 'Livros' },
  { slug: 'musica',         label: 'Música' },
  { slug: 'noticias',       label: 'Notícias' },
];

// ── Por categoria ────────────────────────────────────────────────────

for (const { slug, label } of CATEGORIAS) {
  test(`[${label}] título da página inclui o nome da categoria`, async ({ page }) => {
    await page.goto(`/categorias/${slug}/`);
    await expect(page).toHaveTitle(new RegExp(label, 'i'));
  });

  test(`[${label}] h1 renderiza com nome da categoria`, async ({ page }) => {
    await page.goto(`/categorias/${slug}/`);
    await expect(page.locator('h1.categoria-title')).toBeVisible();
    await expect(page.locator('h1.categoria-title')).toContainText(label);
  });

  test(`[${label}] contador de posts é visível e formatado`, async ({ page }) => {
    await page.goto(`/categorias/${slug}/`);
    const count = page.locator('.categoria-count');
    await expect(count).toBeVisible();
    await expect(count).toContainText(/\d+ posts?/);
  });

  test(`[${label}] seções destaques e posts estão presentes`, async ({ page }) => {
    await page.goto(`/categorias/${slug}/`);
    await expect(page.locator('.destaques-section')).toBeVisible();
    await expect(page.locator('.posts-section')).toBeVisible();
  });

  test(`[${label}] exibe posts ou estado vazio`, async ({ page }) => {
    await page.goto(`/categorias/${slug}/`);
    const postCount = await page.locator('.post-card').count();
    const emptyCount = await page.locator('.empty-state').count();
    expect(postCount + emptyCount).toBeGreaterThan(0);
  });
}

// ── Estrutura dos post cards ─────────────────────────────────────────

test('post cards têm tag, título e excerpt visíveis', async ({ page }) => {
  await page.goto('/categorias/tech/');
  const firstCard = page.locator('.post-card').first();
  if (await firstCard.count() === 0) test.skip();

  await expect(firstCard.locator('.card-tag')).toBeVisible();
  await expect(firstCard.locator('.post-card-title')).toBeVisible();
  await expect(firstCard.locator('.post-card-excerpt')).toBeVisible();
});

test('post cards têm link com href para /posts/', async ({ page }) => {
  await page.goto('/categorias/tech/');
  const firstCard = page.locator('.post-card[href^="/posts/"]').first();
  if (await firstCard.count() === 0) test.skip();

  const href = await firstCard.getAttribute('href');
  expect(href).toMatch(/^\/posts\//);
});

// ── Carousel ─────────────────────────────────────────────────────────

test('carousel tem botões de navegação com aria-label', async ({ page }) => {
  await page.goto('/categorias/tech/');
  await expect(page.locator('#carousel-prev')).toHaveAttribute('aria-label', 'Anterior');
  await expect(page.locator('#carousel-next')).toHaveAttribute('aria-label', 'Próximo');
});

test('carousel botão prev começa desabilitado no índice zero', async ({ page }) => {
  await page.goto('/categorias/tech/');
  const featuredCount = await page.locator('.feat-card').count();
  if (featuredCount < 2) test.skip();

  await expect(page.locator('#carousel-prev')).toBeDisabled();
});

test('carousel avança ao clicar em próximo e habilita prev', async ({ page }) => {
  await page.goto('/categorias/tech/');
  const nextBtn = page.locator('#carousel-next');
  const prevBtn = page.locator('#carousel-prev');
  const featuredCount = await page.locator('.feat-card').count();
  if (featuredCount < 2) test.skip();

  if (await nextBtn.isDisabled()) test.skip();

  await nextBtn.click();
  await expect(prevBtn).not.toBeDisabled();
});

test('carousel volta ao início ao clicar em anterior após avançar', async ({ page }) => {
  await page.goto('/categorias/tech/');
  const nextBtn = page.locator('#carousel-next');
  const prevBtn = page.locator('#carousel-prev');
  const featuredCount = await page.locator('.feat-card').count();
  if (featuredCount < 2) test.skip();

  if (await nextBtn.isDisabled()) test.skip();

  await nextBtn.click();
  await prevBtn.click();
  await expect(prevBtn).toBeDisabled();
});

test('carousel dots renderizam e o primeiro começa ativo', async ({ page }) => {
  await page.goto('/categorias/tech/');
  const dots = page.locator('#carousel-dots .dot');
  const dotCount = await dots.count();
  if (dotCount === 0) test.skip();

  await expect(dots.first()).toHaveClass(/active/);
});

// ── Navegação ────────────────────────────────────────────────────────

test('link de post em categoria navega para a página do post', async ({ page }) => {
  await page.goto('/categorias/tech/');
  const postLink = page.locator('a[href^="/posts/"]').first();
  if (await postLink.count() === 0) test.skip();

  const href = await postLink.getAttribute('href');
  await page.goto(href!);
  await expect(page.locator('article')).toBeVisible();
  await expect(page.locator('h1')).toBeVisible();
});

// ── Meta / SEO ───────────────────────────────────────────────────────

test('categoria tech tem link canonical apontando para a rota correta', async ({ page }) => {
  await page.goto('/categorias/tech/');
  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute('href', /\/categorias\/tech/);
});

test('categoria tech tem og:title no head', async ({ page }) => {
  await page.goto('/categorias/tech/');
  const ogTitle = page.locator('meta[property="og:title"]');
  await expect(ogTitle).toHaveAttribute('content', /Tech/i);
});
