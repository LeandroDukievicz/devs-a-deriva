# Arquitetura

## Visão de Alto Nível

O projeto é estruturado como uma aplicação Astro em modo híbrido (estático + SSR seletivo), focada em performance, renderização eficiente e forte controle visual. A arquitetura separa a camada pública do blog, o painel administrativo em `dashboard-ldstudio` e a camada de dados em PostgreSQL/Prisma.

## Camadas do Sistema

### Frontend Público

Responsável pela experiência de leitura e navegação:

- home (SSR — lista de posts sempre atualizada);
- páginas de categorias (SSR — paginação em tempo real);
- páginas de posts (SSR — novo post aparece sem rebuild);
- manifesto, devs, termos, privacidade (estáticas);
- componentes visuais e interativos.

Astro é a base ideal para essa camada por permitir modo híbrido — páginas que mudam com frequência rodam em SSR, o restante é estático puro — e por ter baixo JavaScript por padrão.

### Dashboard/Admin

O painel administrativo é uma aplicação Next.js separada (`dashboard-ldstudio`) responsável por gerenciar o conteúdo editorial e os fluxos públicos dinâmicos:

- criar, editar, publicar e despublicar posts;
- gerenciar categorias e autores;
- revisar e moderar comentários;
- gerenciar newsletter e colaboradores;
- acompanhar métricas editoriais e progresso de leitura.

### Backend

O backend fica no dashboard e é responsável por persistência, autenticação, autorização e regras de publicação. Ele usa:

- Next.js App Router e Route Handlers;
- Prisma;
- PostgreSQL;
- NextAuth v5;
- nginx no sistema como proxy reverso.

## Modo de Renderização

O blog usa **modo híbrido** — a distinção é feita por página via `export const prerender`:

| Página | Modo | Por quê |
|---|---|---|
| `index.astro` | SSR | Lista de posts sempre atualizada |
| `page/[n].astro` | SSR | Paginação real da home para SEO |
| `api/posts.json.ts` | SSR | Lotes JSON para infinite scroll e categorias |
| `posts/[slug].astro` | SSR | Novo post aparece sem rebuild |
| `categorias/[categoria]/pagina/[n].astro` | SSR | Paginação em tempo real |
| `busca.astro` | SSR | Índice de busca sempre fresco |
| `rss.xml.ts` | SSR | Feed RSS atualizado sem rebuild |
| `sitemap.xml.ts` | SSR | Sitemap reflete novos posts |
| `ai-index.json.ts` | SSR | Índice para bots atualizado |
| `health.json.ts` | SSR | Versão do commit em runtime |
| `categorias/[categoria].astro` | Estático | Baseado na constante `CATEGORIES` |
| Demais páginas | Estático | Conteúdo fixo |

**Resultado:** publicar um post novo faz ele aparecer em **até 30 segundos**, sem rebuild, graças ao cache em memória com TTL de 30s em `src/lib/posts.ts`.

## Seleção de Adapter

`astro.config.mjs` detecta o ambiente via variável de ambiente:

```js
const isVercel = process.env.VERCEL === '1';
adapter: isVercel ? vercel() : node({ mode: 'standalone' })
```

| Ambiente | Adapter | Como identificar |
|---|---|---|
| Vercel (produção/preview) | `@astrojs/vercel` | `VERCEL=1` setado automaticamente |
| VPS Docker | `@astrojs/node` standalone | variável ausente |
| CI / local | `@astrojs/node` standalone | variável ausente |

## Fluxo de Dados

```txt
Autor cria post no dashboard
        ↓
Dashboard valida e persiste no PostgreSQL
        ↓
Blog consulta PUBLIC_DASHBOARD_URL/api/posts em runtime (SSR)
        ↓
Cache em memória TTL 30s — evita chamadas desnecessárias
        ↓
Blog renderiza e serve ao visitante
```

## Listagem de Posts

A home usa um modelo híbrido:

- `/` renderiza somente os 5 posts publicados mais recentes no HTML inicial;
- o cliente usa `IntersectionObserver` sobre um sentinel no fim da lista;
- cada interseção busca `/api/posts.json?page=N&limit=5` e anexa mais 5 cards;
- o botão fallback `CARREGAR MAIS POSTS` chama a mesma função, fica `disabled` durante o carregamento e funciona por teclado;
- quando acaba, o botão e o link de próxima página somem e a mensagem final é exibida;
- `/page/2`, `/page/3` etc. continuam existindo como HTML real com `canonical`, `rel=prev/next` e navegação tradicional.

A montagem de cards/payloads é compartilhada em `src/lib/post-listing.ts`, que centraliza `HOME_POSTS_PER_PAGE`, `CATEGORY_POSTS_PER_PAGE`, fallback de imagens, `sectionId`, `href` e serialização JSON.

Interações públicas (comentários, progresso, newsletter) seguem o fluxo inverso:

```txt
Visitante interage no blog
        ↓
Blog chama endpoint público no dashboard
        ↓
Dashboard valida, aplica rate limit e persiste no PostgreSQL
        ↓
Blog recebe resposta pública mínima
```

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

O **nginx do sistema** (fora do Docker) aplica headers de segurança e rate limiting para todas as respostas. O **container Docker** roda apenas o servidor Node.js standalone — não há nginx dentro do container.

Health check: `http://localhost:4321/health.json` (diretamente no Node, sem nginx).

### Vercel (CDN/serverless)

```
Internet → Vercel CDN
              │  headers de segurança via vercel.json
              │  arquivos estáticos do .vercel/output/static/
              │  SSR via funções serverless
              ▼
         dashboard.devsaderiva.com.br (API de posts)
```

Headers configurados em `vercel.json`. A detecção é automática: Vercel seta `VERCEL=1` no build.

## Escalabilidade

O projeto preserva:

- baixo acoplamento entre UI e fonte de dados;
- conteúdo modelado de forma explícita em `src/types/blog.ts`;
- componentes reutilizáveis sem excesso de abstração;
- páginas públicas rápidas mesmo com aumento de posts (cache TTL 30s);
- paginação por URL (`/categorias/[slug]/pagina/[n]`) para SEO de longo prazo;
- separação clara entre experiência visual e regras editoriais.

## Decisões Importantes

- Astro permanece como camada pública principal.
- JavaScript no cliente é usado apenas quando a interação exige.
- Conteúdo principal vem do dashboard via API; mocks/hardcoded existem apenas como fallback visual ou conteúdo institucional.
- O dashboard não contamina a complexidade da experiência pública.
- A CSP enforced ainda usa `'unsafe-inline'` em `script-src` porque o blog usa scripts inline gerados pelo Astro `is:inline`. Uma CSP paralela em `Content-Security-Policy-Report-Only` testa `script-src 'self'` e envia violações para `/api/csp-report` antes do endurecimento definitivo.
- Testes mínimos de helpers e smoke e2e fazem parte do baseline de CI.
