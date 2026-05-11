#!/usr/bin/env bash
# Production-style build matching CI (no Git tag / no GitHub Release).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

echo "Running type-check, lint, and ci (vite build + inject-id)..."
pnpm type-check
pnpm lint
pnpm ci

echo ""
echo "Build output: $ROOT/dist/"
echo "Zip manually: (cd dist && zip -rq ../draw-steel-rolls-local.zip .)"
