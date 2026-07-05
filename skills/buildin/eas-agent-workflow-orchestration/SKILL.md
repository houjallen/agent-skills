---
name: eas-agent-workflow-orchestration
description: 该技能应用于通用Agent的工作流编排管理，提供多Agent协作、任务规划和进度跟踪，该技能使用过程中依赖于 eas-planning-writer skill 创建/更新相关文档。当需要进行复杂任务(plan)规划、多Agent协调或工作流管理时使用。
category: builtin
version: 1.0.3
tags: [easbot, workflow, orchestration, planning, multi-agent, task-management, coordination, agent-system]
---

# Agent工作流编排 (Agent Workflow Orchestration)

## 概述 (Overview)

Agent工作流编排技能提供了一个现代化的、模块化的工作流管理框架，结合了Manus风格的文件式规划与多Agent协作架构的优点。该技能**深度集成 eas-planning-writer skill** 来处理所有规划文件的创建和更新，确保工作流的一致性和完整性。

本技能为通用Agent环境提供多Agent协作、任务规划和进度跟踪功能。

## 何时使用 (When to Use)

该技能应在以下情况使用：
- 需要进行复杂多步骤任务规划时
- 涉及多Agent协作的项目
- 需要任务进度跟踪和协调时
- 任何需要 >5 个工具调用的复杂任务

## 快速参考 (Quick Reference)

- **默认文件位置**: `docs/task/` 
- **可配置位置**: 支持自定义路径配置
- **必需文件**: `task_plan.md`, `findings.md`, `progress.md`
- **多Agent协作**: 支持任务分配和状态同步

## 核心功能 (Core Functions)

### 1. 标准化文件结构 (Standardized File Structure)
该技能提供标准的文件管理：
- **默认行为**: 文件创建在 `docs/task/` 目录
- **配置灵活性**: 可根据具体项目需求自定义位置
- **兼容性**: 兼容旧的文件位置（可选）

### 2. 多Agent协作 (Multi-Agent Collaboration)
- **任务分配**: 支持将子任务分配给不同Agent
- **状态同步**: 通过共享任务文件同步多Agent状态
- **进度协调**: 统一的进度跟踪机制

### 3. 灵活的文件位置 (Flexible File Locations)
```typescript
interface WorkflowConfig {
  // 默认位置
  defaultLocation: 'docs/task/';
  
  // 支持自定义位置
  customLocation?: string;
  
  // 文件名配置
  fileNames: {
    plan: 'task_plan.md';
    findings: 'findings.md';
    progress: 'progress.md';
  };
}
```

### 4. 工作流协调器 (Workflow Coordinator)
- **阶段管理**: 任务阶段划分和管理
- **依赖处理**: 任务间依赖关系处理
- **错误恢复**: 工作流错误处理和恢复机制
- **状态跟踪**: 任务执行状态实时跟踪

## Agent工作流编排 (Agent Workflow Orchestration)

### 1. 默认规划模式 (Plan Mode Default)
- 对于任何非琐碎任务（包含3个以上步骤或架构决策），都要进入规划模式。
- 如果事情出现偏差，立即停止并重新规划——不要强行推进。
- 将规划模式用于验证步骤，而不仅仅是构建环节。
- 提前编写详细规范，以减少歧义。
- **Agent**: 使用内置规划模式（Planning with Files）或 eas-planning-writer 技能创建规划文档，遵循 `docs/task/` 目录标准。

### 2. 子智能体策略 (Subagent Strategy)
- 灵活使用子智能体，保持主上下文窗口的简洁。
- 将研究、探索和并行分析等工作交给子智能体处理。
- 对于复杂问题，通过子智能体投入更多算力。
- 每个子智能体只负责一个任务，以实现聚焦执行。
- **Agent**: 使用 eas-agent-workflow-orchestration 协调多Agent协作。

### 3. 自我提升循环 (Self-Improvement Loop)
- 在收到用户的任何修正后：将模式使用 eas-planning-writer skill 创建/更新到`docs/task/findings.md`文档里。
- 为自己制定规则，避免重复犯错。
- 反复迭代这些经验教训，直到错误率下降。
- 在相关项目的会话开始时，回顾经验教训。
- 更新 `docs/task/progress.md` 记录会话日志和错误。

### 4. 完成前验证 (Verification Before Done)
- 绝不在未证明其有效的情况下，将任务标记为完成。
- 在相关时，区分主智能体和你的变更行为。
- 自问："资深工程师会批准这个方案吗？"
- 运行测试、检查日志、演示正确性。

### 5. 追求优雅（平衡） (Demand Elegance (Balanced))
- 对于非琐碎的变更：暂停并思考"是否有更优雅的方式？"
- 如果一个修复方案感觉很"取巧"："基于我现在掌握的所有信息，实现一个优雅的解决方案。"
- 对于简单、明显的修复可以跳过此步骤——不要过度设计。
- 在展示自己的工作之前，先进行自我挑战。

### 6. 自主修复漏洞 (Autonomous Bug Fixing)
- 收到漏洞报告时：直接修复它。不要寻求手把手指导。
- 定位日志、错误和失败的测试——然后解决它们。
- 无需用户进行零上下文切换。
- 主动修复失败的CI测试，无需被告知具体方法。

## 任务管理 (Task Management)

1.  **先规划 (Plan First)**：
   - **Agent**: 启动规划模式，创建task_plan.md, findings.md, progress.md
   - **Agent**: 将计划使用 eas-planning-writer skill 创建/更新到 `docs/task/task_plan.md`文档里，包含可检查的项目。

2.  **验证计划 (Verify Plan)**：在开始实现前进行确认。

3.  **跟踪进度 (Track Progress)**：
   - **Agent**: 使用规划文件跟踪进度
   - **Agent**: 在推进过程中使用 `docs/task/progress.md` 和 `docs/task/findings.md` 标记完成的项目
   
4.  **解释变更 (Explain Changes)**：在每个步骤提供高层摘要。

5.  **记录结果 (Document Results)**：
   - **Agent**: 在规划文件中记录结果
   - **Agent**: 使用 eas-planning-writer skill 在 `docs/task/findings.md` 中添加评审部分

6.  **总结经验 (Capture Lessons)**：
   - **Agent**: 在规划文件中总结经验
   - **Agent**: 修正后使用 eas-planning-writer skill 更新 `docs/task/findings.md`

## 实现 (Implementation)

### 核心工作流 (Core Workflow)

#### 1. 初始化工作流 (Initialize Workflow)
在开始任何复杂任务前，直接使用 eas-planning-writer 技能：

```bash
# 直接使用 eas-planning-writer 技能创建规划文件
# eas-planning-writer 会自动创建 task_plan.md, findings.md, progress.md 在 docs/task/ 目录
```

#### 2. 与 eas-planning-writer 集成 (Integration with eas-planning-writer)
该工作流编排技能完全委托 **eas-planning-writer** 技能进行所有规划文件的创建和管理：

1. **委托 eas-planning-writer 创建 `docs/task/task_plan.md`** - 任务规划文件
2. **委托 eas-planning-writer 创建 `docs/task/findings.md`** - 研究发现记录
3. **委托 eas-planning-writer 创建 `docs/task/progress.md`** - 会话进度日志
4. **利用 eas-planning-writer 会话恢复功能** - 自动从上一会话恢复上下文
5. **通过 eas-planning-writer 更新** - 标记完成，记录错误

> **注意**: 该技能本身不创建任何文件，完全依赖 eas-planning-writer 提供的功能。

### 3. 文件用途 (File Purposes)

| 文件 | 用途      | 更新时机 |
|------|---------|----------|
| `docs/task/task_plan.md` | 阶段、进度、决策 | 每个阶段后 |
| `docs/task/findings.md` | 研究、发现,  | 任何发现后 |
| `docs/task/progress.md` | 会话日志、测试结果 | 整个会话期间 |

## 关键规则 (Key Rules)

### 1. 首先创建计划 (Create Plan First)
绝不在没有 `task_plan.md` 的情况下开始复杂任务。这是不可协商的。

### 2. 2-操作规则 (2-Action Rule)
> "每2次视图/浏览器/搜索操作后，立即在文本文件中保存关键发现。"

这可以防止视觉/多模态信息丢失。

### 3. 决策前阅读 (Read Before Decide)
在重大决策前，阅读计划文件。这使目标保持在你的注意力窗口中。

### 4. 行动后更新 (Update After Act)
完成任何阶段后：
- 标记阶段状态：`in_progress` → `complete`
- 记录遇到的任何错误
- 注明创建/修改的文件

### 5. 记录所有错误 (Log ALL Errors)
每个错误都进入计划文件。这建立知识并防止重复。

### 6. 永不重复失败 (Never Repeat Failures)
```
if action_failed:
    next_action != same_action
```
跟踪你尝试的内容。改变方法。

## 错误处理模式 (Error Handling Patterns)

### 重试机制 (Retry Mechanism)
```typescript
interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: BackoffStrategy;
  retryConditions: RetryCondition[];
}

enum BackoffStrategy {
  FIXED = 'fixed',
  EXPONENTIAL = 'exponential',
  LINEAR = 'linear'
}

interface RetryResult<Fallback> {
  success: boolean;
  data?: any;
  error?: Error;
  attempts: number;
  fallbackUsed?: Fallback;
}
```

### 断路器模式 (Circuit Breaker Pattern)
- **状态管理**: OPEN, CLOSED, HALF_OPEN
- **故障检测**: 连续失败计数
- **恢复机制**: 定时尝试恢复

## 多Agent协作模式 (Multi-Agent Collaboration Patterns)

### 任务分配 (Task Distribution)
- **主Agent**: 负责任务协调和状态同步
- **工作Agent**: 负责具体任务执行
- **监控Agent**: 负责进度跟踪和错误处理

### 状态共享 (State Sharing)
通过共享的规划文件实现多Agent状态同步：
- `docs/task/task_plan.md`: 任务阶段和整体进度
- `docs/task/findings.md`: 发现和决策共享
- `docs/task/progress.md`: 实时进度日志

### 协作流程 (Collaboration Workflow)
```
主Agent (协调) → 分配子任务 → 工作Agent (执行) → 更新共享文件 → 主Agent (同步状态)
```

## 配置选项 (Configuration Options)

### 文件位置配置 (File Location Configuration)
该技能依赖 eas-planning-writer 技能提供多种文件位置配置：

#### 1. 默认配置
```bash
# 文件将在 docs/task/ 目录创建
# 通过 eas-planning-writer 技能创建
```

#### 2. 自定义位置
```bash
# 通过 eas-planning-writer 技能配置自定义位置
```

#### 3. 项目根目录（向后兼容）
```bash
# 通过 eas-planning-writer 技能配置根目录位置（兼容旧版本）
```

## 自我改进机制 (Self-Improvement Mechanisms)

### 学习记录 (Learning Records)
技能内置学习记录机制：
- **错误记录**: 详细记录每次错误和解决方案
- **性能数据**: 记录任务执行时间和效率
- **模式识别**: 识别常用模式和优化机会
- **反馈整合**: 收集用户反馈并整合到流程中

### 持续优化 (Continuous Improvement)
- **定期回顾**: 自动分析过往任务的成功和失败
- **模式优化**: 识别并优化低效的工作模式
- **适应性调整**: 根据使用情况调整默认参数

## 核心功能 (Core Functions)

工作流编排技能提供以下核心功能，这些功能委托 eas-planning-writer 技能完成具体的文件操作：

- **工作流初始化** - 委托 eas-planning-writer 创建规划文件
- **状态跟踪** - 委托 eas-planning-writer 管理规划文件状态
- **会话管理** - 利用 eas-planning-writer 的会话恢复功能
- **多Agent协调** - 通过共享的规划文件进行协调（由eas-planning-writer管理）





## 使用示例 (Usage Examples)

### 示例1：多Agent协作项目 (Multi-Agent Collaboration Project)
```bash
# 首先使用 eas-planning-writer 初始化规划文件
# 工作流编排技能会协调多个Agent协作，所有Agent通过 eas-planning-writer 共享相同的规划文件
# 这确保了所有Agent都遵循相同的计划和目标
# 自动更新 task_plan.md, findings.md, progress.md 以反映协作状态
```

### 示例2：复杂研究任务 (Complex Research Task)  
```bash
# 通过 eas-planning-writer 开始复杂研究任务
# 所有研究发现通过 eas-planning-writer 自动记录到 findings.md
# 使用 progress.md 跟踪研究进度（通过 eas-planning-writer）
# 使用 task_plan.md 管理研究阶段（通过 eas-planning-writer）
```

### 示例3：生产系统部署 (Production System Deployment)
```bash
# 通过 eas-planning-writer 开始生产部署工作流
# 包含额外的验证步骤
# 详细的错误处理和回滚计划（通过 eas-planning-writer 记录）
# 审计跟踪和合规性检查（自动记录到规划文件）
```

## 最佳实践 (Best Practices)

### 遵循标准规范
- 将任务相关文件存储在 `docs/task/` 目录中
- 在需要时使用可配置位置
- 确保文件名符合标准格式

### 多Agent协作
- 使用共享规划文件进行状态同步
- 实现任务分配和负载均衡
- 建立有效的通信机制

### 工作流管理
- 在开始前创建清晰的计划
- 定期更新进度状态
- 记录所有重要发现和决策

### 错误处理
- 实施重试和恢复机制
- 记录所有错误和解决方案
- 避免重复相同错误

## 与其他技能的关系 (Relationships with Other Skills)

- **eas-planning-writer**: 核心依赖技能，用于创建和管理所有规划文件（task_plan.md, findings.md, progress.md）
- **eas-skill-using**: 提供生态系统概览和上下文信息
- **eas-skill-find**: 用于查找相关技能和工具
- **eas-skill-share**: 用于分发和共享工作成果
- **eas-agent-planner**: 与规划Agent协作
- **eas-agent-task-executor**: 与任务执行Agent协作
- **eas-agent-coordinator**: 与协调Agent协作

## 相关文档 (Related Documents)

- Agent交互模式文档
- 任务管理规范文档
- 工作流概念说明文档
- 多Agent协作模式文档
- 文件生成标准文档
- 技能开发规范文档
- 协调模式文档

## 安全考虑 (Security Considerations)

### 访问控制
- 确保只有授权Agent可以修改核心规划文件
- 实施适当的权限控制机制
- 记录对规划文件的访问和修改

### 数据保护
- 避免在规划文件中存储敏感信息
- 使用适当的加密和访问控制
- 定期清理包含临时敏感数据的文件

## 性能考虑 (Performance Considerations)

### 文件I/O优化
- 实现批量写入操作以减少磁盘I/O
- 使用智能缓存频繁访问的文件内容
- 实施异步文件操作以避免阻塞

### 并发控制
- 实施适当的文件锁定机制
- 防止多Agent同时修改同一文件
- 确保状态同步的一致性
