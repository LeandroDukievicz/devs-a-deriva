# Relatório de Auditoria de Segurança

Auditoria realizada em 19/05/2026.

## 1. Resumo executivo

- Status geral de segurança: funcional para blog estático, mas não pronto para produção sem correções de dependências e consentimento.
- Risco geral: alto enquanto `npm run check:security` falhar e analytics carregar antes de consentimento.
- Está pronto para produção? Não para um corte rigoroso de segurança/LGPD.
- Principais riscos: dependências vulneráveis, analytics sem opt-in, dependência de validações no dashboard não verificadas neste repositório, CSP permissiva e lacunas LGPD.
- Correções críticas antes do deploy: atualizar lockfile/dependências, implementar consentimento real para analytics, validar endpoints públicos no dashboard, travar `PUBLIC_DASHBOARD_URL` de produção.
- Estimativa de esforço: 1 a 2 dias para P0 no blog; 1 a 3 dias adicionais para validar/ajustar dashboard.

## 2. Stack e arquitetura identificada

Blog estático em Astro 6, Tailwind 4, TypeScript, Vitest, Playwright, Docker multi-stage e Nginx. O blog consome o dashboard via `PUBLIC_DASHBOARD_URL` para posts, devs, comentários, newsletter e progresso de leitura. Não há banco, ORM, migrations, sessão ou autenticação no blog público; essas responsabilidades ficam no projeto externo `dashboard-ldstudio`.

## 3. Superfície de ataque

| Área | Rota/Arquivo | Tipo de entrada | Exposição | Risco |
|---|---|---|---|---|
| Comentários | `src/components/Comments.astro` | textarea, provider, honeypot, timing, `redirectTo`, query `commented` | Pública | Alto |
| Newsletter em posts | `src/components/Newsletter.astro` | e-mail, consentimento, honeypot, URL da página | Pública | Médio |
| Newsletter dedicada | `src/pages/newsletter.astro` | e-mail, consentimento, honeypot, URL da página | Pública | Médio |
| Progresso de leitura | `src/lib/reading-progress-client.ts` | `readerId`, slugs, progresso | Pública | Médio |
| Conteúdo publicado | `src/lib/posts.ts`, `/posts/[slug]` | Markdown vindo do dashboard | Pública | Médio |
| Índices públicos | `/ai-index.json`, `/rss.xml`, `/sitemap.xml` | Dados publicados do dashboard | Pública | Baixo |
| Admin externo | link para `dashboard.devsaderiva.com.br` | Navegação | Pública | Baixo |
| Infra | `nginx.conf`, `vercel.json`, Docker | Headers/cache/deploy | Pública | Médio |
| CI/CD | `.github/workflows/ci.yml` | Secrets de deploy | Privada no GitHub | Médio |

## 4. Achados por severidade

### Crítico

Nenhuma vulnerabilidade crítica explorável foi comprovada somente neste repositório.

### Alto

| ID | Vulnerabilidade | Local | Impacto | Exploração possível | Correção |
|---|---|---|---|---|---|
| SEC-001 | Dependências vulneráveis e instalação inválida | `package-lock.json`, `node_modules` | CI de segurança falha; risco de DoS transitivo | `npm run check:security` falha com 12 vulnerabilidades, incluindo `devalue` alta | Atualizar dependências/lockfile e repetir suite completa |
| SEC-002 | Analytics carregado antes de consentimento | `src/layouts/Base.astro:103-112`, `157-170`, `539-557` | Risco LGPD e rastreamento sem opt-in | GA e Vercel Analytics carregam antes do banner; banner só aceita | Consent Mode v2, aceitar/recusar e carregamento condicional |
| SEC-003 | Endpoints públicos dependem de validação externa não verificada | `Comments.astro:819-831`, `Newsletter.astro:493-506`, `reading-progress-client.ts:101-140` | Spam, abuso, enumeração ou redirect aberto se dashboard falhar | Blog envia payloads públicos sem autenticação local | Auditar dashboard com testes de validação, CORS, rate limit e allowlist |

### Médio

| ID | Vulnerabilidade | Local | Impacto | Correção |
|---|---|---|---|---|
| SEC-004 | CSP permissiva com `unsafe-inline` | `nginx.conf:25`, `nginx.conf:49`, `vercel.json` | XSS teria menos barreiras se um sink inseguro entrar | Restringir CSP, limitar `connect-src`, planejar nonces/hashes |
| SEC-005 | `PUBLIC_DASHBOARD_URL` pode cair em `http://localhost:3000` | Vários arquivos; exemplo `src/lib/posts.ts:211` | Build/deploy mal configurado pode apontar para origem errada | Validar env em produção e documentar variável obrigatória |
| SEC-006 | Progresso de leitura cria identificador persistente | `src/lib/reading-progress-client.ts:8-28`, `101-140` | Rastreamento pseudônimo sem consentimento explícito | Incluir no banner/política e oferecer limpeza/opt-out |
| SEC-007 | Comentários OAuth sem aviso de dados coletados | `src/components/Comments.astro:61-93` | Falha de transparência LGPD | Informar nome/avatar/e-mail/provider e moderação antes do login |
| SEC-008 | CI/CD sem `permissions:` explícito e actions não pinadas por SHA | `.github/workflows/ci.yml` | Superfície de supply chain maior | Definir permissões mínimas e avaliar pin de actions críticas |

### Baixo

| ID | Vulnerabilidade | Local | Correção |
|---|---|---|---|
| SEC-009 | Código morto/hints de inline scripts | `Comments.astro:633`, hints do `astro check` | Remover `timeAgo`; marcar `is:inline` quando intencional |
| SEC-010 | Documentação operacional não verificável por repo | `docs/security.md` | Anexar evidência de UFW/Cloudflare/Fail2ban em runbook |

## 5. Análise de autenticação

O blog não autentica usuários. Comentários usam OAuth no dashboard. O fluxo local apenas inicia draft e redireciona para `signInUrl`. Segurança de `state`, PKCE, sessão e expiração não pôde ser validada neste repositório.

## 6. Análise de autorização

Não há autorização no blog público. Rotas administrativas reais ficam no dashboard externo. A rota `src/pages/admin/login.astro` é apenas placeholder informativo e não expõe funcionalidade sensível.

## 7. Análise de validação e sanitização

Newsletter tem validação client-side em `src/lib/newsletter-email.ts` e honeypot no payload, mas isso é UX, não controle de segurança. Comentários limitam `maxlength=1000`, usam provider por botão, enviam honeypot/timing no payload e renderizam texto com `textContent`, o que reduz XSS no frontend. Ainda é obrigatório validar tudo no dashboard, inclusive provider, tamanho, slug, `redirectTo`, origem, honeypot, timing e payload.

## 8. Análise de banco de dados

Não há banco neste repositório. Documentos indicam PostgreSQL/Prisma no dashboard. Itens de segurança de banco, constraints, migrations, ownership e dados pessoais precisam ser auditados no `dashboard-ldstudio`.

## 9. Análise de variáveis de ambiente e secrets

| Variável/Arquivo | Problema | Severidade | Correção |
|---|---|---|---|
| `PUBLIC_DASHBOARD_URL` | Público e usado para chamadas sensíveis; fallback local em produção seria perigoso | Médio | Exigir HTTPS/domínio esperado no build produtivo |
| `.env.example` | Documenta só `PUBLIC_DASHBOARD_URL` | Baixo | Documentar `PUBLIC_COMMIT_SHA` e variáveis de CI/deploy em local único |
| `.env` | Existe localmente, não apareceu como versionado | Baixo | Manter fora do Git |
| Secrets GitHub | Documentados no README | Médio | Garantir ambientes protegidos e permissões mínimas |

Busca por secrets não encontrou chaves reais; os hits foram documentação/scripts de exemplo.

## 10. Análise de dependências

`npm audit --audit-level=moderate` e `npm run check:security` falharam. Achados principais: `devalue` alta, `tmp`, `ws`, `yaml`, `brace-expansion`. `npm ls --depth=0` falhou por dependências instaladas inválidas contra `package.json` e `@emnapi/runtime` extraneous. O lockfile precisa ser atualizado e validado.

## 11. Análise de headers, CORS e configuração web

`nginx.conf` define `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS, rate limit e timeouts. Pontos pendentes: CSP usa `unsafe-inline`, e `vercel.json` é mais permissivo em `connect-src https:`. CORS real dos endpoints está no dashboard e não foi verificado aqui.

## 12. Análise de frontend

Pontos positivos: comentários usam `textContent` para dados externos; avatar só aceita HTTPS; links externos do admin usam `noopener noreferrer`. Pontos de risco: `set:html` renderiza HTML gerado do Markdown em posts, analytics carrega antes de consentimento, e localStorage mantém identificadores/progresso.

## 13. Análise de backend/API

O blog só gera endpoints estáticos/dinâmicos de leitura (`health.json`, `ai-index.json`, `rss.xml`, `sitemap.xml`). APIs com escrita são externas ao dashboard. O contrato público precisa de testes no backend para payload, rate limit, CORS, respostas genéricas e allowlist de redirect.

## 14. Análise de uploads

Não há upload no blog. Upload de imagens é citado como responsabilidade do dashboard/Cloudflare R2 e não foi verificável neste repositório.

## 15. Análise de e-mail/newsletter

O frontend envia e-mail normalizado, consentimento, honeypot, tempo de preenchimento, origem e URL da página. A resposta é genérica, reduzindo enumeração. Falta confirmar no dashboard: double opt-in, hash de tokens, unsubscribe, rate limit por IP/e-mail, validação dos sinais anti-bot, armazenamento de consentimento e retenção de leads pendentes.

## 16. Análise LGPD e privacidade

Dados pessoais/pseudônimos envolvidos: e-mail de newsletter, comentário, dados OAuth, readerId/progresso, analytics e IPs/logs em terceiros. Principais lacunas: analytics sem opt-in, ausência de recusa no banner, progresso de leitura sem consentimento explícito, retenção insuficientemente documentada e terceiros pouco detalhados.

## 17. Análise de logs e observabilidade

Não há logging de aplicação no blog estático. Logs de Nginx/Caddy/Cloudflare/dashboard não são versionados. Falta checklist operacional de alertas para 5xx, OAuth, abuso em comentários/newsletter e falha de rebuild.

## 18. Análise de deploy e CI/CD

CI roda lint/typecheck/test/build/audit/lighthouse/deploy/smoke. Gitleaks existe. Riscos: workflow sem `permissions:` explícito, actions por tag, deploy SSH direto em `main`, e `npm ci --legacy-peer-deps` pode mascarar problemas de resolução. O deploy script tem rollback básico.

## 19. Mapeamento OWASP Top 10

| OWASP | Encontrado? | Evidência | Severidade |
|---|---|---|---|
| A01 Broken Access Control | Não verificado | Backend externo | Não verificado |
| A02 Cryptographic Failures | Parcial | Analytics/privacidade; OAuth externo | Médio |
| A03 Injection | Parcial | Markdown vira HTML; comentários usam `textContent` | Médio |
| A04 Insecure Design | Sim | Segurança de escrita depende do dashboard | Alto |
| A05 Security Misconfiguration | Sim | CSP permissiva; env fallback | Médio |
| A06 Vulnerable Components | Sim | `npm audit` falha | Alto |
| A07 Auth Failures | Não verificado | OAuth externo | Não verificado |
| A08 Data Integrity Failures | Parcial | CI supply chain melhorável | Médio |
| A09 Logging/Monitoring Failures | Sim | Sem alertas operacionais versionados | Baixo |
| A10 SSRF | Não aplicável no blog | Sem backend server-side com URL do usuário | Não aplicável |

## 20. Comandos executados e resultados

- `npm run lint`: passou, 54 arquivos verificados.
- `npm run typecheck`: passou, 0 erros; 6 hints/warnings informativos.
- `npm test`: passou, 3 arquivos e 75 testes.
- `npm run build`: passou, 17 páginas geradas.
- `npm audit --audit-level=moderate`: falhou, 12 vulnerabilidades.
- `npm run check:security`: falhou por `npm audit --audit-level=high`.
- `npm outdated`: falhou com lista de pacotes desatualizados.
- `npm ls --depth=0`: falhou com dependências inválidas/extraneous.
- Buscas por secrets e padrões perigosos: sem secret real; encontrou usos esperados de `set:html`, `innerHTML` estático, `localStorage`, `sessionStorage` e `child_process` em scripts.

## 21. Plano de correção priorizado

### P0 — Corrigir imediatamente

- [ ] Atualizar dependências/lockfile e zerar `npm run check:security`.
- [ ] Implementar consentimento real para GA/Vercel Analytics.
- [ ] Auditar endpoints públicos no dashboard com testes de abuso/validação.
- [ ] Validar `PUBLIC_DASHBOARD_URL` para produção.

### P1 — Corrigir antes de produção

- [ ] Endurecer CSP e alinhar `nginx.conf`/`vercel.json`.
- [ ] Incluir progresso de leitura no consentimento e política.
- [ ] Informar coleta de dados no fluxo OAuth de comentários.
- [ ] Adicionar `permissions:` explícito no GitHub Actions.

### P2 — Corrigir em curto prazo

- [ ] Completar política LGPD com retenção, terceiros e direitos.
- [ ] Adicionar matriz de testes de segurança para comentários/newsletter/progresso, incluindo honeypot e timing.
- [ ] Validar índices públicos contra vazamento de drafts/dados internos.

### P3 — Hardening e melhorias

- [ ] Registrar evidências operacionais de Cloudflare/UFW/Fail2ban.
- [ ] Criar alertas de abuso e falhas.
- [ ] Remover código morto e hints menores.

## 22. Checklist de segurança recomendado

- [ ] `npm audit --audit-level=moderate` sem vulnerabilidades relevantes.
- [ ] `npm ls --depth=0` sem pacotes inválidos/extraneous.
- [ ] Consentimento de analytics testado em aceitar/recusar/resetar.
- [ ] Dashboard bloqueia `redirectTo` externo.
- [ ] Dashboard valida provider, slug, body, e-mail, consentimento e payload size.
- [ ] Dashboard responde newsletter de forma genérica.
- [ ] Rate limit ativo para comentários, newsletter e progresso.
- [ ] CSP revisada e testada em produção.
- [ ] Política de privacidade cobre todos os dados coletados.
- [ ] CI com permissões mínimas e secret scan ativo.

## 23. Conclusão

O projeto está em desenvolvimento funcional, mas não está pronto para produção do ponto de vista de segurança rigorosa. O blog estático tem boas bases: headers no Nginx, secret scan, testes, renderização segura de comentários e fallback estático. Os bloqueadores são objetivos: dependências vulneráveis quebrando o audit, consentimento de analytics incompleto e falta de evidência no repositório para os controles do dashboard que recebem dados públicos.

Fonte externa consultada: a lista oficial de IPs da Cloudflare, atualizada em 28/09/2023 e declarada como fonte definitiva dos ranges atuais, confere com os ranges documentados em `docs/security.md`: https://www.cloudflare.com/ips/
