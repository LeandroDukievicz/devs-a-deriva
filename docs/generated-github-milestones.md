# Milestones - Devs à Deriva

Revisado em: 2026-05-07 (auditoria de código)

## Contexto

O projeto tem duas partes em operação:
- **Blog Astro** (este repositório): frontend público estático
- **Dashboard Next.js** (`dashboard-ldstudio`): backend, API, PostgreSQL/Prisma

Newsletter, progresso de leitura e comentários já têm backend implementado. O objetivo agora é remover os bloqueadores e subir para produção.

**Concluído nesta sprint (2026-05-05/07):** SEO/AEO completo (canonical, OG, JSON-LD, sitemap, robots.txt, llms.txt), fix da página `/devs`, CORS servidor-a-servidor e dev environment (localhost:4321), redirect `www → devsaderiva.com.br` no Caddy, remoção do Vercel Analytics (gerava 404 fora da Vercel), CI/CD com build + testes unitários no blog, headers de segurança no blog, comentários com OAuth state assinado, rate limit no draft de comentários, comentários `PENDING` por padrão após autenticação, paginação client-side na home/categorias, Lighthouse CI e testes mínimos com Vitest/Playwright.

---

## Auditoria defensiva pré-pentest — 2026-05-19

Esta auditoria considera o estado atual do repositório **Blog Astro**. Pontos do dashboard (`dashboard-ldstudio`) foram tratados como **NÃO VERIFICADOS** quando a evidência não existe neste repositório.

### Resumo executivo

- **Status geral de segurança:** base defensiva parcial; ainda não está pronto para pentest limpo nem para produção rigorosa.
- **Risco geral:** **Alto** enquanto `npm run check:security` falhar, o E2E depender da produção bloqueada pelo Cloudflare e os endpoints públicos do dashboard não tiverem evidência local de validação/rate limit/allowlist.
- **Pronto para pentest?** Não. Antes do pentest, corrigir P0 e deixar os testes locais e auditáveis.
- **Pronto para produção?** Não com critério defensivo. O build passa, mas dependências/audit, consentimento, CSP e validação no backend continuam pendentes.
- **Principais riscos:** dependências vulneráveis, lockfile/node_modules fora de sincronia, analytics antes de consentimento, CSP permissiva, Playwright apontando para produção, `PUBLIC_DASHBOARD_URL` com fallback local, fluxos públicos dependentes do dashboard sem evidência neste repo.
- **Próximo passo recomendado:** fechar a milestone "PRE-PENTEST — Segurança defensiva" abaixo antes de qualquer pentest autorizado.

### Superfície de ataque mapeada

| Área | Rota/Arquivo | Entrada | Autenticada? | Risco |
|---|---|---|---|---|
| Home/listagem | `/`, `src/pages/index.astro` | Dados de posts do dashboard, `sessionStorage`, `localStorage` | Não | Médio |
| Busca pública | `/busca`, `src/pages/busca.astro` | Query `?q=`, input client-side | Não | Baixo |
| Categorias | `/categorias/[categoria]`, `/pagina/[n]` | Route params, dados do dashboard | Não | Médio |
| Post | `/posts/[slug]` | Route param, Markdown convertido em HTML | Não | Médio |
| Comentários | `src/components/Comments.astro` | textarea, provider, honeypot, timing, `redirectTo`, OAuth return param | Não no blog | Alto |
| Newsletter | `src/components/Newsletter.astro`, `src/pages/newsletter.astro` | e-mail, consentimento, honeypot, timing, pageUrl | Não | Médio |
| Progresso de leitura | `src/lib/reading-progress-client.ts` | `readerId`, slugs, progresso, `PATCH` externo | Não | Médio |
| Devs | `/devs`, `src/pages/devs.astro` | Dados do dashboard | Não | Baixo |
| Índices públicos | `/ai-index.json`, `/rss.xml`, `/sitemap.xml`, `/docs.json` | Dados publicados | Não | Baixo |
| Admin externo | `src/pages/admin/login.astro`, link para dashboard | Navegação externa | Sim no dashboard, não no blog | Médio |
| Infra | `nginx.conf`, `vercel.json`, Docker, GitHub Actions | Headers, deploy, secrets CI | N/A | Alto |

### Modelo de ameaça STRIDE

| Ativo | Ameaça | Vetor possível | Impacto | Controle existente | Lacuna | Correção |
|---|---|---|---|---|---|---|
| Comentários | Spoofing/Tampering | `provider`, `redirectTo`, OAuth state | Comentário indevido, phishing, abuso | Frontend envia provider fixo, honeypot/timing, renderiza com `textContent` | Validação real do dashboard não verificada | Testar backend para provider, state, PKCE, allowlist e rate limit |
| Newsletter | Tampering/DoS | Spam de e-mail, payload repetido | Fila/serviço de e-mail abusado | Validação client-side, honeypot, resposta genérica | Rate limit/double opt-in não verificáveis aqui | Testes de integração no dashboard |
| Progresso de leitura | Information Disclosure | `readerId` persistente e slugs | Rastreamento pseudônimo sem consentimento claro | ID anônimo local | Consentimento/opt-out incompleto | Incluir no banner/política e permitir reset |
| Conteúdo Markdown | XSS | Markdown vindo do dashboard renderizado via `set:html` | XSS armazenado se sanitizer falhar | Conversor local escapa HTML e limita links | Não cobre todo Markdown/Rich Text futuro | Testes com payloads e sanitização server-side no dashboard |
| CI/CD | Tampering/Elevation | Actions por tag, `repository_dispatch`, SSH deploy | Deploy indevido/supply chain | Gitleaks, quality/build/audit/smoke | Sem `permissions:` explícito e sem pin por SHA | Minimizar permissões e restringir dispatch |
| Dependências | DoS/Supply chain | CVEs transitivas | Falha de audit e risco transitivo | Dependabot | Audit falhando e node_modules inválido | Atualizar lockfile e zerar audit alto |
| Infra web | Misconfiguration | CSP com `unsafe-inline`, `connect-src https:` no Vercel | XSS com menor contenção/exfiltração | Headers Nginx básicos | CSP permissiva e divergente entre hosts | CSP restritiva por ambiente |
| Dados pessoais | Repudiation/Disclosure | Analytics, OAuth, newsletter, logs | Risco LGPD | Política parcial | Consentimento e retenção incompletos | Consent Mode, opt-out e retenção documentada |

### Achados por severidade

#### Crítico

| ID | Vulnerabilidade | Local | Impacto | Evidência | Correção |
|---|---|---|---|---|---|
| CRIT-001 | Nenhum achado crítico comprovado apenas neste repositório | N/A | N/A | Não foi encontrado secret real, RCE, SQLi ou bypass admin explorável no blog estático | Continuar validação no dashboard, onde ficam auth, banco e APIs de escrita |

#### Alto

| ID | Vulnerabilidade | Local | Impacto | Evidência | Correção |
|---|---|---|---|---|---|
| HIGH-001 | Dependências vulneráveis e instalação local inconsistente | `package-lock.json`, `node_modules`, `package.json` | Supply chain/DoS; CI de segurança falha | `npm audit` retorna 12 vulnerabilidades, incluindo `devalue` alta; `npm ls --depth=0` retorna `ELSPROBLEMS` | Rodar atualização controlada, revisar lockfile, remover extraneous e exigir `npm run check:security` verde |
| HIGH-002 | Analytics carrega antes de consentimento | `src/layouts/Base.astro:103-112`, `157-170`, `539-557` | Rastreamento sem opt-in; risco LGPD | GA e Vercel Analytics carregam no `<head>` antes do banner; banner só tem "Entendi" | Implementar Consent Mode v2, botões Aceitar/Recusar e carregamento condicional |
| HIGH-003 | Endpoints públicos do dashboard não verificáveis neste repo | `Comments.astro:815-827`, `Newsletter.astro:493-506`, `reading-progress-client.ts:101-145` | Spam, abuso, open redirect, CSRF/CORS se backend falhar | Blog só envia payloads; validação server-side está fora do repo | Criar suíte no dashboard para validação, CORS, rate limit, payload size, allowlist e CSRF quando aplicável |
| HIGH-004 | E2E defensivo aponta para produção e sofre bloqueio Cloudflare | `playwright.config.ts:5-7` | Testes não reproduzíveis; pode mascarar falhas antes do pentest | `npm run test:e2e` falhou com Cloudflare Access Denied/timeouts | Configurar `webServer` local/preview e `baseURL=http://127.0.0.1:4321` para CI |

#### Médio

| ID | Vulnerabilidade | Local | Impacto | Correção |
|---|---|---|---|---|
| MED-001 | CSP permissiva com `unsafe-inline` | `nginx.conf:25`, `nginx.conf:49`, `vercel.json:11-12` | Reduz contenção de XSS | Migrar scripts inline para hashes/nonces ou CSP documentada com exceções mínimas |
| MED-002 | `vercel.json` permite `connect-src https:` amplo | `vercel.json:12` | Exfiltração facilitada em caso de XSS | Restringir a dashboard/analytics necessários |
| MED-003 | Fallback de `PUBLIC_DASHBOARD_URL` para localhost em código | `src/lib/posts.ts:211` e componentes que usam env | Deploy mal configurado pode apontar origem errada | Validar env no build produtivo e falhar se não for HTTPS/domínio esperado |
| MED-004 | Progresso de leitura cria `readerId` persistente | `src/lib/reading-progress-client.ts:8-28`, `101-145` | Rastreamento pseudônimo sem consentimento granular | Cobrir no banner/política e oferecer reset/opt-out |
| MED-005 | Comentários OAuth sem aviso explícito de dados coletados | `src/components/Comments.astro:61-93` | Transparência insuficiente | Informar nome/avatar/e-mail/provider e moderação antes do login |
| MED-006 | CI/CD sem permissões mínimas explícitas | `.github/workflows/ci.yml` | Superfície de supply chain maior | Adicionar `permissions:` por job e avaliar pin de actions por SHA |
| MED-007 | Markdown vira HTML e é injetado com `set:html` | `src/pages/posts/[slug].astro:145`, `src/lib/posts.ts:55-75` | XSS armazenado se conversor/sanitizer regredir | Ampliar testes de Markdown malicioso e sanitizar também no dashboard |
| MED-008 | Uso de `insertAdjacentHTML` em renderizações client-side | `src/pages/index.astro`, `src/components/CategoriaPage.astro` | XSS se campos externos não forem escapados | Centralizar escaping e cobrir com testes de payloads em cards/listagens |

#### Baixo

| ID | Vulnerabilidade | Local | Correção |
|---|---|---|---|
| LOW-001 | Código morto e hints do Astro | `Comments.astro:633`, `busca.astro:3`, scripts com `define:vars` | Remover imports/funções não usados e marcar `is:inline` quando intencional |
| LOW-002 | `.env.example` documenta só uma variável | `.env.example` | Documentar `PUBLIC_COMMIT_SHA`, envs de CI e restrições de produção |
| LOW-003 | Evidência operacional fora do repo | `docs/security.md` | Registrar evidência de Cloudflare/UFW/Fail2ban/Caddy e checklist de revisão |

### Comandos executados

| Comando | Resultado |
|---|---|
| `npm run lint` | Passou: 57 arquivos verificados |
| `npm run typecheck` | Passou, 0 erros, 8 hints |
| `npm test` | Passou: 4 arquivos, 87 testes |
| `npm run build` | Passou: 18 páginas geradas |
| `npm audit --audit-level=moderate` | Falhou: 12 vulnerabilidades, 1 alta |
| `npm run check:security` | Falhou por `npm audit --audit-level=high` |
| `npm outdated` | Falhou listando pacotes desatualizados (`astro`, `tailwindcss`, `vitest`, etc.) |
| `npm ls --depth=0` | Falhou com dependências inválidas e `@emnapi/runtime` extraneous |
| `npm run test:e2e` | Falhou: 10 falhas, 16 skipped, 34 passed; produção respondeu Cloudflare Access Denied/timeouts |
| Busca por secrets | Sem secret real detectado; hits foram documentação/scripts |
| Busca por padrões perigosos | Encontrou `set:html`, `innerHTML` estático, `insertAdjacentHTML`, storage local, fetch e scripts de CI |

### Mapeamento OWASP Top 10

| OWASP | Encontrado? | Evidência | Severidade | Correção |
|---|---|---|---|---|
| A01 Broken Access Control | NÃO VERIFICADO | Auth/admin ficam no dashboard | Alto | Auditar dashboard e ownership/roles |
| A02 Cryptographic Failures | Parcial | OAuth/state externo; analytics/privacidade | Médio | Validar dashboard e consentimento |
| A03 Injection | Parcial | Markdown/HTML dinâmico e `insertAdjacentHTML` | Médio | Testes de payload e sanitização dupla |
| A04 Insecure Design | Sim | Blog depende de backend não verificado para fluxos públicos | Alto | Contratos e testes defensivos no dashboard |
| A05 Security Misconfiguration | Sim | CSP permissiva, E2E contra produção, env fallback | Alto | Hardening de CSP/env/testes |
| A06 Vulnerable Components | Sim | `npm audit` falha | Alto | Atualizar dependências |
| A07 Auth Failures | NÃO VERIFICADO | Login/OAuth reais ficam no dashboard | Alto | Testar login/OAuth/sessão no dashboard |
| A08 Software/Data Integrity | Sim | CI sem permissions explícitas e actions por tag | Médio | Permissões mínimas e pin |
| A09 Logging/Monitoring | Parcial | Blog sem logs; dashboard/infra fora do repo | Médio | Alertas e runbook verificáveis |
| A10 SSRF | Não aplicável no blog | Sem fetch server-side de URL controlada por usuário | Baixo | Reavaliar dashboard/uploads |

---

## Milestone PRE-PENTEST — Segurança defensiva e anti-invasão

Objetivo: deixar o projeto viável para pentest autorizado e reduzir riscos reais de invasão, abuso, vazamento e indisponibilidade.

### P0 — Corrigir imediatamente

- [ ] **Zerar `npm run check:security`** — atualizar dependências transitivas vulneráveis (`devalue`, `tmp`, `ws`, `yaml`, `brace-expansion`), sincronizar `package-lock.json` com `package.json`, remover `@emnapi/runtime` extraneous e garantir `npm ls --depth=0` sem `ELSPROBLEMS`.
- [ ] **Tornar E2E local e reprodutível** — alterar `playwright.config.ts` para usar `webServer` local (`npm run preview` ou `astro dev`) e `baseURL` local; testes de segurança não devem depender de produção/Cloudflare.
- [ ] **Validar endpoints públicos no dashboard** — criar/rodar testes no `dashboard-ldstudio` para `POST /api/comments/draft`, `GET /api/comments`, `POST /api/newsletter/subscribe`, `GET/PATCH /api/reading-progress`: schema validation, tamanho máximo, rate limit, CORS, Origin/Referer quando aplicável, respostas genéricas e logs de abuso.
- [ ] **Bloquear open redirect no OAuth de comentários** — no dashboard, `redirectTo` enviado por `Comments.astro` deve aceitar apenas `https://devsaderiva.com.br/posts/*` e ambientes locais permitidos explicitamente; rejeitar `javascript:`, hosts externos, protocol-relative URLs e caminhos suspeitos.
- [ ] **Implementar consentimento real para analytics** — não carregar GA/Vercel Analytics até o usuário aceitar; adicionar recusa, persistência da escolha, reset de consentimento e Consent Mode v2.
- [ ] **Falhar build produtivo com `PUBLIC_DASHBOARD_URL` inseguro** — produção deve exigir HTTPS e host esperado; remover fallback silencioso para `http://localhost:3000` em build/deploy de produção.

### P1 — Corrigir antes do pentest

- [ ] **Endurecer CSP** — remover/reduzir `unsafe-inline`, alinhar `nginx.conf` e `vercel.json`, restringir `connect-src` a `self`, dashboard e analytics necessários; documentar exceções restantes.
- [ ] **Ampliar testes anti-XSS em conteúdo e cards** — cobrir Markdown vindo do dashboard, busca, home, categorias e `insertAdjacentHTML`; garantir que título, excerpt, author, categoria e imagens sejam escapados/sanitizados.
- [ ] **Centralizar allowlists e sanitização** — reutilizar `sanitizeImageUrl`, `escapeHtml` e allowlist de providers em módulo testável; evitar cópias locais divergentes em componentes.
- [ ] **Adicionar aviso de coleta no fluxo de comentários OAuth** — informar antes do login que nome/avatar/e-mail/provider podem ser coletados pelo dashboard e que o comentário será moderado.
- [ ] **Adicionar consentimento/opt-out para progresso de leitura** — documentar `readerId`, permitir limpar progresso local e impedir sync remoto sem consentimento adequado.
- [ ] **Configurar permissões mínimas no GitHub Actions** — adicionar `permissions:` global/job; avaliar pin por SHA para actions críticas (`gitleaks`, `appleboy/ssh-action`, setup/upload/download-artifact).
- [ ] **Proteger `repository_dispatch` operacionalmente** — documentar token com escopo mínimo, origem autorizada e evento `blog-rebuild`; alertar quando dispatch acionar deploy.
- [ ] **Adicionar limite de payload no Nginx** — configurar `client_max_body_size` defensivo mesmo em site estático e confirmar limites no dashboard para endpoints públicos.

### P2 — Corrigir antes de produção

- [ ] **Completar LGPD/privacidade** — política deve cobrir analytics, Cloudflare, Vercel, OAuth providers, newsletter, comentários, readerId/progresso, logs, retenção, exclusão, portabilidade e retificação.
- [ ] **Criar matriz defensiva do dashboard** — testes para brute force/rate limit, spam newsletter, comment flooding, provider inválido, `redirectTo` malicioso, CORS indevido, payload gigante e enumeração de e-mail.
- [ ] **Testar CSRF conforme mecanismo de sessão do dashboard** — se cookies forem usados em mutações admin, exigir `SameSite`, CSRF token e validação de Origin/Referer.
- [ ] **Auditar banco no dashboard** — constraints, índices, ownership/tenant, retorno excessivo, dados pessoais, tokens hasheados, retenção e exclusão.
- [ ] **Auditar uploads no dashboard/R2** — MIME real, extensão, tamanho, SVG, path traversal, metadados, URLs assinadas e scanner se necessário.
- [ ] **Verificar logs e observabilidade** — eventos de login, OAuth, falha de autorização, rate limit, comentário rejeitado, newsletter duplicada, webhook inválido e deploy/rollback; sem tokens/cookies/dados pessoais excessivos.
- [ ] **Alinhar documentação de milestone com estado real** — não manter `[x]` para itens que dependem do dashboard sem evidência no repositório; marcar como "verificado no dashboard" apenas com teste/link.

### P3 — Hardening contínuo

- [ ] **Registrar evidência de infraestrutura** — Cloudflare WAF/rate limit, UFW, Fail2ban, Caddy/TLS, portas abertas, backup e procedimento de rotação de secrets.
- [ ] **Adicionar SCA/Dependency Review no PR** — além do `npm audit`, bloquear PRs com CVE alta/crítica e gerar relatório de dependências.
- [ ] **Adicionar security headers complementares** — avaliar `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy` e `Cross-Origin-Embedder-Policy` sem quebrar assets.
- [ ] **Criar checklist pré-pentest operacional** — congelar escopo, URLs autorizadas, janela de teste, contatos, rollback, backup, limites de carga e evidências esperadas.
- [ ] **Criar checklist de produção** — audit verde, E2E local verde, smoke verde, CSP validada, consentimento validado, dashboard validado, backup testado e rollback testado.
- [ ] **Remover dívida menor** — imports/funções não usadas (`formatDate` em busca, `timeAgo` em comentários), hints de `is:inline` e warnings de ambiente nos testes.

### Checklist pré-pentest

- [ ] `npm run check:security` verde.
- [ ] `npm run test:e2e` verde em ambiente local/staging autorizado.
- [ ] Dashboard com testes de auth, authorization, rate limit, CORS e validação.
- [ ] Open redirect de OAuth testado e bloqueado.
- [ ] Payloads XSS testados em comentários, Markdown, busca, cards e RSS.
- [ ] Secrets scan verde e tokens de CI revisados.
- [ ] Escopo de pentest documentado com URLs e limites.
- [ ] Backup, rollback e contatos de incidente confirmados.

### Checklist de hardening para produção

- [ ] HTTPS/HSTS validado no domínio final.
- [ ] Cloudflare/WAF/rate limit com evidência anexada.
- [ ] CSP sem `connect-src https:` amplo.
- [ ] Consentimento de analytics com aceitar/recusar/reset.
- [ ] Logs sem tokens/cookies/senhas e com alertas mínimos.
- [ ] `.env.example` e docs de secrets completos.
- [ ] Banco/dashboard auditados para ownership, roles e retenção.
- [ ] Deploy automático protegido por CI verde e permissões mínimas.

---

## 🚀 AGORA — Para ir ao ar

Status antigo de lançamento. Após a auditoria defensiva de 2026-05-19, este bloco fica subordinado à milestone **PRE-PENTEST — Segurança defensiva e anti-invasão** acima.

- [x] **Corrigir XSS nos comentários** — refatorar `src/components/Comments.astro` para não usar `innerHTML` com dados externos; montar DOM com `textContent` e `createElement`
- [ ] **Atualizar dependências vulneráveis** — reaberto em 2026-05-19: `npm audit` ainda falha com 12 vulnerabilidades, incluindo 1 alta em `devalue`; `npm ls --depth=0` também falha com dependências inválidas/extraneous
- [x] **Criar `.env.example`** — listar todas as variáveis necessárias sem valores reais para que o projeto possa ser configurado
- [x] **Deploy em produção** — blog servido por Docker + Nginx atrás do Caddy na VPS, com `PUBLIC_DASHBOARD_URL` apontando para o dashboard de produção; `npm run build` passa sem erro
- [x] **Verificar conteúdo real** — `fetchPosts()` consome `/api/posts?status=PUBLISHED`, filtra slugs válidos, retorna `[]` em falha de API e alimenta home/categorias/posts no build

**Critério atualizado:** o projeto só deve ir para produção/pentest depois que os P0 da milestone defensiva estiverem concluídos e verificados.

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
- [x] Honeypot ou captcha adaptativo para comportamento suspeito — honeypot + elapsedMs + typingElapsedMs adicionados ao formulário de comentários
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
- [x] Playwright para página de categoria
- [x] Script `test:ci` no package.json agregando unit + e2e + audit (só existe `test` e `test:e2e` separados)

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

- [x] Captura de erros frontend com Sentry ou equivalente — `@sentry/nextjs` no dashboard; init condicional por DSN; blog sem dependência
- [x] Logs estruturados no backend com `requestId` — `getOrCreateRequestId` em `lib/logger.ts`; propagado em 4 rotas e retornado via `x-request-id`
- [x] Alertas para erro 5xx e falha de OAuth — falhas OAuth logadas com `logWarn/logError` em `auth.ts` e `comment-auth.ts`; runbook documenta detecção de 5xx
- [x] Runbook para incidente de segurança e indisponibilidade — `docs/incident-runbook.md` expandido de 165 → 442 linhas com 8 novas seções

---

### Performance e acessibilidade

- [ ] `width`/`height` ou `aspect-ratio` nas imagens principais (evitar layout shift) — hero images e section-img sem dimensões explícitas
- [x] Lazy loading em imagens não críticas — `loading="lazy"` em fotos de autor (index.astro) e imagens de comentários
- [ ] `prefers-reduced-motion` aplicado em todas as animações — presente em CategoriaPage e slug, falta em index.astro (orbita/sections) e devs.astro (cards + blackhole)
- [ ] Navegação por teclado em navbar, comentários e formulários — Navbar tem Escape; falta navegação por Tab/Enter em comentários e formulários

- [x] Lighthouse CI automatizado em PR/push para monitorar Core Web Vitals

---

### Polimento editorial e UX

- [x] Paginação para home e páginas de categoria — render inicial de 10 posts e botão client-side "carregar mais"
- [ ] Busca (página ou endpoint) — sem implementação no blog
- [ ] Histórico de revisões de post com restauração controlada — dashboard
- [x] Gestão de categorias e autores no dashboard; media assets via upload R2
- [x] RSS/Atom para distribuição editorial — feed em src/pages/rss.xml.ts
