# Milestones — devs-a-deriva (Blog)

Blog estático em Astro 6 servido via Docker + Nginx + Caddy na mesma VPS do dashboard.
Posts vêm de `GET /api/posts` no dashboard. Comentários passam por OAuth no dashboard.

---

## Milestone 0 — Auditoria e Correções de Segurança

Auditoria realizada em 19/05/2026 com foco no blog público Astro e nos contratos com o dashboard. Relatório completo: [`docs/security-audit-2026-05-19.md`](./docs/security-audit-2026-05-19.md).

### P0 — Bloqueadores antes de produção

- [ ] [P0] **Corrigir dependências vulneráveis e estado inválido do lockfile** — `npm run check:security` falha por `npm audit` com 12 vulnerabilidades, incluindo `devalue` alta e transitivas em `tmp`, `ws`, `yaml` e `brace-expansion`; `npm ls --depth=0` também acusa dependências instaladas fora das versões declaradas (`astro`, `tailwindcss`, `@tailwindcss/vite`, `vitest`, `@vitest/ui`, `aeo.js`) e pacote extraneous `@emnapi/runtime`. Rodar atualização controlada (`npm install`/`npm audit fix` sem `--force` primeiro), revisar o diff do `package-lock.json` e repetir `lint`, `typecheck`, `test`, `build`, `check:security`.
- [ ] [P0] **Bloquear analytics até consentimento explícito** — `src/layouts/Base.astro` carrega Vercel Analytics e Google Analytics antes de consentimento, e o banner só tem "Entendi". Implementar Consent Mode v2 com default denied, botão "Aceitar" e "Recusar", persistência da escolha e carregamento condicional de GA/Vercel Analytics.
- [ ] [P0] **Validar no dashboard os endpoints públicos consumidos pelo blog** — confirmar, com testes no projeto `dashboard-ldstudio`, que `POST /api/comments/draft`, `GET /api/comments`, `POST /api/newsletter/subscribe` e `GET/PATCH /api/reading-progress` têm validação server-side, CORS restrito, rate limit, limite de payload e proteção contra abuso. No blog só há validação de UX; a segurança real depende do backend.
- [ ] [P0] **Fechar contrato de URL segura para `PUBLIC_DASHBOARD_URL`** — a env pública controla chamadas de comentários/newsletter/progresso. Adicionar validação de ambiente/documentação para produção exigir `https://dashboard.devsaderiva.com.br`, sem fallback silencioso para `http://localhost:3000` em build/deploy produtivo.

### P1 — Alta prioridade

- [ ] [P1] **Reduzir CSP permissiva** — `nginx.conf` usa `script-src 'unsafe-inline'` e `style-src 'unsafe-inline'`; `vercel.json` usa `connect-src https:` amplo. Definir CSP por ambiente, restringir `connect-src` ao dashboard/analytics necessários, documentar exceções e planejar nonces/hashes se houver SSR/middleware.
- [ ] [P1] **Adicionar privacidade/consentimento ao progresso de leitura** — `src/lib/reading-progress-client.ts` cria `readerId` no `localStorage` e sincroniza `postSlug`, progresso e conclusão com o dashboard. Incluir isso na política, no banner de consentimento e nos controles de exclusão/limpeza local.
- [ ] [P1] **Adicionar aviso explícito de coleta no fluxo de comentários OAuth** — antes dos botões Google/GitHub/Discord, informar que o comentário será associado a nome/avatar/provider/e-mail conforme retorno do dashboard e que será moderado antes de publicar.
- [ ] [P1] **Hardening do redirect de OAuth no dashboard** — o blog envia `redirectTo: window.location.href`; garantir allowlist exata de origem/path no backend, rejeitando hosts externos, query maliciosa e esquemas não HTTPS em produção.
- [ ] [P1] **Revisar CI/CD para supply chain** — fixar permissões mínimas do `GITHUB_TOKEN`, adicionar `permissions:` explícito no workflow, avaliar pin por SHA para actions críticas (`appleboy/ssh-action`, `gitleaks`) e adicionar `npm audit --audit-level=moderate` como etapa visível.

### P2 — Média prioridade

- [ ] [P2] **Consolidar política de LGPD** — documentar retenção para newsletter, comentários, progresso de leitura, analytics e logs; detalhar terceiros (Google, Vercel, Cloudflare, provedores OAuth), base legal, opt-out e direitos de portabilidade/retificação.
- [ ] [P2] **Fortalecer anti-spam de formulários públicos** — newsletter e comentários enviam honeypot/tempo de preenchimento no payload, mas ainda é preciso confirmar que o dashboard valida esses sinais, aplica rate limit por IP/e-mail/provider e ativa captcha adaptativo para comportamento suspeito.
- [ ] [P2] **Criar testes E2E/integração de segurança do contrato público** — cobrir newsletter com consentimento/honeypot, comentários com payload grande/provider inválido/redirectTo inválido, leitura com readerId inválido e respostas genéricas contra enumeração.
- [ ] [P2] **Revisar exposição de dados em endpoints públicos de índice** — `/ai-index.json`, `/rss.xml` e `/docs.json` devem continuar expondo apenas dados publicados e aprovados; adicionar teste que falha se draft, e-mail, IDs internos ou metadados privados aparecerem.

### P3 — Hardening contínuo

- [ ] [P3] **Registrar verificação operacional externa** — documentar evidência de Cloudflare, UFW, Fail2ban, Caddy, TLS e regras WAF em produção. A lista de IPs do Cloudflare em `docs/security.md` confere com a fonte oficial consultada em 19/05/2026, mas regras reais do VPS não são verificáveis pelo repositório.
- [ ] [P3] **Melhorar observabilidade de segurança** — definir alertas para 5xx, falhas de OAuth, picos de comentários/newsletter, bloqueios de rate limit e indisponibilidade do dashboard durante build.
- [ ] [P3] **Limpar dívida menor de DX/segurança** — remover código morto (`timeAgo` em comentários), silenciar hints Astro com `is:inline` explícito onde intencional e revisar usos de `set:html`/`innerHTML` estáticos em checklist periódico.

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

---

## Milestone 9 — Auditoria Final, Escala e Maturidade de Produto

Auditoria técnica e de produto realizada em 19/05/2026.

Objetivo: consolidar pendências críticas abertas nos milestones anteriores, estabelecer fundações para crescimento sustentável do projeto, e garantir que o Devs à Deriva se comporte como produto real — não como protótipo funcional — quando o tráfego, o volume de conteúdo e o número de colaboradores crescerem.

Cada item está anotado com a área afetada e o arquivo ou contexto relevante.

---

### P0 — Bloqueadores reais em aberto (consolidados de milestones anteriores)

Itens que já apareceram em M0 ou M8 e ainda não foram fechados. Não vão a escala com pendências críticas.

- [ ] **[P0 · Segurança · M0]** Corrigir dependências vulneráveis e estado inválido do lockfile — `npm audit` com vulnerabilidades de alta severidade (`devalue`, `tmp`, `ws`, `yaml`, `brace-expansion`); `package-lock.json` com pacotes fora das versões declaradas. Rodar `npm install` + `npm audit fix` sem `--force`, revisar diff, re-executar `lint`, `typecheck`, `test`, `build`, `check:security`.
- [ ] **[P0 · LGPD · M0/M8]** Bloquear analytics (GA + Vercel Analytics) até consentimento explícito — `src/layouts/Base.astro` carrega ambos antes de qualquer ação do usuário. Implementar Consent Mode v2 do Google com `analytics_storage: denied` por padrão; só ativar após aceite no banner. Vercel Analytics deve seguir a mesma lógica.
- [ ] **[P0 · LGPD · M8]** Adicionar botão "Recusar" no banner de cookies — o banner atual só tem "Entendi". A LGPD exige que a recusa seja tão fácil quanto o aceite. Adicionar "Recusar não-essenciais" e persistir a escolha.
- [ ] **[P0 · LGPD · M8]** Documentar retenção de dados na política de privacidade — newsletter, comentários, progresso de leitura, logs de acesso, analytics devem ter prazo explícito. A política (`src/pages/privacidade.astro`) não cobre isso.
- [ ] **[P0 · Segurança · M0]** Fechar contrato de URL segura para `PUBLIC_DASHBOARD_URL` — o fallback `http://localhost:3000` não deve aparecer em build de produção. Adicionar validação de ambiente que falhe o build se a URL não for HTTPS.

---

### P1 — Alta prioridade: hardening, compliance e produto funcional

- [ ] **[P1 · Segurança · M0]** Reduzir CSP permissiva — `nginx.conf` usa `unsafe-inline` para scripts e estilos; `vercel.json` usa `connect-src https:` aberto. Definir CSP por ambiente: restringir `connect-src` às origens reais (dashboard, GA, Vercel Analytics), eliminar `unsafe-inline` progressivamente usando nonces ou migração de scripts inline para `.js` externo.
- [ ] **[P1 · LGPD · M0/M8]** Incluir progresso de leitura no escopo do banner de consentimento — `src/lib/reading-progress-client.ts` cria `readerId` em localStorage e sincroniza com o dashboard sem menção ao usuário. Adicionar na política e no banner.
- [ ] **[P1 · LGPD · M8]** Adicionar aviso de coleta antes do fluxo OAuth de comentários — `src/components/Comments.astro` mostra os botões de login sem informar que nome, foto, e-mail e provider serão coletados pelo dashboard e associados ao comentário. Inserir texto antes da exibição dos botões.
- [ ] **[P1 · LGPD · M8]** Adicionar direitos de portabilidade e retificação à página de exclusão de dados — `src/pages/exclusao-de-dados.astro` cobre exclusão e acesso mas omite Art. 18 III (retificação) e Art. 18 V (portabilidade) da LGPD.
- [ ] **[P1 · Infraestrutura · M4]** Colocar Cloudflare na frente do VPS — esconde IP real, absorve ataques volumétricos e ativa proteção DDoS L3/L4 sem custo. Documentar IPs do Cloudflare em `nginx.conf` para `real_ip_header`.
- [ ] **[P1 · Infraestrutura · M4]** Configurar firewall no VPS — permitir apenas 80, 443 e porta SSH customizada; bloquear todo o resto via `ufw` ou `iptables`. Documentar em `docs/security.md`.
- [ ] **[P1 · SEO · M5]** Gerar páginas estáticas de paginação por categoria via `getStaticPaths()` — `/categorias/[slug]/pagina/[n]` garante indexação do conteúdo mais antigo sem depender de JavaScript no crawler. Já existe estrutura de pasta `src/pages/categorias/[categoria]/pagina/[n].astro`.
- [ ] **[P1 · CI/CD · M0]** Fixar permissões mínimas do `GITHUB_TOKEN` no workflow, adicionar `permissions:` explícito, pin por SHA para `appleboy/ssh-action` e `gitleaks`, e `npm audit --audit-level=moderate` como etapa obrigatória bloqueante.
- [ ] **[P1 · Segurança · M0]** Confirmar e documentar que `POST /api/comments/draft`, `GET /api/comments`, `POST /api/newsletter/subscribe` e `PATCH /api/reading-progress` no dashboard têm: validação server-side, CORS restrito às origens reais, rate limit, limite de payload e proteção contra replay. Criar testes de contrato no `dashboard-ldstudio` que falhem se esses controles forem removidos.

---

### P2 — Média prioridade: produto mais robusto, observabilidade e editorial

#### Observabilidade e operações

- [ ] **[P2 · Ops]** Implementar health check do dashboard no processo de build do blog — se `PUBLIC_DASHBOARD_URL/health` não responder com 200 durante o build, gerar alerta (não bloquear build, mas emitir warning visível no CI e no dashboard editorial).
- [ ] **[P2 · Ops]** Configurar uptime monitoring externo — serviço como BetterUptime, UptimeRobot ou similar monitorando `https://devsaderiva.com.br`, `https://dashboard.devsaderiva.com.br/health` e a rota `GET /api/posts?status=PUBLISHED` com alertas por e-mail.
- [ ] **[P2 · Ops]** Documentar runbook de recuperação de desastre — o que fazer se o VPS cair, se o banco corromper, se o CI/CD falhar em produção, se as credenciais OAuth expirarem. Adicionar em `docs/incident-runbook.md` (equivalente ao que já existe no dashboard, mas para o blog).
- [ ] **[P2 · Ops]** Backup automático e verificado do banco PostgreSQL — backup diário com retenção de 30 dias, restore testado periodicamente. Documentar processo em `docs/operations.md`.
- [ ] **[P2 · Obs]** Implementar alertas para eventos críticos de segurança — 5xx em série, picos de rate limit acionado, falhas de OAuth, indisponibilidade do dashboard durante build. Pode ser via webhook para canal Discord/Slack ou e-mail.

#### Busca e descoberta de conteúdo

- [ ] **[P2 · Produto]** Expor `/busca` na navegação — a página `src/pages/busca.astro` foi implementada mas não está linkada no `Navbar.astro`. Adicionar item "Busca" ou ícone de lupa na navbar, especialmente para mobile.
- [ ] **[P2 · SEO]** Adicionar `sitemap.xml` com prioridade diferenciada para posts recentes — posts publicados nos últimos 30 dias com `priority: 0.9`, demais com `priority: 0.7`. Já existe `src/pages/sitemap.xml.ts`.
- [ ] **[P2 · AEO]** Implementar JSON-LD de `SearchAction` na home — permite que motores de busca e agentes de IA entendam que o site tem busca interna. Usar `potentialAction` do tipo `SearchAction` apontando para `/busca?q={search_term_string}`.
- [ ] **[P2 · Produto]** Suporte a busca por URL em `/busca?q=termo` — já implementado via `URLSearchParams`, mas o campo precisa limpar o parâmetro da URL ao limpar a busca (atualizar `window.history.replaceState` ao clicar em "Limpar").

#### Sistema editorial e revisões

- [ ] **[P2 · Dashboard]** Adicionar link "Histórico de revisões" no editor de posts do dashboard — a página `app/dashboard/posts/[id]/revisoes/page.tsx` foi criada, mas não há caminho de navegação até ela a partir do editor. Adicionar botão no `NavRail.tsx` ou `PostActions.tsx`.
- [ ] **[P2 · Dashboard]** Implementar diff visual simples entre revisão e versão atual — a página de revisões mostra o conteúdo completo; adicionar destaque de diferenças (linhas adicionadas/removidas) usando comparação de texto simples sem biblioteca pesada.
- [ ] **[P2 · Dashboard]** Adicionar política de retenção de revisões — revisões não têm limite hoje. Implementar job de compactação que mantém as últimas 50 revisões por post e arquiva as demais (sem deletar, apenas movendo para tabela de arquivo ou marcando como `archived`).
- [ ] **[P2 · Dashboard]** Regenerar `contentHtml` na restauração de revisão — `restoreRevision()` em `app/services/postRevision.service.ts` restaura o `contentHtml` salvo na revisão, que pode estar desatualizado se o parser Markdown evoluiu. Chamar `markdownToHtml()` no conteúdo restaurado antes de persistir.
- [ ] **[P2 · Blog]** Implementar webhook de rebuild automático — ao publicar ou despublicar post no dashboard, disparar rebuild do blog via `curl -X POST` ao endpoint do GitHub Actions com token restrito. Mostrar progresso no dashboard editorial.

#### Newsletter e curadoria

- [ ] **[P2 · Newsletter]** Confirmar e documentar double opt-in — verificar se o subscriber passa por `PENDING → ACTIVE` após confirmação de e-mail antes de receber comunicações. Se não houver, implementar token de confirmação com expiração de 48h e reenvio opcional.
- [ ] **[P2 · Newsletter]** Adicionar métricas de entrega à interface editorial — taxa de abertura (se rastreada), cliques, bounces, descadastros por edição. Pode ser via dashboard do Resend ou implementação interna simples.
- [ ] **[P2 · Newsletter]** Implementar preview de e-mail antes do disparo — no fluxo editorial do dashboard, renderizar uma preview HTML da newsletter antes de confirmar o envio, com modo mobile e desktop.
- [ ] **[P2 · Newsletter]** Adicionar link de descadastro com único clique — o link de unsubscribe no e-mail deve funcionar sem login e expirar após uso. Confirmar que `unsubscribeToken` está sendo gerado, enviado no e-mail e que o endpoint de descadastro não exige autenticação.

#### LGPD pendente de M8

- [ ] **[P2 · LGPD · M8]** Adicionar proteção para dados de menores — aviso na política de privacidade e nos formulários de newsletter e comentários informando que o serviço não é destinado a menores de 13 anos e que esse público requer consentimento do responsável.
- [ ] **[P2 · LGPD · M8]** Adicionar Cloudflare à lista de terceiros na política — se o domínio usa Cloudflare como proxy, ele processa IPs e requests. Confirmar e listar com base legal (legítimo interesse) e link para política da Cloudflare.
- [ ] **[P2 · LGPD · M8]** Detalhar terceiros na política — para cada integração (Google Analytics, Vercel Analytics, Resend, Cloudflare, provedores OAuth), especificar dados enviados, finalidade, base legal e link para política deles.
- [ ] **[P2 · LGPD · M0]** Criar testes de contrato para endpoints públicos de índice — `/ai-index.json`, `/rss.xml`, `/docs.json` e o futuro endpoint de busca devem ter testes que falhem se draft, e-mail, ID interno, token ou metadado privado aparecer na resposta.

---

### P3 — Fundações para escala futura

Itens que não bloqueiam o produto hoje, mas que se tornam críticos quando o volume de conteúdo, colaboradores ou tráfego crescer.

#### Performance a escala

- [ ] **[P3 · Performance]** Definir estratégia de cache para a API do dashboard — o blog já usa `cache: 'force-cache'` em dev e rebusca em prod, mas não há `stale-while-revalidate` ou `Cache-Control` explícito no endpoint `GET /api/posts`. Com volume, uma resposta de 2–3s na API durante o build vira gargalo. Avaliar cache de borda (Cloudflare Workers KV ou R2) para posts publicados.
- [ ] **[P3 · Performance]** Implementar build incremental para posts — hoje o `fetchPosts()` busca todos os posts a cada build. Com 500+ posts, o tempo de build cresce linearmente. Avaliar `getStaticPaths()` com delta (só re-gerar páginas de posts atualizados desde o último build) via timestamp ou `updatedAt`.
- [ ] **[P3 · Performance]** Pipeline de otimização de imagens de upload — imagens de posts sobem para R2 como-estão. Com volume, isso impacta LCP. Implementar redimensionamento automático para 1200px, geração de WebP e thumbs de 400px no momento do upload no dashboard (via Sharp ou Cloudflare Images).
- [ ] **[P3 · Performance]** Avaliar migração para Cloudflare Pages — o blog é Astro estático; Cloudflare Pages entrega de ~600 PoPs vs o VPS single-region atual. Avaliar custo/benefício e impacto no CI/CD.
- [ ] **[P3 · Performance]** Lazy load de componentes pesados — `BlackHole.astro` e `StarBackground.astro` renderizam canvas/WebGL. Garantir que `prefers-reduced-motion` e conexão lenta (via `navigator.connection.saveData`) desativem animações custosas antes de renderizar.

#### SEO e descoberta a escala

- [ ] **[P3 · SEO]** Gerar páginas de arquivo por mês/ano — `/posts/2026/05` como listagem estática melhora rastreabilidade e navegação histórica. Pode ser gerado em build time via `getStaticPaths()` agrupando posts por `publishedAt`.
- [ ] **[P3 · SEO]** Implementar sistema de tags — posts podem ter múltiplas tags além da categoria. Tags geram páginas `/tags/[tag]` com listagem, melhoram `keywords` no JSON-LD e habilitam busca facetada.
- [ ] **[P3 · SEO]** Adicionar dados estruturados de `BreadcrumbList` — posts individuais se beneficiam de breadcrumb schema (Home → Categoria → Título) para rich results no Google.
- [ ] **[P3 · AEO]** Expandir `llms.txt` e `ai-index.json` com metadados de autor, tags e data — modelos de IA e crawlers especializados valorizam estrutura explícita para descoberta e atribuição.
- [ ] **[P3 · SEO]** Implementar posts relacionados — no final de cada post, listar 3 posts da mesma categoria com menor distância de embedding ou simplesmente os mais recentes da mesma categoria. Já disponível via `getPostsByCategory()`.

#### Multi-autor e fluxo editorial colaborativo

- [ ] **[P3 · Editorial]** Implementar convites de colaborador com escopo de seção — o dashboard já tem modelo `Invite` e `permissions` no `User`. Expor fluxo de convite por seção no painel: convidar alguém para escrever em "Tech" sem acesso a "Newsletter" ou moderação de comentários.
- [ ] **[P3 · Editorial]** Implementar fluxo de revisão de rascunho — post em `REVIEW` deve poder ser comentado internamente por outro colaborador antes de publicar. Tabela de anotações simples (`PostAnnotation`) vinculada ao post e à revisão.
- [ ] **[P3 · Editorial]** Dashboard de métricas editoriais por autor — quantos posts publicados, views acumuladas, média de tempo de leitura e taxa de completude por autor. Combinar dados de `ReadingProgress` e `Post.views`.
- [ ] **[P3 · Editorial]** Adicionar campo `featuredUntil` em posts — posts em destaque hoje são todos os da categoria. Permitir marcar um post como destaque com validade, expirando automaticamente via cron já existente em `app/api/cron/`.

#### API pública e consumo externo

- [ ] **[P3 · API]** Definir versão pública da API de conteúdo — o blog consome `/api/posts?status=PUBLISHED` sem versioning. Com escala, uma breaking change no contrato quebra o build. Adicionar prefixo de versão `/api/v1/posts` ou header `API-Version` e documentar em `docs/api.md`.
- [ ] **[P3 · API]** Implementar endpoint `GET /api/posts/[slug]/related` — retorna posts relacionados por categoria, sem expor dados privados. Permite que a página de post carregue related posts dinamicamente sem rebuild.
- [ ] **[P3 · API]** Avaliar RSS com conteúdo completo opcional — o RSS atual (`src/pages/rss.xml.ts`) pode ser complementado com um feed Atom ou JSON Feed para consumo por ferramentas de curadoria externas e leitores de feed modernos.
- [ ] **[P3 · API]** Criar endpoint `GET /api/posts/stats` público — número de posts publicados por categoria, último post de cada categoria e data de atualização. Permite que ferramentas externas e bots de IA saibam o estado do conteúdo sem parsear HTML.

#### Segurança contínua

- [ ] **[P3 · Segurança]** Implementar rotação automática de `AUTH_SECRET` e `NEXTAUTH_SECRET` — documentar processo de rotação sem downtime: gerar novo secret, atualizar em produção, invalidar sessões ativas (logout forçado) e confirmar funcionamento.
- [ ] **[P3 · Segurança]** Adicionar Dependabot alerts ao dashboard (`dashboard-ldstudio`) — o blog já tem `.github/dependabot.yml`; confirmar que o repositório do dashboard também está configurado.
- [ ] **[P3 · Segurança]** Implementar checklist OWASP automatizado em PRs que toquem auth, comentários ou HTML dinâmico — já existe `.github/pull_request_template.md` no blog com o checklist; criar equivalente no dashboard.
- [ ] **[P3 · Segurança]** Implementar testes de regressão de segurança para XSS em comentários — `tests/e2e/comments-xss.spec.ts` cobre o blog; criar equivalente no dashboard para os endpoints de aprovação/rejeição de comentários.
- [ ] **[P3 · Segurança]** Avaliar WAF rules no Cloudflare — quando o Cloudflare estiver ativo (P1), configurar regras básicas: bloquear user-agents de scanners, limitar payloads grandes em rotas de API, challenge em IPs com muitos 4xx em sequência.

#### LGPD e governança a escala

- [ ] **[P3 · LGPD]** Automatizar atendimento a direitos do titular — hoje o processo é manual (e-mail para `leandrodukievicz1718@gmail.com`). Com volume, implementar formulário no dashboard para registrar, rastrear e responder solicitações de acesso, retificação, exclusão e portabilidade dentro dos prazos legais (15 dias corridos para acesso; prazo razoável para demais).
- [ ] **[P3 · LGPD]** Implementar política de retenção automatizada — job periódico que: anonymiza comentários rejeitados com mais de 90 dias, remove assinantes de newsletter inativos há mais de 24 meses, purga dados de progresso de leitura de `readerId`s sem atividade há 12 meses.
- [ ] **[P3 · LGPD]** Elaborar RIPD — o projeto usa analytics comportamental, progresso de leitura, OAuth e newsletter. A combinação desses fatores pode exigir Relatório de Impacto à Proteção de Dados. Avaliar com base nos critérios da ANPD e documentar em `docs/ripd.md`.
- [ ] **[P3 · LGPD]** Implementar registro de versão da política aceita no consentimento de newsletter — a tabela `NewsletterSubscriber` já tem campos de consentimento; adicionar `privacyPolicyVersion` registrado no momento da inscrição para rastreabilidade em auditorias.
- [ ] **[P3 · LGPD]** Documentar encarregado de dados (DPO) — a política menciona contato por e-mail, mas não identifica formalmente o encarregado (Art. 41 LGPD). Definir e documentar quem é o responsável e como é contatado.

#### Testes e qualidade a escala

- [ ] **[P3 · Testes]** Implementar testes de carga no endpoint `GET /api/posts` — usar `k6` (já presente em `tests/smoke.k6.js`) para validar comportamento sob 100/500/1000 req/s. Definir SLOs de latência (P95 < 500ms) e documentar em `docs/performance.md`.
- [ ] **[P3 · Testes]** Adicionar testes de acessibilidade automatizados no E2E — integrar `axe-core` ao Playwright para capturar regressões de acessibilidade em home, categoria e página de post a cada PR.
- [ ] **[P3 · Testes]** Cobertura de testes para `searchPosts()` em queries com caracteres especiais, Unicode e strings longas — `tests/search.test.ts` cobre cenários básicos; expandir para cobrir edge cases de busca em português (acentos, cedilha, case) e inputs maliciosos.
- [ ] **[P3 · Testes]** Adicionar teste de build que falha se `localStorage`, `sessionStorage` ou `document.cookie` aparecerem fora dos arquivos autorizados — prevenir regressões de privacidade quando novos componentes client-side forem adicionados.
- [ ] **[P3 · Testes]** Implementar contract testing entre blog e dashboard — validar, em cada PR do dashboard que toque em `GET /api/posts`, `GET /api/comments`, `POST /api/newsletter/subscribe` ou `PATCH /api/reading-progress`, que o shape da resposta ainda é compatível com o que `src/lib/posts.ts` e os componentes do blog esperam.

#### DX e documentação

- [ ] **[P3 · DX]** Adicionar seed de posts no dashboard para desenvolvimento local — `scripts/seed.ts` existe; expandir com 10–20 posts ficcionais distribuídos por categoria, com autores, imagens e datas variadas, para testar busca, paginação e filtros de categoria sem depender de produção.
- [ ] **[P3 · DX]** Documentar variáveis de ambiente obrigatórias com exemplos — `.env.example` (ou `.env.template`) no blog e no dashboard listando todas as vars necessárias com tipo, descrição e exemplo seguro. Hoje o README não cobre isso completamente.
- [ ] **[P3 · DX]** Criar guia de criação de post do zero — passo a passo: login no dashboard, criar rascunho, fazer upload de capa, escrever em Markdown, definir categoria, publicar, verificar no blog. Documentar em `docs/content-system.md` ou `docs/guia-editorial.md`.
- [ ] **[P3 · DX]** Adicionar ADRs para decisões arquiteturais pendentes — formalizar em `docs/adr-*.md`: (1) escolha de Astro SSG vs SSR; (2) estratégia de cache de posts; (3) modelo de revisões vs versionamento Git para conteúdo; (4) estratégia de busca estática vs Algolia/Typesense a longo prazo.
- [ ] **[P3 · DX]** Documentar modelo de dados completo do dashboard — tabelas, relações, campos sensíveis, campos criptografados e campos indexados em `docs/database.md`. Hoje a documentação está dispersa entre schema.prisma e comentários no código.

---

### Critérios de aceite do Milestone 9

**Fundação (P0/P1 fechados):**
- `npm audit` sem vulnerabilidades de alta ou crítica.
- Build falha explicitamente se `PUBLIC_DASHBOARD_URL` não for HTTPS.
- Banner de cookies oferece aceitar e recusar; analytics só carrega após aceite.
- Política de privacidade tem seção de retenção, lista de terceiros com detalhes e direitos completos (acesso, retificação, exclusão, portabilidade).
- CSP sem `unsafe-inline` para scripts; exceções documentadas com justificativa.
- Cloudflare ativo como proxy reverso com IP do VPS protegido.
- Firewall do VPS bloqueando todas as portas exceto 80, 443 e SSH.

**Produto (P2 fechados):**
- `/busca` linkada na Navbar.
- Histórico de revisões acessível a partir do editor de posts no dashboard.
- Webhook de rebuild disparado ao publicar post.
- Monitoramento de uptime ativo para blog e dashboard.
- Backup automático do banco documentado e testado.

**Escala (P3 como linha de base para crescimento):**
- Ao menos os P3 de performance, segurança e LGPD documentados como decisões de produto explícitas em ADRs, mesmo que não implementados imediatamente.
- RIPD avaliado e, se necessário, elaborado.
- Contract tests entre blog e dashboard em CI.

---

### Riscos

- **Debt acumulado de LGPD** — M8 foi auditado mas os P0 ainda estão abertos. Qualquer coleta de e-mail ou analytics sem consentimento explícito antes do fechamento desses itens é risco legal real.
- **Lockfile inconsistente** — dependências fora das versões declaradas podem introduzir comportamentos não testados silenciosamente; priorizar antes de qualquer deploy relevante.
- **Revisões sem limite de retenção** — o volume de revisões cresce com cada edição. Com 1.000 posts e 10 edições médias cada, são 10.000 linhas em `post_revisions`. Definir política antes de atingir esse volume.
- **Build time linear com posts** — cada novo post aumenta o tempo de build. Com 200+ posts, avalie build incremental ou geração sob demanda (ISR se migrar para Vercel/Cloudflare Pages).
- **Dependência de VPS único** — blog e dashboard estão na mesma VPS. Se o servidor cair, ambos ficam offline. Avaliar separação ou pelo menos replicação estática do blog em CDN como fallback.

---

### Arquivos afetados

```
Blog:
src/components/Navbar.astro          — link /busca
src/pages/busca.astro                — suporte a query param na URL (limpar ao resetar)
src/layouts/Base.astro               — Consent Mode v2, banner com recusar, headers
src/pages/privacidade.astro          — retenção, terceiros, portabilidade, retificação, menores
src/pages/exclusao-de-dados.astro    — portabilidade e retificação explícitas
src/lib/reading-progress-client.ts   — informar usuário sobre coleta
src/components/Comments.astro        — aviso de coleta antes do OAuth
nginx.conf                           — CSP sem unsafe-inline, IPs Cloudflare, real_ip
.github/workflows/ci.yml             — permissões mínimas, pin por SHA, npm audit bloqueante
.github/pull_request_template.md     — checklist OWASP já criado
docs/frontend.md                     — seção /busca já adicionada
docs/security.md                     — Cloudflare, UFW, runbook
GITHUB_MILESTONES.md                 — este arquivo

Dashboard:
app/dashboard/posts/NavRail.tsx      — link para revisões
app/dashboard/posts/PostActions.tsx  — botão de revisões (alternativo)
app/dashboard/posts/[id]/revisoes/   — página de revisões (criada)
app/services/postRevision.service.ts — regenerar contentHtml na restore
app/services/posts.service.ts        — limite de retenção de revisões
app/api/posts/[id]/revisions/        — rotas de API (criadas)
prisma/schema.prisma                 — PostRevision (criado)
prisma/migrations/20260519120000_*   — migration (criada)
tests/api-post-revisions.test.ts     — testes (criados)
docs/dashboard.md                    — revisões (criado)
scripts/seed.ts                      — expandir com posts ficcionais
```
