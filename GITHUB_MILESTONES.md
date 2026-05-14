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
- [x] [P1] Rate limiting no Nginx: adicionar `limit_req_zone` (30r/s por IP, burst 60) e `limit_conn_zone` (20 conexões simultâneas por IP) no `nginx.conf` para mitigar DDoS e slowloris. Adicionar timeouts agressivos: `client_body_timeout 10s`, `client_header_timeout 10s`, `send_timeout 10s`.
- [ ] [P1] Colocar Cloudflare (plano gratuito) na frente do VPS: esconde o IP real do servidor, absorve ataques volumétricos antes de chegarem ao Nginx, e ativa proteção DDoS L3/L4 sem custo.
- [ ] [P2] Configurar firewall no VPS (ufw/iptables): permitir apenas 80, 443 e SSH — bloquear todo o resto.

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
- [x] [P1] "Carregar mais" na home: botão já usa `hidden={!firstPage.hasMore}` no SSR e oculta via JS após carregar todos os posts — comportamento correto verificado.
- [ ] [P2] SEO de posts antigos: considerar geração de páginas estáticas `/categorias/[slug]/pagina/[n]` via `getStaticPaths()` para garantir indexação sem depender de JavaScript.
- [ ] [P2] Webhook de rebuild: ao publicar post no dashboard, disparar rebuild automático do blog com popup de progresso no dashboard mostrando status do CI/CD.

---

## Milestone 6 — Testes

Checklist:

- [x] Vitest configurado (`vitest.config.ts`, scripts `test` e `test:watch` no package.json).
- [x] Playwright configurado (`playwright.config.ts`, script `test:e2e`).
- [x] `tests/posts.test.ts`: testes unitários para `paginatePosts()` e `getPost()`.
- [x] `tests/e2e/home.spec.ts`: smoke tests Playwright na home e em página de post.
- [x] [P1] Adicionar testes unitários para helpers de formatação de data, leitura de tempo e slug (cobertos em `tests/posts.test.ts`).
- [x] [P1] Expandir E2E: navegação por categorias e subscribe newsletter (adicionados `categorias.spec.ts` e `newsletter.spec.ts`).
- [x] [P1] Integrar `npm test` no CI (GitHub Actions) antes do deploy.

---

## Milestone 7 — Refatoração

Checklist:

- [x] [P0] Centralizar utilitários de string (`escapeHtml`, `slugText`, `initials`) em `src/lib/utils/string.ts`.
- [x] [P0] Unificar metadados de categorias em `src/lib/categories.ts`, eliminando a duplicidade com `posts.ts`.
- [x] [P0] Remover arquivo `src/pages/delete.astro` (duplicata de `data-deletion.astro`).
- [x] [P1] Mover interfaces `Author` e `Post` para `src/types/blog.ts`.
- [x] [P1] Extrair o bloco de Newsletter de `[slug].astro` para um componente `src/components/Newsletter.astro`.
- [x] [P1] Criar componente `src/components/PostCard.astro` para unificar a exibição de posts na home.
- [x] [P1] Criar `src/layouts/LegalLayout.astro` para centralizar o CSS das páginas de termos, privacidade e exclusão de dados.
- [x] [P2] Converter páginas individuais de categoria para uma rota dinâmica `src/pages/categorias/[categoria].astro`.
- [x] [P2] Centralizar ícones sociais em um componente `src/components/SocialIcon.astro`.

---

## Milestone 8 — Conformidade LGPD

Auditoria realizada em 14/05/2026. Itens organizados por criticidade.

### P0 — Crítico (bloqueadores de conformidade)

- [ ] [P0] **Analytics sem consentimento prévio** — Google Analytics (gtag.js) e Vercel Analytics são carregados incondicionalmente em `src/layouts/Base.astro` (linhas ~105-112), antes de qualquer consentimento do utilizador. Implementar Consent Mode v2: iniciar com `analytics_storage: denied` e só ativar após o utilizador aceitar no banner.
- [ ] [P0] **Banner de cookies sem opção de recusa** — O banner atual (`src/layouts/Base.astro` linhas ~159-172) apenas informa, sem botão de "Recusar". A LGPD exige que o utilizador possa recusar cookies não-essenciais. Adicionar botão "Recusar" que bloqueia o carregamento do GA e Vercel Analytics.
- [ ] [P0] **Retenção de dados não documentada** — A política de privacidade (`src/pages/privacidade.astro`) não indica por quanto tempo os dados são retidos (e-mails de newsletter, comentários, progresso de leitura, logs). Adicionar secção de prazos de retenção para cada categoria de dado.

### P1 — Alto (lacunas relevantes)

- [ ] [P1] **Progresso de leitura sem aviso ao utilizador** — `src/lib/reading-progress-client.ts` armazena e envia ao backend o progresso de leitura (slug, percentagem, conclusão) sem consentimento explícito nem menção na política de privacidade. Adicionar referência na política e incluir no escopo do banner de cookies.
- [ ] [P1] **Anonimização de IP do Google Analytics não documentada** — A política menciona GA mas não informa se o IP é anonimizado. Verificar se `anonymize_ip` está ativo e documentar na política.
- [ ] [P1] **Direitos de portabilidade e retificação ausentes** — A página `src/pages/exclusao-de-dados.astro` cobre exclusão e acesso mas não menciona explicitamente o direito de portabilidade (Art. 18, V LGPD) nem retificação (Art. 18, III LGPD). Adicionar estes direitos ao texto.
- [ ] [P1] **Comentários sem aviso explícito de coleta** — O formulário de comentários (`src/components/Comments.astro`) não informa ao utilizador quais dados são coletados via OAuth (nome, foto, email) e como serão usados. Adicionar texto informativo junto ao botão de login.

### P2 — Médio (boas práticas)

- [ ] [P2] **Dados de menores sem proteção** — Nenhuma página menciona restrição para menores de 13 anos, para quem a LGPD exige consentimento do responsável. Adicionar aviso na política de privacidade e nos formulários de newsletter e comentários.
- [ ] [P2] **Cloudflare não mencionado na política** — Se o domínio usa Cloudflare (DNS/proxy/cache), este processa IPs e requests dos utilizadores mas não está listado como terceiro na política de privacidade. Confirmar e adicionar se aplicável.
- [ ] [P2] **Terceiros sem detalhe de processamento** — A política menciona Google, Vercel e plataformas sociais mas sem especificar que dados cada um recebe, a base legal para o compartilhamento e links para as políticas deles. Detalhar cada integração.
- [ ] [P2] **Double opt-in da newsletter não documentado** — Confirmar se o backend do dashboard implementa confirmação por e-mail antes de ativar o subscriber (status `PENDING` → `ACTIVE`). Se sim, documentar no fluxo da newsletter. Se não, implementar.

