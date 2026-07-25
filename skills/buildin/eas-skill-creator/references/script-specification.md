# 脚本规范 (Script Specification)

## 概述 (Overview)

本文档定义 Skill 脚本的编写规范。

> **统一 TypeScript**：本技能仅维护 TypeScript 实现（`.ts`），不提供 Python 平行版本。所有 Skill 脚本 MUST 使用 TypeScript 编写。

## 设计原则 (Design Principles)

### 1. 零外部依赖 (Zero External Dependencies)

- **MUST** 优先使用 Node.js 内置模块（`fs` / `fs/promises`、`path`、`url`、`node:zlib`、`node:stream` 等）
- **MUST NOT** 引入非必要的第三方依赖
- ES 模块兼容性（`import/export` + `import.meta.url`）
- 例外：仅当内置模块确实无法满足需求时（如 PDF 处理、图像编解码等），可引入第三方库，且 MUST 在 SKILL.md 中标注

### 2. 类型安全 (Type Safety)

- TypeScript 使用完整类型定义
- 明确的入参 / 返回值类型
- 禁止 `any` 滥用（必要时用 `unknown`）

### 3. 可维护性 (Maintainability)

- 清晰的函数边界
- 适当的注释（中文）
- 易于测试

## 文件结构 (File Structure)

### TypeScript

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

## 模式特定脚本 (Mode-Specific Scripts)

### Tool Wrapper

提供 API 调用的辅助脚本。

### Generator

提供模板生成和校验的脚本。

### Reviewer

提供自动化检查的脚本（lint、grep 等）。

### Pipeline

提供流水线各步骤的执行脚本。

## 最佳实践 (Best Practices)

- 使用 Node.js 内置模块（`fs`, `path`, `url`）
- 提供中文注释
- 包含错误处理
- 使用 `async/await`
- 进程正确退出（`process.exit(1)`）
- Shebang 行使用 `#!/usr/bin/env tsx`

## 错误处理 (Error Handling)

- TypeScript: try-catch + async/await
- 错误时统一 `process.exit(1)`
- 不静默吞错，必须打印可读错误信息
