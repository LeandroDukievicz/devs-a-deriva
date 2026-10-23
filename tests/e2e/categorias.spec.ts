import { expect, test } from './fixtures';

const categories = [
  { slug: 'tech', label: 'Tech' },
  { slug: 'carreira', label: 'Carreira' },
  { slug: 'aleatoriedades', label: 'Aleatoriedades' },
  { slug: 'livros', label: 'Livros' },
  { slug: 'musica', label: 'Música' },
  { slug: 'noticias', label: 'Notícias' },
];

for (const { slug, label } of categories) {
  test(`[${label}] usa o carrossel e a grade do novo layout`, async ({ page, request }) => {
    const response = await request.get('/api/posts.json?limit=20');
    const { posts } = await response.json();
    const categoryPosts = posts.filter((post: { categorySlug: string }) => post.categorySlug === slug);
    await page.goto(`/categorias/${slug}/`);

    await expect(page).toHaveTitle(new RegExp(label, 'i'));
    await expect(page.locator('h1.categoria-title')).toContainText(label);
    await expect(page.locator('.categoria-count')).toContainText(`${categoryPosts.length} ${categoryPosts.length === 1 ? 'post' : 'posts'}`);
    await expect(page.locator('.post-feed')).toBeVisible();
    await expect(page.locator('.post-feed h2')).toContainText('Posts de');
    await expect(page.locator('.content-section')).toHaveCount(Math.min(6, categoryPosts.length));
    expect(await page.locator('.content-section').evaluateAll(cards => cards.map(card => card.getAttribute('data-post-slug'))))
      .toEqual(categoryPosts.slice(0, 6).map((post: { slug: string }) => post.slug));
    expect(await page.locator('.carousel-card').evaluateAll(cards => cards.map(card => card.getAttribute('data-carousel-slug')).sort()))
      .toEqual(categoryPosts.map((post: { slug: string }) => post.slug).sort());
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`/categorias/${slug}/$`));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('categoria com mais de seis posts mantém paginação e links de leitura', async ({ page }) => {
  await page.goto('/categorias/tech/');
  await expect(page.locator('.content-section')).toHaveCount(6);
  const firstPage = await page.locator('.content-section').evaluateAll(cards => cards.map(card => card.getAttribute('data-post-slug')));
  await expect(page.locator('.pagination [aria-current="page"]')).toHaveText('1');
  await expect(page.locator('link[rel="next"]')).toHaveAttribute('href', /\/categorias\/tech\/pagina\/2\/$/);
  await page.getByRole('link', { name: 'Próxima página' }).click();
  await expect(page).toHaveURL(/\/categorias\/tech\/pagina\/2\/$/);
  await expect(page.locator('.content-section')).toHaveCount(2);
  await expect(page.locator('.pagination [aria-current="page"]')).toHaveText('2');
  await expect(page.locator('post-carousel')).toHaveCount(0);
  await expect(page.locator('link[rel="prev"]')).toHaveAttribute('href', /\/categorias\/tech\/$/);
  const secondPage = await page.locator('.content-section').evaluateAll(cards => cards.map(card => card.getAttribute('data-post-slug')));
  expect(secondPage.some(slug => firstPage.includes(slug))).toBe(false);
  await expect(page.locator('.post-card-link').first()).toHaveAttribute('href', /\?from=category$/);
  await page.getByRole('link', { name: 'Página anterior' }).click();
  await expect(page).toHaveURL(/\/categorias\/tech\/$/);
});

test('navegação principal e rodapé abrem categorias com o mesmo layout', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Categorias' }).click();
  await page.locator('#cat-menu').getByRole('menuitem', { name: 'Tech' }).click();
  await expect(page).toHaveURL(/\/categorias\/tech\/?$/);
  await expect(page.locator('post-carousel')).toBeVisible();
  await expect(page.locator('.posts-grid')).toBeVisible();
  await page.locator('footer.site-footer [data-category="carreira"]').click();
  await expect(page).toHaveURL(/\/categorias\/carreira\/$/);
  await expect(page.locator('post-carousel')).toBeVisible();
  await expect(page.locator('.posts-grid')).toBeVisible();
});

test('carrossel da categoria navega entre todos os seus posts', async ({ page }) => {
  await page.goto('/categorias/tech/');
  await expect(page.locator('post-carousel')).toHaveAttribute('data-ready', '');
  const first = await page.locator('.carousel-card[aria-hidden="false"]').first().getAttribute('data-carousel-slug');
  await page.getByRole('button', { name: 'Próximo artigo', exact: true }).click();
  await expect(page.locator('.carousel-card[aria-hidden="false"]').first()).not.toHaveAttribute('data-carousel-slug', first!);
  await expect(page.locator('.carousel-card-link').first()).toHaveAttribute('href', /\?from=category$/);
});

test('categoria mantém leitura e paginação sem JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/categorias/tech/');
  await expect(page.locator('.content-section')).toHaveCount(6);
  await page.getByRole('link', { name: 'Próxima página' }).click();
  await expect(page).toHaveURL(/\/categorias\/tech\/pagina\/2\/$/);
  await expect(page.locator('.content-section')).toHaveCount(2);
  await expect(page.locator('.post-card-link').first()).toHaveAttribute('href', /\?from=category$/);
  await context.close();
});
