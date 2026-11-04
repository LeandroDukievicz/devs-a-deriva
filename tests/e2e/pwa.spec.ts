import { expect, test } from './fixtures';

// O service worker só é registrado em produção (em dev atrapalharia o HMR),
// então aqui valida-se o que o navegador precisa ler antes de oferecer a
// instalação: o manifesto, os ícones e o convite no layout.

test('o layout aponta para o manifesto e para os ícones do app', async ({ page }) => {
  await page.goto('/manifesto/');

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    '/manifest.webmanifest',
  );
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#020b18');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    'href',
    '/icons/apple-touch-icon.png',
  );
});

test('o manifesto é servido com o content-type certo e ícones acessíveis', async ({
  page,
  request,
}) => {
  await page.goto('/');

  const response = await request.get('/manifest.webmanifest');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/manifest+json');

  const manifest = await response.json();
  expect(manifest.start_url).toBe('/');
  expect(manifest.display).toBe('standalone');

  for (const icon of manifest.icons) {
    const iconResponse = await request.get(icon.src);
    expect(iconResponse.status(), `${icon.src} deveria responder 200`).toBe(200);
  }
});

test('o service worker é servido como JavaScript, sem cache longo', async ({ request }) => {
  const response = await request.get('/sw.js');

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('javascript');
  // Precisa revalidar sempre, senão o app trava numa versão velha do worker.
  // O build serve `max-age=0`; o servidor de dev, `no-cache`.
  expect(response.headers()['cache-control']).toMatch(/no-cache|max-age=0/);
});

test('a página offline abre sozinha, sem depender do CSS do build', async ({ page }) => {
  await page.goto('/offline.html');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('sem conexão');
  await expect(page.getByRole('link', { name: /ir para a home/i })).toBeVisible();
  // Fundo pintado = o CSS inline da própria página foi aplicado.
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(2, 11, 24)');
});

test('o convite de instalação só aparece quando o navegador oferece o prompt', async ({ page }) => {
  await page.goto('/manifesto/');

  // Renderizado no HTML, mas escondido até o beforeinstallprompt disparar.
  await expect(page.locator('#pwa-install')).toBeAttached();
  await expect(page.locator('#pwa-install')).toBeHidden();
});

test('o convite dispensado não volta na navegação seguinte', async ({ page }) => {
  await page.goto('/manifesto/');

  await page.evaluate(() => {
    const banner = document.getElementById('pwa-install');
    banner?.removeAttribute('hidden');
    document.getElementById('pwa-install-dismiss')?.dispatchEvent(new Event('click'));
  });

  await expect(page.locator('#pwa-install')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('dda-pwa-dismissed-v1'))).toBe('true');

  await page.goto('/termos/');
  await expect(page.locator('#pwa-install')).toBeHidden();
});
