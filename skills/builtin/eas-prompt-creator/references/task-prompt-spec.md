# Task 提示词规范 (Task Prompt Specification)

## 概述 (Overview)

Task 提示词定义任务管理工作流、任务状态转换与输出格式化。

> **本规范中的边界关键字 MUST 符合 RFC 2119。完整的关键字表见 [`boundary-control.md`](./boundary-control.md) §3，10 项合规自检表见 §6。**

## 前置元数据规范 (Frontmatter Specification)

所有 Task 提示词文件 MUST 使用 agent-info 9 字段 frontmatter 模板。模板定义、字段表格与共同规则见 SKILL.md §前置元数据决策（[../SKILL.md](../SKILL.md)）。

> **CRITICAL: agent-info 模板与 output-template 模板 MUST NOT 混用。**

### Task 必填字段 (Task Required Fields)

> **L2 → L1 映射 (L2-to-L1 Mapping)**：下表 4 个 L2 字段为**正文必填字段**（独立于 frontmatter），写入正文 `## Workflow` / `## When to Use` 章节。
>
> - L2 `name` 与 L1 `name` 同义（如 `todowrite`）。
> - L2 `purpose` 写入 L1 `description` 字段（精简版 ≤ 200 字符）。
> - L2 `workflow` / `states` 仅在正文表达（含 `## Workflow` 章节的状态转换图）。

| 字段 (Field) | 描述 (Description)       | 示例 (Example)                      |
| ------------ | ------------------------ | ----------------------------------- |
| name         | Task 名称（与 L1 一致）  | `Todowrite`、`TaskCreate`           |
| purpose      | Task 用途（精简版入 L1） | `Create and manage task lists`      |
| workflow     | 工作流                   | `Create → In Progress → Complete`   |
| states       | 状态定义                 | `pending → in_progress → completed` |

## 可选字段 (Optional Fields)

| 字段 (Field)   | 描述 (Description) | 示例 (Example)                  |
| -------------- | ------------------ | ------------------------------- |
| triggers       | 触发条件           | `Tasks with 3+ steps`           |
| limits         | 约束               | `Maximum 20 tasks`              |
| dependencies   | 依赖               | `Complete before starting next` |
| outputTemplate | 输出格式           | `JSON or Markdown`              |

## 输出模板 (Output Template)

**重要 (Important)**：输出模板并非固定。根据场景判断：

- 若 Agent 能判断该提示词需要固定输出格式（如任务结果、状态更新），则自动添加。
- 若 Agent 无法判断，向用户提问：`"此提示词是否需要固定输出模板？支持的格式：JSON / Markdown"`

**支持的格式 (Supported Formats)**：JSON、Markdown。

添加输出模板时：

````markdown
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
````

## 固定章节结构 (Fixed Section Structure)

### 1. 概述 (Overview)

```markdown
## Overview

[Concise description of task purpose]
```

### 2. 何时使用 (When to Use)

```markdown
## When to Use

### Use Cases

- [Scenario 1]
- [Scenario 2]

### Do Not Use

- [Scenario 1]
- [Scenario 2]
```

### 3. 工作流 (Workflow)

```markdown
## Workflow

[State flow diagram or text description]

State transitions:

- pending → in_progress: [trigger condition]
- in_progress → completed: [trigger condition]
```

### 4. 边界 (Boundaries)

> **Boundary keywords in this specification MUST conform to RFC 2119. See [`boundary-control.md`](./boundary-control.md) for the complete keyword table and 10-item compliance checklist.**

```markdown
## Boundaries

### MUST NOT

- [Prohibited behavior]

### SHOULD NOT

- [Discouraged behavior]

### MUST

- [Required behavior]
```

## 示例 (Example)

```yaml
---
name: todowrite
type: system
scope: all
priority: 900
permission: write
dynamic: false
owner: [core]
share: [general, coder]
description: Create and manage structured task lists to track progress of complex tasks
---
```

````markdown
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
````

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

### MUST NOT

- Batch mark multiple tasks as complete
- Create more than 20 tasks
- Delete incomplete tasks

### SHOULD NOT

- Vague task descriptions
- Skip in_progress state when completing
- Assume user intentions

### MUST

- Use TodoWrite tool to manage tasks
- Keep one in_progress task at a time
- Update status immediately after completion
- Keep task descriptions clear and specific

```

## 不适用 (Not Applicable)

- Agent / Tool / Command / Mode / Session / Feature / Context 类 —— 走对应 spec.md。
- 单步交互（< 3 步且无状态）—— 直接内联调用，不单独建 Task。
- SKILL.md —— 走 `eas-skill-creator`。

## 质量自检表 (Quality Checklist)

- [ ] Use cases 清晰定义
- [ ] Do-not-use cases 清晰定义
- [ ] 状态转换合乎逻辑
- [ ] 边界完整，使用正确的关键字（RFC 2119）
```
