#!/bin/sh
set -eu

BRANCH="${1:-master}"
REPO_SSH="git@github.com:rwhonyaku/airline-fees-reference.git"

echo "Publishing ${BRANCH}..."

GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=accept-new" git push "${REPO_SSH}" "HEAD:${BRANCH}"

if command -v vercel >/dev/null 2>&1; then
  vercel deploy --prod --yes
elif command -v pnpm >/dev/null 2>&1; then
  pnpm dlx vercel@latest deploy --prod --yes
elif command -v npx >/dev/null 2>&1; then
  npx vercel@latest deploy --prod --yes
else
  echo "Vercel CLI is not available. Install it once with: npm i -g vercel"
  exit 1
fi
