---
topic: <一句话主题>
created_at: <YYYY-MM-DD>
updated_at: <YYYY-MM-DD>
phase: tasks
skill: eas-dev-plan
status: draft | confirmed
upstream: <path-to-spec.md> + <path-to-design.md>
granularity: 2-5 minutes per task
---

# <主题> - 任务清单 (Task List)

> **生成方式**：通过 [`eas-dev-plan`](../SKILL.md) 技能产出
> **上游输入**：[`<path-to-spec.md>`](path-to-spec.md) + [`<path-to-design.md>`](path-to-design.md)
> **下游消费者**：`eas-dev-tdd` / `eas-dev-implement` / `eas-dev-review`
> **颗粒度约束**：2-5 分钟 / 任务（MUST）

---

## 任务依赖图 (Task Dependency Graph)

> 可选：简单 ASCII 图或 Mermaid

```text
T-001 (测试先行)
  ↓
T-002 (实现 Service)
  ↓
T-003 (实现 Repository)
  ↓ ↘
T-004 (API 端点)  T-005 (集成测试)
```

---

## 任务清单 (Task List)

### T-001: <任务标题>

```yaml
id: T-001
title: <动宾结构标题>
prerequisites: [] # 或 [T-XXX]
acceptance_steps:
  - <可执行步骤 1>
  - <可执行步骤 2>
  - <可执行步骤 3>
code_paths:
  - <文件路径 1>
  - <文件路径 2>
estimated_minutes: <2-5>
risks:
  - risk: <风险>
    mitigation: <缓解>
  # 或 []
```

### T-002: <任务标题>

```yaml
id: T-002
title: <动宾结构标题>
prerequisites: [T-001]
acceptance_steps:
  - ...
code_paths:
  - ...
estimated_minutes: <2-5>
risks: []
```

### T-NNN: <任务标题>

```yaml

...
```

---

## 校验清单 (Validation Checklist)

- [ ] 每任务 estimated_minutes ∈ [2, 5]
- [ ] 每任务 acceptance_steps ≥ 2 条
- [ ] 每任务 code_paths ≥ 1 个
- [ ] 每任务 risks 字段已填写（可为空）
- [ ] 任务 ID 唯一
- [ ] 任务依赖无循环
- [ ] 所有任务可线性 / 简单 DAG 执行

---

## 元数据 (Metadata)

| 项         | 值                                                     |
| ---------- | ------------------------------------------------------ |
| 创建时间   | <YYYY-MM-DD>                                           |
| 更新时间   | <YYYY-MM-DD>                                           |
| 上游输入   | spec.md + design.md                                    |
| 任务总数   | <N>                                                    |
| 总估计时间 | <N × 平均> 分钟                                        |
| 下游消费者 | `eas-dev-tdd` / `eas-dev-implement` / `eas-dev-review` |
| 用户确认   | `<pending                                              | confirmed @ YYYY-MM-DD>` |

---

**最后更新**：<YYYY-MM-DD>
