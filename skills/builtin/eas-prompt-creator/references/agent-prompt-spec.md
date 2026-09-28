# Agent 提示词规范 (Agent Prompt Specification)

## 概述 (Overview)

Agent 提示词定义 Agent 的身份、行为模式、能力、边界与交互规范。

> **本规范中的边界关键字 MUST 符合 RFC 2119。完整的关键字表见 [`boundary-control.md`](./boundary-control.md) §3，10 项合规自检表见 §6。**

## 前置元数据规范 (Frontmatter Specification)

所有 Agent 提示词文件 MUST 使用 agent-info 9 字段 frontmatter 模板。模板定义、字段表格与共同规则见 SKILL.md §前置元数据决策（[../SKILL.md](../SKILL.md)）。

> **CRITICAL: agent-info 模板与 output-template 模板 MUST NOT 混用。**

### Agent 必填字段 (Agent Required Fields)

> **L2 → L1 映射 (L2-to-L1 Mapping)**：下表 5 个 L2 字段均为**正文必填字段**（独立于 frontmatter）；作者 MUST 将其写入正文"## Identity"章节。
> 与 9 字段 agent-info frontmatter（L1）的关系如下：
>
> - L2 `name` 与 L1 `name` 同义；L1 `name` = 文件名（系统加载用），L2 `name` = 正文自述（agent 可读），两者 MUST 一致。
> - L2 `role` / `identity` / `capabilities` / `boundaries` 均无对应 L1 字段，仅作为正文内容出现。

| 字段 (Field) | 描述 (Description)       | 示例 (Example)                            |
| ------------ | ------------------------ | ----------------------------------------- |
| name         | Agent 名称（与 L1 一致） | `eas-coder`、`explore-agent`              |
| role         | Agent 角色               | `Code Editor`、`Search Expert`            |
| identity     | Agent 身份描述           | `You are EASBot's code assistant`         |
| capabilities | 核心能力列表             | `Code generation, debugging, refactoring` |
| boundaries   | 行为边界                 | `Do not modify unread files`              |

## 可选字段 (Optional Fields)

| 字段 (Field) | 描述 (Description) | 示例 (Example)        |
| ------------ | ------------------ | --------------------- |
| model        | 指定模型           | `haiku`、`opus`       |
| permission   | 权限级别           | `readonly`、`edit`    |
| tools        | 允许使用的工具     | `[Read, Write, Bash]` |
| outputStyle  | 输出风格           | `concise`、`detailed` |
| language     | 语言偏好           | `Chinese`、`English`  |

## 固定章节结构 (Fixed Section Structure)

### 1. 身份章节 (Identity Section)

```markdown
You are [role name], a [primary responsibility description].

Your core responsibilities:

- [Responsibility 1]
- [Responsibility 2]
- [Responsibility 3]
```

### 2. 能力章节 (Capabilities Section)

```markdown
## Capabilities

You have the following core capabilities:

- [Capability 1]
- [Capability 2]
```

### 3. 边界章节 (Boundaries Section)

> **Boundary keywords in this specification MUST conform to RFC 2119. See [`boundary-control.md`](./boundary-control.md) for the complete keyword table and 10-item compliance checklist.**

使用边界控制关键字：

```markdown
## Boundaries

### MUST NOT

- [Absolute prohibition 1]
- [Absolute prohibition 2]

### SHOULD NOT

- [Non-recommended behavior 1]
- [Non-recommended behavior 2]

### MUST

- [Mandatory action 1]
- [Mandatory action 2]
```

### 4. 交互章节 (Interaction Section)

```markdown
## Interaction

- Communicate using [language]
- Output style: [concise/detailed]
- Include [file path:line number] in code references
```

### 5. 输出模板（可选）(Output Template · Optional)

当 Agent 需要产生特定格式输出时：

```markdown
## Output Template

[Output format description and examples]
```

## Subagent 特定 (Subagent Specific)

子 Agent 提示词需要额外内容：

```markdown
## Subagent Specific

- You are a **subagent**, derived from [parent agent name]
- Your only task is: [task description]
- Report back to parent Agent after completion
- **Do not** initiate new tasks or take proactive actions
```

## 示例 (Example)

```yaml
---
name: explore-subagent
type: system
scope: coder
priority: 800
permission: read
dynamic: false
owner: [plan-mode]
share: [general]
description: Explore subagent specialized in codebase search and exploration
---
```

```markdown
# Explore Subagent

## Identity

You are Explore Subagent, a sub-agent specialized in codebase search and exploration.

## Capabilities

- Fast file location (Glob pattern matching)
- Code content search (regular expressions)
- File content analysis

## Boundaries

### MUST NOT

- Modify any files
- Execute operations that may change system state

### MUST

- Return absolute paths
- Provide clear search result summaries

## Subagent Specific

- Derived from Plan Mode
- Responsible only for information collection
- Report immediately after discovering information
```

## 不适用 (Not Applicable)

- 工具（Tool）类提示词 —— 走 `tool-prompt-spec.md`。
- 任务（Task）类提示词 —— 走 `task-prompt-spec.md`。
- 命令（Command）类提示词 —— 走 `command-prompt-spec.md`。
- 模式（Mode）/ 会话（Session）/ 特性（Feature）/ 上下文（Context）类 —— 走对应 spec.md。
- SKILL.md / 技能结构本身 —— 走 `eas-skill-creator`。

## 质量自检表 (Quality Checklist)

- [ ] 身份描述清晰准确
- [ ] 能力列表完整
- [ ] 边界使用正确的关键字（RFC 2119）
- [ ] 示例具有代表性
- [ ] 与父 Agent 的关系清晰
