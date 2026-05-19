# Launch Checklist — Devs à Deriva

Extraído dos Milestones 0–9. Dois focos:

1. **Antes do lançamento** — não vai a ar sem isso resolvido.
2. **Evolução pós-lançamento** — pode fazer com o blog no ar, dia a dia.

Referência completa: [`GITHUB_MILESTONES.md`](./GITHUB_MILESTONES.md)

---

## Bloco 1 — Não lança sem isso

São 9 itens. Nenhum é opcional. Estimativa de esforço real ao lado de cada um.

---

### 1. Corrigir dependências vulneráveis
**Esforço: ~1h**
**Risco se ignorar: vulnerabilidade explorável em produção, build instável**

```bash
cd devs-a-deriva
npm install
npm audit fix        # não use --force na primeira tentativa
npm audit            # verificar se zerou as high/critical
npm run ci:check     # lint + typecheck + test
npm run build        # build limpo
```

Se sobrar vulnerabilidade que o `fix` não resolve, verificar se é transitiva de um pacote raiz e atualizar o pacote raiz manualmente. O `package-lock.json` estava com versões divergentes de `astro`, `tailwindcss`, `vitest` e um pacote extraneous `@emnapi/runtime`.

Arquivo: `package.json`, `package-lock.json`

---

### 2. Analytics só após consentimento (Consent Mode v2)
**Esforço: ~3h**
**Risco se ignorar: infração LGPD com usuários reais coletando dados sem base legal**

O que precisa acontecer em `src/layouts/Base.astro`:

1. Mover o bloco do `gtag` para carregar condicionalmente — só quando o usuário aceitar.
2. Inicializar o GA com `analytics_storage: denied` por padrão.
3. O banner precisa de dois botões: **Aceitar** e **Recusar**.
4. Ao aceitar: `gtag('consent', 'update', { analytics_storage: 'granted' })` + persistir `localStorage`.
5. Ao recusar: persistir recusa e não carregar nada.
6. Vercel Analytics: só renderizar o componente `<Analytics />` se consentimento aceito.
7. Em visitas subsequentes: ler preferência do `localStorage` e aplicar antes de qualquer script.

Arquivo: `src/layouts/Base.astro`

---

### 3. Validar HTTPS para `PUBLIC_DASHBOARD_URL` no build
**Esforço: ~30min**
**Risco se ignorar: build de produção poderia apontar silenciosamente para `localhost`**

No início de `src/lib/posts.ts` (ou em `astro.config.mjs` via `vite.plugins`), adicionar:

```typescript
// No topo de src/lib/posts.ts, após a definição de DASHBOARD_URL:
if (import.meta.env.PROD && !DASHBOARD_URL.startsWith('https://')) {
  throw new Error(
    `[segurança] PUBLIC_DASHBOARD_URL deve ser HTTPS em produção. Recebido: "${DASHBOARD_URL}"`
  );
}
```

Arquivo: `src/lib/posts.ts`

---

### 4. Banner de cookies com opção de recusar
**Esforço: ~1h (parte do item 2, mas com atenção à UX)**
**Risco se ignorar: LGPD exige que recusar seja tão fácil quanto aceitar**

O banner atual só tem "Entendi". Precisa de dois botões com hierarquia visual clara:
- Primário: **Aceitar cookies**
- Secundário (mesma visibilidade): **Recusar não-essenciais**

Ao recusar, nenhum script de analytics carrega. A escolha persiste.

Arquivo: `src/layouts/Base.astro` (bloco `.cookie-consent`)

---

### 5. Política de privacidade: adicionar retenção de dados
**Esforço: ~1h de escrita**
**Risco se ignorar: política incompleta é ineficaz como base legal; ANPD pode exigir**

Adicionar seção "Retenção de dados" em `src/pages/privacidade.astro` com prazos por categoria:

| Dado | Prazo sugerido |
|---|---|
| E-mail de newsletter ativo | Enquanto a inscrição estiver ativa |
| E-mail de newsletter inativo | Até 24 meses sem abertura, depois exclusão |
| Comentários aprovados | Enquanto o post existir |
| Comentários rejeitados | 90 dias, depois anonimização |
| Progresso de leitura | 12 meses sem atividade, depois exclusão |
| Logs de acesso | 30 dias |
| Dados de analytics | Conforme política do Google Analytics |

Arquivo: `src/pages/privacidade.astro`

---

### 6. Cloudflare na frente do VPS
**Esforço: ~1h de configuração (não requer código)**
**Risco se ignorar: IP real do servidor exposto, sem DDoS L3/L4, sem cache de borda**

Passos:
1. Criar conta gratuita no Cloudflare.
2. Adicionar domínio `devsaderiva.com.br`.
3. Importar registros DNS existentes.
4. Ativar modo proxy (nuvem laranja) nos registros A.
5. SSL/TLS: modo "Full (strict)" — Caddy já tem certificado Let's Encrypt.
6. No `nginx.conf`, adicionar `set_real_ip_from` com os CIDRs do Cloudflare e `real_ip_header CF-Connecting-IP`.

Depois de ativo: atualizar `docs/security.md` com o status do Cloudflare.

Arquivo de código: `nginx.conf`

---

### 7. Firewall do VPS (UFW)
**Esforço: ~30min no servidor**
**Risco se ignorar: portas desnecessárias expostas, superfície de ataque desnecessária**

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp     # ou sua porta SSH customizada
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status verbose
```

Se o Cloudflare estiver ativo (item 6), você pode ser ainda mais restritivo e só permitir os IPs do Cloudflare nas portas 80/443. Documentar configuração final em `docs/security.md`.

---

### 8. Aviso de coleta antes do OAuth de comentários
**Esforço: ~45min**
**Risco se ignorar: usuário fornece dados (nome, foto, e-mail via OAuth) sem ser informado**

Em `src/components/Comments.astro`, antes de mostrar os botões Google/GitHub/Discord no estado `compose-auth-prompt`, adicionar texto informativo:

> "Ao continuar, você autoriza o Devs à Deriva a associar seu comentário ao seu nome e foto públicos conforme retornados pelo provedor escolhido. Seu e-mail não é exibido publicamente. Comentários passam por moderação antes de serem publicados."

Link para `/privacidade` ao final.

Arquivo: `src/components/Comments.astro`

---

### 9. Direitos de portabilidade e retificação na página de exclusão
**Esforço: ~30min de escrita**
**Risco se ignorar: Art. 18 III e V da LGPD não atendidos explicitamente**

Em `src/pages/exclusao-de-dados.astro`, além dos direitos de exclusão e acesso que já existem, adicionar:

- **Retificação (Art. 18, III)**: possibilidade de corrigir dados incompletos ou desatualizados.
- **Portabilidade (Art. 18, V)**: possibilidade de solicitar os dados em formato estruturado.

Instruir o usuário a entrar em contato pelo e-mail já listado na página com o assunto correspondente.

Arquivo: `src/pages/exclusao-de-dados.astro`

---

### Checklist de verificação final antes de lançar

```
[ ] npm audit: zero high/critical
[ ] npm run ci:check: passou (lint + typecheck + test)
[ ] npm run build: build limpo
[ ] PUBLIC_DASHBOARD_URL aponta para https://dashboard.devsaderiva.com.br
[ ] GA e Vercel Analytics não carregam antes do consentimento
[ ] Banner tem botão Aceitar e Recusar
[ ] Política de privacidade tem seção de retenção
[ ] Cloudflare ativo como proxy para devsaderiva.com.br
[ ] UFW configurado no VPS
[ ] Aviso de coleta visível antes dos botões OAuth de comentários
[ ] Política cobre portabilidade e retificação
[ ] HTTPS funcionando sem erros no browser
[ ] Página de post abre corretamente
[ ] Seção de comentários carrega sem erro de CORS
[ ] Newsletter subscribe responde corretamente
```

---

## Bloco 2 — Evolução pós-lançamento

Organizado por área. Pode ser feito com o blog no ar, sem urgência imediata, mas cada item tem um impacto real quando resolvido.

---

### Segurança — primeiras 2 semanas

- [ ] **OAuth redirect: validar allowlist no dashboard** — `redirectTo` enviado pelo blog precisa de validação exata de host/path no backend do dashboard. Risco real de open redirect se alguém manipular a URL. Arquivo: dashboard `app/api/comment-auth/`.
- [ ] **CSP sem `unsafe-inline`** — progressivo. Começa movendo scripts inline para arquivos `.js` separados e usando `type="module"`. Não precisa estar perfeito antes de lançar, mas cada PR que toca scripts pode ir limpando. Arquivo: `nginx.conf`.
- [ ] **CI/CD: permissões mínimas do `GITHUB_TOKEN`** — adicionar `permissions: contents: read` no workflow, pin por SHA para `appleboy/ssh-action`, `npm audit --audit-level=moderate` bloqueante. Arquivo: `.github/workflows/ci.yml`.
- [ ] **Confirmar controles nos endpoints do dashboard** — documentar que `POST /api/newsletter/subscribe`, `GET /api/comments`, `PATCH /api/reading-progress` têm rate limit, CORS restrito e limite de payload. Criar testes de contrato no `dashboard-ldstudio`.

---

### Observabilidade — primeira semana

- [ ] **Uptime monitoring** — 10 minutos de configuração. UptimeRobot (gratuito) ou BetterUptime monitorando `https://devsaderiva.com.br` e `https://dashboard.devsaderiva.com.br/health`. Alerta por e-mail se cair.
- [ ] **Backup automático do banco** — script diário de `pg_dump` com retenção de 30 dias, idealmente para storage externo (R2 bucket separado). Documentar em `docs/operations.md`.
- [ ] **Health check do dashboard no build** — se o dashboard não responder durante o build, emitir warning visível no CI em vez de gerar um site vazio silenciosamente.

---

### LGPD — primeiras 2 semanas

- [ ] **Progresso de leitura no banner de consentimento** — o `readerId` em `localStorage` e a sincronização de progresso com o dashboard precisam estar no escopo do consentimento. Mencionar na política e incluir na lógica do banner. Arquivo: `src/lib/reading-progress-client.ts`, `src/layouts/Base.astro`.
- [ ] **Anonimização de IP no GA** — verificar se `anonymize_ip` está ativo e documentar na política. Se não estiver, ativar.
- [ ] **Detalhar terceiros na política** — para GA, Vercel Analytics, Resend, Cloudflare e provedores OAuth: especificar dados enviados, finalidade e link para política deles. Arquivo: `src/pages/privacidade.astro`.
- [ ] **Aviso sobre menores** — adicionar nota na política e nos formulários de newsletter/comentários: serviço não destinado a menores de 13 anos. Arquivo: `src/pages/privacidade.astro`, `src/components/Comments.astro`, `src/components/Newsletter.astro`.
- [ ] **Double opt-in da newsletter documentado** — confirmar fluxo `PENDING → ACTIVE` no dashboard e documentar. Se não existir, implementar token de confirmação por e-mail.

---

### Produto — primeiro mês

- [ ] **Busca na navbar** — `/busca` existe e funciona mas não está linkada. Adicionar ícone de lupa ou item "Busca" no `Navbar.astro`. Esforço: 30 min.
- [ ] **Webhook de rebuild** — ao publicar post no dashboard, disparar rebuild automático via GitHub Actions. Elimina o rebuild manual. Esforço: 2–3h.
- [ ] **Paginação estática por categoria** — `/categorias/[slug]/pagina/[n]` via `getStaticPaths()`. Já existe a estrutura de pasta. Garante indexação pelo Google sem depender de JS. Esforço: 2–3h.
- [ ] **Link "Revisões" no editor do dashboard** — `app/dashboard/posts/[id]/revisoes/page.tsx` existe mas não há navegação até ela. Adicionar botão no `NavRail.tsx`. Esforço: 30 min.
- [ ] **Regenerar `contentHtml` na restauração de revisão** — `restoreRevision()` restaura o HTML salvo na revisão, que pode estar desatualizado. Chamar `markdownToHtml()` no conteúdo restaurado. Arquivo: `app/services/postRevision.service.ts`. Esforço: 30 min.

---

### Segurança contínua — conforme capacidade

- [ ] **WAF rules no Cloudflare** — depois que o Cloudflare estiver ativo, configurar: bloquear user-agents de scanners conhecidos, challenge para IPs com muitos 4xx em sequência, limite de payload em rotas de API.
- [ ] **Dependabot no dashboard** — confirmar que `.github/dependabot.yml` existe no repositório `dashboard-ldstudio`.
- [ ] **Checklist OWASP no dashboard** — o blog já tem `pull_request_template.md`. Criar equivalente no dashboard para PRs que toquem auth, comentários ou HTML dinâmico.
- [ ] **Rotação de secrets documentada** — processo de rotação de `AUTH_SECRET` e `NEXTAUTH_SECRET` sem downtime, com logout forçado de sessões ativas.

---

### LGPD a médio prazo — próximos 3 meses

- [ ] **Retenção automatizada** — job periódico: anonimizar comentários rejeitados com 90+ dias, remover subscribers inativos há 24+ meses, purgar progresso de leitura sem atividade há 12+ meses.
- [ ] **Versão da política no consentimento da newsletter** — registrar `privacyPolicyVersion` no momento da inscrição para rastreabilidade em auditorias. Arquivo: `dashboard-ldstudio prisma/schema.prisma`, `app/services/newsletter.service.ts`.
- [ ] **RIPD** — avaliar necessidade do Relatório de Impacto à Proteção de Dados. O projeto usa analytics comportamental + progresso de leitura + OAuth + newsletter. Documentar em `docs/ripd.md`.
- [ ] **DPO identificado na política** — Art. 41 LGPD. Identificar formalmente o encarregado de dados na política de privacidade.
- [ ] **Atendimento a titulares sistematizado** — formulário no dashboard para registrar e rastrear solicitações de acesso, retificação, exclusão e portabilidade com prazo de 15 dias.

---

### Escala — quando o crescimento exigir

- [ ] **Pipeline de otimização de imagens** — redimensionamento para 1200px + WebP no upload. Impacto direto no LCP.
- [ ] **Build incremental** — com 200+ posts, o tempo de build cresce. Avaliar delta de posts atualizados via `updatedAt`.
- [ ] **API versionada** — `/api/v1/posts` para não quebrar o build do blog em mudanças de contrato.
- [ ] **Contract testing blog ↔ dashboard** — validar em CI que o shape dos endpoints públicos não muda sem aviso.
- [ ] **CDN para o blog** — Cloudflare Pages ou similar para entrega de borda. Avaliação quando o VPS virar gargalo.
- [ ] **Sistema de tags** — posts com múltiplas tags, páginas `/tags/[tag]`, busca facetada.
- [ ] **Posts relacionados** — ao final de cada post, 3 sugestões da mesma categoria. Já disponível via `getPostsByCategory()`.
- [ ] **Testes de carga** — `k6` (já existe em `tests/smoke.k6.js`) contra `GET /api/posts`. Definir SLO P95 < 500ms.
- [ ] **Axe-core no Playwright** — testes de acessibilidade automatizados em cada PR.
- [ ] **Multi-autor com escopo de seção** — `Invite` e `permissions` já existem no schema. Expor no painel.

---

## Resumo visual

```
AGORA (antes de lançar)          |  DEPOIS (com o blog no ar)
─────────────────────────────────|──────────────────────────────────────
1. npm audit fix                 |  Primeiras 2 semanas:
2. Analytics com consentimento   |  - OAuth redirect allowlist
3. URL dashboard HTTPS no build  |  - CSP sem unsafe-inline (progressivo)
4. Banner com Aceitar/Recusar    |  - Uptime monitoring
5. Política com retenção         |  - Backup do banco
6. Cloudflare proxy              |  - Progresso de leitura no consentimento
7. UFW no VPS                   |  - Detalhar terceiros na política
8. Aviso coleta OAuth comentários|  - Aviso menores nos formulários
9. Portabilidade/retif na página |
   de exclusão de dados          |  Primeiro mês:
                                 |  - Busca na navbar
                                 |  - Webhook de rebuild
                                 |  - Link revisões no editor
                                 |  - Paginação estática de categoria
                                 |
                                 |  Próximos 3 meses:
                                 |  - Retenção automatizada
                                 |  - RIPD avaliado
                                 |  - DPO na política
                                 |
                                 |  Quando crescer:
                                 |  - Pipeline de imagens
                                 |  - Build incremental
                                 |  - API versionada
                                 |  - Contract testing
                                 |  - Tags e posts relacionados
```
