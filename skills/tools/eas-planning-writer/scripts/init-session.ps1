# 为新会话初始化规划文件
# 用法: .\init-session.ps1 [project-name]

param(
    [string]$ProjectName = "project"
)

$DATE = Get-Date -Format "yyyy-MM-dd"

Write-Host "初始化规划文件: $ProjectName"

# Create task_plan.md if it doesn't exist
if (-not (Test-Path "task_plan.md")) {
    @"
# Task Plan: [Brief Description]

## Goal
[One sentence describing the end state]

## Current Phase
Phase 1

## Phases

### Phase 1: Requirements & Discovery
- [ ] Understand user intent
- [ ] Identify constraints
- [ ] Document in findings.md
- **Status:** in_progress

### Phase 2: Planning & Structure
- [ ] Define approach
- [ ] Create project structure
- **Status:** pending

### Phase 3: Implementation
- [ ] Execute the plan
- [ ] Write to files before executing
- **Status:** pending

### Phase 4: Testing & Verification
- [ ] Verify requirements met
- [ ] Document test results
- **Status:** pending

### Phase 5: Delivery
- [ ] Review outputs
- [ ] Deliver to user
- **Status:** pending

## Decisions Made
| Decision | Rationale |
|----------|-----------|

## Errors Encountered
| Error | Resolution |
|-------|------------|
"@ | Out-File -FilePath "task_plan.md" -Encoding UTF8
    Write-Host "创建 task_plan.md"
} else {
    Write-Host "task_plan.md 已存在，跳过"
}

# Create findings.md if it doesn't exist
if (-not (Test-Path "findings.md")) {
    @"
# Findings & Decisions

## Requirements
-

## Research Findings
-

## Technical Decisions
| Decision | Rationale |
|----------|-----------|

## Issues Encountered
| Issue | Resolution |
|-------|------------|

## Resources
-
"@ | Out-File -FilePath "findings.md" -Encoding UTF8
    Write-Host "创建 findings.md"
} else {
    Write-Host "findings.md 已存在，跳过"
}

# Create progress.md if it doesn't exist
if (-not (Test-Path "progress.md")) {
    @"
# Progress Log

## Session: $DATE

### Current Status
- **Phase:** 1 - Requirements & Discovery
- **Started:** $DATE

### Actions Taken
-

### Test Results
| Test | Expected | Actual | Status |
|------|----------|--------|--------|

### Errors
| Error | Resolution |
|-------|------------|
"@ | Out-File -FilePath "progress.md" -Encoding UTF8
    Write-Host "创建 progress.md"
} else {
    Write-Host "progress.md 已存在，跳过"
}

Write-Host ""
Write-Host "规划文件初始化完成!"
Write-Host "文件: task_plan.md, findings.md, progress.md"
