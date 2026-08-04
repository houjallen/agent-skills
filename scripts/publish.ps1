# @easbot/agent-skills 发布脚本（Windows PowerShell）
# 由根 pnpm publish:npm:win 通过 --filter ./packages/** 自动调用
$ErrorActionPreference = "Stop"

$pkgName = "@easbot/agent-skills"
Write-Host "Publishing $pkgName" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking npm login..." -ForegroundColor Yellow
# --loglevel error 屏蔽 npm 的 info/warn 噪音，避免触发 PowerShell 的 NativeCommandError
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$npmUser = (& npm.cmd whoami --loglevel error *>&1 | Out-String).Trim()
$ErrorActionPreference = $prevEAP
if ([string]::IsNullOrWhiteSpace($npmUser)) {
    Write-Host "❌ Not logged in to npm, run: npm login" -ForegroundColor Red
    exit 1
}
Write-Host "Logged in as: $npmUser" -ForegroundColor Green
Write-Host ""

Write-Host "Building to dist..." -ForegroundColor Cyan
& pnpm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed (exit $LASTEXITCODE)" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Publishing to npm..." -ForegroundColor Cyan
& pnpm publish --access public --git-checks false --registry https://registry.npmjs.org
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Publish failed (exit $LASTEXITCODE)" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "✅ Publish successful!" -ForegroundColor Green
Write-Host "Package: https://www.npmjs.com/package/$pkgName" -ForegroundColor Cyan