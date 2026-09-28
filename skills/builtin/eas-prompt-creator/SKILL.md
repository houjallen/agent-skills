---
name: eas-prompt-creator
description: 该技能应在为 EASBot 创建、规范化或审核提示词（Agent / Tool / Task / Command / Mode / Session / Feature / Context 八大类型）时使用，覆盖 RFC 2119 边界关键字与 frontmatter 模板决策。
license: MIT
metadata:
  category: builtin
  version: 1.0.0
  author: EASBot
  tags: [easbot, prompt, agent, tool, task, rfc2119]
mode: inversion
composition: composed
secondaryModes:
  - pipeline
compositionConnections:
  - from: inversion
    to: pipeline
    kind: sequence
behavior:
  gate:
    phases:
      - id: basic-info
        title: 基础信息
        questions:
          - id: q-type
            question: 提示词类型（agent / tool / task / command / mode / session / feature / context）
            options:
              - value: agent
                label: Agent
              - value: tool
                label: Tool
              - value: task
                label: Task
              - value: command
                label: Command
              - value: mode
                label: Mode
              - value: session
                label: Session
              - value: feature
                label: Feature
              - value: context
                label: Context
            required: true
          - id: q-name
            question: 提示词名称（hyphen-case ≤ 64 字符）
            options: null
            required: true
          - id: q-scope
            question: 所属场景（general / coder）
            options:
              - value: general
                label: General
              - value: coder
                label: Coder
              - value: all
                label: All
            required: true
          - id: q-purpose
            question: 主要用途（≤ 200 字符，将写入 L1 description）
            options: null
            required: true
      - id: type-specific
        title: 类型特定信息
        questions:
          - id: q-l2-fields
            question: 根据类型查阅对应规范文件，收集完整 L2 必填字段
            options: null
            required: true
      - id: output-template
        title: 输出模板确认
        required: false
        questions:
          - id: q-output-template
            question: 此提示词是否需要固定输出模板？支持的格式：JSON / Markdown
            options:
              - value: json
                label: JSON
              - value: markdown
                label: Markdown
              - value: none
                label: 不需要
            required: false
      - id: quality-check
        title: 质量确认
        questions:
          - id: q-boundary
            question: 边界控制完整性（RFC 2119 / EASBot 关键字）已校验？
            options:
              - value: yes
                label: 已校验
              - value: no
                label: 未校验
            required: true
          - id: q-example
            question: 示例充足性（≥ 1 个完整示例）已确认？
            options:
              - value: yes
                label: 已确认
              - value: no
                label: 未确认
            required: true
    refuseActionWhenIncomplete: true
---

# Eas Prompt Creator - EASBot 提示词创建器 (EASBot Prompt Creator)

## 概述 (Overview)

该技能提供标准化的 EASBot 提示词创建工作流，涵盖 Agent、Tool、Task、Command、Mode、Session、Feature、Context 八大类型。通过结构化信息收集和规范化模板，确保生成的提示词具有一致性、可维护性和高质量。

**CRITICAL: 生成的所有提示词内容必须使用英文。**

## 何时使用 (When to Use)

该技能应在以下情况使用：

- 创建新的 EASBot 提示词
- 规范化现有提示词格式
- 审核提示词质量
- 设计 Agent 系统提示词
- 定义工具描述和边界
- 创建任务工作流提示词
- 设计场景模式提示词（如 general、coder）

**触发短语**：创建提示词、写 prompt、提示词审核、提示词规范化、Agent prompt、Tool prompt、Task prompt、prompt 模板、RFC 2119 关键字审查、frontmatter 校验。

**不适用 (Not Applicable)**：

- 业务需求文档（与提示词工程无关，属于 `eas-dev-spec` / `eas-dev-align` 范围）。
- 用户对话话术 / 营销文案 / 客服回复（属于内容生成侧，非提示词工程）。
- SKILL.md 本身的结构编写（属于 `eas-skill-creator` 范围，本技能仅在生成 EASBot Agent/Tool/Task/Command/Mode/Session/Feature/Context 八类提示词文件时使用）。
- 临时一次性 prompt 模板（不属于规范化对象）。
- 非英文提示词（除非用户明确要求；详见 §语言要求）。

## 快速参考 (Quick Reference)

**提示词类型分类：**

| 类型    | 用途            | 规范文件                                                    |
| ------- | --------------- | ----------------------------------------------------------- |
| Agent   | 定义 Agent 行为 | [agent-prompt-spec.md](references/agent-prompt-spec.md)     |
| Tool    | 描述工具功能    | [tool-prompt-spec.md](references/tool-prompt-spec.md)       |
| Task    | 任务管理流程    | [task-prompt-spec.md](references/task-prompt-spec.md)       |
| Command | 命令执行指南    | [command-prompt-spec.md](references/command-prompt-spec.md) |
| Mode    | 场景模式切换    | [mode-prompt-spec.md](references/mode-prompt-spec.md)       |
| Session | 会话生命周期    | [session-prompt-spec.md](references/session-prompt-spec.md) |
| Feature | 特性功能定义    | [feature-prompt-spec.md](references/feature-prompt-spec.md) |
| Context | 上下文构建      | [context-prompt-spec.md](references/context-prompt-spec.md) |

## 信息收集流程 (Information Collection)

使用 `AskUserQuestion` 工具按顺序收集以下信息：

### 第一轮：基础信息

1. **提示词类型**（必填）
2. **提示词名称**（必填）
3. **所属场景**（必填：general/coder）
4. **主要用途**（必填）

### 第二轮：类型特定信息

根据类型查阅对应规范文件，收集完整字段。

### 第三轮：输出模板确认

**重要**：输出模板不是固定必填的，根据场景判断：

- 如果 Agent 能判断该提示词需要固定输出格式（如 Task、Summary、Plan），自动添加
- 如果 Agent 无法判断，提问用户：`"此提示词是否需要固定输出模板？支持的格式：JSON / Markdown"`

### 第四轮：质量确认

- 边界控制完整性
- 示例充足性

## 提示词创建规范 (Prompt Creation Standards)

### 语言要求 (Language Requirements)

**CRITICAL: 提示词默认全英文 — 不使用双语。**

| 对象                                                                                                                   | 语言策略                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **提示词文件 (Prompt Files)**<br/>8 类提示词本体（Agent / Tool / Task / Command / Mode / Session / Feature / Context） | **MUST 全英文**：`title` / 章节标题 / 正文 / 示例代码块全部使用英文，**不使用中文 / 双语** |
| **元规范文档 (Skill Documentation)**<br/>本 SKILL.md + 11 份 references                                                | 章节标题使用**双语** `## 中文 (English)`，正文中文为主，关键术语保留英文                   |

**概念混淆澄清**：

- **提示词 ≠ SKILL.md** —— 提示词是给大模型读的输入；SKILL.md 是给 Agent / 开发者读的元规范。
- 提示词默认全英文，与本 SKILL.md / references 的"双语标题"风格**无关**。
- references 章节使用双语标题是为了与 eas-skill-creator 等其他 builtin 技能保持一致的元规范风格；**不要**把双语标题推广到提示词文件。

**提示词文件语言规则 (Rules for Prompt Files)**：

- 所有提示词主体内容 MUST 使用英文。
- YAML `title` 字段 MUST 为英文（`title: Explore Subagent`），不使用中文 / 双语。
- 章节标题 MUST 使用英文（`## Identity` / `## Capabilities` / `## Boundaries`），不使用中文 / 双语。
- 技术术语保留原始形式（如 TypeScript、API、CLI）。
- 代码注释 MAY 使用中文（与代码主体语言一致，便于阅读）。

### 固定格式要求 (Fixed Format Requirements)

所有提示词文件必须包含：

```yaml
---
title: [English title]
type: [agent|tool|task|command|mode|session|feature|context]
mode: [general|coder|all]
required: [comma-separated required fields]
optional: [comma-separated optional fields]
---
```

> **重要 (Important)**：上方 YAML 是 **5 字段输出模板**（output-template），与 **9 字段 system/extension 提示词模板**（agent-info）不同。完整决策与两套模板权威定义见 §前置元数据决策。

### 输出模板要求 (Output Template Requirements)

**支持的格式 (Supported Formats)**：JSON、Markdown

**何时需要 (When Needed)**：

- Agent 能判断需要固定输出格式时（如总结、计划、任务结果）
- 用户明确要求时

**模板结构 (Template Structure)**：参考 `references/output-template.md`

### 边界控制 (Boundary Control)

**CRITICAL: 所有 EASBot 提示词中的边界关键字 MUST 遵循 RFC 2119（[rfc-editor.org/rfc/rfc2119](https://www.rfc-editor.org/rfc/rfc2119)）。** EASBot 关键字（`NEVER`、`MUST`、`ALWAYS`、`CRITICAL`、`DO NOT`）是 RFC 2119 关键字的同义书写形式，与 RFC 2119 关键字共享同一 4 级层次。完整的关键字表、同义词规则、10 项合规自检表见 [boundary-control.md](references/boundary-control.md)。编写 Boundaries 章节前 MUST 查阅该文件。

速查规则 (Rules of thumb)：

- 安全/不可逆操作 → `NEVER` / `MUST NOT`（RFC L1，负向）。
- 强制流程 → `MUST` 或 `ALWAYS`（RFC L1，正向）。
- 存在合理例外的强推荐 → `SHOULD` / `SHOULD NOT`（RFC L2）。
- 可选行为 → `MAY` / `OPTIONAL`（RFC L3）。
- `CRITICAL` 是强调块而非级别——必须包裹一条 MUST/MUST NOT 正文。

### 质量标准 (Quality Standards)

- 内容简洁，无冗余
- 结构清晰，层次分明
- 示例具有代表性
- 边界明确且符合 RFC 2119 — 见 [boundary-control.md](references/boundary-control.md)
- 每条规则都可真假测试（见 boundary-control.md §6 C7）

## 与其他技能的关系 (Relationships with Other Skills)

- **eas-skill-creator**: 技能创建依赖此技能生成提示词
- **eas-skill-using**: 使用提示词时参考此技能规范；概念边界（Skill vs Agent vs Tool vs Task）见 `eas-skill-using` §关键概念（按 `Skill` 工具按 name 加载）
- **eas-skill-find**: 搜索提示词时参考分类体系

## 参考资料 (References)

| 类型                  | 规范文件                                                    |
| --------------------- | ----------------------------------------------------------- |
| Agent                 | [agent-prompt-spec.md](references/agent-prompt-spec.md)     |
| Tool                  | [tool-prompt-spec.md](references/tool-prompt-spec.md)       |
| Task                  | [task-prompt-spec.md](references/task-prompt-spec.md)       |
| Command               | [command-prompt-spec.md](references/command-prompt-spec.md) |
| Mode                  | [mode-prompt-spec.md](references/mode-prompt-spec.md)       |
| Session               | [session-prompt-spec.md](references/session-prompt-spec.md) |
| Feature               | [feature-prompt-spec.md](references/feature-prompt-spec.md) |
| Context               | [context-prompt-spec.md](references/context-prompt-spec.md) |
| Output Template       | [output-template.md](references/output-template.md)         |
| Boundary Control      | [boundary-control.md](references/boundary-control.md)       |
| **Prompt Validation** | [prompt-validation.md](references/prompt-validation.md)     |

## 提示词验证规范 (Prompt Validation)

### 核心原则 (Core Principles)

提示词验证遵循以下核心原则：

1. **四个核心职责**：身份、安全约束、质量标准、能力知识
2. **U型注意力曲线**：关键内容放在开头和结尾
3. **Token 预算**：系统提示词 < 6,000 tokens

### 验证清单 (Validation Checklist · 摘要)

完整版（含 4 大职责、Token 预算分配、反模式 6 项、内容质量评分、自检表）见 [prompt-validation.md](references/prompt-validation.md)。本节仅给出一句话摘要：

- 提示词默认全英文；`title` / 章节标题 / 正文 MUST 英文（详见 §语言要求）。
- Token 预算 SHOULD < 6,000 tokens（提示词本体，不含工具定义）。
- 硬约束 MUST 使用 NEVER / MUST / MUST NOT；软建议 SHOULD 使用 recommended / prefer。
- 关键规则 SHOULD 解释理由（避免"be careful"等空泛词）。

## 提示词验证规范 (Prompt Validation)

提示词验证规范、反模式检测、内容质量评分等内容**全部位于** [prompt-validation.md](references/prompt-validation.md)，本 SKILL.md 不重复声明，避免双源不同步。

## 前置元数据决策 · 两套模板 (Frontmatter Decision · Two Templates)

EASBot 提示词根据文件角色使用 **两套不同的 frontmatter 模板**，选择是确定性的（按文件用途二选一，不可混用）。

| 模板 (Template)                                                                                                                      | 使用场景 (Used By)                                                                                 | 规范文档 (Spec Doc)                                 |
| ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **Agent-info 模板**（9 字段：`name` / `type` / `scope` / `priority` / `permission` / `dynamic` / `owner` / `share` / `description`） | 所有 `agent` / `tool` / `task` / `command` / `mode` / `session` / `feature` / `context` 提示词文件 | 逐类型分布 — 参见 8 份 `*-prompt-spec.md` 文件      |
| **Output-template 模板**（5 字段：`title` / `type` / `mode` / `required` / `optional`）                                              | 伴随提示词的输出模板定义                                                                           | [output-template.md](references/output-template.md) |

### 两层字段 · frontmatter 与正文必填字段（Two Layers of Fields）

每个提示词文件 MUST 区分两层字段边界：

| 层级                  | 定义                                                                                                       | 来源                 |
| --------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------- |
| **L1 · frontmatter**  | 9 字段 agent-info（SKILL.md §前置元数据决策 §Agent-info 模板 · 权威定义）                                  | SKILL.md / 通用规范  |
| **L2 · 正文必填字段** | 各 `*-prompt-spec.md` §必填字段（如 `role` / `usage` / `parameters` / `workflow` / `states` / `tools` 等） | 各 spec.md §必填字段 |

**约束 (Constraints)**：

- L1 字段用于系统加载与路由；L2 字段用于 Agent 在阅读提示词后采取行为。
- L2 字段 MUST 显式说明其与 L1 字段的映射关系（如"`role` 写入 L1 `description`"或"独立于 frontmatter，置于正文第 1 段"）。`*-prompt-spec.md` 中未声明映射关系的字段，作者将无法在生产提示词中定位。
- L1 与 L2 字段 MUST NOT 重名（含大小写），以避免 Agent 解析歧义。

### 8 类型 × 9 字段矩阵表（Eight Types × Nine Fields Matrix）

下表声明 9 字段 agent-info 模板在 8 类提示词中的 REQUIRED / OPTIONAL 状态（`R` = REQUIRED / `O` = OPTIONAL）：

| 字段 (Field)  | Agent | Tool | Task | Command | Mode | Session | Feature | Context |
| ------------- | :---: | :--: | :--: | :-----: | :--: | :-----: | :-----: | :-----: |
| `name`        |   R   |  R   |  R   |    R    |  R   |    R    |    R    |    R    |
| `type`        |   R   |  R   |  R   |    R    |  R   |    R    |    R    |    R    |
| `scope`       |   R   |  R   |  R   |    R    |  R   |    R    |    R    |    R    |
| `priority`    |   O   |  O   |  O   |    O    |  O   |    O    |    O    |    O    |
| `permission`  |   O   |  O   |  O   |    O    |  R   |    O    |    O    |    O    |
| `dynamic`     |   O   |  O   |  O   |    O    |  O   |    O    |    O    |    O    |
| `owner`       |   O   |  O   |  O   |    O    |  O   |    O    |    O    |    O    |
| `share`       |   O   |  O   |  O   |    O    |  O   |    O    |    O    |    O    |
| `description` |   R   |  R   |  R   |    R    |  R   |    R    |    R    |    R    |

> **Mode 类型特殊要求**：`permission` 为 REQUIRED（Mode 必须显式声明读写权限，如 `read` / `write`，参见 `mode-prompt-spec.md` §必填字段 `constraints`）。其余 7 类型的 `permission` 默认 `read`，可省略。

### Agent-info 模板 · 权威定义 (Agent-info Template · Canonical)

所有 system/extension 提示词文件 MUST 使用以下 9 字段 YAML frontmatter（每字段语义与 §8 类型 × 9 字段矩阵表 对齐）：

```yaml
---
name: [filename] # 必需，唯一标识（与文件名一致）
type: [system|extension] # 必需
scope: [all|general|coder] # 必需
priority: [number] # 可选，默认 1000
permission: [read|write] # 可选，默认 read（Mode 必填）
dynamic: [true|false] # 可选，默认 false
owner: [string...] # 可选，数组
share: [string...] # 可选，数组
description: [description] # 必需（≤ 200 字符）
---
```

### Output-template 模板 · 权威定义 (Output-template Template · Canonical)

输出模板定义 MUST 使用以下 5 字段 YAML frontmatter（详见 [output-template.md](references/output-template.md)）：

```yaml
---
title: [English title]
type: [agent|tool|task|command|mode|session|feature|context]
mode: [general|coder|all]
required: [comma-separated required fields]
optional: [comma-separated optional fields]
---
```

### 共同规则 · 适用于两套模板 (Common Rules · Apply to Both Templates)

- 9 字段模板 MUST 用于 system/extension 提示词文件。
- 5 字段模板 MUST 用于输出模板定义。
- 作者 MUST NOT 在同一文件内混用两套模板。
- `name`（agent-info）和 `title`（output-template）为 REQUIRED，省略即为违规。
- L2 必填字段（如 `role` / `usage` / `parameters` / `workflow` / `states` / `tools` 等）MUST 在对应 `*-prompt-spec.md` §必填字段 章节中显式声明其与 L1 字段的映射关系；映射关系缺失视为该 spec.md 缺陷。

> **关于 `*-prompt-spec.md` 的说明**：类型特定字段（如 `trigger` / `content` / `states` / `workflow` / `tools` 等）定义在各 spec.md 的"必填字段"小节；本节仅声明共同 frontmatter 骨架。
