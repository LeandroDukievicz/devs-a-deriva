# Milestones — devs-a-deriva (Blog)

Blog estático em Astro 6 servido via Docker + Nginx + Caddy na mesma VPS do dashboard.
Posts vêm de `GET /api/posts` no dashboard. Comentários passam por OAuth no dashboard.

---

## Milestone 1 — Infraestrutura & Deploy

Checklist:

- [x] Dockerfile multi-stage Node 22 Alpine builder → Nginx Alpine serve.
- [x] `nginx.conf` com `try_files` para roteamento Astro (diretórios com index.html).
- [x] Cache de 1 ano com `immutable` para assets com hash (js, css, webp, woff2).
- [x] `docker-compose.yml` expondo `127.0.0.1:4321:80` para o Caddy.
- [x] `docker-compose.prod.yml` com `restart: always`.
- [x] `scripts/deploy.sh` com git pull + build + up -d.
- [x] Caddyfile com vhost `devsaderiva.com.br` e HTTPS automático via Let's Encrypt.
- [x] CI/CD via GitHub Actions: build check + SSH deploy na VPS ao push em main.
- [x] DNS apontando para a VPS (A records); HTTPS funcionando em producao.

---

## Milestone 2 — SEO & Performance

Checklist:

- [x] `<html lang="pt-BR">` e `<meta charset>` em Base.astro.
- [x] Meta title/description por página via props do layout Base.astro.
- [x] Open Graph (og:title, og:description, og:image, og:type, og:locale) em todas as páginas.
- [x] Twitter Card em todas as páginas.
- [x] `<link rel="canonical">` gerado dinamicamente por página.
- [x] Schema.org Organization em Base.astro; BlogPosting com author/datePublished em posts/[slug].astro.
- [x] Sitemap dinâmico gerado em build time com todos os posts PUBLISHED.
- [x] `robots.txt` com allowlist de crawlers e link para sitemap.
- [x] Vercel Analytics integrado via `@vercel/analytics/astro`.
- [x] Google Analytics (gtag.js) integrado em Base.astro.
- [x] [P2] Lighthouse CI automatizado no PR/push para monitorar Core Web Vitals.

---

## Milestone 3 — Acessibilidade

Checklist:

- [x] `lang="pt-BR"` no elemento `<html>`.
- [x] Skip-to-content link visível ao foco do teclado em Base.astro.
- [x] `id="main-content"` em todas as páginas para o skip-link funcionar.
- [x] `aria-label="Navegação principal"` no `<nav>` do Navbar.
- [x] `focus-visible` explícito em nav-links, botões, dropdown-links, logo e back-to-top.
- [x] `<main>` semântico em todas as páginas (devs, categorias, posts, legais, admin).
- [x] Botão back-to-top com `aria-label` e `focus-visible` estilizado.

---

## Milestone 4 — Segurança

Checklist:

- [x] Headers de segurança em `nginx.conf`: CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy. _(Implementado; `unsafe-inline` necessário para scripts inline do Astro — migrar para nonces se o blog adotar SSR/middleware.)_
- [x] [P0] Fluxo OAuth para comentários usa `state` assinado com HMAC no dashboard. `lib/comment-state.ts` gera nonce de 32 bytes, `exp` de 10 minutos e HMAC-SHA256 com `AUTH_SECRET`; `/comment/login` e `/comment/finalize` validam o token antes de seguir.
- [x] [P0] Rate limit no endpoint `POST /api/comments/draft` do dashboard por IP: endpoint `comment-draft`, janela de 1 min, limite de 5 tentativas, usando `ApiRateLimitAttempt`.
- [x] [P1] Comentários criados após OAuth entram com `status: PENDING` e nunca `APPROVED` direto. O fluxo confirmado é `AWAITING_AUTH -> PENDING -> APPROVED | REJECTED`.
- [x] [P1] Configurar Dependabot no repositório: `.github/dependabot.yml` com atualizações semanais de npm e GitHub Actions.

---

## Milestone 5 — Funcionalidades do Blog

Checklist:

- [x] Home exibe posts PUBLISHED buscados do dashboard com cache.
- [x] Paginação na home: `paginatePosts()` renderiza 10 posts no build; botão "Load More" com script client-side que insere os próximos via `define:vars`.
- [x] Páginas de categoria listam posts filtrados por categoria com paginação igual à home.
- [x] Página de post individual (`/posts/[slug]`) com conteúdo real, author, meta e Schema.org.
- [x] Página `/devs` com cards de colaboradores buscados do dashboard.
- [x] Página de manifesto, privacidade, termos e exclusão de dados.
- [x] Seção de comentários com OAuth (Google, GitHub, Discord) via dashboard.
- [x] Newsletter subscribe integrada ao dashboard.
- [x] Reading progress tracked via API do dashboard.
- [ ] [P1] "Carregar mais" na home: validar que o botão é ocultado corretamente quando não há mais posts e que o comportamento funciona com poucos posts (menos que pageSize).
- [ ] [P2] SEO de posts antigos: considerar geração de páginas estáticas `/categorias/[slug]/pagina/[n]` via `getStaticPaths()` para garantir indexação sem depender de JavaScript.
- [ ] [P2] Webhook de rebuild: ao publicar post no dashboard, disparar rebuild automático do blog com popup de progresso no dashboard mostrando status do CI/CD.

---

## Milestone 6 — Testes

Checklist:

- [x] Vitest configurado (`vitest.config.ts`, scripts `test` e `test:watch` no package.json).
- [x] Playwright configurado (`playwright.config.ts`, script `test:e2e`).
- [x] `tests/posts.test.ts`: testes unitários para `paginatePosts()` e `getPost()`.
- [x] `tests/e2e/home.spec.ts`: smoke tests Playwright na home e em página de post.
- [ ] [P1] Adicionar testes unitários para helpers de formatação de data, leitura de tempo e slug.
- [ ] [P1] Expandir E2E: navegação por categorias, abertura de comentários, subscribe newsletter.
- [x] [P1] Integrar `npm test` no CI (GitHub Actions) antes do deploy.
