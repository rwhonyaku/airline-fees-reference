#!/bin/sh
set -eu

. "$(dirname "$0")/codex-env.sh"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Bundled pnpm is not available. Codex runtime path may have changed."
  exit 1
fi

pnpm install --config.confirmModulesPurge=false
