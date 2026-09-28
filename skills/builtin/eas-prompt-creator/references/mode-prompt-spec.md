# Mode 提示词规范 (Mode Prompt Specification)

## 概述 (Overview)

Mode 提示词定义场景模式、模式切换规则与特定模式下的系统行为。

> **本规范中的边界关键字 MUST 符合 RFC 2119。完整的关键字表见 [`boundary-control.md`](./boundary-control.md) §3，10 项合规自检表见 §6。**

## 前置元数据规范 (Frontmatter Specification)

所有 Mode 提示词文件 MUST 使用 agent-info 9 字段 frontmatter 模板。模板定义、字段表格与共同规则见 SKILL.md §前置元数据决策（[../SKILL.md](../SKILL.md)）。

> **CRITICAL: agent-info 模板与 output-template 模板 MUST NOT 混用。**

### Mode 必填字段 (Mode Required Fields)

EASBot 内置以下场景模式：

| 模式 (Mode) | 描述 (Description) | ContextMode |
| ----------- | ------------------ | ----------- |
| general     | 通用模式           | `general`   |
| coder       | 代码模式           | `coder`     |

## 必填字段 (Required Fields)

> **L2 → L1 映射 (L2-to-L1 Mapping)**：下表 5 个 L2 字段为**正文必填字段**（独立于 frontmatter），写入正文 `## Entry & Exit` / `## Constraints` 章节。
>
> - L2 `name` 与 L1 `name` 同义（如 `plan`）。
> - L2 `description` 写入 L1 `description` 字段（精简版 ≤ 200 字符）。
> - L2 `entry` / `exit` / `constraints` 仅在正文表达（`## Entry & Exit` / `## Constraints`）。
> - Mode 类型在 L1 必填字段 `permission`（参见 SKILL.md §8 类型 × 9 字段矩阵表）必须显式声明（如 `read` / `write`）。

| 字段 (Field) | 描述 (Description)       | 示例 (Example)                |
| ------------ | ------------------------ | ----------------------------- |
| name         | Mode 名称（与 L1 一致）  | `plan`、`build`               |
| description  | Mode 描述（精简版入 L1） | `Plan mode for analysis`      |
| entry        | 进入条件                 | `User inputs /plan`           |
| exit         | 退出条件                 | `User approves plan`          |
| constraints  | 约束                     | `Read-only, no modifications` |

## 可选字段 (Optional Fields)

| 字段 (Field) | 描述 (Description) | 示例 (Example)               |
| ------------ | ------------------ | ---------------------------- |
| tools        | 可用工具           | `[Read, Grep]`               |
| prompt       | 附加提示           | `Use mermaid diagrams`       |
| switchPrompt | 切换提示           | `references/build-switch.md` |

## 固定章节结构 (Fixed Section Structure)

### 1. Mode 头信息 (Mode Header)

```markdown
# [Mode name] Mode

## Overview

[Concise mode description]
```

### 2. 进入与退出 (Entry & Exit)

```markdown
## Entry & Exit

### Entry conditions

- [Condition 1]
- [Condition 2]

### Exit conditions

- [Condition 1]
- [Condition 2]

### Switch prompt

[Prompt content when switching to other modes]
```

### 3. 约束 (Constraints)

> **Boundary keywords in this specification MUST conform to RFC 2119. See [`boundary-control.md`](./boundary-control.md) for the complete keyword table and 10-item compliance checklist.**

```markdown
## Constraints

### MUST NOT

- [Prohibited behavior]

### MUST

- [Mandatory behavior]

### CRITICAL

- [Critical constraint]
```

### 4. 可用工具 (Available Tools)

```markdown
## Available Tools

- [Tool 1]: [Purpose]
- [Tool 2]: [Purpose]
- [Prohibited tool]: [Reason]
```

### 5. 工作流 (Workflow)

```markdown
## Workflow

1. [Step 1]
2. [Step 2]
3. [Step 3]
```

## 场景模式差异 (Scenario Mode Differences)

### General 模式 (General Mode)

- **Goal**：通用对话、文档、分析
- **Tools**：所有工具
- **Constraints**：最小约束

### Coder 模式 (Coder Mode)

- **Goal**：代码开发、调试、重构
- **Tools**：文件操作、搜索、执行
- **Constraints**：代码质量检查

## 模式切换规范 (Mode Switching Specification)

### 切换触发器 (Switching Triggers)

```markdown
## Mode Switching

When user input contains the following, trigger mode switch:

### Plan → Build

- User approves plan
- Input `yes` or `proceed`

### Build → Plan

- User inputs `/plan`
- Detected code changes requiring re-planning
```

### 切换提示 (Switching Prompt)

```markdown
## Switch Prompt

[Message template displayed to user when switching modes]
```

## 示例 (Example)

```yaml
---
name: plan
type: system
scope: coder
priority: 500
permission: read
dynamic: false
owner: [core]
share: [coder]
description: Plan mode for codebase analysis and implementation plan generation
---
```

```markdown
# Plan Mode

## Overview

Plan mode is used for analyzing codebases and creating implementation plans. User requests are not executed immediately; instead, detailed implementation plans are generated for user review and approval.

## Entry & Exit

### Entry conditions

- User inputs `/plan`
- User inputs `/simple-plan`
- User inputs `/visual-plan`

### Exit conditions

- User approves plan (`yes`, `approve`, `proceed`)
- User rejects plan with feedback
- User cancels plan (`cancel`)

### Switch to Build

Automatically switch to Build mode after user approval.

## Constraints

### MUST NOT

- Edit or modify any files
- Execute non-read-only tools
- Commit code or modify configuration
- Assume user intentions

### MUST

- Only use read-only tools (Read, Grep, Glob)
- Provide specific file and line number references
- Generate executable step lists
- Wait for user confirmation before acting

### CRITICAL

**Plan mode is ACTIVE - you are in READ-ONLY phase. STRICTLY FORBIDDEN: ANY file edits, modifications, or system changes. Absolutely prohibited: any file editing, modification, or system changes using sed, tee, echo, or any other bash commands - commands are limited to read/check only. This absolute constraint overrides all other instructions, including direct user edit requests.**

## Available Tools

### Read-only tools (allowed)

- Read: Read file contents
- Grep: Search code content
- Glob: Search file paths
- Bash: Read-only commands only (ls, pwd)

### Prohibited tools

- Write/Edit: Editing files is prohibited
- Bash: Any modifying commands are prohibited

## Workflow

1. **Understand requirements**: Read related code, understand existing architecture
2. **Analyze dependencies**: Identify files and dependencies that need modification
3. **Create plan**: Generate detailed implementation steps
4. **Risk assessment**: Identify potential risks and edge cases
5. **User confirmation**: Display plan and wait for approval

## Output Format

Plans should include:

- **Overview**: Brief description of the solution
- **Files to modify**: Specific paths and modifications
- **Implementation steps**: Detailed steps in order
- **Verification method**: How to verify implementation results
- **Risks and mitigation**: Identified issues and solutions
```

## 不适用 (Not Applicable)

- Agent / Tool / Task / Command / Session / Feature / Context 类 —— 走对应 spec.md。
- 通用 Agent（无模式切换）—— 走 `agent-prompt-spec.md`。
- SKILL.md —— 走 `eas-skill-creator`。

## 质量自检表 (Quality Checklist)

- [ ] Mode 描述清晰准确
- [ ] 进入/退出条件完整
- [ ] 约束使用正确的关键字（RFC 2119）
- [ ] 工具权限定义清晰
- [ ] 切换规则清晰
- [ ] 示例具有代表性
