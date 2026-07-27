# 设计决策说明 (Design Decisions)

## 核心设计原则 (Core Design Principles)

### 1. TypeScript 优先 (TypeScript First)

- **选择原因**: TypeScript 提供更好的类型安全、IDE 支持和开发体验
- **执行**: 所有核心功能均使用 TypeScript 实现

### 2. 渐进式披露设计 (Progressive Disclosure Design)

- **三级加载系统**:
  1. 元数据 (name + description) — 始终在上下文中
  2. SKILL.md body — 技能触发时
  3. 捆绑资源 — 按需使用

### 3. 五大模式分类 (Five Mode Classification)

技能按模式分类，指导 Agent 选择合适的结构：

| 模式 | 核心问题 | 典型场景 |
|---|---|---|
| Tool Wrapper | 模型不知道某个库的用法 | 补 API/库/工具知识 |
| Generator | 输出格式不稳定 | 报表生成、Schema 输出 |
| Reviewer | 需要按清单逐项核查 | 代码评审、合规审查 |
| Inversion | 需求存在歧义 | 模糊需求澄清 |
| Pipeline | 必须按顺序执行 | 部署流水线、多阶段审查 |

## 模式选择决策树 (Mode Decision Tree)

```
需求 → 补知识？→ Tool Wrapper
     → 固定格式？→ Generator
     → 清单核查？→ Reviewer
     → 歧义澄清？→ Inversion
     → 多步执行？→ Pipeline
```

## 目录结构 (Directory Structure)

- `scripts/`: 可执行代码，适用于需要确定性可靠性的任务
- `references/`: 按需加载的文档
- `assets/`: 在输出中使用的文件

## 与参考实现的对比 (Comparison with Reference Implementation)

### 功能增强 (Feature Enhancements)

1. **五大模式支持**: 标准化模式分类
2. **组合模式**: 支持 2~3 种模式叠加
3. **Gate 约束**: 行为侧模式的强约束机制

### 技术改进 (Technical Improvements)

1. **类型安全**: 完整的 TypeScript 类型定义
2. **错误处理**: 改进的错误处理和日志记录
3. **模块化**: 更好的模块化设计和代码组织
