---
name: eas-dev-implement
description: 该技能应在用户要求基于 tasks.md 自动调度执行（"按计划实现" / "execute" / "开始干" / "implement" / "自动跑任务"）时使用。Pipeline 模式：调度单任务级 plan → tdd → review 闭环。内部委托 `eas-dev-plan` / `eas-dev-tdd` / `eas-dev-review` 完成执行，自身仅做调度与失败处理。
mode: Pipeline
composition: standalone
behavior:
  sequence:
    steps:
      - id: load-tasks
        name: 加载 tasks.md
        delegate_skill: eas-dev-plan
        gate:
          rule: "tasks.md MUST 存在且每任务 7 字段齐全"
          severity: must
      - id: execute-task
        name: 执行当前任务（按依赖顺序）
        delegate_skill: eas-dev-tdd
        gate:
          rule: "TDD 3 步 MUST 全部通过（红 → 绿 → 重构）"
          severity: must
      - id: review-task
        name: 评审当前任务
        delegate_skill: eas-dev-review
        gate:
          rule: "P0 = 0 才进入下一任务；P1 修复或显式豁免"
          severity: must
      - id: advance-task
        name: 推进到下一任务
        gate:
          rule: "前 3 步全通过；剩余任务 > 0"
          severity: must
  pipeline_gates:
    entry: "tasks.md 存在且 7 字段齐全"
    exit: "所有任务执行完成 + 全部 review PASS"
    failure_strategy: "返回失败任务 ID + 错误详情；状态保存到 tasks.md frontmatter"
metadata:
  category: dev
  version: 1.0.0
  author: EASBot
  compatibility: claude-code / codex / gemini-cli / 其他支持 Skill 协议的 Agent
  tags:
    - eas-dev
    - pipeline
    - implement
    - orchestration
    - tdd-loop
---

# eas-dev-implement - 实现驱动 (Implementation Driver)

> **分类位置**：`skills/dev/`（独立 dev 分类，**不**进 `eas-skill-using` 索引）
> **必填字段**：`name` / `description` / `mode=Pipeline` / `composition=standalone` / `behavior.sequence.steps` (4 step) / `behavior.pipeline_gates` (entry/exit/failure) / `metadata.category=dev`
> **对应规划任务**：T-006 / 0014 决策

---

## 概述 (Overview)

`eas-dev-implement` 是**调度器**，不是实现者。Pipeline 模式：按依赖顺序逐任务执行"plan 加载 → tdd 实现 → review 评审"闭环。**内部委托**给 `eas-dev-plan` / `eas-dev-tdd` / `eas-dev-review`，自身只管调度 + 状态保存 + 失败处理。

**不做什么**：

- ❌ 不写代码（代码由 `eas-dev-tdd` 实现）
- ❌ 不拆任务（任务由 `eas-dev-plan` 拆）
- ❌ 不评审（评审由 `eas-dev-review` 评）
- ❌ 不并行执行（任务顺序执行；如需并行 = 拆 sub-agent 调用）

## 何时使用 (When to Use)

**该技能应在以下情况使用**：

- 用户说 "按计划实现" / "execute" / "开始干" / "implement" / "自动跑任务"
- tasks.md 已确认，需进入实现阶段
- 多任务自动调度（避免手动逐任务调用）
- CI/CD 自动化场景

**不适用于**：

- ❌ tasks.md 未确认（先回 `eas-dev-plan`）
- ❌ 单个任务手动调试（直接用 `eas-dev-tdd`）
- ❌ 紧急 hotfix（不走 plan/tasks）
- ❌ 一次性脚本 / 配置修改

## 快速参考 (Quick Reference)

| 项 | 内容 |
|---|---|
| 模式 | Pipeline（4 步调度序列） |
| 输入契约 | `tasks.md`（每任务 7 字段齐全） |
| 输出契约 | 完整代码 + 测试 + commit + tasks.md 状态更新 |
| 调度步骤 | load → execute → review → advance（`behavior.sequence.steps`） |
| 委托技能 | `eas-dev-plan` / `eas-dev-tdd` / `eas-dev-review` |
| Pipeline Gate | 入口（tasks 存在）/ 出口（全部 PASS）/ 失败（返回错误详情） |
| 必读 references | [references/pipeline-gates.md](references/pipeline-gates.md) |
| 失败处理 | 返回失败任务 ID + 错误详情；不静默重试 |

## 第一性原理 (First Principles)

> **"节奏 > 强度"** —— Pragmatic Programmer；稳定的"小步前进"胜于偶发"大步流星"

**目的**：

1. **自动化重复**：避免手动逐任务调度
2. **状态可恢复**：中断后可从失败点继续
3. **失败可见**：每步 Gate 失败 MUST 报错

**反模式**：

- ❌ "一次跑完所有任务"（无反馈 = 无质量保证）
- ❌ "失败时静默重试"（违反 §13.6.2 Missing Failure Handling）
- ❌ "跳过 review 直接下一任务"（P0 可能进入主分支）

## 4 步调度序列 (Four-Step Sequence)

### Step 1: load-tasks（加载 tasks.md）

**委托**：`eas-dev-plan`

**动作**：

1. 读取 tasks.md
2. 解析每任务的 7 字段
3. 校验：所有任务 estimated_minutes ∈ [2, 5]
4. 校验：任务依赖无循环
5. 找到第一个 prerequisites 为 `[]` 的任务

**Gate**：

```yaml
gate:
  rule: "tasks.md MUST 存在且每任务 7 字段齐全"
  severity: must
```

**失败**：报错 + 返回缺失字段任务 ID

### Step 2: execute-task（执行当前任务）

**委托**：`eas-dev-tdd`

**动作**：

1. 调用 `eas-dev-tdd` 加载 tasks.md 当前任务
2. 走 TDD 3 步（红 → 绿 → 重构）
3. 收集 commit 历史

**Gate**：

```yaml
gate:
  rule: "TDD 3 步 MUST 全部通过（红 → 绿 → 重构）"
  severity: must
```

**失败**：返回失败步骤 + 错误详情；不进入 review

### Step 3: review-task（评审当前任务）

**委托**：`eas-dev-review`

**动作**：

1. 调用 `eas-dev-review` 加载代码 diff + spec.md
2. 走两轴评审（标准 + spec）
3. 输出 review.md

**Gate**：

```yaml
gate:
  rule: "P0 = 0 才进入下一任务；P1 修复或显式豁免"
  severity: must
```

**失败**：

- P0 > 0 → 返回 review.md；状态 = FAIL；停止 pipeline
- P1 > 0 且未豁免 → 返回 review.md；要求修复

### Step 4: advance-task（推进到下一任务）

**动作**：

1. 标记当前任务完成（在 tasks.md frontmatter 更新 `status`）
2. 找到下一个未完成任务
3. 回到 Step 2

**Gate**：

```yaml
gate:
  rule: "前 3 步全通过；剩余任务 > 0"
  severity: must
```

**结束条件**：所有任务完成 → pipeline exit gate

## Pipeline Gates

详见 [references/pipeline-gates.md](references/pipeline-gates.md)

### 入口 Gate

- tasks.md 存在
- 每任务 7 字段齐全
- 任务依赖无循环

### 出口 Gate

- 所有任务完成
- 所有任务 review PASS（P0 = 0）
- tasks.md frontmatter `status: complete`

### 失败策略

- 任一 Gate 失败 → 停止 pipeline
- 返回失败任务 ID + 错误详情
- 状态保存到 tasks.md frontmatter `last_failure`
- **NEVER 静默重试**

## 输入契约 (Input Contract)

| 项 | 要求 |
|---|---|
| 必备 | `tasks.md`（每任务 7 字段齐全） |
| 必备 | `spec.md`（review 阶段必需） |
| 可选 | `design.md`（review 阶段可选） |
| 拒绝 | tasks.md 缺失或 spec.md 缺失（NEVER） |

## 输出契约 (Output Contract)

- **代码变更**：每任务 1 个 commit（或合并为合规 commit）
- **测试**：每个任务的测试随 commit 落地
- **review.md**：每个任务的评审报告
- **tasks.md 更新**：frontmatter `status: complete` + `completed_at`

## 失败处理 (Failure Handling)

| 情况 | 动作 |
|---|---|
| tasks.md 缺失 | 报错"无任务清单"；停止 |
| 任务 7 字段缺失 | 报错 + 返回缺失字段；停止 |
| TDD 某步失败 | 返回失败步骤 + 错误；停止 |
| Review P0 > 0 | 返回 review.md；停止 |
| Review P1 > 0 且未豁免 | 返回 review.md；要求修复 |
| Review P2 > 0 | 记录到 review.md；继续（不阻止） |
| 任务循环依赖 | 报错；停止 |

## 常见错误 (Common Mistakes)

| ❌ 不要 | ✅ 应该 |
|---|---|
| 跳过 review 直接下一任务 | 必走 review；P0 阻止合入 |
| 失败时静默重试 | 必报错 + 停止；等待用户决策 |
| 并行执行任务 | 顺序执行；并行 = 拆 sub-agent |
| 自动修复 review 问题 | 仅记录；修复由用户 / 后续任务处理 |
| pipeline 跑超 1 小时无反馈 | 进度回报（每完成 N 任务回报 1 次） |

## 下一步 (Next Steps)

| 下游技能 / 动作 | 何时使用 |
|---|---|
| `eas-dev-finish` | 所有任务完成 + review PASS 后进入收尾 |
| 修复失败任务 | pipeline 停止后；按返回的错误详情修复 |
| 用户决策豁免 | P1 豁免时由用户裁决 |

## 参考资料 (References)

- [references/pipeline-gates.md](references/pipeline-gates.md) —— Pipeline Gates 详解

## 与其他技能的关系 (Relationships)

| 技能 | 关系 |
|---|---|
| `eas-dev-plan` | **委托**：execute-task 前加载任务 |
| `eas-dev-tdd` | **委托**：每个任务的实现 |
| `eas-dev-review` | **委托**：每个任务的评审 |
| `eas-dev-finish` | **下游**：所有任务完成后进入收尾 |
| `eas-dev-loop` | **上游**：loop 内调度 implement |
| `eas-skill-creator` | **规范基线**：本技能遵循其结构 + 5 大模式 + frontmatter 规范 |
| `eas-skill-using` | **不重叠**：dev 分类不进索引 |

---

**最后更新**：2026-08-08