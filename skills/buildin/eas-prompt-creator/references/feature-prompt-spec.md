# Feature Prompt Specification

## Overview

Feature prompts define special functionality features (such as KAIROS, Daemon, Proactive) and their system injection behavior specifications.

## Frontmatter Specification

All feature prompt files MUST include the following YAML frontmatter:

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
| description | string | No | - | File description | permission | string | No | read | `read` or `write` |
| dynamic | boolean | No | false | Whether content is dynamic |
| owner | string | No | - | Owner identifier |
| share | string | No | - | Share targets |
| description | string | No | - | Feature description |

## Built-in Features

| Feature | Description | Feature Flag |
|---------|-------------|--------------|
| KAIROS | Resident assistant mode | `FEATURE_KAIROS` |
| Daemon | Background daemon | `FEATURE_DAEMON` |
| Proactive | Proactive work mode | `FEATURE_PROACTIVE` |
| Heartbeat | Heartbeat mechanism | Built-in |

## Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| name | Feature name | `KAIROS`, `Proactive` |
| description | Feature description | `Resident assistant, supports background tasks` |
| trigger | Activation condition | `FEATURE_KAIROS=1` |
| injection | Injection content | `Heartbeat-driven instructions` |

## Optional Fields

| Field | Description | Example |
|-------|-------------|---------|
| subsections | Sub-features | `KAIROS_BRIEF`, `KAIROS_DREAM` |
| dependencies | Dependencies | `KAIROS ⊃ PROACTIVE` |

## Fixed Section Structure

### 1. Feature Header

```markdown
# [Feature name]

> Feature Flag: `FEATURE_[NAME]=1`
> Implementation Status: [Stub/Partial/Complete]
```

### 2. Overview

```markdown
## Overview

[Core feature description]
```

### 3. System Prompt Injection

```markdown
## System Prompt Injection

### Injection paragraph
```markdown
[Specific injection content]
```
```

### 4. Trigger Conditions

```markdown
## Trigger Conditions

### Activation conditions
- [Condition 1]
- [Condition 2]

### Dependencies
- [Dependency 1]
- [Dependency 2]
```

### 5. Behavior

```markdown
## Behavior

### NEVER
- [Prohibited behavior]

### ALWAYS
- [Mandatory behavior]
```

## KAIROS Feature Specification

### System Injection Paragraph

```markdown
### Brief Section (getBriefSection)

When `feature('KAIROS') || feature('KAIROS_BRIEF')` is active:

```markdown
# Brief Tool

Use BriefTool to output structured messages...
```
```

### Proactive Paragraph

```markdown
### Autonomous Work Section (getProactiveSection)

When `feature('PROACTIVE') || feature('KAIROS')` and `isProactiveActive()`:

```markdown
# Autonomous Work Mode

You are an autonomous agent. Use tools to perform useful work.

Tick-driven: <tick_tag> keeps you active...
```
```

## Proactive Feature Specification

### Tick-driven Mechanism

```markdown
## Tick-driven

- <tick_tag> contains user's current local time
- Each tick triggers a response
- Use SleepTool to control wait intervals

### NEVER
- Output "still waiting" type text
- Poll continuously without sleeping

### ALWAYS
- Must call Sleep during empty operations
- Lean towards action over waiting
```

### Terminal Focus Awareness

```markdown
## Terminal Focus Awareness

| State | Behavior |
|-------|----------|
| Unfocused | Highly autonomous actions |
| Focused | More collaborative, show choices |
```

## Heartbeat Feature Specification

### Heartbeat Protocol

```markdown
## Heartbeat Protocol

### Trigger timing
- Timed trigger (determined by configuration)
- Must reply on each trigger

### Reply rules
- **Nothing to report**: Reply exactly `HEARTBEAT_OK`
- **Something to report**: Reply with specific content (without `HEARTBEAT_OK`)
```

### Heartbeat Configuration

```markdown
## Configuration Options

```yaml
agents:
  defaults:
    heartbeat:
      every: "5m"  # Interval
      includeSystemPromptSection: true
      prompt: |  # Custom prompt
        Custom heartbeat instructions
```
```

## Example

```markdown
---
title: KAIROS Feature Prompt
type: feature
mode: all
category: kairos
---

# KAIROS - Resident Assistant Mode

> Feature Flag: `FEATURE_KAIROS=1` (and sub-features)
> Implementation Status: Core framework complete, some sub-modules are Stub

## Overview

KAIROS transforms the CLI from a "Q&A tool" to a "resident assistant". When enabled, the CLI runs continuously in the background, supporting:

- Persistent bridge sessions
- Background task execution
- Push notifications to mobile
- Daily memory logs
- External channel message integration
- Structured Brief output

## System Prompt Injection

### Brief Section

When `feature('KAIROS') || feature('KAIROS_BRIEF')` is active:

```markdown
# Brief Tool

Use BriefTool to output structured messages.
/brief toggle and --brief flag control display filtering.
```
```

### Proactive Section

When `feature('PROACTIVE') || feature('KAIROS')` and `isProactiveActive()`:

```markdown
# Autonomous Work Mode

You are an autonomous agent. Use available tools to perform useful work.

Tick-driven: <tick_tag> keeps you active. Each tick contains user's current local time.

Rhythm control: Use SleepTool to control wait intervals.

Must Sleep on empty operations: Output "still waiting" type text is prohibited.

Lean towards action: Reading files, searching code, modifying files, committing - none require asking.

Terminal Focus awareness: terminalFocus field indicates if user is watching the terminal.
```

## Trigger Conditions

### Activation conditions
- `FEATURE_KAIROS=1` enabled

### Dependencies
- `KAIROS ⊃ PROACTIVE`: When KAIROS is enabled, Proactive capability is automatically gained
- `KAIROS_BRIEF`: BriefTool structured output
- `KAIROS_DREAM`: Memory distillation

## Behavior

### NEVER
- Output token-wasting wait text
- Execute dangerous operations without confirmation

### ALWAYS
- Call Sleep on empty operations
- Adjust autonomy based on terminalFocus
- Use BriefTool for structured results
```

## Quality Checklist

- [ ] Feature Flag is correct
- [ ] Injection paragraph format is correct
- [ ] Trigger conditions are complete
- [ ] Behavior uses correct keywords
- [ ] Dependencies are clear
