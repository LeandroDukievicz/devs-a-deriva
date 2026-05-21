# Devs à Deriva

**Devs à Deriva** é uma plataforma editorial tech-driven para publicar ideias sobre engenharia de software, carreira, cultura digital e experiências pessoais no meio da tecnologia. A proposta combina conteúdo autoral, identidade visual futurista e uma experiência de leitura imersiva, com estética cyberpunk, interações customizadas e conteúdo sincronizado com o dashboard.

## Propósito

O projeto nasce para ser um espaço menos polido e mais honesto sobre tecnologia. Aqui cabem textos técnicos, reflexões de carreira, cultura dev, opinião, experimentos visuais e narrativas pessoais.

A diferença está na experiência: o conteúdo não vive em um template neutro. A interface faz parte da linguagem do projeto, com animações, temas, categorias visuais e interações que reforçam a ideia de estar navegando por algo vivo, estranho e deliberadamente fora da órbita comum.

## Tech Stack

- **Astro 6** em modo híbrido (estático + SSR seletivo) — páginas de listagem e posts rodam em SSR; páginas institucionais são estáticas
- **Dual adapter**: `@astrojs/vercel` na Vercel, `@astrojs/node` (standalone) no VPS — detectado automaticamente via `VERCEL=1`
- **Tailwind CSS 4** via plugin Vite (`@tailwindcss/vite`)
- CSS escopado em componentes/páginas Astro para interações visuais específicas
- Canvas e JavaScript nativo para experiências interativas
- Dashboard separado em `dashboard-ldstudio` para posts, categorias, autores, comentários, newsletter, analytics e progresso de leitura
- [Vercel Analytics](https://vercel.com/analytics) integrado
- Docker + nginx do sistema (porta 80/443) como proxy reverso no VPS — o container roda apenas Node.js standalone
- [Vitest](https://vitest.dev/) para testes unitários e [Playwright](https://playwright.dev/) para e2e
- GitHub Actions com pipeline CI/CD completo (quality → build → audit → lighthouse → deploy → smoke)

## Funcionalidades

### Implementado

- Home com experiência visual imersiva (BlackHole canvas) e cards abastecidos pelo dashboard via SSR
- Páginas individuais de post com hero, metadados, imagem de capa e navegação contextual
- Seis categorias editoriais (tech, carreira, livros, música, aleatoriedades, notícias)
- Paginação estática por URL em `/categorias/{slug}/pagina/{n}` para SEO
- Cards de posts com progresso de leitura em tempo real e estado de conclusão
- Excerpt extraído do primeiro parágrafo real do post (ignora imagens e headings em markdown)
- Busca client-side em `/busca` com índice embutido no build e suporte ao parâmetro `?q=`
- RSS feed em `/rss.xml` atualizado em cada request (SSR)
- Sitemap dinâmico em `/sitemap.xml` que reflete novos posts sem rebuild
- Comentários integrados: envio de draft, login social, moderação e exibição de aprovados
- Página de newsletter com formulário, honeypot e consentimento LGPD
- CTA de newsletter dentro de posts com validação, double opt-in e resposta de UX
- Página de manifesto com crawl scroll-driven em perspectiva
- SEO completo: canonical, Open Graph, JSON-LD, sitemap.xml dinâmico, robots.txt
- AEO/GEO: `llms.txt`, `llms-full.txt`, `/ai-index.json` e `/docs.json`
- Healthcheck em `/health.json` com versão do commit (SSR)
- Headers de segurança: CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
- Rollback automático no VPS se o smoke test pós-deploy falhar
- Deploy dual Vercel + VPS com detecção automática de adapter

### Planejado

- Analytics editorial mais completo
- Recomendações de posts relacionados
- Automação de publicação

## Arquitetura de Deploy

### VPS (produção principal)

```
Internet → nginx do sistema (porta 80/443)
              │  proxy_pass http://127.0.0.1:4321
              │  security headers (CSP, HSTS, X-Frame-Options…)
              │  rate limiting
              ▼
         Docker container (porta 4321)
              │  @astrojs/node standalone
              │  serve estáticos de dist/client/
              │  render SSR routes
              ▼
         dashboard.devsaderiva.com.br (API de posts)
```

### Vercel (CDN/serverless)

```
Internet → Vercel CDN
              │  headers de segurança via vercel.json
              │  arquivos estáticos do .vercel/output/static/
              │  SSR via funções serverless
              ▼
         dashboard.devsaderiva.com.br (API de posts)
```

## Estrutura do Projeto

```txt
devs-a-deriva/
├── .github/workflows/   # Pipeline CI/CD (ci.yml)
├── public/              # Assets estáticos, llms.txt, robots.txt
├── src/
│   ├── components/      # Componentes Astro reutilizáveis
│   ├── layouts/         # Layouts base da aplicação
│   ├── lib/             # Utilitários, dados e validações
│   ├── pages/           # Rotas Astro (SSR e estáticas)
│   └── styles/          # Tokens e estilos globais
├── scripts/             # Scripts de qualidade, deploy e rollback
├── tests/               # Testes unitários Vitest e e2e Playwright
├── docs/                # Documentação técnica e de produto
├── Dockerfile           # Build Node 22 Alpine — imagem final com Node standalone
├── docker-compose.yml   # Orquestração Docker (dev)
├── docker-compose.prod.yml # Orquestração Docker (produção)
├── lighthouserc.cjs     # Configuração Lighthouse CI
├── nginx.conf           # Nginx do sistema: proxy reverso para porta 4321
├── astro.config.mjs     # Configuração do Astro (dual adapter)
├── vercel.json          # Headers de segurança para Vercel
├── tsconfig.json        # TypeScript strict
├── vitest.config.ts     # Configuração dos testes unitários
├── playwright.config.ts # Configuração dos testes e2e
└── package.json         # Scripts e dependências
```

## Começando

Clone o repositório e instale as dependências:

```bash
npm install
```

Rode o servidor de desenvolvimento (usa `@astrojs/node`, sem `VERCEL=1`):

```bash
npm run dev
```

O blog busca posts de `http://localhost:3000`. Se o dashboard não estiver rodando, `isApiOffline()` retorna `true` e o blog exibe estado offline.

Gere o build de produção:

```bash
npm run build          # adapter node (VPS)
VERCEL=1 npm run build # adapter vercel
```

Visualize o build localmente:

```bash
npm run preview
```

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor local de desenvolvimento. |
| `npm run build` | Build com adapter node (padrão VPS/local). |
| `VERCEL=1 npm run build` | Build com adapter Vercel. |
| `npm run preview` | Preview local do build. |
| `npm run lint` | Verifica conflitos Git, CRLF e newlines. |
| `npm run typecheck` | Typecheck via `astro check`. |
| `npm run validate:content` | Valida frontmatter de markdown local. |
| `npm run check:seo` | Valida SEO técnico no `dist/` após o build. |
| `npm run check:links` | Verifica links internos quebrados no `dist/`. |
| `npm run check:security` | Auditoria de dependências e scan de segredos. |
| `npm run ci:check` | Suite completa pré-build (lint + typecheck + validate + test). |
| `npm test` | Testes unitários com Vitest. |
| `npm run test:watch` | Vitest em modo watch. |
| `npm run test:e2e` | Testes e2e Playwright (roda localmente). |
| `npm run test:ci` | Suite completa CI (ci:check + e2e + security). |
| `npm run lighthouse` | Lighthouse CI contra o `dist/` estático. |
| `BASE_URL=https://... npm run smoke:test` | Smoke test contra ambiente publicado. |

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `PUBLIC_DASHBOARD_URL` | Sim | URL do dashboard (`https://dashboard.devsaderiva.com.br`) |

Em desenvolvimento local, o padrão é `http://localhost:3000`.

## Pipeline CI/CD

O pipeline roda no GitHub Actions e segue a sequência:

```
quality → build → audit + lighthouse → deploy → smoke
```

- **quality:** lint, typecheck, validação de conteúdo, testes unitários, Gitleaks
- **build:** `astro build` e upload do artefato `dist/`
- **audit:** SEO, links internos, segurança (paralelo com lighthouse)
- **lighthouse:** Lighthouse CI bloqueante — performance ≥ 0.80, a11y ≥ 0.90, SEO ≥ 0.90
- **deploy:** apenas em push na `main`, via SSH no VPS com Docker Compose
- **smoke:** valida rotas públicas e `/health.json` após deploy; rollback automático se falhar

Pull requests rodam quality + build + audit + lighthouse, mas **nunca fazem deploy**.

Secrets necessários no GitHub: `VPS_HOST`, `VPS_USER`, `SSH_PRIVATE_KEY`, `PUBLIC_SITE_URL` (opcional).

Documentação completa do pipeline em [`docs/ci-cd.md`](./docs/ci-cd.md).

## Status

Em produção ativo em [devsaderiva.com.br](https://www.devsaderiva.com.br/).

## Links

- Produção: [https://www.devsaderiva.com.br/](https://www.devsaderiva.com.br/)
- Documentação técnica: [`/docs`](./docs)
