# Command Prompt Specification

## Overview

Command prompts define guidelines for command-line execution, parameter handling, and output formatting.

## Frontmatter Specification

All command prompt files MUST include the following YAML frontmatter:

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
| name | Command name | `/commit`, `/plan` |
| description | Command description | `Commit code and push` |
| trigger | Trigger method | `/commit [options]` |
| execution | Execution flow | `git add → git commit → git push` |

## Optional Fields

| Field | Description | Example |
|-------|-------------|---------|
| arguments | Parameter description | `$ARGUMENTS` |
| prerequisites | Prerequisites | `git initialized` |
| postAction | Post action | `Auto open PR` |

## Fixed Section Structure

### 1. Header

```markdown
---
name: [Command name]
description: [Command description]
model: [Specified model, optional]
subtask: [Whether it's a subtask]
---
```

### 2. Description

```markdown
## Description

[Concise functional description of the command]
```

### 3. Execution

```markdown
## Execution

1. [Step 1]
2. [Step 2]
3. [Step 3]
```

### 4. Arguments

```markdown
## Arguments

| Parameter | Description | Example |
|-----------|-------------|---------|
| $ARGUMENTS | User input parameters | `feat: add new feature` |
```

### 5. Rules

```markdown
## Rules

### NEVER
- [Prohibited behavior]

### ALWAYS
- [Mandatory behavior]
```

## Special Formats

### Subtask Format

When `subtask: true`:

```markdown
---
model: [Specified model]
subtask: true
---

[Execution content]
```

### Git Command Format

```markdown
## GIT Operations

!`git diff`
!`git status`
```

## Example

```markdown
---
title: Commit Command Prompt
type: command
mode: coder
scope: slash
---

# Commit Command Prompt

## Description

Commit code changes and push to remote repository.

## Execution

1. Show git diff for user to confirm changes
2. Show git status
3. Collect commit message
4. Execute git commit
5. Execute git push

## Commit Message Rules

### Format
```
<type>: <description>

[type] optional values:
- feat: new feature
- fix: bug fix
- docs: documentation update
- style: code formatting
- refactor: code refactoring
- test: testing
- chore: build/tooling
```

### NEVER
- Commit unconfirmed changes
- Auto resolve conflicts
- Use generic commit messages

### ALWAYS
- Include type prefix
- Describe user-visible changes
- Show diff first for confirmation

## Arguments

```bash
$ARGUMENTS = [Commit message provided by user]
```

## Examples

**Correct:**
```
feat: add user login feature
fix: fix search result pagination issue
docs: update API documentation
```

**Incorrect:**
```
improved something
fixed bug
update
```

## Quality Checklist

- [ ] Command description is clear
- [ ] Execution flow is complete
- [ ] Parameter handling is correct
- [ ] Rules use correct keywords
- [ ] Examples are representative
