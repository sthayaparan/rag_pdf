#!/usr/bin/env bash
set -euo pipefail
scripts="$(cd "$(dirname "$0")" && pwd)"
url="http://localhost:3000"

if curl -sf "$url" >/dev/null; then
  echo "Frontend is already running at $url. Run stop-frontend.sh first to restart it."
  exit 0
fi

cd "$(dirname "$scripts")/frontend"
npm install
npm run build
# setsid gives the server its own process group so stop-frontend.sh can stop it with its children
setsid npm run start >"$scripts/frontend.log" 2>&1 &
pid=$!

until curl -sf "$url" >/dev/null; do
  kill -0 "$pid" 2>/dev/null || { echo "Frontend exited. See scripts/frontend.log"; exit 1; }
  sleep 1
done
echo "$pid" >"$scripts/frontend.pid"
echo "Frontend ready at $url"
