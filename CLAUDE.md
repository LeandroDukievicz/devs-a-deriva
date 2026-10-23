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
| `page/[n].astro` | SSR | Páginas paginadas reais para SEO (`/page/2`, `/page/3`…) |
| `api/posts.json.ts` | SSR | Endpoint JSON para infinite scroll AJAX |
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

O cache retorna posts **ordenados por `publishedAt` decrescente** (mais recente primeiro). Posts sem `publishedAt` vão para o final. Posts com `publishedAt` futuro são filtrados defensivamente pelo blog, além do filtro `status=PUBLISHED` aplicado na API do dashboard.

## Home, carrossel e paginação

A home renderiza um carrossel com todos os posts publicados e, abaixo, uma grade com os seis posts mais recentes. O carrossel usa Fisher–Yates (`src/lib/shuffle.ts`) sem alterar a ordem cronológica da API, embaralha a cada volta e avança a cada seis segundos. Hover, foco, aba oculta e saída da viewport pausam a rotação; movimento reduzido começa pausado. Há setas, pausa e navegação por toque.

`PostFeed.astro` compartilha a grade entre `/` e `/page/[n]/`: três colunas no desktop, duas no tablet e uma no celular. `PostPagination.astro` renderiza números, anterior/próxima, `aria-current`, links reais e estados desabilitados. Não há infinite scroll na home. A leitura, a paginação e o download de PDF têm fallback sem JavaScript.

O tamanho da página é `HOME_POSTS_PER_PAGE = 6`, em `src/lib/post-listing.ts`. Categorias mantêm `CATEGORY_POSTS_PER_PAGE = 10` e seu carregamento progressivo. `/api/posts.json` permanece disponível; seu limite padrão agora é seis, com máximo de vinte.

`PostCard.astro` mantém autor, data, progresso de leitura e a ação de lançar ao limbo. `SiteFooter.astro` usa categorias reais e contagens de posts publicados, além dos links institucionais.

## Download de artigos em PDF

Cada post oferece `PostPdfDownload.astro`, com link nativo e feedback de geração/erro quando há JavaScript. A rota SSR `/posts/[slug]/pdf` consulta apenas posts publicados e entrega `application/pdf` como anexo, sem indexação. Posts inexistentes retornam 404; indisponibilidade retorna 503 sem cache.

`src/lib/post-pdf.ts` usa pdfmake no servidor com fontes Unicode embutidas em memória. Preserva texto selecionável, títulos, ênfase, listas, links, imagens, autor, data e URL original. Imagens são convertidas com Sharp, com limite de tamanho, timeout, concorrência de quatro e lista de hosts permitidos. Falhas em imagens preservam o download do texto. Não há Chromium nem serviço externo para gerar PDFs em produção.

## Testes de navegador

`npm run test:e2e` inicia um dashboard de fixtures na porta 3001 e o Astro na 4322. Os projetos Chromium desktop e mobile validam o fluxo completo sem gravar dados reais. `PLAYWRIGHT_BASE_URL` permite apontar explicitamente para outro ambiente; `PLAYWRIGHT_CHANNEL=chrome` usa o Chrome instalado localmente. O CI instala Chromium e exige os testes antes do deploy.

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
