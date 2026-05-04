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

### Newsletter

O dashboard também é responsável pelo backend da newsletter consumida pelo blog público.

Responsabilidades atuais:

- receber `POST /api/newsletter/subscribe`;
- validar e normalizar e-mails no servidor;
- persistir leads com status explícito;
- evitar duplicidade por hash do e-mail normalizado;
- responder de forma genérica para evitar enumeração;
- aplicar rate limit por hash de IP e hash de e-mail;
- enviar confirmação double opt-in;
- confirmar inscrição por token hasheado;
- permitir descadastro por token próprio.

Responsabilidades pendentes:

- tela administrativa real para inscritos;
- filtros por status, origem, post e data;
- ações seguras de supressão/descadastro;
- documentação operacional de retenção e exclusão.

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
- `NewsletterSubscriber`;
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
