# 技能创建实践指南 (Skill Creation Guide)

## 概述 (Overview)

本文档提供技能创建的详细实践指南。关于五大模式的类型定义和字段约束，请参阅 [skill-spec.md](skill-spec.md)。

## 技能解剖 (Skill Anatomy)

### 目录结构 (Directory Structure)

```
skill-name/
├── SKILL.md (必需)
│   ├── YAML frontmatter (必需)
│   │   ├── name: (必需)
│   │   ├── description: (必需)
│   │   ├── mode: (必需)
│   │   └── ...
│   └── Markdown body (必需)
└── 捆绑资源 (可选)
    ├── scripts/      - 可执行代码
    ├── references/  - 按需加载的文档
    └── assets/      - 输出中使用的文件
```

### SKILL.md 结构 (SKILL.md Structure)

**必需部分**：
- 概述 (Overview)
- 何时使用 (When to Use)
- 快速参考 (Quick Reference)

**可选部分**：
- 核心模式 (Core Pattern)
- 实现 (Implementation)
- 常见错误 (Common Mistakes)

## 资源规划 (Resource Planning)

### 何时使用 scripts/ (When to Use scripts/)

- 相同代码被重复重写
- 需要确定性可靠性
- 示例：`scripts/rotate_pdf.ts`

### 何时使用 references/ (When to Use references/)

- 需要按需加载的详细文档
- 模式、配置、示例
- 示例：`references/checklist.md`

### 何时使用 assets/ (When to Use assets/)

- 模板、图标、字体
- 在输出中使用的文件
- 示例：`assets/template.docx`

## 写作规范 (Writing Guidelines)

### Frontmatter 写作 (Frontmatter Writing)

```yaml
---
name: skill-name
description: 该技能应在[触发条件]时使用，用于[主要功能]。
mode: tool-wrapper | generator | reviewer | inversion | pipeline
composition: single | composed
---
```

### Body 写作 (Body Writing)

- 使用命令式/不定式形式（"做 X" 而不是 "你应该做 X"）
- 标题使用双语标题：`## 标题 (English Title)`
- 技术术语保持英文（详见 [translation-guidelines.md](translation-guidelines.md)）

### 常见错误 (Common Mistakes)

| 错误 | 正确 |
|---|---|
| description 总结工作流程 | 仅描述触发条件 |
| SKILL.md 超过 500 行 | 详细信息移到 references/ |
| 使用 `@` 链接格式 | 使用 `[file.md](references/file.md)` |
| description 使用第一人称 | 使用第三人称 |

## 脚本编写规范 (Script Guidelines)

### TypeScript 脚本 (TypeScript Script)

```typescript
#!/usr/bin/env tsx
/**
 * 脚本功能描述
 */

import { promises as fs } from 'fs';

async function main() {
  // 主体逻辑
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}
```

### 最佳实践 (Best Practices)

- 使用内置模块（fs, path, os）
- 避免不必要的外部依赖
- 提供中文注释
- 包含错误处理

## 渐进式披露 (Progressive Disclosure)

### 三级加载 (Three-Level Loading)

1. **元数据**（name + description）— 始终在上下文中
2. **SKILL.md body** — 技能触发时
3. **捆绑资源** — 按需加载

### 引用规范 (Reference Rules)

**正确**：
```markdown
请参阅 [checklist.md](references/checklist.md)
```

**错误**：
```markdown
请参阅 @references/checklist.md
```
