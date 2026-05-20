# devs-a-deriva — Blog

Site do blog Devs à Deriva em Astro 6, deployado na Vercel.

## Stack

- **Astro 6** com adaptador `@astrojs/vercel`
- **Tailwind CSS 4** via plugin Vite
- **TypeScript** strict
- Conteúdo (posts, categorias) servido pelo **dashboard-ldstudio** via API REST

## Arquitetura de renderização

O blog usa **modo estático com SSR seletivo**. A distinção é feita por página:

| Página | Modo | Por quê |
|---|---|---|
| `index.astro` | SSR (`prerender = false`) | Lista de posts deve estar sempre atualizada |
| `posts/[slug].astro` | SSR (`prerender = false`) | Novo post aparece sem rebuild |
| `categorias/[categoria]/pagina/[n].astro` | SSR | Paginação reflete posts em tempo real |
| `busca.astro` | SSR | Index de busca sempre fresco |
| `rss.xml.ts` | SSR | Feed RSS atualizado sem rebuild |
| `sitemap.xml.ts` | SSR | Sitemap reflete novos posts |
| `ai-index.json.ts` | SSR | Index para bots atualizado |
| `categorias/[categoria].astro` | Estático | Baseado na constante `CATEGORIES`, sem API |
| Demais páginas | Estático | Conteúdo fixo (manifesto, privacidade…) |

**Resultado:** publicar um novo post no dashboard faz ele aparecer no blog em **até 30 segundos**, sem nenhum rebuild da Vercel.

## Cache em `src/lib/posts.ts`

`fetchPosts()` usa um cache em memória com TTL de **30 segundos** em produção:

```ts
const CACHE_TTL_MS = 30_000;
if (_cache && import.meta.env.PROD && now - _cacheTime < CACHE_TTL_MS) return _cache;
```

- Evita chamar a API do dashboard a cada requisição
- Posts novos aparecem no blog dentro do TTL
- Se a API do dashboard falhar, retorna o cache anterior (fallback gracioso)

Em desenvolvimento (`import.meta.env.PROD = false`) o cache não é usado — dados sempre frescos.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `PUBLIC_DASHBOARD_URL` | Sim | URL do dashboard (`https://dashboard.devsaderiva.com.br`) |

Em desenvolvimento local, o padrão é `http://localhost:3000`.

## Fluxo de deploy

```
Post publicado no dashboard
        │
        ▼
  Dashboard salva no banco
  (opcional) dispara BLOG_DEPLOY_HOOK_URL
        │
        ▼
  Vercel recebe hook → rebuild completo (~5 min)
  OU
  Próxima requisição ao blog → SSR busca da API → 30s max
```

Com SSR ativo, o **rebuild é opcional**. Posts aparecem no próximo acesso após o TTL de 30s. O deploy hook ainda é útil para:
- Forçar rebuild quando há mudanças no código do blog
- Garantir que o cache da CDN da Vercel seja limpo

## Desenvolvimento local

```bash
npm install
npm run dev
```

O blog em desenvolvimento busca posts de `http://localhost:3000` (dashboard rodando localmente). Se o dashboard não estiver rodando, `isApiOffline()` retorna `true` e o blog exibe o estado offline.

## Comandos

```bash
npm run dev          # servidor de desenvolvimento
npm run build        # build de produção
npm run typecheck    # verificação de tipos (astro check)
npm run lint         # linting
npm test             # testes unitários (vitest)
npm run test:e2e     # testes E2E (playwright)
```
