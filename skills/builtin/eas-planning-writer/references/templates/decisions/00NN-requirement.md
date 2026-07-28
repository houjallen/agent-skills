---
name: {task-name}-requirement
description: "{task-name}: 一句话决策标题 —— 阶段 1 关键设计判断（不超过 200 字）"
category: requirement
author: <name>
version: 1.0.0
date: "YYYY-MM-DD"
keywords:
  - "{task-name}"
  - <tag1>
  - <tag2>
supersedes: <旧决策编号，可选>
status: proposed
---

# {task-name} - 00NN: 决策标题（中文）

<!--
  本模板用于"项目级长任务的需求决策"：在 eas-planning-writer 阶段 1 需求收集完成后、
  阶段 2 规划启动前产出。记录关键设计判断，避免上下文丢失。

  使用方法：复制本文 → 替换所有占位符 → 删除本注释块。
  详细规范：见 <eas-planning-writer>/references/requirement-decision-guide.md（同目录）

  路径约束：
  - 本文件是模板，仅供复制使用
  - 复制后落地到 <task-dir>/0001-initial-design.md
    其中 <task-dir> = <cwd>/.easbot/knowledge/tasks/{task-name}/
  - 落地后 MUST 用相对路径引用同目录的 task_plan.md / findings.md / progress.md
  - MUST NOT 引用本任务目录外的资源
-->

> **决策日期**：YYYY-MM-DD
> **决策人**：<决策人姓名>（自主推进，待 Review）
> **状态**：📋 草拟 / 🟡 临时生效 / ✅ 已通过 / ❌ 已废弃
> **类型**：项目级长任务的需求决策
> **影响范围**：任务 `{task-name}` 单任务内
> **相关 task_profile**：见「需求画像」章节
> **关联决策**：<若有跨任务 ADR 引用，列编号>

---

## 背景 (Context)

<!-- 为什么需要做这个决策？用户原始诉求是什么？3-5 行足够。 -->

[描述用户原始诉求、触发因素、当前任务环境]

---

## 需求画像 (Task Profile)

<!-- 直接复制阶段 1 产出的 task_profile。MUST 100% 一致。 -->

```yaml
task_profile:
  domain: code | design | writing | business | data | hybrid   # [MUST]
  scenarios: [<3+ 具体使用场景>]                                # [MUST]
  triggers: [<5+ 触发短语>]                                    # [MUST]
  boundaries: [<不应纳入本任务的场景>]                          # [MUST]
  constraints:                                                  # [SHOULD]
    - <硬约束，如"必须支持 Windows">
  assumptions:                                                  # [SHOULD]
    - <已验证的假设>
  fallback_strategy:                                            # [MUST]
    data_missing: <数据缺失时如何兜底>
    tool_failure: <工具调用失败时如何兜底>
    context_overflow: <上下文爆炸时如何兜底>
  estimated_phases: <3-15>                                     # [MUST]
  cross_session: <true | false>                                 # [MUST]
  rounds_used: <实际提问轮次>                                   # [MUST]
  compressed: <true | false>                                    # [MUST]
  compressed_reason: <若压缩，引用 PRD/Spec/原任务名>            # [MAY]
```

---

## 关键判断 (Key Judgments)

<!-- 阶段 1 过程中做出的关键判断清单。`task_profile` 无法表达的设计选择。 -->

| # | 判断 | 理由 |
|---|------|------|
| 1 | <例：选择 `code` 领域而非 `hybrid`> | <用户场景全部是 SDK 封装，无设计/写作场景> |
| 2 | <例：阶段数估为 5 而非 8> | <任务可拆解为：需求/设计/实现/测试/上线；归档合并入上线> |
| 3 | <例：跨 session 设为 true> | <预计 3 天跨度，需跨日续做> |
| 4 | <...> | <...> |

---

## 备选方案 (Alternatives)

<!-- 至少 2 个并列候选。每个方案用优缺点表。 -->

### 方案 A：<名称>

| 维度 | 评估 |
|------|------|
| 优点 | - ... |
| 缺点 | - ... |
| 风险 | - ... |
| 成本 | - ... |

### 方案 B：<名称>

| 维度 | 评估 |
|------|------|
| 优点 | - ... |
| 缺点 | - ... |
| 风险 | - ... |
| 成本 | - ... |

<!-- 若有方案 C/D，依此类推 -->

---

## 决策 (Decision)

<!-- 一句话说清选了什么，然后用表格明确。 -->

**本决策选择：方案 X**。

| 项 | 内容 |
|------|------|
| 选了什么 | 方案 X |
| 适用范围 | 任务 `{task-name}` 内所有未来变更 |
| 生效日期 | YYYY-MM-DD |
| 审批状态 | 📋 草拟 / 🟡 临时生效 / ✅ 已 Review 通过 |

---

## 依据 (Rationale)

<!-- 为什么选这个？与备选对比的关键理由。3-5 条足够。 -->

1. **理由 1**：[与方案 Y 相比，方案 X 在 [维度] 上更优，因为 ...]
2. **理由 2**：[...]
3. **理由 3**：[...]
4. **否决方案 Y 的核心理由**：[...]

---

## 具体动作 (Actions)

<!-- 可勾选清单，必须落到文件路径。MUST 项。 -->

- [ ] 完善 `<task-dir>/task_plan.md` 阶段 1-5 的阶段定义（参考根技能 SKILL.md）
- [ ] 在 `<task-dir>/findings.md` 顶部固化 `task_profile` 四段（需求 / 触发短语 / 边界 / 兜底）
- [ ] 在 `<task-dir>/progress.md` 记录"会话 1"：阶段 1 完成 + 决策文档落地
- [ ] 阶段 1 退出条件自检（场景 / 触发短语 / 边界用例 / 兜底策略 4 项全打勾）
- [ ] 进入阶段 2 前 MUST 重读 task_plan.md（注意力操纵）

> 其中 `<task-dir>` = `<cwd>/.easbot/knowledge/tasks/{task-name}/`

---

## 影响 (Impact)

<!-- 正面 ✅ / 风险 ⚠️ / 副作用 ❌。MUST 项。 -->

### ✅ 正面影响

- [...]

### ⚠️ 风险

- [...]

### ❌ 副作用 / 取舍

- [...]

---

## 回溯链接 (Backlinks)

<!-- 指向后续阶段产出 + 跨任务 ADR（如有）。MUST 项。 -->

### 后续阶段产出（本决策驱动）

- `task_plan.md`：`<task-dir>/task_plan.md`
- `findings.md`：`<task-dir>/findings.md`
- `progress.md`：`<task-dir>/progress.md`

### 跨任务决策引用（如有）

- <编号 1>：<标题>
- <编号 2>：<标题>

---

## 修订记录 (Revision History)

<!-- 不另起文件，修订追加在本节。version 在 frontmatter 递增。 -->

| 版本 | 日期 | 修订内容 | 修订人 |
|------|------|----------|--------|
| 1.0.0 | YYYY-MM-DD | 初版 | <name> |

---

**最后更新**：YYYY-MM-DD

<!--
  本模板路径：<eas-planning-writer>/references/templates/decisions/00NN-requirement.md
  使用指南：<eas-planning-writer>/references/requirement-decision-guide.md
  落地路径：<cwd>/.easbot/knowledge/tasks/{task-name}/0001-initial-design.md
  [MUST] 落地后 MUST 保持自包含，仅引用同目录文件，MUST NOT 跨任务目录引用
-->