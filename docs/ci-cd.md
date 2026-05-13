# CI/CD

## Visão Geral

O projeto é um site Astro estático servido por Nginx em Docker. O build pode consultar o dashboard via `PUBLIC_DASHBOARD_URL`, mas o CI aceita o estado sem posts quando o dashboard não está disponível. Conteúdo temporário, placeholders e drafts não bloqueiam o pipeline.

Fluxo atual:

1. `quality`: instala dependências, roda lint leve, typecheck, validação de conteúdo, testes unitários e Gitleaks (scan de segredos no histórico git).
2. `build`: gera `dist/` com Astro e publica o artefato para outros jobs.
3. `audit`: roda scan básico de segurança, SEO técnico e links internos quebrados.
4. `lighthouse`: executa Lighthouse CI contra o `dist/` estático com thresholds de bloqueio (`error`).
5. `deploy`: em push na `main`, `repository_dispatch` ou execução manual, chama o deploy no VPS via SSH.
6. `smoke`: espera o serviço ficar pronto (até 75s), valida rotas públicas e `/health.json`. Se falhar, aciona rollback automático no VPS.

Pull requests rodam validações, build, auditorias e Lighthouse, mas nunca fazem deploy.

## Scripts Locais

Use:

```bash
npm ci --legacy-peer-deps
npm run ci:check
npm run build
npm run check:seo
npm run check:links
npm run check:security
BASE_URL=https://devsaderiva.com.br npm run smoke:test
```

Scripts principais:

- `npm run lint`: verifica problemas estruturais simples, como conflito Git, CRLF e arquivos sem newline.
- `npm run typecheck`: executa `astro check`.
- `npm run validate:content`: valida markdown/MDX local quando existir.
- `npm test`: executa Vitest.
- `npm run check:seo`: lê `dist/` e valida meta tags, canonical, Open Graph, JSON-LD, sitemap e robots.
- `npm run check:links`: verifica links internos e assets em `dist/`; links externos não são testados para evitar instabilidade.
- `npm run check:security`: roda `npm audit --audit-level=high` e procura sinais básicos de segredo versionado.
- `npm run smoke:test`: valida a aplicação publicada usando `BASE_URL`.

## Conteúdo

O blog hoje busca posts publicados no dashboard. A validação local procura markdown/MDX em:

- `src/content`
- `content`
- `posts`

Se não houver arquivos, o check passa. Quando houver posts locais:

- `status: draft` pode estar incompleto.
- `status: published` precisa ter `slug`, `title` e `description`, `excerpt` ou `summary`.
- categorias publicadas devem estar na lista atual do blog.
- slugs duplicados e datas inválidas falham o CI.

## SEO

O SEO check valida apenas páginas realmente geradas no `dist/`. Hoje cobre:

- home
- manifesto
- devs
- categorias públicas
- termos
- privacidade

Também verifica `sitemap.xml`, `robots.txt`, `llms.txt` e `docs.json`. Para adicionar novas páginas críticas, edite `scripts/check-seo.mjs`.

## Links

`npm run check:links` valida links internos e assets gerados no build. Links externos são ignorados por padrão para evitar falhas por timeout ou indisponibilidade temporária de terceiros.

Para adicionar exceções futuras, ajuste `isIgnored()` em `scripts/check-links.mjs`.

## Lighthouse

`lighthouserc.cjs` roda contra:

- `/`
- `/categorias/tech/`
- `/devs/`
- `/manifesto/`
- `/termos/`

Thresholds usam `error` — o job falha e bloqueia o deploy se algum score cair abaixo:

- performance: `0.80`
- accessibility: `0.90`
- best practices: `0.90`
- SEO: `0.90`
- LCP: máximo 3000ms
- CLS: máximo 0.1
- TBT: máximo 300ms

## Healthcheck

O build gera `/health.json` com:

```json
{
  "status": "ok",
  "app": "devs-a-deriva",
  "version": "commit-sha",
  "timestamp": "ISO date"
}
```

No Docker, `PUBLIC_COMMIT_SHA` é passado como build arg. Localmente, o valor padrão é `local`.

## Deploy

O deploy atual continua baseado em VPS + Docker Compose:

```bash
bash /opt/devs-a-deriva/scripts/deploy.sh
```

O script:

- faz `git fetch` da branch configurada;
- faz checkout do commit recebido pelo GitHub Actions;
- passa `PUBLIC_COMMIT_SHA` para o build;
- recria a imagem do blog;
- sobe o serviço com Docker Compose;
- tenta voltar ao commit anterior se build/subida falhar antes de concluir.

## Secrets Necessários

No GitHub Actions:

- `VPS_HOST`: host ou IP do VPS.
- `VPS_USER`: usuário SSH.
- `SSH_PRIVATE_KEY`: chave privada SSH com acesso ao VPS.
- `PUBLIC_SITE_URL`: opcional; URL pública usada no smoke test. Padrão: `https://devsaderiva.com.br`.

`GITHUB_TOKEN` é injetado automaticamente pelo Actions e usado pelo Gitleaks.

Não imprima secrets em comandos ou logs. O workflow não usa `set -x`.

## Smoke Test

Após deploy, o CI espera o serviço ficar pronto (até 75s com polling a cada 5s em `/health.json`) e então roda:

```bash
BASE_URL=https://devsaderiva.com.br npm run smoke:test
```

O smoke valida:

- `/`
- `/manifesto/`
- `/devs/`
- `/categorias/tech/`
- `/categorias/carreira/`
- `/sitemap.xml`
- `/robots.txt`
- `/health.json`
- alguns assets principais encontrados na home

Para adicionar rotas, edite o array `routes` em `scripts/smoke-test.mjs`.

## Rollback

O `scripts/deploy.sh` salva o SHA anterior em `/opt/devs-a-deriva/.previous-rev` antes de cada deploy.

**Rollback automático:** se o smoke falhar após um deploy bem-sucedido, o CI executa automaticamente via SSH:

```bash
bash /opt/devs-a-deriva/scripts/rollback.sh
```

O script lê `.previous-rev`, faz `git checkout` para o commit anterior e reconstrói o serviço.

**Rollback manual** (se precisar operar fora do CI):

```bash
ssh <VPS_USER>@<VPS_HOST>
bash /opt/devs-a-deriva/scripts/rollback.sh
```

Ou para um commit específico:

```bash
ssh <VPS_USER>@<VPS_HOST>
cd /opt/devs-a-deriva
git checkout <commit-anterior>
PUBLIC_COMMIT_SHA=<commit-anterior> docker compose -f docker-compose.yml -f docker-compose.prod.yml build blog
PUBLIC_COMMIT_SHA=<commit-anterior> docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans
```

## Falha no Deploy

Se o deploy falhar durante build ou subida local no VPS (antes do smoke), `scripts/deploy.sh` tenta rollback automaticamente via `trap ERR`.

Se o smoke falhar após um deploy concluído, o CI aciona `scripts/rollback.sh` automaticamente.

## Evolução Recomendada

Próximos passos quando o projeto crescer:

- releases versionadas em `/var/www/devsaderiva/releases/{sha}` com symlink `current`;
- E2E local contra preview estático em vez de produção;
- Dependency Review em pull requests, quando o Dependency Graph estiver habilitado no GitHub;
- auditoria Lighthouse com budgets por página;
- RSS quando o fluxo de posts estiver estável.
