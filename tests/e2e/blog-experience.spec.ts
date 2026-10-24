import { readFile } from 'node:fs/promises';
import type { APIRequestContext } from '@playwright/test';
import { expect, test } from './fixtures';

type Post = { slug: string; publishedAt: string; categorySlug: string };
async function allPosts(request: APIRequestContext): Promise<Post[]> {
  const posts: Post[] = [];
  let current = 1;
  let total = 1;
  do {
    const response = await request.get(`/api/posts.json?page=${current}&limit=20`);
    expect(response.ok()).toBe(true);
    const body = await response.json();
    posts.push(...body.posts);
    total = body.totalPages;
  } while (++current <= total);
  return posts;
}

test('carrossel inclui todos os posts; grade mantém seis artigos em ordem de publicação', async ({ page, request }) => {
  const posts = await allPosts(request);
  await page.goto('/');
  await expect(page.locator('post-carousel')).toHaveAttribute('data-ready', '');
  const slugs = await page.locator('.carousel-card').evaluateAll(cards => cards.map(card => card.getAttribute('data-carousel-slug')));
  expect(slugs.sort()).toEqual(posts.map(post => post.slug).sort());
  const feedSlugs = await page.locator('.content-section').evaluateAll(cards => cards.map(card => card.getAttribute('data-post-slug')));
  expect(feedSlugs).toEqual(posts.slice(0, 6).map(post => post.slug));
  expect(posts.map(post => post.slug)).not.toContain('artigo-agendado');
  await expect(page.locator('.pagination [aria-current="page"]')).toHaveText('1');
  await expect(page.locator('.pagination .disabled').first()).toContainText('Anterior');
});

test('carrossel percorre todo o catálogo e embaralha a próxima volta sem alterar a grade', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('.carousel-card');
  const total = await cards.count();
  const visibleCount = await page.locator('.carousel-card[aria-hidden="false"]').count();
  const seen = new Set<string>();
  const feed = await page.locator('.content-section').allTextContents();
  for (let step = 0; step <= total - visibleCount; step++) {
    for (const slug of await page.locator('.carousel-card[aria-hidden="false"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-carousel-slug')!))) seen.add(slug);
    await page.getByRole('button', { name: 'Próximo artigo', exact: true }).click();
  }
  expect(seen.size).toBe(total);
  await expect(page.locator('[data-position]')).toContainText('01');
  const nextDeck = await cards.evaluateAll(nodes => nodes.map(node => node.getAttribute('data-carousel-slug')));
  expect(new Set(nextDeck).size).toBe(total);
  expect(await page.locator('.content-section').allTextContents()).toEqual(feed);
});

test('carrossel responde às setas e deixa apenas os cards visíveis acessíveis ao teclado', async ({ page }) => {
  await page.goto('/');
  const first = await page.locator('.carousel-card[aria-hidden="false"]').first().getAttribute('data-carousel-slug');
  const next = page.getByRole('button', { name: 'Próximo artigo', exact: true });
  await next.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.carousel-card[aria-hidden="false"]').first()).not.toHaveAttribute('data-carousel-slug', first!);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.carousel-card[aria-hidden="false"]').first()).toHaveAttribute('data-carousel-slug', first!);
  expect(await page.locator('.carousel-card[aria-hidden="true"]').evaluateAll(cards => cards.every(card => (card as HTMLElement).inert))).toBe(true);
});

test('movimento reduzido mantém o carrossel pausado e permite navegação manual', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Retomar carrossel' })).toBeVisible();
  await page.getByRole('button', { name: 'Próximo artigo', exact: true }).click();
  await expect(page.locator('[data-position]')).toContainText('02');
});

test('carrossel avança automaticamente e pausa durante leitura e por escolha do visitante', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install();
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Pausar carrossel' })).toBeVisible();
  await page.clock.fastForward(6500);
  await expect(page.locator('[data-position]')).toContainText('02');
  await page.locator('post-carousel').hover();
  const position = await page.locator('[data-position]').textContent();
  await page.clock.fastForward(7000);
  await expect(page.locator('[data-position]')).toHaveText(position!);
  await page.getByRole('button', { name: 'Pausar carrossel' }).click();
  await page.mouse.move(0, 0);
  await page.locator('#carousel-heading').click();
  await page.clock.fastForward(7000);
  await expect(page.locator('[data-position]')).toHaveText(position!);
});

test('layout mostra dois destaques no desktop, um no celular e grade sem transbordamento', async ({ page }) => {
  await page.goto('/');
  const width = page.viewportSize()!.width;
  await expect(page.locator('.carousel-card[aria-hidden="false"]')).toHaveCount(width > 1100 ? 2 : 1);
  const columns = await page.locator('.posts-grid').evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length);
  expect(columns).toBe(width > 1100 ? 3 : width > 640 ? 2 : 1);
  for (const selector of ['.carousel-card[aria-hidden="false"] img', '.content-section .section-img']) {
    expect(await page.locator(selector).evaluateAll(nodes => nodes.every(node => node.getBoundingClientRect().width > 0))).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('paleta ciano e magenta permanece consistente no desktop e no celular', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.carousel-category').first()).toHaveCSS('color', 'rgb(232, 0, 212)');
  await expect(page.locator('.category-badge').first()).toHaveCSS('color', 'rgb(232, 0, 212)');
  await expect(page.locator('.category-pill span').first()).toHaveCSS('color', 'rgb(0, 212, 232)');
});

test('página seguinte preserva a grade e oferece links reais sem duplicar posts', async ({ page }) => {
  await page.goto('/');
  const firstPage = await page.locator('.content-section').evaluateAll(cards => cards.map(card => card.getAttribute('data-post-slug')));
  await page.getByRole('link', { name: 'Próxima página', exact: true }).click();
  await expect(page).toHaveURL(/\/page\/2\/$/);
  await expect(page.locator('.content-section')).toHaveCount(6);
  const secondPage = await page.locator('.content-section').evaluateAll(cards => cards.map(card => card.getAttribute('data-post-slug')));
  expect(secondPage.some(slug => firstPage.includes(slug))).toBe(false);
  await expect(page.locator('.pagination [aria-current="page"]')).toHaveText('2');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('link[rel="prev"]')).toHaveAttribute('href', 'https://devsaderiva.com.br/');
  await page.getByRole('link', { name: 'Página anterior', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.content-section')).toHaveCount(6);
});

test('última página exibe apenas os artigos restantes e não oferece próxima página', async ({ page, request }) => {
  const posts = await allPosts(request);
  const last = Math.ceil(posts.length / 6);
  await page.goto(`/page/${last}/`);
  await expect(page.locator('.content-section')).toHaveCount(posts.length % 6 || 6);
  await expect(page.locator('.pagination .disabled')).toContainText('Próxima');
  await page.goto('/page/999/');
  await expect(page).toHaveURL(new RegExp(`/page/${last}/$`));
});

test('rodapé permite explorar categorias e mostra contagens do catálogo publicado', async ({ page, request }) => {
  const posts = await allPosts(request);
  await page.goto('/');
  const footer = page.locator('footer.site-footer');
  await expect(footer.getByRole('heading', { name: 'Explore' })).toBeVisible();
  await expect(footer.locator('.category-pill').first()).toContainText(`(${posts.length})`);
  for (const pill of await footer.locator('[data-category]').all()) {
    const category = await pill.getAttribute('data-category');
    await expect(pill).toContainText(`(${posts.filter(post => post.categorySlug === category).length})`);
    await expect(pill).toHaveAttribute('href', `/categorias/${category}/`);
  }
  await footer.locator('[data-category="tech"]').click();
  await expect(page).toHaveURL(/\/categorias\/tech\/$/);
  await expect(page.locator('h1')).toContainText('Tech');
});

test('post oferece download de um PDF real sem sair da leitura', async ({ page }) => {
  test.setTimeout(45_000);
  await page.goto('/');
  const href = await page.locator('.post-card-link').first().getAttribute('href');
  await page.goto(href!);
  const url = page.url();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Baixar PDF', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^devs-a-deriva-.+\.pdf$/);
  const bytes = await readFile((await download.path())!);
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  await expect(page.locator('.post-pdf-status')).toHaveText('Download iniciado.');
  expect(page.url()).toBe(url);
});

test('erro no PDF permite tentar novamente e mantém o artigo aberto', async ({ page }) => {
  await page.goto('/');
  await page.goto((await page.locator('.post-card-link').first().getAttribute('href'))!);
  const url = page.url();
  await page.route('**/posts/*/pdf', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"unavailable"}' }));
  await page.getByRole('link', { name: 'Baixar PDF', exact: true }).click();
  await expect(page.locator('.post-pdf-status')).toContainText('Tente novamente');
  await expect(page.getByRole('link', { name: 'Baixar PDF', exact: true })).not.toHaveAttribute('aria-busy');
  expect(page.url()).toBe(url);
});

test('paginação e leitura continuam disponíveis sem JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.content-section')).toHaveCount(6);
  await expect(page.locator('.post-card-link').first()).toBeVisible();
  await page.getByRole('link', { name: 'Próxima página', exact: true }).click();
  await expect(page.locator('.pagination [aria-current="page"]')).toHaveText('2');
  await page.locator('.post-card-link').first().click();
  await expect(page.getByRole('link', { name: 'Baixar PDF', exact: true })).toBeVisible();
  await context.close();
});

test('primeira visita mostra a abertura em vídeo e permite entrar na home', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  const introVideoRequests: string[] = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.pathname.includes('astronaut-intro-v1') && url.pathname.endsWith('.mp4')) {
      introVideoRequests.push(request.url());
    }
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const viewport = page.viewportSize();
  if (viewport && (viewport.width < 600 || viewport.height < 600)) {
    await expect(page.locator('#daily-video-intro')).not.toBeVisible();
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.locator('.post-card-link').first()).toBeVisible();
    expect(introVideoRequests).toHaveLength(0);
    await context.close();
    return;
  }

  await expect(page.locator('#daily-video-intro')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('html')).toHaveAttribute('data-daily-intro-ready', 'true');
  await expect(page.locator('#main-content')).not.toBeVisible();
  await page.getByRole('button', { name: 'Pular abertura' }).click();
  await expect(page.locator('post-carousel')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('.post-card-link').first()).toBeVisible();
  await context.close();
});
