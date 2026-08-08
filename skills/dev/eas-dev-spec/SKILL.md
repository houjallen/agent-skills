---
name: eas-dev-spec
description: 该技能应在用户要求把对齐笔记 / 草稿想法转化为可执行规格（"基于 alignment 写 spec" / "把这个想法写成可执行规格" / "需求文档" / "写个 spec"）时使用。基于 `eas-dev-align` 产出，生成包含背景 / 目标 / 接口 / 验收 / 范围外 5 章节的 `spec.md`，作为下游 `eas-dev-design` / `eas-dev-plan` / `eas-dev-review` 的契约基线。
mode: Generator
composition: standalone
behavior:
  output:
    format: markdown
    template: assets/spec-template.md
    validation_rules:
      - id: no-tbd
        rule: "所有章节 MUST 不含 TBD / 看情况 / 待定 等占位符；如有不确定项 MUST 转为显式假设并标注"
        severity: must
      - id: no-empty-section
        rule: "所有章节 MUST 含 ≥1 个具体条目；空章节视为未完成"
        severity: must
      - id: interface-required
        rule: "接口章节 MUST 含 ≥1 个具体接口签名 / API 端点 / 数据结构"
        severity: must
      - id: acceptance-testable
        rule: "验收章节每条 AC MUST 含 target + measurement；不可含'差不多就行'"
        severity: must
      - id: out-of-scope-explicit
        rule: "Out-of-Scope 章节 MUST 列出 ≥3 项明确不做的事"
        severity: must
metadata:
  category: dev
  version: 1.0.0
  author: EASBot
  compatibility: claude-code / codex / gemini-cli / 其他支持 Skill 协议的 Agent
  tags:
    - eas-dev
    - generator
    - spec
    - contract
---

# eas-dev-spec - 规格化 (Specification)

> **分类位置**：`skills/dev/`（独立 dev 分类，**不**进 `eas-skill-using` 索引）
> **必填字段**：`name` / `description` / `mode=Generator` / `composition=standalone` / `behavior.output.validation_rules` (5 must) / `metadata.category=dev`
> **对应规划任务**：T-002 / 0014 决策

---

## 概述 (Overview)

`eas-dev-spec` 把对齐笔记（来自 `eas-dev-align`）转为可执行规格 `spec.md`。Generator 模式：固定 5 章节模板 + 5 条校验规则，确保下游技能（`eas-dev-design` / `eas-dev-plan` / `eas-dev-review`）拿到的是"无歧义契约"而非"参考文档"。

**不做什么**：

- ❌ 不做架构设计（那是 `eas-dev-design`）
- ❌ 不拆任务（那是 `eas-dev-plan`）
- ❌ 不评审 spec 本身（spec 一旦确认由 `eas-dev-review` 在实现后回检）
- ❌ 不写代码示例（spec 是契约；示例代码可放 `references/`）

## 何时使用 (When to Use)

**该技能应在以下情况使用**：

- 用户说 "基于 alignment 写 spec" / "把这个想法写成可执行规格"
- 用户说 "需求文档" / "写个 spec" / "把对话整理成规格"
- 已完成 `eas-dev-align`，需把对齐结果转为可执行契约
- 项目需要给团队 / 利益相关方评审的"规格文档"

**不适用于**：

- ❌ 意图未对齐（先走 `eas-dev-align`）
- ❌ 架构设计阶段（走 `eas-dev-design`）
- ❌ 任务拆解（走 `eas-dev-plan`）
- ❌ 一次性小改动（直接实现即可）

## 快速参考 (Quick Reference)

| 项 | 内容 |
|---|---|
| 模式 | Generator（5 章节固定模板 + 5 条校验规则） |
| 输入契约 | `alignment.md`（来自 `eas-dev-align`）+ 可选补充资料 |
| 输出契约 | `spec.md`（5 章节 + frontmatter；**无歧义**，**可执行**） |
| 必填章节 | 背景 / 目标 / 接口 / 验收 / 范围外 |
| 必读 references | [references/spec-template.md](references/spec-template.md) |
| 必含 assets | [assets/spec-template.md](assets/spec-template.md) |
| 校验规则数 | 5 条 must 规则（见 frontmatter `behavior.output.validation_rules`） |
| 失败处理 | 任一校验规则不通过 → MUST 报错并指明章节 / 规则 |

## 第一性原理 (First Principles)

> **"Spec 是契约，不是参考"** —— superpowers §"writing-plans" + ECC §"Plan Before Execute"

**判断标准**：

1. **可执行性**：下游技能无需猜测，按 spec 直接落地
2. **可验证性**：每条 AC 含 target + measurement，可自动化 / 半自动化验证
3. **无歧义**：所有 "TBD" / "看情况" 已被显式假设或明确 Out-of-Scope

**反模式**：

- ❌ "大概这样就行" → spec 不接受模糊词
- ❌ "参考 X 项目" → spec 不接受外部引用作为唯一说明
- ❌ "具体实现时再说" → spec 必须明确每条决策
- ❌ 把"决策记录"塞进 spec → 决策走 `docs/decisions/`；spec 只承载契约

## 5 章节模板 (Five-Section Template)

### 1. 背景 (Background)

**来源**：alignment.md §1 背景

**必填**：

- 1-2 段说明"为什么做这件事"
- 关键利益相关方列表
- 不做的风险 / 代价

### 2. 目标 (Goal)

**来源**：alignment.md §2 目标

**必填**：

- **Primary Goal**：一句话核心目标
- **Success Indicator**：可观察的成功标志
- **Non-Goals**（可选）：明确不达成的目标

### 3. 接口 (Interface)

**来源**：alignment.md §2 范围 + 用户补充

**必填**（至少 1 项）：

- **API 端点**（HTTP / RPC / 函数签名）
- **数据结构**（TypeScript interface / JSON Schema / 数据库 schema）
- **事件 / 命令契约**（如 event-driven 架构）
- **UI 接口**（组件 props / 表单字段 / 路由）

### 4. 验收 (Acceptance Criteria)

**来源**：alignment.md §4 验收

**必填**：

- **主验收**：按 alignment 选定类型（行为 / 指标 / 测试覆盖）
- 每条 AC 含：id / name / target（具体值）/ measurement（如何测）
- **Done Definition**：所有 AC 通过 + PR 合并 + 部署到 <env>

### 5. 范围外 (Out-of-Scope)

**来源**：alignment.md §3 范围（out_of_scope 部分）

**必填（≥ 3 项）**：

- 明确不做的事 + 理由
- 与相邻功能的边界（如"搜索不做 AI 增强，下一迭代再做"）
- 暂不做的功能（明确"现在不做"）

## 输入契约 (Input Contract)

| 项 | 要求 |
|---|---|
| 必备 | `alignment.md`（`status: confirmed`；用户已确认对齐结果） |
| 可选 | 已有的 spec.md（增量更新场景） |
| 可选 | 设计草图 / API 草稿 / 数据 schema |
| 拒绝 | 无 alignment 直接生成（NEVER；先走 `eas-dev-align`） |

## 输出契约 (Output Contract)

**必须产出 `spec.md`**，落地路径规范（dev 技能通用默认；宿主项目可在自有 `.easbot/AGENTS.md` 中声明覆盖）：

| 场景 | 路径 |
|---|---|
| **项目级（推荐）** | `<cwd>/.easbot/knowledge/docs/dev/<topic>/spec.md` |
| **临时 / 探索性** | `<cwd>/.easbot/state/dev-scratch-<topic>-spec.md` |

**禁止路径**（会污染版本控制）：

- ❌ `<cwd>/spec.md`（仓库根，会入仓）
- ❌ `<cwd>/specs/...`（仓库根平级，会入仓）
- ❌ `<cwd>/docs/specs/...`（`docs/` 是发布文档目录，禁止写入 dev 中间产物）

**`<topic>` 命名**：kebab-case，≤ 64 字符。

**frontmatter 必含字段**：`topic` / `phase: spec` / `status: draft|confirmed` / `created_at` / `updated_at`。

**5 条校验规则**（来自 `behavior.output.validation_rules`）：

| 规则 ID | 规则 | 严重度 |
|---|---|---|
| `no-tbd` | 不含 TBD / 看情况 / 待定 | must |
| `no-empty-section` | 每章节 ≥1 条目 | must |
| `interface-required` | 接口章节 ≥1 具体签名 | must |
| `acceptance-testable` | 每 AC 含 target + measurement | must |
| `out-of-scope-explicit` | Out-of-Scope ≥3 项 | must |

**模板见** [assets/spec-template.md](assets/spec-template.md)。

## 失败处理 (Failure Handling)

| 情况 | 动作 |
|---|---|
| 输入无 alignment.md | 报错并指引用户先走 `eas-dev-align` |
| 任一校验规则不通过 | 报错并指明章节 + 规则；NEVER 输出半成品 |
| 用户要求"差不多就行" | 提醒"spec 是契约"原则；询问是否改用 Out-of-Scope 标注 |
| Spec 输出后用户想加内容 | 增量更新模式；保留 frontmatter `updated_at` |

## 常见错误 (Common Mistakes)

| ❌ 不要 | ✅ 应该 |
|---|---|
| 包含 "TBD" / "看情况" | 显式假设并标注；或放 Out-of-Scope |
| 接口章节写"具体见代码" | 必须含具体签名 / schema |
| AC 写"用户体验良好" | AC 必须含 target + measurement |
| 把"未来要做"塞进目标 | 未来做的事放 Out-of-Scope；目标 = 当前可完成 |
| 把架构设计塞进 spec | spec = 契约；架构 = `eas-dev-design` |
| Spec 引用外部链接作为唯一说明 | 必填项必须内联；链接可补充但不能替代 |

## 下一步 (Next Steps)

| 下游技能 | 何时使用 |
|---|---|
| `eas-dev-design` | 跨模块 / 复杂功能，需先设计架构 |
| `eas-dev-plan` | spec 已确认，需拆任务 |
| `eas-dev-review` | 实现后回检 spec 忠实度 |
| 用户再次讨论 | spec 有歧义；回退 `eas-dev-align` 重新对齐 |

## 参考资料 (References)

- [references/spec-template.md](references/spec-template.md) —— 5 章节详细说明 + 校验步骤
- [assets/spec-template.md](assets/spec-template.md) —— spec.md 产出模板

## 与其他技能的关系 (Relationships)

| 技能 | 关系 |
|---|---|
| `eas-dev-align` | **上游**：alignment.md 是 spec.md 的输入 |
| `eas-dev-design` | **下游**：spec.md 是 design.md 的输入 |
| `eas-dev-plan` | **下游**：spec.md 是 tasks.md 的输入 |
| `eas-dev-review` | **下游**：spec.md 是评审的对照基线 |
| `eas-dev-loop` | **上游**：loop 第二阶段是本技能 |
| `eas-skill-creator` | **规范基线**：本技能遵循其结构 + 5 大模式 + frontmatter 规范 |
| `eas-skill-using` | **不重叠**：dev 分类不进索引 |

---

**最后更新**：2026-08-08