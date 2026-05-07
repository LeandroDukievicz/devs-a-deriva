# Frontend

## Base do Projeto

O frontend é construído com Astro.js. A aplicação usa páginas `.astro`, componentes reutilizáveis, CSS escopado por página/componente e Tailwind CSS disponível para utilitários.

## Estrutura Principal

```txt
src/
├── components/   # Componentes reutilizáveis
├── layouts/      # Layouts globais
├── lib/          # Configurações e utilitários
├── pages/        # Rotas da aplicação
└── styles/       # Tokens e estilos globais
```

## Páginas

### Home

A home apresenta a identidade visual principal do projeto, com experiência imersiva, cards editoriais e interações customizadas.

Responsabilidades:

- exibir chamadas de posts;
- apresentar progresso de leitura quando disponível;
- direcionar o usuário para o conteúdo completo;
- renderizar os primeiros 10 posts no build;
- carregar mais posts no cliente a partir do array completo já carregado por `fetchPosts()`;
- preservar impacto visual sem comprometer navegação.

### Categorias

As páginas de categoria organizam conteúdos por tema editorial.

Cada categoria renderiza os primeiros 10 posts estaticamente e usa botão "Carregar mais" para revelar novos cards no cliente. A abordagem atual preserva o site estático e evita depender de paginação server-side no Astro. Para SEO de longo prazo, a próxima evolução recomendada é gerar páginas estáticas por índice, como `/categorias/[slug]/pagina/[n]`.

Categorias atuais ou previstas:

- Aleatoriedades;
- Carreira;
- Livros;
- Música;
- Notícias;
- Tech.

### Manifesto

Página editorial especial, com texto em perspectiva e movimento controlado por scroll. Não é uma página utilitária: ela reforça a identidade do projeto.

### Admin/Login

Página inicial de acesso ao dashboard externo. A operação administrativa real vive em `dashboard-ldstudio`.

### Posts

As páginas individuais de posts já existem em `src/pages/posts/[slug].astro` com geração estática a partir de `src/lib/posts.ts`.

Responsabilidades:

- renderizar título, resumo, autor, tempo de leitura e imagem principal;
- exibir o corpo do post com foco em leitura;
- adaptar links de retorno e CTA final de acordo com a origem da navegação;
- apresentar CTA de newsletter conectado ao backend publico via `PUBLIC_DASHBOARD_URL`, com validacao de UX, consentimento e feedback generico;
- carregar comentários aprovados via `GET /api/comments?slug=...`;
- enviar draft de comentário para `POST /api/comments/draft`, deixando OAuth, state assinado e moderação sob responsabilidade do dashboard;
- manter consistência responsiva entre header, corpo, newsletter e footer.

No estado atual, o formulário da newsletter nos posts envia leads para `/api/newsletter/subscribe` na origem configurada em `PUBLIC_DASHBOARD_URL`. O backend do dashboard faz validação definitiva, deduplicação, rate limit, persistência com consentimento e double opt-in. O frontend continua responsável apenas por validação de UX e feedback genérico.

Os comentários seguem a mesma divisão: o blog monta DOM com APIs seguras (`createElement`, `textContent`) e nunca confia em HTML vindo do dashboard. O dashboard valida origem, aplica rate limit, autentica via OAuth e só retorna comentários aprovados.

## Organização de Componentes

Componentes devem ser criados quando houver reutilização real ou isolamento claro de responsabilidade.

Exemplos de componentes existentes:

- `Navbar.astro`;
- `BlackHole.astro`;
- `CategoriaPage.astro`;
- `ThemeProvider.astro`;
- `ErrorPage.astro`.

## Estilo

O projeto usa duas abordagens:

- Tailwind CSS para utilitários de layout, espaçamento e composição;
- CSS escopado em Astro para interações específicas, animações e estilos complexos.

Tokens globais de tema vivem em `src/styles/tokens.css` e devem ser preferidos em vez de cores fixas.

## Renderização de Conteúdo

No estado atual, posts vêm do dashboard por `src/lib/posts.ts`, que consulta `PUBLIC_DASHBOARD_URL/api/posts?status=PUBLISHED` no build. Conteúdo institucional e assets visuais continuam no próprio repositório.

O frontend deve estar preparado para receber:

- título;
- slug;
- resumo;
- corpo;
- categoria;
- autor;
- capa;
- status de publicação;
- datas de criação e publicação.

`src/lib/posts.ts` é o adapter do blog para a API pública. Ele normaliza autor, categoria, HTML renderizado e fornece helpers como `getPost()`, `getPostsByCategory()` e `paginatePosts()`.

## Testes

O baseline atual inclui:

- Vitest para helpers de posts (`paginatePosts()` e `getPost()`);
- Playwright para smoke tests de home e página de post;
- CI executando `npm test` depois do build.

## Imagens

Imagens públicas ficam em `public/`. Para posts dinâmicos, imagens devem ser associadas ao conteúdo por URL, storage ou referência no banco.

## Fallback de Capa

Posts sem capa devem usar uma estratégia previsível:

1. capa específica do post;
2. imagem padrão da categoria;
3. imagem institucional do projeto;
4. placeholder visual consistente com o tema.

Essa regra evita cards quebrados e mantém a identidade visual mesmo quando o conteúdo estiver incompleto.
