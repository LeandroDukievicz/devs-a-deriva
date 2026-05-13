#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/devs-a-deriva"
COMPOSE="docker compose -f $APP_DIR/docker-compose.yml -f $APP_DIR/docker-compose.prod.yml"
BRANCH="${DEPLOY_BRANCH:-main}"
PREVIOUS_REV="$(git -C "$APP_DIR" rev-parse --short HEAD)"
TARGET_REV="${PUBLIC_COMMIT_SHA:-}"

echo "$PREVIOUS_REV" > "$APP_DIR/.previous-rev"

rollback() {
  echo "==> Falha durante deploy. Tentando rollback para $PREVIOUS_REV..."
  git -C "$APP_DIR" checkout -q "$PREVIOUS_REV" || true
  PUBLIC_COMMIT_SHA="$PREVIOUS_REV" $COMPOSE build blog || true
  PUBLIC_COMMIT_SHA="$PREVIOUS_REV" $COMPOSE up -d --remove-orphans || true
}

trap rollback ERR

echo "==> Atualizando código..."
git -C "$APP_DIR" fetch --prune origin "$BRANCH"

if [[ -n "$TARGET_REV" && "$TARGET_REV" != "local" ]]; then
  git -C "$APP_DIR" checkout -q "$TARGET_REV"
else
  git -C "$APP_DIR" checkout -q "$BRANCH"
  git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
  TARGET_REV="$(git -C "$APP_DIR" rev-parse --short HEAD)"
fi

export PUBLIC_COMMIT_SHA="$TARGET_REV"

echo "==> Build da imagem (busca posts do dashboard no build)..."
$COMPOSE build --no-cache blog

echo "==> Subindo serviço..."
$COMPOSE up -d --remove-orphans

trap - ERR
echo "==> Deploy concluído."
echo "==> Release ativa: $TARGET_REV"
$COMPOSE ps
