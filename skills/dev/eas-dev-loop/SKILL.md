---
name: eas-dev-loop
description: 该技能应在用户明确要求"一站式全流程"时（"一站式开发" / "全自动流程" / "loop" / "从头到尾跑一遍"）使用。Pipeline 编排器：按顺序调用 align → spec → design → plan → implement → review → finish 全套技能，跑完整开发闭环。**默认不加载**；仅在用户**明确**要求时启用（避免 mattpocock 反模式警告"全流程托管"）。
mode: Pipeline
composition: orchestrator
scope: coder
behavior:
  default_load: false
  sequence:
    steps:
      - id: align
        name: 对齐 / 头脑风暴
        delegate_skill: eas-dev-align
        gate:
          rule: 'alignment.md status = confirmed'
          severity: must
      - id: spec
        name: 规格化
        delegate_skill: eas-dev-spec
        gate:
          rule: 'spec.md 通过 5 条校验规则'
          severity: must
      - id: design
        name: 架构设计（可选）
        delegate_skill: eas-dev-design
        gate:
          rule: 'design.md status = confirmed（如启用）'
          severity: should
      - id: plan
        name: 任务拆解
        delegate_skill: eas-dev-plan
        gate:
          rule: 'tasks.md 每任务 7 字段齐全 + 颗粒度 [2, 5]'
          severity: must
      - id: implement
        name: 实现驱动
        delegate_skill: eas-dev-implement
        gate:
          rule: '所有任务 review PASS'
          severity: must
      - id: review
        name: 整体评审
        delegate_skill: eas-dev-review
        gate:
          rule: 'P0 = 0；P1 修复或豁免'
          severity: must
      - id: finish
        name: 收尾发布
        delegate_skill: eas-dev-finish
        gate:
          rule: '7 步 checklist 全通过'
          severity: must
  strong_constraints:
    - id: default-not-loaded
      text: '默认不加载；仅在用户明确要求时启用'
      severity: must
    - id: delegate-not-redo
      text: '内部 MUST 委托独立技能；NEVER 重复实现独立技能的功能'
      severity: must
  interrupt_resume:
    enabled: true
    state_storage: '<cwd>/.easbot/state/dev-loop-<topic>.json'
    recoverable_steps: all
metadata:
  category: dev
  version: 1.0.0
  author: EASBot
  compatibility: claude-code / codex / gemini-cli / 其他支持 Skill 协议的 Agent
  tags:
    - eas-dev
    - pipeline
    - orchestrator
    - full-loop
    - end-to-end
---

# eas-dev-loop - 全流程编排 (Full Development Loop)

> **分类位置**：`skills/dev/`（独立 dev 分类，**不**进 `eas-skill-using` 索引）
> **必填字段**：`name` / `description` / `mode=Pipeline` / `composition=orchestrator` / `behavior.default_load=false` / `behavior.sequence.steps` (7 step) / `behavior.strong_constraints` (2 MUST) / `behavior.interrupt_resume` / `metadata.category=dev`
> **对应规划任务**：T-010 / 0014 决策

---

## 概述 (Overview)

`eas-dev-loop` 是 9 个独立技能的**编排器**。Pipeline 模式：按顺序调用 align → spec → design（可选）→ plan → implement → review → finish，跑完整开发闭环。**默认不加载**；仅在用户明确要求时启用。

**核心原则**："工具为人所用，不反过来"（mattpocock §反模式警告）—— orchestrator 是辅助，不是替代。

**不做什么**：

- ❌ **默认不加载**——避免"全流程托管"反模式
- ❌ 不重复实现独立技能的功能（必委托）
- ❌ 不强制用户使用（用户优先用独立技能）
- ❌ 不跳过失败 Gate（任一失败 → 停止）

## 何时使用 (When to Use)

**该技能应在以下情况使用**：

- 用户**明确**要求 "一站式开发" / "全自动流程" / "loop" / "从头到尾跑一遍"
- demo / 教学场景（展示完整流程）
- Agent 测试 / 自动化评估

**不适用于**（强烈建议用独立技能）：

- ❌ 已有清晰 intent 但只想对齐（用 `eas-dev-align`）
- ❌ 已对齐只要写 spec（用 `eas-dev-spec`）
- ❌ 已 spec 只想评审（用 `eas-dev-review`）
- ❌ 真实生产开发（**应优先用独立技能**）

## 快速参考 (Quick Reference)

| 项              | 内容                                                                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 模式            | Pipeline（编排 7 步）                                                                                                                     |
| 默认加载        | **false**（必用户明确启用）                                                                                                               |
| 输入契约        | 用户原始意图描述                                                                                                                          |
| 输出契约        | 完整交付物（alignment + spec + design + tasks + 代码 + tests + review + PR）                                                              |
| 委托技能        | `eas-dev-align` / `eas-dev-spec` / `eas-dev-design` / `eas-dev-plan` / `eas-dev-implement` / `eas-dev-review` / `eas-dev-finish`          |
| 中断恢复        | 支持（`.easbot/dev-loop-state.json`）                                                                                                     |
| 必读 references | [references/full-pipeline-gates.md](references/full-pipeline-gates.md) / [references/interrupt-resume.md](references/interrupt-resume.md) |

## 第一性原理 (First Principles)

> **"工具为人所用，不反过来"** —— mattpocock §反模式警告

**目的**：

1. **可中断恢复**：长流程中断后可继续
2. **完整闭环**：避免用户手动串联 9 个技能
3. **教学 / demo 场景**：展示完整流程

**反模式**：

- ❌ "默认必跑 loop" → 剥夺用户控制权（mattpocock 反模式）
- ❌ "loop 取代独立技能" → 失去小颗粒度灵活性
- ❌ "loop 强制启用" → 违背用户主动选择

## 7 步编排序列 (Seven-Step Sequence)

### Step 1: align

**委托**：`eas-dev-align`

**动作**：3 阶段访谈 → `alignment.md`

**Gate**：`alignment.md status = confirmed`

### Step 2: spec

**委托**：`eas-dev-spec`

**动作**：基于 alignment 生成 spec.md

**Gate**：spec.md 通过 5 条校验规则

### Step 3: design（可选）

**委托**：`eas-dev-design`

**动作**：基于 spec 设计架构

**Gate**：design.md status = confirmed（should；用户可跳）

### Step 4: plan

**委托**：`eas-dev-plan`

**动作**：基于 spec/design 拆任务

**Gate**：tasks.md 每任务 7 字段齐全 + 颗粒度 [2, 5]

### Step 5: implement

**委托**：`eas-dev-implement`

**动作**：调度 plan → tdd → review 闭环（单任务级）

**Gate**：所有任务 review PASS

### Step 6: review

**委托**：`eas-dev-review`

**动作**：整体评审（最终 PR 前）

**Gate**：P0 = 0；P1 修复或豁免

### Step 7: finish

**委托**：`eas-dev-finish`

**动作**：7 步收尾（test → review → docs → PR → merge → deploy → notify）

**Gate**：7 步 checklist 全通过

## 输入契约 (Input Contract)

| 项   | 要求                                                 |
| ---- | ---------------------------------------------------- |
| 必备 | 用户原始意图（自然语言描述）                         |
| 必备 | 用户**明确**启用 loop（如 "loop it" / "跑完整流程"） |
| 拒绝 | 用户说 "只要 X 阶段"（用独立技能）                   |

## 输出契约 (Output Contract)

**本技能是编排器，不直接产出文档**；通过委托 1-9 独立技能产生产物（每个产物的路径遵循对应技能的 §输出契约）：

| 产物             | 路径（由下游技能产出）                                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **完整交付物**   | `alignment.md` + `spec.md` + `design.md`（可选）+ `tasks.md` + 代码 + 测试 + `review.md` + PR / merge / deploy —— 全部位于 `<cwd>/.easbot/knowledge/docs/dev/<topic>/` |
| **调度状态文件** | `<cwd>/.easbot/state/dev-loop-<topic>.json`（中断恢复；用于跨 session 恢复）                                                                                           |

**禁止路径**：

- ❌ `<cwd>/.easbot/dev-loop-state.json`（无 `<topic>` 维度，多 loop 会冲突）
- ❌ 任何下游产物写入仓库根平级目录（`<cwd>/specs/` / `tasks/` / `designs/` / `reviews/` / `diagnoses/`）

## 中断恢复 (Interrupt & Resume)

详见 [references/interrupt-resume.md](references/interrupt-resume.md)

**核心能力**：

- 每步完成后保存状态到 `<cwd>/.easbot/state/dev-loop-<topic>.json`
- 中断后下次启动读取状态恢复
- 失败状态可重新启动

**状态字段**：

```json
{
  "loop_id": "<topic>-<timestamp>",
  "started_at": "<YYYY-MM-DD>",
  "current_step": "<step-id>",
  "completed_steps": ["<step-id>", ...],
  "artifacts": {
    "alignment": "<path>",
    "spec": "<path>",
    "design": "<path>",
    "tasks": "<path>"
  },
  "last_failure": {
    "step": "<step-id>",
    "reason": "<error>",
    "failed_at": "<YYYY-MM-DD>",
    "recovery_hint": "<how-to-fix>"
  }
}
```

## 失败处理 (Failure Handling)

| 情况           | 动作                                |
| -------------- | ----------------------------------- |
| 任一 Gate 失败 | 停止；保存状态；返回失败步骤 + 错误 |
| 用户想跳过某步 | 询问用户；按用户决策继续 / 停止     |
| 中断后恢复     | 读取状态；从失败点继续              |

## 常见错误 (Common Mistakes)

| ❌ 不要           | ✅ 应该                         |
| ----------------- | ------------------------------- |
| 默认启用 loop     | 必用户明确要求                  |
| loop 取代独立技能 | 独立技能优先；loop 仅在完整场景 |
| 不保存状态        | MUST 每步保存状态；支持中断恢复 |
| 跳过失败 Gate     | 任一失败 → 必停止；NEVER 跳过   |

## 下一步 (Next Steps)

| 场景               | 动作                                         |
| ------------------ | -------------------------------------------- |
| 完成 loop          | 归档 `.easbot/dev-loop-state.json`；记录复盘 |
| 用户仅想用部分技能 | 推荐对应独立技能                             |
| 中断               | 下次启动恢复                                 |

## 参考资料 (References)

- [references/full-pipeline-gates.md](references/full-pipeline-gates.md) —— 累积 Gate 详解
- [references/interrupt-resume.md](references/interrupt-resume.md) —— 中断恢复机制

## 与其他技能的关系 (Relationships)

| 技能                | 关系                                                         |
| ------------------- | ------------------------------------------------------------ |
| `eas-dev-align`     | **委托**（Step 1）                                           |
| `eas-dev-spec`      | **委托**（Step 2）                                           |
| `eas-dev-design`    | **委托**（Step 3，可选）                                     |
| `eas-dev-plan`      | **委托**（Step 4）                                           |
| `eas-dev-implement` | **委托**（Step 5）                                           |
| `eas-dev-review`    | **委托**（Step 6）                                           |
| `eas-dev-finish`    | **委托**（Step 7）                                           |
| `eas-skill-creator` | **规范基线**：本技能遵循其结构 + 5 大模式 + frontmatter 规范 |
| `eas-skill-using`   | **不重叠**：dev 分类不进索引                                 |

---

**最后更新**：2026-08-08
