#!/usr/bin/env bash
#
# Deploy das Cloud Functions do beauty-booker (projeto: beaulty-book).
#
# Uso:
#   ./deploy.sh                      # faz deploy de TODAS as functions
#   ./deploy.sh scrapeInstagramPosts # faz deploy apenas da function informada
#   ./deploy.sh scrapeInstagramPosts sendAppointmentReminder  # várias
#
# Os nomes são os exports em functions/src/index.ts (camelCase).

set -euo pipefail

# Garante que o script roda a partir do diretório onde ele está (fire-functions/).
cd "$(dirname "$0")"

PROJECT="beaulty-book"

if [ "$#" -eq 0 ]; then
  echo "==> Deploy de TODAS as functions para o projeto '$PROJECT'..."
  npx firebase-tools deploy --only functions --project "$PROJECT"
else
  # Monta o filtro: functions:nome1,functions:nome2,...
  FILTER=""
  for fn in "$@"; do
    if [ -n "$FILTER" ]; then
      FILTER="$FILTER,"
    fi
    FILTER="${FILTER}functions:${fn}"
  done

  echo "==> Deploy das functions [$*] para o projeto '$PROJECT'..."
  npx firebase-tools deploy --only "$FILTER" --project "$PROJECT"
fi

echo "==> Deploy finalizado."
