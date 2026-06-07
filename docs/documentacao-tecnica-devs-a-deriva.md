# Documentação Técnica Completa - Devs à Deriva

Projeto analisado: `/home/leandro-dukievicz/Projetos/devs-a-deriva`

**Atualizado em:** 28/05/2026  
**Documento original:** 05/05/2026 — Esta versão reflete o estado atual após implementação do pipeline CI/CD completo, configuração de segurança (Cloudflare + VPS) e hardening de CSP (remoção de `'unsafe-inline'`).

---

## Índice

1. [Conclusão executiva](#conclusão-executiva)
2. [Estrutura geral](#estrutura-geral)
3. [Arquitetura do projeto](#arquitetura-do-projeto)
4. [Fluxo de funcionamento](#fluxo-de-funcionamento)
5. [Configurações, build e deploy](#configurações-build-e-deploy)
6. [Pipeline CI/CD](#pipeline-cicd)
7. [Testes e qualidade](#testes-e-qualidade)
8. [Layout, tema e estilos](#layout-tema-e-estilos)
9. [Biblioteca de dados e utilitários](#biblioteca-de-dados-e-utilitários)
10. [Componentes Astro](#componentes-astro)
11. [Páginas e rotas](#páginas-e-rotas)
12. [Assets públicos](#assets-públicos)
13. [Relações entre arquivos](#relações-entre-arquivos)
14. [SEO, acessibilidade e performance](#seo-acessibilidade-e-performance)
15. [Segurança e infraestrutura ★ novo](#segurança-e-infraestrutura)
16. [Riscos e oportunidades](#riscos-e-oportunidades)
17. [Glossário técnico](#glossário-técnico)
18. [Apêndice — arquivo por arquivo](#apêndice--arquivo-por-arquivo)
19. [Inventário completo](#inventário-completo)

---

## Conclusão executiva

O projeto **Devs à Deriva** é uma aplicação Astro estática com experiência visual forte em estética sci-fi/cyberpunk, conteúdo editorial dinâmico vindo de um dashboard externo e várias interações client-side. A camada pública do blog está separada do dashboard por uma fronteira HTTP definida por `PUBLIC_DASHBOARD_URL`.

Desde a análise original (05/05/2026) foram implementados: **pipeline CI/CD completo** com seis jobs (quality, build, audit, lighthouse, deploy, smoke), suite de testes unitários com Vitest, testes e2e com Playwright, scripts de validação de qualidade (lint, typecheck, SEO, links, segurança, conteúdo), healthcheck estático em `/health.json`, rollback automático pós-smoke, integração de Gitleaks e Dependency Review, paginação de categorias, página de newsletter, sitemap.xml dinâmico, llms.txt e AEO (Answer Engine Optimization).

Em 13/05/2026 foram implementadas as configurações de **segurança e proteção DDoS**: proxy Cloudflare com WAF, SSL Full (strict), HSTS, Bot Fight Mode, regras de bloqueio de paths maliciosos, rate limiting, firewall UFW na VPS restrito aos IPs do Cloudflare e Fail2ban para proteção SSH.

Em 28/05/2026 foi implementado o **hardening de CSP**: remoção de `'unsafe-inline'` do `script-src`, substituído por SHA-256 hashes dos scripts inline fixos. Scripts `define:vars` em três páginas foram refatorados para o padrão `<script type="application/json">` + scripts bundled normais, eliminando a necessidade de inline dinâmico. Script pós-build `scripts/update-csp-hashes.mjs` extrai automaticamente todos os hashes do `dist/client/` e atualiza `vercel.json` e `nginx.conf` após cada build.

O projeto está em estágio **editorial funcional com infraestrutura de produção e segurança**: CI robusto, deploy com rollback, Lighthouse bloqueante, proteção DDoS em múltiplas camadas, CSP sem `'unsafe-inline'` e documentação completa.

---

## Estrutura geral

```txt
devs-a-deriva/
├── .github/workflows/   Pipeline CI/CD (ci.yml)
├── src/
│   ├── components/      Componentes Astro reutilizáveis e experiências visuais
│   ├── layouts/         Layout HTML global
│   ├── lib/             Dados, validação e estado local/sync
│   ├── pages/           Rotas Astro (inclui health.json, sitemap.xml, newsletter)
│   └── styles/          Tokens e base visual global
├── public/              Assets servidos diretamente (+ llms.txt, docs.json)
├── docs/                Documentação estratégica (+ ci-cd.md)
├── scripts/             Scripts de qualidade, deploy e rollback
├── tests/               Testes unitários Vitest e e2e Playwright
├── Dockerfile           Build Node 22 Alpine + Nginx
├── docker-compose*.yml  Orquestração Docker
├── nginx.conf           Servidor estático com try_files
├── lighthouserc.cjs     Configuração Lighthouse CI
├── vitest.config.ts     Configuração Vitest
├── playwright.config.ts Configuração Playwright
├── tsconfig.json        TypeScript strict + vitest/globals
├── astro.config.mjs     Astro + Tailwind v4 via Vite plugin
└── package.json         14 scripts de desenvolvimento e CI
```

| Grupo | Qtd | Papel |
| --- | --- | --- |
| Arquivos em `src/` | 38 | Código de aplicação, rotas, componentes, estilos e utilitários. |
| Arquivos em `public/` | 22 | Imagens, SVGs, favicon, llms.txt e docs.json expostos na raiz pública. |
| Arquivos em `docs/` | 15 | Documentação de produto, arquitetura, banco, roadmap, CI/CD, segurança e decisões. |
| Arquivos em `scripts/` | 8 | Deploy, rollback, lint, validação de conteúdo, SEO, links, segurança, smoke test. |
| Arquivos em `tests/` | 7 | Testes unitários Vitest, e2e Playwright e load test k6. |
| Arquivos raiz e config | 19 | Dockerfile, compose, nginx, CI/CD, tsconfig, vitest, playwright, etc. |
| **Total mapeado** | **~107** | Sem `node_modules`, `dist` e `.git`. |

---

## Arquitetura do projeto

### Modelo

SSG com Astro: o servidor de build executa frontmatter de páginas e componentes, consulta o dashboard e gera HTML estático. No browser, scripts Astro executam animações, estado local e chamadas de APIs públicas do dashboard. O site é servido via Nginx em Docker no VPS.

### Camadas

| Camada | Arquivos | Responsabilidade |
| --- | --- | --- |
| Infra/build | `package.json`, `astro.config.mjs`, `Dockerfile`, `nginx.conf`, `vercel.json` | Compilar, servir e proteger a aplicação. |
| CI/CD | `.github/workflows/ci.yml`, `lighthouserc.cjs`, `scripts/deploy.sh`, `scripts/rollback.sh` | Validar qualidade, construir, auditar e fazer deploy com rollback. |
| Testes | `vitest.config.ts`, `playwright.config.ts`, `tests/` | Testes unitários, e2e e smoke. |
| Layout global | `src/layouts/Base.astro` | HTML base, metatags, tema, Navbar, Analytics e botão de topo. |
| Tema | `ThemeProvider.astro`, `src/styles/tokens.css` | Forçar tema único, tokens de cor e estilos globais. |
| Dados | `src/lib/posts.ts`, `src/lib/categories.ts` | Buscar posts, normalizar payload, converter Markdown, definir categorias. |
| Estado/sync | `src/lib/reading-progress-client.ts` | ReaderId, progresso local e sincronização remota. |
| Validação | `src/lib/newsletter-email.ts` | Validação defensiva de e-mail no cliente. |
| Experiência | `BlackHole`, `StarBackground`, `Navbar`, `CategoriaPage`, `Comments`, `ErrorPage` | UI visual, animações e integrações. |
| Rotas | `src/pages/**` | Composição pública das páginas (+ newsletter, sitemap, health, ai-index, paginação). |

### Integrações externas

- `GET /api/posts?status=PUBLISHED`: fonte de posts no build.
- `GET /api/devs`: fonte dos colaboradores no browser.
- `GET /api/comments?slug=...`: comentários aprovados.
- `POST /api/comments/draft`: cria draft antes de OAuth.
- `GET/PATCH /api/reading-progress`: sincroniza progresso.
- `POST /api/newsletter/subscribe`: inscrição da newsletter.
- Google tag `G-Z8ENDKWVWC` e Vercel Analytics.

---

## Fluxo de funcionamento

### Build e runtime

1. O build Astro inicia com `npm run build`.
2. `src/lib/posts.ts` chama o dashboard via `PUBLIC_DASHBOARD_URL`.
3. `fetchPosts()` retorna posts publicados; o payload é normalizado e convertido para HTML.
4. `src/pages/posts/[slug].astro` gera uma rota estática por post via `getStaticPaths()`.
5. A home exibe os cinco posts mais recentes; `/api/posts.json?page=N&limit=5` entrega lotes sob demanda; categorias filtram por `categorySlug`; paginação real via `[n].astro` mantém URLs rastreáveis.
6. `/health.json`, `/sitemap.xml` e `/ai-index.json` são gerados como arquivos estáticos no build.
7. O browser ativa animações canvas, comentários, newsletter e progresso de leitura via APIs do dashboard.

### Fluxo CI/CD (resumo)

1. Push na `main` ou PR dispara o pipeline.
2. Job **quality**: lint, typecheck, validação de conteúdo, testes unitários, Gitleaks.
3. Job **build**: `astro build` e upload do artefato `dist/`.
4. Jobs **audit** e **lighthouse** (paralelos): SEO, links, segurança, Dependency Review, Lighthouse CI bloqueante.
5. Job **deploy**: apenas em push na `main`, via SSH no VPS.
6. Job **smoke**: wait até 75s, valida rotas públicas e `/health.json`. Se falhar, aciona rollback automático.

---

## Configurações, build e deploy

| Arquivo | Linhas | Análise |
| --- | --- | --- |
| `package.json` | 39 | 15 scripts: dev, lint, typecheck, validate:content, check:seo, check:links, check:security, smoke:test, ci:check, build, postbuild, preview, lighthouse, test, test:e2e, test:watch, test:ci. |
| `astro.config.mjs` | 9 | Integra Tailwind v4 via `@tailwindcss/vite` (plugin Vite, não integração Astro). Sem `tailwind.config.mjs`. |
| `tsconfig.json` | 9 | Extends `astro/tsconfigs/strict`; inclui `vitest/globals` nos types; cobre `src/` e `tests/`. |
| `vercel.json` | 17 | Headers globais: nosniff, DENY frame, referrer policy, permissions policy e CSP. |
| `.env.example` | 5 | Documenta `PUBLIC_DASHBOARD_URL` local e produção. |
| `Dockerfile` | 25 | Multi-stage: Node 22 Alpine gera `dist/` com `PUBLIC_COMMIT_SHA` como ARG; Nginx serve HTML estático. |
| `docker-compose.yml` | 10 | Builda `blog`, injeta `PUBLIC_DASHBOARD_URL` e `PUBLIC_COMMIT_SHA`, publica `127.0.0.1:4321:80`. |
| `docker-compose.prod.yml` | 3 | Override de restart para produção (`always`). |
| `nginx.conf` | 18 | Resolve rotas Astro com `try_files`, 404 customizado e cache longo para assets. |
| `lighthouserc.cjs` | 35 | 5 URLs, 3 runs. Thresholds em `error`: perf ≥ 0.80, a11y ≥ 0.90, best-practices ≥ 0.90, SEO ≥ 0.90, LCP ≤ 3000ms, CLS ≤ 0.1, TBT ≤ 300ms. |
| `vitest.config.ts` | 8 | Ambiente Node, inclui `tests/**/*.test.ts`. |
| `playwright.config.ts` | 15 | Configuração e2e Playwright. |
| `scripts/deploy.sh` | 43 | Salva `.previous-rev`, git fetch/checkout, docker compose build + up, rollback por `trap ERR`. |
| `scripts/rollback.sh` | 31 | Lê `.previous-rev`, verifica se necessário, faz checkout, rebuild e redeployment. |

### Scripts disponíveis (`package.json`)

| Script | Função |
| --- | --- |
| `lint` | Verifica conflitos Git, CRLF, newline final e placeholders sensíveis. |
| `typecheck` | Typecheck via `astro check`. |
| `validate:content` | Valida frontmatter de markdown local (slug, title, categoria, data, status). |
| `check:seo` | Lê `dist/` e valida title, meta description, canonical, OG, JSON-LD, sitemap, robots. |
| `check:links` | Verifica links internos e âncoras em `dist/`. Links externos ignorados. |
| `check:security` | `npm audit` + scan de segredos versionados + validação de `.env.example`. |
| `smoke:test` | Valida rotas públicas e payload de `/health.json` contra `BASE_URL`. |
| `ci:check` | `lint && typecheck && validate:content && test` — suite pré-build. |
| `build` | Geração estática `astro build`. Dispara `postbuild` automaticamente. |
| `postbuild` | Executa `scripts/update-csp-hashes.mjs`: extrai hashes de scripts inline do `dist/client/` e atualiza `vercel.json` e `nginx.conf`. |
| `preview` | Serve `dist/` localmente. |
| `lighthouse` | Lighthouse CI contra `dist/` estático. |
| `test` | Testes unitários Vitest. |
| `test:e2e` | Testes e2e Playwright (não roda no CI automaticamente). |

---

## Pipeline CI/CD

Arquivo: `.github/workflows/ci.yml` (209 linhas). Pipeline completo com seis jobs.

### Triggers

- `push` na `main`: qualidade + build + auditoria + deploy + smoke.
- `pull_request` para `main`: qualidade + build + auditoria + Lighthouse. Sem deploy.
- `repository_dispatch` (tipo `blog-rebuild`): rebuild via webhook externo.
- `workflow_dispatch`: trigger manual.

### Jobs e dependências

| Job | Depende de | Roda quando | Steps principais |
| --- | --- | --- | --- |
| `quality` | — | Sempre | npm ci, ci:check (lint/typecheck/validate/test), Gitleaks |
| `build` | quality | Sempre | npm ci, astro build, upload artefato dist/ |
| `audit` | build | Sempre | check:security, check:seo, check:links, Dependency Review (só PRs) |
| `lighthouse` | build | Não em repository_dispatch | lhci autorun contra dist/ estático, upload report |
| `deploy` | quality+build+audit+lighthouse | Apenas push main / dispatch | SSH → scripts/deploy.sh no VPS |
| `smoke` | deploy | Deploy bem-sucedido | wait 75s, smoke:test, rollback SSH se falhar |

### Secrets necessários

| Secret | Obrigatório | Uso |
| --- | --- | --- |
| `VPS_HOST` | Sim | Host/IP do VPS para SSH. |
| `VPS_USER` | Sim | Usuário SSH. |
| `SSH_PRIVATE_KEY` | Sim | Chave privada SSH para deploy e rollback. |
| `PUBLIC_SITE_URL` | Não | URL do smoke test; padrão `https://devsaderiva.com.br`. |
| `GITHUB_TOKEN` | Auto | Injetado pelo Actions; usado por Gitleaks e Dependency Review. |

### Rollback

`scripts/deploy.sh` salva o SHA anterior em `/opt/devs-a-deriva/.previous-rev` antes de cada deploy. Se o smoke falhar após um deploy bem-sucedido, o CI executa `scripts/rollback.sh` via SSH automaticamente. O script lê `.previous-rev`, faz checkout da versão anterior e reconstrói o Docker. Rollback de falha durante build é coberto por `trap ERR` no próprio `deploy.sh`.

---

## Testes e qualidade

### Testes unitários — Vitest

| Arquivo | Linhas | Cobertura |
| --- | --- | --- |
| `tests/posts.test.ts` | 182 | `paginatePosts` (7 casos), `getPost` (2), `estimateReadTime` (5), `slugText` (6), `formatDate` (4). |
| `tests/security.test.ts` | 51 | `escapeHtml` contra 10 payloads XSS + casos básicos. |
| `tests/newsletter-email.test.ts` | 112 | `validateAndNormalizeEmail`: válidos (6), inválidos (9), injeção (6). |

### Testes e2e — Playwright

| Arquivo | Cobertura |
| --- | --- |
| `tests/e2e/home.spec.ts` | Home carrega, exibe posts, BlackHole e navegação. |
| `tests/e2e/categorias.spec.ts` | Páginas de categoria carregam e exibem conteúdo. |
| `tests/e2e/post-interactions.spec.ts` | Página de post abre, exibe conteúdo e interações. |

Os testes e2e não rodam no CI automaticamente; são executados localmente.

### Load test — k6

`tests/smoke.k6.js` (34 linhas): smoke test de carga leve executado manualmente ou via k6 Cloud.

### Scripts de qualidade

| Script | Linhas | O que verifica |
| --- | --- | --- |
| `scripts/lint.mjs` | 71 | Conflitos Git, CRLF, arquivos sem newline final, placeholders sensíveis. |
| `scripts/validate-content.mjs` | 108 | Frontmatter de markdown: status, slug duplicado, categoria, datas. Posts published exigem slug/title/description. |
| `scripts/check-seo.mjs` | 69 | Lê dist/: title, meta description, canonical, og:*, JSON-LD em 11 páginas. Verifica sitemap.xml, robots.txt, llms.txt, docs.json. |
| `scripts/check-links.mjs` | 103 | Links internos e âncoras em dist/. Ignora externos. |
| `scripts/check-security.mjs` | 67 | npm audit; .env.example obrigatório; arquivos .env não no git; regex de segredos. |
| `scripts/smoke-test.mjs` | 65 | 8 rotas + assets da home. Valida payload de /health.json. |

---

## Layout, tema e estilos

### Layouts Astro

`Base.astro` concentra o esqueleto HTML global, meta tags padrão, slots de head, tema, Navbar, Analytics, rodapé, cookie consent, CTA admin e botão de voltar ao topo.

Layouts específicos compõem o `Base` para reduzir acoplamento das páginas:

- `PageLayout.astro`: wrapper genérico com opção de `StarBackground`.
- `PostLayout.astro`: metadados de post, `og:type=article` e JSON-LD `Article`.
- `CategoryLayout.astro`: metadados de categoria, `StarBackground` e JSON-LD `BreadcrumbList`.
- `LegalLayout.astro`: páginas legais herdando `PageLayout`.

### `src/layouts/Base.astro`

| Faixa | Explicação |
| --- | --- |
| 1–7 | Importa tokens, ThemeProvider, Navbar, Analytics e utilitários para ler SVG. |
| 8–17 | Define props `title`, `description` e `hideNavbar`. |
| 18–29 | Valores padrão de SEO, inline do SVG do admin, canonical e OG tags. |
| 32–48 | HTML `pt-BR`, metatags completas (description, canonical, og:*, JSON-LD), favicon, ThemeProvider e Google tag. |
| 50–53 | Navbar condicional, slot da página e Vercel Analytics. |
| 55–72 | CTA admin aponta para `https://dashboard.devsaderiva.com.br/` com `_blank` e `noopener noreferrer`. |
| 75–79 | Botão voltar ao topo com SVG e `aria-label`. |

### `ThemeProvider.astro`

Define o tema único `orbita-baixa` antes do primeiro paint, injeta variáveis CSS base, sincroniza `window.__bgColor` para canvas e remove temas antigos de `localStorage/sessionStorage`.

### `src/styles/tokens.css`

Centraliza `--color-bg`, `--color-star`, `--color-accent`, `--color-text` e variantes de opacidade. Define `body`, fundo global e scrollbar customizada.

---

## Biblioteca de dados e utilitários

### `src/lib/posts.ts`

| Faixa | Explicação |
| --- | --- |
| 1–24 | Contratos `Author` e `Post` usados por home, categorias e posts. |
| 28–35 | Mapa de categorias para labels e hashtags. |
| 37–70 | `estimateReadTime`, `escapeHtml`, normalização de heading e remoção de título duplicado. |
| 72–103 | Texto puro, inline Markdown e imagens. |
| 105–188 | Parser Markdown próprio para parágrafos, listas, quotes, imagens, headings h2–h4 e hr. |
| 190–244 | Validação de slug e mapeamento do payload cru do dashboard. |
| 246–262 | URL do dashboard, cache e `fetchPosts()`. |
| 264–275 | `getPost`, `getPostsByCategory`, `getFeaturedByCategory`, `paginatePosts`, `formatDate`, `slugText`. |

Funções exportadas e testadas: `paginatePosts(posts, page, pageSize)`, `estimateReadTime(content)`, `escapeHtml(str)`, `formatDate(iso)`, `slugText(text)`, `getPost(slug)`.

Risco: o parser Markdown próprio é simples. Não cobre tabelas, listas aninhadas, blocos de código, footnotes ou sanitização baseada em AST.

### `src/lib/categories.ts`

49 linhas. Define a lista canônica de categorias do blog (`tech`, `carreira`, `livros`, `musica`, `aleatoriedades`, `noticias`) com metadados de label, slug, descrição e imagem. Centraliza o que antes estava espalhado em `posts.ts` e páginas individuais.

### `src/lib/reading-progress-client.ts`

Mantém um `readerId` anônimo, salva progresso monotônico por post no `localStorage`, renderiza anéis/labels e sincroniza com o dashboard por `GET` e `PATCH` com `keepalive`.

### `src/lib/newsletter-email.ts`

Valida tipo, vazio, tamanho, caracteres invisíveis, padrões de injeção, quantidade de `@`, local-part, domínio, labels DNS e TLD. Retorna e-mail normalizado com domínio em minúsculas. Coberta por 23 casos de teste.

---

## Componentes Astro

### `BlackHole.astro`

Componente visual mais complexo. Lê `public/astronauts.svg`, cria versões inline/base64, renderiza canvas full-screen, simula campo orbital, linhas, partículas, texto "Devs à deriva" e astronauta com efeito de sucção. Usa `localStorage` para exibir a intro uma vez por dia e dispara `animationComplete` para revelar navbar/home.

### `Navbar.astro`

Lê `logohelmet.svg`, desenha logo em canvas, renderiza links Home/Categorias/Devs/Manifesto, controla visibilidade pós-intro, dropdown acessível por click/hover/Escape e ícones canvas animados no hover. Usa `AbortController` global para evitar listeners duplicados.

### `CategoriaPage.astro`

Componente parametrizado para páginas de categoria. Busca posts e destaques por `categorySlug`, renderiza header, contador, carrossel com dots/auto-play e grid de posts. Marca origem `category` em `sessionStorage`.

### `Comments.astro`

Recebe `postSlug`, usa `PUBLIC_DASHBOARD_URL`, mostra textarea, prompt de login social, lista de comentários aprovados e estado vazio/loading. O envio cria draft no dashboard e redireciona para `signInUrl`.

### `StarBackground.astro`

Três camadas CSS de estrelas com animações lentas. A cada intervalo cria um pequeno SVG de nave, anima opacidade e remove o elemento.

### `ErrorPage.astro`

Componente visual para 404/500: separa dígitos do código, renderiza textos SVG com gradiente, helmet webp e CTA para home.

---

## Páginas e rotas

### `src/pages/index.astro`

| Faixa | Explicação |
| --- | --- |
| 1–21 | Busca posts publicados, aplica `HOME_POSTS_PER_PAGE = 5` e prepara os cards via `src/lib/post-listing.ts`. |
| 23–91 | Composição visual da home com BlackHole, cinco cards iniciais, sentinel, botão fallback, link SEO e estados de loading/erro/fim. |
| 93–374 | CSS de overlay, ações, loading, responsividade e progresso. |
| 376–531 | Infinite scroll com `IntersectionObserver`, `/api/posts.json?page=N&limit=5`, controle de concorrência, retry e prevenção de duplicados. |
| 533–fim | Revela conteúdo após intro, sincroniza progresso, efeito limbo e clique no card inteiro. |

### `src/pages/posts/[slug].astro`

| Faixa | Explicação |
| --- | --- |
| 1–12 | `getStaticPaths()` cria uma página estática por post publicado. |
| 37–207 | Header, hero, conteúdo HTML, Comments, newsletter e footer. |
| 1174–1253 | Navegação contextual por home/category. |
| 1255–1324 | Progresso de leitura por scroll/resize/pagehide. |
| 1326–1408 | Newsletter com validação, consentimento, honeypot e POST ao dashboard. |

### `src/pages/newsletter.astro`

438 linhas. Página dedicada de inscrição na newsletter. Formulário com validação via `newsletter-email.ts`, honeypot, checkbox de consentimento LGPD, feedback de sucesso/erro.

### `src/pages/categorias/[categoria]/pagina/[n].astro`

369 linhas. Paginação dinâmica por categoria. `getStaticPaths()` gera rotas `/categorias/{slug}/pagina/{n}` usando `paginatePosts()`.

### Categorias (wrappers estáticos)

| Rota | Slug |
| --- | --- |
| /categorias/aleatoriedades | `aleatoriedades` |
| /categorias/carreira | `carreira` |
| /categorias/livros | `livros` |
| /categorias/musica | `musica` |
| /categorias/noticias | `noticias` |
| /categorias/tech | `tech` |

### `src/pages/health.json.ts`

17 linhas. Gera `/health.json` estático no build: `{ "status": "ok", "app": "devs-a-deriva", "version": "commit-sha", "timestamp": "ISO" }`.

### `src/pages/sitemap.xml.ts`

48 linhas. Sitemap.xml dinâmico com todas as rotas públicas, posts e páginas legais. Inclui `lastmod` e `priority`.

### `src/pages/ai-index.json.ts`

47 linhas. Endpoint AEO: metadados do blog, categorias e posts em JSON para LLMs e crawlers de IA.

### `src/pages/devs.astro`

Colaboradores em órbita ao redor do buraco negro. Busca devs do dashboard, cria cards circulares dinamicamente.

### `src/pages/manifesto.astro`

Texto editorial em perspectiva controlado por scroll com `requestAnimationFrame` e CSS variables.

### Páginas legais, admin e erro

- `privacidade.astro`, `termos.astro`, `exclusao-de-dados.astro`, `data-deletion.astro`, `delete.astro`: conteúdo legal.
- `admin/login.astro`: placeholder histórico; dashboard externo é o destino real.
- `404.astro` e `500.astro`: wrappers de `ErrorPage`.

---

## Assets públicos

| Asset | Tamanho | Uso |
| --- | --- | --- |
| `public/aleatoriedades-astronaut-body.webp` | 26016 bytes | Categoria/ilustração |
| `public/astronaut-admin.svg` | 26090 bytes | CTA admin |
| `public/astronauts.svg` | 50429 bytes | BlackHole |
| `public/blackhole.png` | 54543 bytes | Asset de fundo |
| `public/carreira-profissional-astronaut-body.webp` | 27698 bytes | Categoria/ilustração |
| `public/docs.json` | ~4 KB | AEO — documentação estruturada para crawlers |
| `public/favicon.ico` | 6525 bytes | Favicon |
| `public/helmet-error-404.webp` | 17390 bytes | Erro 404/500 |
| `public/helmet.svg` | 35669 bytes | Favicon SVG |
| `public/home-*.png` (5 arquivos) | ~2 MB cada | Hero/fallback de post por categoria |
| `public/livros-astronaut.webp` | 30576 bytes | Categoria/ilustração |
| `public/llms.txt` | ~2 KB | AEO — contexto do blog para LLMs |
| `public/llms-full.txt` | ~8 KB | AEO — versão extendida |
| `public/logo-high-color.webp` | 81006 bytes | Logo |
| `public/logohelmet.svg` | 38000 bytes | Logo/Navbar canvas |
| `public/musica-astronaut.webp` | 35066 bytes | Categoria/ilustração |
| `public/noticias-astronaut.webp` | 47818 bytes | Categoria/ilustração |
| `public/robots.txt` | ~200 bytes | Controle de crawlers |
| `public/tech-astronaut.webp` | 40622 bytes | Categoria/ilustração |

As imagens PNG `home-*` têm ~2 MB cada. Vale converter para WebP/AVIF com `<picture>` responsivo.

---

## Relações entre arquivos

```txt
Base.astro
├── tokens.css
├── ThemeProvider.astro
├── Navbar.astro
└── @vercel/analytics/astro

index.astro
├── Base.astro
├── BlackHole.astro
├── lib/posts.ts
└── lib/reading-progress-client.ts

posts/[slug].astro
├── Base.astro
├── StarBackground.astro
├── Comments.astro
├── lib/posts.ts
├── lib/newsletter-email.ts
└── lib/reading-progress-client.ts

categorias/*.astro
├── Base.astro
├── StarBackground.astro
└── CategoriaPage.astro ← lib/posts.ts

categorias/[categoria]/pagina/[n].astro
└── lib/posts.ts (paginatePosts)

newsletter.astro
├── Base.astro
└── lib/newsletter-email.ts

devs.astro
├── Base.astro
├── BlackHole.astro
└── dashboard /api/devs

health.json.ts, sitemap.xml.ts, ai-index.json.ts
└── lib/posts.ts (posts publicados)

CI/CD
├── scripts/deploy.sh → VPS → docker compose
├── scripts/rollback.sh → lê .previous-rev
└── scripts/smoke-test.mjs → /health.json + rotas
```

---

## SEO, acessibilidade e performance

### SEO — implementado

Todos os itens marcados como "melhoria futura" na análise original foram implementados:

- **Canonical:** tag `<link rel="canonical">` gerada por rota em `Base.astro`.
- **Sitemap:** `/sitemap.xml` gerado dinamicamente com todas as rotas públicas e posts.
- **robots.txt:** presente em `public/robots.txt`.
- **OG tags:** `og:title`, `og:description`, `og:image` em todas as páginas.
- **JSON-LD:** structured data gerado em `Base.astro`.
- **AEO/GEO:** `llms.txt`, `llms-full.txt`, `docs.json`, `/ai-index.json` para Answer Engine Optimization.
- **SEO check automatizado:** `scripts/check-seo.mjs` valida tudo acima no CI após o build.

Lighthouse CI bloqueante: performance ≥ 0.80, accessibility ≥ 0.90, best-practices ≥ 0.90, SEO ≥ 0.90. Scores atuais: performance 1.0, accessibility 0.95–0.96, best-practices 1.0, SEO 1.0.

### Acessibilidade

Positivos: `lang=pt-BR`, `aria-label`, `aria-hidden`, feedback `aria-live`, navegação por teclado. Pendente: `prefers-reduced-motion` amplo nos canvas.

### Performance

Positivos: Astro estático, cache Nginx longo para assets, lazy loading em imagens. Riscos: canvas contínuo, scripts inline extensos, PNGs de hero ~2 MB.

---

## Segurança e infraestrutura

Configurações de rede implementadas em 13/05/2026. Hardening de CSP implementado em 28/05/2026. Documentação detalhada em [`docs/security.md`](security.md).

### Arquitetura de proteção

```
Visitante → Cloudflare (proxy + WAF + DDoS) → VPS (UFW + Caddy + Fail2ban)
```

O IP real da VPS fica oculto atrás do Cloudflare. Tráfego nas portas 80/443 só é aceito de IPs do Cloudflare.

### Cloudflare

| Configuração | Valor |
| --- | --- |
| Nameservers | `magdalena.ns.cloudflare.com`, `michael.ns.cloudflare.com` |
| SSL/TLS | Full (strict) — criptografia ponta a ponta com validação de certificado de origem |
| Always Use HTTPS | ON |
| HSTS | ON — max-age 12 meses, include subdomains |
| TLS mínimo | 1.2 |
| Bot Fight Mode | ON |
| AI Labyrinth | ON |
| Hotlink Protection | ON |
| DDoS L3/L4/L7 | Ativo — gerenciado automaticamente pelo Cloudflare |

**Custom rule — Block Bad Paths:** bloqueia `/.env`, `/.git`, `/wp-admin`, `/xmlrpc.php`. Ação: Block.

**Rate limiting rule:** 100 requests / 10 segundos por IP → Block por 10 segundos (limite do plano Free).

**Under Attack Mode:** disponível em Security → Overview para ativar CAPTCHA global em caso de ataque severo.

### VPS

**UFW:** portas 80/443 restritas aos IPs do Cloudflare (15 ranges IPv4 + 7 IPv6). SSH (porta 22) aberto. Todo o resto bloqueado.

**Fail2ban:** proteção SSH — 3 tentativas falhas em 10 min → ban de 48h. Configurado em `/etc/fail2ban/jail.local`.

**Caddy:** reverse proxy com SSL automático via Let's Encrypt. Certificados ativos para `devsaderiva.com.br`, `www.devsaderiva.com.br` e `dashboard.devsaderiva.com.br`.

### Content Security Policy (CSP)

A CSP enforced em `nginx.conf` e `vercel.json` usa `script-src` **hash-based, sem `'unsafe-inline'`** desde 28/05/2026.

**Hashes gerenciados automaticamente:** o script `scripts/update-csp-hashes.mjs` (executado pelo `postbuild`) varre `dist/client/**/*.html` após cada build, extrai todos os hashes SHA-256 dos scripts inline presentes nas páginas pré-renderizadas e reescreve o `script-src` em ambos os arquivos de configuração. Isso garante que os hashes fiquem sempre sincronizados com o build atual sem intervenção manual.

**Scripts inline existentes cobertos por hashes:**
- `ThemeProvider.astro` — script `is:inline` de inicialização do tema (conteúdo fixo, hash estável entre builds)
- `Base.astro` — script `is:inline` de inicialização do Google tag/gtag (conteúdo fixo)
- Scripts bundled pelo Astro para páginas estáticas — módulos pequenos otimizados pelo Vite (Vercel Analytics, cookie consent, scripts de página)

**Refatoração `define:vars`:** scripts que usavam `define:vars` (passagem inline de dados do server para o browser) foram migrados para JSON mínimo ou carregamento sob demanda. A home não embute mais todos os posts: busca lotes reais via `/api/posts.json`. `busca.astro` mantém índice público em `<script type="application/json" id="...">`; `CategoriaPage.astro` mantém apenas configuração mínima (`categorySlug`, `pageSize`, `hasMore`) e busca próximos lotes pelo endpoint JSON.

**Páginas SSR:** scripts das páginas SSR são emitidos como arquivos externos (`/_astro/*.js`) pelo Astro, cobertos por `'self'` — não requerem hashes.

A CSP `Content-Security-Policy-Report-Only` continua ativa com `script-src 'self'` para monitorar violações residuais.

---

## Riscos e oportunidades

| Prioridade | Item | Status | Recomendação |
| --- | --- | --- | --- |
| Alta | Build depende do dashboard | Aberto | Cache de fallback no build ou falha explícita. |
| Alta | Parser Markdown próprio | Aberto | Usar remark/rehype/MDX com sanitização via AST. |
| Média | Scripts extensos em `.astro` | Aberto | Extrair módulos TypeScript testáveis. |
| Média | Imagens PNG de hero ~2 MB | Aberto | Converter para WebP/AVIF com `<picture>` responsivo. |
| Média | Animações sem reduced motion amplo | Aberto | Guardas globais de `prefers-reduced-motion`. |
| Média | E2E tests excluídos do CI | Parcial | Adicionar ao CI contra preview estático quando estabilizar. |
| Baixa | Gitleaks — possíveis falsos positivos | Novo | Criar `.gitleaks.toml` com allowlist se necessário. |
| Baixa | Releases versionadas com symlink | Futuro | `/releases/{sha}` + symlink `current` para rollback zero-downtime. |
| Resolvido | CSP `'unsafe-inline'` no `script-src` | ✓ | Substituído por hash-based + `postbuild` de atualização automática. |
| Resolvido | SEO — canonical, sitemap, OG, JSON-LD | ✓ | — |
| Resolvido | Ausência de testes unitários | ✓ | — |
| Resolvido | Ausência de CI/CD estruturado | ✓ | — |
| Resolvido | Paginação de categorias | ✓ | — |
| Resolvido | Página de newsletter | ✓ | — |
| Resolvido | Exposição direta do IP da VPS | ✓ | — |
| Resolvido | Ausência de proteção DDoS e WAF | ✓ | — |
| Resolvido | Ausência de firewall UFW e Fail2ban na VPS | ✓ | — |

---

## Glossário técnico

| Termo | Definição |
| --- | --- |
| Astro | Framework SSG para gerar páginas estáticas com componentes `.astro`. |
| SSG | Static Site Generation; HTML gerado em build. |
| Frontmatter | Bloco `---` executado no servidor/build. |
| Dashboard | Backend externo Next.js que fornece conteúdo e ações dinâmicas. |
| PUBLIC_DASHBOARD_URL | Variável pública que aponta para o dashboard. |
| PUBLIC_COMMIT_SHA | SHA do commit passado como ARG no Docker, exposto no `/health.json`. |
| Canvas | API de desenho 2D usada nas animações BlackHole, Navbar e StarBackground. |
| localStorage | Persistência local de intro, readerId e progresso de leitura. |
| sessionStorage | Estado por aba para origem de navegação. |
| CSP | Content Security Policy configurada em `vercel.json`. |
| Honeypot | Campo invisível no formulário de newsletter para detectar bots. |
| Smoke test | Verificação básica pós-deploy de que as rotas públicas respondem HTTP 2xx. |
| Healthcheck | Endpoint `/health.json` com status, app, versão e timestamp do build. |
| Rollback | Reversão automática para o commit anterior quando o smoke falha. |
| Gitleaks | Ferramenta que escaneia o histórico git em busca de segredos expostos. |
| Dependency Review | Action do GitHub que bloqueia PRs com dependências vulneráveis. |
| Lighthouse CI | Automação de auditorias Lighthouse com thresholds bloqueantes. |
| Vitest | Framework de testes unitários compatível com Vite. |
| Playwright | Framework de testes e2e baseado em browser real. |
| AEO/GEO | Answer Engine / Generative Engine Optimization: otimização para LLMs e motores de resposta de IA. |
| llms.txt | Arquivo de contexto para que LLMs entendam o propósito do site. |
| k6 | Ferramenta de load test usada no smoke de carga manual. |
| Cloudflare | Proxy reverso e CDN que oculta o IP da VPS, aplica WAF e absorve ataques DDoS. |
| WAF | Web Application Firewall: filtra requisições maliciosas antes de chegarem à origem. |
| UFW | Uncomplicated Firewall: gerenciador de iptables no Ubuntu/Debian. |
| Fail2ban | Monitora logs e bane IPs com comportamento suspeito (ex: brute force SSH). |
| Caddy | Servidor web/reverse proxy que gerencia SSL automaticamente via Let's Encrypt. |
| HSTS | HTTP Strict Transport Security: força HTTPS no browser por um período definido. |
| Rate Limiting | Limita requisições por IP em um intervalo de tempo para mitigar HTTP flood. |
| DDoS | Distributed Denial of Service: ataque que tenta sobrecarregar o servidor com tráfego. |
| Under Attack Mode | Modo Cloudflare que coloca CAPTCHA em todo tráfego durante ataques severos. |

---

## Apêndice — arquivo por arquivo

| Arquivo | Tipo | Linhas | Função prática |
| --- | --- | --- | --- |
| `.env.example` | Infra/config | 5 | Documenta variáveis de ambiente para desenvolvimento local. |
| `.github/workflows/ci.yml` | CI/CD | 209 | Pipeline completo: quality, build, audit, lighthouse, deploy, smoke com rollback. |
| `Dockerfile` | Infra/config | 25 | Multi-stage Node 22 Alpine → Nginx. Passa PUBLIC_COMMIT_SHA. |
| `README.md` | Markdown | 105 | Documentação de entrada do projeto. |
| `astro.config.mjs` | JavaScript/config | 9 | Integra Tailwind v4 via plugin Vite. |
| `docker-compose.prod.yml` | Infra/config | 3 | Override de restart para produção. |
| `docker-compose.yml` | Infra/config | 10 | Serviço blog com PUBLIC_COMMIT_SHA e porta local 4321. |
| `docs/architecture.md` | Markdown | 110 | Arquitetura do projeto. |
| `docs/ci-cd.md` | Markdown | 186 | Pipeline CI/CD, scripts, secrets, rollback e smoke test. |
| `docs/content-system.md` | Markdown | 90 | Sistema de conteúdo. |
| `docs/conventions.md` | Markdown | 88 | Convenções de código. |
| `docs/dashboard.md` | Markdown | 105 | APIs do dashboard externo. |
| `docs/database.md` | Markdown | 91 | Esquema do banco de dados. |
| `docs/design-system.md` | Markdown | 99 | Design system e tokens. |
| `docs/frontend.md` | Markdown | 118 | Guia de desenvolvimento frontend. |
| `docs/performance.md` | Markdown | 94 | Estratégias de performance. |
| `docs/privacy-newsletter.md` | Markdown | 110 | Privacidade e newsletter. |
| `docs/project-overview.md` | Markdown | 58 | Visão geral do projeto. |
| `docs/roadmap.md` | Markdown | 53 | Roadmap. |
| `docs/security.md` | Markdown | 145 | Configurações de segurança: Cloudflare, UFW, Fail2ban, Caddy. |
| `lighthouserc.cjs` | CI/config | 35 | 5 URLs, 3 runs, thresholds `error` em todas as métricas. |
| `nginx.conf` | Infra/config | 18 | try_files, 404 customizado, cache longo para assets. |
| `package.json` | JSON | 38 | 14 scripts. Dependências Astro 6, Tailwind 4, Vitest, Playwright. |
| `playwright.config.ts` | Config | 15 | Configuração e2e Playwright. |
| `scripts/check-links.mjs` | Script | 103 | Links internos e âncoras em dist/. |
| `scripts/update-csp-hashes.mjs` | Script | ~60 | Pós-build: extrai hashes SHA-256 de scripts inline do dist/client/ e atualiza vercel.json e nginx.conf. |
| `scripts/check-security.mjs` | Script | 67 | npm audit + segredos + .env.example. |
| `scripts/check-seo.mjs` | Script | 69 | SEO técnico em dist/. |
| `scripts/deploy.sh` | Shell | 43 | .previous-rev, git, docker compose, trap ERR. |
| `scripts/lint.mjs` | Script | 71 | Conflitos Git, CRLF, newline, placeholders. |
| `scripts/rollback.sh` | Shell | 31 | Reverte para .previous-rev. |
| `scripts/smoke-test.mjs` | Script | 65 | 8 rotas + assets + health.json. |
| `scripts/validate-content.mjs` | Script | 108 | Frontmatter markdown local. |
| `src/components/BlackHole.astro` | Astro | 581 | Canvas do buraco negro: orbital, partículas, astronauta. |
| `src/components/CategoriaPage.astro` | Astro | 709 | Template de categoria com carrossel e grid. |
| `src/components/Comments.astro` | Astro | 808 | Comentários moderados via OAuth. |
| `src/components/ErrorPage.astro` | Astro | 394 | Página visual de erro 404/500. |
| `src/components/Navbar.astro` | Astro | 993 | Navbar fixa com dropdown, logo canvas, ícones animados. |
| `src/components/StarBackground.astro` | Astro | 150 | Fundo espacial CSS/DOM. |
| `src/components/ThemeProvider.astro` | Astro | 31 | Tema antes do primeiro paint. |
| `src/env.d.ts` | TypeScript | 1 | Referência de tipos Astro. |
| `src/layouts/Base.astro` | Astro | 276 | Layout global: SEO completo, navbar, analytics, CTA admin. |
| `src/lib/categories.ts` | TypeScript | 49 | Lista canônica de categorias com metadados. |
| `src/lib/newsletter-email.ts` | TypeScript | 86 | Validação e normalização de e-mail. 23 testes. |
| `src/lib/posts.ts` | TypeScript | 276 | Dados de posts: fetch, normalize, parse Markdown, paginatePosts, escapeHtml. |
| `src/lib/reading-progress-client.ts` | TypeScript | 144 | Progresso de leitura: readerId, localStorage, sync. |
| `src/pages/404.astro` | Astro | 8 | Wrapper de ErrorPage para 404. |
| `src/pages/500.astro` | Astro | 8 | Wrapper de ErrorPage para 500. |
| `src/pages/admin/login.astro` | Astro | 106 | Placeholder histórico. |
| `src/pages/ai-index.json.ts` | Astro/TS | 47 | AEO: metadados do blog em JSON para LLMs. |
| `src/pages/categorias/[categoria]/pagina/[n].astro` | Astro | 369 | Paginação dinâmica por categoria. |
| `src/pages/categorias/*.astro` | Astro | 16 cada | Wrappers de rota de categoria. |
| `src/pages/data-deletion.astro` | Astro | 128 | Exclusão de dados (inglês). |
| `src/pages/delete.astro` | Astro | 128 | Alias de data-deletion. |
| `src/pages/devs.astro` | Astro | 530 | Colaboradores em órbita ao redor do buraco negro. |
| `src/pages/exclusao-de-dados.astro` | Astro | 129 | Exclusão de dados (português). |
| `src/pages/health.json.ts` | Astro/TS | 17 | Healthcheck estático com commit SHA. |
| `src/pages/index.astro` | Astro | 1051 | Home: BlackHole, cards editoriais, progresso. |
| `src/pages/manifesto.astro` | Astro | 237 | Texto em perspectiva controlado por scroll. |
| `src/pages/newsletter.astro` | Astro | 438 | Inscrição na newsletter com honeypot e consentimento LGPD. |
| `src/pages/posts/[slug].astro` | Astro | 1417 | Rota de post: conteúdo, comentários, newsletter, progresso. |
| `src/pages/privacidade.astro` | Astro | 149 | Política de privacidade. |
| `src/pages/sitemap.xml.ts` | Astro/TS | 48 | Sitemap.xml dinâmico. |
| `src/pages/termos.astro` | Astro | 137 | Termos de uso. |
| `src/styles/tailwind.css` | CSS | ~5 | Entry point Tailwind v4. |
| `src/styles/tokens.css` | CSS | 94 | Tokens de cor e base global. |
| `tests/e2e/categorias.spec.ts` | Test/e2e | ~30 | Categorias no browser. |
| `tests/e2e/home.spec.ts` | Test/e2e | ~30 | Home no browser. |
| `tests/e2e/post-interactions.spec.ts` | Test/e2e | ~30 | Post no browser. |
| `tests/newsletter-email.test.ts` | Test/unit | 112 | 23 casos de email. |
| `tests/posts.test.ts` | Test/unit | 182 | 24 casos de lib/posts. |
| `tests/security.test.ts` | Test/unit | 51 | 17 casos XSS escapeHtml. |
| `tests/smoke.k6.js` | Test/load | 34 | Load test k6. |
| `tsconfig.json` | Config | 9 | TypeScript strict + vitest/globals. |
| `vercel.json` | JSON | 17 | Headers de segurança. |
| `vitest.config.ts` | Config | 8 | Ambiente Node, inclui tests/**/*.test.ts. |

---

## Inventário completo

| Arquivo | Tipo | Linhas | Tamanho |
| --- | --- | --- | --- |
| `.env.example` | Infra/config | 5 | 261 bytes |
| `.github/workflows/ci.yml` | CI/CD | 209 | 5205 bytes |
| `Dockerfile` | Infra/config | 25 | ~950 bytes |
| `README.md` | Markdown | 105 | 4005 bytes |
| `astro.config.mjs` | JavaScript/config | 9 | ~230 bytes |
| `docker-compose.prod.yml` | Infra/config | 3 | 38 bytes |
| `docker-compose.yml` | Infra/config | 10 | ~260 bytes |
| `docs/architecture.md` | Markdown | 110 | 3333 bytes |
| `docs/ci-cd.md` | Markdown | 186 | ~5500 bytes |
| `docs/content-system.md` | Markdown | 90 | 2196 bytes |
| `docs/conventions.md` | Markdown | 88 | 2297 bytes |
| `docs/dashboard.md` | Markdown | 105 | 2512 bytes |
| `docs/database.md` | Markdown | 91 | 2518 bytes |
| `docs/design-system.md` | Markdown | 99 | 2759 bytes |
| `docs/frontend.md` | Markdown | 118 | 3912 bytes |
| `docs/performance.md` | Markdown | 94 | 2233 bytes |
| `docs/privacy-newsletter.md` | Markdown | 110 | 3701 bytes |
| `docs/project-overview.md` | Markdown | 58 | 2845 bytes |
| `docs/roadmap.md` | Markdown | 53 | 1497 bytes |
| `docs/security.md` | Markdown | 145 | ~4 KB |
| `lighthouserc.cjs` | CI/config | 35 | 1080 bytes |
| `nginx.conf` | Infra/config | 18 | 460 bytes |
| `package.json` | JSON | 39 | ~1000 bytes |
| `playwright.config.ts` | Config | 15 | 304 bytes |
| `scripts/check-links.mjs` | Script | 103 | 3188 bytes |
| `scripts/update-csp-hashes.mjs` | Script | ~60 | ~2 KB |
| `scripts/check-security.mjs` | Script | 67 | 1989 bytes |
| `scripts/check-seo.mjs` | Script | 69 | 2361 bytes |
| `scripts/deploy.sh` | Shell | 43 | 1288 bytes |
| `scripts/lint.mjs` | Script | 71 | 2048 bytes |
| `scripts/rollback.sh` | Shell | 31 | 885 bytes |
| `scripts/smoke-test.mjs` | Script | 65 | 2012 bytes |
| `scripts/validate-content.mjs` | Script | 108 | 3767 bytes |
| `src/components/BlackHole.astro` | Astro | 581 | 16882 bytes |
| `src/components/CategoriaPage.astro` | Astro | 709 | 19848 bytes |
| `src/components/Comments.astro` | Astro | 808 | 28095 bytes |
| `src/components/ErrorPage.astro` | Astro | 394 | 8936 bytes |
| `src/components/Navbar.astro` | Astro | 993 | 28845 bytes |
| `src/components/StarBackground.astro` | Astro | 150 | 5324 bytes |
| `src/components/ThemeProvider.astro` | Astro | 31 | 922 bytes |
| `src/env.d.ts` | TypeScript | 1 | 45 bytes |
| `src/layouts/Base.astro` | Astro | 276 | 7187 bytes |
| `src/lib/categories.ts` | TypeScript | 49 | 1814 bytes |
| `src/lib/newsletter-email.ts` | TypeScript | 86 | 2876 bytes |
| `src/lib/posts.ts` | TypeScript | 276 | 7851 bytes |
| `src/lib/reading-progress-client.ts` | TypeScript | 144 | 4474 bytes |
| `src/pages/404.astro` | Astro | 8 | 193 bytes |
| `src/pages/500.astro` | Astro | 8 | 193 bytes |
| `src/pages/admin/login.astro` | Astro | 106 | 2602 bytes |
| `src/pages/ai-index.json.ts` | Astro/TS | 47 | 1487 bytes |
| `src/pages/categorias/[categoria]/pagina/[n].astro` | Astro | 369 | ~11 KB |
| `src/pages/categorias/aleatoriedades.astro` | Astro | 16 | 516 bytes |
| `src/pages/categorias/carreira.astro` | Astro | 16 | 675 bytes |
| `src/pages/categorias/livros.astro` | Astro | 16 | 581 bytes |
| `src/pages/categorias/musica.astro` | Astro | 16 | 509 bytes |
| `src/pages/categorias/noticias.astro` | Astro | 16 | 520 bytes |
| `src/pages/categorias/tech.astro` | Astro | 16 | 556 bytes |
| `src/pages/data-deletion.astro` | Astro | 128 | 2861 bytes |
| `src/pages/delete.astro` | Astro | 128 | 2861 bytes |
| `src/pages/devs.astro` | Astro | 530 | 15851 bytes |
| `src/pages/exclusao-de-dados.astro` | Astro | 129 | 2990 bytes |
| `src/pages/health.json.ts` | Astro/TS | 17 | 413 bytes |
| `src/pages/index.astro` | Astro | 1051 | 33990 bytes |
| `src/pages/manifesto.astro` | Astro | 237 | 7656 bytes |
| `src/pages/newsletter.astro` | Astro | 438 | 12212 bytes |
| `src/pages/posts/[slug].astro` | Astro | 1417 | 38707 bytes |
| `src/pages/privacidade.astro` | Astro | 149 | 3767 bytes |
| `src/pages/sitemap.xml.ts` | Astro/TS | 48 | 1678 bytes |
| `src/pages/termos.astro` | Astro | 137 | 3151 bytes |
| `src/styles/tailwind.css` | CSS | ~5 | ~80 bytes |
| `src/styles/tokens.css` | CSS | 94 | 2828 bytes |
| `tests/e2e/categorias.spec.ts` | Test/e2e | ~30 | ~900 bytes |
| `tests/e2e/home.spec.ts` | Test/e2e | ~30 | ~900 bytes |
| `tests/e2e/post-interactions.spec.ts` | Test/e2e | ~30 | ~900 bytes |
| `tests/newsletter-email.test.ts` | Test/unit | 112 | 3959 bytes |
| `tests/posts.test.ts` | Test/unit | 182 | 5233 bytes |
| `tests/security.test.ts` | Test/unit | 51 | 1564 bytes |
| `tests/smoke.k6.js` | Test/load | 34 | ~900 bytes |
| `tsconfig.json` | Config | 9 | 239 bytes |
| `vercel.json` | JSON | 17 | 684 bytes |
| `vitest.config.ts` | Config | 8 | 158 bytes |
| *Assets public/ (19+ arquivos)* | Asset | — | ver seção 12 |
