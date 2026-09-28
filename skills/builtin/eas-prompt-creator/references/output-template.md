# 输出模板规范 (Output Template Specification)

## 概述 (Overview)

本文档定义 EASBot 提示词的标准输出模板。

> **CRITICAL: 本文档中所有边界关键字 MUST 符合 RFC 2119。完整的关键字表与 10 项合规自检表见 [`boundary-control.md`](./boundary-control.md)。**

## 何时使用输出模板 (When to Use Output Template)

**重要 (Important)**：输出模板并非对所有提示词类型都固定。根据场景判断：

- 若 Agent 能判断该提示词需要固定输出格式（如总结、计划、任务结果、压缩），则自动添加。
- 若 Agent 无法判断，向用户提问：`"此提示词是否需要固定输出模板？支持的格式：JSON / Markdown"`

## 支持的格式 (Supported Formats)

- **JSON** — 机器可读的结构化数据
- **Markdown** — 可读的人类友好的结构化段落

## 标准 YAML 前置元数据 (Standard YAML Frontmatter)

```yaml
---
title: [English title]
type: [agent|tool|task|command|mode|session|feature|context]
mode: [general|coder|all]
required: [comma-separated required fields]
optional: [comma-separated optional fields]
---
```

> **CRITICAL: 该 5 字段 frontmatter 模板 MUST 用于输出模板定义；与 agent-info 9 字段模板不可混用。详见 SKILL.md §Frontmatter Decision。**

## 输出模板类型 (Output Template Types)

### 1. JSON 输出模板 (JSON Output Template)

````markdown
## Output Template

When completing the task, output MUST follow this format:

```json
{
  "status": "success|error",
  "data": {
    "field1": "value1",
    "field2": "value2"
  },
  "message": "optional message"
}
```
````

### 示例 (Example)

**输入 (Input)**：

```
User: Summarize this conversation
```

**预期输出 (Expected Output)**：

```json
{
  "status": "success",
  "data": {
    "summary": "Conversation summary...",
    "keyPoints": ["point1", "point2"],
    "pendingTasks": ["task1"]
  }
}
```

````

### 2. Markdown 输出模板 (Markdown Output Template)

```markdown
## Output Template

When completing the task, output MUST follow this format:

```markdown
## Section 1

[Content]

## Section 2

[Content]
````

### 示例 (Example)

**输入 (Input)**：

```
User: Generate a plan for adding dark mode
```

**预期输出 (Expected Output)**：

```markdown
## Summary

Add dark mode toggle to settings page with theme persistence.

## Files to Modify

| File                        | Changes              |
| --------------------------- | -------------------- |
| src/components/Settings.tsx | Add toggle component |
| src/context/ThemeContext.ts | Add theme state      |

## Steps

1. Create ThemeContext
2. Add toggle to Settings
3. Implement persistence
```

### 3. 压缩/总结模板 (Compaction/Summary Template)

参考：[`packages/agent/src/agent/prompt/compaction.txt`](../../packages/agent/src/agent/prompt/compaction.txt)（相对仓库根路径；不在文档中硬编码绝对路径，遵守 eas-skill-creator "脚本调用路径规范"）。

````markdown
## Output Template

Analyze this conversation and generate a structured summary for session continuation.

```markdown
## Primary Request and Intent

[What is the user trying to accomplish?]

## Key Technical Concepts

[Any important concepts, patterns, or decisions made]

## Key Files and Artifacts

[Any files created or modified with purposes]

## Errors and Fixes

[Any problems encountered and resolutions]

## Problem Solving

[How problems were approached and solved]

## All User Messages

[List all user requests in chronological order]

## Pending Tasks

[Any tasks not completed]

## Current Work

[What is currently being worked on]

## Optional Next Step

[What would be the logical next step]
```
````

### Rules

- MUST NOT ask questions or request clarification
- MUST NOT make assumptions beyond what was discussed
- MUST NOT generate new solutions
- MUST NOT omit important details
- MUST preserve accuracy (exact paths, names, details)
- MUST include context that helps continue the work

````

## 模板质量标准 (Template Quality Standards)

### MUST

- Use clear, descriptive headings
- Include code examples where applicable
- Specify exact output format
- Provide both success and error cases

### MUST NOT

- Use vague descriptions
- Skip error handling templates
- Include unnecessary formatting
- Use emojis in structured output

## 截断标记 (Truncation Indicator)

当截断输出时：

```markdown
[content truncated...]
[Remaining: N characters]
````
