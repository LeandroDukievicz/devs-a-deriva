/**
 * Exercita public/sw.js de verdade: o arquivo é avaliado dentro de um
 * runtime de service worker falso (caches, clients, fetch) e os eventos são
 * disparados na mão. Assim as estratégias de cache ficam cobertas sem browser.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createContext, runInContext } from 'node:vm';

const ORIGIN = 'https://devsaderiva.com.br';
const SOURCE = readFileSync(resolve('public/sw.js'), 'utf8');

// ── Runtime falso ────────────────────────────────────────────────────────────

type SwRequest = {
  url: string;
  method: string;
  mode: string;
  destination: string;
  headers: Headers;
};

function makeRequest(path: string, overrides: Partial<SwRequest> = {}): SwRequest {
  return {
    url: new URL(path, ORIGIN).href,
    method: 'GET',
    mode: 'no-cors',
    destination: '',
    headers: new Headers(),
    ...overrides,
  };
}

/** Resposta de mesma origem: o sw.js só cacheia quando `type === 'basic'`. */
function makeResponse(body: string, init: ResponseInit & { type?: string } = {}) {
  const response = new Response(body, { status: init.status ?? 200, headers: init.headers });
  Object.defineProperty(response, 'type', { value: init.type ?? 'basic' });
  return response;
}

class FakeCache {
  readonly entries = new Map<string, Response>();

  async match(request: SwRequest | string, options?: { ignoreSearch?: boolean }) {
    const url = typeof request === 'string' ? new URL(request, ORIGIN).href : request.url;
    const hit = this.entries.get(url);
    if (hit || !options?.ignoreSearch) return hit;

    const bare = url.split('?')[0];
    for (const [key, value] of this.entries) {
      if (key.split('?')[0] === bare) return value;
    }
    return undefined;
  }

  async put(request: SwRequest | string, response: Response) {
    const url = typeof request === 'string' ? new URL(request, ORIGIN).href : request.url;
    this.entries.set(url, response);
  }

  async add(request: SwRequest) {
    const response = await (globalThis as { __swFetch?: typeof fetch }).__swFetch!(request as never);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await this.put(request, response);
  }

  async delete(request: SwRequest | string) {
    const url = typeof request === 'string' ? new URL(request, ORIGIN).href : request.url;
    return this.entries.delete(url);
  }

  async keys() {
    return [...this.entries.keys()].map((url) => makeRequest(url));
  }
}

class FakeCacheStorage {
  readonly stores = new Map<string, FakeCache>();

  async open(name: string) {
    if (!this.stores.has(name)) this.stores.set(name, new FakeCache());
    return this.stores.get(name)!;
  }

  async keys() {
    return [...this.stores.keys()];
  }

  async delete(name: string) {
    return this.stores.delete(name);
  }

  async match(request: SwRequest | string) {
    for (const store of this.stores.values()) {
      const hit = await store.match(request);
      if (hit) return hit;
    }
    return undefined;
  }
}

type Listener = (event: Record<string, unknown>) => void;

function loadServiceWorker(network: (request: SwRequest) => Promise<Response>) {
  const listeners = new Map<string, Listener[]>();
  const caches = new FakeCacheStorage();
  const claim = vi.fn(async () => {});
  const skipWaiting = vi.fn(async () => {});

  const self = {
    location: new URL('/sw.js', ORIGIN),
    addEventListener(type: string, listener: Listener) {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    },
    clients: { claim },
    skipWaiting,
    caches,
  };

  const swFetch = vi.fn((request: SwRequest | string) =>
    network(typeof request === 'string' ? makeRequest(request) : request),
  );
  // FakeCache.add() reusa o mesmo fetch do worker.
  (globalThis as { __swFetch?: unknown }).__swFetch = swFetch;

  const context = createContext({
    self,
    caches,
    fetch: swFetch,
    URL,
    Headers,
    Response,
    Request: class {
      url: string;
      method = 'GET';
      mode = 'no-cors';
      destination = '';
      headers: Headers;

      constructor(input: string, init: { headers?: HeadersInit } = {}) {
        this.url = new URL(input, ORIGIN).href;
        this.headers = new Headers(init.headers);
      }
    },
    console,
  });
  runInContext(SOURCE, context);

  /** Dispara um evento e espera tudo que o handler registrou. */
  async function dispatch(type: string, event: Record<string, unknown> = {}) {
    const pending: Promise<unknown>[] = [];
    let responded: Promise<Response> | undefined;

    const full = {
      ...event,
      waitUntil: (promise: Promise<unknown>) => pending.push(promise),
      respondWith: (promise: Promise<Response>) => {
        responded = promise;
      },
    };

    for (const listener of listeners.get(type) ?? []) listener(full);
    await Promise.all(pending);
    return responded ? await responded : undefined;
  }

  return { dispatch, caches, swFetch, claim, skipWaiting };
}

/** Rede padrão: 200 pra tudo, com o caminho no corpo. */
function onlineNetwork() {
  return async (request: SwRequest) => makeResponse(`body:${new URL(request.url).pathname}`);
}

function offlineNetwork() {
  return async () => {
    throw new TypeError('Failed to fetch');
  };
}

async function installed(network: (request: SwRequest) => Promise<Response>) {
  const worker = loadServiceWorker(network);
  await worker.dispatch('install');
  await worker.dispatch('activate');
  return worker;
}

// ── Ciclo de vida ────────────────────────────────────────────────────────────

describe('install', () => {
  it('guarda a página offline e os ícones do shell', async () => {
    const worker = await installed(onlineNetwork());
    const shell = await worker.caches.open('dda-shell-v1');

    expect([...shell.entries.keys()]).toEqual([
      `${ORIGIN}/offline.html`,
      `${ORIGIN}/helmet.svg`,
      `${ORIGIN}/manifest.webmanifest`,
      `${ORIGIN}/icons/icon-192.png`,
    ]);
  });

  it('instala mesmo se um arquivo do shell sumir do deploy', async () => {
    const worker = loadServiceWorker(async (request) =>
      request.url.endsWith('/helmet.svg')
        ? makeResponse('não encontrado', { status: 404 })
        : makeResponse('ok'),
    );

    // addAll() seria tudo-ou-nada; aqui o 404 só tira um item do shell.
    await expect(worker.dispatch('install')).resolves.not.toThrow();
    const shell = await worker.caches.open('dda-shell-v1');
    expect(shell.entries.has(`${ORIGIN}/helmet.svg`)).toBe(false);
    expect(shell.entries.has(`${ORIGIN}/offline.html`)).toBe(true);
  });

  it('assume o controle das abas abertas', async () => {
    const worker = await installed(onlineNetwork());
    expect(worker.skipWaiting).toHaveBeenCalled();
    expect(worker.claim).toHaveBeenCalled();
  });
});

describe('activate', () => {
  it('apaga caches de versões anteriores e preserva os de terceiros', async () => {
    const worker = loadServiceWorker(onlineNetwork());
    await worker.caches.open('dda-pages-v0');
    await worker.caches.open('outro-app-v1');

    await worker.dispatch('install');
    await worker.dispatch('activate');

    const names = await worker.caches.keys();
    expect(names).not.toContain('dda-pages-v0');
    expect(names).toContain('outro-app-v1');
  });
});

// ── Navegação ────────────────────────────────────────────────────────────────

describe('navegação', () => {
  const navigation = (path: string) => makeRequest(path, { mode: 'navigate', destination: 'document' });

  it('vai à rede primeiro, pra não servir HTML velho do SSR', async () => {
    const worker = await installed(onlineNetwork());
    const response = await worker.dispatch('fetch', { request: navigation('/posts/alpha') });

    expect(await response!.text()).toBe('body:/posts/alpha');
    const pages = await worker.caches.open('dda-pages-v1');
    expect(pages.entries.has(`${ORIGIN}/posts/alpha`)).toBe(true);
  });

  it('sem rede, serve a última versão vista da própria página', async () => {
    let online = true;
    const worker = await installed(async (request) => {
      if (!online) throw new TypeError('Failed to fetch');
      return makeResponse(`body:${new URL(request.url).pathname}`);
    });

    await worker.dispatch('fetch', { request: navigation('/posts/alpha') });
    online = false;
    const response = await worker.dispatch('fetch', { request: navigation('/posts/alpha') });

    expect(await response!.text()).toBe('body:/posts/alpha');
  });

  it('sem rede e sem cache, cai na página offline', async () => {
    let online = true;
    const worker = await installed(async (request) => {
      if (!online) throw new TypeError('Failed to fetch');
      return makeResponse(`body:${new URL(request.url).pathname}`);
    });

    online = false;
    const response = await worker.dispatch('fetch', { request: navigation('/posts/nunca-visto') });

    expect(await response!.text()).toBe('body:/offline.html');
  });

  it('não cacheia 404 nem 500 — o erro não pode virar a versão offline', async () => {
    const worker = await installed(async () => makeResponse('erro', { status: 500 }));
    await worker.dispatch('fetch', { request: navigation('/posts/quebrado') });

    const pages = await worker.caches.open('dda-pages-v1');
    expect(pages.entries.size).toBe(0);
  });

  it('respeita o teto de páginas em cache', async () => {
    const worker = await installed(onlineNetwork());
    for (let i = 0; i < 45; i += 1) {
      await worker.dispatch('fetch', { request: navigation(`/posts/post-${i}`) });
    }

    const pages = await worker.caches.open('dda-pages-v1');
    expect(pages.entries.size).toBe(40);
    // As mais antigas saem primeiro.
    expect(pages.entries.has(`${ORIGIN}/posts/post-0`)).toBe(false);
    expect(pages.entries.has(`${ORIGIN}/posts/post-44`)).toBe(true);
  });
});

// ── O que nunca deve passar pelo cache ───────────────────────────────────────

describe('rotas fora do cache', () => {
  const paths = [
    '/api/posts.json',
    '/admin/login',
    '/sw.js',
    '/health.json',
    '/ai-index.json',
    '/sitemap.xml',
    '/rss.xml',
    '/posts/alpha/pdf',
  ];

  for (const path of paths) {
    it(`deixa ${path} ir direto pra rede`, async () => {
      const worker = await installed(onlineNetwork());
      const response = await worker.dispatch('fetch', {
        request: makeRequest(path, { mode: 'navigate', destination: 'document' }),
      });

      // Sem respondWith o navegador trata a requisição sozinho.
      expect(response).toBeUndefined();
    });
  }

  it('ignora POST', async () => {
    const worker = await installed(onlineNetwork());
    const response = await worker.dispatch('fetch', {
      request: makeRequest('/busca', { method: 'POST', mode: 'navigate' }),
    });
    expect(response).toBeUndefined();
  });

  it('ignora outra origem — resposta opaca não dá pra validar', async () => {
    const worker = await installed(onlineNetwork());
    const response = await worker.dispatch('fetch', {
      request: { ...makeRequest('/img.png'), url: 'https://dashboard.devsaderiva.com.br/img.png', destination: 'image' },
    });
    expect(response).toBeUndefined();
  });

  it('ignora vídeo e requisição com Range — 206 não pode ser cacheado', async () => {
    const worker = await installed(onlineNetwork());

    const video = await worker.dispatch('fetch', {
      request: makeRequest('/_astro/intro.mp4', { destination: 'video' }),
    });
    expect(video).toBeUndefined();

    const partial = await worker.dispatch('fetch', {
      request: makeRequest('/_astro/intro.mp4', { headers: new Headers({ range: 'bytes=0-' }) }),
    });
    expect(partial).toBeUndefined();
  });
});

// ── Assets e imagens ─────────────────────────────────────────────────────────

describe('assets com hash em /_astro/', () => {
  it('serve do cache na segunda vez, sem tocar a rede', async () => {
    const worker = await installed(onlineNetwork());
    const request = makeRequest('/_astro/app.abc123.js', { destination: 'script' });

    await worker.dispatch('fetch', { request });
    worker.swFetch.mockClear();
    const response = await worker.dispatch('fetch', { request });

    expect(worker.swFetch).not.toHaveBeenCalled();
    expect(await response!.text()).toBe('body:/_astro/app.abc123.js');
  });

  it('não guarda arquivo acima do teto de tamanho', async () => {
    const worker = await installed(async () =>
      makeResponse('enorme', { headers: { 'content-length': '9000000' } }),
    );
    await worker.dispatch('fetch', {
      request: makeRequest('/_astro/gigante.css', { destination: 'style' }),
    });

    const assets = await worker.caches.open('dda-assets-v1');
    expect(assets.entries.size).toBe(0);
  });
});

describe('imagens', () => {
  let worker: Awaited<ReturnType<typeof installed>>;

  beforeEach(async () => {
    worker = await installed(onlineNetwork());
  });

  it('responde do cache e revalida em segundo plano', async () => {
    const request = makeRequest('/logotipo.webp', { destination: 'image' });

    await worker.dispatch('fetch', { request });
    worker.swFetch.mockClear();
    const response = await worker.dispatch('fetch', { request });

    expect(await response!.text()).toBe('body:/logotipo.webp');
    // Serviu do cache, mas foi buscar a versão nova mesmo assim.
    expect(worker.swFetch).toHaveBeenCalledOnce();
  });

  it('acha o /helmet.svg do shell quando a rede cai', async () => {
    // O shell já tem o logo; a página offline depende dele.
    const offline = await installed(offlineNetwork());
    const shell = await offline.caches.open('dda-shell-v1');
    await shell.put(makeRequest('/helmet.svg'), makeResponse('logo'));

    const response = await offline.dispatch('fetch', {
      request: makeRequest('/helmet.svg', { destination: 'image' }),
    });

    expect(await response!.text()).toBe('logo');
  });

  it('respeita o teto de imagens em cache', async () => {
    for (let i = 0; i < 65; i += 1) {
      await worker.dispatch('fetch', {
        request: makeRequest(`/thumb-${i}.webp`, { destination: 'image' }),
      });
    }

    const images = await worker.caches.open('dda-images-v1');
    expect(images.entries.size).toBe(60);
  });
});

// ── Mensagens ────────────────────────────────────────────────────────────────

describe('message', () => {
  it('aceita SKIP_WAITING pra ativar uma versão nova na hora', async () => {
    const worker = await installed(onlineNetwork());
    worker.skipWaiting.mockClear();

    await worker.dispatch('message', { data: { type: 'SKIP_WAITING' } });
    expect(worker.skipWaiting).toHaveBeenCalledOnce();
  });

  it('ignora mensagem sem data', async () => {
    const worker = await installed(onlineNetwork());
    worker.skipWaiting.mockClear();

    await worker.dispatch('message', {});
    expect(worker.skipWaiting).not.toHaveBeenCalled();
  });
});
