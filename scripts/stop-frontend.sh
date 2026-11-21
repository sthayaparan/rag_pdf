#!/usr/bin/env bash
pid_file="$(cd "$(dirname "$0")" && pwd)/frontend.pid"

if [ -f "$pid_file" ]; then
  kill -- "-$(cat "$pid_file")" 2>/dev/null
  rm "$pid_file"
  echo "Stopped frontend"
fi
