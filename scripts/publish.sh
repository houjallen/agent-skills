#!/bin/bash
# @easbot/agent-skills 发布脚本（Unix / macOS / Git Bash）
# 由根 pnpm publish:npm 通过 --filter ./packages/** 自动调用
set -euo pipefail

PKG_NAME="@easbot/agent-skills"
echo "Publishing ${PKG_NAME}"
echo "================================"
echo ""

echo "Checking npm login..."
NPM_USER="$(npm whoami --loglevel error 2>/dev/null || true)"
if [ -z "${NPM_USER}" ]; then
  echo "❌ Not logged in to npm, run: npm login" >&2
  exit 1
fi
echo "Logged in as: ${NPM_USER}"
echo ""

echo "Building to dist..."
pnpm run build

echo "Publishing to npm..."
pnpm publish --access public --git-checks false --registry https://registry.npmjs.org

echo ""
echo "✅ Publish successful!"
echo "Package: https://www.npmjs.com/package/${PKG_NAME}"