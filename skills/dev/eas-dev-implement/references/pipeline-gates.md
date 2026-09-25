# Pipeline Gates 详解 (Pipeline Gates Details)

> **所属技能**：`eas-dev-implement`
> **目标**：详细解释 Pipeline 入口 / 出口 / 失败策略

---

## 入口 Gate (Entry Gate)

**校验时机**：Pipeline 启动时

### 必须通过项

| 项                         | 校验内容                                                                               | 失败动作                   |
| -------------------------- | -------------------------------------------------------------------------------------- | -------------------------- |
| tasks.md 存在              | 文件可读                                                                               | 报错"无任务清单"           |
| 每任务 7 字段齐全          | id / title / prerequisites / acceptance_steps / code_paths / estimated_minutes / risks | 报错 + 返回缺失字段任务 ID |
| estimated_minutes ∈ [2, 5] | 每任务                                                                                 | 报错 + 返回超颗粒度任务 ID |
| 任务依赖无循环             | DAG 检查                                                                               | 报错 + 返回循环路径        |
| spec.md 存在               | 文件可读                                                                               | 报错"无 spec 无法 review"  |

### 校验脚本（伪代码）

```typescript
async function checkEntryGate(): Promise<ValidationResult> {
  const tasks = await loadTasksMd();
  if (!tasks) return { pass: false, reason: 'tasks.md 缺失' };

  for (const task of tasks) {
    const missing = REQUIRED_FIELDS.filter((f) => !task[f]);
    if (missing.length > 0) {
      return { pass: false, reason: `任务 ${task.id} 缺失字段：${missing}` };
    }
    if (task.estimated_minutes < 2 || task.estimated_minutes > 5) {
      return {
        pass: false,
        reason: `任务 ${task.id} 颗粒度超界（${task.estimated_minutes} 分钟）`,
      };
    }
  }

  if (hasCyclicDependency(tasks)) {
    return { pass: false, reason: '任务依赖存在循环' };
  }

  if (!(await fileExists('spec.md'))) {
    return { pass: false, reason: 'spec.md 缺失（review 阶段必需）' };
  }

  return { pass: true };
}
```

## 出口 Gate (Exit Gate)

**校验时机**：所有任务执行完成后

### 必须通过项

| 项                               | 校验内容             |
| -------------------------------- | -------------------- |
| 所有任务 status = complete       | tasks.md frontmatter |
| 所有任务 review.md status = PASS | 每个 review.md       |
| 所有 review P0 = 0               | 每个 review.md       |

### 状态更新

tasks.md frontmatter 更新：

```yaml
status: complete
completed_at: <YYYY-MM-DD>
total_tasks: <N>
completed_tasks: <N>
pipeline_summary:
  total_steps: <N × 3>
  total_commits: <N>
  total_duration_minutes: <估算>
```

## 失败策略 (Failure Strategy)

### 失败分类

| 失败类型                                                | 处理                                             |
| ------------------------------------------------------- | ------------------------------------------------ |
| **入口 Gate 失败**                                      | 停止；返回错误；NEVER 进入 Step 1                |
| **Step Gate 失败**（load / execute / review / advance） | 停止 pipeline；返回失败步骤 + 错误详情；保存状态 |
| **出口 Gate 失败**                                      | 停止；返回缺失 review 的任务列表                 |

### 状态保存

tasks.md frontmatter 失败状态：

```yaml
status: failed
last_failure:
  task_id: <T-XXX>
  step: <load-tasks | execute-task | review-task | advance-task>
  reason: <错误描述>
  failed_at: <YYYY-MM-DD>
  recovery_hint: <如何恢复>
```

### 恢复流程

1. 用户读 tasks.md frontmatter 找到 `last_failure`
2. 根据 `recovery_hint` 修复问题
3. 重新调用 `eas-dev-implement`
4. Pipeline 从失败点继续（**不重做已通过的任务**）

### 重试规则（§13.6.2 Missing Failure Handling）

```
if action_failed:
    next_action != same_action  # 不重试相同动作
```

**实现**：

- 同一任务失败后 → 必报错；用户决策后才可重试
- 不同任务失败 → 各自处理
- 必不"自动重试 3 次"（违反 §13.6.2 反模式）

## 进度回报 (Progress Reporting)

**规则**：

- 每完成 N 任务回报 1 次（建议 N = 3）
- 回报内容：已完成 / 进行中 / 剩余 / 累计 commits
- 不回报 ≠ 静默；用户可主动查询

**示例回报**：

```
[Pipeline Progress]
✅ 已完成：T-001, T-002, T-003
🔄 进行中：T-004（绿灯阶段）
⏳ 剩余：T-005, T-006, T-007
📊 累计：3 commits, ~9 minutes
```

## 状态机 (State Machine)

```
[Idle]
  ↓ 加载 tasks.md
[Validating Entry]  → ❌ [Failed Entry]
  ↓ ✅
[Loading Tasks]    → ❌ [Failed Loading]
  ↓ ✅
[Executing Task N]  → ❌ [Failed Execution]
  ↓ ✅
[Reviewing Task N]  → ❌ [Failed Review] (P0 > 0)
  ↓ ✅ (P0 = 0)
[Advancing]
  ├─ 剩余任务 > 0 → 回到 [Executing Task N+1]
  └─ 剩余任务 = 0 → [Validating Exit]
       ↓ ✅
       [Complete]
       ↓ ❌
       [Failed Exit]
```

---

**最后更新**：2026-08-08
