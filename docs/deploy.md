# Deploy Runbook — Devs à Deriva (Blog)

Runbook operacional para deploys em produção do blog `devsaderiva.com.br`.

Para entender o pipeline CI/CD completo (jobs, thresholds Lighthouse, smoke test), veja `docs/ci-cd.md`. Para operação de backups e restore, veja `docs/operations.md`.

---

## Arquitetura de deploy

O blog tem dois destinos de deploy simultâneos:

| Destino | Gatilho | Responsável |
|---------|---------|-------------|
| **Vercel** | Push em `main` → GitHub Actions | Automático via Vercel integration |
| **VPS (Docker)** | Push em `main` → GitHub Actions via SSH | `scripts/deploy.sh` |

Os dois destinos são independentes. Uma falha no VPS não afeta a Vercel e vice-versa.

---

## Deploy Normal (CI/CD)

Todo push para `main` que passe o pipeline dispara o deploy automaticamente via GitHub Actions:

1. `quality`: lint, typecheck, testes unitários, Gitleaks.
2. `build`: Astro build + artefato publicado.
3. `audit`: segurança, SEO, links internos.
4. `lighthouse`: scores e Core Web Vitals contra thresholds de bloqueio.
5. `deploy`: SSH na VPS → `bash /opt/devs-a-deriva/scripts/deploy.sh`.
6. `smoke`: polling em `/health.json` por até 75s → validação de rotas → rollback automático se falhar.

**Você não precisa fazer nada além de fazer o merge.** O CI verifica e rollback automaticamente se o smoke falhar.

---

## Deploy Manual (emergência ou CI indisponível)

Use quando precisar deployar sem esperar o CI, ou quando o GitHub Actions estiver fora.

```bash
ssh <VPS_USER>@<VPS_HOST>
cd /opt/devs-a-deriva

# Atualizar código
git pull --ff-only origin main

# Deployar
bash scripts/deploy.sh
```

O script `deploy.sh` executa, em ordem:

1. Salva o SHA atual em `.previous-rev` (para rollback imediato).
2. Faz `git fetch` e `git checkout` do commit alvo.
3. Passa `PUBLIC_COMMIT_SHA` para o build do Astro.
4. Recria a imagem Docker com `docker compose build --no-cache blog`.
5. Sobe o serviço com `docker compose up -d --remove-orphans`.
6. Aguarda o healthcheck em `http://127.0.0.1:4321/health.json` por até 120s.
7. Se o healthcheck falhar, faz rollback automático para o SHA anterior e sai com erro.

---

## Checklist Pré-Deploy

Antes de fazer merge para `main`:

- [ ] `npm run ci:check` passa localmente (lint + typecheck + testes)
- [ ] `npm run build` passa localmente
- [ ] Novo conteúdo validado com `npm run validate:content`
- [ ] Variáveis de ambiente novas adicionadas ao `.env` da VPS antes do deploy
- [ ] Se adicionou nova rota pública: atualizar `scripts/check-seo.mjs` e `scripts/smoke-test.mjs`

---

## Verificação Pós-Deploy

Após cada deploy (automático ou manual):

```bash
# Health check direto no Node (sem nginx)
curl -sf http://localhost:4321/health.json | jq

# Se tiver acesso ao domínio público
curl -sf https://devsaderiva.com.br/health.json | jq
```

Resposta esperada:

```json
{
  "status": "ok",
  "app": "devs-a-deriva",
  "version": "<commit-sha>",
  "timestamp": "<ISO date>"
}
```

Se `status` não retornar `ok`, veja "Se o Deploy Falhar" abaixo.

---

## Rollback

### Rollback automático (CI)

Se o smoke test falhar após um deploy bem-sucedido, o GitHub Actions executa automaticamente:

```bash
bash /opt/devs-a-deriva/scripts/rollback.sh
```

### Rollback manual imediato na VPS

Usa o SHA salvo em `.previous-rev` pelo `deploy.sh`:

```bash
bash /opt/devs-a-deriva/scripts/rollback.sh
```

O script lê `.previous-rev`, faz `git checkout` para o commit anterior, reconstrói a imagem e aguarda o healthcheck. Leva cerca de 2–3 minutos (requer rebuild).

### Rollback para commit específico

```bash
cd /opt/devs-a-deriva
git checkout <commit-anterior>
PUBLIC_COMMIT_SHA=<commit-anterior> \
  docker compose -f docker-compose.yml -f docker-compose.prod.yml build blog
PUBLIC_COMMIT_SHA=<commit-anterior> \
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans
```

---

## Se o Deploy Falhar

### Falha durante o build

O script `deploy.sh` tem `trap rollback ERR` — ao falhar no build, tenta automaticamente restaurar o commit anterior. O container em produção não é afetado se o build falhar antes do `docker compose up`.

Verifique os logs:

```bash
docker compose -f /opt/devs-a-deriva/docker-compose.yml \
  -f /opt/devs-a-deriva/docker-compose.prod.yml logs blog --tail=100
```

### Falha no healthcheck pós-deploy

O `deploy.sh` faz rollback automático. Se o container estiver em estado ruim após o rollback:

```bash
# Restart forçado do serviço
docker compose -f /opt/devs-a-deriva/docker-compose.yml \
  -f /opt/devs-a-deriva/docker-compose.prod.yml restart blog
```

### Blog inacessível mas container saudável

O nginx do sistema (fora do Docker) pode estar com problema:

```bash
# Ver status do nginx
systemctl status nginx

# Recarregar configuração
systemctl reload nginx

# Ver logs de acesso do nginx
journalctl -u nginx --since "30 minutes ago"
```

---

## Variáveis de Ambiente

O blog só tem uma variável obrigatória em runtime:

```bash
# Na VPS, dentro do docker-compose.prod.yml ou .env
PUBLIC_DASHBOARD_URL=https://dashboard.devsaderiva.com.br
```

Se o dashboard ficar inacessível, `isApiOffline()` retorna `true` e o blog exibe estado offline — **não entra em erro 500**.

---

## Referências

| Documento | Quando usar |
|-----------|-------------|
| `docs/ci-cd.md` | Pipeline CI/CD completo (jobs, Lighthouse, smoke, rollback automático) |
| `docs/operations.md` | Backup do banco, restore, cron e manutenção periódica |
| `scripts/deploy.sh` | Script real de deploy (fonte da verdade para VPS) |
| `scripts/rollback.sh` | Script real de rollback |
| `scripts/smoke-test.mjs` | Smoke test executado após cada deploy |
