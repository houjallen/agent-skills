---
name: eas-agent-creation
description: 该技能应用于 EASBot Agent 的技能创建、演化和生命周期管理。当 Agent 需要按应用场景创建新技能、演化现有技能、或管理技能组合时使用。
category: builtin
version: 1.0.0
tags: [easbot, skill, creation, evolution, lifecycle]
---

# eas-agent-creation (EASBot 技能创建与演化)

## Overview

eas-agent-creation 是 EASBot 的核心技能，用于管理 Agent 技能的完整生命周期。它指导 Agent 如何：

1. **创建技能**：根据需求创建符合 Agent Skills 标准的技能
2. **演化技能**：基于反馈和经验优化现有技能
3. **管理组合**：组合多种模式形成完整的行为控制链路

### 关于本技能

使用此技能当需要：
- 根据用户需求创建新的 EASBot 技能
- 演化/优化现有技能的描述、模板或行为
- 将多个技能组合成 Bundle
- 诊断技能失败原因并提出改进建议
- 管理技能的生命周期（创建 → 演化 → 废弃）

不适用于：
- 临时性的单次任务
- 与技能管理无关的常规开发任务

### 技能类型 (Skill Type)

#### 技术（Technique）+ 模式（Pattern）
既有明确步骤可遵循，又涉及决策判断的复合型技能

## When to Use

使用此技能当需要：

### 场景 1：创建新技能
- 用户提出需要某种能力，但尚无对应 Skill
- 需要按 Agent Skills 标准构建技能包
- 需要决定技能的组合模式（Tool Wrapper / Generator / Reviewer / Inversion / Pipeline）

### 场景 2：技能演化
- 某技能失败率高，需要重新生成或修订
- 发现技能描述不够清晰，需要优化
- 需要将单一模式升级为组合模式

### 场景 3：技能组合
- 任务需要多技能协作（Inversion 前置澄清 + Pipeline 执行）
- 需要将多个相关技能打包为 Bundle
- 需要声明技能间的依赖关系

### 场景 4：技能诊断
- 某能力调用失败率高，需要分析原因
- 需要生成自我评估报告
- 需要制定进化计划

## Quick Reference

| Item | Value |
|------|-------|
| 核心模块 | Creator, Evolver, Assessor, Validator |
| 模式数量 | 5 种（Tool Wrapper, Generator, Reviewer, Inversion, Pipeline） |
| 组合策略 | 支持 2~3 种模式组合 |

## Core Pattern: 技能创建与演化

### 技能创建流程

```
User/Agent Request
        ↓
HookEvent.CreationRequest
        ↓
inferComposition(requirement)
   ├─ 分析需求关键词
   ├─ 判断模式组合
   └─ 生成连接语义
        ↓
Creator.generate(spec)
   ├─ 构建 SkillSpec
   ├─ 填充 deliveryChecklist
   └─ 生成 behavior 结构
        ↓
Validator.validateSkillSpec()
   ├─ 校验必填字段
   ├─ 检查模式组合
   └─ 验证 behavior 结构
        ↓
Creator.register()
   ├─ 写盘到 ~/.easbot/created/skills/<name>/
   └─ Bus.publish(CreationComplete)
        ↓
Skill Ready for Agent
```

### 技能演化流程

```
Scheduler Trigger / Agent Request
        ↓
SelfAssessor.assess()
   ├─ 按 refId 聚合 Experience
   ├─ 按模式维度分组指标
   └─ 识别弱点和机会
        ↓
Evolver.planEvolution()
   ├─ 高失败率 → revise-spec
   ├─ 新需求 → create-skill
   └─ 重复技能 → merge
        ↓
applyPlan()
   ├─ 自动执行（低风险）
   └─ 人工审批（高风险）
        ↓
Skill Evolved
```

## Five Skill Modes

### 1. Tool Wrapper（补知识）

**核心问题**：模型不知道某个库/工具/API 的最新用法

**特征**：
- 包含 API 速查表和调用示例
- 标注版本兼容性
- 列明不适用场景

**典型场景**：
- 补 API/库用法的最新语法
- 提供 SDK 调用指导
- 补充框架特定的最佳实践

### 2. Generator（稳输出）

**核心问题**：输出格式不稳定，需要严格 Schema/模板

**特征**：
- 包含固定输出模板
- 明确的校验规则
- 正反例对比

**典型场景**：
- 报表生成
- Schema 化输出
- 代码脚手架生成

### 3. Reviewer（按标准审）

**核心问题**：需要按清单逐项核查

**特征**：
- `references/checklist.md` 独立清单
- 入口 → 步骤 → 出口三段式
- 结构化输出 {passed, failed, severity[], comments}

**典型场景**：
- 代码审查
- 合规检查
- Pre-PR 检查

### 4. Inversion（先问再做）

**核心问题**：需求存在歧义/缺关键参数

**特征**：
- 三阶段澄清（范围/环境/约束）
- 每题 2-4 选项
- `refuseActionWhenIncomplete: true`

**典型场景**：
- 部署前澄清
- 迁移需求确认
- 复杂配置参数反问

### 5. Pipeline（每步过 Gate）

**核心问题**：流程必须按顺序执行，跳步会导致错误

**特征**：
- 步骤序列 + Gate 三要素
- 入口条件 / 准出门槛 / 失败兜底
- 支持 abort/skip/retry 策略

**典型场景**：
- CI/CD 流水线
- 数据 ETL 流程
- 多阶段审查

## Mode Selection Decision Tree

```
                 User Requirement
                        ↓
        ┌───────────────────────────┐
        │ 1. Need external knowledge?│ ─Yes─→ Tool Wrapper
        └───────────────────────────┘
                    │ No
        ┌───────────────────────────┐
        │ 2. Need fixed output format?│ ─Yes─→ Generator
        └───────────────────────────┘
                    │ No
        ┌───────────────────────────┐
        │ 3. Need checklist review? │ ─Yes─→ Reviewer
        └───────────────────────────┘
                    │ No
        ┌───────────────────────────┐
        │ 4. Ambiguous requirements?│ ─Yes─→ Inversion
        └───────────────────────────┘
                    │ No
        ┌───────────────────────────┐
        │ 5. Multi-step sequential? │ ─Yes─→ Pipeline
        └───────────────────────────┘
                    │ No
                  (Default Base Skill)
```

## Mode Composition Matrix

| Primary | Secondary | Typical Scenario | Form |
|---------|-----------|------------------|------|
| Pipeline | Reviewer | Multi-stage review pipeline | Pipeline embeds Reviewer as gate |
| Pipeline | Inversion | Deployment with pre-clarification | Pipeline starts with Inversion |
| Generator | Reviewer | Auto-generate + compliance check | Generator output → Reviewer check |
| Pipeline | Inversion + Reviewer | Full lifecycle control | Complete 3-mode composition |
| Tool Wrapper | Inversion | Complex SDK with pre-clarification | Knowledge supplement + requirement clarify |

## Delivery Checklist

每个 Skill 必须自检以下交付项：

| Item | Description |
|------|-------------|
| developmentGuide | 何时用/不用、典型用法 |
| pitfallTable | 已知坑 + 反模式 |
| reviewProcess | 准入准出清单 |
| deploymentGuide | 安装/卸载/升级命令 |
| observability | 日志、metrics、调试入口 |
| scripts | 自动化辅助脚本 |

## Implementation

### 使用 creation 工具

Agent 应使用 `creation` 工具完成任务。所有创建、演化、评估操作都通过该工具执行。

#### 工具调用示例

```typescript
// 1. 创建新技能
creation({
  operation: "create",
  requirement: "创建一个帮助审查代码命名的技能",
  hints: ["包含命名规范清单", "支持中英文命名"]
})

// 2. 执行自我评估
creation({
  operation: "assess",
  windowDays: 30
})

// 3. 运行进化引擎（试运行）
creation({
  operation: "evolve",
  dryRun: true
})

// 4. 应用进化计划
creation({
  operation: "apply-plan",
  planId: "plan_xxx",
  approvedBy: "user@example.com"
})

// 5. 列出已创建的技能
creation({
  operation: "list",
  mode: "always",
  limit: 10
})
```

### 创建 Skill 的步骤

#### 步骤 1：分析需求
理解用户需求的本质，判断需要的模式组合

#### 步骤 2：使用 creation 工具创建
调用 `creation` 工具的 `create` 操作：

```typescript
creation({
  operation: "create",
  requirement: "用户需求描述（至少10个字符）",
  hints: ["可选的提示数组"]
})
```

工具将返回生成的技能规格（SkillSpec），包含：
- `name`: 技能名称
- `spec`: 完整的技能规格对象

#### 步骤 3：使用 eas-skill-creator 完善
**关键**：creation 工具只生成骨架，必须使用 eas-skill-creator 完善：
1. **完善示例**：添加正向/反向使用示例
2. **补全文档**：填充 references/ 目录的详细内容
3. **优化模板**：补充具体参数和配置
4. **验证结构**：tsx scripts/quick-validate.ts <skill-path>

#### 步骤 4：测试使用
在实际任务中验证技能效果

### 演化 Skill 的步骤

#### 步骤 1：获取评估
调用 `creation` 工具的 `assess` 操作：

```typescript
creation({
  operation: "assess",
  windowDays: 7  // 分析窗口期，1-90天
})
```

#### 步骤 2：分析弱点
查看返回的 `weaknesses` 和 `opportunities` 列表

#### 步骤 3：使用 eas-skill-creator 优化
根据弱点分析结果，使用 eas-skill-creator 完善技能内容：
- 针对识别的问题补充示例
- 修复已知坑
- 优化验证规则

#### 步骤 4：运行进化
调用 `evolve` 操作：

```typescript
// 试运行：生成计划不应用
creation({
  operation: "evolve",
  dryRun: true
})

// 正式运行：生成并执行计划
creation({
  operation: "evolve",
  dryRun: false
})
```

#### 步骤 5：应用计划（如需审批）
如果计划需要人工审批：

```typescript
creation({
  operation: "apply-plan",
  planId: "计划ID（从 evolve 结果获取）",
  approvedBy: "审批人邮箱或ID"
})
```

## Common Pitfalls

### Pitfall 1: 模式选择错误
**问题**：将 Generator 误用为 Reviewer
**解决**：记住 Generator 是"稳输出"，Reviewer 是"按清单审"

### Pitfall 2: 清单与流程耦合
**问题**：将 checklist 内容写在 SKILL.md body
**解决**：checklist 放 references/checklist.md，body 只写流程

### Pitfall 3: 缺少 Gate 定义
**问题**：Pipeline 步骤没有完整的 Gate 三要素
**解决**：每个步骤必须定义 entryConditions、exitConditions、onFailure

### Pitfall 4: Inversion 过于开放
**问题**：问题选项太多或无选项
**解决**：每题必须 2-4 个互斥选项

## References

详细规范请参阅：
- [Skill Spec 规范](references/skill-spec.md) - 完整的 Skill 类型定义
- [Mode 模式详解](references/modes.md) - 五种模式的详细定义
- [Validation 规则](references/validation.md) - Validator 校验规则
- [Evolution 流程](references/evolution.md) - 技能演化流程

## Examples

### Example 1: Create a Tool Wrapper Skill

**User Request**: "我需要一个技能来帮助我使用最新的 React Server Actions"

**Analysis**:
- 需求：补 React 19 Server Actions 知识
- 模式：Tool Wrapper

**Result**:
```yaml
---
name: react-19-server-actions
description: 提供 React 19 Server Actions 的使用指南。用于处理表单、异步操作和数据提交。
mode: tool-wrapper
composition: single
deliveryChecklist:
  developmentGuide: true
  pitfallTable: true
  reviewProcess: false
  deploymentGuide: false
  observability: false
  scripts: true
---
```

### Example 2: Create a Reviewer Skill

**User Request**: "我需要一个代码审查技能，检查命名规范和错误处理"

**Analysis**:
- 需求：按清单审查代码
- 模式：Reviewer
- 需要 checklist

**Result**:
```yaml
---
name: code-quality-reviewer
description: 审查代码的命名规范和错误处理。用于 Pre-PR 检查和代码质量保证。
mode: reviewer
composition: single
reviewer:
  checklist:
    filePath: ./references/checklist.md
    severityLevels: [critical, high, medium, low]
  process:
    entry: 读取待审查的代码文件
    steps:
      - id: check-naming
        name: 检查命名规范
        checklistSection: §1 命名规范
      - id: check-error-handling
        name: 检查错误处理
        checklistSection: §2 错误处理
    exit: 输出结构化 JSON 报告
---
```

### Example 3: Create a Pipeline Skill

**User Request**: "我需要一个技能来处理代码文档生成，包括解析、生成、检查"

**Analysis**:
- 需求：多步骤顺序执行
- 模式：Pipeline
- 需要 Gate 定义

**Result**:
```yaml
---
name: code-doc-pipeline
description: 自动生成代码文档的多阶段流水线。用于生成 API 文档和代码注释。
mode: pipeline
composition: single
behavior:
  sequence:
    - id: parse
      name: 解析代码
      kind: parse
      gate:
        entryConditions: [{type: input-exists}]
        exitConditions: [{type: output-generated}]
        onFailure: {action: abort}
    - id: generate
      name: 生成文档
      kind: generate
      dependsOn: [parse]
      gate:
        entryConditions: [{type: dependency-met}]
        exitConditions: [{type: output-generated}]
        onFailure: {action: retry, maxRetries: 2}
    - id: review
      name: 质量检查
      kind: review
      dependsOn: [generate]
      gate:
        entryConditions: [{type: dependency-met}]
        exitConditions: [{type: review-passed}]
        onFailure: {action: abort, rollback: true}
  policy:
    strictMode: true
    rollbackOnAbort: true
---
```
