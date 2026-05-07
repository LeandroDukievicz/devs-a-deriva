# Devs à Deriva

**Devs à Deriva** é uma plataforma editorial tech-driven para publicar ideias sobre engenharia de software, carreira, cultura digital e experiências pessoais no meio da tecnologia. Não é um blog genérico: a proposta combina conteúdo autoral, identidade visual futurista e uma experiência de leitura imersiva, com estética cyberpunk, interações customizadas e conteúdo já sincronizado com o dashboard.

## Propósito

O projeto nasce para ser um espaço menos polido e mais honesto sobre tecnologia. Aqui cabem textos técnicos, reflexões de carreira, cultura dev, opinião, experimentos visuais e narrativas pessoais.

A diferença está na experiência: o conteúdo não vive em um template neutro. A interface faz parte da linguagem do projeto, com animações, temas, categorias visuais e interações que reforçam a ideia de estar navegando por algo vivo, estranho e deliberadamente fora da órbita comum.

## Tech Stack

- [Astro.js](https://astro.build/) como base da aplicação.
- [Tailwind CSS](https://tailwindcss.com/) para utilitários de estilo.
- CSS escopado em componentes/páginas Astro para interações visuais específicas.
- Canvas e JavaScript nativo para experiências interativas.
- Dashboard/admin separado em `dashboard-ldstudio` para posts, categorias, autores, comentários, newsletter, analytics e leitura.
- Backend e banco de dados fornecem posts publicados, dados do autor, comentários moderados, newsletter e progresso de leitura.
- [Vercel Analytics](https://vercel.com/analytics) integrado ao projeto.
- Nginx em produção com headers de segurança e CSP.
- Vitest e Playwright para testes automatizados mínimos.

## Funcionalidades

### Atual

- Home com experiência visual imersiva e cards abastecidos pelo dashboard.
- Home e categorias com paginação client-side baseada no array de posts carregado no build.
- Cards de posts com interação, progresso de leitura em tempo real e estado de conclusão.
- Categorias editoriais.
- Páginas individuais de posts com hero, metadados, imagem de capa, navegação contextual e leitura sincronizada.
- Comentários integrados ao dashboard: envio de draft, login social, moderação e exibição apenas de comentários aprovados.
- CTA de newsletter conectado ao dashboard, com validação de UX, consentimento, resposta genérica e double opt-in no backend.
- Página de manifesto com crawl scroll-driven em perspectiva.
- Sistema de temas visuais.
- Páginas de erro customizadas.
- Página inicial de login/admin.
- Links sociais do autor refletidos a partir da configuração do dashboard.
- Headers de segurança configurados no `nginx.conf`: CSP, HSTS, `nosniff`, `DENY`, `Referrer-Policy` e `Permissions-Policy`.
- Suite mínima de testes unitários para helpers de posts e smoke tests Playwright para home/post.

### Planejado

- Busca pública.
- Paginação estática por URL para SEO de longo prazo.
- RSS/Atom.
- Mais cobertura de testes para comentários, categoria e payloads XSS.
- Integrações futuras com automação e IA editorial assistiva.

## Estrutura do Projeto

```txt
devs-a-deriva/
├── public/              # Assets estáticos
├── src/
│   ├── components/      # Componentes Astro reutilizáveis
│   ├── layouts/         # Layouts base da aplicação
│   ├── lib/             # Utilitários e configurações compartilhadas
│   ├── pages/           # Rotas e páginas Astro
│   └── styles/          # Tokens e estilos globais
├── tests/               # Testes unitários e smoke tests Playwright
├── nginx.conf           # Servidor estático e headers HTTP de segurança
├── playwright.config.ts # Configuração dos smoke tests e2e
├── vitest.config.ts     # Configuração dos testes unitários
├── astro.config.mjs     # Configuração do Astro
├── tailwind.config.mjs  # Configuração do Tailwind
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
| `npm run dev` | Inicia o servidor local de desenvolvimento. |
| `npm run build` | Gera a versão estática de produção. |
| `npm run preview` | Executa um preview local do build. |
| `npm test` | Executa testes unitários com Vitest. |
| `npm run test:watch` | Executa Vitest em modo watch. |
| `npm run test:e2e` | Executa smoke tests Playwright contra `https://devsaderiva.com.br`. |

## Milestones Implementados

Revisado em 2026-05-07.

- SEO/AEO base: canonical, Open Graph, JSON-LD, sitemap, `robots.txt` e `llms.txt`.
- Comentários seguros no frontend: `Comments.astro` monta DOM com `createElement` e dados externos entram por `textContent`; o único `innerHTML` restante é SVG estático de provider/reply.
- Comentários moderados: o blog só consome `GET /api/comments?slug=...` com comentários `APPROVED`, e a UI informa que comentários passam por moderação.
- Headers de segurança no host: `nginx.conf` define CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` e `Permissions-Policy`. O CSP ainda usa `'unsafe-inline'` porque o Astro estático usa scripts inline via `is:inline`; nonce por request fica como débito técnico se houver SSR/middleware.
- Paginação na home e categorias: render inicial de 10 posts e botão de carregar mais usando o array completo já carregado no SSG.
- Testes automatizados mínimos: Vitest cobre `paginatePosts()` e `getPost()`, Playwright cobre smoke de home e abertura de post, e o CI roda `npm test` após o build.
- Integração com dashboard: posts, newsletter, comentários e progresso de leitura usam `PUBLIC_DASHBOARD_URL`.

## Status

Em desenvolvimento.

## Links

- Produção: [https://www.devsaderiva.com.br/](https://www.devsaderiva.com.br/)

## Documentação

A documentação técnica e decisões de produto devem ficar centralizadas na pasta [`/docs`](./docs).

O fluxo atual de conteúdo sai do dashboard, passa pela API e alimenta a home, as categorias, as páginas de post, comentários e cards de progresso de leitura. A newsletter dos posts também usa o dashboard como backend público por meio de `PUBLIC_DASHBOARD_URL`.
