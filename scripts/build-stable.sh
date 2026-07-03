#!/bin/sh
set -eu

. "$(dirname "$0")/codex-env.sh"

if [ ! -x "./node_modules/.bin/next" ]; then
  echo "Local Next.js install is missing."
  echo "Run sh scripts/repair-local-deps.sh once from a network-enabled shell, then rerun this script."
  exit 1
fi

if [ "$(uname -s)" = "Darwin" ] && [ "$(uname -m)" = "arm64" ]; then
  if [ ! -f "./node_modules/@next/swc-darwin-arm64/next-swc.darwin-arm64.node" ] &&
     [ ! -f "./node_modules/.pnpm/node_modules/@next/swc-darwin-arm64/next-swc.darwin-arm64.node" ] &&
     [ ! -f "./node_modules/next/next-swc-fallback/@next/swc-darwin-arm64/next-swc.darwin-arm64.node" ]; then
    echo "Local Next.js SWC binary for macOS arm64 is missing."
    echo "This is a dependency-install problem, not an app-code problem."
    echo "Fix once with a network-enabled install, then rerun this script:"
    echo "  sh scripts/repair-local-deps.sh"
    exit 1
  fi
fi

./node_modules/.bin/next build --webpack
