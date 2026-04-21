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
- preservar impacto visual sem comprometer navegação.

### Categorias

As páginas de categoria organizam conteúdos por tema editorial.

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

Página inicial para autenticação administrativa. Deve evoluir para um dashboard real.

### Posts

As páginas individuais de posts ainda devem ser implementadas como parte do sistema dinâmico de conteúdo.

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

No estado atual, parte do conteúdo está hardcoded. A direção planejada é renderizar posts a partir de uma fonte estruturada, como banco de dados ou CMS.

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

## Imagens

Imagens públicas ficam em `public/`. Para posts dinâmicos, imagens devem ser associadas ao conteúdo por URL, storage ou referência no banco.

## Fallback de Capa

Posts sem capa devem usar uma estratégia previsível:

1. capa específica do post;
2. imagem padrão da categoria;
3. imagem institucional do projeto;
4. placeholder visual consistente com o tema.

Essa regra evita cards quebrados e mantém a identidade visual mesmo quando o conteúdo estiver incompleto.
