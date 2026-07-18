---
name: eas-skill-using
description: 该技能应在 Agent 需要了解 EASBot 技能生态系统的能力清单、使用指引或场景匹配时使用，作为 6 个 EASBot builtin 技能（`eas-skill-find` / `eas-skill-creator` / `eas-agent-creation` / `eas-agent-evolution` / `eas-prompt-creator` / `eas-planning-writer`）的中央导航和上下文提供者。当 Agent 不确定该用哪个技能时，本技能指引到正确的技能并给出典型场景下的推荐组合。
category: builtin
version: 1.2.0
tags: [easbot, guidance, navigation, ecosystem, overview, entry-point, builtin]
---

# eas-skill-using - EASBot 技能生态导航 (EASBot Skill Ecosystem Navigator)

## 概述 (Overview)

`eas-skill-using` 是 EASBot 技能生态系统的**中央导航入口**。它本身不执行任何具体任务，而是：

- 索引当前 EASBot builtin 技能的全部能力
- 提供"我应该用哪个技能"的决策辅助
- 给出常见场景下的**技能组合**推荐
- 作为加载其他技能之前的**上下文提供者**

当 Agent 不确定该用哪个技能、或用户问"你能做 X 吗 / 有没有做 X 的技能"时，先加载本技能拿到导航，再按指引调用具体技能。

## 何时使用 (When to Use)

该技能应在以下情况使用：

- Agent 不确定该加载哪个技能 → 查本技能的能力索引
- 用户问"我装了哪些技能 / EASBot 能做什么" → 展示能力清单
- 需要组合多个技能完成复杂任务 → 查场景 → 技能映射表
- 用户初次接触 EASBot，希望了解技能生态全景 → 作为"入门导航"
- 作为**其他技能的前置**技能，获取上下文信息后再决定是否进一步加载具体技能

不适用场景：

- 用户已经指定了具体技能名（如 `eas-skill-find`） → 直接调用
- 用户在做具体业务任务（写代码 / 改文档 / 调 API） → 加载对应的领域技能

## 快速参考 (Quick Reference)

- **能力索引**：列出当前所有 builtin 技能及其触发场景
- **场景映射**：典型任务 → 推荐技能组合
- **决策辅助**："我应该用 X 还是 Y" 的判断流程
- **上下文提供**：作为其他技能的前置，避免重复加载

## 如何加载本技能 (How to Load This Skill)

> 通过 `Skill` 命名空间加载（`packages/agent/src/skill/skill.ts`），**不**直接 Read SKILL.md 路径。

```ts
// 在 Agent 上下文中
tool.execute({ name: 'eas-skill-using' })
```

加载后，Agent 会收到一个 `<skill_content name="eas-skill-using">` 块，包含：

- 完整 SKILL.md 主体（本文）
- `<skill_files>` 列表（最多 10 个，供按需 `Read` 后续资源）
- Base directory 路径（用于解析 `references/` / `scripts/` 相对路径）

**不适用**直接 `Read` 技能文件路径的原因：

- 技能可能位于多个目录（`~/.agents/skills/`、`.easbot/skills/`、`.agents/skills/`、配置 `config.skills.paths`、远程 `config.skills.urls`）
- `Skill` 命名空间以 `name` 索引，与物理位置解耦
- Agent 用 `name` 查找，避免因路径变动失败

详见 `spec/task-management.md` 末尾"引用方式说明"节。

## 当前 builtin 技能能力索引 (Capability Index)

按"使用频率 × 通用度"排序。每个条目说明**何时触发 + 做什么 + 不做什么**。

### 1. eas-skill-find —— 技能发现与搜索

- **何时用**：Agent / 用户需要"找有没有做 X 的技能"，或想了解 EASBot 生态里有什么可用技能
- **做什么**：教 Agent 用 `easbot skills find` 在 skills.sh 市场搜索、过滤、验证候选技能，给出可操作的安装命令
- **不做什么**：不教如何创建新技能、不教如何与已装技能协作
- **入口命令**：`easbot skills find [query] [--owner <owner>]`

### 2. eas-skill-creator —— 技能创建与构建

- **何时用**：Agent 需要为某个领域设计、创建、构建一个新的 EASBot 技能（含 SKILL.md + scripts/ + references/ + assets/）
- **做什么**：教技能结构规范、5 大模式（Tool Wrapper / Generator / Reviewer / Inversion / Pipeline）、bundled resources 原则、init / validate / package 工作流
- **不做什么**：不教"何时创建 vs 复用现有技能"（那是 `eas-skill-find` 的事）；不教具体领域内容
- **核心脚本**：`scripts/init-skill.ts`、`scripts/quick-validate.ts`、`scripts/package-skill.ts`

### 3. eas-agent-creation —— 技能生命周期管理

- **何时用**：Agent 需要按应用场景**创建 + 演化 + 维护**技能集合，或将多个技能组合成 Bundle
- **做什么**：教技能完整生命周期（创建 → 演化 → 组合 → 废弃）、诊断技能失败原因并提出改进建议、管理 Bundle
- **不做什么**：不教单个技能怎么写（那是 `eas-skill-creator`）；不教技能搜索（那是 `eas-skill-find`）
- **适合场景**：维护一个领域的多技能集合，而不是写单个技能

### 4. eas-agent-evolution —— Agent 自我初始化与持续进化

- **何时用**：Agent 第一次启动需要建立身份 / 工作目录 / `protocol.json`；或者 Agent 需要根据历史经验持续完善自己
- **做什么**：引导式信息收集 → 自动化生成 `protocol.json` / SOUL / IDENTITY 等配置文件 → 备份恢复机制
- **关键约束**：**禁止手动修改**本技能涉及的任何模板文件；所有改动必须走本技能自身的引导流程
- **适合场景**：Agent bootstrap、配置变更、跨会话状态恢复

### 5. eas-prompt-creator —— 提示词创建与规范化

- **何时用**：Agent 需要为 EASBot 系统创建、规范化或审核提示词（Agent / Tool / Task / Command / Mode / Session / Feature / Context 八大类型）
- **做什么**：提供结构化信息收集 + 规范化模板 + 质量控制流程，确保生成的提示词遵循 EASBot 设计规范
- **不做什么**：不教 Skill 怎么写（那是 `eas-skill-creator`）；不教具体业务提示词内容
- **关键约束**：**生成的所有提示词内容必须使用英文**

### 6. eas-planning-writer —— 基于文件的规划（项目级长任务）

- **何时用**：Agent 启动多步骤、跨 session、需要持久化进度的复杂任务（重构项目、模块开发、跨 session 调研、长任务执行）
- **做什么**：实现 Manus 风格"基于文件的规划"——把 `task_plan.md` / `findings.md` / `progress.md` 三件套落到 `.easbot/knowledge/tasks/{task-name}/` 下，作为 Agent 跨工具调用、跨 session 的外部记忆
- **不做什么**：不替代 `task` 工具（一次性 subagent）、不替代 `scheduler.*`（定时任务）、不替代 `todo` 工具（Agent 内部 todo）；详见 `spec/task-management.md` 第 3 节
- **核心脚本**：
  - `init-planning-session.ts` — 初始化三件套
  - `check-complete.ts` — 检查阶段完成度
  - `session-catchup.ts` — Session 恢复
  - `test_planning_writer.ts` — 健康度自检
- **遵循规范**：`spec/task-management.md` 第 3 节（项目级长任务） + 决策 0034（文档三层架构）
- **触发后必读**：`references/easbot-alignment.md`（与四类任务体系的对齐说明）

## 使用场景与技能匹配 (Use Cases and Skill Matching)

下表把典型任务映射到"先加载哪个 / 还需要哪个"。

### 找现成技能（Search First）

| 需求 | 第一步 | 第二步 |
|---|---|---|
| 用户问"有没有做 X 的技能" | `eas-skill-using`（先看能力索引） | `eas-skill-find`（如果索引里没有） |
| 排查问题时发现需要某个领域技能 | `eas-skill-using`（查能力索引） | 直接加载对应技能 |
| 用户想了解生态全景 | `eas-skill-using` | — |

### 创建新技能（Create）

| 需求 | 推荐路径 |
|---|---|
| 设计一个全新技能 | `eas-skill-creator`（写单个技能）→ `eas-agent-creation`（管生命周期） |
| 把多个技能打包成 Bundle | `eas-agent-creation` |
| Agent 第一次启动，需要写技能引导 | `eas-skill-using`（先看生态）→ `eas-skill-creator`（写技能） |

### 配置 / 维护 Agent（Maintain）

| 需求 | 推荐路径 |
|---|---|
| Agent 第一次启动初始化 | `eas-agent-evolution` |
| 修改 Agent 身份 / 配置 / 模板 | `eas-agent-evolution`（禁止手改） |
| 排查技能失败 / 改进描述 | `eas-agent-creation`（生命周期视角）→ `eas-skill-creator`（单技能编辑） |

### 提示词工程（Prompt Engineering）

| 需求 | 推荐路径 |
|---|---|
| 创建新的 Agent / Tool / Task 提示词 | `eas-prompt-creator` |
| 审核现有提示词质量 | `eas-prompt-creator` |
| 把提示词规范成 EASBot 标准格式 | `eas-prompt-creator` |

### 综合场景（Combine）

- **新 Agent 上线**：先用 `eas-agent-evolution` 初始化身份 → 用 `eas-prompt-creator` 写系统提示词 → 用 `eas-skill-using` 选 builtin 技能集合 → 用 `eas-skill-creator` 写业务专属技能 → 用 `eas-skill-find` 按需补充市场技能
- **现有 Agent 进化**：用 `eas-agent-evolution` 增量更新配置 → 用 `eas-agent-creation` 评估技能表现 → 用 `eas-skill-creator` 改写质量差的技能
- **研究新能力方向**：用 `eas-skill-using` 看生态全景 → 用 `eas-skill-find` 搜市场 → 用 `eas-skill-creator` 落地新技能

### 长任务管理（Long-running Tasks）

> 任务管理分为四类（`task` 工具 / `scheduler.*` / **项目级长任务** / `todo` 工具），详见 `spec/task-management.md`。本节仅说明何时引入 `eas-planning-writer`。

| 需求 | 第一步 | 第二步 |
|---|---|---|
| 启动多步骤、跨 session 复杂任务 | `eas-planning-writer`（先看 SKILL.md） | 用其 `init-planning-session.ts` 落地三件套 |
| 心跳/定时任务期间做了关键判断 | `eas-planning-writer` 已建立的 task 目录 | 把判断沉淀到 `docs/decisions/00NN-xxx.md`（决策沉淀） |
| 任务执行中上下文窗口过载 | `eas-planning-writer` | 触发"双动作规则"：每 2 次 find/search 后立即写 `findings.md` |
| Session 重启需要恢复上下文 | `eas-planning-writer` | 跑 `session-catchup.ts`，读 `task_plan.md` / `findings.md` / `progress.md` |
| 验证技能自身健康度 | `eas-planning-writer` | 跑 `test_planning_writer.ts`（5/5 PASS） |

**何时不用 `eas-planning-writer`**：

- 单次工具调用能完成 → 直接做
- 当前 session 内 Agent 自己拆解子任务 → 用 `todo` 工具（DB 持久化）
- 启动一次性 subagent → 用 `task` 工具
- 定时/周期任务 → 用 `scheduler.*` 工具

## 决策辅助：应该加载哪个技能 (Decision Helper)

按以下流程快速判断：

1. **用户已经说了技能名**？→ 直接加载
2. **是 EASBot 自身配置 / 身份 / 模板相关**？→ `eas-agent-evolution`
3. **是写 / 改 / 打包单个技能**？→ `eas-skill-creator`
4. **是管理技能生命周期 / 组合 Bundle**？→ `eas-agent-creation`
5. **是写 EASBot 系统提示词**？→ `eas-prompt-creator`
6. **是搜市场找现成技能**？→ `eas-skill-find`
7. **是启动多步骤 / 跨 session / 长任务 / 需要持久化进度**？→ `eas-planning-writer`
8. **都不确定 / 跨多个领域**？→ `eas-skill-using`（自身）

## 关键概念 (Key Concepts)

### 技能与 Agent 的关系

- **技能 = 给 Agent 的提示词包**：通过 SKILL.md + bundled resources 注入领域知识
- **Agent = 技能的执行者**：Agent 根据 SKILL.md 的 description 判断何时加载
- **生态 = builtin + 市场技能**：builtin 在 `skills/buildin/`，市场技能通过 `easbot skills add` 安装

### 三级加载机制 (Progressive Disclosure)

EASBot 技能遵循三级加载，最大限度节省上下文：

1. **元数据**（name + description）—— 始终在上下文中，决定是否触发
2. **SKILL.md 主体** —— 触发后加载
3. **bundled resources** —— 按需加载，脚本可不读入上下文直接执行

### 技能命名约定 (Naming Convention)

- 全部小写字母 + 连字符（hyphen-case）：`eas-skill-using` / `eas-agent-creation`
- builtin 统一 `eas-` 前缀，市场技能不强制
- 名称控制在 64 字符以内

### description 编写规范

- 始终第三人称："该技能应在 ... 时使用"
- 仅描述**触发条件**，不描述过程
- 500 字符以内，总 metadata ≤ 1024 字符

### 与其他技能的关系 (Relationships with Other Skills)

- **eas-skill-find**：搜市场技能，找不到时再考虑创建
- **eas-skill-creator**：写单个技能的结构与规范
- **eas-agent-creation**：管理技能生命周期 + Bundle 组合
- **eas-agent-evolution**：Agent 自身配置（独立于"技能"，是 Agent bootstrap / 进化）
- **eas-prompt-creator**：写 EASBot 系统提示词（不是 SKILL.md，是 Agent / Tool 等的 prompt）
- **eas-planning-writer**：执行项目级长任务（与本技能平行，但本技能是"导航"，该技能是"执行工具"）

### 技能 vs Task 工具 vs 命名空间 (Skill vs Task Tool vs Namespace)

> 容易混淆：技能是**提示词包**，不是"做事的工具"。做事的工具是 `task` / `scheduler.*` / `todo` / `skill`（`Skill` 命名空间）这些 Tool。

| 概念 | 是什么 | 何时用 |
|------|--------|--------|
| **技能（Skill）** | 注入到上下文的提示词包（SKILL.md + bundled resources） | Agent 需要某领域的工作流指导 |
| **`task` 工具** | 启动一次性 subagent | 独立子任务（探索、写文件等） |
| **`scheduler.*` 工具** | 创建定时/周期任务 | 心跳、清理、批处理 |
| **`todo` 工具** | 维护当前 session 的子任务清单 | 当前 session 内多步操作 |
| **`skill` 工具** | 加载/读取技能 | 通过 `name` 加载技能到上下文 |

**关系**：

- 技能**不**做具体执行，**不**调用工具；技能**只**给 Agent 提供指令
- 项目级长任务 = **技能** (`eas-planning-writer`) + **Tool** (`Bash` / `Write` / `Read` / `Glob`) 协作
- Agent 工作流 = 先 `skill` 工具加载技能 → 按技能指令决定调用哪些 Tool

## 最佳实践 (Best Practices)

### 技能选择指南

1. **优先复用**：先用 `eas-skill-find` 看市场有没有现成的
2. **再考虑创建**：没有就 `eas-skill-creator` 写一个
3. **最后考虑组合**：用 `eas-agent-creation` 把已有技能打包成 Bundle
4. **不要重新发明**：如果 builtin 已经有覆盖，就别新建

### 避免常见错误

- **不要在 description 里写过程**：只写触发条件，过程放进 Markdown 主体
- **不要把所有信息塞进 SKILL.md**：超 500 行就拆 references/，让 Agent 按需加载
- **不要手改 eas-agent-evolution 模板**：所有改动走引导流程
- **不要混淆 skill 提示词与系统提示词**：前者是给 Agent 加载的（SKILL.md），后者是 Agent 自身的（用 `eas-prompt-creator`）
- **不要用 `todo` 工具跟踪跨 session 长任务**：`todo` 仅限单 session，跨 session 必须用 `eas-planning-writer`（详见 `spec/task-management.md` 第 3 节 vs 第 4 节）
- **不要让 Agent 直接 `Read` SKILL.md 路径**：通过 `skill` 工具以 `name` 加载（技能可能在多个目录中，物理路径不固定）

### 上下文窗口预算

| 加载阶段 | 体积建议 | 说明 |
|---|---|---|
| name + description | ≤ 1024 字符 | 决定是否触发，必须精简 |
| SKILL.md 主体 | ≤ 500 行 | 触发后加载，含完整指令 |
| references/* | 无硬性限制 | 按需加载，单文件 < 10k 字 |

### 技能版本与维护

| 字段 | 规范 | 升级时机 |
|------|------|----------|
| `version` | 遵循 semver（major.minor.patch） | 内容变更时 bump |
| `category` | `builtin` / `domain` / `workflow` | 极少变更 |
| `tags` | hyphen-case 数组 | 新增主题时追加 |

**维护者 Checklist**（builtin 技能新增/删除时必做）：

- [ ] 更新本技能"能力索引"节
- [ ] 更新"决策辅助"流程图
- [ ] 更新"场景映射"表
- [ ] 更新 frontmatter `description`（含 6 个技能的全名）
- [ ] 更新 `tags` 数组
- [ ] bump `version`（patch）
- [ ] 在 `docs/decisions/00NN-xxx.md` 写决策（如新增分类）

## 总结 (Summary)

`eas-skill-using` 不做具体任务，做**导航**：

- 提供 builtin 技能的**能力索引**（含 6 个核心技能），让 Agent 快速知道"我能做什么"
- 提供**场景 → 技能组合**的推荐表（含 5 大场景：找现成 / 创建 / 维护 / 提示词 / 长任务管理），避免 Agent 漏用或误用
- 作为**其他技能的前置**，统一上下文术语与命名约定
- 区分**技能（提示词包）**与 **Tool（执行工具）**，避免概念混淆

当你不确定该用哪个技能时，先加载本技能查索引；找到对应技能后再加载具体技能获取详细指令。

> 维护者提示：本技能是 builtin 技能生态的"目录页"，每新增/删除 builtin 技能都必须同步更新本文件的"能力索引"与"决策辅助"节。