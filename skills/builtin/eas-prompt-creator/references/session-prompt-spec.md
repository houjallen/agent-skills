# Session 提示词规范 (Session Prompt Specification)

## 概述 (Overview)

Session 提示词定义会话生命周期、会话初始化与会话管理的行为规范。

> **本规范中的边界关键字 MUST 符合 RFC 2119。完整的关键字表见 [`boundary-control.md`](./boundary-control.md) §3，10 项合规自检表见 §6。**

## 前置元数据规范 (Frontmatter Specification)

所有 Session 提示词文件 MUST 使用 agent-info 9 字段 frontmatter 模板。模板定义、字段表格与共同规则见 SKILL.md §前置元数据决策（[../SKILL.md](../SKILL.md)）。

> **CRITICAL: agent-info 模板与 output-template 模板 MUST NOT 混用。**

### Session 必填字段 (Session Required Fields)

> **L2 → L1 映射 (L2-to-L1 Mapping)**：下表 3 个 L2 字段为**正文必填字段**（独立于 frontmatter），写入正文 `## Trigger` / `## Content` 章节。
>
> - L2 `name` 与 L1 `name` 同义（如 `default`）。
> - L2 `trigger` / `content` 仅在正文表达（`## Trigger` / `## Content`）。
> - Session 类型无 L2 `description`，精简版说明可写入 L1 `description`。

| 字段 (Field) | 描述 (Description)         | 示例 (Example)          |
| ------------ | -------------------------- | ----------------------- |
| name         | Session 类型（与 L1 一致） | `default`、`explore`    |
| trigger      | 触发条件                   | `On new session start`  |
| content      | Session 内容               | `System prompt content` |

## 可选字段 (Optional Fields)

| 字段 (Field) | 描述 (Description) | 示例 (Example)             |
| ------------ | ------------------ | -------------------------- |
| context      | 上下文注入         | `memory`、`knowledge`      |
| cleanup      | 清理动作           | `Compact history messages` |

## 固定章节结构 (Fixed Section Structure)

### 1. Session 类型 (Session Type)

```markdown
# [Session type] Session Prompt

## Type

[Brief description of session type]
```

### 2. 触发 (Trigger)

```markdown
## Trigger

### When to trigger

- [Condition 1]
- [Condition 2]

### Trigger timing

- [Timing 1]
- [Timing 2]
```

### 3. 内容 (Content)

````markdown
## Content

[The specific session prompt content]

### Example

```markdown
[Prompt example]
```
````

````

### 4. 上下文注入 (Context Injection)

```markdown
## Context Injection

### Injection content
- [Context 1]
- [Context 2]

### Injection timing
[Timing]
````

## Session 类型详解 (Session Type Details)

### 默认会话 (Default Session)

启动新会话时的默认提示词。

````markdown
# Default Session Prompt

## Content

```markdown
You are EASBot, an intelligent assistant.

Use tools to help you complete tasks.
```
````

````

### 恢复会话 (Resume Session)

恢复先前的会话时的提示词。

```markdown
# Resume Session Prompt

## Content

```markdown
You are resuming a previous session.

[Load previous context]
````

````

### 总结会话 (Summary Session)

生成会话总结的提示词。

```markdown
# Summary Session Prompt

## Content

```markdown
Summarize the work done in this session.

Rules:
- 2-3 sentences
- Describe changes not process
- Use first person
````

````

## 示例 (Example)

```yaml
---
name: default
type: system
scope: all
priority: 1000
permission: read
dynamic: true
owner: [core]
share: [general, coder]
description: Default session startup prompt for all new session initialization
---
```

```markdown
# Default Session Prompt

## Type

Default session startup prompt for all new session initialization.

## Trigger

### When to trigger

- User starts new CLI session
- User creates new project context
- Session timeout and reconnect

## Content

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

## Boundaries

### MUST NOT

- Assume user's project structure
- Preset user preferences
- Skip context loading

### MUST

- Confirm working directory
- Load relevant context
- Check system configuration
```

## 不适用 (Not Applicable)

- Agent / Tool / Task / Command / Mode / Feature / Context 类 —— 走对应 spec.md。
- 单次对话（无会话初始化需求）—— 直接使用默认 Session 即可。
- SKILL.md —— 走 `eas-skill-creator`。

## 质量自检表 (Quality Checklist)

- [ ] 触发条件清晰
- [ ] Session 内容完整
- [ ] 上下文注入逻辑正确
- [ ] 边界使用正确的关键字（RFC 2119）
````
