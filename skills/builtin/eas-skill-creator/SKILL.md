---
name: eas-skill-creator
description: 该技能应用于创建、构建和验证EASBot技能。当Agent需要为其他Agent设计、构建、验证或打包包含脚本、参考资料和资产的技能时使用。
category: builtin
version: 1.0.0
tags: [easbot, skill, creation, development, builder]
---

# eas-skill-creator - EASBot技能创建构建器 (EASBot Skill Creator Builder)

## 概述 (Overview)

eas-skill-creator 是EASBot项目的官方技能创建和构建工具，为Agent提供创建、结构化、验证和打包技能的完整指导。该技能确保所有EASBot技能都遵循一致的结构和最佳实践。

### 关于技能（About Skills）

使用此技能当需要：
- 创建新的 EASBot 技能
- 构建专业的 Agent 技能包
- 为 Agent 设计包含脚本、参考资料和资产的技能包
- 遵循 EASBot 最佳实践创建技能
- EASBot Agent 主动创造技能

不适用于：
- 临时解决方案的记录
- 针对单一场景的特殊处理

### 技能类型 (Skill Type)

> **与五大模式的关系**：技能类型（Technique / Pattern / Reference）与五大模式（Tool Wrapper / Generator / Reviewer / Inversion / Pipeline）正交。**类型决定内容形态（怎么写）**——Technique 写步骤、Pattern 写思维框架、Reference 写静态信息；**模式决定行为结构（怎么触发和执行）**——例如同样是"内容侧"类型，可选 Tool Wrapper（补知识）或 Generator（固定模板）。两类分类独立选择，可任意叠加。

#### 技术（Technique）
有明确步骤可遵循的具体方法

#### 模式（Pattern）
思考问题的方式

#### 参考（Reference）
API文档、语法指南、工具文档

#### 详细定义参考 (Detailed Definitions Reference)
- **Skill Spec 规范**：请参阅 [skill-spec.md](references/skill-spec.md) 获取五大模式的类型定义、字段约束与结构化输出模板
- **技能创建指南**：请参阅 [skill-creation-guide.md](references/skill-creation-guide.md) 获取详细的实践指南和写作规范
- **使用示例**：请参阅 [usage-example.md](references/usage-example.md) 获取五大模式的完整示例
- **工作流程**：请参阅 [workflows.md](references/workflows.md) 获取创建、验证、迭代的工作流程
- **设计决策**：请参阅 [design-decisions.md](references/design-decisions.md) 获取核心设计原则和架构说明
- **需求收集方法论**：请参阅 [requirements-gathering.md](references/requirements-gathering.md) 获取步骤 1 的苏格拉底式六维度、领域分支问句库、轮次策略与退出条件
- **脚本规范**：请参阅 [script-specification.md](references/script-specification.md) 获取脚本编写规范和最佳实践
- **说服原则**：请参阅 [persuasion-principles.md](references/persuasion-principles.md) 了解如何在复杂技能中应用说服心理学原则
- **翻译规范**：请参阅 [translation-guidelines.md](references/translation-guidelines.md) 了解哪些术语应保持英文原样
- **技术型技能**：请参阅 [technique-type-definition.md](references/technique-type-definition.md) 获取技术型技能的详细定义
- **模式型技能**：请参阅 [pattern-type-definition.md](references/pattern-type-definition.md) 获取模式型技能的详细定义
- **参考型技能**：请参阅 [reference-type-definition.md](references/reference-type-definition.md) 获取参考型技能的详细定义

## 何时使用 (When to Use)

使用此技能当需要：
- 创建新的 EASBot 技能
- 更新现有技能的结构和内容
- 为 Agent 设计包含脚本、参考资料和资产的技能包
- 遵循 EASBot 最佳实践创建技能
- EASBot Agent 主动创造技能

不适用于：
- 临时解决方案的记录
- 针对单一场景的特殊处理

> **说明**：本节与上方「关于技能」内容一致，保留以符合 SKILL.md 模板的「何时使用 (When to Use)」章节约定。

## 快速参考 (Quick Reference)

| 项目 | 取值 / 说明 |
| --- | --- |
| 核心职责 | 创建、构建、验证、打包 EASBot 技能 |
| 核心脚本 | `scripts/init-skill.ts`（初始化） / `scripts/quick-validate.ts`（校验） / `scripts/package-skill.ts`（打包） |
| 技能目录模板 | `<skill-name>/` 下含 `SKILL.md` + 可选 `scripts/`、`references/`、`assets/` |
| **脚本调用路径规范** | 默认 `scripts/xxx.ts` 相对路径；模板/跨技能场景用 `<skillPath>/scripts/xxx.ts` 占位符；**禁止** `skills/builtin/.../scripts/...` 硬编码绝对路径（详见 [脚本调用路径规范](#脚本调用路径规范-script-invocation-path-specification)） |
| 五大模式 | Tool Wrapper / Generator / Reviewer / Inversion / Pipeline |
| 三类技能类型 | Technique / Pattern / Reference（与模式正交，可叠加） |
| 必填 frontmatter | `name`（hyphen-case，≤64）/ `description`（第三人称，≤1024） |
| 必填正文节 | 概述 / 何时使用 / 快速参考 |
| 关联技能 | `eas-skill-using`（导航） / `eas-skill-find`（搜市场） / `eas-agent-creation`（生命周期） |
| 概念边界 | Skill vs Agent vs Tool vs Task 见 `eas-skill-using` §关键概念（按 `Skill` 工具按 name 加载） |
| 详细规范 | 详见 [references/skill-spec.md](references/skill-spec.md) / [references/skill-creation-guide.md](references/skill-creation-guide.md) |

## 核心功能 (Core Functions)

### 1. 技能的构成（Anatomy of a Skill）

每个技能由必需的SKILL.md文件和可选的捆绑资源组成：

```
skill-name/
├── SKILL.md (必需)
│   ├── YAML frontmatter元数据 (必需)
│   │   ├── name: (必需)
│   │   ├── description: (必需)
│   │   └── category: (扩展，推荐)
│   └── Markdown主体 (必需)
└── 捆绑资源 (可选)
    ├── scripts/          - 可执行代码 (TypeScript/Python/Bash等)
    ├── references/       - 计划按需加载到上下文中的文档
    └── assets/           - 在输出中使用的文件 (模板、图标、字体等)
```

#### SKILL.md（必需）(SKILL.md (Required))

**SKILL.md 严格遵循以下标准模板结构：**
*此处省略具体模板，因为它是说明性的示例，而非实际内容*

##### YAML前置信息（必需）(YAML Frontmatter (Required))
**元数据质量：** YAML frontmatter 中的 `name`、`description` 决定了 Agent 何时使用该技能。`description` 推荐控制在 500 个字符以内（硬上限 1024 个字符），具体说明技能的作用和使用时机。使用第三人称（例如"该技能应在...时使用"而不是"使用该技能当..."）。

- **name**: 必需字段，使用 hyphen-case 格式，仅使用字母、数字和连字符（无括号、特殊字符）
- **description**: 必需字段， 第三人称，仅描述何时使用（不是做什么）
  - 以"该技能应在..."开头，专注于触发条件
  - **永远不要总结技能的过程或工作流程**
  - **推荐 ≤ 500 字符，硬上限 1024 字符**
- **category**: 扩展字段（推荐），用于分类管理，便于技能组织和发现

##### Markdown主体（必需）(Markdown Body (Required))
使用技能的说明和指导，仅在技能触发后加载。
**编辑Markdown主体内容要求说明：**
- 使用中文进行内容撰写，一些专有名词保持英文，比如 Agent 等保持英文（详见 [translation-guidelines.md](references/translation-guidelines.md)）
- 标题使用双语标题，标题除了中文标题，后面跟用括号包起来的英文标题

###### 必需部分 (Required Sections)

1. **概述 (Overview)**: 简明扼要地说明技能用途
2. **何时使用 (When to Use)**: 具体的触发条件和场景
3. **快速参考 (Quick Reference)**: 关键要点的简要列表

###### 可选部分 (Optional Sections)

1. **核心模式 (Core Pattern)**: 适用于技术或模式类技能
2. **实现 (Implementation)**: 代码示例和具体实现
3. **常见错误 (Common Mistakes)**: 常见问题及解决方案
4. **现实世界影响 (Real-World Impact)**: 实际应用效果

#### 捆绑资源（可选）(Bundled Resources (Optional))

##### 脚本 (Scripts)

用于需要确定性可靠性或重复编写的任务的可执行代码（TypeScript、JavaScript、Python、Bash等）。
- 目录: `scripts/`
- **包含时机：** 当相同代码被重复重写或需要确定性可靠性时
- **示例：** `scripts/rotate_pdf.ts` 用于PDF旋转任务
- **技术栈推荐：**
  - **统一 TypeScript**（类型安全、IDE 支持好、支持 ESM 模块、跨平台）
  - **推荐使用 tsx 运行 TypeScript 脚本**: `tsx script-file.ts` (无需预编译)
  - **不推荐 Python**：本技能不维护 Python 实现，避免 TS/Python 双版本漂移
- **现代脚本标准：** 详细规范请参阅 [script-specification.md](references/script-specification.md)
  - 使用 `.ts` 后缀的 TypeScript 文件
  - 使用 ESM 模块语法 (import/export)
  - Shebang 行使用 `#!/usr/bin/env node` 以支持直接执行
- **优点：** 令牌高效、确定性强、可能无需加载到上下文即可执行
- **注意：** 脚本仍可能需要被Agent读取以进行修补或环境特定调整
- **注释要求：** 编写脚本文件时，使用中文进行完整的代码注释符合Jsdoc的规范，一些专有名词保持英文，比如 Agent 等保持英文，其中console、log等输出保持英文（详见 [translation-guidelines.md](references/translation-guidelines.md)）

##### 参考资料 (References)

计划按需加载到上下文中的文档和参考资料，以指导Agent的过程和思维。

- 目录: `references/`
- **包含时机：** 用于agent工作时应参考的文档
- **示例：** `references/finance.md` 用于金融模式，`references/mnda.md` 用于公司NDA模板，`references/policies.md` 用于公司政策，`references/api_docs.md` 用于API规范
- **用例：** 数据库模式、API文档、领域知识、公司政策、详细的流程指南
- **优点：** 保持SKILL.md精简，仅在agent确定需要时加载
- **最佳实践：** 如果文件很大（>10k字），在SKILL.md中包含grep搜索模式
- **避免重复：** 信息应存在于SKILL.md或参考文件中，不能两者都有。对于详细信息，优先选择参考文件而不是SKILL.md；这使SKILL.md保持精简，同时使信息可发现而不占用上下文窗口。只在SKILL.md中保留基本程序指令和工作流指导；将详细参考材料、模式和示例移到参考文件中。
- **CRITICAL: 路径引用规范**：引用其他文件时，必须使用相对于 skill 目录的相对路径，绝对不能使用 `@` 链接格式，而且必须使用标准 Markdown 链接格式。

  **正确示例：**
  ```
  1. 详细规范请参阅 [technique-type-definition.md](references/technique-type-definition.md)
  ```

  **错误示例（绝对禁止）：**
  <!-- 以下代码块为反模式教学展示，出现的 `@` 字面量属规范禁止写法，非真实违规。自动化扫描工具应忽略此块。 -->
  ```
  1. 详细规范请参阅 @references/technique-type-definition.md
  2. 详细规范请参阅 [technique-type-definition.md](@references/technique-type-definition.md)
  ```

##### 资产 (Assets)

不打算加载到上下文中的文件，而在Agent生成的输出中使用。

- 目录: `assets/`
- **包含时机：** 当技能需要在最终输出中使用的文件时
- **示例：** `assets/logo.png` 用于品牌资产，`assets/slides.pptx` 用于PowerPoint模板，`assets/frontend-template/` 用于HTML/React样板，`assets/font.ttf` 用于排版
- **用例：** 模板、图像、图标、样板代码、字体、复制或修改的示例文档
- **优点：** 将输出资源与文档分离，使Agent能够在不将文件加载到上下文中的情况下使用它们

##### 不要在技能中包含什么（What to Not Include in a Skill）

技能应仅包含直接支持其功能的基本文件。不要创建多余的文档或辅助文件，包括：

- README.md
- INSTALLATION_GUIDE.md
- QUICK_REFERENCE.md
- CHANGELOG.md
- etc.

技能应仅包含AI Agent完成手头工作所需的信息。它不应包含有关创建过程的辅助上下文、设置和测试程序、面向用户的文档等。创建额外的文档文件只会增加混乱和困惑。

## 实现 (Implementation)

### 技能创建流程 (Skill Creation Workflow)

创建技能遵循以下步骤：

```
了解需求 → 确定模式 → 初始化结构 → 填充内容 → 验证 → 打包 → 迭代
```

### 步骤 1：通过具体示例了解需求 (Understand Requirements)

> **[MUST] 本步骤 MUST 收集足够的需求信息后 MUST 进入步骤 2；MUST 不可跳过。**
> 仅当用户提供完整 PRD/Spec 或引用既有规范时，可压缩但不可整段省略。
> 完整方法论、苏格拉底式六维度、领域分支问句库、轮次策略、退出条件与 3 轮提问示范见 [requirements-gathering.md](references/requirements-gathering.md)。

#### 1.1 核心方法论：苏格拉底式六维度

| 维度 | 目标 | 必出产物 |
|---|---|---|
| **澄清问题** | 让"技能做什么"无歧义 | 领域识别 + 核心场景 |
| **探究假设** | 暴露隐性约束 | 必要性论证 + 硬约束清单 |
| **挖掘证据** | 得到可验证案例 | 5+ 触发短语 + 3+ 使用场景 |
| **视角探索** | 发现边界用例 | 不应触发的场景清单 |
| **后果分析** | 评估模式取舍 | 失败兜底策略 + 模式候选 |
| **反思完整性** | 检查遗漏 | 跨领域相关方清单 |

#### 1.2 强制规范

- **[MUST] 使用结构化提问工具**：MUST 调用宿主 Agent 提供的「结构化提问工具」（structured-question tool）一次性抛出多个选项让用户选择；MUST NOT 仅靠自由文本对话提开放问题。
  - 不同 Agent 框架下该工具的名称不同，常见别名：`AskUserQuestion`（Trae/Cursor/Claude Code）、`AskUserChoice`（OpenAI Agents）、`request_user_input`（某些自研框架）等。Agent MUST 按本机环境识别其别名后调用，调用参数 SHOULD 包含：问题文本、2-4 个互斥选项（其中 1 个 SHOULD 标记「（推荐）」）、是否允许多选。
  - 若宿主环境未提供此类工具，退化为"分段对话 + 主动声明每段答案"，但仍 MUST 遵守下方选项设计与轮次策略。
- **[MUST] 选项设计**：每题 MUST 提供 2-4 个互斥选项；SHOULD 在 label 后加「（推荐）」标识推荐项；MUST NOT 出现「以上都对 / 以上都不对」类安全选项。
- **[SHOULD] 领域分支**：先识别领域（code/design/writing/business/data/hybrid），按需加载对应问句模板。
- **[MUST] 轮次策略**：简单技能 MUST ≥1 轮、中等技能 MUST ≥2 轮、复杂技能 MUST ≥3 轮；每轮 3-4 题。
- **[MUST] 最后一题预留自定义输入**：每轮 MUST 预留一题让用户自定义补充（如「其他需求 / 其他场景」），捕获遗漏。

#### 1.3 退出条件（满足全部 4 项 MUST 才能进入步骤 2）

- [ ] **[MUST] 场景明确**：能用 3 个具体使用场景描述技能
- [ ] **[MUST] 触发短语**：已列出 5+ 触发短语
- [ ] **[MUST] 边界用例**：已识别至少 1 个不应触发的场景
- [ ] **[MUST] 模式候选**：步骤 2 决策树已有至少 1 个有效解

#### 1.4 跳过与暂停（MUST 区分「压缩」与「整段跳过」）

- **[MUST-NOT] 整段跳过**：除下列条件外，本步骤 MUST NOT 整段省略；仅可在保留方法论骨架的前提下**压缩轮次**（如简单技能从 1 轮压到 1 轮内 3 题一次性抛出）。
- **[MAY] 可压缩**：用户提供完整 PRD/Spec（引用文件链接）、或说"照这个文档做"、或为既有技能的小幅修改（引用原技能名 + 变更点）。
- **[MUST] 应暂停**：用户回答"我再想想 / 我也不知道 / 等一下"——Agent MUST 给出 2-3 个默认假设让用户挑选，或直接退出等待下次触发；MUST NOT 在需求不清时强行推进。

#### 步骤 1.5：产出需求决策文档 (Produce Requirement Decision Doc)

**[MUST] 步骤 1 完成后、步骤 2 启动前 MUST 产出需求决策文档**，避免关键设计判断随上下文丢失。

| 场景 | 沉淀路径 | 使用模板 |
|------|----------|----------|
| 单技能内的设计决策（推荐） | `<cwd>/skills/{skill-name}/0001-initial-design.md` | [`references/templates/00NN-requirement.md`](references/templates/00NN-requirement.md) |
| 跨技能架构决策 | `<cwd>/docs/decisions/00NN-{topic}.md` | 宿主项目级 ADR 模板 |
| 迭代小决策 / bugfix | `<cwd>/docs/decisions/00NN-{topic}.md` | 宿主项目级 ADR 模板 |

**路径变量**：
- `<cwd>`：宿主项目根目录（Agent 调用本技能时的当前工作目录）
- `docs/decisions/` 是 ADR（Architecture Decision Record）行业标准目录约定（Michael Nygard 格式）；宿主项目若有自有决策目录，Agent 应优先遵循宿主项目规范

**模板使用规范**：
- 复制 [`references/templates/00NN-requirement.md`](references/templates/00NN-requirement.md) 到落地路径
- 填写 frontmatter + 9 章节（背景/需求画像/关键判断/备选方案/决策/依据/具体动作/影响/回溯链接）
- 「需求画像」章节 MUST 100% 复制 `requirement_profile` 内容
- **反向引用约定（按宿主项目决定）**：是否在 SKILL.md 末尾追加「决策记录」节反向引用本决策文档，由宿主项目规范决定；通用建议是依赖宿主项目级 ADR 索引（`docs/decisions/` 等）统一管理决策文档，**避免**在每个 SKILL.md 内重复反向引用

**模板与规范文件**（自包含于本技能目录）：
- 使用指南：[`references/templates/requirement-decision-guide.md`](references/requirement-decision-guide.md)
- 决策模板：[`references/templates/00NN-requirement.md`](references/templates/00NN-requirement.md)

**反模式**：
- ❌ 跳过决策文档直接进入步骤 2
- ❌ 决策文档"需求画像"与 `requirement_profile` 不一致
- ❌ 跨技能决策放本目录模板路径
- ❌ 决策文档不写备选方案（至少 2 个）
- ❌ 决策文档无"具体动作"清单

### 步骤 2：确定技能模式 (Determine Skill Mode)

根据用户需求判断技能属于哪种模式。参考 [skill-spec.md](references/skill-spec.md) 的决策树：

| 模式 | 判断关键词 | 核心问题 |
|---|---|---|
| **Tool Wrapper** | 「怎么用」「API」「库」「版本」 | 模型不知道某个库的用法 |
| **Generator** | 「生成」「模板」「固定格式」「报表」 | 输出格式不稳定 |
| **Reviewer** | 「审查」「检查」「清单」「合规」 | 需要按清单逐项核查 |
| **Inversion** | 「先问」「澄清」「确认」「前置」 | 需求存在歧义 |
| **Pipeline** | 「按顺序」「流程」「步骤」「不能跳」 | 必须按顺序执行 |

**组合模式**：当需求复杂时，可组合 2~3 种模式（如 Pipeline + Reviewer）。

> **完整规范**：五大模式详细定义、字段约束与组合模式规则见 [skill-spec.md](references/skill-spec.md)。SKILL.md 步骤 2 仅保留速查入口。

### 步骤 3：初始化技能结构 (Initialize Skill Structure)

使用 `tsx scripts/init-skill.ts <skill-name> --path <output-dir> --resources scripts,references,assets --examples` 创建基础结构。

### 步骤 4：计划可重用技能内容 (Plan Reusable Content)

根据需求分析，确定需要哪些可重用资源：

| 资源类型 | 适用场景 |
|---|---|
| `scripts/` | 相同代码被重复重写、需要确定性可靠性 |
| `references/` | 需要按需加载的文档（模式、配置、示例） |
| `assets/` | 在输出中使用的文件（模板、图标、字体） |

### 步骤 5：填充模式特定内容 (Fill Mode-Specific Content)

每种模式的必需内容、关键字段、frontmatter 结构与示例见 [references/skill-spec.md](references/skill-spec.md) §4（含 Tool Wrapper / Generator / Reviewer / Inversion / Pipeline 五种模式的字段定义）。

> 速查：
> - **Tool Wrapper**：概述 + 何时使用 + API 速查表 + 常见错误表
> - **Generator**：概述 + 何时使用 + 输出模板 + 校验规则 + 失败处理
> - **Reviewer**：概述 + 何时使用 + 审查流程（entry → steps → exit）+ `references/checklist.md`（按严重程度分级）
> - **Inversion**：概述 + 何时使用 + 澄清流程（3 阶段）+ frontmatter 中定义 `behavior.gate.phases`（≤5 必答，每题 2~4 选项）
> - **Pipeline**：概述 + 何时使用 + 步骤序列 + Gate 三要素（入口/出口/失败策略）+ frontmatter 中定义 `behavior.sequence.steps`
>
> 完整字段定义、frontmatter 结构、组合模式与交付清单见 [references/skill-spec.md](references/skill-spec.md)。

### 步骤 6：验证与打包 (Validate and Package)

```bash
# 验证技能结构
tsx scripts/quick-validate.ts ./skills/<skill-name>

# 打包技能
tsx scripts/package-skill.ts ./skills/<skill-name>
```

### 步骤 7：根据实际使用迭代 (Iterate Based on Usage)

测试技能后，用户可能会要求改进。迭代工作流程：

1. 在实际任务中使用技能
2. 注意困难或低效之处
3. 确定如何更新 SKILL.md 或资源
4. 实施更改并再次测试

### 核心脚本实现 (Core Scripts Implementation)

> **统一 TypeScript**：本技能仅维护 TypeScript 实现（`.ts`），不提供 Python 平行版本。这样可以避免双语言实现漂移、减少维护负担、保持行为一致。

#### 零外部依赖原则 (Zero External Dependencies)

**核心脚本（`scripts/init-skill.ts`、`scripts/quick-validate.ts`、`scripts/package-skill.ts`）仅依赖 Node.js 内置模块**：
- `fs` / `fs/promises` — 文件系统操作
- `path` — 路径处理
- `url` — URL 解析（用于 ESM `import.meta.url`）
- `node:fs/promises`、`node:path` 等 — Node 内置命名空间

> **关于 `package-skill.ts` 中的 `jszip`**：`jszip` 是当前实现的依赖项，未来计划替换为 Node 内置的 `node:zlib` + `node:stream` 实现（ZIP 格式可纯 Node 实现）。在替换完成前，新创建技能的 `scripts/` 不应再引入 `jszip` 等第三方依赖。

新技能创建脚本时，**SHOULD 优先使用 Node 内置模块**，仅在确实无法满足需求时引入第三方依赖，且 MUST 在 SKILL.md 的「实现」章节明确标注依赖原因。

#### init-skill.ts (技能初始化脚本)
此脚本用于创建新的技能目录结构，包含：
- 技能目录的创建
- SKILL.md 模板文件的生成
- 可选的 scripts、references、assets 目录及示例文件的创建

使用示例：
```bash
tsx scripts/init-skill.ts my-skill --path ./skills --resources scripts,references,assets --examples
```

#### quick-validate.ts (技能验证脚本)
此脚本用于验证技能是否符合 EASBot 规范，包含：
- 检查 SKILL.md 文件是否存在
- 验证 YAML frontmatter 格式和内容
- 检查 name 和 description 字段是否符合要求
- 验证命名约定和长度限制

使用示例：
```bash
tsx scripts/quick-validate.ts ./skills/my-skill
```

#### package-skill.ts (技能打包脚本)
此脚本用于将技能打包成可分发的 `.skill` 文件（ZIP 格式），包含：
- 验证技能格式是否正确
- 使用 ZIP 格式创建 `.skill` 文件
- 将技能目录中的所有文件添加到包中

使用示例：
```bash
tsx scripts/package-skill.ts ./skills/my-skill
```

## 核心原则 (Core Principles)

### 脚本调用路径规范 (Script Invocation Path Specification)

**MUST: 技能内部调用脚本时，必须遵循以下两种写法之一，禁止硬编码绝对路径。**

#### 规范 1：基于技能作用域的相对路径（推荐）

技能被加载后，Agent 的当前上下文就是技能目录。**默认使用 `scripts/xxx.ts` 相对路径**：

```bash
tsx scripts/init-skill.ts my-skill --path ./skills --resources scripts,references,assets --examples
tsx scripts/quick-validate.ts ./skills/my-skill
```

**适用场景**：技能内部自带的脚本（self-contained）。

#### 规范 2：技能路径占位符（用于模板/跨技能引用）

当需要在模板、跨技能文档或外部说明中描述"调用哪个技能的脚本"时，使用 `<skillPath>/scripts/xxx.ts` 占位符：

```bash
tsx <skillPath>/scripts/init-skill.ts my-skill --path ./skills --resources scripts,references,assets --examples
```

**适用场景**：模板文件（如 `00NN-requirement.md`）、跨技能说明、用户文档。

> **`<skillPath>` 解析规则**：
> - builtin 技能：`{workspace}/skills/builtin/{skill-name}/`
> - 用户技能：`{workspace}/skills/{skill-name}/`
> - 全局技能：`~/.local/share/easbot/skills/{skill-name}/`
> - Agent 应根据技能的实际安装位置替换 `<skillPath>`

#### 反模式（绝对禁止）

<!-- 以下代码块为脚本路径反模式教学展示，出现的 `skills/builtin/...`、`eas-skill-creator/...`、`@skills/...` 字面量均属规范禁止写法，非真实违规。自动化扫描工具应忽略此块。 -->
```bash
# ❌ 错误：硬编码绝对路径
tsx skills/builtin/eas-skill-creator/scripts/init-skill.ts my-skill

# ❌ 错误：使用了具体技能名作为占位符
tsx eas-skill-creator/scripts/init-skill.ts my-skill

# ❌ 错误：使用 @ 引用格式
tsx @skills/builtin/eas-skill-creator/scripts/init-skill.ts
```

#### 脚本路径错误的常见后果

- **作用域错乱**：在错误的目录运行脚本，配置文件写到错误位置
- **跨环境失败**：硬编码路径在全局/项目级不同安装位置下失败
- **可移植性差**：技能复制到其他位置后路径全部失效

### 简洁性是关键 (Conciseness is Key)
上下文窗口是共享资源，所有内容都与系统提示、对话历史、其他技能元数据和用户请求共享。

**默认假设：Agent已具备足够智能。** 只添加Agent尚未拥有的上下文。质疑每条信息："Agent真的需要这个解释吗？"和"这段文字是否证明其token成本是合理的？"

优先使用简洁示例而非冗长解释。

### 设置适当自由度 (Setting Appropriate Degrees of Freedom)
将具体程度与任务脆弱性和可变性相匹配：

- **高自由度 (基于文本的指令)**: 当多种方法都有效、决策取决于上下文或启发式方法指导时使用。
- **中等自由度 (带参数的伪代码或脚本)**: 当存在首选模式、某些变化可接受或配置影响行为时使用。
- **低自由度 (特定脚本，少量参数)**: 当操作脆弱且容易出错、一致性至关重要或必须遵循特定序列时使用。

想象将为Agent探索一条路径：有悬崖的窄桥需要特定护栏（低自由度），而开阔地允许许多路线（高自由度）

### 渐进式披露设计原则 (Progressive Disclosure Design Principle)

技能使用三级加载系统高效管理上下文：

1. **元数据（name + description）** - 始终在上下文中（约不超过1024个字符）
2. **SKILL.md Markdown主体** - 当技能触发时（<5k字）
3. **捆绑资源** - Agent根据需要按需加载（无限制，因为脚本可以在不读入上下文窗口的情况下执行）

#### 渐进式披露模式（Progressive Disclosure Patterns）

将SKILL.md主体保持在基本要素内且少于500行，以最大限度地减少上下文膨胀。接近此限制时将内容拆分为单独文件。将内容拆分到其他文件时，从SKILL.md引用它们并清楚描述何时阅读它们非常重要，以确保技能Agent知道它们的存在及其使用时机。

- 核心信息在SKILL.md中
- 详细信息在单独文件中
- 通过链接按需访问

**关键原则：** 当技能支持多个变体、框架或选项时，仅在SKILL.md中保留核心工作流程和选择指导。将特定变体的详细信息（模式、示例、配置）移动到单独的参考文件中。

**模式1：带参考的高级指南**

```markdown
# PDF处理

## 快速开始 (Quick Start)

使用pdfplumber提取文本：
[代码示例]

## 高级功能 (Advanced Features)

- **表单填写**: 请参阅[FORMS.md](reference/FORMS.md)获取完整指南
- **API参考**: 请参阅[REFERENCE.md](reference/REFERENCE.md)获取所有方法
- **示例**: 请参阅[EXAMPLES.md](reference/EXAMPLES.md)获取常见模式
```

Agent仅在需要时加载FORMS.md、REFERENCE.md或EXAMPLES.md。

**模式2：领域特定组织**

对于具有多个领域的技能，按领域组织内容以避免加载不相关的上下文：

```
bigquery-skill/
├── SKILL.md (概述和导航)
└── reference/
    ├── finance.md (收入、计费指标)
    ├── sales.md (机会、管道)
    ├── product.md (API使用、功能)
    └── marketing.md (活动、归因)
```

当用户询问销售指标时，Agent仅读取sales.md。

同样，对于支持多个框架或变体的技能，按变体组织：

```
cloud-deploy/
├── SKILL.md (工作流程 + 提供商选择)
└── references/
    ├── aws.md (AWS部署模式)
    ├── gcp.md (GCP部署模式)
    └── azure.md (Azure部署模式)
```

当用户选择AWS时，Agent仅读取aws.md。

**模式3：条件细节**

显示基本内容，链接到高级内容：

```markdown
# DOCX处理

## 创建文档 (Create Document)

对新文档使用docx-js。请参阅[DOCX-JS.md](reference/DOCX-JS.md)。

## 编辑文档 (Edit Document)

对于简单编辑，直接修改XML。

**对于跟踪更改**: 请参阅[REDLINING.md](reference/REDLINING.md)
**对于OOXML详细信息**: 请参阅[OOXML.md](reference/OOXML.md)
```

Agent仅在用户需要这些功能时读取REDLINING.md或OOXML.md。

**重要指南：**

- **避免深度嵌套引用** - 保持引用从SKILL.md一层深。所有参考文件应直接从SKILL.md链接。
- **结构化较长的参考文件** - 对于超过100行的文件，在顶部包含目录，以便Agent在预览时可以看到完整范围。

### 说服原则应用 (Persuasion Principles Application)

在创建需要确保被遵循的复杂技能时，考虑参考[persuasion-principles.md](references/persuasion-principles.md)中介绍的心理学原则。这些原则在以下场景中特别有用：

- **纪律强化技能**：当需要确保Agent在压力下依然遵循特定实践时
- **质量保证流程**：当需要确保关键验证步骤不被跳过时
- **复杂多步骤工作流程**：当需要确保所有步骤都被正确执行时

这些原则基于对LLM行为的研究，可以帮助设计更有效的技能，确保它们在实际使用中被正确遵循。

## 技能创建规范 (Skill Creation Guidelines)

### 技能命名 (Skill Naming)

- 仅使用小写字母、数字和连字符；将用户提供标题标准化为连字符形式（例如，"Plan Mode" -> `plan-mode`）
- 名称控制在 64 字符以内
- 优先使用描述动作的简短动词引导短语
- 技能文件夹名称应与技能名称完全相同

### 常见问题 (Frequently Asked Questions)

**Q: 何时应该创建新技能而不是扩展现有技能？**
A: 当功能跨越多个领域或功能集变得过大时，考虑创建新技能。

**Q: 如何确定技能的自由度级别？**
A: 根据任务的脆弱性和变化性来决定：稳定流程使用低自由度，灵活任务使用高自由度。

### 常见错误 (Common Mistakes)

- **错误**: 在 description 中总结技能工作流程
- **正确**: 仅描述触发条件，不描述过程

- **错误**: SKILL.md 超过 500 行
- **正确**: 将详细信息移到单独参考文件

- **错误**: 包含不必要的辅助文档（README、CHANGELOG 等）
- **正确**: 仅包含 Agent 完成工作所需信息

- **错误**: 在 description 中使用第一人称
- **正确**: 始终使用第三人称（如"该技能应在...时使用"）

- **错误**: 使用 `@` 链接格式引用文件
- **正确**: 使用标准 Markdown 链接 `[xxx.md](references/xxx.md)`， 必须使用相对于 skill 目录的相对路径，绝对不能使用 `@` 前缀