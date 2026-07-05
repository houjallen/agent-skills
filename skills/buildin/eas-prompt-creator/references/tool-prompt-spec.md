# Tool Prompt Specification

## Overview

Tool prompts define tool functionality, usage methods, parameter specifications, and boundary controls.

## Frontmatter Specification

All tool prompt files MUST include the following YAML frontmatter:

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
| name | Tool name | `Read`, `Write`, `Glob` |
| description | Functional description | `Read file contents` |
| usage | Usage method | `tsx script.ts` |
| parameters | Parameter list | See parameter specification |

## Optional Fields

| Field | Description | Example |
|-------|-------------|---------|
| examples | Usage examples | 3-5 typical scenarios |
| notes | Precautions | `Check path before reading` |
| relatedTools | Related tools | `Read → Write` |
| errors | Error handling | `Return error when path doesn't exist` |

## Fixed Section Structure

### 1. Header

```markdown
# [Tool name] Tool Prompt

```typescript
[TypeScript type definition]
```
```

### 2. Description Section

```markdown
## Description

[Concise functional description, 1-2 sentences]
```

### 3. Parameters Section

```markdown
## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| param1 | string | Yes | [Description] |
| param2 | number | No | [Description] |
```

### 4. Usage Section

```markdown
## Usage

- [Usage point 1]
- [Usage point 2]
```

### 5. Boundaries Section

```markdown
### NEVER
- [Absolute prohibition 1]
- [Absolute prohibition 2]

### ALWAYS
- [Must follow 1]
- [Must follow 2]
```

### 6. Examples Section

```markdown
## Examples

[Example 1: Basic usage]
[Example 2: Typical scenario]
[Example 3: Edge case]
```

## Parameter Specification Template

```markdown
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| filePath | string | Yes | - | Absolute file path |
| offset | number | No | 1 | Starting line number |
| limit | number | No | 2000 | Maximum lines |
```

## Example

```markdown
---
title: Read Tool Prompt
type: tool
mode: all
category: file
---

# Read Tool Prompt

## Description

Read file or directory contents from the local filesystem.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| filePath | string | Yes | Absolute path |
| offset | number | No | Starting line number (1-based) |
| limit | number | No | Maximum lines (default 2000) |

## Usage

- Use absolute paths, not relative paths
- Line numbers start from 1
- Lines exceeding 2000 characters are automatically truncated
- Parallel reading of multiple files improves efficiency
- Use offset for large files

### NEVER
- Read non-existent files
- Assume file encoding (use Read results)

### ALWAYS
- Check if path exists
- Use Grep to search large file contents

## Examples

**Read file beginning:**
```
filePath: "/path/to/file.ts"
limit: 200
```

**Read specific file position:**
```
filePath: "/path/to/file.ts"
offset: 100
limit: 50
```
```

## Quality Checklist

- [ ] Functional description is concise and accurate
- [ ] Parameter types and required status are correct
- [ ] Usage methods are clear and executable
- [ ] Boundaries use correct keywords
- [ ] Examples cover main scenarios
- [ ] Error handling description is complete
