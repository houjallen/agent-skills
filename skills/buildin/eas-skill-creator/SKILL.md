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
- 创建新的EASBot技能
- 构建专业的Agent技能包
- 为Agent设计包含脚本、参考资料和资产的技能包
- 遵循EASBot最佳实践创建技能
- **EaSBot Agent 主动创造技能**

不适用于：
- 临时解决方案的记录
- 针对单一场景的特殊处理

### 技能类型 (Skill Type)

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
- **脚本规范**：请参阅 [script-specification.md](references/script-specification.md) 获取脚本编写规范和最佳实践
- **说服原则**：请参阅 [persuasion-principles.md](references/persuasion-principles.md) 了解如何在复杂技能中应用说服心理学原则
- **翻译规范**：请参阅 [translation-guidelines.md](references/translation-guidelines.md) 了解哪些术语应保持英文原样
- **技术型技能**：请参阅 [technique-type-definition.md](references/technique-type-definition.md) 获取技术型技能的详细定义
- **模式型技能**：请参阅 [pattern-type-definition.md](references/pattern-type-definition.md) 获取模式型技能的详细定义
- **参考型技能**：请参阅 [reference-type-definition.md](references/reference-type-definition.md) 获取参考型技能的详细定义

## 何时使用 (When to Use)

使用此技能当需要：
- 创建新的EASBot技能
- 更新现有技能的结构和内容
- 为Agent设计包含脚本、参考资料和资产的技能包
- 遵循EASBot最佳实践创建技能
- **EaSBot Agent 主动创造技能**

不适用于：
- 临时解决方案的记录
- 针对单一场景的特殊处理

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
**元数据质量：** YAML frontmatter中的`name`、`description`决定了Agent何时使用该技能。总字符数最多1024个字符以内,具体说明技能的作用和使用时机。使用第三人称（例如"该技能应在...时使用"而不是"使用该技能当..."）。

- **name**: 必需字段，使用hyphen-case格式，仅使用字母、数字和连字符（无括号、特殊字符）
- **description**: 必需字段， 第三人称，仅描述何时使用（不是做什么）
  - 以"该技能应在..."开头，专注于触发条件
  - **永远不要总结技能的过程或工作流程**
  - 如果可能，保持在500个字符以内
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
  - **主推 TypeScript**（类型安全、与项目一致、IDE支持更好、支持ESM模块）
  - **推荐使用 tsx 运行 TypeScript 脚本**: `tsx script-file.ts` (无需预编译)
  - **次选 Python**（简单易用、直接运行）
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

仅在技能需求已经清楚时跳过此步骤。

要创建有效的技能，清楚了解技能将如何使用的具体示例。这种理解可以来自直接的用户示例或经用户反馈验证的生成示例。

相关问题：
- "技能应支持哪些功能？"
- "用户说什么会触发此技能？"
- "有哪些使用场景的示例？"

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

### 步骤 3：初始化技能结构 (Initialize Skill Structure)

使用 `tsx scripts/init-skill.ts <技能名> --path <输出目录> --resources scripts,references,assets --examples` 创建基础结构。

### 步骤 4：计划可重用技能内容 (Plan Reusable Content)

根据需求分析，确定需要哪些可重用资源：

| 资源类型 | 适用场景 |
|---|---|
| `scripts/` | 相同代码被重复重写、需要确定性可靠性 |
| `references/` | 需要按需加载的文档（模式、配置、示例） |
| `assets/` | 在输出中使用的文件（模板、图标、字体） |

### 步骤 5：填充模式特定内容 (Fill Mode-Specific Content)

根据确定的模式，填充 SKILL.md 内容：

#### Tool Wrapper 必需内容
- 概述 (Overview)
- 何时使用 (When to Use)
- API 速查表 / 调用示例
- 常见错误表 (Pitfall Table)

#### Generator 必需内容
- 概述 (Overview)
- 何时使用 (When to Use)
- 输出模板（JSON/Markdown/代码）
- 校验规则
- 失败处理

#### Reviewer 必需内容
- 概述 (Overview)
- 何时使用 (When to Use)
- 审查流程（entry → steps → exit）
- `references/checklist.md`：按严重程度分级的检查项

#### Inversion 必需内容
- 概述 (Overview)
- 何时使用 (When to Use)
- 澄清流程（3 阶段）
- frontmatter 中定义 `behavior.gate.phases`（≤5 必答，每题 2~4 选项）

#### Pipeline 必需内容
- 概述 (Overview)
- 何时使用 (When to Use)
- 步骤序列 + Gate 三要素（入口/出口/失败策略）
- frontmatter 中定义 `behavior.sequence.steps`

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

#### init-skill.ts / init_skill.py (技能初始化脚本)
此脚本用于创建新的技能目录结构，包含：
- 技能目录的创建
- SKILL.md 模板文件的生成
- 可选的 scripts、references、assets 目录及示例文件的创建

使用示例：
```bash
tsx scripts/init-skill.ts my-skill --path ./skills --resources scripts,references,assets --examples
```

#### quick-validate.ts / quick_validate.py (技能验证脚本)
此脚本用于验证技能是否符合 EASBot 规范，包含：
- 检查 SKILL.md 文件是否存在
- 验证 YAML frontmatter 格式和内容
- 检查 name 和 description 字段是否符合要求
- 验证命名约定和长度限制

使用示例：
```bash
tsx scripts/quick-validate.ts ./skills/my-skill
```

#### package-skill.ts / package_skill.py (技能打包脚本)
此脚本用于将技能打包成可分发的 .skill.jar 文件，包含：
- 验证技能格式是否正确
- 使用 ZIP 格式创建 .skill.jar 文件
- 将技能目录中的所有文件添加到包中

使用示例：
```bash
tsx scripts/package-skill.ts ./skills/my-skill
```

## 核心原则 (Core Principles)

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