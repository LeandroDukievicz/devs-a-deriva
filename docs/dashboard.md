# Dashboard/Admin

## Propósito

O dashboard é a área de gestão editorial do Devs à Deriva e vive no repositório irmão `dashboard-ldstudio`. Ele permite criar, editar, organizar e publicar conteúdos sem alterar código no blog Astro.

## Estado Atual

### Posts

- Criar, editar, revisar, publicar, agendar, arquivar e remover posts.
- Slug único, resumo, categoria, thumb, autor e conteúdo Markdown.
- Markdown é convertido e sanitizado no dashboard; o blog consome o conteúdo pela API.
- Publicação dispara deploy do blog quando o hook está configurado.

### Categorias

- CRUD real com persistência em PostgreSQL.
- Slug único e relação com posts.
- Seletor do editor alimentado por dados reais.

### Comentários

O dashboard já gerencia o fluxo completo de comentários do blog:

- `POST /api/comments/draft` cria comentário `AWAITING_AUTH`;
- o draft usa rate limit por IP hash: 5 tentativas por minuto no endpoint `comment-draft`;
- o login social usa NextAuth separado para comentários;
- o state do comentário é assinado com HMAC-SHA256 usando `AUTH_SECRET`, inclui nonce de 32 bytes e expira em 10 minutos;
- a finalização valida o HMAC antes de processar;
- a transição correta é `AWAITING_AUTH -> PENDING -> APPROVED | REJECTED`;
- o dashboard lista comentários pendentes para moderação;
- o blog público só recebe `APPROVED` e `deletedAt: null`;
- exclusão é soft delete via `deletedAt`.

### Newsletter

O dashboard é responsável pelo backend da newsletter consumida pelo blog público.

Responsabilidades atuais:

- receber `POST /api/newsletter/subscribe`;
- validar e normalizar e-mails no servidor;
- persistir leads com status explícito;
- evitar duplicidade por hash do e-mail normalizado;
- responder de forma genérica para evitar enumeração;
- aplicar rate limit por hash de IP e hash de e-mail;
- enviar confirmação double opt-in;
- confirmar inscrição por token hasheado;
- permitir descadastro por token próprio;
- expor endpoints administrativos para listagem e atualização de status.

### Autores e Colaboradores

- Perfis de usuário persistidos com nome, cargo, bio, foto e redes sociais.
- Posts podem ser associados a autores.
- Acesso de colaboradores controlado por convites e `accessExpiresAt`.
- Rotas de colaboradores têm guard owner-only.

## Conexão com o Blog

O dashboard não renderiza a experiência pública. Ele gerencia dados e regras.

```txt
Dashboard edita conteúdo
        ↓
Backend valida permissões e sanitiza dados
        ↓
PostgreSQL armazena conteúdo
        ↓
Blog Astro consulta API pública em build/runtime
        ↓
Frontend público renderiza posts, comentários aprovados e leitura
```

O blog usa `PUBLIC_DASHBOARD_URL` para:

- listar posts publicados;
- carregar comentários aprovados;
- criar draft de comentário;
- sincronizar progresso de leitura;
- enviar inscrição de newsletter.

## Segurança

- Endpoints administrativos exigem sessão autorizada.
- Endpoints públicos usam CORS allowlist.
- Escritas públicas usam rate limit por IP hash quando aplicável.
- Comentários usam state assinado e expiração de 10 minutos no fluxo OAuth.
- Comentários e Markdown são sanitizados antes de exposição pública.
- Caddy também injeta headers de segurança no domínio do blog para não conflitar com Nginx.

## Princípios

- O painel deve concentrar regras editoriais e persistência.
- A experiência pública não deve depender de lógica administrativa.
- Estados de publicação e moderação precisam ser explícitos.
- Dados vindos do dashboard devem chegar ao blog já normalizados e seguros.
