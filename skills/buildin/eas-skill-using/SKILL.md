---
name: eas-skill-using
description: 该技能应在Agent需要了解EASBot项目概览、技能生态系统指引或最佳实践时使用，作为所有EASBot技能的中央导航和上下文提供者，帮助Agent理解和使用EASBot技能系统。此技能提供EASBot生态系统的完整概览和导航服务。
category: builtin
version: 1.0.1
tags: [easbot, guidance, navigation, ecosystem, overview, entry-point]
---

# eas-skill-using - EASBot生态系统导航与概览 (EASBot Ecosystem Navigation & Overview)

## 概述 (Overview)

eas-skill-using是EASBot技能生态系统的中央入口和导航中心。此技能提供了整个EASBot项目的完整概览，协助Agent理解技能生态系统架构，找到合适的技能，并提供使用指导。作为EASBot技能系统的统一入口，此技能帮助Agent快速定位所需功能并理解各组件之间的关系。

## 何时使用 (When to Use)

该技能应在以下情况使用：
- Agent需要了解EASBot项目整体架构和组件时
- 需要导航EASBot技能生态系统以找到合适技能时
- 需要了解EASBot使用指导和最佳实践时
- 作为使用EASBot时的前置技能，获取上下文信息时
- 无法确定使用哪个技能时，作为导航起点

## 快速参考 (Quick Reference)

- **项目概览**: 获取EASBot项目整体架构和组件信息
- **技能导航**: 发现和定位EASBot技能生态系统中的合适技能
- **使用指导**: 获取EASBot使用最佳实践和推荐做法
- **上下文提供**: 作为其他技能的前置信息提供者
- **技能决策**: 当不确定使用哪个技能时的决策辅助

## 核心功能 (Core Functions)

### 1. 项目架构概览 (Project Architecture Overview)
提供EASBot项目的整体架构说明，包括PNPM monorepo结构、核心包职责、技能系统工作原理、多Agent协作机制等。帮助Agent快速理解EASBot系统的组织方式。

### 2. 技能生态系统导航 (Skill Ecosystem Navigation)
索引EASBot项目中所有可用的核心技能和工具，提供详细的技能分类和功能描述，帮助Agent快速定位和理解整个技能生态系统。

### 3. 使用指导和最佳实践 (Usage Guidance and Best Practices)
提供EASBot的使用指南和推荐实践，包括何时使用哪个技能、技能组合使用建议、故障排除指导等，确保Agent能够高效地利用系统功能。

### 4. 组件关系映射 (Component Relationship Mapping)
展示EASBot生态系统中各组件之间的依赖关系和协作模式，帮助Agent理解技能间的相互作用和最佳使用序列。

## EASBot技能生态系统概览 (EASBot Skill Ecosystem Overview)

### 核心技能 (Core Skills)
- **eas-skill-using** - 生态系统概览与导航中心（当前技能）
- **eas-skill-creator** - 技能创建与开发工具
- **eas-skill-find** - 技能发现与查找工具
- **eas-skill-share** - 技能发布与分享工具

### 工作流技能 (Workflow Skills)
- **eas-agent-workflow-orchestration** - 多Agent工作流编排与协调
- **eas-planning-writer** - 基于文件的任务规划与管理

### 代理技能 (Agent Skills)
- **eas-agent-planner** - 任务规划与调度
- **eas-agent-plan-executor** - 计划执行与监控
- **eas-agent-researcher** - 信息收集与研究
- **eas-agent-coordinator** - Agent协调与通信

## 使用场景与技能匹配 (Use Cases and Skill Matching)

### 项目初始化 (Project Initialization)
- **需求**: 创建新项目结构
- **推荐技能**: eas-skill-creator + eas-agent-workflow-orchestration

### 任务规划 (Task Planning) 
- **需求**: 复杂任务分解和规划
- **推荐技能**: eas-planning-writer + eas-agent-planner

### 技能开发 (Skill Development)
- **需求**: 开发新技能
- **推荐技能**: eas-skill-creator + eas-skill-find + eas-skill-share

### 多Agent协作 (Multi-Agent Collaboration)
- **需求**: 协调多个Agent协同工作
- **推荐技能**: eas-agent-workflow-orchestration + eas-agent-coordinator

## 集成与协作模式 (Integration and Collaboration Patterns)

### 工作流编排集成 (Workflow Orchestration Integration)
- eas-agent-workflow-orchestration 作为协调器，依赖 eas-planning-writer 进行文件管理
- eas-planning-writer 提供底层规划文件创建和维护

### 技能发现与使用 (Skill Discovery and Usage)
- eas-skill-find 用于查找可用技能
- eas-skill-using 提供生态系统概览和使用指导

## 最佳实践 (Best Practices)

### 技能选择指南 (Skill Selection Guide)
1. **明确需求**: 清楚定义你要解决的问题类型
2. **查看分类**: 根据需求类型查找对应分类的技能
3. **阅读描述**: 详细了解技能的功能和适用场景
4. **组合使用**: 复杂任务可能需要多个技能协作

### 常见场景技能组合 (Common Scenarios and Skill Combinations)
- **新项目设置**: eas-skill-creator → eas-agent-workflow-orchestration → eas-planning-writer
- **任务执行**: eas-agent-planner → eas-planning-writer → eas-agent-plan-executor
- **技能开发与发布**: eas-skill-creator → eas-skill-find → eas-skill-share
- **研究任务**: eas-agent-researcher → eas-planning-writer → eas-agent-coordinator

### 故障排除 (Troubleshooting)
当遇到以下情况时，可使用 eas-skill-using 获取指导：
- 不确定使用哪个技能
- 技能之间如何协作不清楚
- 工作流中断需要重新定位
- 需要系统性的使用建议

## EASBot架构概览 (EASBot Architecture Overview)

### 系统愿景 (System Vision)
EASBot是一个多Agent协作生态系统，实现自我学习、自我进化和持续改进的AI Agent平台。系统具有以下特点：
- **主Agent协调中心**: 负责调度和协调其他Agent工作
- **自动化探索**: 根据技能和程序定时任务自动探索站点
- **知识发现**: 在探索过程中产生新发现，形成新Idea
- **智能任务管理**: 评审后自动生成任务
- **长期记忆系统**: 工作内容进入Agent长期记忆
- **向量数据库集成**: 内容进入向量数据库
- **持续进化**: 系统成长、自我完善、持续进化

### 包结构 (Package Structure)
```
packages/
├── agent/                    # 核心Agent功能
├── skill/                 # 技能管理系统
├── mcp/                    # MCP服务器管理
├── web/                    # Web界面和API
├── memory/                 # 长期记忆系统
├── creation/           # 主Agent协调器
├── eas-explorer/               # 自动探索系统
├── eas-task-manager/           # 智能任务管理
├── sdk/                    # client lib sdk
├── monitor/                # 监控与可观测性
├── utils/           # 共享工具库
├── types/           # 共享类型定义
└── eas-cli/                    # 命令行工具
```

## 使用方法 (Usage Methods)

### 基本工作流 (Basic Workflow)
1. **需求分析**: 使用 eas-skill-using 了解可用技能和最佳实践
2. **技能选择**: 根据需求选择合适的技能或技能组合
3. **执行任务**: 使用选定的技能执行任务
4. **结果整合**: 根据需要使用其他技能进一步处理结果

### 开始使用 (Getting Started)
1. 当你不确定使用哪个技能时，首先咨询 eas-skill-using
2. 根据你的具体任务需求，参考技能分类进行选择
3. 对于复杂任务，考虑使用技能组合
4. 使用 eas-agent-workflow-orchestration 进行多步骤任务管理
5. 使用 eas-planning-writer 进行复杂任务规划

## 与其他技能的关系 (Relationships with Other Skills)

- **eas-skill-creator**: 提供技能开发功能，可配合此技能进行新技能创建
- **eas-skill-find**: 提供技能发现功能，与之协作进行技能搜索
- **eas-skill-share**: 提供技能分发功能，与之协作进行技能发布
- **eas-agent-workflow-orchestration**: 提供工作流编排功能，可协调多个技能执行
- **eas-planning-writer**: 提供任务规划功能，与之协作进行任务管理
- **所有其他EASBot技能**: 作为统一入口，为整个技能生态系统提供概览和导航

## 关键概念 (Key Concepts)

### Agent协作 (Agent Collaboration)
- **主Agent**: 作为协调中心，负责调度和协调
- **工作Agent**: 负责具体任务执行
- **协调机制**: 通过共享文件和状态同步进行协作
- **多Agent通信**: 使用共享规划文件进行状态同步和状态传递

### 文件驱动规划 (File-driven Planning)
- **task_plan.md**: 任务阶段和目标管理，跟踪任务进度和状态
- **findings.md**: 研究发现和决策记录，存储学习和发现信息
- **progress.md**: 进度跟踪和会话日志，记录执行过程和结果
- **规划生命周期**: 从任务规划到执行到完成的完整跟踪

### 技能开发 (Skill Development)
- 遵循统一的技能格式规范
- 具备明确的输入输出定义
- 支持与其他技能集成协作
- 包含清晰的使用说明和示例

### 技能系统架构 (Skill System Architecture)
EASBot技能系统使用四个核心技能形成完整的生态系统：
1. **eas-skill-using**: 统一入口和导航技能 - 作为所有技能的中央入口点
2. **eas-skill-creator**: 技能创建构建器 - 用于创建、构建和验证EASBot技能
3. **eas-skill-find**: 技能查找器 - 在EASBot生态系统中查找和搜索可用技能
4. **eas-skill-share**: 技能分享器 - 用于分发、发布和共享技能

## 技术栈 (Technology Stack)

### 基础设施 (Infrastructure)
- **包管理**: PNPM + Workspaces (单体仓库架构)
- **开发语言**: TypeScript (强烈推荐使用TS/TSX后缀)
- **测试框架**: Vitest
- **代码质量**: Biome (用于格式化和检查)
- **构建工具**: tsup (库包), bun (应用)

### 数据存储 (Data Storage)
- **关系数据库**: SQLite + PostgreSQL (统一接口支持)
- **向量数据库**: 多选型支持 (统一API接口)
- **知识图谱**: 多选型支持 (统一API接口)

### 通信协议 (Communication Protocols)
- **实时通信**: WebSocket
- **API通信**: HTTP/REST
- **上下文协议**: Model Context Protocol (MCP) 集成

## 开发模式 (Development Patterns)

### 代码规范 (Coding Standards)
- **脚本后缀**: 脚本文件统一使用 `.ts`、`.tsx` 后缀，禁止使用 `.js`、`.jsx`
- **导入路径**: TS/TSX文件在import时不需要添加后缀
- **格式化**: 遵循Biome配置（2空格缩进，LF换行符，200字符行宽）
- **类型安全**: 使用严格的TypeScript类型，避免使用 `any` 类型

### 工作流 (Workflows)
- **测试**: 所有包预计在 `tests/**/*.ts` 中有统一的测试结构
- **构建命令**: 使用 pnpm 命令进行项目管理
- **技能管理**: 由 skill 包处理，兼容 Claude 和 Opencode 规范

## 最佳实践 (Best Practices)

### 任务管理 (Task Management)
- **复杂任务**: 对于 >5 个工具调用的任务，使用 eas-planning-writer 进行规划
- **进度跟踪**: 使用规划文件 (task_plan.md, findings.md, progress.md) 跟踪任务进度
- **多Agent协作**: 使用 eas-agent-workflow-orchestration 协调多个Agent协作

### 技能使用 (Skill Usage)
- **技能发现**: 使用 eas-skill-find 查找所需技能
- **技能开发**: 使用 eas-skill-creator 创建新技能
- **技能分享**: 使用 eas-skill-share 发布和分享技能
- **系统概览**: 使用 eas-skill-using 获取生态系统全局视图

### 错误处理 (Error Handling)
- **重试机制**: 实施适当的重试策略
- **状态同步**: 确保多Agent协作中的状态一致性
- **文档记录**: 记录错误和解决方案以避免重复

### 性能优化 (Performance Optimization)
- **文件I/O优化**: 使用批量写入和智能缓存减少磁盘I/O
- **并发控制**: 使用适当的锁定机制防止竞争条件
- **资源管理**: 高效管理内存和计算资源

## 实用示例 (Practical Examples)

### 场景1：启动新项目 (Scenario 1: Starting a New Project)
```bash
# 1. 首先获取EASBot生态系统概览
# 使用 eas-skill-using 了解可用技能和最佳实践

# 2. 创建项目结构
# 使用 eas-skill-creator 初始化项目

# 3. 规划项目工作流
# 使用 eas-agent-workflow-orchestration 管理项目流程

# 4. 创建任务规划文件
# 使用 eas-planning-writer 生成 task_plan.md, findings.md, progress.md
```

### 场景2：开发新技能 (Scenario 2: Developing a New Skill)
```bash
# 1. 获取技能开发指导
# 使用 eas-skill-using 了解开发最佳实践

# 2. 创建新技能
# 使用 eas-skill-creator 开发技能

# 3. 验证技能功能
# 使用 eas-skill-find 测试技能发现功能

# 4. 发布技能
# 使用 eas-skill-share 分享技能到生态系统
```

### 场景3：多Agent协作 (Scenario 3: Multi-Agent Collaboration)
```bash
# 1. 设置协作环境
# 使用 eas-agent-workflow-orchestration 配置多Agent协作

# 2. 创建共享规划文件
# 使用 eas-planning-writer 生成协作所需的规划文件

# 3. 协调Agent活动
# 使用 eas-agent-coordinator 管理Agent间通信

# 4. 跟踪协作进度
# 通过共享的规划文件跟踪协作状态
```

## 总结 (Summary)

eas-skill-using 作为EASBot技能生态系统的核心导航点，为Agent提供了：
- **完整的生态系统概览**: 了解所有可用技能和它们的功能
- **清晰的使用指导**: 知道何时以及如何使用不同技能
- **协调的技能组合**: 理解如何组合多个技能完成复杂任务
- **最佳实践指导**: 遵循EASBot系统的推荐做法

通过这个技能，Agent可以有效地导航EASBot生态系统，选择合适的工具，并以最佳方式利用系统功能。
