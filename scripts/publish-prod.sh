#!/bin/sh
set -eu

BRANCH="${1:-master}"
REPO_SSH="git@github.com:rwhonyaku/airline-fees-reference.git"
CODEX_RUNTIME="/Users/rw/.cache/codex-runtimes/codex-primary-runtime/dependencies"

if [ -d "${CODEX_RUNTIME}/node/bin" ]; then
  PATH="${CODEX_RUNTIME}/node/bin:${PATH}"
fi

if [ -d "${CODEX_RUNTIME}/bin" ]; then
  PATH="${CODEX_RUNTIME}/bin:${PATH}"
fi

export PATH

echo "Publishing ${BRANCH}..."

GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o GlobalKnownHostsFile=/dev/null -o LogLevel=ERROR" git push "${REPO_SSH}" "HEAD:${BRANCH}"

if command -v vercel >/dev/null 2>&1; then
  vercel deploy --prod --yes
elif command -v pnpm >/dev/null 2>&1; then
  pnpm dlx vercel@latest deploy --prod --yes
elif command -v npx >/dev/null 2>&1; then
  npx vercel@latest deploy --prod --yes
else
  echo "Vercel CLI is not available, and no Node package runner was found."
  exit 1
fi
