# Mode Prompt Specification

## Overview

Mode prompts define scenario modes, mode switching rules, and specific mode system behaviors.

## Frontmatter Specification

All mode prompt files MUST include the following YAML frontmatter:

```yaml
---
name: [filename]                  # 文件名（必需，用于唯一标识）
type: [system|extension]          # 文件类型（必需）
scope: [all|general|coder]        # 模式范围（必需）
priority: [number]                # 加载优先级（可选，默认 1000）
permission: [read|write]          # 权限（可选，默认 read）
dynamic: [true|false]             # 是否动态内容（可选，默认 false）
owner: [string...]                # 所有者（可选，数组）
share: [string...]                # 共享目标（可选，数组）
description: [description]        # 描述（可选）
---
```

### Frontmatter Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| name | string | Yes | - | File name (unique identifier) |
| type | string | Yes | - | `system` or `extension` |
| scope | string | Yes | - | `all`, `general`, or `coder` |
| priority | number | No | 1000 | Loading priority (lower = earlier) |
| permission | string | No | read | `read` or `write` |
| dynamic | boolean | No | false | Whether content is dynamic |
| owner | string[] | No | - | Owner identifiers |
| share | string[] | No | - | Share targets |
| description | string | No | - | File description |

## Built-in Modes

EASBot has the following built-in scenario modes:

| Mode | Description | ContextMode |
|------|-------------|-------------|
| general | General mode | `general` |
| coder | Code mode | `coder` |

## Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| name | Mode name | `plan`, `build` |
| description | Mode description | `Plan mode for analysis` |
| entry | Entry conditions | `User inputs /plan` |
| exit | Exit conditions | `User approves plan` |
| constraints | Constraints | `Read-only, no modifications` |

## Optional Fields

| Field | Description | Example |
|-------|-------------|---------|
| tools | Available tools | `[Read, Grep]` |
| prompt | Additional prompt | `Use mermaid diagrams` |
| switchPrompt | Switch prompt | `references/build-switch.md` |

## Fixed Section Structure

### 1. Mode Header

```markdown
# [Mode name] Mode

## Overview

[Concise mode description]
```

### 2. Entry & Exit

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

### 3. Constraints

```markdown
## Constraints

### NEVER
- [Prohibited behavior]

### ALWAYS
- [Mandatory behavior]

### CRITICAL
- [Critical constraint]
```

### 4. Available Tools

```markdown
## Available Tools

- [Tool 1]: [Purpose]
- [Tool 2]: [Purpose]
- [Prohibited tool]: [Reason]
```

### 5. Workflow

```markdown
## Workflow

1. [Step 1]
2. [Step 2]
3. [Step 3]
```

## Scenario Mode Differences

### General Mode

- **Goal**: General conversation, documents, analysis
- **Tools**: All tools
- **Constraints**: Minimal

### Coder Mode

- **Goal**: Code development, debugging, refactoring
- **Tools**: File operations, search, execution
- **Constraints**: Code quality checks

## Mode Switching Specification

### Switching Triggers

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

### Switching Prompt

```markdown
## Switch Prompt

[Message template displayed to user when switching modes]
```

## Example

```markdown
---
title: Plan Mode Prompt
type: mode
mode: coder
category: plan
---

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

### NEVER
- Edit or modify any files
- Execute non-read-only tools
- Commit code or modify configuration
- Assume user intentions

### ALWAYS
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

## Quality Checklist

- [ ] Mode description is clear and accurate
- [ ] Entry/exit conditions are complete
- [ ] Constraints use correct keywords
- [ ] Tool permissions are clearly defined
- [ ] Switching rules are clear
- [ ] Example is representative
