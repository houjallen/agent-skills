---
topic: <一句话主题>
created_at: <YYYY-MM-DD>
phase: alignment
skill: eas-dev-align
status: draft | confirmed
---

# <主题> - 对齐笔记 (Alignment Note)

> **生成方式**：通过 [`eas-dev-align`](../SKILL.md) 技能产出
> **下游消费者**：`eas-dev-spec` / `eas-dev-design` / `eas-dev-plan`
> **状态**：`draft`（待确认）→ `confirmed`（用户已确认）

---

## 1. 背景 (Background)

> 来源：Phase 1（背景澄清）

### Motivation

`<user-pain | tech-debt | opportunity | other>` —— 用户选定的动机类型

### Reasoning

<用户对"为什么做这件事"的具体说明（自由文本）>

### Stakeholders

- <受影响方 1>
- <受影响方 2>
- ...

### Risk of NOT Doing

<不做这件事的风险 / 代价>

---

## 2. 目标 (Goal)

> 来源：Phase 2（目标 + 范围）

### Primary Goal

<本次工作要达成的核心目标，一句话>

### Success Indicator

<成功的可观察标志——用户能看到的具体变化>

---

## 3. 范围 (Scope)

> 来源：Phase 2（目标 + 范围）

### In-Scope（必做）

- [ ] <明确的子功能 1>
- [ ] <明确的子功能 2>
- [ ] <明确的子功能 3>
- [ ] ...

### Out-of-Scope（明确不做）

- ❌ <不做的子功能 A> —— 理由：<...>
- ❌ <不做的子功能 B> —— 理由：<...>
- ...

### Adjacent / Future（相邻 / 未来）

- <暂不做的功能 X，但预留接口>
- <计划下个迭代做的功能 Y>
- ...

---

## 4. 验收 (Acceptance Criteria)

> 来源：Phase 3（术语 + 验收）

### Primary Acceptance（主验收）

**Type**: `<behavior-defined | metric-defined | test-coverage | other>`

| AC ID | Name | Target | Measurement |
|---|---|---|---|
| AC-1 | <验收项 1> | <目标值> | <如何测量> |
| AC-2 | <验收项 2> | <目标值> | <如何测量> |
| ... | | | |

### Secondary Acceptance（副验收，可选）

| AC ID | Name | Target | Measurement |
|---|---|---|---|
| AC-N | <附加验收> | <目标值> | <如何测量> |
| ... | | | |

### Done Definition（完成判定）

- [ ] 所有 Primary AC 通过
- [ ] 所有 Secondary AC 通过（或显式豁免）
- [ ] PR 合并到 main
- [ ] 部署到 <环境>
- [ ] 通知 <相关方>

---

## 5. 术语表 (Glossary)

> 来源：Phase 3（术语 + 验收）

| 术语 | 定义 | 来源 |
|---|---|---|
| `<term-a>` | <具体含义（无歧义）> | 用户定义 |
| `<term-b>` | <具体含义> | 用户定义 |
| ... | | |

---

## 元数据 (Metadata)

| 项 | 值 |
|---|---|
| 创建时间 | <YYYY-MM-DD> |
| 适用技能 | `eas-dev-spec` / `eas-dev-design` / `eas-dev-plan` |
| 用户确认 | `<pending | confirmed @ YYYY-MM-DD>` |
| 关联对话 | <链接 / 引用> |

---

**最后更新**：<YYYY-MM-DD>