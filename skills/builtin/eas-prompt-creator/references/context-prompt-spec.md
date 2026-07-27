# Context Prompt Specification

## Overview

Context prompts define context building, context injection, and context management behavior specifications.

## Frontmatter Specification

All context prompt files MUST include the following YAML frontmatter:

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
| description | string | No | - | File description | | string | No | - | Share targets |
| description | string | No | - | Context description |

## Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| name | Context name | `Bootstrap Memory`, `System Reminder` |
| trigger | Trigger timing | `On session start` |
| content | Injection content | `Memory file content` |

## Optional Fields

| Field | Description | Example |
|-------|-------------|---------|
| priority | Priority level | `high`, `medium`, `low` |
| truncation | Truncation strategy | `maxChars: 10000` |

## ContextMode Differences

EASBot supports two scenario modes:

| Mode | Description | Context Focus |
|------|-------------|---------------|
| `general` | General scenario | Documents, analysis, conversation |
| `coder` | Code scenario | Code development, debugging, refactoring |

## Fixed Section Structure

### 1. Context Header

```markdown
# [Context name]

## Type

[Context type description]
```

### 2. Trigger

```markdown
## Trigger

### When to inject
- [Timing 1]
- [Timing 2]

### Injection order
[Priority description]
```

### 3. Content

```markdown
## Content

```markdown
[Specific content]
```
```

### 4. Truncation

```markdown
## Truncation Strategy

| Strategy | Description |
|----------|-------------|
| maxChars | Maximum character count |
| priority | Lower priority content truncated first |
```

## Context Type Details

### Bootstrap Memory

Initial memory loaded on session startup.

```markdown
## Bootstrap Memory

### Trigger timing
- New session start
- Session resume

### Content sources
- `.easbot/memory/MEMORY.md`
- `docs/task/` directory

### Truncation strategy
- Maximum 10000 characters
- Preserve by priority
```

### System Reminder

System auto-injected reminder information.

```markdown
## System Reminder

### Format
```markdown
<system-reminder>
[Reminder content]
</system-reminder>
```
```

### Dynamic Prompt

Dynamically constructed context paragraphs.

```markdown
## Dynamic Prompt

### Construction method
1. Collect relevant context
2. Sort by priority
3. Truncate to limit length
4. Inject into system prompt
```

## ContextMode Context Differences

### General Mode Context

```markdown
## General Mode Context

### Injected content
- General system prompts
- Document processing guidelines
- Analysis methodology

### Prohibited content
- Code development specific instructions
- Debugging tool descriptions
```

### Coder Mode Context

```markdown
## Coder Mode Context

### Injected content
- Code development guidelines
- Test execution specifications
- Build check commands

### Prohibited content
- Non-code related document processing
```

## Example

```markdown
---
title: Bootstrap Memory Context
type: context
mode: all
category: memory
---

# Bootstrap Memory

## Type

Initial memory context loaded on session startup.

## Trigger

### When to inject
- New session start
- Session resume
- After long idle period

### Injection order
1. Static Prompt
2. Agent Prompt
3. Bootstrap Memory
4. Dynamic Prompt

## Content

```markdown
# Bootstrap Memory

[Loaded from .easbot/memory/MEMORY.md]

## Recent Tasks
[Loaded from docs/task/ directory]

## Important Findings
[Loaded from docs/task/findings.md]
```
```

## Truncation Strategy

### Truncation Rules

| Context Type | Max Characters | Priority |
|--------------|-----------------|----------|
| Agent Prompt | 5000 | 1 |
| Bootstrap Memory | 10000 | 2 |
| Dynamic Prompt | 5000 | 3 |

### Truncation Markers

```markdown
[Truncated content]
...
[Content truncated, reduced by N characters]
```

## Boundaries

### NEVER
- Inject sensitive information
- Assume user project structure
- Inject unverified content

### ALWAYS
- Verify content source
- Truncate by priority
- Mark truncation position

### CRITICAL
**Bootstrap Memory must be loaded from fixed paths to ensure content security and reliability.**
```

## Quality Checklist

- [ ] Trigger timing is clear
- [ ] Content format is correct
- [ ] Truncation strategy is reasonable
- [ ] Boundaries use correct keywords
- [ ] ContextMode association is clear
