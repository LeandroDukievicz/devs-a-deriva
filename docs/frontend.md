# Frontend

## Base do Projeto

O frontend é construído com Astro 6 em modo híbrido (estático + SSR seletivo). A aplicação usa páginas `.astro`, componentes reutilizáveis, CSS escopado por página/componente e Tailwind CSS disponível para utilitários.

O adapter é selecionado automaticamente: `@astrojs/vercel` quando `VERCEL=1`, `@astrojs/node` (standalone) nos demais ambientes.

## Estrutura Principal

```txt
src/
├── components/   # Componentes reutilizáveis
├── layouts/      # Layouts base da aplicação
├── lib/          # Utilitários, cache e adaptadores de API
├── pages/        # Rotas da aplicação (SSR e estáticas)
├── styles/       # Tokens e estilos globais
└── types/        # Tipos TypeScript compartilhados
```

## Páginas

### Home (`index.astro`) — SSR

Apresenta a identidade visual principal, com experiência imersiva (BlackHole canvas) e cards editoriais abastecidos pelo dashboard em runtime.

Responsabilidades:

- buscar posts da API com cache TTL 30s via `fetchPosts()`;
- renderizar cards com progresso de leitura em tempo real;
- direcionar o usuário para o conteúdo completo;
- carregar mais posts via JS client-side a partir do array já carregado;
- preservar impacto visual sem comprometer navegação.

### Categorias

**`categorias/[categoria].astro`** — estático, gerado a partir da constante `CATEGORIES`.

**`categorias/[categoria]/pagina/[n].astro`** — SSR, paginação em tempo real. Cada URL (`/categorias/tech/pagina/2`) retorna posts filtrados do dashboard sem rebuild.

Categorias atuais:

- tech, carreira, livros, música, aleatoriedades, notícias.

### Posts (`posts/[slug].astro`) — SSR

Página individual de post, renderizada em runtime.

Responsabilidades:

- renderizar título, resumo, autor, tempo de leitura e imagem de capa;
- exibir o corpo do post em HTML sanitizado gerado por `markdownToHtml()`;
- CTA de newsletter conectado ao backend via `PUBLIC_DASHBOARD_URL`;
- carregar comentários aprovados via `GET /api/comments?slug=...`;
- enviar draft de comentário para `POST /api/comments/draft`;
- manter consistência responsiva entre header, corpo, newsletter e footer.

### Busca (`busca.astro`) — SSR

Busca client-side sobre todos os posts publicados.

O índice é construído em runtime pelo SSR e embutido na página como JSON. A busca ocorre inteiramente no browser, sem chamadas adicionais à API.

Campos pesquisados: título, resumo, categoria e nome do autor.

Suporta o parâmetro `?q=` para pré-preencher o campo de busca.

### Manifesto (`manifesto.astro`) — estático

Página editorial especial com texto em perspectiva e movimento controlado por scroll. Reforça a identidade do projeto.

### Devs (`devs.astro`) — estático

Página institucional sobre a equipe/autores.

### Newsletter (`newsletter.astro`) — estático

Formulário de inscrição com honeypot e consentimento LGPD. O backend do dashboard é responsável por validação, deduplicação e double opt-in.

### Endpoints de dados

| Rota | Modo | Descrição |
|---|---|---|
| `/rss.xml` | SSR | Feed RSS atualizado sem rebuild, com cache compartilhado de 1h |
| `/sitemap.xml` | SSR | Sitemap que reflete novos posts |
| `/ai-index.json` | SSR | Índice para bots e crawlers de IA |
| `/health.json` | SSR | Healthcheck com versão do commit |

### Páginas institucionais (estáticas)

`termos.astro`, `privacidade.astro`, `exclusao-de-dados.astro`, `data-deletion.astro`, `admin/login.astro`

### Páginas de erro

`404.astro`, `500.astro` — usam o componente `ErrorPage`.

## Componentes

| Componente | Responsabilidade |
|---|---|
| `PostCard.astro` | Card de post com autor, progresso de leitura, ações sociais e excerpt |
| `SocialIcon.astro` | Ícone de rede social como botão circular estilizado |
| `Navbar.astro` | Navegação principal com tema |
| `BlackHole.astro` | Animação canvas do buraco negro na home |
| `StarBackground.astro` | Fundo estrelado animado |
| `CategoriaPage.astro` | Layout de listagem por categoria |
| `Newsletter.astro` | Formulário de newsletter reutilizável |
| `Comments.astro` | Exibição e envio de comentários |
| `ThemeProvider.astro` | Controle de tema (Órbita Baixa, Espaço Profundo, Limbo) |
| `ErrorPage.astro` | Layout para páginas de erro (404, 500) |

## Layouts

| Layout | Uso |
|---|---|
| `Base.astro` | Esqueleto global com HTML, meta padrão, slots de head, tema, Navbar, Analytics, rodapé e controles globais |
| `PageLayout.astro` | Wrapper genérico para páginas sem SEO estrutural próprio, com opção de fundo estrelado |
| `PostLayout.astro` | Layout de posts; aplica OG article e JSON-LD `Article` |
| `CategoryLayout.astro` | Layout de categorias; aplica metadados da categoria, fundo estrelado e JSON-LD `BreadcrumbList` |
| `LegalLayout.astro` | Layout simplificado para páginas legais, herdando `PageLayout` |

## Lib

| Arquivo | Responsabilidade |
|---|---|
| `posts.ts` | Fetch, cache (TTL 30s), normalização e helpers de posts |
| `categories.ts` | Constante `CATEGORIES` com slugs, labels e hashtags |
| `newsletter-email.ts` | Helpers de envio de newsletter |
| `reading-progress-client.ts` | Lógica client-side de progresso de leitura |
| `utils/string.ts` | `escapeHtml`, `slugText` e utilitários de string |

### Cache em `posts.ts`

`fetchPosts()` usa cache em memória com TTL de 30 segundos em produção:

```ts
const CACHE_TTL_MS = 30_000;
if (_cache && import.meta.env.PROD && now - _cacheTime < CACHE_TTL_MS) return _cache;
```

Em desenvolvimento o cache é desabilitado — dados sempre frescos.

### Excerpt

O excerpt de cada post é extraído do **primeiro parágrafo de texto real** do conteúdo — headings, imagens e separadores são pulados. Limitado a 360 caracteres. No card, exibido com `line-clamp: 5`.

## Estilo

O projeto usa duas abordagens:

- Tailwind CSS para utilitários de layout, espaçamento e composição;
- CSS escopado em Astro para interações específicas, animações e estilos complexos.

Tokens globais de tema vivem em `src/styles/tokens.css` e devem ser preferidos em vez de cores fixas.

Estilos de componentes Astro têm escopo automático — classes definidas em `ComponentePai.astro` não atingem elementos dentro de `ComponenteFilho.astro`. Cada componente deve definir seus próprios estilos.

## Renderização de Conteúdo

Posts vêm do dashboard via `src/lib/posts.ts`, que consulta `PUBLIC_DASHBOARD_URL/api/posts?status=PUBLISHED` em runtime. O markdown do post é convertido para HTML sanitizado por `markdownToHtml()` antes de ser servido.

`src/lib/posts.ts` é o adapter do blog para a API pública. Normaliza autor, categoria, HTML renderizado e fornece helpers como `getPost()`, `getPostsByCategory()`, `paginatePosts()` e `searchPosts()`.

## Testes

O baseline atual inclui:

- Vitest para helpers de posts (`paginatePosts()`, `getPost()`, `searchPosts()`);
- Playwright para smoke tests de home e página de post;
- CI executando `npm test` depois do build.

## Fallback de API

Quando o dashboard está indisponível no momento do build ou request, `isApiOffline()` retorna `true` e as páginas exibem estado offline. Não há crash — o blog degrada de forma controlada.

## Fallback de Capa

Posts sem capa seguem a prioridade:

1. capa específica do post (`thumbUrl`);
2. imagem padrão da categoria;
3. imagem institucional do projeto;
4. placeholder visual consistente com o tema.
