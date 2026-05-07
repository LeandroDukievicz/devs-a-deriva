# Arquitetura

## Visão de Alto Nível

O projeto é estruturado como uma aplicação Astro focada em performance, renderização eficiente e forte controle visual. A arquitetura separa a camada pública do blog, o painel administrativo em `dashboard-ldstudio` e a camada de dados em PostgreSQL/Prisma.

## Camadas do Sistema

### Frontend Público

Responsável pela experiência de leitura e navegação:

- home;
- páginas de categorias;
- páginas de posts;
- manifesto;
- páginas institucionais ou editoriais;
- componentes visuais e interativos.

Astro é a base ideal para essa camada por permitir páginas estáticas rápidas, baixo JavaScript por padrão e hidratação parcial quando necessário.

### Dashboard/Admin

O painel administrativo é uma aplicação Next.js separada responsável por gerenciar o conteúdo editorial e os fluxos públicos dinâmicos:

- criar posts;
- editar posts;
- publicar ou despublicar conteúdos;
- gerenciar categorias;
- revisar comentários;
- moderar histórico por post;
- gerenciar newsletter e colaboradores;
- acompanhar métricas editoriais e progresso de leitura.

### Backend

O backend fica no dashboard e é responsável por persistência, autenticação, autorização e regras de publicação. Ele usa:

- Next.js App Router e Route Handlers;
- Prisma;
- PostgreSQL;
- NextAuth v5;
- Caddy na borda da VPS;
- Nginx dentro do container do blog estático.

## Fluxo de Dados Atual

```txt
Autor cria post no dashboard
        ↓
Dashboard valida e envia dados
        ↓
Backend persiste no banco
        ↓
Frontend consulta ou recebe conteúdo gerado
        ↓
Blog renderiza páginas públicas
```

Além do fluxo editorial, o blog envia interações públicas para o dashboard por meio de `PUBLIC_DASHBOARD_URL`:

```txt
Leitor envia comentário, progresso de leitura ou newsletter
        ↓
Blog chama endpoint público no dashboard
        ↓
Dashboard valida, aplica regras de segurança e persiste no PostgreSQL
        ↓
Blog recebe resposta pública mínima
```

No fluxo de newsletter, a inscrição só deve ser considerada ativa após double opt-in confirmado no backend.

No fluxo de comentários, o dashboard cria um draft `AWAITING_AUTH`, gera um `state` assinado por HMAC com expiração de 10 minutos, valida o OAuth e só então move o comentário para `PENDING`. A exposição pública continua limitada a comentários `APPROVED`.

## Estratégia de Deploy

### Frontend

O frontend público roda como build estático servido por Nginx em container e proxy reverso Caddy na VPS. O Nginx define headers de segurança:

- `Content-Security-Policy`;
- `Strict-Transport-Security`;
- `X-Content-Type-Options`;
- `X-Frame-Options`;
- `Referrer-Policy`;
- `Permissions-Policy`.

O CSP usa `'unsafe-inline'` em `script-src` porque o blog ainda usa scripts inline gerados por Astro `is:inline`. Nonce por request exigiria SSR/middleware e fica como débito técnico.

### Backend e Banco

Para a camada dinâmica, o projeto usa hoje um dashboard/backend separado em `dashboard-ldstudio`, com Next.js, Prisma e PostgreSQL. Esse backend concentra:

- API pública consumida pelo blog;
- persistência editorial;
- comentários;
- progresso de leitura;
- captação de newsletter;
- autenticação e rotas administrativas do dashboard.

## Escalabilidade

O projeto deve preservar:

- baixo acoplamento entre UI e fonte de dados;
- conteúdo modelado de forma explícita;
- componentes reutilizáveis sem excesso de abstração;
- páginas públicas rápidas mesmo com aumento de posts;
- listagens com paginação client-side enquanto o site permanecer 100% estático;
- separação clara entre experiência visual e regras editoriais.

## Decisões Importantes

- Astro permanece como camada pública principal.
- JavaScript no cliente deve ser usado apenas quando a interação exige.
- Conteúdo principal já vem do dashboard; mocks/hardcoded devem ser mantidos apenas como fallback visual ou conteúdo institucional.
- O dashboard não deve contaminar a complexidade da experiência pública.
- Testes mínimos de helpers e smoke e2e fazem parte do baseline de CI.
