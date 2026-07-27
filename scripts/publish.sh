#!/bin/bash
# @easbot/agent-skills publish script (POSIX shell)
# 手动发布脚本：在仓库根目录运行。
# 不做 build（仓库无构建产物）；发布前先校验全部 SKILL.md。
set -e

echo "Publishing @easbot/agent-skills"
echo "================================"
echo ""

# 1) 校验根目录
if [ ! -f "package.json" ]; then
  echo "❌ 错误: 请在仓库根目录运行（缺少 package.json）" >&2
  exit 1
fi

# 2) 校验 package name 正确
EXPECTED_NAME="@easbot/agent-skills"
ACTUAL_NAME=$(node -p "require('./package.json').name" 2>/dev/null || echo "")
if [ "$ACTUAL_NAME" != "$EXPECTED_NAME" ]; then
  echo "❌ 错误: package.json.name 应该是 $EXPECTED_NAME，实际是 $ACTUAL_NAME" >&2
  exit 1
fi

# 3) 校验所有 SKILL.md（必跑）
echo "🔍 校验全部 skills 结构..."
fail=0
for s in skills/builtin/*/ skills/tools/*/; do
  [ -f "$s/SKILL.md" ] || continue
  echo "  - $s"
  if ! npx --no-install tsx skills/builtin/eas-skill-creator/scripts/quick-validate.ts "$s" >/dev/null 2>&1; then
    echo "    ❌ FAIL: $s"
    fail=$((fail+1))
  fi
done
if [ "$fail" -gt 0 ]; then
  echo "" >&2
  echo "❌ 共 $fail 个技能未通过 quick-validate，发布中止" >&2
  exit 1
fi
echo "✅ 全部 skills 通过 quick-validate"
echo ""

# 4) 校验 npm 登录
echo "🔐 校验 npm 登录..."
if ! npm_output=$(npm whoami 2>&1) || ! echo "$npm_output" | grep -qE '^[a-zA-Z][a-zA-Z0-9_-]*$'; then
  echo "❌ 未登录 npm，请先运行: npm login" >&2
  exit 1
fi
echo "   登录身份: $(echo "$npm_output" | grep -E '^[a-zA-Z]' | head -1)"
echo ""

# 5) 确认 dist 不存在（仓库无构建产物）
if [ -d "dist" ]; then
  echo "⚠️  警告: 检测到 dist/ 目录，按 AGENTS.md §1 仓库不应有构建产物" >&2
  echo "   如确认是合理的发布物，请忽略此警告" >&2
fi

# 6) 发布
VERSION=$(node -p "require('./package.json').version")
echo "📦 发布 @easbot/agent-skills@$VERSION 到 https://registry.npmjs.org ..."
npm publish --access public --git-checks false --registry https://registry.npmjs.org

echo ""
echo "✅ 发布成功"
echo "   Package: https://www.npmjs.com/package/@easbot/agent-skills"
echo "   Version: $VERSION"
