# Arquitetura

## Visão de Alto Nível

O projeto é estruturado como uma aplicação Astro focada em performance, renderização eficiente e forte controle visual. A arquitetura separa a camada pública do blog, o futuro painel administrativo e a camada de dados que deve sustentar conteúdo dinâmico.

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

O painel administrativo será responsável por gerenciar o conteúdo editorial:

- criar posts;
- editar posts;
- publicar ou despublicar conteúdos;
- gerenciar categorias;
- revisar comentários ou reações;
- acompanhar métricas editoriais.

Inicialmente pode viver dentro do próprio projeto Astro em rotas como `/admin`. Conforme a complexidade crescer, pode ser separado em uma aplicação própria.

### Backend

O backend será responsável por persistência, autenticação, autorização e regras de publicação. Ele pode ser implementado como:

- API server em VPS;
- serverless functions;
- backend dedicado;
- serviço BaaS, caso faça sentido para a fase do projeto.

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

## Estratégia de Deploy

### Frontend

O frontend pode ser publicado na Vercel, aproveitando:

- build estático;
- CDN;
- preview deployments;
- integração simples com domínio;
- analytics.

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
- separação clara entre experiência visual e regras editoriais.

## Decisões Importantes

- Astro permanece como camada pública principal.
- JavaScript no cliente deve ser usado apenas quando a interação exige.
- Conteúdo deve migrar de mock/hardcoded para uma fonte estruturada.
- O dashboard não deve contaminar a complexidade da experiência pública.
