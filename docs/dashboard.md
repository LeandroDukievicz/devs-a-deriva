# Dashboard/Admin

## Propósito

O dashboard será a área de gestão editorial do Devs à Deriva. Ele deve permitir que autores e administradores criem, editem, organizem e publiquem conteúdos sem alterar código.

## Funcionalidades Esperadas

### Posts

- Criar post.
- Editar post.
- Salvar rascunho.
- Publicar.
- Despublicar.
- Definir slug.
- Definir resumo.
- Escolher categoria.
- Definir capa.
- Gerenciar conteúdo em Markdown.

### Categorias

- Criar categorias.
- Editar nome e descrição.
- Definir imagem padrão.
- Definir slug.
- Controlar ordem de exibição.

### Comentários

Quando o sistema de comentários existir, o dashboard deve permitir:

- visualizar comentários;
- aprovar ou rejeitar;
- ocultar conteúdo problemático;
- bloquear spam;
- revisar histórico por post.

### Autores

O sistema deve estar preparado para:

- associar posts a autores;
- exibir nome, avatar e bio;
- controlar permissões;
- diferenciar autor, editor e administrador.

## Estrutura de Dados Esperada

O dashboard deve manipular entidades como:

- `Post`;
- `Category`;
- `Author`;
- `Comment`;
- `MediaAsset`;
- `Tag` ou `Topic`, se necessário.

## Conexão com o Blog

O dashboard não deve renderizar a experiência pública. Ele apenas gerencia dados.

Fluxo esperado:

```txt
Dashboard edita conteúdo
        ↓
Backend valida permissões
        ↓
Banco armazena dados
        ↓
Frontend público renderiza posts
```

## Princípios

- O painel deve ser funcional antes de ser visualmente complexo.
- Validação de dados deve existir no frontend e no backend.
- Estados de publicação precisam ser explícitos.
- A experiência pública não deve depender de lógica administrativa.
