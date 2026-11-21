#!/usr/bin/env bash
set -euo pipefail
scripts="$(cd "$(dirname "$0")" && pwd)"
cd "$(dirname "$scripts")/backend"

uv sync
# setsid gives the server its own process group so stop-backend.sh can stop it with its children
setsid uv run uvicorn app.main:app --port 8000 >"$scripts/backend.log" 2>&1 &
echo $! >"$scripts/backend.pid"

echo "Waiting for the backend (the first start embeds the PDFs and can take several minutes)..."
until curl -sf http://localhost:8000/api/health >/dev/null; do
  kill -0 "$(cat "$scripts/backend.pid")" 2>/dev/null || { echo "Backend exited. See scripts/backend.log"; exit 1; }
  sleep 2
done
echo "Backend ready at http://localhost:8000"
