# 检查 task_plan.md 中的所有阶段是否完成
# 始终退出 0 — 使用 stdout 进行状态报告
# 由 Stop hook 使用以报告任务完成状态

param(
    [string]$PlanFile = "task_plan.md"
)

if (-not (Test-Path $PlanFile)) {
    Write-Host "[eas-planning-writer] No task_plan.md found — no active planning session."
    exit 0
}

# Read file content
$content = Get-Content $PlanFile -Raw

# Count total phases
$TOTAL = ([regex]::Matches($content, "### Phase")).Count

# Check for **Status:** format first
$COMPLETE = ([regex]::Matches($content, "\*\*Status:\*\* complete")).Count
$IN_PROGRESS = ([regex]::Matches($content, "\*\*Status:\*\* in_progress")).Count
$PENDING = ([regex]::Matches($content, "\*\*Status:\*\* pending")).Count

# Fallback: check for [complete] inline format if **Status:** not found
if ($COMPLETE -eq 0 -and $IN_PROGRESS -eq 0 -and $PENDING -eq 0) {
    $COMPLETE = ([regex]::Matches($content, "\[complete\]")).Count
    $IN_PROGRESS = ([regex]::Matches($content, "\[in_progress\]")).Count
    $PENDING = ([regex]::Matches($content, "\[pending\]")).Count
}

# Report status (always exit 0 — incomplete task is a normal state)
if ($COMPLETE -eq $TOTAL -and $TOTAL -gt 0) {
    Write-Host "[eas-planning-writer] ALL PHASES COMPLETE ($COMPLETE/$TOTAL)"
} else {
    Write-Host "[eas-planning-writer] Task in progress ($COMPLETE/$TOTAL phases complete)"
    if ($IN_PROGRESS -gt 0) {
        Write-Host "[eas-planning-writer] $IN_PROGRESS phase(s) still in progress."
    }
    if ($PENDING -gt 0) {
        Write-Host "[eas-planning-writer] $PENDING phase(s) pending."
    }
}
exit 0
