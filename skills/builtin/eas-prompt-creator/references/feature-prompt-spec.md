# Feature 提示词规范 (Feature Prompt Specification)

## 概述 (Overview)

Feature 提示词定义特殊功能特性（如 KAIROS、Daemon、Proactive）及其系统注入行为规范。

> **本规范中的边界关键字 MUST 符合 RFC 2119。完整的关键字表见 [`boundary-control.md`](./boundary-control.md) §3，10 项合规自检表见 §6。**

## 前置元数据规范 (Frontmatter Specification)

所有 Feature 提示词文件 MUST 使用 agent-info 9 字段 frontmatter 模板。模板定义、字段表格与共同规则见 SKILL.md §前置元数据决策（[../SKILL.md](../SKILL.md)）。

> **CRITICAL: agent-info 模板与 output-template 模板 MUST NOT 混用。**

## 内置功能 (Built-in Features)

| Feature   | 描述 (Description) | Feature Flag        |
| --------- | ------------------ | ------------------- |
| KAIROS    | 常驻助手模式       | `FEATURE_KAIROS`    |
| Daemon    | 后台守护进程       | `FEATURE_DAEMON`    |
| Proactive | 主动工作模式       | `FEATURE_PROACTIVE` |
| Heartbeat | 心跳机制           | 内置 (Built-in)     |

## 必填字段 (Required Fields)

> **L2 → L1 映射 (L2-to-L1 Mapping)**：下表 4 个 L2 字段为**正文必填字段**（独立于 frontmatter），写入正文 `## Trigger Conditions` / `## Behavior` 章节。
>
> - L2 `name` 与 L1 `name` 同义（如 `KAIROS`）。
> - L2 `description` 写入 L1 `description` 字段（精简版 ≤ 200 字符）。
> - L2 `trigger` / `injection` 仅在正文表达。

| 字段 (Field) | 描述 (Description)          | 示例 (Example)                                  |
| ------------ | --------------------------- | ----------------------------------------------- |
| name         | Feature 名称（与 L1 一致）  | `KAIROS`、`Proactive`                           |
| description  | Feature 描述（精简版入 L1） | `Resident assistant, supports background tasks` |
| trigger      | 激活条件                    | `FEATURE_KAIROS=1`                              |
| injection    | 注入内容                    | `Heartbeat-driven instructions`                 |

## 可选字段 (Optional Fields)

| 字段 (Field) | 描述 (Description) | 示例 (Example)                   |
| ------------ | ------------------ | -------------------------------- |
| subsections  | 子功能             | `KAIROS_BRIEF`、`KAIROS_DREAM`   |
| dependencies | 依赖               | 文字描述（见下方"依赖表达约定"） |

> **依赖表达约定 (Dependency Notation)**：依赖关系使用纯文字描述（例如 "KAIROS 是 PROACTIVE 的超集"），MUST NOT 使用 `⊃`、`⊇` 等 Unicode 数学符号，以免 Markdown 解析器不一致。

## 固定章节结构 (Fixed Section Structure)

### 1. Feature 头信息 (Feature Header)

```markdown
# [Feature name]

> Feature Flag: `FEATURE_[NAME]=1`
> Implementation Status: [Stub/Partial/Complete]
```

### 2. 概述 (Overview)

```markdown
## Overview

[Core feature description]
```

### 3. 系统提示词注入 (System Prompt Injection)

```markdown
## System Prompt Injection

### Injection paragraph

[Specific injection content]
```

### 4. 触发条件 (Trigger Conditions)

```markdown
## Trigger Conditions

### Activation conditions

- [Condition 1]
- [Condition 2]

### Dependencies

- [Dependency 1]
- [Dependency 2]
```

### 5. 行为 (Behavior)

> **Boundary keywords in this specification MUST conform to RFC 2119. See [`boundary-control.md`](./boundary-control.md) for the complete keyword table and 10-item compliance checklist.**

```markdown
## Behavior

### MUST NOT

- [Prohibited behavior]

### MUST

- [Mandatory behavior]
```

## KAIROS Feature 规范 (KAIROS Feature Specification)

### 系统注入段落 (System Injection Paragraph)

````markdown
### Brief Section (getBriefSection)

When `feature('KAIROS') || feature('KAIROS_BRIEF')` is active:

```text
# Brief Tool

Use BriefTool to output structured messages...
```
````

### Proactive 段落 (Proactive Paragraph)

````markdown
### Autonomous Work Section (getProactiveSection)

When `feature('PROACTIVE') || feature('KAIROS')` and `isProactiveActive()`:

```text
# Autonomous Work Mode

You are an autonomous agent. Use tools to perform useful work.

Tick-driven: <tick_tag> keeps you active...
```
````

## Proactive Feature 规范 (Proactive Feature Specification)

### Tick-driven 机制 (Tick-driven Mechanism)

```markdown
## Tick-driven

- <tick_tag> contains user's current local time
- Each tick triggers a response
- Use SleepTool to control wait intervals

### MUST NOT

- Output "still waiting" type text
- Poll continuously without sleeping

### MUST

- MUST call Sleep during empty operations
- Lean towards action over waiting
```

### 终端焦点感知 (Terminal Focus Awareness)

```markdown
## Terminal Focus Awareness

| State     | Behavior                         |
| --------- | -------------------------------- |
| Unfocused | Highly autonomous actions        |
| Focused   | More collaborative, show choices |
```

## Heartbeat Feature 规范 (Heartbeat Feature Specification)

### 心跳协议 (Heartbeat Protocol)

```markdown
## Heartbeat Protocol

### Trigger timing

- Timed trigger (determined by configuration)
- Must reply on each trigger

### Reply rules

- **Nothing to report**: Reply exactly `HEARTBEAT_OK`
- **Something to report**: Reply with specific content (without `HEARTBEAT_OK`)
```

### 心跳配置 (Heartbeat Configuration)

```yaml
agents:
  defaults:
    heartbeat:
      every: '5m' # Interval
      includeSystemPromptSection: true
      prompt: | # Custom prompt
        Custom heartbeat instructions
```

## 示例 (Example)

```yaml
---
name: KAIROS
type: system
scope: all
priority: 600
permission: write
dynamic: true
owner: [core]
share: [general, coder]
description: Resident assistant mode that runs CLI continuously in background
---
```

````markdown
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

```text
# Brief Tool

Use BriefTool to output structured messages.
/brief toggle and --brief flag control display filtering.
```
````

### Proactive Section

When `feature('PROACTIVE') || feature('KAIROS')` and `isProactiveActive()`:

```text
# Autonomous Work Mode

You are an autonomous agent. Use available tools to perform useful work.

Tick-driven: <tick_tag> keeps you active. Each tick contains user's current local time.

Rhythm control: Use SleepTool to control wait intervals.

MUST Sleep on empty operations: Output "still waiting" type text is prohibited.

Lean towards action: Reading files, searching code, modifying files, committing - none require asking.

Terminal Focus awareness: terminalFocus field indicates if user is watching the terminal.
```

## Trigger Conditions

### Activation conditions

- `FEATURE_KAIROS=1` enabled

### Dependencies

- `KAIROS 是 PROACTIVE 的超集`：当 KAIROS 启用时，自动获得 Proactive 能力
- `KAIROS_BRIEF`: BriefTool structured output
- `KAIROS_DREAM`: Memory distillation

## Behavior

### MUST NOT

- Output token-wasting wait text
- Execute dangerous operations without confirmation

### MUST

- Call Sleep on empty operations
- Adjust autonomy based on terminalFocus
- Use BriefTool for structured results

```

## 不适用 (Not Applicable)

- Agent / Tool / Task / Command / Mode / Session / Context 类 —— 走对应 spec.md。
- 通用功能（非 Feature Flag 控制）—— 内联到 Agent / Mode 提示词即可。
- SKILL.md —— 走 `eas-skill-creator`。

## 质量自检表 (Quality Checklist)

- [ ] Feature Flag 正确
- [ ] 注入段落格式正确
- [ ] 触发条件完整
- [ ] 行为使用正确的关键字（RFC 2119）
- [ ] 依赖关系清晰
```
