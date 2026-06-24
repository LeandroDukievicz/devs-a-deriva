#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/devs-a-deriva"
COMPOSE="docker compose -f $APP_DIR/docker-compose.yml -f $APP_DIR/docker-compose.prod.yml"
BRANCH="${DEPLOY_BRANCH:-main}"
PREVIOUS_REV="$(git -C "$APP_DIR" rev-parse --short HEAD)"
TARGET_REV="${PUBLIC_COMMIT_SHA:-}"
HEALTH_URL="http://127.0.0.1:4321/health.json"
NODE_IMAGE="public.ecr.aws/docker/library/node:22-alpine"

echo "$PREVIOUS_REV" > "$APP_DIR/.previous-rev"

cleanup_compose_recreate_conflicts() {
  local stale_containers
  stale_containers="$(
    docker ps -a --format '{{.ID}} {{.Names}}' |
      awk '$2 ~ /^[0-9a-f]+_devs-a-deriva-blog-1$/ { print $1 }'
  )"

  if [[ -z "$stale_containers" ]]; then
    return 0
  fi

  echo "==> Removendo containers temporários órfãos do Docker Compose..."
  echo "$stale_containers" | xargs -r docker rm -f
}

retry() {
  local attempts="$1"
  shift

  local attempt=1
  until "$@"; do
    if [ "$attempt" -ge "$attempts" ]; then
      return 1
    fi
    echo "[warn] comando falhou; nova tentativa $((attempt + 1))/$attempts em 10s: $*"
    sleep 10
    attempt=$((attempt + 1))
  done
}

rollback() {
  echo "==> Falha durante deploy. Tentando rollback para $PREVIOUS_REV..."
  git -C "$APP_DIR" checkout -q "$PREVIOUS_REV" || true
  PUBLIC_COMMIT_SHA="$PREVIOUS_REV" $COMPOSE build blog || true
  cleanup_compose_recreate_conflicts || true
  PUBLIC_COMMIT_SHA="$PREVIOUS_REV" $COMPOSE up -d --remove-orphans || true
}

show_diagnostics() {
  echo "==> Estado do Docker Compose:"
  $COMPOSE ps || true
  echo "==> Logs recentes do serviço blog:"
  $COMPOSE logs --tail=120 blog || true
}

wait_for_health() {
  for i in $(seq 1 24); do
    if curl -fsS --max-time 5 "$HEALTH_URL" > /dev/null; then
      echo "==> Serviço saudável em $HEALTH_URL (tentativa $i)"
      return 0
    fi

    echo "==> Aguardando healthcheck ($i/24)..."
    sleep 5
  done

  echo "==> Serviço não ficou saudável em 120s"
  show_diagnostics
  return 1
}

trap rollback ERR

echo "==> Atualizando código..."
if ! git -C "$APP_DIR" fetch --prune origin "$BRANCH"; then
  echo "[warn] git fetch via SSH falhou; tentando HTTPS..."
  git -C "$APP_DIR" fetch --prune https://github.com/LeandroDukievicz/devs-a-deriva.git "$BRANCH"
fi

if [[ -n "$TARGET_REV" && "$TARGET_REV" != "local" ]]; then
  git -C "$APP_DIR" checkout -q "$TARGET_REV"
else
  git -C "$APP_DIR" checkout -q "$BRANCH"
  git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
  TARGET_REV="$(git -C "$APP_DIR" rev-parse --short HEAD)"
fi

export PUBLIC_COMMIT_SHA="$TARGET_REV"

echo "==> Baixando imagem base Node com retry..."
retry 5 docker pull "$NODE_IMAGE"

echo "==> Build da imagem (busca posts do dashboard no build)..."
$COMPOSE build --no-cache blog

echo "==> Subindo serviço..."
cleanup_compose_recreate_conflicts
$COMPOSE up -d --remove-orphans

echo "==> Validando healthcheck..."
wait_for_health

trap - ERR
echo "==> Deploy concluído."
echo "==> Release ativa: $TARGET_REV"
$COMPOSE ps
