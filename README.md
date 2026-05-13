# Devs à Deriva

**Devs à Deriva** é uma plataforma editorial tech-driven para publicar ideias sobre engenharia de software, carreira, cultura digital e experiências pessoais no meio da tecnologia. Não é um blog genérico: a proposta combina conteúdo autoral, identidade visual futurista e uma experiência de leitura imersiva, com estética cyberpunk, interações customizadas e conteúdo sincronizado com o dashboard.

## Propósito

O projeto nasce para ser um espaço menos polido e mais honesto sobre tecnologia. Aqui cabem textos técnicos, reflexões de carreira, cultura dev, opinião, experimentos visuais e narrativas pessoais.

A diferença está na experiência: o conteúdo não vive em um template neutro. A interface faz parte da linguagem do projeto, com animações, temas, categorias visuais e interações que reforçam a ideia de estar navegando por algo vivo, estranho e deliberadamente fora da órbita comum.

## Tech Stack

- [Astro.js](https://astro.build/) v6 como base — SSG com saída estática
- [Tailwind CSS](https://tailwindcss.com/) v4 via plugin Vite (`@tailwindcss/vite`)
- CSS escopado em componentes/páginas Astro para interações visuais específicas
- Canvas e JavaScript nativo para experiências interativas
- Dashboard separado em `dashboard-ldstudio` para posts, categorias, autores, comentários, newsletter, analytics e leitura
- [Vercel Analytics](https://vercel.com/analytics) integrado
- Docker + Nginx em produção com headers de segurança, CSP e cache de assets
- [Vitest](https://vitest.dev/) para testes unitários e [Playwright](https://playwright.dev/) para e2e
- GitHub Actions com pipeline CI/CD completo (quality → build → audit → lighthouse → deploy → smoke)

## Funcionalidades

### Implementado

- Home com experiência visual imersiva (BlackHole canvas) e cards abastecidos pelo dashboard
- Paginação estática por URL em `/categorias/{slug}/pagina/{n}` para SEO
- Cards de posts com progresso de leitura em tempo real e estado de conclusão
- Seis categorias editoriais (tech, carreira, livros, música, aleatoriedades, notícias)
- Páginas individuais de post com hero, metadados, imagem de capa e navegação contextual
- Comentários integrados: envio de draft, login social, moderação e exibição de aprovados
- Página de newsletter com formulário, honeypot e consentimento LGPD
- CTA de newsletter dentro de posts com validação, double opt-in e resposta de UX
- Página de manifesto com crawl scroll-driven em perspectiva
- SEO completo: canonical, Open Graph, JSON-LD, sitemap.xml dinâmico, robots.txt
- AEO/GEO: `llms.txt`, `llms-full.txt`, `/ai-index.json` e `/docs.json`
- Healthcheck estático em `/health.json` com versão do commit
- Headers de segurança: CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
- Rollback automático no VPS se o smoke test pós-deploy falhar

### Planejado

- Busca pública
- RSS/Atom
- Releases versionadas com symlink para rollback zero-downtime
- Integrações futuras com automação e IA editorial assistiva

## Estrutura do Projeto

```txt
devs-a-deriva/
├── .github/workflows/   # Pipeline CI/CD (ci.yml)
├── public/              # Assets estáticos, llms.txt, robots.txt
├── src/
│   ├── components/      # Componentes Astro reutilizáveis
│   ├── layouts/         # Layout base da aplicação
│   ├── lib/             # Utilitários, dados e validações
│   ├── pages/           # Rotas Astro (+ health.json, sitemap.xml, newsletter)
│   └── styles/          # Tokens e estilos globais
├── scripts/             # Scripts de qualidade, deploy e rollback
├── tests/               # Testes unitários Vitest e e2e Playwright
├── docs/                # Documentação técnica e de produto
├── Dockerfile           # Build Node 22 Alpine + Nginx
├── docker-compose.yml   # Orquestração Docker
├── lighthouserc.cjs     # Configuração Lighthouse CI
├── nginx.conf           # Servidor estático com try_files e cache
├── astro.config.mjs     # Configuração do Astro
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

Rode o servidor de desenvolvimento:

```bash
npm run dev
```

Gere o build de produção:

```bash
npm run build
```

Visualize o build localmente:

```bash
npm run preview
```

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor local de desenvolvimento. |
| `npm run build` | Gera a versão estática de produção. |
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
| `npm run lighthouse` | Lighthouse CI contra o `dist/` estático. |
| `BASE_URL=https://... npm run smoke:test` | Smoke test contra ambiente publicado. |

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

Em desenvolvimento ativo.

## Links

- Produção: [https://www.devsaderiva.com.br/](https://www.devsaderiva.com.br/)
- Documentação técnica: [`/docs`](./docs)
