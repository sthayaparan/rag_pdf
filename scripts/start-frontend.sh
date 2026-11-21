#!/usr/bin/env bash
set -euo pipefail
scripts="$(cd "$(dirname "$0")" && pwd)"
cd "$(dirname "$scripts")/frontend"

npm install
npm run build
# setsid gives the server its own process group so stop-frontend.sh can stop it with its children
setsid npm run start >"$scripts/frontend.log" 2>&1 &
echo $! >"$scripts/frontend.pid"

until curl -sf http://localhost:3000 >/dev/null; do
  kill -0 "$(cat "$scripts/frontend.pid")" 2>/dev/null || { echo "Frontend exited. See scripts/frontend.log"; exit 1; }
  sleep 1
done
echo "Frontend ready at http://localhost:3000"
