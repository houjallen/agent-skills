# @easbot/agent-skills publish script (Windows PowerShell)
# 手动发布脚本：在仓库根目录运行。
# 不做 build（仓库无构建产物）；发布前先校验全部 SKILL.md。
$ErrorActionPreference = "Stop"

Write-Host "Publishing @easbot/agent-skills" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1) 校验根目录
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 错误: 请在仓库根目录运行（缺少 package.json）" -ForegroundColor Red
    exit 1
}

# 2) 校验 package name 正确
$expectedName = "@easbot/agent-skills"
try {
    $actualName = node -p "require('./package.json').name" 2>$null
} catch {
    $actualName = ""
}
if ($actualName -ne $expectedName) {
    Write-Host "❌ 错误: package.json.name 应该是 $expectedName，实际是 $actualName" -ForegroundColor Red
    exit 1
}

# 3) 校验所有 SKILL.md（必跑）
Write-Host "🔍 校验全部 skills 结构..." -ForegroundColor Cyan
$failCount = 0
$skillDirs = @()
$skillDirs += Get-ChildItem -Directory "skills\builtin" -ErrorAction SilentlyContinue
$skillDirs += Get-ChildItem -Directory "skills\tools" -ErrorAction SilentlyContinue

foreach ($dir in $skillDirs) {
    $skillMd = Join-Path $dir.FullName "SKILL.md"
    if (-not (Test-Path $skillMd)) { continue }
    Write-Host "  - $($dir.Name)"
    $output = npx --no-install tsx skills/builtin/eas-skill-creator/scripts/quick-validate.ts $dir.FullName 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "    ❌ FAIL: $($dir.Name)" -ForegroundColor Red
        $failCount++
    }
}
if ($failCount -gt 0) {
    Write-Host ""
    Write-Host "❌ 共 $failCount 个技能未通过 quick-validate，发布中止" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 全部 skills 通过 quick-validate" -ForegroundColor Green
Write-Host ""

# 4) 校验 npm 登录
Write-Host "🔐 校验 npm 登录..." -ForegroundColor Yellow
try {
    $npmOutput = npm whoami 2>&1 | Out-String
} catch {
    $npmOutput = ""
}
$npmUser = ""
$npmLines = $npmOutput -split "`n"
foreach ($line in $npmLines) {
    $line = $line.Trim()
    if ($line -match '^[a-zA-Z][a-zA-Z0-9_-]*$') {
        $npmUser = $line
        break
    }
}
if ([string]::IsNullOrWhiteSpace($npmUser)) {
    Write-Host "❌ 未登录 npm，请先运行: npm login" -ForegroundColor Red
    exit 1
}
Write-Host "   登录身份: $npmUser" -ForegroundColor Green
Write-Host ""

# 5) 警告 dist 存在
if (Test-Path "dist") {
    Write-Host "⚠️  警告: 检测到 dist/ 目录，按 AGENTS.md §1 仓库不应有构建产物" -ForegroundColor Yellow
    Write-Host "   如确认是合理的发布物，请忽略此警告" -ForegroundColor Yellow
}

# 6) 发布
$version = node -p "require('./package.json').version"
Write-Host "📦 发布 @easbot/agent-skills@$version 到 https://registry.npmjs.org ..." -ForegroundColor Cyan
npm publish --access public --git-checks false --registry https://registry.npmjs.org

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ 发布成功" -ForegroundColor Green
    Write-Host "   Package: https://www.npmjs.com/package/@easbot/agent-skills" -ForegroundColor Cyan
    Write-Host "   Version: $version" -ForegroundColor Cyan
} else {
    Write-Host "❌ 发布失败" -ForegroundColor Red
    exit 1
}
