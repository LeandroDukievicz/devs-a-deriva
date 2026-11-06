import { expect, test } from './fixtures';

test('gera e copia o artigo completo para o blog do Énóis', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (text: string) => { (window as unknown as { copiedHtml: string }).copiedHtml = text; } },
    });
  });
  await page.goto('/posts/artigo-de-teste-1');
  await page.locator('.post-body').evaluate((body) => {
    body.insertAdjacentHTML('beforeend', '<p><a href="/manifesto">Referência interna</a><img src="/teste.png" alt="Teste"></p>');
  });
  await page.getByRole('button', { name: 'Gerar HTML para o Énóis' }).click();
  const field = page.getByLabel('HTML do post');
  await expect(field).toBeVisible();
  const html = await field.inputValue();
  expect(html).toContain('Artigo de teste 1: uma nova leitura em órbita');
  expect(html).toContain('Último parágrafo do artigo, com acentuação');
  expect(html).toContain('https://devsaderiva.com.br/manifesto');
  expect(html).toContain('https://devsaderiva.com.br/teste.png');
  expect(html).toContain('https://devsaderiva.com.br/posts/artigo-de-teste-1');
  expect(html).toContain('class="dda-header"');
  expect(html).toContain('#e800d4');
  expect(html).not.toContain('<script');
  await page.getByRole('button', { name: 'Copiar HTML' }).click();
  await expect(page.locator('.enois-status')).toContainText('HTML copiado');
  expect(await page.evaluate(() => (window as unknown as { copiedHtml: string }).copiedHtml)).toBe(html);
});

test('avisa quando o HTML ultrapassa o limite do blog do Énóis', async ({ page }) => {
  await page.goto('/posts/artigo-de-teste-1');
  await page.locator('.post-body').evaluate((body) => { body.textContent = 'a'.repeat(20_001); });
  await page.getByRole('button', { name: 'Gerar HTML para o Énóis' }).click();
  await expect(page.locator('.enois-status')).toContainText('limite de 20 mil caracteres');
  await expect(page.getByLabel('HTML do post')).toHaveValue(/aaaaaa/);
});

test('mantém o HTML selecionável quando a área de transferência falha', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => { throw new Error('Indisponível'); } },
    });
  });
  await page.goto('/posts/artigo-de-teste-1');
  await page.getByRole('button', { name: 'Gerar HTML para o Énóis' }).click();
  await page.getByRole('button', { name: 'Copiar HTML' }).click();
  await expect(page.locator('.enois-status')).toContainText('manualmente');
  await expect(page.getByLabel('HTML do post')).toBeFocused();
});
