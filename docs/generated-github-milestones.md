# Milestones - Devs à Deriva

Revisado em: 2026-05-06

## Contexto

O projeto tem duas partes em operação:
- **Blog Astro** (este repositório): frontend público estático
- **Dashboard Next.js** (`dashboard-ldstudio`): backend, API, PostgreSQL/Prisma

Newsletter, progresso de leitura e comentários já têm backend implementado. O objetivo agora é remover os bloqueadores e subir para produção.

**Concluído nesta sprint (2026-05-05/06):** SEO/AEO completo (canonical, OG, JSON-LD, sitemap, robots.txt, llms.txt), fix da página `/devs` (CORS server-to-server no dashboard, fetch client-side no blog), CI/CD estabilizado nos dois repos.

---

## 🚀 AGORA — Para ir ao ar

Estes são os únicos itens que bloqueiam a produção. Nada mais precisa estar pronto.

- [ ] **Remover token exposto** — remover credencial embutida no remote Git e rotacionar o token
- [x] **Corrigir XSS nos comentários** — refatorar `src/components/Comments.astro` para não usar `innerHTML` com dados externos; montar DOM com `textContent` e `createElement`
- [x] **Atualizar dependências vulneráveis** — atualizar Astro, Vite, esbuild e PostCSS; rodar `npm audit` até não restar advisory alto/crítico
- [x] **Criar `.env.example`** — listar todas as variáveis necessárias sem valores reais para que o projeto possa ser configurado
- [x] **Deploy na Vercel** — configurar o blog com `PUBLIC_DASHBOARD_URL` apontando para o backend de produção; confirmar que `npm run build` passa sem erro
- [ ] **Verificar conteúdo real** — confirmar que posts publicados no banco aparecem no blog em produção e que falha de API não quebra o site

**Critério único:** se os seis itens acima estiverem feitos, o projeto pode ir ao ar.

---

## ⏳ DEPOIS — Com o site no ar

Tudo abaixo é importante mas não trava o lançamento. Fazer em segundo plano conforme capacidade.

---

### Segurança e infraestrutura

- [ ] Headers de segurança no host: CSP, HSTS, X-Content-Type-Options, Referrer-Policy, frame-ancestors — via Vercel config ou `astro.config.mjs`
- [ ] GitHub Actions básico: install → typecheck → build, bloqueando merge com build quebrado
- [ ] Deploy preview automático por PR
- [ ] Bloquear URLs com `javascript:` e `data:` fora de allowlist nos comentários
- [ ] Checklist OWASP para PRs que toquem em auth, comentários ou HTML dinâmico

---

### Sistema de comentários completo

- [ ] OAuth com `state` assinado, PKCE e `redirectTo` validado por allowlist
- [ ] Rate limit por IP, conta, post e janela de tempo
- [ ] Honeypot ou captcha adaptativo para comportamento suspeito
- [ ] Comentários salvos como `pending` por padrão — expostos publicamente apenas quando `approved`
- [ ] Tela de moderação no dashboard com filtros e ações em lote

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

- [ ] Vitest para helpers de validação de e-mail, segurança de comentários e adapters
- [ ] Testes com payloads XSS para `Comments.astro`
- [ ] Playwright para home, post e categoria
- [ ] `npm run test:ci` agregando unit + e2e mínimo + audit

---

### Newsletter: tela administrativa e compliance

- [ ] **Double opt-in:** ao cadastrar, enviar e-mail de confirmação antes de ativar a inscrição
- [ ] Tela no dashboard para listar inscritos com status, origem e data de consentimento
- [ ] Ações de supressão e descadastro manual
- [ ] Testes unitários do validador de e-mail
- [ ] Testes de integração do endpoint de inscrição

---

### Observabilidade

- [ ] Captura de erros frontend com Sentry ou equivalente
- [ ] Logs estruturados no backend com `requestId`
- [ ] Alertas para erro 5xx e falha de OAuth
- [ ] Runbook para incidente de segurança e indisponibilidade

---

### Performance e acessibilidade

- [ ] `width`/`height` ou `aspect-ratio` nas imagens principais (evitar layout shift)
- [ ] Lazy loading em imagens não críticas
- [ ] `prefers-reduced-motion` aplicado nas animações
- [ ] Navegação por teclado em navbar, comentários e formulários
- [ ] Contraste validado em todos os temas incluindo Limbo e páginas com canvas
- [ ] Lighthouse em home, post e categoria

---

### Polimento editorial e UX

- [ ] Paginação para home e páginas de categoria
- [ ] Busca (página ou endpoint)
- [ ] Histórico de revisões de post com restauração controlada
- [ ] Gestão de categorias, autores e media assets no dashboard
- [ ] RSS/Atom para distribuição editorial
