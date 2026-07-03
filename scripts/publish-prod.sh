#!/bin/sh
set -eu

BRANCH="${1:-master}"
REPO_SSH="git@github.com:rwhonyaku/airline-fees-reference.git"

. "$(dirname "$0")/codex-env.sh"

echo "Publishing ${BRANCH}..."

GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o GlobalKnownHostsFile=/dev/null -o LogLevel=ERROR" git push "${REPO_SSH}" "HEAD:${BRANCH}"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Bundled pnpm is not available. Codex runtime path may have changed."
  exit 1
fi

env -u VERCEL_TOKEN pnpm dlx vercel@latest deploy --prod --yes
