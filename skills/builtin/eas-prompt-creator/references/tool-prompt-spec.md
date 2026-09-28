# Tool 提示词规范 (Tool Prompt Specification)

## 概述 (Overview)

Tool 提示词定义工具功能、使用方法、参数规范与边界控制。

> **本规范中的边界关键字 MUST 符合 RFC 2119。完整的关键字表见 [`boundary-control.md`](./boundary-control.md) §3，10 项合规自检表见 §6。**

## 前置元数据规范 (Frontmatter Specification)

所有 Tool 提示词文件 MUST 使用 agent-info 9 字段 frontmatter 模板。模板定义、字段表格与共同规则见 SKILL.md §前置元数据决策（[../SKILL.md](../SKILL.md)）。

> **CRITICAL: agent-info 模板与 output-template 模板 MUST NOT 混用。**

### Tool 必填字段 (Tool Required Fields)

> **L2 → L1 映射 (L2-to-L1 Mapping)**：下表 4 个 L2 字段为**正文必填字段**（独立于 frontmatter），写入正文 `## Parameters` / `## Description` 章节。
>
> - L2 `name` 与 L1 `name` 同义；L1 `name` = 工具注册名（如 `Read`），L2 `name` = 正文标题，两者 MUST 一致。
> - L2 `description` 写入 L1 `description` 字段（精简版 ≤ 200 字符）；详细描述保留在正文 `## Description` 章节。
> - L2 `usage` / `parameters` 均无对应 L1 字段，仅在正文表达。

| 字段 (Field) | 描述 (Description)      | 示例 (Example)          |
| ------------ | ----------------------- | ----------------------- |
| name         | Tool 名称（与 L1 一致） | `Read`、`Write`、`Glob` |
| description  | 功能描述（精简版入 L1） | `Read file contents`    |
| usage        | 使用方法                | `tsx script.ts`         |
| parameters   | 参数列表                | 见参数规范              |

## 可选字段 (Optional Fields)

| 字段 (Field) | 描述 (Description) | 示例 (Example)                         |
| ------------ | ------------------ | -------------------------------------- |
| examples     | 使用示例           | 3-5 个典型场景                         |
| notes        | 注意事项           | `Check path before reading`            |
| relatedTools | 相关工具           | `Read → Write`                         |
| errors       | 错误处理           | `Return error when path doesn't exist` |

## 固定章节结构 (Fixed Section Structure)

### 1. 头信息 (Header)

````markdown
# [Tool name] Tool Prompt

```typescript
[TypeScript type definition]
```
````

````

### 2. 描述章节 (Description Section)

```markdown
## Description

[Concise functional description, 1-2 sentences]
````

### 3. 参数章节 (Parameters Section)

```markdown
## Parameters

| Parameter | Type   | Required | Description   |
| --------- | ------ | -------- | ------------- |
| param1    | string | Yes      | [Description] |
| param2    | number | No       | [Description] |
```

### 4. 使用章节 (Usage Section)

```markdown
## Usage

- [Usage point 1]
- [Usage point 2]
```

### 5. 边界章节 (Boundaries Section)

> **Boundary keywords in this specification MUST conform to RFC 2119. See [`boundary-control.md`](./boundary-control.md) for the complete keyword table and 10-item compliance checklist.**

```markdown
## Boundaries

### MUST NOT

- [Absolute prohibition 1]
- [Absolute prohibition 2]

### MUST

- [Must follow 1]
- [Must follow 2]
```

### 6. 示例章节 (Examples Section)

```markdown
## Examples

[Example 1: Basic usage]
[Example 2: Typical scenario]
[Example 3: Edge case]
```

## 参数规范模板 (Parameter Specification Template)

```markdown
| Parameter | Type   | Required | Default | Description          |
| --------- | ------ | -------- | ------- | -------------------- |
| filePath  | string | Yes      | -       | Absolute file path   |
| offset    | number | No       | 1       | Starting line number |
| limit     | number | No       | 2000    | Maximum lines        |
```

## 示例 (Example)

```yaml
---
name: read
type: system
scope: all
priority: 1000
permission: read
dynamic: false
owner: [core]
share: [general, coder]
description: Read file or directory contents from the local filesystem
---
```

````markdown
# Read Tool Prompt

## Description

Read file or directory contents from the local filesystem.

## Parameters

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| filePath  | string | Yes      | Absolute path                  |
| offset    | number | No       | Starting line number (1-based) |
| limit     | number | No       | Maximum lines (default 2000)   |

## Usage

- Use absolute paths, not relative paths
- Line numbers start from 1
- Lines exceeding 2000 characters are automatically truncated
- Parallel reading of multiple files improves efficiency
- Use offset for large files

### MUST NOT

- Read non-existent files
- Assume file encoding (use Read results)

### MUST

- Check if path exists
- Use Grep to search large file contents

## Examples

**Read file beginning:**

```yaml
filePath: '/path/to/file.ts'
limit: 200
```
````

**Read specific file position:**

```yaml
filePath: '/path/to/file.ts'
offset: 100
limit: 50
```

```

## 不适用 (Not Applicable)

- Agent（定义 Agent 行为）—— 走 `agent-prompt-spec.md`。
- Task / Command / Mode / Session / Feature / Context 类 —— 走对应 spec.md。
- SKILL.md —— 走 `eas-skill-creator`。

## 质量自检表 (Quality Checklist)

- [ ] 功能描述简洁准确
- [ ] 参数类型与必填状态正确
- [ ] 使用方法清晰可执行
- [ ] 边界使用正确的关键字（RFC 2119）
- [ ] 示例覆盖主要场景
- [ ] 错误处理描述完整
```
