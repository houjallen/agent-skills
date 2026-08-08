# 中断恢复机制 (Interrupt & Resume)

> **所属技能**：`eas-dev-loop`
> **目标**：支持长流程中断后可恢复继续

---

## 核心思想

长流程（如完整开发闭环）可能跨越多个会话 / 数小时。**中断恢复**让流程在任意点中断后，下次启动可从失败点继续，不必从头开始。

## 状态文件

**路径**：`<cwd>/.easbot/state/dev-loop-<topic>.json`

**Schema**：

```json
{
  "loop_id": "search-feature-2026-08-08T2130",
  "topic": "搜索功能",
  "started_at": "2026-08-08T21:30:00Z",
  "updated_at": "2026-08-08T22:15:00Z",
  "status": "in_progress | completed | failed",
  "current_step": "implement",
  "current_step_progress": "T-003/10",
  "completed_steps": ["align", "spec", "design", "plan"],
  "artifacts": {
    "alignment": "alignment.md",
    "spec": "spec.md",
    "design": "design.md",
    "tasks": "tasks.md"
  },
  "step_outputs": {
    "implement": {
      "completed_tasks": ["T-001", "T-002", "T-003"],
      "remaining_tasks": ["T-004", "T-005", "T-006"]
    }
  },
  "last_failure": null,
  "config": {
    "skip_design": false,
    "auto_resume": true
  }
}
```

## 何时保存状态

| 触发时机 | 动作 |
|---|---|
| 每步开始 | 保存 `current_step` |
| 每步完成 | 保存 `completed_steps` + 产出路径 |
| 每子步完成（如 implement 单任务） | 保存 `step_outputs` |
| 任一 Gate 失败 | 保存 `last_failure` |
| 用户主动停止 | 保存状态 + 标记 `status: paused` |

## 恢复流程

### 检测机制

Loop 启动时 MUST 检查：

```typescript
async function checkResume(): Promise<LoopState | null> {
  const stateFile = ".easbot/dev-loop-state.json";
  if (await fileExists(stateFile)) {
    const state = await readJson(stateFile);
    if (state.status === "in_progress" || state.status === "paused") {
      return state;
    }
  }
  return null;
}
```

### 恢复逻辑

```typescript
if (resumeState) {
  // 找到第一个未完成的步骤
  const nextStep = findNextStep(resumeState.completed_steps, ALL_STEPS);
  // 从该步骤继续
  return continueFrom(nextStep, resumeState);
} else {
  // 全新流程
  return startNew();
}
```

### 用户确认

**MUST** 询问用户：

```
检测到未完成的 loop 任务：
- loop_id: search-feature-2026-08-08T21:30
- 上次进度：完成 align/spec/design/plan；implement 进行到 T-003/10
- 上次停止：2026-08-08 22:15

选项：
1. 从 T-004 继续（推荐）
2. 重新开始（丢弃历史）
3. 查看详细状态后决定
```

## 失败恢复

如果 `status = failed`：

```typescript
if (resumeState.status === "failed") {
  return askUser({
    question: `Loop 在 Step ${resumeState.last_failure.step} 失败`,
    options: [
      { id: "retry", label: `重试 Step ${resumeState.last_failure.step}` },
      { id: "fix-and-resume", label: "修复问题后继续" },
      { id: "abort", label: "中止；清理状态文件" }
    ]
  });
}
```

## 状态文件生命周期

| 阶段 | 状态 |
|---|---|
| 启动 | `in_progress` |
| 正常完成 | `completed`（保留 N 天后清理） |
| 用户主动停止 | `paused`（保留 N 天后清理） |
| Gate 失败 | `failed`（保留 N 天后清理） |
| 启动新 loop | 创建新文件（old loop 归档） |

## 状态文件清理

- **自动**：完成 / 中止 N 天后（建议 N = 7）
- **手动**：`rm .easbot/dev-loop-state.json`
- **归档**：`.easbot/dev-loop-archive/<loop_id>.json`

## 与其他工具的协作

| 工具 | 协作方式 |
|---|---|
| `eas-planning-writer` | loop 可调用 planning-writer 做长任务拆分 |
| Git | 状态文件 MUST `.gitignore`（不进版本控制） |
| CI | 状态文件不进 build artifact |

## 状态文件 .gitignore

```gitignore
# Dev Loop 状态（不进版本控制）
.easbot/dev-loop-state.json
.easbot/dev-loop-archive/
```

---

**最后更新**：2026-08-08