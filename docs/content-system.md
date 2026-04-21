# Sistema de Conteúdo

## Objetivo

O sistema de conteúdo deve permitir publicar textos com estrutura consistente, mantendo liberdade editorial e suporte a evolução futura.

## Estrutura de Post

Campos recomendados:

| Campo | Descrição |
| --- | --- |
| `id` | Identificador interno. |
| `title` | Título público do post. |
| `slug` | URL amigável. |
| `excerpt` | Resumo usado em cards e previews. |
| `content` | Corpo do post, preferencialmente em Markdown. |
| `coverImage` | Imagem de capa opcional. |
| `categoryId` | Categoria principal. |
| `authorId` | Autor responsável. |
| `status` | `draft`, `published` ou `archived`. |
| `publishedAt` | Data de publicação. |
| `createdAt` | Data de criação. |
| `updatedAt` | Data da última alteração. |
| `readingTime` | Tempo estimado de leitura. |
| `seoTitle` | Título alternativo para SEO, se necessário. |
| `seoDescription` | Descrição para mecanismos de busca. |

## Markdown

Markdown deve ser a base do conteúdo textual.

Suporte esperado:

- títulos;
- parágrafos;
- listas;
- links;
- imagens;
- blocos de código;
- citações;
- separadores;
- embeds no futuro, se necessário.

## Imagens em Posts

Imagens podem aparecer em dois contextos:

- capa do post;
- imagens internas no corpo do texto.

Elas devem ter:

- texto alternativo;
- dimensões conhecidas quando possível;
- compressão adequada;
- estratégia de fallback.

## Estratégia de Fallback de Capa

A capa deve seguir esta prioridade:

1. `coverImage` definida no post;
2. imagem padrão da categoria;
3. imagem padrão do projeto;
4. placeholder gerado pela UI.

Essa regra deve ser centralizada para evitar comportamento inconsistente entre home, categoria e post.

## Categorias

Categorias são parte da identidade editorial. Elas devem conter:

- nome;
- slug;
- descrição;
- imagem;
- cor ou variação visual, se aplicável;
- ordem de exibição.

## Considerações Futuras de CMS

O projeto pode evoluir para:

- dashboard próprio;
- CMS headless;
- banco relacional com editor customizado;
- armazenamento híbrido entre banco e arquivos Markdown.

A escolha deve preservar controle visual, performance e autonomia editorial.
