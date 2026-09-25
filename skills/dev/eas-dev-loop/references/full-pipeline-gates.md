# 全流程累积 Gate (Full Pipeline Gates)

> **所属技能**：`eas-dev-loop`
> **目标**：累积 7 步 Gate + 跨步检查

---

## 累积 Gate 表

| Step | 委托技能            | Gate 类型 | Gate 内容                       | 失败策略                   |
| ---- | ------------------- | --------- | ------------------------------- | -------------------------- |
| 1    | `eas-dev-align`     | must      | alignment.md status = confirmed | 停止；询问用户是否跳过对齐 |
| 2    | `eas-dev-spec`      | must      | spec.md 通过 5 条校验           | 停止；返回校验失败项       |
| 3    | `eas-dev-design`    | should    | design.md status = confirmed    | 询问用户是否跳过设计       |
| 4    | `eas-dev-plan`      | must      | tasks.md 7 字段 + 颗粒度 [2,5]  | 停止；返回缺失字段任务     |
| 5    | `eas-dev-implement` | must      | 所有任务 review PASS            | 停止；返回失败任务         |
| 6    | `eas-dev-review`    | must      | P0 = 0；P1 修复或豁免           | 停止；返回 review.md       |
| 7    | `eas-dev-finish`    | must      | 7 步 checklist 全通过           | 停止；返回未完成项         |

## 跨步一致性检查 (Cross-Step Consistency)

除单步 Gate 外，loop 还会做**跨步一致性检查**：

| 检查项             | 检查内容                                            | 失败动作                |
| ------------------ | --------------------------------------------------- | ----------------------- |
| alignment → spec   | spec.md 中的功能完全覆盖 alignment.md 的 In-Scope   | 报错 + 列出 spec 缺失项 |
| spec → design      | design.md 的接口签名与 spec.md §3 完全一致          | 报错 + 列出偏离项       |
| spec → tasks       | tasks.md 的 acceptance_steps 完全覆盖 spec.md §4 AC | 报错 + 列出未覆盖 AC    |
| tasks → implement  | 所有任务 status = complete                          | 报错 + 列出未完成任务   |
| implement → review | 所有 review.md 状态 = PASS                          | 报错 + 列出 FAIL 任务   |
| review → finish    | spec 中 AC 全部实现 + 测试                          | 报错 + 列出 AC 缺口     |

## 累积 Gate 落地 (Accumulated Gates)

```typescript
async function checkAccumulatedGates(state: LoopState): Promise<ValidationResult> {
  // 1. alignment → spec 一致性
  const alignment = await loadMd(state.artifacts.alignment);
  const spec = await loadMd(state.artifacts.spec);
  if (!coversInScope(spec, alignment.in_scope)) {
    return { pass: false, reason: 'spec 未完全覆盖 alignment.in_scope' };
  }

  // 2. spec → tasks 一致性
  const tasks = await loadMd(state.artifacts.tasks);
  if (!coversAllAC(tasks, spec.acceptance_criteria)) {
    return { pass: false, reason: 'tasks 未覆盖 spec 所有 AC' };
  }

  // 3. tasks → implement 一致性
  if (!allTasksComplete(tasks)) {
    return { pass: false, reason: '存在未完成任务' };
  }

  // 4. implement → review 一致性
  const reviews = await loadAllReviews();
  if (reviews.some((r) => r.status !== 'PASS')) {
    return { pass: false, reason: '存在 review FAIL' };
  }

  return { pass: true };
}
```

## 进度汇报模板 (Progress Report)

每完成 N 步汇报 1 次（建议 N = 2）：

```
[Loop Progress]
✅ Step 1: align（alignment.md 已生成）
✅ Step 2: spec（spec.md 通过校验）
🔄 Step 3: design（生成中）
⏳ Step 4-7: 剩余
📊 累积：3 个 artifacts
```

---

**最后更新**：2026-08-08
