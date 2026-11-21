#!/usr/bin/env bash
set -euo pipefail
scripts="$(cd "$(dirname "$0")" && pwd)"
url="http://localhost:8000/api/health"

if curl -sf "$url" >/dev/null; then
  echo "Backend is already running at http://localhost:8000. Run stop-backend.sh first to restart it."
  exit 0
fi

cd "$(dirname "$scripts")/backend"
uv sync
# setsid gives the server its own process group so stop-backend.sh can stop it with its children
setsid uv run uvicorn app.main:app --port 8000 >"$scripts/backend.log" 2>&1 &
pid=$!

echo "Waiting for the backend (the first start embeds the PDFs and can take several minutes)..."
until curl -sf "$url" >/dev/null; do
  kill -0 "$pid" 2>/dev/null || { echo "Backend exited. See scripts/backend.log"; exit 1; }
  sleep 2
done
echo "$pid" >"$scripts/backend.pid"
echo "Backend ready at http://localhost:8000"
