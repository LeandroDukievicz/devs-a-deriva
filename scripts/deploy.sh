#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/devs-a-deriva"
COMPOSE="docker compose -f $APP_DIR/docker-compose.yml -f $APP_DIR/docker-compose.prod.yml"

echo "==> Atualizando código..."
git -C "$APP_DIR" pull --ff-only

echo "==> Build da imagem (busca posts do dashboard no build)..."
$COMPOSE build --no-cache blog

echo "==> Subindo serviço..."
$COMPOSE up -d --remove-orphans

echo "==> Deploy concluído."
$COMPOSE ps
