# Task Prompt Specification

## Overview

Task prompts define task management workflows, task state transitions, and output formatting.

## Frontmatter Specification

All task prompt files MUST include the following YAML frontmatter:

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
| description | string | No | - | File description | | - | Share targets |
| description | string | No | - | Task description |

## Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| name | Task name | `Todowrite`, `TaskCreate` |
| purpose | Task purpose | `Create and manage task lists` |
| workflow | Workflow process | `Create → In Progress → Complete` |
| states | State definitions | `pending|in_progress|completed` |

## Optional Fields

| Field | Description | Example |
|-------|-------------|---------|
| triggers | Trigger conditions | `Tasks with 3+ steps` |
| limits | Constraints | `Maximum 20 tasks` |
| dependencies | Dependencies | `Complete before starting next` |
| outputTemplate | Output format | `JSON or Markdown` |

## Output Template

**Important**: Output template is not fixed. Based on the scenario:

- If the Agent can determine the prompt needs a fixed output format (e.g., task results, status updates), add it automatically
- If the Agent cannot determine, ask the user: `"Does this prompt require a fixed output template? Supported formats: JSON / Markdown"`

**Supported formats**: JSON, Markdown

When adding output template:

```markdown
## Output Template

### Success Output
```json
{
  "status": "success",
  "data": {
    "id": "task-001",
    "content": "task content",
    "status": "completed",
    "priority": "high"
  }
}
```

### Error Output
```json
{
  "status": "error",
  "message": "Error description"
}
```
```

## Fixed Section Structure

### 1. Overview

```markdown
## Overview

[Concise description of task purpose]
```

### 2. When to Use

```markdown
## When to Use

### Use Cases
- [Scenario 1]
- [Scenario 2]

### Do Not Use
- [Scenario 1]
- [Scenario 2]
```

### 3. Workflow

```markdown
## Workflow

[State flow diagram or text description]

State transitions:
- pending → in_progress: [trigger condition]
- in_progress → completed: [trigger condition]
```

### 4. Boundaries

```markdown
### NEVER
- [Prohibited behavior]

### DO NOT
- [Discouraged behavior]

### ALWAYS
- [Required behavior]
```

## Example

```markdown
---
title: Todowrite Task Prompt
type: task
mode: all
scope: manage
---

# Todowrite Task Prompt

## Overview

Create and manage structured task lists to track progress of complex tasks.

## When to Use

### Use Cases
- Complex multi-step tasks (3+ steps)
- Tasks requiring progress tracking
- User explicitly requests task list
- Adding follow-up tasks immediately after completing one

### Do Not Use
- Single simple tasks
- Conversational or informational interactions
- Simple tasks within 3 steps

## Workflow

State transitions:
- pending → in_progress: When starting work
- in_progress → completed: When task is finished
- new task → pending: When added

## Output Template

**Note**: If the Agent cannot determine whether an output template is needed, ask the user.

### Task List Format (JSON)
```json
{
  "todos": [
    {
      "id": "1",
      "content": "Task description",
      "status": "in_progress",
      "priority": "high"
    }
  ]
}
```

### Task Item Format
```json
{
  "id": "unique-identifier",
  "content": "Clear and concise task description",
  "status": "pending|in_progress|completed",
  "priority": "high|medium|low"
}
```

## Boundaries

### NEVER
- Batch mark multiple tasks as complete
- Create more than 20 tasks
- Delete incomplete tasks

### DO NOT
- Vague task descriptions
- Skip in_progress state when completing
- Assume user intentions

### ALWAYS
- Use TodoWrite tool to manage tasks
- Keep one in_progress task at a time
- Update status immediately after completion
- Keep task descriptions clear and specific

## Quality Checklist

- [ ] Use cases are clearly defined
- [ ] Do-not-use cases are clearly defined
- [ ] State transitions are logical
- [ ] Boundaries are complete with correct keywords
