# Context 提示词规范 (Context Prompt Specification)

## 概述 (Overview)

Context 提示词定义上下文构建、上下文注入与上下文管理的行为规范。

> **本规范中的边界关键字 MUST 符合 RFC 2119。完整的关键字表见 [`boundary-control.md`](./boundary-control.md) §3，10 项合规自检表见 §6。**

## 前置元数据规范 (Frontmatter Specification)

所有 Context 提示词文件 MUST 使用 agent-info 9 字段 frontmatter 模板。模板定义、字段表格与共同规则见 SKILL.md §前置元数据决策（[../SKILL.md](../SKILL.md)）。

> **CRITICAL: agent-info 模板与 output-template 模板 MUST NOT 混用。**

### Context 必填字段 (Context Required Fields)

> **L2 → L1 映射 (L2-to-L1 Mapping)**：下表 3 个 L2 字段为**正文必填字段**（独立于 frontmatter），写入正文 `## Trigger` / `## Content` 章节。
>
> - L2 `name` 与 L1 `name` 同义（如 `bootstrap-memory`）。
> - L2 `trigger` / `content` 仅在正文表达。
> - Context 类型无 L2 `description`，精简版说明可写入 L1 `description`。

| 字段 (Field) | 描述 (Description)         | 示例 (Example)                        |
| ------------ | -------------------------- | ------------------------------------- |
| name         | Context 名称（与 L1 一致） | `Bootstrap Memory`、`System Reminder` |
| trigger      | 触发时机                   | `On session start`                    |
| content      | 注入内容                   | `Memory file content`                 |

## 可选字段 (Optional Fields)

| 字段 (Field) | 描述 (Description) | 示例 (Example)          |
| ------------ | ------------------ | ----------------------- |
| priority     | 优先级             | `high`、`medium`、`low` |
| truncation   | 截断策略           | `maxChars: 10000`       |

## ContextMode 差异 (ContextMode Differences)

EASBot 支持两种场景模式：

| 模式 (Mode) | 描述 (Description) | Context 焦点 (Context Focus) |
| ----------- | ------------------ | ---------------------------- |
| `general`   | 通用场景           | 文档、分析、对话             |
| `coder`     | 代码场景           | 代码开发、调试、重构         |

## 固定章节结构 (Fixed Section Structure)

### 1. Context 头信息 (Context Header)

```markdown
# [Context name]

## Type

[Context type description]
```

### 2. 触发 (Trigger)

```markdown
## Trigger

### When to inject

- [Timing 1]
- [Timing 2]

### Injection order

[Priority description]
```

### 3. 内容 (Content)

````markdown
## Content

```text
[Specific content]
```
````

### 4. 截断 (Truncation)

```markdown
## Truncation Strategy

| Strategy | Description                            |
| -------- | -------------------------------------- |
| maxChars | Maximum character count                |
| priority | Lower priority content truncated first |
```

## Context 类型详解 (Context Type Details)

### Bootstrap Memory

会话启动时加载的初始内存。

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

系统自动注入的提醒信息。

````markdown
## System Reminder

### Format

```text
<system-reminder>
[Reminder content]
</system-reminder>
```
````

### Dynamic Prompt

动态构建的上下文段落。

```markdown
## Dynamic Prompt

### Construction method

1. Collect relevant context
2. Sort by priority
3. Truncate to limit length
4. Inject into system prompt
```

## ContextMode 上下文差异 (ContextMode Context Differences)

### General 模式上下文 (General Mode Context)

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

### Coder 模式上下文 (Coder Mode Context)

```markdown
## Coder Mode Context

### Injected content

- Code development guidelines
- Test execution specifications
- Build check commands

### Prohibited content

- Non-code related document processing
```

## 示例 (Example)

```yaml
---
name: bootstrap-memory
type: system
scope: all
priority: 950
permission: read
dynamic: true
owner: [core]
share: [general, coder]
description: Initial memory context loaded on session startup
---
```

`````markdown
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

```text
# Bootstrap Memory

[Loaded from .easbot/memory/MEMORY.md]

## Recent Tasks

[Loaded from docs/task/ directory]

## Important Findings

[Loaded from docs/task/findings.md]
```
`````

## Truncation Strategy

### Truncation Rules

| Context Type     | Max Characters | Priority |
| ---------------- | -------------- | -------- |
| Agent Prompt     | 5000           | 1        |
| Bootstrap Memory | 10000          | 2        |
| Dynamic Prompt   | 5000           | 3        |

### Truncation Markers

```text
[Truncated content]
...
[Content truncated, reduced by N characters]
```

## Boundaries

> **Boundary keywords in this specification MUST conform to RFC 2119. See [`boundary-control.md`](./boundary-control.md) for the complete keyword table and 10-item compliance checklist.**

### MUST NOT

- Inject sensitive information
- Assume user project structure
- Inject unverified content

### MUST

- Verify content source
- Truncate by priority
- Mark truncation position

### CRITICAL

**Bootstrap Memory must be loaded from fixed paths to ensure content security and reliability.**

```

## 不适用 (Not Applicable)

- Agent / Tool / Task / Command / Mode / Session / Feature 类 —— 走对应 spec.md。
- 静态系统消息（无触发时机 / 无动态注入）—— 内联到 Agent / Session 提示词即可。
- SKILL.md —— 走 `eas-skill-creator`。

## 质量自检表 (Quality Checklist)

- [ ] 触发时机清晰
- [ ] 内容格式正确
- [ ] 截断策略合理
- [ ] 边界使用正确的关键字（RFC 2119）
- [ ] ContextMode 关联清晰
```
