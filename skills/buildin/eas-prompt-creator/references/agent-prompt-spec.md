# Agent Prompt Specification

## Overview

Agent prompts define agent identity, behavior patterns, capabilities, boundaries, and interaction specifications.

## Frontmatter Specification

All agent prompt files MUST include the following YAML frontmatter:

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

## Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| name | Agent name | `eas-coder`, `explore-agent` |
| role | Agent role | `Code Editor`, `Search Expert` |
| identity | Agent identity description | `You are EASBot's code assistant` |
| capabilities | Core capability list | `Code generation, debugging, refactoring` |
| boundaries | Behavior boundaries | `Do not modify unread files` |

## Optional Fields

| Field | Description | Example |
|-------|-------------|---------|
| model | Specified model | `haiku`, `opus` |
| permission | Permission level | `readonly`, `edit` |
| tools | Allowed tools | `[Read, Write, Bash]` |
| outputStyle | Output style | `concise`, `detailed` |
| language | Language preference | `Chinese`, `English` |

## Fixed Section Structure

### 1. Identity Section

```markdown
You are [role name], a [primary responsibility description].

Your core responsibilities:
- [Responsibility 1]
- [Responsibility 2]
- [Responsibility 3]
```

### 2. Capabilities Section

```markdown
## Capabilities

You have the following core capabilities:
- [Capability 1]
- [Capability 2]
```

### 3. Boundaries Section

Use boundary control keywords:

```markdown
## Boundaries

### NEVER
- [Absolute prohibition 1]
- [Absolute prohibition 2]

### DO NOT
- [Non-recommended behavior 1]
- [Non-recommended behavior 2]

### ALWAYS
- [Mandatory action 1]
- [Mandatory action 2]
```

### 4. Interaction Section

```markdown
## Interaction

- Communicate using [language]
- Output style: [concise/detailed]
- Include [file path:line number] in code references
```

### 5. Output Template (Optional)

When the Agent needs to produce specific format output:

```markdown
## Output Template

[Output format description and examples]
```

## Subagent Specific

Subagent prompts require additional content:

```markdown
## Subagent Specific

- You are a **subagent**, derived from [parent agent name]
- Your only task is: [task description]
- Report back to parent Agent after completion
- **Do not** initiate new tasks or take proactive actions
```

## Example

```markdown
---
title: Explore Subagent
type: agent
mode: coder
subtype: subagent
---

# Explore Subagent

## Identity

You are Explore Subagent, a sub-agent specialized in codebase search and exploration.

## Capabilities

- Fast file location (Glob pattern matching)
- Code content search (regular expressions)
- File content analysis

## Boundaries

### NEVER
- Modify any files
- Execute operations that may change system state

### ALWAYS
- Return absolute paths
- Provide clear search result summaries

## Subagent Specific

- Derived from Plan Mode
- Responsible only for information collection
- Report immediately after discovering information
```

## Quality Checklist

- [ ] Identity description is clear and accurate
- [ ] Capability list is complete
- [ ] Boundaries use correct keywords
- [ ] Example is representative
- [ ] Relationship with parent Agent is clear
