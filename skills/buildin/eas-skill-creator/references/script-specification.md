# 脚本规范 (Script Specification)

## 概述 (Overview)

本文档定义 Skill 脚本的编写规范。

## 设计原则 (Design Principles)

### 1. 最小化外部依赖 (Minimize External Dependencies)

- 优先使用内置模块（fs, path, os）
- 避免不必要的外部库
- ES 模块兼容性

### 2. 类型安全 (Type Safety)

- TypeScript 使用完整类型定义
- Python 使用类型注解
- 明确的返回值类型

### 3. 可维护性 (Maintainability)

- 清晰的函数边界
- 适当的注释
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

### Python

```python
#!/usr/bin/env python3
"""
脚本功能描述
"""

def main():
    # 主体逻辑
    pass

if __name__ == "__main__":
    main()
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

- 使用内置模块（fs, path, os）
- 提供中文注释
- 包含错误处理
- 使用 async/await
- 进程正确退出

## 错误处理 (Error Handling)

- TypeScript: try-catch + async/await
- Python: try-except
- 错误时使用 `process.exit(1)` 或 `sys.exit(1)`
