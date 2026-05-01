# Auditoria e milestones - Devs a Deriva

Gerado em: 2026-04-28
Repositorio alvo: LeandroDukievicz/devs-a-deriva

## Escopo
- Repositorio local atual: blog Astro estatico.
- Dashboard Next.js, backend Node.js/API e PostgreSQL sao arquitetura esperada, mas nao estao versionados neste diretorio.
- Analise baseada no codigo existente, docs do projeto e contexto de produto informado.

## Diagnostico geral
- O blog publico ja possui identidade visual forte, rotas de posts, categorias, manifesto, comentarios client-side e integracao real com dashboard via PUBLIC_DASHBOARD_URL.
- A fonte de conteudo ja e consumida por adapter tipado no fluxo dashboard -> API -> banco -> blog; home e post deixam de depender de conteudo hardcoded como fonte final.
- Nao ha backend/API versionado, schema de banco, migrations, validacao server-side, autenticacao real, RBAC, CI/CD, testes automatizados ou observabilidade.
- npm run build passou localmente, gerando 27 paginas estaticas.
- npm audit encontrou vulnerabilidades em Astro/Vite/esbuild/PostCSS; atualizar dependencias e validar breaking changes e bloqueador para producao.

## Problemas de seguranca
- Alto: src/components/Comments.astro monta innerHTML com dados vindos de API externa; escaping manual parcial nao cobre atributos como src/alt/title e aumenta risco de XSS.
- Alto: comentarios, OAuth e moderacao dependem de backend nao versionado; nao ha evidencia de CSRF, rate limit, assinatura de estado OAuth, validacao de redirectTo ou autorizacao.
- Alto: remote Git local contem credencial embutida na URL. Remover do remote e rotacionar o token antes de qualquer compartilhamento.
- Medio: nao ha headers de seguranca documentados/configurados: CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy e frame-ancestors.
- Medio: Markdown futuro ainda nao tem pipeline definido de parsing, sanitizacao, allowlist de HTML, tratamento de imagens e protecao contra javascript: URLs.
- Medio: PUBLIC_DASHBOARD_URL e uma origem publica controlando fetches do cliente; precisa de allowlist de origem e CORS restritivo no backend.
- Medio: nao ha protecao contra spam/bots nos comentarios: captcha adaptativo, honeypot, rate limit por IP/usuario/post e fila de moderacao.

## Problemas tecnicos e produto
- Nao ha testes unitarios, integracao, E2E, acessibilidade, performance ou seguranca.
- Nao ha lint/typecheck explicito nos scripts de package.json.
- Tailwind esta instalado, mas grande parte do estilo vive em CSS escopado/manual; isso e aceitavel pela direcao visual, mas precisa de convencao mais rigida.
- SEO basico existe via title/description no Base, mas faltam canonical, OG image por post, JSON-LD, sitemap/robots e metadados de artigo.
- Imagens usam public/ e img nativo; falta estrategia centralizada para dimensoes, formatos, lazy/eager e assets remotos.
- O estado de publicacao, autores, categorias, comentarios e media ainda nao possui modelo persistente nem contratos de API.

## Milestones

### Milestone 1 - Fundacao e arquitetura
Prioridade: CRITICO

Objetivo: Estabilizar a base tecnica, separar responsabilidades e documentar contratos antes de expandir produto.

Checklist:
- [ ] Criar ADR definindo se blog, dashboard e API ficarao em monorepo ou repos separados.
- [ ] Definir arquitetura alvo: Astro blog, dashboard admin, API Node.js, PostgreSQL e storage de imagens.
- [ ] Criar mapa de fronteiras entre blog publico, dashboard administrativo, API e banco.
- [ ] Definir contratos iniciais de entidades: Post, Author, Category, Comment, MediaAsset, Tag.
- [ ] Adicionar scripts padrao: typecheck, lint, test, test:e2e, audit e format.
- [ ] Criar .env.example sem segredos com todas as variaveis esperadas.
- [ ] Remover credenciais embutidas do remote Git e rotacionar token exposto localmente.
- [ ] Atualizar docs/architecture.md com o fluxo real dashboard -> API -> banco -> blog.

Criterios de aceite:
- [ ] Repositorio possui comandos padronizados para validacao local.
- [ ] Arquitetura e contratos estao documentados sem depender de conhecimento verbal.
- [ ] Nenhum segredo fica em remote, docs, codigo ou arquivo versionado.

### Milestone 2 - Seguranca base e dependencias
Prioridade: CRITICO

Objetivo: Eliminar riscos conhecidos antes de conectar entrada de usuario, Markdown e autenticacao.

Checklist:
- [ ] Atualizar Astro, Vite, esbuild e PostCSS para versoes sem advisories conhecidos.
- [ ] Executar npm audit e documentar qualquer excecao aceita com justificativa.
- [ ] Adicionar politica de headers: CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy e frame-ancestors.
- [ ] Definir allowlist de origens para PUBLIC_DASHBOARD_URL e CORS no backend.
- [ ] Remover renderizacao por innerHTML em dados externos de Comments.astro.
- [ ] Implementar helper seguro para criar DOM de comentarios com textContent e atributos validados.
- [ ] Definir pipeline seguro de Markdown: remark/rehype, sanitize schema e bloqueio de HTML perigoso.
- [ ] Adicionar validacao de URL contra javascript:, data: indevido e hosts nao permitidos.
- [ ] Criar checklist OWASP Top 10 para cada PR que tocar auth, comentarios, Markdown ou upload.

Criterios de aceite:
- [ ] npm audit nao retorna vulnerabilidade alta/critica em producao.
- [ ] Comentarios nao renderizam HTML vindo da API por string interpolation.
- [ ] Headers de seguranca estao aplicados no ambiente alvo.

### Milestone 3 - Backend/API editorial
Prioridade: CRITICO

Objetivo: Criar API versionada para conteudo, comentarios, autenticacao e moderacao.

Checklist:
- [ ] Escolher framework backend: Fastify, NestJS ou Next API routes, com justificativa.
- [ ] Criar estrutura por camadas: routes/controllers, services, repositories e schemas.
- [ ] Adicionar validacao com Zod para todas as entradas e saidas publicas.
- [ ] Padronizar respostas de erro com status, code, message e requestId.
- [ ] Implementar endpoints publicos de posts: listar, buscar por slug, listar por categoria.
- [ ] Implementar endpoints admin de posts: criar, editar, publicar, despublicar e arquivar.
- [ ] Implementar endpoints de categorias e autores com paginacao.
- [ ] Implementar logs estruturados com redacao de PII e correlation id.
- [ ] Adicionar healthcheck e readiness check.
- [ ] Criar OpenAPI ou contrato equivalente versionado.

Criterios de aceite:
- [ ] API sobe localmente com comandos documentados.
- [ ] Todos os endpoints tem schema de validacao.
- [ ] Erros e logs seguem formato unico.

### Milestone 4 - Banco de dados PostgreSQL
Prioridade: CRITICO

Objetivo: Modelar persistencia relacional para conteudo editorial, usuarios e comentarios.

Checklist:
- [ ] Escolher ORM/query builder: Prisma, Drizzle ou SQL puro com migrations.
- [ ] Criar migrations para users, authors, categories, posts, post_revisions, comments, media_assets e tags.
- [ ] Definir slugs unicos por post e categoria com constraints no banco.
- [ ] Adicionar indices para slug, status, published_at, category_id, author_id e moderation_status.
- [ ] Modelar revisoes de post para auditoria editorial.
- [ ] Modelar status explicitos: draft, review, scheduled, published, archived.
- [ ] Adicionar soft delete onde fizer sentido e created_at/updated_at em todas as tabelas.
- [ ] Criar seed minimo para ambiente local.
- [ ] Definir estrategia de backup, restore e migracao para producao.

Criterios de aceite:
- [ ] Banco local pode ser criado do zero via migration e seed.
- [ ] Consultas principais tem indice planejado.
- [ ] Modelo suporta publicacao, revisao e moderacao sem gambiarra.

### Milestone 5 - Dashboard admin
Prioridade: IMPORTANTE

Objetivo: Entregar painel funcional para operacao editorial sem editar codigo.

Checklist:
- [ ] Implementar login real com provedor OAuth e sessao segura.
- [ ] Implementar RBAC com papeis: author, editor e admin.
- [ ] Criar listagem de posts com filtros por status, autor, categoria e busca.
- [ ] Criar formulario de post com titulo, slug, resumo, categoria, autor, tags e capa.
- [ ] Criar editor Markdown com preview sanitizado.
- [ ] Implementar salvar rascunho e publicar com validacoes obrigatorias.
- [ ] Implementar historico de revisoes e restauracao controlada.
- [ ] Criar telas de categorias, autores e media assets.
- [ ] Adicionar estados vazios, loading, erro e confirmacao destrutiva.

Criterios de aceite:
- [ ] Um editor consegue criar e publicar post completo sem tocar no codigo.
- [ ] Usuario sem permissao nao acessa rotas administrativas.
- [ ] Preview do Markdown usa o mesmo pipeline seguro do blog.

### Milestone 6 - Blog dinamico e experiencia publica
Prioridade: IMPORTANTE

Objetivo: Migrar o blog de posts estaticos hardcoded para conteudo vindo da API/banco sem perder performance.

Checklist:
- [x] Substituir src/lib/posts.ts por adapter de conteudo com contrato tipado.
- [ ] Definir estrategia de render: SSG com revalidacao, SSR ou build acionado por webhook.
- [ ] Garantir fallback quando API estiver indisponivel.
- [ ] Centralizar resolucao de imagem de capa: post, categoria e fallback global.
- [ ] Criar paginacao para home e categorias.
- [ ] Manter navegacao contextual home/categoria/post.
- [ ] Adicionar pagina de busca ou preparar endpoint para busca futura.
- [ ] Validar responsividade da home, categorias e post em mobile/tablet/desktop.
- [ ] Remover dados mockados ou marcar explicitamente como seed/demo.
- [x] Sincronizar progresso de leitura em tempo real com o dashboard e exibir porcentagem/conclusao nos cards.

Criterios de aceite:
- [x] Posts publicados no banco aparecem no blog conforme estrategia escolhida.
- [x] Build/render nao depende de dados hardcoded.
- [ ] UI existente continua consistente nas rotas principais.

### Milestone 7 - Sistema de comentarios e moderacao
Prioridade: CRITICO

Objetivo: Fechar o fluxo de comentarios com autenticacao, seguranca anti-spam e moderacao.

Checklist:
- [ ] Implementar OAuth com state assinado, PKCE quando aplicavel e redirectTo validado por allowlist.
- [ ] Criar draft de comentario associado a sessao temporaria segura.
- [ ] Validar comentario no backend: tamanho, conteudo vazio, spam basico e slug existente.
- [ ] Implementar rate limit por IP, conta, post e janela de tempo.
- [ ] Adicionar honeypot ou captcha adaptativo em comportamento suspeito.
- [ ] Salvar comentarios com status pending, approved, rejected e hidden.
- [ ] Criar tela admin de moderacao com filtros e acoes em lote.
- [ ] Garantir que API publica retorne apenas comentarios aprovados.
- [ ] Sanitizar nomes, imagens e providers antes de expor ao blog.

Criterios de aceite:
- [ ] Comentario novo nunca aparece publico antes da aprovacao.
- [ ] Fluxo OAuth nao aceita open redirect.
- [ ] Frontend renderiza comentarios sem innerHTML inseguro.

### Milestone 8 - Performance e assets
Prioridade: IMPORTANTE

Objetivo: Controlar custo visual da experiencia sem sacrificar Core Web Vitals.

Checklist:
- [ ] Medir Lighthouse em home, post, categoria, manifesto e devs.
- [ ] Definir budgets de JS, CSS, imagens e LCP por rota.
- [ ] Migrar imagens criticas para componente Image ou pipeline equivalente.
- [ ] Definir width/height ou aspect-ratio para imagens principais.
- [ ] Lazy load de imagens nao criticas e eager apenas para LCP real.
- [ ] Reduzir scripts duplicados e listeners globais onde possivel.
- [ ] Auditar canvases/animações para prefers-reduced-motion.
- [ ] Adicionar fallback visual para falha de imagem remota de autor/dev.
- [ ] Criar teste de build que falha se bundle passar do budget definido.

Criterios de aceite:
- [ ] Rotas principais atendem budgets definidos.
- [ ] Usuarios com reduced motion recebem experiencia reduzida.
- [ ] Imagens nao causam layout shift perceptivel.

### Milestone 9 - SEO, AEO e semantica editorial
Prioridade: IMPORTANTE

Objetivo: Preparar o conteudo para indexacao, compartilhamento e respostas assistidas.

Checklist:
- [ ] Adicionar canonical URL por rota.
- [ ] Adicionar OG title, description, image e type por post/categoria.
- [ ] Adicionar Twitter Card por post.
- [ ] Gerar sitemap.xml e robots.txt.
- [ ] Adicionar JSON-LD Article para posts publicados.
- [ ] Adicionar datas published_at e updated_at no modelo de post.
- [ ] Garantir hierarquia semantica de h1/h2/h3 nas paginas publicas.
- [ ] Criar metadados de autor e categoria nas paginas de post.
- [ ] Adicionar pagina ou feed RSS/Atom se fizer sentido editorial.
- [ ] Validar conteudo com ferramenta de rich results.

Criterios de aceite:
- [ ] Cada post tem metadados completos e compartilhamento rico.
- [ ] Sitemap reflete apenas conteudo publicavel.
- [ ] Estrutura semantica passa por auditoria basica.

### Milestone 10 - Testes automatizados
Prioridade: CRITICO

Objetivo: Criar rede minima de testes para proteger seguranca, conteudo e UX critica.

Checklist:
- [ ] Adicionar Vitest para funcoes puras, adapters e validadores.
- [ ] Adicionar Testing Library quando houver componentes interativos testaveis.
- [ ] Adicionar Playwright para rotas principais: home, categoria, post, manifesto, devs e admin login.
- [ ] Criar testes E2E para comentarios: vazio, prompt OAuth, erro de API e lista aprovada mockada.
- [ ] Criar testes de seguranca para payloads XSS em comentarios e Markdown.
- [ ] Criar testes de contrato da API com schemas Zod/OpenAPI.
- [ ] Criar teste de acessibilidade com axe em rotas principais.
- [ ] Adicionar npm script test:ci agregando unit, e2e leve e audit.

Criterios de aceite:
- [ ] CI bloqueia regressao basica em build, lint, unit e e2e critico.
- [ ] Payloads XSS conhecidos nao executam nem quebram layout.
- [ ] Rotas principais sao verificadas em desktop e mobile.

### Milestone 11 - DevOps, deploy e ambientes
Prioridade: CRITICO

Objetivo: Criar caminho reproduzivel de desenvolvimento, homologacao e producao.

Checklist:
- [ ] Definir ambientes: local, preview/staging e production.
- [ ] Criar CI GitHub Actions para install, lint, typecheck, test, build e audit.
- [ ] Adicionar cache de npm seguro no CI.
- [ ] Adicionar check de secrets para evitar commit de tokens.
- [ ] Configurar deploy preview para PRs.
- [ ] Configurar variaveis por ambiente sem segredos no codigo.
- [ ] Criar docker-compose local com API, PostgreSQL e storage fake se necessario.
- [ ] Documentar rollback de frontend, API e migrations.
- [ ] Definir estrategia para migrations em deploy.

Criterios de aceite:
- [ ] PR nao mergeia sem pipeline verde.
- [ ] Ambiente local sobe com passos documentados.
- [ ] Deploy e rollback tem procedimento claro.

### Milestone 12 - Observabilidade e operacao
Prioridade: IMPORTANTE

Objetivo: Dar visibilidade real de erros, performance, uso editorial e saude do sistema.

Checklist:
- [ ] Adicionar captura de erros frontend com Sentry ou equivalente.
- [ ] Adicionar logs estruturados no backend com requestId.
- [ ] Adicionar metricas de latencia, taxa de erro e throughput por endpoint.
- [ ] Criar alertas para erro 5xx, falha de OAuth, aumento de spam e API indisponivel.
- [ ] Adicionar dashboard de Core Web Vitals e eventos editoriais.
- [ ] Definir politica de retencao de logs e PII.
- [ ] Criar auditoria de acoes administrativas: quem publicou, editou, moderou ou apagou.
- [ ] Criar runbook para incidente de seguranca e indisponibilidade.

Criterios de aceite:
- [ ] Incidentes comuns tem alerta e runbook.
- [ ] Acoes administrativas sensiveis sao auditaveis.
- [ ] PII nao aparece em log bruto sem necessidade.

### Milestone 13 - Polimento de UX e acessibilidade
Prioridade: EVOLUCAO

Objetivo: Refinar consistencia visual, acessibilidade e ergonomia sem descaracterizar a identidade do projeto.

Checklist:
- [ ] Auditar navegacao por teclado em navbar, dropdowns, comentarios e formularios.
- [ ] Adicionar foco visivel consistente em links e botoes.
- [ ] Validar contraste por tema, incluindo Limbo e paginas com canvas/fundo animado.
- [ ] Revisar aria-labels e roles em elementos interativos criados por JS.
- [ ] Garantir alternativa para animacoes longas e experiencias com canvas.
- [ ] Consolidar tokens e remover cores fixas sem justificativa.
- [ ] Criar guia de componentes publicos e administrativos.
- [ ] Validar layout sem sobreposicao em viewports estreitos.

Criterios de aceite:
- [ ] Fluxos principais funcionam sem mouse.
- [ ] Temas passam em contraste minimo definido.
- [ ] Componentes novos seguem guia visual documentado.

## Plano de implementacao detalhado

Esta secao detalha o que sera implementado em cada milestone. Ela deve ser usada como base para abrir issues, organizar PRs e validar o escopo antes de escrever codigo.

### Milestone 1 - Fundacao e arquitetura

Entregas principais:
- [ ] Decisao documentada sobre monorepo versus repos separados.
- [ ] Contratos iniciais das entidades editoriais.
- [ ] Scripts locais minimos de validacao.
- [ ] Inventario de variaveis de ambiente.
- [ ] Documentacao do fluxo dashboard -> API -> banco -> blog.

Implementacao:
- [ ] Criar `docs/adr/0001-estrutura-do-produto.md` explicando a decisao de manter o blog Astro neste repo e quando separar dashboard/API.
- [ ] Criar `docs/domain-model.md` com os campos de `Post`, `Author`, `Category`, `Comment`, `MediaAsset`, `Tag` e estados de publicacao.
- [ ] Atualizar `docs/architecture.md` com fronteiras claras entre frontend publico, dashboard admin, API, banco e storage.
- [ ] Atualizar `docs/dashboard.md` com responsabilidades do painel e o que nao deve existir no dashboard.
- [ ] Criar `.env.example` com variaveis publicas e privadas previstas, sem valores reais.
- [ ] Adicionar scripts no `package.json`: `check`, `typecheck`, `lint`, `format`, `test`, `test:e2e`, `audit`.
- [ ] Documentar quais scripts ainda sao placeholders e quais ja executam validacao real.
- [ ] Remover qualquer credencial de configuracoes locais, historico de comandos ou documentacao antes de compartilhar o projeto.

Arquivos provaveis:
- [ ] `docs/architecture.md`
- [ ] `docs/dashboard.md`
- [ ] `docs/content-system.md`
- [ ] `docs/domain-model.md`
- [ ] `docs/adr/0001-estrutura-do-produto.md`
- [ ] `.env.example`
- [ ] `package.json`

Pronto quando:
- [ ] Qualquer pessoa consegue entender a arquitetura alvo sem depender de conversa externa.
- [ ] O projeto tem comandos padronizados para validar alteracoes.
- [ ] Os proximos PRs conseguem referenciar documentos estaveis de arquitetura e dominio.

### Milestone 2 - Seguranca base e dependencias

Entregas principais:
- [ ] Dependencias sem vulnerabilidades altas/criticas conhecidas em producao.
- [ ] Comentarios sem renderizacao insegura por `innerHTML`.
- [ ] Pipeline documentado para Markdown seguro.
- [ ] Politica inicial de headers e CORS.

Implementacao:
- [ ] Atualizar Astro, Vite, esbuild, PostCSS e dependencias relacionadas com validacao de build.
- [ ] Rodar `npm audit` e registrar excecoes aceitas em `docs/security.md`.
- [ ] Refatorar `src/components/Comments.astro` para montar comentarios com `textContent`, `createElement` e atributos validados.
- [ ] Criar helper de validacao para avatar, provider, nome, data e texto de comentario.
- [ ] Bloquear URLs com protocolos perigosos como `javascript:` e `data:` fora de allowlist explicita.
- [ ] Documentar o pipeline Markdown esperado com `remark`, `rehype`, sanitize schema e allowlist de tags.
- [ ] Definir headers esperados: CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy e frame-ancestors.
- [ ] Definir politica de CORS para o backend futuro e origens permitidas do dashboard.
- [ ] Criar checklist OWASP para PRs que mexam em auth, comentarios, Markdown, upload ou HTML dinamico.

Arquivos provaveis:
- [ ] `src/components/Comments.astro`
- [ ] `src/lib/security.ts`
- [ ] `docs/security.md`
- [ ] `docs/content-system.md`
- [ ] `package.json`
- [ ] `package-lock.json`

Pronto quando:
- [ ] Payloads simples de XSS em comentarios viram texto e nao HTML executavel.
- [ ] As dependencias passam por auditoria sem achados altos/criticos nao documentados.
- [ ] O projeto tem regras explicitas para renderizar conteudo gerado por usuario.

### Milestone 3 - Backend/API editorial

Entregas principais:
- [ ] API versionada para conteudo editorial.
- [ ] Schemas de entrada e saida.
- [ ] Padrao unico de erros e logs.
- [ ] Contrato OpenAPI ou equivalente.

Implementacao:
- [ ] Escolher e documentar framework backend: Fastify, NestJS ou Next API routes.
- [ ] Criar estrutura de pastas para `routes`, `controllers`, `services`, `repositories` e `schemas`.
- [ ] Criar schemas Zod para posts, categorias, autores, comentarios e assets.
- [ ] Implementar endpoints publicos de posts: listar, buscar por slug e listar por categoria.
- [ ] Implementar endpoints admin de posts: criar, editar, publicar, despublicar e arquivar.
- [ ] Implementar endpoints basicos de categorias e autores com paginacao.
- [ ] Padronizar erros com `status`, `code`, `message`, `details` e `requestId`.
- [ ] Adicionar healthcheck e readiness check.
- [ ] Gerar ou manter contrato OpenAPI versionado.

Arquivos provaveis:
- [ ] `apps/api/` ou `src/server/`
- [ ] `docs/api.md`
- [ ] `docs/adr/0002-backend-framework.md`
- [ ] `openapi.yaml`

Pronto quando:
- [ ] A API sobe localmente com comando documentado.
- [ ] Todos os endpoints tem validacao de entrada.
- [ ] O frontend pode consumir a API sem depender de tipos implicitos.

### Milestone 4 - Banco de dados PostgreSQL

Entregas principais:
- [ ] Modelo relacional para conteudo, usuarios, autores, comentarios e media.
- [ ] Migrations versionadas.
- [ ] Seed local minimo.
- [ ] Estrategia de backup e migracao.

Implementacao:
- [ ] Escolher ORM ou query builder: Prisma, Drizzle ou SQL puro.
- [ ] Criar tabelas `users`, `authors`, `categories`, `posts`, `post_revisions`, `comments`, `media_assets`, `tags` e tabelas de relacao.
- [ ] Definir constraints de slug unico para posts e categorias.
- [ ] Definir indices para `slug`, `status`, `published_at`, `category_id`, `author_id` e `moderation_status`.
- [ ] Criar estados explicitos de post: `draft`, `review`, `scheduled`, `published`, `archived`.
- [ ] Criar estados explicitos de comentario: `pending`, `approved`, `rejected`, `hidden`.
- [ ] Adicionar `created_at`, `updated_at` e soft delete onde fizer sentido.
- [ ] Criar seed com autor admin, categorias iniciais e posts de exemplo.
- [ ] Documentar restore local e procedimento de migration em producao.

Arquivos provaveis:
- [ ] `apps/api/db/`
- [ ] `prisma/` ou `drizzle/`
- [ ] `docker-compose.yml`
- [ ] `docs/database.md`

Pronto quando:
- [ ] O banco local pode ser recriado do zero.
- [ ] As consultas principais tem indices planejados.
- [ ] O modelo suporta revisao, publicacao e moderacao sem campos improvisados.

### Milestone 5 - Dashboard admin

Entregas principais:
- [ ] Login administrativo real.
- [ ] CRUD editorial de posts.
- [ ] Editor Markdown com preview sanitizado.
- [ ] Gestao inicial de categorias, autores e media.

Implementacao:
- [ ] Definir se o dashboard fica em app propria ou em rotas administrativas do repo.
- [ ] Implementar autenticacao OAuth com sessao segura.
- [ ] Implementar RBAC com papeis `author`, `editor` e `admin`.
- [ ] Criar tela de listagem de posts com filtros por status, categoria, autor e busca.
- [ ] Criar formulario de post com titulo, slug, resumo, categoria, autor, tags, capa e conteudo.
- [ ] Implementar salvar rascunho, enviar para revisao, publicar, agendar e arquivar.
- [ ] Criar preview Markdown usando o mesmo pipeline seguro do blog.
- [ ] Criar historico de revisoes com visualizacao e restauracao controlada.
- [ ] Criar telas basicas de categorias, autores e media assets.
- [ ] Adicionar estados de loading, erro, vazio e confirmacao destrutiva.

Arquivos provaveis:
- [ ] `src/pages/admin/` ou `apps/dashboard/`
- [ ] `src/components/admin/`
- [ ] `docs/dashboard.md`
- [ ] `docs/auth.md`

Pronto quando:
- [ ] Um editor publica um post completo sem editar codigo.
- [ ] Usuarios sem permissao nao acessam rotas administrativas.
- [ ] O preview do dashboard bate com a renderizacao publica.

### Milestone 6 - Blog dinamico e experiencia publica

Entregas principais:
- [ ] Conteudo vindo da API ou banco.
- [ ] Adapter tipado substituindo dados hardcoded.
- [ ] Estrategia de render definida.
- [ ] Paginacao e fallback de disponibilidade.

Implementacao:
- [ ] Criar adapter de conteudo para encapsular a origem dos posts.
- [ ] Substituir uso direto de `src/lib/posts.ts` por contrato tipado.
- [ ] Decidir entre SSG com rebuild por webhook, SSR ou revalidacao.
- [ ] Criar fallback quando API estiver indisponivel durante build ou runtime.
- [ ] Centralizar resolucao de capa: post, categoria, fallback global e placeholder.
- [ ] Criar paginacao para home e paginas de categoria.
- [ ] Ajustar rotas de post para consumir conteudo dinamico por slug.
- [ ] Preparar busca futura com endpoint ou indice local.
- [ ] Validar responsividade das rotas principais com conteudo realista.

Arquivos provaveis:
- [ ] `src/lib/content-adapter.ts`
- [ ] `src/lib/posts.ts`
- [ ] `src/pages/index.astro`
- [ ] `src/pages/categorias/*.astro`
- [ ] `src/pages/posts/[slug].astro`
- [ ] `docs/content-system.md`

Pronto quando:
- [ ] Posts publicados aparecem no blog pela estrategia escolhida.
- [ ] O build nao depende de mock hardcoded como fonte final.
- [ ] A UI atual continua consistente em home, categorias e posts.

### Milestone 7 - Sistema de comentarios e moderacao

Entregas principais:
- [ ] Comentarios autenticados.
- [ ] Moderacao antes de publicacao.
- [ ] Protecao basica contra spam.
- [ ] Tela admin de moderacao.

Implementacao:
- [ ] Implementar OAuth com `state` assinado, PKCE quando aplicavel e `redirectTo` validado por allowlist.
- [ ] Criar draft de comentario associado a sessao temporaria segura.
- [ ] Validar comentario no backend: tamanho, conteudo vazio, caracteres invalidos, post existente e usuario autenticado.
- [ ] Implementar rate limit por IP, conta, post e janela de tempo.
- [ ] Adicionar honeypot ou captcha adaptativo para comportamento suspeito.
- [ ] Salvar comentarios sempre como `pending` por padrao.
- [ ] Expor publicamente apenas comentarios `approved`.
- [ ] Criar tela de moderacao com filtros por status, post, autor, data e acoes em lote.
- [ ] Sanitizar nomes, avatares e providers antes de retornar para o blog.

Arquivos provaveis:
- [ ] `src/components/Comments.astro`
- [ ] `src/pages/admin/comments/`
- [ ] `apps/api/comments/`
- [ ] `docs/comments.md`
- [ ] `docs/security.md`

Pronto quando:
- [ ] Comentario novo nunca aparece sem aprovacao.
- [ ] OAuth nao permite open redirect.
- [ ] O frontend renderiza comentarios sem HTML inseguro.

### Milestone 8 - Performance e assets

Entregas principais:
- [ ] Budgets de performance.
- [ ] Imagens otimizadas e dimensoes estaveis.
- [ ] Respeito a `prefers-reduced-motion`.
- [ ] Teste ou auditoria automatizada de bundle.

Implementacao:
- [ ] Medir Lighthouse em home, post, categoria, manifesto e devs.
- [ ] Definir budgets para JS, CSS, imagens, LCP, CLS e TBT.
- [ ] Migrar imagens criticas para componente de imagem ou pipeline equivalente.
- [ ] Garantir `width`, `height` ou `aspect-ratio` em imagens principais.
- [ ] Aplicar lazy loading em imagens nao criticas.
- [ ] Marcar imagem LCP real como eager quando fizer sentido.
- [ ] Revisar scripts duplicados e listeners globais.
- [ ] Reduzir animacoes para usuarios com `prefers-reduced-motion`.
- [ ] Criar fallback visual para imagem remota quebrada.
- [ ] Criar verificacao de budget no CI.

Arquivos provaveis:
- [ ] `src/layouts/Base.astro`
- [ ] `src/components/*`
- [ ] `src/pages/*`
- [ ] `docs/performance.md`
- [ ] `scripts/`

Pronto quando:
- [ ] Rotas principais passam nos budgets definidos.
- [ ] Nao ha layout shift perceptivel causado por imagens.
- [ ] Usuarios com motion reduzido recebem uma experiencia mais calma.

### Milestone 9 - SEO, AEO e semantica editorial

Entregas principais:
- [ ] Metadados completos por rota.
- [ ] Sitemap e robots.
- [ ] JSON-LD para artigos.
- [ ] Estrutura semantica revisada.

Implementacao:
- [ ] Adicionar canonical URL em todas as rotas publicas.
- [ ] Adicionar Open Graph por post, categoria e paginas institucionais.
- [ ] Adicionar Twitter Card por post.
- [ ] Gerar `sitemap.xml` apenas com conteudo publicavel.
- [ ] Gerar `robots.txt` coerente com ambiente de producao.
- [ ] Adicionar JSON-LD `Article` para posts publicados.
- [ ] Adicionar `published_at` e `updated_at` ao modelo de post.
- [ ] Revisar hierarquia de `h1`, `h2` e `h3`.
- [ ] Adicionar metadados de autor, categoria e imagem de capa.
- [ ] Avaliar RSS/Atom para distribuicao editorial.

Arquivos provaveis:
- [ ] `src/layouts/Base.astro`
- [ ] `src/pages/posts/[slug].astro`
- [ ] `src/pages/categorias/*.astro`
- [ ] `astro.config.mjs`
- [ ] `docs/seo.md`

Pronto quando:
- [ ] Cada post tem compartilhamento rico e metadados consistentes.
- [ ] O sitemap representa apenas conteudo publico.
- [ ] A semantica das paginas principais passa por auditoria basica.

### Milestone 10 - Testes automatizados

Entregas principais:
- [ ] Testes unitarios para funcoes puras.
- [ ] Testes E2E das rotas criticas.
- [ ] Testes de seguranca para XSS conhecido.
- [ ] Script de CI agregando validacoes.

Implementacao:
- [ ] Adicionar Vitest para helpers, adapters, validadores e regras de conteudo.
- [ ] Adicionar Testing Library se houver componentes interativos testaveis fora de Astro puro.
- [ ] Adicionar Playwright para home, categoria, post, manifesto, devs e admin login.
- [ ] Criar testes E2E de comentarios: vazio, login necessario, erro de API e lista aprovada mockada.
- [ ] Criar testes com payloads XSS para comentarios e Markdown.
- [ ] Criar testes de contrato da API baseados em Zod/OpenAPI.
- [ ] Adicionar axe ou equivalente para acessibilidade nas rotas principais.
- [ ] Criar `npm run test:ci` para build, lint, unit, e2e critico e audit.

Arquivos provaveis:
- [ ] `vitest.config.*`
- [ ] `playwright.config.*`
- [ ] `tests/`
- [ ] `e2e/`
- [ ] `package.json`

Pronto quando:
- [ ] CI bloqueia regressao basica.
- [ ] Rotas principais sao testadas em desktop e mobile.
- [ ] Payloads XSS conhecidos nao executam nem quebram layout.

### Milestone 11 - DevOps, deploy e ambientes

Entregas principais:
- [ ] Pipeline de CI.
- [ ] Ambientes definidos.
- [ ] Deploy preview.
- [ ] Procedimento de rollback.

Implementacao:
- [ ] Definir ambientes `local`, `preview`, `staging` e `production`.
- [ ] Criar GitHub Actions para install, lint, typecheck, test, build e audit.
- [ ] Configurar cache de npm no CI.
- [ ] Adicionar check de secrets para evitar commit de tokens.
- [ ] Configurar deploy preview para PRs.
- [ ] Documentar variaveis por ambiente sem expor segredo.
- [ ] Criar `docker-compose.yml` local quando API e PostgreSQL entrarem no repo.
- [ ] Documentar rollback de frontend, API e migrations.
- [ ] Definir quando migrations rodam e como falhas sao tratadas.

Arquivos provaveis:
- [ ] `.github/workflows/ci.yml`
- [ ] `.env.example`
- [ ] `docker-compose.yml`
- [ ] `docs/deploy.md`
- [ ] `docs/runbook.md`

Pronto quando:
- [ ] PR tem pipeline verde antes de merge.
- [ ] Ambiente local sobe por passos documentados.
- [ ] Existe procedimento claro para deploy e rollback.

### Milestone 12 - Observabilidade e operacao

Entregas principais:
- [ ] Captura de erros frontend.
- [ ] Logs estruturados backend.
- [ ] Metricas e alertas.
- [ ] Auditoria de acoes administrativas.

Implementacao:
- [ ] Escolher ferramenta de erros frontend, como Sentry ou equivalente.
- [ ] Instrumentar backend com logs JSON e `requestId`.
- [ ] Adicionar metricas de latencia, taxa de erro e throughput por endpoint.
- [ ] Criar alertas para 5xx, falha de OAuth, aumento de spam e API indisponivel.
- [ ] Medir Core Web Vitals no ambiente real.
- [ ] Registrar eventos editoriais relevantes: post criado, publicado, arquivado e comentario moderado.
- [ ] Definir politica de retencao e redacao de PII.
- [ ] Criar auditoria de acoes administrativas com ator, acao, alvo e data.
- [ ] Criar runbook para incidente de seguranca e indisponibilidade.

Arquivos provaveis:
- [ ] `docs/observability.md`
- [ ] `docs/runbook.md`
- [ ] `apps/api/observability/`
- [ ] `src/layouts/Base.astro`

Pronto quando:
- [ ] Erros relevantes geram sinal acionavel.
- [ ] Acoes administrativas sensiveis sao auditaveis.
- [ ] Logs nao expõem PII sem necessidade.

### Milestone 13 - Polimento de UX e acessibilidade

Entregas principais:
- [ ] Navegacao por teclado revisada.
- [ ] Contraste por tema validado.
- [ ] Guia de componentes.
- [ ] Layout validado em viewports estreitos.

Implementacao:
- [ ] Auditar navbar, dropdowns, comentarios, formularios e cards clicaveis por teclado.
- [ ] Garantir foco visivel em links, botoes e controles customizados.
- [ ] Revisar contraste em todos os temas, incluindo Limbo e paginas com canvas.
- [ ] Corrigir `aria-label`, `aria-expanded`, `aria-controls` e roles de interacoes em JS.
- [ ] Garantir alternativa visual e funcional para animacoes longas.
- [ ] Consolidar tokens de cor, espacamento, raio, sombra e tipografia.
- [ ] Remover cores fixas sem justificativa de componentes temaveis.
- [ ] Criar guia de componentes publicos e administrativos.
- [ ] Validar que textos, botoes e cards nao se sobrepoem em mobile.

Arquivos provaveis:
- [ ] `src/styles/tokens.css`
- [ ] `src/components/*`
- [ ] `src/pages/*`
- [ ] `docs/design-system.md`
- [ ] `docs/frontend.md`

Pronto quando:
- [ ] Fluxos principais funcionam sem mouse.
- [ ] Temas passam no contraste minimo definido.
- [ ] Componentes novos seguem o guia visual documentado.
