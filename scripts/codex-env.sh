#!/bin/sh

CODEX_RUNTIME="${CODEX_RUNTIME:-/Users/rw/.cache/codex-runtimes/codex-primary-runtime/dependencies}"

if [ -d "${CODEX_RUNTIME}/node/bin" ]; then
  PATH="${CODEX_RUNTIME}/node/bin:${PATH}"
fi

if [ -d "${CODEX_RUNTIME}/bin" ]; then
  PATH="${CODEX_RUNTIME}/bin:${PATH}"
fi

export PATH

if [ -z "${PNPM_HOME:-}" ]; then
  export PNPM_HOME="/private/tmp/airline-fees-pnpm-home"
fi

if [ -z "${XDG_CACHE_HOME:-}" ]; then
  export XDG_CACHE_HOME="/private/tmp/airline-fees-pnpm-cache"
fi

if [ -z "${PNPM_STORE_PATH:-}" ]; then
  export PNPM_STORE_PATH="/private/tmp/airline-fees-pnpm-store"
fi

mkdir -p "${PNPM_HOME}" "${XDG_CACHE_HOME}" "${PNPM_STORE_PATH}"
PATH="${PNPM_HOME}:${PATH}"
export PATH

export NEXT_TELEMETRY_DISABLED=1
