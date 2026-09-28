# 提示词验证规范 (Prompt Validation Specification)

## 概述 (Overview)

本文档定义 EASBot 提示词的验证规则与最佳实践，基于 Claude Code、OpenClaw、OpenCode 生产级提示词及行业最佳实践分析得出。

> **CRITICAL: 本文档中所有边界关键字 MUST 符合 RFC 2119。完整关键字表见 [`boundary-control.md`](./boundary-control.md) §3，10 项合规自检表见 §6。**

## 核心原则 (Core Principles)

### 1. 系统提示词的四大职责 (The Four Jobs of System Prompts)

系统提示词恰好有四项职责：

| 职责 (Job)                                         | 描述       | 典型位置                   |
| -------------------------------------------------- | ---------- | -------------------------- |
| **Tell it who it is**（告诉它是谁）                | 角色与身份 | 第一个章节                 |
| **Tell it where the walls are**（告诉它边界在哪）  | 安全约束   | 第一个章节，IMPORTANT 标记 |
| **Tell it what good looks like**（告诉它什么是好） | 质量标准   | 中间章节                   |
| **Give it tools**（给它工具）                      | 能力与知识 | 中间/末尾章节              |

**验证规则 (Validation Rule)**：每个提示词都应覆盖全部四项职责。缺失任何一项都表示提示词不完整。

### 2. U 型注意力曲线 (U-Shaped Attention Curve)

LLM 的注意力分布呈 U 型：

- **开头 (Beginning)**：注意力最高（首因效应）
- **中间 (Middle)**：注意力较低
- **结尾 (End)**：注意力较高（近因效应）

**验证规则 (Validation Rule)**：

- 将身份 + 安全置于最顶部
- 将关键提醒置于末尾
- 核心工作流位于上中部

### 3. Token 预算分配 (Token Budget Allocation)

**验证规则**：保持系统提示词在 6,000 tokens 以内（不含工具定义；详见 §Token 预算分配 表，按章节给出推荐 token 数）。

## Token 预算分配 (Token Budget Allocation)

| 章节                             | 推荐 Token 数   | 备注           |
| -------------------------------- | --------------- | -------------- |
| 身份 + 安全 (Identity + Safety)  | 200-500         | 简洁但不可妥协 |
| 语气与风格 (Tone & Style)        | 300-800         | 规则必须具体   |
| 核心工作流 (Core Workflow)       | 500-2,000       | 最重要的章节   |
| 工具使用策略 (Tool Usage Policy) | 300-1,000       | 取决于工具数量 |
| 领域知识 (Domain Knowledge)      | 0-1,000         | 优先按需加载   |
| 环境信息 (Environment Info)      | 100-300         | 动态生成       |
| 提醒 (Reminders)                 | 100-300         | 仅重复核心要点 |
| **总计 (Total)**                 | **1,500-6,000** |                |

## 写作原则 (Writing Principles)

### 1. 给原则而非流程 (Give Principles, Not Procedures)

❌ **反模式 (Anti-pattern)**：

```
Step 1: Read the file.
Step 2: Find the bug.
Step 3: Fix it.
Step 4: Run tests.
```

✅ **最佳实践 (Best Practice)**：

```
Always understand existing code before modifying it.
Verify your changes work (run tests, lint, etc.).
```

**验证规则 (Validation Rule)**：检查僵化的逐步流程；改用原则表达。

### 2. 硬约束使用绝对语言 (Use Absolute Language for Hard Constraints)

| 强度 (Strength)                 | 语言                | 适用场景           |
| ------------------------------- | ------------------- | ------------------ |
| 绝对禁止 (Absolute prohibition) | NEVER, MUST NOT     | 安全、不可逆操作   |
| 强要求 (Strong requirement)     | ALWAYS, MUST        | 核心工作流规则     |
| 推荐 (Recommendation)           | recommended, prefer | 存在例外的最佳实践 |
| 建议 (Suggestion)               | consider, you may   | 可选优化           |

**验证规则 (Validation Rule)**：

- 安全约束 MUST 使用 NEVER / MUST NOT
- 核心工作流规则 SHOULD 使用 ALWAYS / MUST
- 关键规则避免使用弱化语言

### 3. 双向约束 (Bidirectional Constraints)

❌ **单向 (One-sided)**：

```
Use the Read tool for reading files.
```

✅ **双向 (Bidirectional)**：

```
Use the Read tool for reading files instead of cat/head/tail.
Do NOT use bash commands (cat, head, tail, sed, awk) for file operations.
```

**验证规则 (Validation Rule)**：每条工具使用规则都应指定"做什么"与"不做什么"。

### 4. 解释 Why 而非只 What (Explain Why, Not Just What)

❌ **无理由 (Without rationale)**：

```
Don't use git commit --amend.
```

✅ **有理由 (With rationale)**：

```
Avoid git commit --amend. ONLY use --amend when user explicitly requested.
Reason: amending may overwrite others' commits.
```

**验证规则 (Validation Rule)**：关键规则 SHOULD 解释理由。

### 5. 结构优于散文 (Structure Over Prose)

**验证规则 (Validation Rule)**：检查是否包含：

- [ ] 使用 Markdown 标题（##、###）建立层次
- [ ] 使用项目列表代替段落
- [ ] 使用 XML 标签包裹特殊内容：`<example>`、`<env>`、`<system-reminder>`
- [ ] 使用表格表达对比与映射

## 应避免的反模式 (Anti-Patterns to Avoid)

> 通用规则：**MUST NOT** 出现下列 6 项反模式；任一项命中即视为该提示词不通过 `prompt-validation.md` §质量自检表。

### 1. 伪装成 Agent 的 Prompt Chains (Prompt Chains Disguised as Agents)

❌ 反模式：

```text
First call tool A to get data.
Then call tool B with the result.
Then format the output as JSON.
Then save to file.
```

修复：**MUST NOT** 写逐步流程；**MUST** 给出目标与约束，让模型自主决定步骤。

### 2. 奉承工程 (Flattery Engineering)

❌ 反模式：

```text
You are an EXTREMELY TALENTED and INCREDIBLY EXPERIENCED
senior software engineer with 20 years of experience...
```

修复：**MUST NOT** 使用最高级形容词；**MUST** 删除奉承语，tokens 用于实际概念。

### 3. 知识倾倒 (Knowledge Dumps)

❌ 反模式：

```text
Here is the complete API documentation for our 200 endpoints:
[5000 tokens of API docs]
```

修复：**MUST NOT** 预加载大段参考材料；**MUST** 按需加载（`Use the get_api_docs tool to retrieve when needed.`）。

### 4. 重复工具描述 (Repeating Tool Descriptions)

❌ 反模式：

```text
The Read tool reads a file from the filesystem.
[Tool definition already says this]
```

修复：**MUST NOT** 重复工具定义中已有的功能描述；**MUST** 仅添加策略性指导（何时使用 / 优先级 / 工具间协作）。

### 5. 缺失失败处理 (Missing Failure Handling)

❌ 反模式：

```text
[No guidance on what to do when tool fails]
```

修复：**MUST** 包含失败处理策略：

```text
If a tool call is denied, do not re-attempt the exact same call.
Think about why it was denied and adjust your approach.
```

**MUST NOT** 假定工具调用必然成功。

### 6. 忽视上下文窗口衰减 (Ignoring Context Window Decay)

❌ 反模式：超长提示词（> 10,000 tokens）且无摘要策略。

修复：**MUST** 保持系统提示词精简（< 6,000 tokens，§Token 预算分配）；**MUST** 将关键规则置于首尾（U 型注意力曲线）；**MUST** 在长会话中预留摘要触发点。

## 中段注入 (Mid-Conversation Injection)

### 用途 (Purpose)

系统提示词仅在开始出现一次。中段注入通过近因效应刷新规则。

### 前置声明 (Prerequisite Declaration)

MUST 在系统提示词中声明：

```
Tool results and user messages may include <system-reminder> tags.
<system-reminder> tags contain useful information and reminders.
They are automatically added by the system.
```

### 使用模式 (Usage Patterns)

1. **行为提醒 (Behavioral Reminders)**：

```xml
<system-reminder>
The task tools haven't been used recently. If you're working on tasks
that would benefit tracking progress, using TaskCreate...
</system-reminder>
```

2. **模式切换 (Mode Switching)**：

```xml
<system-reminder>
Plan mode is active. You MUST NOT make any edits or run non-readonly tools.
</system-reminder>
```

3. **文件变更通知 (File Change Notifications)**：

```xml
<system-reminder>
Note: /path/to/file.ts was modified. This change was intentional.
</system-reminder>
```

4. **动态上下文 (Dynamic Context)**：

```xml
<system-reminder>
Today's date is 2026-03-21.
Current branch: dev
</system-reminder>
```

### 验证规则 (Validation Rule)

- [ ] 系统提示词声明 `<system-reminder>` 标签
- [ ] 提醒简短（1-2 条关键规则）
- [ ] 提醒不与系统提示词矛盾

## 提示词缓存优化 (Prompt Cache Optimization)

### 缓存友好布局 (Cache-Friendly Layout)

```
System prompt (static)      ← Cache breakpoint 1
Tool definitions (static)   ← Cache breakpoint 2
CLAUDE.md / project rules   ← Cache breakpoint 3
Conversation history         ← Breakpoint 4
```

### 缓存破坏布局 (Cache-Destroying Layout)

```
System prompt
DYNAMIC TIMESTAMP            ← Everything after = cache miss
Tool definitions
Conversation history
```

**验证规则 (Validation Rule)**：

- [ ] 系统提示词中没有高频动态值
- [ ] 动态上下文置于用户消息注入
- [ ] 工具定义保持稳定

## 质量自检表 (Quality Checklist)

### 结构 (Structure)

- [ ] 身份在最顶部？
- [ ] 安全约束使用 IMPORTANT 标记并在末尾重复？
- [ ] 章节分隔清晰？
- [ ] 示例包裹在 `<example>` 标签中？

### Token 预算 (Token Budget)

- [ ] 自定义部分 < 6,000 tokens？
- [ ] 不重复工具定义中已有的信息？
- [ ] 领域知识按需加载，非预加载？
- [ ] 无冗长的背景故事？

### 规则质量 (Rule Quality)

- [ ] 每条规则都可真假测试？
- [ ] 硬约束使用绝对语言（NEVER / MUST）？
- [ ] 软建议使用推荐语言（recommended / prefer）？
- [ ] 关键规则解释 why 而非仅 what？
- [ ] 双向约束（做这个 + 不做那个）？

### Agent 行为 (Agent Behavior)

- [ ] 给原则而非僵化流程？
- [ ] 处理了"工具调用被拒绝"场景？
- [ ] 处理了"遇到障碍"策略？
- [ ] 上下文管理策略到位？

### 不应做的事 (What NOT to Do)

- [ ] 没有奉承或最高级形容词？
- [ ] 没有冗余的"你是有帮助的 AI"声明？
- [ ] 不写成 prompt chain？
- [ ] 没有过度工程（无人要求的功能）？

## 内容质量评分 (Content Quality Scoring)

### 评分标准 (Scoring Criteria)

| 分数 | 等级 (Level)     | 描述                               | 处理动作 (Action)   |
| ---- | ---------------- | ---------------------------------- | ------------------- |
| 5    | 必需 (Required)  | 对行为有清晰影响，无歧义，边界明确 | **MUST** 包含       |
| 4    | 重要 (Important) | 引导 Agent 行为，边界明确          | **ALWAYS** 推荐包含 |
| 3    | 有用 (Useful)    | 有一定影响，但边界不够明确         | 可选包含            |
| 2    | 模糊 (Vague)     | 影响小，存在歧义                   | 考虑剔除            |
| 1    | 冗余 (Redundant) | 无清晰影响，含糊                   | **DO NOT** 剔除     |

### 应剔除的内容 (Content to Remove)

根据分析，以下内容类型通常应剔除：

| 内容类型 (Content Type)                     | 原因 (Reason)        |
| ------------------------------------------- | -------------------- |
| 版本配置 (Version configurations)           | 技术细节，无行为影响 |
| 监控配置 (Monitoring configurations)        | 技术细节，无行为影响 |
| 模糊情感描述 (Vague emotional descriptions) | 含糊不清，影响不明   |
| 成长机制 (Growth mechanisms)                | 含糊不清，影响不明   |
| 适应机制 (Adaptation mechanisms)            | 含糊不清，影响不明   |
| 开发计划 (Development plans)                | 含糊不清，影响不明   |

## 推荐提示词结构 (Recommended Prompt Structure)

```
┌─────────────────────────────────────────────┐
│ 1. Identity (1-3 sentences)                 │  ← Read first, anchors behavior
│ 2. Security & Safety (IMPORTANT markers)    │  ← Non-negotiable constraints
│ 3. Tone & Style                             │  ← Controls output format
│ 4. Core Workflow                            │  ← How to do the work
│ 5. Tool Usage Policy                        │  ← Tool selection priorities
│ 6. Domain Knowledge (optional)              │  ← On-demand, not pre-loaded
│ 7. Environment Info (dynamic)               │  ← Runtime context
│ 8. Reminders                                │  ← Re-state critical rules
├─────────────────────────────────────────────┤
│ [Tool Definitions — system-injected]        │  ← Not editable
├─────────────────────────────────────────────┤
│ [User Message]                              │
└─────────────────────────────────────────────┘
```

## RFC 2119 交叉引用 (RFC 2119 Cross-Reference)

EASBot 提示词中的边界控制关键字 **MUST** 符合 [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119)。本文档的 §写作原则 §2 与 §内容质量评分 涉及关键字强度层级——到 RFC 2119 级别的映射由 [`boundary-control.md`](./boundary-control.md) §1 与 §3 定义。

### 映射速查表 (Mapping Summary)

| 本文档的关键字强度层（中文）    | RFC 2119 级别       | 权威关键字集（保留英文原貌）                             |
| ------------------------------- | ------------------- | -------------------------------------------------------- |
| 绝对禁止 (Absolute prohibition) | L1（负向）          | **MUST NOT** / `NEVER`                                   |
| 绝对要求 (Absolute requirement) | L1（正向）          | **MUST** / **SHALL** / `MUST` / `ALWAYS`                 |
| 强推荐 (Strong recommendation)  | L2                  | **SHOULD** / **RECOMMENDED** / `DO NOT`                  |
| 可选 (Optional)                 | L3                  | **MAY** / **OPTIONAL**                                   |
| 包络强调 (Emphasis wrapper)     | **非级别 · 仅作块** | `CRITICAL` — 包裹底层 MUST/MUST NOT 正文；不视为独立级别 |

> **`CRITICAL` 块的关键约束 (CRITICAL-block Constraints)**：
>
> - `CRITICAL` **NOT** RFC 2119 4 级层次中的任何一级；它是一个**视觉强调包络块**。
> - 每个 `CRITICAL` 块 MUST 内部包含一条 `MUST` 或 `MUST NOT`（或 RFC 2119 等价关键字）正文；没有底层 MUST/MUST NOT 的孤立 `CRITICAL` 块 = 违规（参见 `boundary-control.md` §2.1）。
> - 示例合法形态：`### CRITICAL ... [一句 MUST / MUST NOT 正向或负向约束]`。

### 本文档涉及的 RFC 2119 点 (Where This Document Talks About RFC 2119)

> **统一约定 (Unified Convention)**：本节重新对齐 §核心原则 / §Token 预算 / §质量自检表 三段的 RFC 2119 级别声明，避免与上方表格 / 自检表相互矛盾。

- **§核心原则 / Token 预算分配** — Token 预算为 **SHOULD**（L2），允许有理由地偏离（如一次性调试脚本）；非 MUST。
- **§核心原则 / 系统提示词的四大职责** — 覆盖全部四项为 **MUST**（L1）；缺失任一职责即视为提示词不完整。
- **§写作原则 / 硬约束使用绝对语言** — 安全约束使用 NEVER / MUST NOT（L1）= **MUST**；将 "NEVER / ALWAYS / MUST / DO NOT" 替换为 `boundary-control.md` §3 的 RFC 2119 映射。
- **§写作原则 / 双向约束** — L1 双向约束 **MUST** 互为镜像（正向规则有对应负向规则，反之亦然）。
- **§反模式 / 伪装成 Agent 的 Prompt Chains** — 标为反模式意味着 **MUST NOT**（L1）；作者 MUST NOT 写出流水线风格的提示词。
- **§反模式 / 缺失失败处理** — 失败处理指引 **MUST** 存在（L1）。
- **§反模式 / 重复工具描述 / 知识倾倒 / 奉承工程 / 忽视上下文衰减** — 均标为反模式，**MUST NOT** 出现（L1）。
- **§推荐提示词结构** — 8 章节结构为 **SHOULD**（L2）；允许有理由地偏离（如纯工具描述文件可省略"工具使用策略"）。
- **§质量自检表** — 清单本身为 **REQUIRED**（每条 checkbox），整体执行校验时为 **MUST**（L1）。所有 P0 项 MUST 通过；P1 项 MUST 修复或显式豁免。

### 本文档未定义的内容 (What This Document Does NOT Define)

- 关键字集与同义词表 — 见 [`boundary-control.md`](./boundary-control.md) §3。
- 10 项合规自检表 — 见 [`boundary-control.md`](./boundary-control.md) §6。
- 层级与正确性规则 — 见 [`boundary-control.md`](./boundary-control.md) §2 与 §4。

## 参考资料 (References)

| 来源                              | 关键洞见 (Key Insight)        |
| --------------------------------- | ----------------------------- |
| Claude Code v2.0.14 System Prompt | 生产级 Agent 提示词结构       |
| OpenClaw System Prompt            | 上下文文件顺序                |
| OpenCode Default Session Prompt   | 简洁提示词风格                |
| IndieHackers Deep Analysis        | U 型注意力、token 预算        |
| shareAI-lab/learn-claude-code     | "The model is the agent" 哲学 |
