---
name: eas-agent-creation
description: |
  EASBot 技能生命周期管理入口。覆盖技能从需求捕获、模式选择（Tool Wrapper / Generator / Reviewer / Inversion / Pipeline）、
  创建、演化（自我评估 + 计划生成 + 回滚）、到废弃的全链路；也负责管理 Bundle（多模式组合）与 LLM 评审。

  触发短语：创建技能 / 演化技能 / 技能评估 / 技能废弃 / Bundle 管理 / SKILL 评审 / 模式选择 / skill lifecycle。
  使用场景：用户提出"帮我做一个 X 技能"、某技能失败率高需重生、新需求无现成 skill 可用、
  多 skill 协作需编排、scheduler 触发自评估、要求对某 SKILL.md 跑 5 维度评分。

  不适用（**这些场景请勿加载本技能**）：
  - 临时性的单次任务 / 一次性 prompt / 纯业务功能开发（与 skill 生命周期无关）
  - 单个 skill 的内容写作 / 模板填充（请用 eas-skill-creator）
  - 搜索市场中已有 skill（请用 eas-skill-find）
  - 知识类问答 / 编码协助（请用对应工具 wrapper skill）
license: MIT
metadata:
  category: builtin
  version: 1.0.0
  author: EASBot
  compatibility:
    node: '>=22.22.2'
    pnpm: '>=10.0.0'
  tags: [easbot, skill, lifecycle, bundle]
  deliveryChecklist:
    developmentGuide: true # 当用 / 快速参考 / CLI 三种调用风格齐全
    pitfallTable: true # 4 个已知 pitfall 列在 body
    reviewProcess: true # 5 维度 rubric 由 LLM 评分
    deploymentGuide: true # scripts/dist/cli.{mjs,cjs} 已发布；pnpm dlx 直接用
    observability: true # --log-level / --print-logs / --debug 控制日志
    scripts: true # scripts/src/cli.ts standalone CLI（无需 host）
---

# eas-agent-creation (EASBot 技能创建与演化)

## 概述 (Overview)

`eas-agent-creation` 是 EASBot 技能生态系统的生命周期管理入口，覆盖技能从需求捕获、模式选择、创建、演化到废弃的全链路。

## 何时使用 (When to Use)

该技能应在以下场景使用：

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

> 完整"何时不用"清单见 frontmatter `description`（自动加载依据）。
> 简版：临时任务 / 单 skill 内容写作（用 `eas-skill-creator`）/ 搜索市场 skill（用 `eas-skill-find`）/
> 知识类问答 / 纯业务功能开发 — 这些场景请勿加载本技能。

## 快速参考 (Quick Reference)

| Item     | Value                                                            |
| -------- | ---------------------------------------------------------------- |
| 核心模块 | Creator, Evolver, Assessor, Validator                            |
| 模式数量 | 5 种（Tool Wrapper, Generator, Reviewer, Inversion, Pipeline）   |
| 组合策略 | 支持 2~3 种模式组合                                              |
| 关联技能 | `eas-skill-creator`（写单技能） / `eas-skill-find`（搜市场技能） |

## 核心模式 (Core Pattern)

### 技能类型 (Skill Type)

#### 技术（Technique）+ 模式（Pattern）

既有明确步骤可遵循，又涉及决策判断的复合型技能。

### 技能创建流程 (Creation Workflow)

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
   ├─ 写盘到 `{cwd}/.easbot/skills/<name>/SKILL.md`（scope='project'，默认）；scope='global' 时写到 `~/.config/easbot/skills/<name>/SKILL.md`
   └─ Bus.publish(CreationComplete)
        ↓
Skill Ready for Agent
```

### 技能演化流程 (Evolution Workflow)

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

## 五种模式 (Five Skill Modes)

五种模式的完整定义（核心问题 / Skill 形态 / 关键设计 / 示例结构 / 强约束原则）详见 [references/modes.md](references/modes.md)。本节仅保留速查入口与决策树。

### 速查表 (Quick Lookup)

| 模式             | 一句话      | 核心问题                             |
| ---------------- | ----------- | ------------------------------------ |
| **Tool Wrapper** | 补知识      | 模型不知道某个库/工具/API 的最新用法 |
| **Generator**    | 稳输出      | 输出格式不稳定，需要严格 Schema/模板 |
| **Reviewer**     | 按标准审    | 需要按清单逐项核查                   |
| **Inversion**    | 先问再做    | 需求存在歧义/缺关键参数              |
| **Pipeline**     | 每步过 Gate | 流程必须按顺序执行，跳步会导致错误   |

> 完整定义（含 Skill 形态 / 关键设计 / 示例结构 / 强约束原则 / Gate 三要素 / 失败策略）请参阅 [references/modes.md](references/modes.md)。

## 模式选择决策树 (Mode Selection Decision Tree)

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

## 模式组合矩阵 (Mode Composition Matrix)

完整组合矩阵与模式转换矩阵见 [references/modes.md](references/modes.md) §6 与 §7。

> 速查：Pipeline + Reviewer（多阶段审查）/ Pipeline + Inversion（前置澄清部署）/ Generator + Reviewer（自动生成 + 合规）/ Pipeline + Inversion + Reviewer（全链路）/ Tool Wrapper + Inversion（SDK 前置澄清）。

## 交付清单 (Delivery Checklist)

每个 Skill 必须自检以下交付项：

| Item             | Description             |
| ---------------- | ----------------------- |
| developmentGuide | 何时用/不用、典型用法   |
| pitfallTable     | 已知坑 + 反模式         |
| reviewProcess    | 准入准出清单            |
| deploymentGuide  | 安装/卸载/升级命令      |
| observability    | 日志、metrics、调试入口 |
| scripts          | 自动化辅助脚本          |

## 实现 (Implementation)

### 使用 standalone CLI（推荐路径）(Use the Standalone CLI)

`eas-agent-creation` 自带 standalone CLI（[`scripts/src/cli.ts`](scripts/src/cli.ts)），通过 `npx tsx` 直接调用，**不依赖宿主 Agent 的 `creation` 工具**。Agent 可在任意仓库根目录运行该 CLI 完成 6 类操作：`create` / `evolve` / `assess` / `list` / `apply-plan` / `review`。

> 完整 CLI 入口 / 全局选项 / 操作参数 / 创建-演化-评审步骤 / 输出契约 / ProviderOptions 自动推导 / 故障排查 → 见 [`references/cli.md`](references/cli.md)。

#### 快速调用 (Quick Calls)

```bash
# 创建新 skill
npx tsx skills/builtin/eas-agent-creation/scripts/src/cli.ts create \
  --requirement "创建一个帮助审查代码命名的技能" \
  --hints "包含命名规范清单,支持中英文命名"

# 自检
npx tsx skills/builtin/eas-agent-creation/scripts/src/cli.ts assess --windowDays 7

# 演化（试运行）
npx tsx skills/builtin/eas-agent-creation/scripts/src/cli.ts evolve --dryRun

# 应用演化计划
npx tsx skills/builtin/eas-agent-creation/scripts/src/cli.ts apply-plan \
  --planId "<plan-id>" --approvedBy "user@example.com"

# LLM 评审
npx tsx skills/builtin/eas-agent-creation/scripts/src/cli.ts review \
  --skillName <name> --variant reviewer
```

> 详细步骤（创建后用 `eas-skill-creator` 完善、演化的弱点分析、review 的评分维度与 ProviderOptions 自动推导）见 [`references/cli.md`](references/cli.md)。

## 常见错误 (Common Pitfalls)

### Pitfall 1：模式选择错误 (Wrong Mode Selection)

**问题**：将 Generator 误用为 Reviewer
**解决**：记住 Generator 是"稳输出"，Reviewer 是"按清单审"

### Pitfall 2：清单与流程耦合 (Checklist Coupled with Process)

**问题**：将 checklist 内容写在 SKILL.md body
**解决**：checklist 放 references/checklist.md，body 只写流程

### Pitfall 3：缺少 Gate 定义 (Missing Gate Definition)

**问题**：Pipeline 步骤没有完整的 Gate 三要素
**解决**：每个步骤必须定义 entryConditions、exitConditions、onFailure

### Pitfall 4：Inversion 过于开放 (Too Open-ended Inversion)

**问题**：问题选项太多或无选项
**解决**：每题必须 2-4 个互斥选项

## 参考资料 (References)

详细规范请参阅：

- [Skill Spec 规范](references/skill-spec.md) - 完整的 Skill 类型定义
- [Mode 模式详解](references/modes.md) - 五种模式的详细定义
- [Validation 规则](references/validation.md) - Validator 校验规则
- [Evolution 流程](references/evolution.md) - 技能演化流程

> 概念边界（Skill vs Agent vs Tool vs Task）见 `eas-skill-using` §关键概念（按 `Skill` 工具按 name 加载，不依赖物理路径）。

## 示例 (Examples)

### Example 1: Create a Tool Wrapper Skill

**User Request**: "我需要一个技能来帮助我使用最新的 React Server Actions"

**Analysis**:

- 需求：补 React 19 Server Actions 知识
- 模式：Tool Wrapper

**Result**:

```yaml
---
name: react-19-server-actions
description: |
  提供 React 19 Server Actions 的使用指南。处理表单、异步操作和数据提交。

  触发：React 19 / Server Actions / 表单 / async function / 数据变更 / 'use server' / 数据重新验证。
  不适用：客户端组件（请用普通 client component skill）、纯展示页面、React 18 及以下版本。
mode: tool-wrapper
composition: single
metadata:
  category: builtin
  version: 1.0.0
  author: EASBot
  tags: [react, server-actions, tool-wrapper]
deliveryChecklist:
  developmentGuide: true
  pitfallTable: true
  reviewProcess: false
  deploymentGuide: false
  observability: false
  scripts: false
references:
  - ./references/api-cheatsheet.md
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
description: |
  审查代码的命名规范和错误处理。用于 Pre-PR 检查和代码质量保证。

  触发：代码审查 / Pre-PR / lint / 命名规范 / 错误处理 / 命名一致性 / PR review / 代码评审。
  不适用：生成新代码（请用 generator skill）、性能优化审查（用专门 perf skill）。
mode: reviewer
composition: single
metadata:
  category: builtin
  version: 1.0.0
  author: EASBot
  tags: [code-review, reviewer, naming]
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
references:
  - ./references/checklist.md
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
description: |
  自动生成代码文档的多阶段流水线。用于生成 API 文档和代码注释。

  触发：代码文档 / API 文档 / 文档生成 / docstring / 自动文档 / JSDoc / 注释补全 / documentation pipeline。
  不适用：手工写文档（用通用写作 skill）、Markdown 转 PDF（用专门 pdf skill）。
mode: pipeline
composition: single
metadata:
  category: builtin
  version: 1.0.0
  author: EASBot
  tags: [docs, pipeline, automation]
behavior:
  sequence:
    - id: parse
      name: 解析代码
      kind: parse
      gate:
        entryConditions: [{ type: input-exists }]
        exitConditions: [{ type: output-generated }]
        onFailure: { action: abort }
    - id: generate
      name: 生成文档
      kind: generate
      dependsOn: [parse]
      gate:
        entryConditions: [{ type: dependency-met }]
        exitConditions: [{ type: output-generated }]
        onFailure: { action: retry, maxRetries: 2 }
    - id: review
      name: 质量检查
      kind: review
      dependsOn: [generate]
      gate:
        entryConditions: [{ type: dependency-met }]
        exitConditions: [{ type: review-passed }]
        onFailure: { action: abort, rollback: true }
  policy:
    strictMode: true
    rollbackOnAbort: true
references:
  - ./references/gate.md
```
