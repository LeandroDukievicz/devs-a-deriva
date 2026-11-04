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
- exibir todos os posts em carrossel aleatório e seis artigos cronológicos por página;
- mostrar o vídeo de abertura uma vez por dia em telas com pelo menos 600 × 600 CSS px;
- abrir a home diretamente em telas menores, com movimento reduzido ou quando a reprodução falhar;
- preservar impacto visual sem comprometer navegação.

`DailyVideoIntro.astro` cobre visualmente a home enquanto o vídeo toca; os posts continuam em SSR por baixo e são revelados ao terminar ou ao pular a abertura. O MP4 só recebe `src` quando a abertura está elegível, e o arquivo versionado é armazenado em cache por um ano.

### Categorias

**`categorias/[categoria].astro`** — SSR, alimentado pelas categorias e posts do dashboard.

**`categorias/[categoria]/pagina/[n].astro`** — SSR, paginação em tempo real. Cada URL (`/categorias/tech/pagina/2`) retorna posts filtrados do dashboard sem rebuild.

As categorias são carregadas do dashboard e podem ser criadas ou removidas sem alterar o blog. Páginas sem posts exibem um estado vazio, sem carrossel.

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
| `BlackHole.astro` | Animação canvas contínua do buraco negro na home |
| `DailyVideoIntro.astro` | Abertura diária em vídeo, com controle para pular e fallback de reprodução |
| `StarBackground.astro` | Fundo estrelado animado |
| `CategoriaPage.astro` | Layout de listagem por categoria |
| `Newsletter.astro` | Formulário de newsletter reutilizável |
| `Comments.astro` | Exibição e envio de comentários |
| `ThemeProvider.astro` | Controle de tema (Órbita Baixa, Espaço Profundo, Limbo) |
| `ErrorPage.astro` | Layout para páginas de erro (404, 500) |
| `PwaInstall.astro` | Registra o service worker em produção e oferece o convite de instalação do app |

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

Além do `status=PUBLISHED`, `fetchPosts()` filtra posts com `publishedAt` futuro para evitar exposição de posts agendados caso a API retorne algum item indevidamente.

`src/lib/posts.ts` é o adapter do blog para a API pública. Normaliza autor, categoria, HTML renderizado e fornece helpers como `getPost()`, `getPostsByCategory()`, `paginatePosts()` e `searchPosts()`.

`src/lib/post-listing.ts` concentra helpers específicos de listagem: seis posts por página na home e nas categorias, fallback de capa, `sectionId`, links de card e payload de `/api/posts.json`.

## Home e arquivo paginado

`PostCarousel.astro` exibe todos os artigos publicados em ordem aleatória, com dois cards horizontais no desktop e um em telas menores. O primeiro embaralhamento ocorre no servidor e cada volta gera outra ordem; a coleção cronológica original permanece intacta. O avanço automático ocorre a cada seis segundos, com pausa por hover, foco, aba oculta ou saída da viewport. Movimento reduzido começa pausado. Há controles de anterior, próximo, pausa, teclado e gesto horizontal. Slides fora de exibição usam `inert` e `aria-hidden`; sem JavaScript a faixa continua rolável.

`PostFeed.astro` renderiza seis artigos do mais recente ao mais antigo, em três, duas ou uma coluna. `PostPagination.astro` oferece links reais, anterior/próxima, estado ativo e controles desabilitados nas extremidades. Home, arquivo e categorias compartilham esses componentes. A primeira página de cada categoria também mostra o carrossel com todos os artigos daquela categoria. A API de posts permanece disponível.

`PostCard.astro` mostra capa, categoria, título, resumo, autor, data e progresso de leitura. A ação de lançar ao limbo continua disponível. `SiteFooter.astro` apresenta Explore, categorias com contagens publicadas e links institucionais.

## PDF por artigo

`PostPdfDownload.astro` oferece download com feedback de geração, sucesso e erro, preservando o artigo aberto. Sem JavaScript, seu link funciona diretamente. `/posts/[slug]/pdf` gera PDF no servidor com pdfmake e fontes Unicode em memória: texto selecionável, formatação, links, listas, capa e imagens, metadados e paginação. Recursos visuais do site, comentários e newsletter ficam fora do arquivo. A rota usa apenas posts publicados e retorna anexo com `X-Robots-Tag: noindex`.

Imagens são carregadas apenas de hosts aprovados, sem redirects, com timeout e limite de bytes/pixels. Sharp converte formatos como WebP. A geração continua caso uma imagem falhe. A biblioteca de PDF não entra no JavaScript entregue ao leitor.

## PWA — app instalável

O blog pode ser instalado na tela inicial como aplicativo. As três peças ficam em `public/`, fora do pipeline do Vite, e por isso valem igual na Vercel e no VPS sem etapa extra de build:

- `manifest.webmanifest` — nome, `short_name`, escopo `/`, `display: standalone`, cores do tema, ícones `any` e `maskable` (192 e 512) e atalhos para busca, Tech e manifesto;
- `sw.js` — service worker com cache em runtime, sem manifesto de precache gerado no build;
- `offline.html` — fallback de navegação sem rede, com CSS inline e sem JavaScript, para não depender de bundle com hash nem de hash de CSP.

`PwaInstall.astro` registra o worker apenas quando `import.meta.env.PROD` é verdadeiro: em desenvolvimento o cache conflitaria com o HMR do Vite. Para testar o comportamento completo, use `npm run build` seguido de `npm run preview`.

### Convite de instalação

O componente segura o evento `beforeinstallprompt` e só revela o banner quando nada mais disputa a tela: a intro diária da home precisa ter terminado e o aviso de cookies precisa ter sido aceito. O convite não aparece se o app já estiver rodando em modo standalone nem se a pessoa já tiver dispensado — a escolha fica em `dda-pwa-dismissed-v1`. No iOS o Safari não dispara o evento, então o banner troca o botão pela instrução de usar Compartilhar → Adicionar à Tela de Início.

No desktop o convite fica no canto inferior esquerdo; abaixo de 768px ocupa a largura da tela em duas linhas, e abaixo de 480px sobe para não encostar no atalho de admin.

### Estratégias de cache

| Requisição | Estratégia | Motivo |
|---|---|---|
| Navegação (HTML) | network-first | O HTML vem do SSR e precisa estar fresco; sem rede cai na última versão vista e depois em `/offline.html` |
| `/_astro/*` | cache-first | Os nomes carregam hash, o conteúdo nunca muda |
| Imagens e fontes | stale-while-revalidate | Resposta instantânea com atualização em segundo plano |
| Demais requisições | direto pra rede | Sem interceptação |

Ficam fora do cache `/api/`, `/admin/`, `/sw.js`, `/health.json`, `/ai-index.json`, `/sitemap.xml`, `/rss.xml` e `/posts/*/pdf`, além de tudo que não é GET, vem de outra origem, tem destino de vídeo/áudio ou traz header `Range` — cachear resposta parcial (206) quebraria o player da abertura.

Os caches de páginas e imagens têm teto de 40 e 60 entradas e descartam as mais antigas. Respostas acima de 3 MB ou com status diferente de 200 não entram. Ao alterar a lógica do worker é preciso subir `CACHE_VERSION`: o `activate` apaga todo cache `dda-` que não pertença à versão corrente.

### Ícones e CSP

`npm run icons:pwa` regera `public/icons/` a partir de `public/helmet.svg` via Sharp. Os ícones `maskable` recebem margem porque o Android recorta o ícone em círculo ou squircle e só garante o círculo interno de 80%. A saída é versionada no repositório; o build não executa o script.

A CSP de `nginx.conf` e `vercel.json` traz `worker-src 'self'` e `manifest-src 'self'`, posicionados depois de `script-src` porque `scripts/update-csp-hashes.mjs` reescreve exatamente aquele trecho no postbuild. Tanto o Node standalone quanto a Vercel servem `/sw.js` e o manifesto com revalidação obrigatória, e o registro usa `updateViaCache: 'none'` para nunca ficar preso numa versão velha do worker.

## Testes

Vitest cobre os helpers existentes, embaralhamento sem mutação e geração/rota de PDFs. O `sw.js` é avaliado dentro de um runtime de service worker falso (`tests/service-worker.test.ts`), o que exercita install, activate, as estratégias de cache e os tetos de entradas sem navegador. Playwright cobre desktop e mobile, carrossel completo, pausa automática, teclado, movimento reduzido, grade, paginação sem duplicados, rodapé e contagens, download e erro de PDF, os fluxos anteriores de posts, categorias, comentários e newsletter, e os artefatos do PWA (manifesto, ícones, headers do worker e página offline).

Por padrão, os testes usam dashboard de fixtures (porta 3001) e Astro (4322), sem dados reais. A suíte é requisito de deploy no CI. `PLAYWRIGHT_BASE_URL` seleciona explicitamente outro ambiente.

## Fallback de API

Quando o dashboard está indisponível no momento do build ou request, `isApiOffline()` retorna `true` e as páginas exibem estado offline. Não há crash — o blog degrada de forma controlada.

## Fallback de Capa

Posts sem capa seguem a prioridade:

1. capa específica do post (`thumbUrl`);
2. imagem padrão da categoria;
3. imagem institucional do projeto;
4. placeholder visual consistente com o tema.
