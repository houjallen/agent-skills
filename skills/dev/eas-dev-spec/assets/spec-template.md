---
topic: <一句话主题>
created_at: <YYYY-MM-DD>
updated_at: <YYYY-MM-DD>
phase: spec
skill: eas-dev-spec
status: draft | confirmed
upstream: <path-to-alignment.md>
---

# <主题> - 规格说明书 (Specification)

> **生成方式**：通过 [`eas-dev-spec`](../SKILL.md) 技能产出
> **上游输入**：[`<path-to-alignment.md>`](path-to-alignment.md)
> **下游消费者**：`eas-dev-design` / `eas-dev-plan` / `eas-dev-review`
> **状态**：`draft`（待确认）→ `confirmed`（用户已确认）

---

## 1. 背景 (Background)

> 来源：alignment.md §1 背景

### Context

<1-2 段背景说明；从 alignment.md §1.reasoning 提炼>

### Stakeholders

- <受影响方 1>
- <受影响方 2>
- ...

### Risk of NOT Doing

<不做的风险 / 代价；从 alignment.md §1.risk_of_not_doing 提炼>

---

## 2. 目标 (Goal)

> 来源：alignment.md §2 目标

### Primary Goal

<一句话核心目标，不超 30 字>

### Success Indicator

<可观察的成功标志——用户能看到的具体变化>

### Non-Goals（可选）

- <明确不达成的目标 1>
- <明确不达成的目标 2>

---

## 3. 接口 (Interface)

> 来源：alignment.md §2 范围 + 用户补充

### 3.1 <接口类型：API / 数据结构 / 事件 / UI>

```yaml
# 按实际情况选一种填写
endpoints:
  - method: <GET | POST | ...>
    path: <path>
    ...

# 或
interface:
  - interface TypeName {
      field: type;
    }

# 或
events:
  - name: <event.name>
    payload:
      ...

# 或
components:
  - name: ComponentName
    props:
      ...
```

### 3.2 <更多接口>

---

## 4. 验收 (Acceptance Criteria)

> 来源：alignment.md §4 验收

### Primary Acceptance（主验收）

**Type**: `<behavior-defined | metric-defined | test-coverage>`

| AC ID | Name       | Target   | Measurement |
| ----- | ---------- | -------- | ----------- |
| AC-1  | <验收项 1> | <目标值> | <如何测量>  |
| AC-2  | <验收项 2> | <目标值> | <如何测量>  |
| ...   |            |          |             |

### Secondary Acceptance（副验收，可选）

| AC ID | Name       | Target   | Measurement |
| ----- | ---------- | -------- | ----------- |
| AC-N  | <附加验收> | <目标值> | <如何测量>  |

### Done Definition（完成判定）

- [ ] 所有 Primary AC 通过
- [ ] 所有 Secondary AC 通过（或显式豁免）
- [ ] PR 合并到 main
- [ ] 部署到 <环境>
- [ ] 通知 <相关方>

---

## 5. 范围外 (Out-of-Scope)

> 来源：alignment.md §3 范围（out_of_scope）

| Item           | Reason |
| -------------- | ------ |
| <不做的功能 1> | <理由> |
| <不做的功能 2> | <理由> |
| <不做的功能 3> | <理由> |
| ...            |        |

---

## 元数据 (Metadata)

| 项       | 值                                                   |
| -------- | ---------------------------------------------------- |
| 创建时间 | <YYYY-MM-DD>                                         |
| 更新时间 | <YYYY-MM-DD>                                         |
| 上游输入 | <path-to-alignment.md>                               |
| 适用技能 | `eas-dev-design` / `eas-dev-plan` / `eas-dev-review` |
| 用户确认 | `<pending                                            | confirmed @ YYYY-MM-DD>` |
| 关联决策 | <link to docs/decisions/...>                         |

---

**最后更新**：<YYYY-MM-DD>
