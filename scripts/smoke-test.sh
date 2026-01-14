#!/usr/bin/env bash
set -euo pipefail

MODE=${1:-dev}

if [ "$MODE" = "dev" ]; then
  echo "Checking dev server at http://localhost:5173/ ..."
  if curl -sSf http://localhost:5173/ >/dev/null; then
    echo "DEV server reachable"
  else
    echo "DEV server not reachable" >&2
    exit 2
  fi
elif [ "$MODE" = "dist" ]; then
  echo "Checking dist/index.html exists ..."
  if [ -f dist/index.html ]; then
    echo "dist/index.html found"
  else
    echo "dist/index.html missing" >&2
    exit 3
  fi
else
  echo "Usage: $0 [dev|dist]" >&2
  exit 1
fi

echo "Smoke test ($MODE) passed."