# Command 提示词规范 (Command Prompt Specification)

## 概述 (Overview)

Command 提示词定义命令行执行、参数处理与输出格式化的指南。

> **本规范中的边界关键字 MUST 符合 RFC 2119。完整的关键字表见 [`boundary-control.md`](./boundary-control.md) §3，10 项合规自检表见 §6。**

## 前置元数据规范 (Frontmatter Specification)

所有 Command 提示词文件 MUST 使用 agent-info 9 字段 frontmatter 模板。模板定义、字段表格与共同规则见 SKILL.md §前置元数据决策（[../SKILL.md](../SKILL.md)）。

> **CRITICAL: agent-info 模板与 output-template 模板 MUST NOT 混用。**

### Command 必填字段 (Command Required Fields)

> **L2 → L1 映射 (L2-to-L1 Mapping)**：下表 4 个 L2 字段为**正文必填字段**（独立于 frontmatter），写入正文 `## Description` / `## Execution` 章节。
>
> - L2 `name` 与 L1 `name` 同义（如 `/commit`）。
> - L2 `description` 写入 L1 `description` 字段（精简版 ≤ 200 字符）。
> - L2 `trigger` / `execution` 仅在正文表达。

| 字段 (Field) | 描述 (Description)          | 示例 (Example)                    |
| ------------ | --------------------------- | --------------------------------- |
| name         | Command 名称（与 L1 一致）  | `/commit`、`/plan`                |
| description  | Command 描述（精简版入 L1） | `Commit code and push`            |
| trigger      | 触发方式                    | `/commit [options]`               |
| execution    | 执行流程                    | `git add → git commit → git push` |

## 可选字段 (Optional Fields)

| 字段 (Field)  | 描述 (Description) | 示例 (Example)    |
| ------------- | ------------------ | ----------------- |
| arguments     | 参数说明           | `$ARGUMENTS`      |
| prerequisites | 前置条件           | `git initialized` |
| postAction    | 后续动作           | `Auto open PR`    |

## 固定章节结构 (Fixed Section Structure)

### 1. 头信息 (Header)

Command 提示词沿用 SKILL.md §前置元数据决策 §Agent-info 模板 的 9 字段 frontmatter（`name / type / scope / priority / permission / dynamic / owner / share / description`）。如需声明"是否子任务"，使用 L2 字段 `subtask: true/false` 写入正文 `## Description` 章节，而非混入 frontmatter。

### 2. 描述 (Description)

```markdown
## Description

[Concise functional description of the command]
```

### 3. 执行 (Execution)

```markdown
## Execution

1. [Step 1]
2. [Step 2]
3. [Step 3]
```

### 4. 参数 (Arguments)

```markdown
## Arguments

| Parameter  | Description           | Example                 |
| ---------- | --------------------- | ----------------------- |
| $ARGUMENTS | User input parameters | `feat: add new feature` |
```

### 5. 规则 (Rules)

> **Boundary keywords in this specification MUST conform to RFC 2119. See [`boundary-control.md`](./boundary-control.md) for the complete keyword table and 10-item compliance checklist.**

```markdown
## Rules

### MUST NOT

- [Prohibited behavior]

### MUST

- [Mandatory behavior]
```

## 特殊格式 (Special Formats)

### 子任务格式 (Subtask Format)

当 L2 字段 `subtask: true` 时（写入正文 `## Description`），Command 作为子任务被父任务调度执行；通常配合 `priority` 较高的 L1 字段。

### Git Command 格式 (Git Command Format)

`## GIT Operations` 章节声明自动注入的 git 命令输出（如 `git diff` / `git status`），格式：

```markdown
## GIT Operations

!`git diff`
!`git status`
```

> 注：反引号 ` 是命令注入语法（由 CLI 解析），不是 Markdown 转义；保留该写法。

## 示例 (Example)

```yaml
---
name: /commit
type: system
scope: coder
priority: 700
permission: write
dynamic: false
owner: [core]
share: [coder]
description: Commit code changes and push to remote repository
---
```

````markdown
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

```text
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
````

### MUST NOT

- Commit unconfirmed changes
- Auto resolve conflicts
- Use generic commit messages

### MUST

- Include type prefix
- Describe user-visible changes
- Show diff first for confirmation

## Arguments

```bash
$ARGUMENTS = [Commit message provided by user]
```

## Examples

**Correct:**

```text
feat: add user login feature
fix: fix search result pagination issue
docs: update API documentation
```

**Incorrect:**

```text
improved something
fixed bug
update
```

```

## 不适用 (Not Applicable)

- Agent / Tool / Task / Mode / Session / Feature / Context 类 —— 走对应 spec.md。
- 非交互式命令（如纯脚本）—— 不属于提示词工程。
- SKILL.md —— 走 `eas-skill-creator`。

## 质量自检表 (Quality Checklist)

- [ ] Command 描述清晰
- [ ] 执行流程完整
- [ ] 参数处理正确
- [ ] 规则使用正确的关键字（RFC 2119）
- [ ] 示例具有代表性
```
