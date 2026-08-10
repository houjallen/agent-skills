---
name: eas-dev-plan
description: 该技能应在用户要求基于 spec / design 拆任务（"拆任务" / "写计划" / "排期" / "怎么分步" / "2-5 分钟颗粒度"）时使用。基于 `eas-dev-spec` / `eas-dev-design` 产出，把工作拆为 2-5 分钟颗粒度的可执行任务列表 `tasks.md`，每个任务含 id / 标题 / 前置 / 验收步骤 / 代码路径 / 估计时间 / 风险 7 字段。
mode: Generator
composition: standalone
scope: coder
behavior:
  granularity:
    rule: "每个任务 MUST 在 2-5 分钟内可完成；超过 MUST 拆分为多个子任务"
    severity: must
    rationale: "反馈速率是速度上限（Pragmatic Programmer §small steps）；颗粒度越大，反馈越慢"
  output:
    format: markdown
    template: assets/tasks-template.md
    required_fields:
      - id
      - title
      - prerequisites
      - acceptance_steps
      - code_paths
      - estimated_minutes
      - risks
metadata:
  category: dev
  version: 1.0.0
  author: EASBot
  compatibility: claude-code / codex / gemini-cli / 其他支持 Skill 协议的 Agent
  tags:
    - eas-dev
    - generator
    - plan
    - tasks
    - granularity
---

# eas-dev-plan - 任务拆解 (Task Planning)

> **分类位置**：`skills/dev/`（独立 dev 分类，**不**进 `eas-skill-using` 索引）
> **必填字段**：`name` / `description` / `mode=Generator` / `composition=standalone` / `behavior.granularity` (must) / `behavior.output.required_fields` (7) / `metadata.category=dev`
> **对应规划任务**：T-004 / 0014 决策

---

## 概述 (Overview)

`eas-dev-plan` 把 spec / design 拆为可执行任务列表 `tasks.md`。Generator 模式：7 字段固定模板 + 颗粒度约束（2-5 分钟），确保每个任务可被独立 Agent / 开发者执行。

**不做什么**：

- ❌ 不写 spec（那是 `eas-dev-spec`）
- ❌ 不设计架构（那是 `eas-dev-design`）
- ❌ 不执行任务（那是 `eas-dev-tdd` / `eas-dev-implement`）
- ❌ 不评估项目排期（plan 是"做什么"和"怎么做"；"何时做"由项目管理工具决定）

## 何时使用 (When to Use)

**该技能应在以下情况使用**：

- 用户说 "拆任务" / "写计划" / "排期" / "怎么分步"
- spec / design 已确认，需进入实现阶段
- 大型 PR 需要分步提交（避免单个 PR 过大）
- 多 Agent 协作时，需明确每个 Agent 的任务边界

**不适用于**：

- ❌ spec / design 未确认（先走前置技能）
- ❌ 单一文件改动（直接实现即可）
- ❌ 一次性脚本 / 小工具（无需拆任务）
- ❌ 排期 / 项目管理类需求（plan 不管"何时做"）

## 快速参考 (Quick Reference)

| 项 | 内容 |
|---|---|
| 模式 | Generator（7 字段模板 + 颗粒度约束） |
| 输入契约 | `spec.md` + `design.md`（可仅 spec） |
| 输出契约 | `tasks.md`（任务列表，每个 7 字段齐全） |
| 颗粒度 | 2-5 分钟 / 任务（`behavior.granularity.rule`） |
| 必填字段 | id / title / prerequisites / acceptance_steps / code_paths / estimated_minutes / risks |
| 必读 references | [references/task-template.md](references/task-template.md) / [references/granularity-rules.md](references/granularity-rules.md) |
| 必含 assets | [assets/tasks-template.md](assets/tasks-template.md) |
| 失败处理 | 任一任务超 5 分钟 → MUST 拆分；任一字段缺失 → MUST 报错 |

## 第一性原理 (First Principles)

> **"反馈速率是速度上限"** —— Pragmatic Programmer §"Small Steps"

**为什么是 2-5 分钟**：

- **< 2 分钟**：颗粒度过细，任务开销（上下文切换 / 评审）> 工作量
- **2-5 分钟**：最优——可在一个 Agent 调用内完成；快速反馈；可独立测试
- **> 5 分钟**：颗粒度过粗，反馈延迟太长，bug 难以定位

**判断标准**：

1. 任务能否 2-5 分钟完成？→ 是 → 接受；否 → 拆
2. 任务是否有清晰验收？→ 是 → 接受；否 → 拆 / 补验收
3. 任务是否可被新 Agent 接手？→ 是 → 接受；否 → 文档不足

**反模式**：

- ❌ "整个功能作为一个任务"（颗粒度过粗）
- ❌ "每行代码一个任务"（颗粒度过细）
- ❌ "任务无验收"（无法判断完成度）
- ❌ "任务依赖复杂 DAG"（应拆到线性可执行）

## 7 字段任务模板 (Task Template)

每个任务 MUST 含 7 字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 唯一 ID（如 `T-001`）；用于引用 |
| `title` | string | 一句话动作（动宾结构） |
| `prerequisites` | list | 前置任务 ID 列表；空 = 无依赖 |
| `acceptance_steps` | list | 验收步骤（如何验证任务完成） |
| `code_paths` | list | 涉及的文件 / 目录路径 |
| `estimated_minutes` | number | 估计时间（2-5 之间） |
| `risks` | list | 潜在风险 + 缓解策略 |

## 输入契约 (Input Contract)

| 项 | 要求 |
|---|---|
| 必备 | `spec.md`（`status: confirmed`） |
| 可选 | `design.md`（复杂任务强烈建议） |
| 拒绝 | spec / design 缺失（NEVER；先回前置技能） |

## 输出契约 (Output Contract)

**必须产出 `tasks.md`**，落地路径规范（dev 技能通用默认；宿主项目可在自有 `.easbot/AGENTS.md` 中声明覆盖）：

| 场景 | 路径 |
|---|---|
| **项目级（推荐）** | `<cwd>/.easbot/knowledge/docs/dev/<topic>/tasks.md` |
| **临时 / 探索性** | `<cwd>/.easbot/state/dev-scratch-<topic>-tasks.md` |

**禁止路径**（会污染版本控制或与既有 §11 冲突）：

- ❌ `<cwd>/tasks.md`（仓库根，会入仓）
- ❌ `<cwd>/tasks/...`（仓库根平级，会入仓；**且**与 AGENTS.md §11 `<cwd>/.easbot/knowledge/tasks/<task-name>/` 冲突）

**`<topic>` 命名**：kebab-case，≤ 64 字符。

**frontmatter 必含字段**：`topic` / `phase: tasks` / `granularity: 2-5min` / `status: draft|confirmed` / `created_at` / `updated_at`。

**校验规则**：

1. 每任务含 7 字段（MUST）
2. 每任务 estimated_minutes ∈ [2, 5]（MUST）
3. 任务间依赖必须可解析（无循环依赖）（MUST）
4. 任务 ID 唯一（MUST）

**模板见** [assets/tasks-template.md](assets/tasks-template.md)。

## 失败处理 (Failure Handling)

| 情况 | 动作 |
|---|---|
| 任务超 5 分钟 | 标记 + 拆分；NEVER 输出超颗粒度任务 |
| 任务无 acceptance_steps | 报错"无验收的任务不可执行" |
| 任务间存在循环依赖 | 报错 + 提示断环点 |
| 用户要求"一步到位"任务 | 提醒"反馈速率"原理；询问是否可拆 |

## 常见错误 (Common Mistakes)

| ❌ 不要 | ✅ 应该 |
|---|---|
| 任务颗粒度过粗（"实现全文搜索"） | 拆为"加分词器 / 加索引 / 加 API / 加测试"等 |
| 任务颗粒度过细（"写 import 语句"） | 合并到 5 分钟任务 |
| 任务无验收 | 每任务 MUST 含可验证的 acceptance_steps |
| 任务间依赖复杂 DAG | 拆为线性可执行；复杂依赖 = 拆得更细 |
| 任务标题用名词（"搜索功能"） | 用动宾结构（"添加全文搜索 API"） |

## 下一步 (Next Steps)

| 下游技能 | 何时使用 |
|---|---|
| `eas-dev-tdd` | 单个任务执行 + TDD 循环 |
| `eas-dev-implement` | 多任务自动执行 + 评审闭环 |
| `eas-dev-review` | 任务完成后评审实现 |
| 用户再次讨论 | plan 有歧义；回退 `eas-dev-spec` / `eas-dev-design` |

## 参考资料 (References)

- [references/task-template.md](references/task-template.md) —— 7 字段详细说明
- [references/granularity-rules.md](references/granularity-rules.md) —— 颗粒度判断规则
- [assets/tasks-template.md](assets/tasks-template.md) —— tasks.md 产出模板

## 与其他技能的关系 (Relationships)

| 技能 | 关系 |
|---|---|
| `eas-dev-spec` | **上游**：spec.md 是 tasks.md 的输入 |
| `eas-dev-design` | **上游**：design.md 是 tasks.md 的输入（可选） |
| `eas-dev-tdd` | **下游**：tasks.md 中每个任务由 tdd 执行 |
| `eas-dev-implement` | **下游**：tasks.md 是 implement 的调度依据 |
| `eas-dev-loop` | **上游**：loop 第四阶段是本技能 |
| `eas-skill-creator` | **规范基线**：本技能遵循其结构 + 5 大模式 + frontmatter 规范 |
| `eas-skill-using` | **不重叠**：dev 分类不进索引 |

---

**最后更新**：2026-08-08