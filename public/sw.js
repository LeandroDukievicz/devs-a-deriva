/**
 * Service worker do Devs à Deriva.
 *
 * Só faz cache em runtime — não existe manifesto de precache gerado no build.
 * Assim o mesmo arquivo serve a Vercel e o VPS sem etapa extra, e um deploy
 * novo nunca deixa o app preso numa lista de assets que já não existe.
 *
 *   navegação  → network-first: o HTML vem do SSR e precisa estar fresco.
 *                Sem rede, cai na última versão vista e depois em /offline.html
 *   /_astro/   → cache-first: os nomes têm hash, o conteúdo nunca muda
 *   imagens    → stale-while-revalidate, com teto de entradas
 *   resto      → direto pra rede
 *
 * Ao mudar a lógica aqui, suba CACHE_VERSION: o activate apaga tudo que não
 * pertence à versão corrente.
 */

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `dda-shell-${CACHE_VERSION}`;
const PAGE_CACHE = `dda-pages-${CACHE_VERSION}`;
const ASSET_CACHE = `dda-assets-${CACHE_VERSION}`;
const IMAGE_CACHE = `dda-images-${CACHE_VERSION}`;
const CURRENT_CACHES = [SHELL_CACHE, PAGE_CACHE, ASSET_CACHE, IMAGE_CACHE];

const OFFLINE_URL = '/offline.html';

/** O mínimo pra desenhar a página offline sem rede nenhuma. */
const SHELL_URLS = [OFFLINE_URL, '/helmet.svg', '/manifest.webmanifest', '/icons/icon-192.png'];

const PAGE_LIMIT = 40;
const IMAGE_LIMIT = 60;
const MAX_CACHEABLE_BYTES = 3_000_000;

/** Nunca entram em cache: dado vivo, sessão, binário grande ou o próprio SW. */
const NEVER_CACHE = [
  /^\/api\//,
  /^\/admin\//,
  /^\/sw\.js$/,
  /^\/health\.json$/,
  /^\/ai-index\.json$/,
  /^\/sitemap\.xml$/,
  /^\/rss\.xml$/,
  /\/pdf$/,
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function isCacheable(response) {
  // 'basic' = mesma origem. Resposta opaca de terceiro não dá pra validar.
  return Boolean(response) && response.status === 200 && response.type === 'basic';
}

function isTooLarge(response) {
  const length = Number(response.headers.get('content-length'));
  return Number.isFinite(length) && length > MAX_CACHEABLE_BYTES;
}

/** Descarta as entradas mais antigas até o cache caber em `limit`. */
async function trimCache(cacheName, limit) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const excess = keys.length - limit;
  for (let i = 0; i < excess; i += 1) await cache.delete(keys[i]);
}

async function precacheShell() {
  const cache = await caches.open(SHELL_CACHE);

  // Um por um em vez de addAll(): addAll é tudo-ou-nada, e um único 404
  // derrubaria a instalação inteira do service worker.
  await Promise.all(
    SHELL_URLS.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => {})),
  );
}

// ── Estratégias ─────────────────────────────────────────────────────────────

async function networkFirst(request) {
  const cache = await caches.open(PAGE_CACHE);

  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      await cache.put(request, response.clone());
      await trimCache(PAGE_CACHE, PAGE_LIMIT);
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;

    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;

    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheable(response) && !isTooLarge(response)) {
    await cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(event, cacheName, limit) {
  const { request } = event;
  const cache = await caches.open(cacheName);
  // Procura no cache próprio e, se não achar, em qualquer outro (o shell
  // guarda /helmet.svg, que a página offline precisa).
  const cached = (await cache.match(request)) ?? (await caches.match(request));

  const fromNetwork = fetch(request).then(async (response) => {
    if (isCacheable(response) && !isTooLarge(response)) {
      await cache.put(request, response.clone());
      await trimCache(cacheName, limit);
    }
    return response;
  });

  if (!cached) return fromNetwork;

  // Já temos resposta: a revalidação segue viva fora do respondWith().
  event.waitUntil(fromNetwork.catch(() => {}));
  return cached;
}

// ── Ciclo de vida ───────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(precacheShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith('dda-') && !CURRENT_CACHES.includes(name))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;
  // Range = streaming de vídeo. Cache de resposta parcial (206) é proibido.
  if (request.headers.has('range')) return;
  if (request.destination === 'video' || request.destination === 'audio') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (NEVER_CACHE.some((pattern) => pattern.test(url.pathname))) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname.startsWith('/_astro/')) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(staleWhileRevalidate(event, IMAGE_CACHE, IMAGE_LIMIT));
  }
});
