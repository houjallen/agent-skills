---
name: eas-dev-align
description: 该技能应在用户提出新需求、新想法或新功能（"我想做一个 X" / "我有个想法" / "先对齐" / "我要加个功能"）时使用。在写代码或 spec 之前，以 3 阶段访谈对齐意图与术语，产出"对齐笔记"，避免下游技能基于误解的假设工作。
mode: Inversion
composition: standalone
scope: coder
behavior:
  gate:
    phases:
      - id: phase-1-background
        question: "这个需求背后的'为什么'是什么？"
        options:
          - id: user-pain
            label: "解决用户痛点"
          - id: tech-debt
            label: "偿还技术债"
          - id: opportunity
            label: "抓住新机会"
          - id: other
            label: "其他（请说明）"
      - id: phase-2-scope
        question: "本次工作的范围边界在哪？"
        options:
          - id: greenfield
            label: "全新模块"
          - id: extend-existing
            label: "扩展已有模块"
          - id: refactor
            label: "重构已有代码"
          - id: other
            label: "其他（请说明）"
      - id: phase-3-acceptance
        question: "怎么算'做完了'？"
        options:
          - id: behavior-defined
            label: "可观察行为已定义"
          - id: metric-defined
            label: "可量化指标已定义"
          - id: test-coverage
            label: "测试覆盖率达标"
          - id: other
            label: "其他（请说明）"
metadata:
  category: dev
  version: 1.0.0
  author: EASBot
  compatibility: claude-code / codex / gemini-cli / 其他支持 Skill 协议的 Agent
  tags:
    - eas-dev
    - inversion
    - alignment
    - brainstorming
    - first-principles
---

# eas-dev-align - 对齐 / 头脑风暴 (Alignment & Brainstorming)

> **分类位置**：`skills/dev/`（独立 dev 分类，**不**进 `eas-skill-using` 索引）
> **必填字段**：`name` / `description` / `mode=Inversion` / `composition=standalone` / `behavior.gate.phases` (3 必答) / `metadata.category=dev`
> **对应规划任务**：T-001 / 0014 决策

---

## 概述 (Overview)

`eas-dev-align` 在写代码 / spec 之前，以**苏格拉底式 3 阶段访谈**对齐意图与术语。Agent 通过 `behavior.gate.phases` 强制询问背景、范围、验收三件事，产出可被 `eas-dev-spec` / `eas-dev-design` / `eas-dev-plan` 直接消费的 `alignment.md`。

**不做什么**：

- ❌ 不写 spec（那是 `eas-dev-spec`）
- ❌ 不设计架构（那是 `eas-dev-design`）
- ❌ 不评估技术可行性（那是 `eas-dev-align` 之后的步骤）
- ❌ 不跳过访谈直接动手（这违反本技能存在的全部意义）

## 何时使用 (When to Use)

**该技能应在以下情况使用**：

- 用户说 "我想做一个 X" / "我要加个 Y" / "我有个想法"
- 用户说 "先对齐一下" / "先别急" / "先聊聊"
- 用户描述了一个模糊需求，未明确"为什么 / 做什么 / 怎么算完成"
- 已有对话未充分澄清意图，但即将进入写代码 / spec 阶段

**不适用于**：

- ❌ 用户已经提供完整 spec（直接走 `eas-dev-spec` 或 `eas-dev-design`）
- ❌ 紧急 bug 修复（直接走 `eas-dev-diagnose`）
- ❌ 一次性小改动（如"修个 typo"）

## 快速参考 (Quick Reference)

| 项 | 内容 |
|---|---|
| 模式 | Inversion（§13.3.3 安全/不可逆操作决策树映射：澄清歧义 = 不可逆操作前置） |
| 触发器 | `behavior.gate.phases` 3 个必答（背景 / 范围 / 验收） |
| 必答顺序 | phase-1-background → phase-2-scope → phase-3-acceptance（**NEVER 跳过 phase-1**） |
| 每题选项 | 2-4 个互斥选项 + "其他" 预留（§13.3.3 / eas-skill-creator Inversion 规范） |
| 输入契约 | 用户原始意图描述（自然语言 / 草稿 / 链接） |
| 输出契约 | `alignment.md`（5 章节 frontmatter + Markdown） |
| 必读 references | [phase-1-background.md](references/phase-1-background.md) / [phase-2-goal-scope.md](references/phase-2-goal-scope.md) / [phase-3-terms-acceptance.md](references/phase-3-terms-acceptance.md) |
| 必含 assets | [alignment-template.md](assets/alignment-template.md) |

## 第一性原理 (First Principles)

> **"误解的成本 >> 多问的成本"** —— mattpocock README §"The Agent Didn't Do What I Want"

**判断标准**：

1. **意图清晰度 ≤ 50%** → MUST 加载本技能
2. **意图清晰度 50-80%** → SHOULD 加载（Agent 自决）
3. **意图清晰度 > 80%** → 可直接进入下一阶段（不必加载）

**反模式**：

- ❌ "用户问了我就答" → 跳过访谈 = 跳进泥潭
- ❌ "我已经知道用户要什么" → 心理模型 ≠ 用户心智
- ❌ "访谈是浪费时间" → 沟通成本 < 返工成本（典型比例 1:5 ~ 1:20）

## 3 阶段访谈流程 (Three-Phase Interview)

### Phase 1：背景澄清 (Background)

**目标**：挖掘"为什么做"——需求背后的真正动机。

- 必答：`behavior.gate.phases[0]`（phase-1-background）
- 详见 [references/phase-1-background.md](references/phase-1-background.md)

### Phase 2：目标 + 范围 (Goal & Scope)

**目标**：明确"做什么 / 不做什么"——本次工作的边界。

- 必答：`behavior.gate.phases[1]`（phase-2-scope）
- 详见 [references/phase-2-goal-scope.md](references/phase-2-goal-scope.md)

### Phase 3：术语 + 验收 (Terms & Acceptance)

**目标**：对齐"语言"+"怎么算完成"——下游技能的契约。

- 必答：`behavior.gate.phases[2]`（phase-3-acceptance）
- 详见 [references/phase-3-terms-acceptance.md](references/phase-3-terms-acceptance.md)

## 输入契约 (Input Contract)

| 项 | 要求 |
|---|---|
| 来源 | 用户原始意图（自然语言 / 草稿 / 对话历史 / 链接） |
| 必备 | 用户至少有"想做某件事"的最简描述 |
| 可选 | 之前会话的相关上下文 / 已有的 alignment.md（增量对齐） |
| 拒绝 | 纯技术问题（无业务意图） / 纯 bug 报告（走 `eas-dev-diagnose`） |

## 输出契约 (Output Contract)

**必须产出 `alignment.md`**，落地路径规范（dev 技能通用默认；宿主项目可在自有 `.easbot/AGENTS.md` 中声明覆盖）：

| 场景 | 路径 |
|---|---|
| **项目级（推荐）** | `<cwd>/.easbot/knowledge/docs/dev/<topic>/alignment.md` |
| **临时 / 探索性** | `<cwd>/.easbot/state/dev-scratch-<topic>-alignment.md` |

**禁止路径**（会污染版本控制或与既有 §11 冲突）：

- ❌ `<cwd>/alignment.md`（仓库根，会入仓）
- ❌ `<cwd>/.easbot/alignments/...`（与新规范路径层级不一致）
- ❌ 任何 `<cwd>/specs/` / `alignments/` 等仓库根平级目录

**`<topic>` 命名**：kebab-case（如 `user-avatar` / `fix-cache-stampede`），≤ 64 字符。

**frontmatter 必含字段**：`topic` / `phase: alignment` / `status: draft|confirmed` / `created_at` / `updated_at`。

**必须包含 5 章节**：

1. 背景 (Background) —— 从 phase-1 抽取
2. 目标 (Goal) —— 从 phase-2 抽取
3. 范围 (Scope) —— 从 phase-2 抽取（含 In-Scope / Out-of-Scope）
4. 验收 (Acceptance Criteria) —— 从 phase-3 抽取
5. 术语表 (Glossary) —— 从 phase-3 抽取

**模板见** [assets/alignment-template.md](assets/alignment-template.md)。

## 失败处理 (Failure Handling)

| 情况 | 动作 |
|---|---|
| 用户拒绝回答 phase | 退回 phase-1 重新提问；NEVER 跳过 |
| 用户回答"不知道" | 提供 2-3 个默认假设，让用户挑选；NEVER 默认 |
| 用户回答相互矛盾 | 标记矛盾点，请用户裁决 |
| 访谈超过 5 轮仍未对齐 | 暂停，询问用户是否转人工会议 |

## 常见错误 (Common Mistakes)

| ❌ 不要 | ✅ 应该 |
|---|---|
| 跳过 phase-1 直接问 phase-2 | 严格按顺序执行；phase-1 是 phase-2/3 的前提 |
| 用 5+ 选项轰炸用户 | 每题 ≤ 4 选项；超出的归入"其他" |
| 接受"TBD"作为答案 | "TBD" = 不明确 = 不可进入下一阶段 |
| 在 alignment.md 中写"待评估技术方案" | 技术方案是 `eas-dev-design` 的事 |
| 把 alignment 当 spec 用 | alignment 是契约的前置；spec 才是契约 |

## 下一步 (Next Steps)

| 下游技能 | 何时使用 |
|---|---|
| `eas-dev-spec` | 意图已对齐，需产出可执行 spec |
| `eas-dev-design` | 跨模块 / 复杂功能，需先设计架构 |
| `eas-dev-diagnose` | 实际是 bug 修复路径（误判时） |
| 用户再次讨论 | 对齐结果有歧义，回退重新对齐 |

## 参考资料 (References)

- [references/phase-1-background.md](references/phase-1-background.md) —— Phase 1 详解
- [references/phase-2-goal-scope.md](references/phase-2-goal-scope.md) —— Phase 2 详解
- [references/phase-3-terms-acceptance.md](references/phase-3-terms-acceptance.md) —— Phase 3 详解
- [assets/alignment-template.md](assets/alignment-template.md) —— alignment.md 产出模板

## 与其他技能的关系 (Relationships)

| 技能 | 关系 |
|---|---|
| `eas-dev-spec` | **下游**：alignment.md 是 spec.md 的输入 |
| `eas-dev-design` | **下游**：alignment.md 是 design.md 的输入（可选） |
| `eas-dev-plan` | **下游**：alignment.md 是 tasks.md 的输入（可选） |
| `eas-dev-diagnose` | **平行**：bug 修复不走对齐，走诊断 |
| `eas-dev-loop` | **上游**：loop 第一阶段就是本技能 |
| `eas-skill-creator` | **规范基线**：本技能遵循其结构 + 5 大模式 + frontmatter 规范 |
| `eas-skill-using` | **不重叠**：dev 分类不进索引 |

---

**最后更新**：2026-08-08