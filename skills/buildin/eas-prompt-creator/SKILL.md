---
name: eas-prompt-creator
description: 该技能应在需要为 EASBot 创建、规范化或审核提示词时使用。技能提供完整的提示词分类体系、规范化模板和质量控制流程，确保提示词遵循 EASBot 设计规范和最佳实践。
category: builtin
version: 1.0.0
tags: [easbot, prompt, agent, tool, task]
---

# Eas Prompt Creator - EASBot 提示词创建器 (EASBot Prompt Creator)

## 概述 (Overview)

该技能提供标准化的 EASBot 提示词创建工作流，涵盖 Agent、Tool、Task、Command、Mode、Session、Feature、Context 八大类型。通过结构化信息收集和规范化模板，确保生成的提示词具有一致性、可维护性和高质量。

**CRITICAL: 生成的所有提示词内容必须使用英文。**

## 何时使用 (When to Use)

该技能应在以下情况使用：

- 创建新的 EASBot 提示词
- 规范化现有提示词格式
- 审核提示词质量
- 设计 Agent 系统提示词
- 定义工具描述和边界
- 创建任务工作流提示词
- 设计场景模式提示词（如 general、coder）

## 快速参考 (Quick Reference)

**提示词类型分类：**

| 类型 | 用途 | 规范文件 |
|------|------|----------|
| Agent | 定义 Agent 行为 | [agent-prompt-spec.md](references/agent-prompt-spec.md) |
| Tool | 描述工具功能 | [tool-prompt-spec.md](references/tool-prompt-spec.md) |
| Task | 任务管理流程 | [task-prompt-spec.md](references/task-prompt-spec.md) |
| Command | 命令执行指南 | [command-prompt-spec.md](references/command-prompt-spec.md) |
| Mode | 场景模式切换 | [mode-prompt-spec.md](references/mode-prompt-spec.md) |
| Session | 会话生命周期 | [session-prompt-spec.md](references/session-prompt-spec.md) |
| Feature | 特性功能定义 | [feature-prompt-spec.md](references/feature-prompt-spec.md) |
| Context | 上下文构建 | [context-prompt-spec.md](references/context-prompt-spec.md) |

## 信息收集流程 (Information Collection)

使用 `AskUserQuestion` 工具按顺序收集以下信息：

### 第一轮：基础信息

1. **提示词类型**（必填）
2. **提示词名称**（必填）
3. **所属场景**（必填：general/coder）
4. **主要用途**（必填）

### 第二轮：类型特定信息

根据类型查阅对应规范文件，收集完整字段。

### 第三轮：输出模板确认

**重要**：输出模板不是固定必填的，根据场景判断：

- 如果 Agent 能判断该提示词需要固定输出格式（如 Task、Summary、Plan），自动添加
- 如果 Agent 无法判断，提问用户：`"此提示词是否需要固定输出模板？支持的格式：JSON / Markdown"`

### 第四轮：质量确认

- 边界控制完整性
- 示例充足性

## 提示词创建规范 (Prompt Creation Standards)

### 语言要求

**CRITICAL: 生成的所有提示词内容必须使用英文。**

- 所有提示词主体内容使用英文
- 技术术语保持原始形式（如 TypeScript、API、CLI）
- 标题使用双语：`## Chinese Title (English Title)`
- 代码注释可使用中文

### 固定格式要求

所有提示词文件必须包含：

```yaml
---
title: [English title]
type: [agent|tool|task|command|mode|session|feature|context]
mode: [general|coder|all]
required: [comma-separated required fields]
optional: [comma-separated optional fields]
---
```

### 输出模板要求

**支持的格式**：JSON、Markdown

**何时需要**：
- Agent 能判断需要固定输出格式时（如总结、计划、任务结果）
- 用户明确要求时

**模板结构**：参考 `references/output-template.md`

### 边界控制原则

- **NEVER**: 绝对禁止的行为
- **DO NOT**: 不推荐的行为
- **ALWAYS**: 必须执行的操作
- **CRITICAL**: 关键约束
- **MUST**: 强制要求

### 质量标准

- 内容简洁，避免冗余
- 结构清晰，层次分明
- 示例具体，具有代表性
- 边界明确，无歧义

## 与其他技能的关系 (Relationships with Other Skills)

- **eas-skill-creator**: 技能创建依赖此技能生成提示词
- **eas-skill-using**: 使用提示词时参考此技能规范
- **eas-skill-find**: 搜索提示词时参考分类体系

## 参考资料 (References)

| 类型 | 规范文件 |
|------|----------|
| Agent | [agent-prompt-spec.md](references/agent-prompt-spec.md) |
| Tool | [tool-prompt-spec.md](references/tool-prompt-spec.md) |
| Task | [task-prompt-spec.md](references/task-prompt-spec.md) |
| Command | [command-prompt-spec.md](references/command-prompt-spec.md) |
| Mode | [mode-prompt-spec.md](references/mode-prompt-spec.md) |
| Session | [session-prompt-spec.md](references/session-prompt-spec.md) |
| Feature | [feature-prompt-spec.md](references/feature-prompt-spec.md) |
| Context | [context-prompt-spec.md](references/context-prompt-spec.md) |
| Output Template | [output-template.md](references/output-template.md) |
| Boundary Control | [boundary-control.md](references/boundary-control.md) |
| **Prompt Validation** | [prompt-validation.md](references/prompt-validation.md) |

## 提示词验证规范 (Prompt Validation)

### 核心原则

提示词验证遵循以下核心原则：

1. **四个核心职责**：身份、安全约束、质量标准、能力知识
2. **U型注意力曲线**：关键内容放在开头和结尾
3. **Token 预算**：系统提示词 < 6,000 tokens

### 验证清单

详细验证规范请参阅 [prompt-validation.md](references/prompt-validation.md)

#### 结构验证

- [ ] 身份定义在最顶部？
- [ ] 安全约束使用 IMPORTANT 标记并在结尾重复？
- [ ] 清晰的章节分隔？
- [ ] 示例使用 <example> 标签？

#### Token 预算验证

- [ ] 自定义部分 < 6,000 tokens？
- [ ] 不重复工具定义中已有的信息？
- [ ] 领域知识按需加载，非预加载？
- [ ] 无冗长的背景故事？

#### 规则质量验证

- [ ] 每条规则可真/假测试？
- [ ] 硬约束使用绝对语言（NEVER/MUST）？
- [ ] 软建议使用推荐语言（recommended/prefer）？
- [ ] 关键规则解释原因？
- [ ] 双向约束（做什么 + 不做什么）？

### 反模式检测

| 反模式 | 问题 | 解决方案 |
|--------|------|----------|
| Prompt Chains | 机械执行 | 告诉目标，让模型决定步骤 |
| Flattery Engineering | 浪费 tokens | 删除奉承语言 |
| Knowledge Dumps | 消耗上下文 | 按需加载 |
| Missing Failure Handling | 无限重试 | 添加失败处理策略 |

### 内容质量评分

| 评分 | 等级 | 处理方式 |
|------|------|----------|
| 5 | 必需 | **MUST** 包含 |
| 4 | 重要 | **ALWAYS** 推荐包含 |
| 3 | 有用 | 可选包含 |
| 2 | 模糊 | 考虑剔除 |
| 1 | 冗余 | **DO NOT** 剔除 |
