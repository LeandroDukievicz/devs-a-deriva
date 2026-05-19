import { expect, test } from '@playwright/test';

const XSS_PAYLOADS = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)>',
  '"><script>alert(1)</script>',
];

async function getFirstPostHref(page: import('@playwright/test').Page): Promise<string | null> {
  await page.goto('/');
  const link = page.locator('a[href^="/posts/"]').first();
  if (await link.count() === 0) return null;
  return link.getAttribute('href');
}

// Intercepta a chamada ao dashboard e devolve comentário com payload XSS
async function mockCommentWith(page: import('@playwright/test').Page, body: string) {
  await page.route('**/api/comments*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          comments: [
            {
              id: 1,
              authorName: `Hacker <script>alert(1)</script>`,
              authorImage: 'javascript:alert(1)',
              provider: '<img src=x onerror=alert(1)>',
              body,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      }),
    }),
  );
}

for (const payload of XSS_PAYLOADS) {
  test(`XSS no corpo do comentário não executa: ${payload.slice(0, 50)}`, async ({ page }) => {
    const href = await getFirstPostHref(page);
    if (!href) { test.skip(); return; }

    const alerts: string[] = [];
    page.on('dialog', (dialog) => { alerts.push(dialog.message()); dialog.dismiss(); });

    await mockCommentWith(page, payload);
    await page.goto(href);
    await page.waitForSelector('#comments-list li', { timeout: 5000 }).catch(() => null);

    expect(alerts).toHaveLength(0);

    // O payload deve aparecer como texto literal, não como HTML executado
    const textContent = await page.locator('#comments-list').textContent();
    // Se XSS fosse executado, o payload não estaria como texto visível; mas o nó de texto deve conter o payload bruto
    expect(textContent).toContain(payload);
  });
}

test('URL de avatar com javascript: é rejeitada — sem img com src perigoso', async ({ page }) => {
  const href = await getFirstPostHref(page);
  if (!href) { test.skip(); return; }

  const alerts: string[] = [];
  page.on('dialog', (dialog) => { alerts.push(dialog.message()); dialog.dismiss(); });

  await mockCommentWith(page, 'comentário normal');
  await page.goto(href);
  await page.waitForSelector('#comments-list li', { timeout: 5000 }).catch(() => null);

  expect(alerts).toHaveLength(0);

  // Nenhum img deve ter src com javascript: ou data:
  const dangerousSrcs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('#comments-list img')).filter(
      (img) => /^(javascript:|data:)/i.test((img as HTMLImageElement).src),
    ).length,
  );
  expect(dangerousSrcs).toBe(0);
});

test('provider desconhecido não injeta HTML via innerHTML', async ({ page }) => {
  const href = await getFirstPostHref(page);
  if (!href) { test.skip(); return; }

  const alerts: string[] = [];
  page.on('dialog', (dialog) => { alerts.push(dialog.message()); dialog.dismiss(); });

  await mockCommentWith(page, 'payload provider');
  await page.goto(href);
  await page.waitForSelector('#comments-list li', { timeout: 5000 }).catch(() => null);

  expect(alerts).toHaveLength(0);

  // Provider desconhecido não deve gerar nenhum ícone .comment-provider no item
  const iconCount = await page.locator('#comments-list .comment-provider').count();
  expect(iconCount).toBe(0);
});
