# Banco de Dados e Migrations

## Escopo Atual

O blog público neste repositório é Astro estático. A persistência dinâmica fica no dashboard/backend localizado em:

```txt
/home/leandro-dukievicz/Projetos/dashboard-ldstudio
```

Esse backend usa Next.js API Routes, Prisma, PostgreSQL e migrations versionadas em `dashboard-ldstudio/prisma/migrations`.

## Comandos Operacionais

No diretório `dashboard-ldstudio`:

```bash
npx prisma format
npx prisma generate
npx prisma migrate status
npx prisma migrate deploy
npm run build
```

Use `migrate deploy` para aplicar migrations já versionadas. Use `migrate dev` apenas em fluxo de desenvolvimento quando uma nova migration estiver sendo criada.

## Drift de Migration

Em 2026-05-02, o banco local apresentou drift na migration:

```txt
20260501010000_add_post_publication_metadata
```

O Prisma tentou aplicar a migration, mas falhou porque a coluna `posts.slug` já existia. A inspeção mostrou que os objetos principais da migration já estavam materialmente presentes:

- colunas `posts.slug`, `posts.excerpt`, `posts.authorId`;
- índice único `posts_slug_key`;
- foreign key `posts_authorId_fkey`.

Faltava apenas o índice:

```txt
posts_authorId_idx
```

O índice foi criado manualmente e a migration foi marcada como aplicada:

```bash
npx prisma migrate resolve --applied 20260501010000_add_post_publication_metadata
```

Depois disso, `npx prisma migrate deploy` aplicou com sucesso:

```txt
20260501020000_add_reading_progress
20260502095000_add_newsletter_leads
```

## Procedimento Seguro Para Drift

Nunca rode `migrate resolve --applied` apenas para desbloquear o Prisma. Antes:

1. Identifique a migration falhada com `npx prisma migrate status`.
2. Leia o SQL da migration em `prisma/migrations/<migration>/migration.sql`.
3. Valide no banco se cada coluna, índice, constraint e tabela esperada já existe.
4. Crie manualmente apenas os objetos faltantes e compatíveis com a migration.
5. Só então marque a migration como aplicada.
6. Rode `npx prisma migrate deploy` novamente.
7. Finalize com `npx prisma migrate status` e `npm run build`.

## Critério de Saúde

Antes de deploy, o backend deve passar por:

```bash
npx prisma migrate status
npm run build
```

O status esperado é:

```txt
Database schema is up to date!
```

## Pendências

- Criar ambiente efêmero de validação para aplicar todas as migrations do zero.
- Adicionar check de CI para `prisma migrate status`.
- Documentar rollback de migrations em produção.
