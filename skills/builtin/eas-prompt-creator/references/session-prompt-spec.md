# Session Prompt Specification

## Overview

Session prompts define session lifecycle, session initialization, and session management behavior specifications.

## Frontmatter Specification

All session prompt files MUST include the following YAML frontmatter:

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
| name | Session type | `default`, `explore` |
| trigger | Trigger conditions | `On new session start` |
| content | Session content | `System prompt content` |

## Optional Fields

| Field | Description | Example |
|-------|-------------|---------|
| context | Context injection | `memory`, `knowledge` |
| cleanup | Cleanup actions | `Compact history messages` |

## Fixed Section Structure

### 1. Session Type

```markdown
# [Session type] Session Prompt

## Type

[Brief description of session type]
```

### 2. Trigger

```markdown
## Trigger

### When to trigger
- [Condition 1]
- [Condition 2]

### Trigger timing
- [Timing 1]
- [Timing 2]
```

### 3. Content

```markdown
## Content

[The specific session prompt content]

### Example
```markdown
[Prompt example]
```
```

### 4. Context Injection

```markdown
## Context Injection

### Injection content
- [Context 1]
- [Context 2]

### Injection timing
[Timing]
```

## Session Type Details

### Default Session

Default prompt when starting a new session.

```markdown
# Default Session Prompt

## Content

```markdown
You are EASBot, an intelligent assistant.

Use tools to help you complete tasks.
```
```

### Resume Session

Prompt when resuming a previous session.

```markdown
# Resume Session Prompt

## Content

```markdown
You are resuming a previous session.

[Load previous context]
```
```

### Summary Session

Prompt for session summary generation.

```markdown
# Summary Session Prompt

## Content

```markdown
Summarize the work done in this session.

Rules:
- 2-3 sentences
- Describe changes not process
- Use first person
```
```

## Example

```markdown
---
title: Default Session Prompt
type: session
mode: all
category: init
---

# Default Session Prompt

## Type

Default session startup prompt for all new session initialization.

## Trigger

### When to trigger
- User starts new CLI session
- User creates new project context
- Session timeout and reconnect

## Content

```markdown
You are EASBot, an intelligent assistant.

Use tools to help you complete tasks. Available tools:
- Read: Read files
- Write: Write files
- Edit: Edit files
- Bash: Execute commands
- Grep: Search content
- Glob: Find files

## Context Injection

### Always inject
- Current working directory
- User identity information
- System configuration

### Inject on demand
- Long-term memory content
- Project knowledge base
- Related documentation
```

## Boundaries

### NEVER
- Assume user's project structure
- Preset user preferences
- Skip context loading

### ALWAYS
- Confirm working directory
- Load relevant context
- Check system configuration
```

## Quality Checklist

- [ ] Trigger conditions are clear
- [ ] Session content is complete
- [ ] Context injection logic is correct
- [ ] Boundaries use correct keywords
