#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/devs-a-deriva"
COMPOSE="docker compose -f $APP_DIR/docker-compose.yml -f $APP_DIR/docker-compose.prod.yml"
PREV_FILE="$APP_DIR/.previous-rev"

if [[ ! -f "$PREV_FILE" ]]; then
  echo "==> .previous-rev não encontrado — rollback impossível"
  exit 1
fi

PREVIOUS_REV="$(cat "$PREV_FILE")"
if [[ -z "$PREVIOUS_REV" ]]; then
  echo "==> .previous-rev está vazio — rollback impossível"
  exit 1
fi

CURRENT_REV="$(git -C "$APP_DIR" rev-parse --short HEAD)"
if [[ "$CURRENT_REV" == "$PREVIOUS_REV" ]]; then
  echo "==> Já na revisão $PREVIOUS_REV — nada a fazer"
  exit 0
fi

echo "==> Rollback: $CURRENT_REV → $PREVIOUS_REV"
git -C "$APP_DIR" checkout -q "$PREVIOUS_REV"
export PUBLIC_COMMIT_SHA="$PREVIOUS_REV"
$COMPOSE build blog
$COMPOSE up -d --remove-orphans
echo "==> Rollback concluído: $PREVIOUS_REV"
$COMPOSE ps
