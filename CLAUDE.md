# devs-a-deriva — Blog

Site do blog Devs à Deriva em Astro 6, com deploy duplo: **Vercel** (CDN/serverless) e **VPS próprio** (Docker + Node.js).

## Stack

- **Astro 6** com adaptador dual: `@astrojs/vercel` na Vercel, `@astrojs/node` (standalone) em todo o resto
- **Tailwind CSS 4** via plugin Vite
- **TypeScript** strict
- Conteúdo (posts, categorias) servido pelo **dashboard-ldstudio** via API REST

## Seleção de adaptador

O `astro.config.mjs` detecta o ambiente via variável de ambiente:

```js
const isVercel = process.env.VERCEL === '1'; // Vercel seta isso automaticamente
adapter: isVercel ? vercel() : node({ mode: 'standalone' })
```

| Ambiente | Adaptador | Como identificar |
|---|---|---|
| Vercel (produção/preview) | `@astrojs/vercel` | `VERCEL=1` setado automaticamente |
| VPS Docker | `@astrojs/node` standalone | variável ausente |
| CI / local | `@astrojs/node` standalone | variável ausente |

## Arquitetura de renderização

O blog usa **modo híbrido** (estático + SSR seletivo). A distinção é feita por página:

| Página | Modo | Por quê |
|---|---|---|
| `index.astro` | SSR (`prerender = false`) | Lista de posts sempre atualizada |
| `posts/[slug].astro` | SSR | Novo post aparece sem rebuild |
| `categorias/[categoria]/pagina/[n].astro` | SSR | Paginação em tempo real |
| `busca.astro` | SSR | Index de busca sempre fresco |
| `rss.xml.ts` | SSR | Feed RSS atualizado sem rebuild |
| `sitemap.xml.ts` | SSR | Sitemap reflete novos posts |
| `ai-index.json.ts` | SSR | Index para bots atualizado |
| `health.json.ts` | SSR | Versão do commit em runtime |
| `categorias/[categoria].astro` | SSR | Posts novos aparecem sem rebuild |
| Demais páginas | Estático | Conteúdo fixo (manifesto, privacidade…) |

**Resultado:** publicar um post novo faz ele aparecer em **até 30 segundos**, sem rebuild.

## Cache em `src/lib/posts.ts`

`fetchPosts()` usa cache em memória com TTL de **30 segundos** em produção:

```ts
const CACHE_TTL_MS = 30_000;
if (_cache && import.meta.env.PROD && now - _cacheTime < CACHE_TTL_MS) return _cache;
```

Em desenvolvimento (`PROD = false`) o cache é desabilitado — dados sempre frescos.

## Arquitetura de deploy — VPS

```
Internet → nginx (sistema, porta 80/443)
              │  proxy_pass http://127.0.0.1:4321
              │  security headers (CSP, HSTS, X-Frame-Options…)
              │  rate limiting
              ▼
         Docker container (porta 4321)
              │  @astrojs/node standalone
              │  serve estáticos de dist/client/
              │  render SSR routes
              ▼
         dashboard.devsaderiva.com.br (API de posts)
```

- O **nginx do sistema** (não está no Docker) aplica os headers de segurança e rate limiting para **todas** as respostas (estáticas e SSR). Configuração em `nginx.conf`.
- O **container Docker** só roda o servidor Node.js. Build com `DEPLOY_TARGET` não necessário — detecção é por `VERCEL`.
- Health check: `http://localhost:4321/health.json` (diretamente no Node, sem nginx).

## Arquitetura de deploy — Vercel

```
Internet → Vercel CDN
              │  headers de segurança via vercel.json
              │  arquivos estáticos do .vercel/output/static/
              │  SSR via funções serverless
              ▼
         dashboard.devsaderiva.com.br (API de posts)
```

- Headers configurados em `vercel.json` (cobre estáticos e SSR).
- Detecção automática: Vercel seta `VERCEL=1` no build.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `PUBLIC_DASHBOARD_URL` | Sim | URL do dashboard (`https://dashboard.devsaderiva.com.br`) |

Em desenvolvimento local, o padrão é `http://localhost:3000`.

## Desenvolvimento local

```bash
npm install
npm run dev        # usa @astrojs/node, sem VERCEL=1
```

O blog busca posts de `http://localhost:3000`. Se o dashboard não estiver rodando, `isApiOffline()` retorna `true` e o blog exibe estado offline.

## Comandos

```bash
npm run dev              # servidor de desenvolvimento
npm run build            # build (node adapter por padrão)
VERCEL=1 npm run build   # build com vercel adapter
npm run typecheck        # verificação de tipos (astro check)
npm run lint             # linting
npm test                 # testes unitários (vitest)
npm run check:seo        # checa meta tags, canonical, JSON-LD em dist/client/
npm run check:links      # checa links internos em dist/client/
npm run check:security   # npm audit + scan de segredos
npm run lighthouse       # Lighthouse CI contra dist/client/
```
