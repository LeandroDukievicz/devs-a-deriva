# Milestones - Devs à Deriva

Revisado em: 2026-05-07 (auditoria de código)

## Contexto

O projeto tem duas partes em operação:
- **Blog Astro** (este repositório): frontend público estático
- **Dashboard Next.js** (`dashboard-ldstudio`): backend, API, PostgreSQL/Prisma

Newsletter, progresso de leitura e comentários já têm backend implementado. O objetivo agora é remover os bloqueadores e subir para produção.

**Concluído nesta sprint (2026-05-05/07):** SEO/AEO completo (canonical, OG, JSON-LD, sitemap, robots.txt, llms.txt), fix da página `/devs`, CORS servidor-a-servidor e dev environment (localhost:4321), redirect `www → devsaderiva.com.br` no Caddy, remoção do Vercel Analytics (gerava 404 fora da Vercel), CI/CD com build + testes unitários no blog, headers de segurança no blog, comentários com OAuth state assinado, rate limit no draft de comentários, comentários `PENDING` por padrão após autenticação, paginação client-side na home/categorias, Lighthouse CI e testes mínimos com Vitest/Playwright.

---

## 🚀 AGORA — Para ir ao ar

Estes são os únicos itens que bloqueiam a produção. Nada mais precisa estar pronto.

- [ ] **Remover token exposto** — remover credencial embutida no remote Git e rotacionar o token
- [x] **Corrigir XSS nos comentários** — refatorar `src/components/Comments.astro` para não usar `innerHTML` com dados externos; montar DOM com `textContent` e `createElement`
- [x] **Atualizar dependências vulneráveis** — atualizar Astro, Vite, esbuild e PostCSS; rodar `npm audit` até não restar advisory alto/crítico
- [x] **Criar `.env.example`** — listar todas as variáveis necessárias sem valores reais para que o projeto possa ser configurado
- [x] **Deploy em produção** — blog servido por Docker + Nginx atrás do Caddy na VPS, com `PUBLIC_DASHBOARD_URL` apontando para o dashboard de produção; `npm run build` passa sem erro
- [x] **Verificar conteúdo real** — `fetchPosts()` consome `/api/posts?status=PUBLISHED`, filtra slugs válidos, retorna `[]` em falha de API e alimenta home/categorias/posts no build

**Critério único:** se os seis itens acima estiverem feitos, o projeto pode ir ao ar.

---

## ⏳ DEPOIS — Com o site no ar

Tudo abaixo é importante mas não trava o lançamento. Fazer em segundo plano conforme capacidade.

---

### Segurança e infraestrutura

- [x] Headers de segurança no host: CSP, HSTS, X-Content-Type-Options, Referrer-Policy, frame-ancestors e Permissions-Policy via `nginx.conf`; Caddyfile alinhado para o domínio do blog
- [x] GitHub Actions básico: install → build → unit tests, bloqueando merge com build/test quebrado
- [ ] Deploy preview automático por PR
- [x] Bloquear URLs com `javascript:` e `data:` fora de allowlist nos comentários — `Comments.astro` só aceita avatar `https:` e renderiza dados externos com `textContent`
- [ ] Checklist OWASP para PRs que toquem em auth, comentários ou HTML dinâmico

---

### Sistema de comentários completo

- [x] OAuth com `state` assinado, PKCE e `redirectTo` validado por allowlist — `lib/comment-state.ts`, `checks: ['pkce', 'state']` e validação do host no schema do draft
- [x] Rate limit por IP e janela de tempo no draft de comentários — endpoint `comment-draft`, 5 tentativas por minuto via `ApiRateLimitAttempt`
- [ ] Honeypot ou captcha adaptativo para comportamento suspeito — newsletter tem honeypot, comentários não têm
- [x] Comentários salvos como `PENDING` após OAuth — fluxo `AWAITING_AUTH -> PENDING`, expostos publicamente apenas quando `APPROVED`
- [x] Tela de moderação no dashboard para pendentes e histórico por post

---

### SEO / AEO

- [x] Canonical URL em todas as rotas públicas
- [x] Open Graph completo (title, description, image, url, type, locale, site_name) por post e categoria
- [x] `sitemap.xml` dinâmico com páginas estáticas + posts publicados
- [x] `robots.txt` com allow explícito para 23 AI crawlers
- [x] JSON-LD `Article` nos posts e `Organization` em todas as páginas
- [x] `llms.txt` descrevendo o site para LLMs (AEO/GEO)
- [ ] Subir score AEO de ~44 → 80+: parágrafos longos, seções FAQ, dados estatísticos nos posts
- [ ] Checar relatório atualizado: https://check.aeojs.org/scan/devsaderiva.com.br/20260506-014013

---

### Testes automatizados

- [x] Vitest para helpers do blog — `paginatePosts()` e `getPost()`
- [ ] Testes com payloads XSS para `Comments.astro` — nenhum arquivo de teste cobre o componente
- [x] Playwright smoke de home e abertura de post
- [ ] Playwright para página de categoria
- [ ] Script `test:ci` no package.json agregando unit + e2e + audit (só existe `test` e `test:e2e` separados)

---

### Newsletter: tela administrativa e compliance

- [x] **Double opt-in:** ao cadastrar, enviar e-mail de confirmação antes de ativar a inscrição
- [x] Endpoints administrativos para listar inscritos e atualizar status
- [ ] Tela final no dashboard com KPIs totalmente derivados do banco
- [ ] Ações de supressão e descadastro manual
- [ ] Testes unitários do validador de e-mail
- [ ] Testes de integração do endpoint de inscrição

---

### Observabilidade

- [ ] Captura de erros frontend com Sentry ou equivalente — sem dependência nem inicialização no blog
- [ ] Logs estruturados no backend com `requestId` — dashboard
- [ ] Alertas para erro 5xx e falha de OAuth — dashboard/infra
- [ ] Runbook para incidente de segurança e indisponibilidade — nenhum arquivo em docs/

---

### Performance e acessibilidade

- [ ] `width`/`height` ou `aspect-ratio` nas imagens principais (evitar layout shift) — hero images e section-img sem dimensões explícitas
- [x] Lazy loading em imagens não críticas — `loading="lazy"` em fotos de autor (index.astro) e imagens de comentários
- [ ] `prefers-reduced-motion` aplicado em todas as animações — presente em CategoriaPage e slug, falta em index.astro (orbita/sections) e devs.astro (cards + blackhole)
- [ ] Navegação por teclado em navbar, comentários e formulários — Navbar tem Escape; falta navegação por Tab/Enter em comentários e formulários
- [ ] Contraste validado em todos os temas incluindo Limbo e páginas com canvas
- [x] Lighthouse CI automatizado em PR/push para monitorar Core Web Vitals

---

### Polimento editorial e UX

- [x] Paginação para home e páginas de categoria — render inicial de 10 posts e botão client-side "carregar mais"
- [ ] Busca (página ou endpoint) — sem implementação no blog
- [ ] Histórico de revisões de post com restauração controlada — dashboard
- [x] Gestão de categorias e autores no dashboard; media assets via upload R2
- [ ] RSS/Atom para distribuição editorial — sem feed em src/pages/
