---
name: 0014-dev-skills-pack-architecture
description: '0014: 通用开发闭环技能包架构 —— 9 个独立可执行 + 可组合的 eas-dev-* 技能，覆盖需求→设计→实现→测试→评审→交付→诊断→收尾完整闭环'
category: architecture
author: Agent (EASBot)
version: 1.0.0
date: '2026-08-08'
keywords:
  - '0014'
  - dev-skills-pack
  - architecture
  - eas-dev-
  - workflow
supersedes: null
status: proposed
---

# 0014: 通用开发闭环技能包架构（Dev Skills Pack Architecture）

> **决策日期**：2026-08-08
> **决策人**：Agent（按用户指令规划，待 Review）
> **状态**：📋 草拟
> **类型**：架构型
> **影响范围**：新增 `skills/dev/eas-dev-*` 10 个技能（新建 `dev/` 分类）；同步 AGENTS.md / README* / marketplace.json（**不**进 `eas-skill-using` 索引）
> **相关 spec**：[`.easbot/knowledge/tasks/dev-skills-pack/spec.md`](../../.easbot/knowledge/tasks/dev-skills-pack/spec.md)
> **关联决策**：0013（frontmatter metadata 标准化，间接规范基线）

---

## 背景 (Context)

EASBot agent-skills 仓库目前有 7 个 builtin 核心技能 + 5 个 tools 工具类技能，**但缺少一套"通用开发流程"技能包**——即开发者在做日常软件工程时（不论语言 / 框架）按阶段需要的指导：

- **当下痛点**：
  1. 现有 builtin 技能偏"Agent 自身管理"（创建 / 演化 / 规划 / 提示词），不覆盖"开发行为"本身
  2. 开发者使用 EASBot 时，缺少"开发流程骨架"——只能依靠系统提示词中的泛泛指令
  3. 外部产品（mattpocock skills / superpowers / gstack / ECC）已经在做这件事，但风格差异巨大，开发者需要 EASBot 自有视角的统一抽象

- **用户原话诉求**（2026-08-08）：
  > 规划完整合理的符合 skill 根技能规范（`Use Skill: eas-skill-creator`）的开发类几个通用开发技能，覆盖完整的开发流程。每个技能都可以独立执行，也可以完整连贯性组合使用覆盖完整的开发流程。简洁高效，易用，易落地，易扩展，既要规范开发技能的同时能够指导 agent 挖掘自己的创造性，保持目标、规范、边界清晰，除头脑风暴外保持收敛，设计开发保持第一性原理根本，避免过度工程化，简洁高效，注重性能。

## 约束 (Constraints)

- **C1. 符合 `eas-skill-creator` 根技能规范**：frontmatter（name + description + 5 大模式字段白名单 + `metadata:` 子键）、必填节（概述 / 何时使用 / 快速参考）、渐进式披露、双向约束、`< 500 行` 上限。
- **C2. 通用性**：语言 / 框架无关；技术栈特定指导（如 Python TDD / React 组件设计）由对应技术技能覆盖，本技能包不重复。
- **C3. 双重契约**：每个技能**可独立执行** + 多个技能**可连贯组合**覆盖完整闭环。
- **C4. 启发为主，关键边界强制**：除"头脑风暴"外保持收敛；安全 / 不可逆操作边界强制；其他阶段启发 Agent 创造性。
- **C5. 第一性原理**：设计技能时区分"行业惯例（Layer 1+2）"与"第一性原理（Layer 3）"；每个技能必含一节"第一性原理 / 心智模型"。
- **C6. 反过度工程化**：技能数量收敛（≤10）；每个技能 SKILL.md 主体 < 500 行；不引入新第三方依赖（脚本仅 Node 内置模块）。
- **C7. 性能导向**：name + description ≤ 1024 字符；`SKILL.md` < 500 行；references 单文件 < 10k 字。
- **C8. 不与既有 builtin 冲突**：不重复 `eas-skill-using` / `eas-skill-creator` / `eas-skill-find` / `eas-prompt-creator` / `eas-agent-creation` / `eas-agent-evolution` / `eas-planning-writer` 的职责。
- **C9. 分类与命名**：本包作为新分类 **`skills/dev/`**（与 `builtin/` / `tools/` 并列，**不进 `eas-skill-using` 索引**）；技能统一 `eas-dev-<verb>` 格式（如 `eas-dev-spec` / `eas-dev-design`）。**理由**：开发技能是"被开发者按需加载"的工具集，不是 Agent 自身管理的 builtin 核心；与 `eas-skill-using` 索引的"中央导航"职责不同——开发者按 description 自行匹配即可。

## 备选方案 (Alternatives)

### 方案 A：1 个超大 `eas-dev` Pipeline 技能（gstack 风格）

| 维度 | 评估                                                                                                                                                  |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 优点 | 一步到位；用户无需学习多技能；和 gstack / BMAD 一样"全自动"                                                                                           |
| 缺点 | 违反 C1（5 大模式中 Pipeline 技能描述完整流程则 SKILL.md 必然 > 500 行）；违反 C3（不能独立执行子阶段）；违反 C4（剥夺创造性）；违反 C6（过度工程化） |
| 风险 | 用户被困在"全流程托管"，与 mattpocock 反模式警告一致                                                                                                  |
| 成本 | 单 SKILL.md 可能 1000+ 行；后续修改牵一发动全身                                                                                                       |

### 方案 B：9 个独立可组合技能（mattpocock 风格）—— **本决策选择**

| 维度 | 评估                                                                                             |
| ---- | ------------------------------------------------------------------------------------------------ |
| 优点 | 每个技能小、单一职责；满足 C3（独立 + 组合双契约）；满足 C5/C6（启发 + 不过度工程化）            |
| 缺点 | 用户需了解 9 个技能（成本：能力索引清晰即可）；缺少"一键全流程"（用 Pipeline orchestrator 弥补） |
| 风险 | 技能间接口若不一致会导致组合失败；通过"共享上下文契约 + 端到端示例"缓解                          |
| 成本 | 9 × ~400 行 SKILL.md = ~3600 行；可接受                                                          |

### 方案 C：复制 superpowers 全套 13 个技能（严格 1:1 对照）

| 维度 | 评估                                                                                                                                                                                              |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 优点 | 用户可平滑迁移；已被验证                                                                                                                                                                          |
| 缺点 | 包含 "writing-skills" / "using-superpowers" / "using-git-worktrees" 等元层技能，与 EASBot 既有 `eas-skill-creator` / `eas-skill-find` / `eas-planning-writer` 冲突；包含强制流程红线（C4 不允许） |
| 风险 | 技能职责重叠；用户认知负担                                                                                                                                                                        |
| 成本 | 13 个技能，超出 C6 的 ≤10 上限                                                                                                                                                                    |

### 方案 D：保留 superpowers 子集（7 个），跳过元层技能

| 维度 | 评估                                                                                   |
| ---- | -------------------------------------------------------------------------------------- |
| 优点 | 避开元层冲突；保留 superpowers 强流程优势                                              |
| 缺点 | 仍受 C4（强流程约束）和 C6（数量 7 个偏多）制约；未充分吸收 mattpocock / gstack 的优点 |
| 风险 | 沦为 superpowers 仿制品，缺少 EASBot 特色                                              |
| 成本 | 7 个技能，每个仍需大幅调整以适配 EASBot 规范                                           |

## 决策 (Decision)

**本决策选择：方案 B —— 9 个独立可组合技能 + 1 个 Pipeline orchestrator**。

落地清单（最终 10 个技能，其中 9 个独立 + 1 个组合 orchestrator）：

| #   | 技能 name           | 中文名          | 模式                        | 独立职责                                                        | 在闭环中的位置         |
| --- | ------------------- | --------------- | --------------------------- | --------------------------------------------------------------- | ---------------------- |
| 1   | `eas-dev-align`     | 对齐 / 头脑风暴 | **Inversion**（3 阶段访谈） | 在写代码 / spec 之前对齐意图与术语；产出"对齐笔记"              | 阶段 1                 |
| 2   | `eas-dev-spec`      | 规格化          | **Generator**               | 把对齐笔记转为可执行 spec（背景 / 目标 / 接口 / 验收 / 范围外） | 阶段 2                 |
| 3   | `eas-dev-design`    | 架构设计        | **Pattern**（deep modules） | 在 spec 基础上设计模块边界 / 接口契约 / 测试面                  | 阶段 3                 |
| 4   | `eas-dev-plan`      | 任务拆解        | **Generator**               | 把 spec/design 拆为可执行任务（2-5 分钟颗粒度）                 | 阶段 4                 |
| 5   | `eas-dev-tdd`       | TDD 实现        | **Technique**               | 红-绿-重构循环；含测试反模式库                                  | 阶段 5                 |
| 6   | `eas-dev-implement` | 实现驱动        | **Pipeline**                | 调度 plan → tdd → review 的单任务级闭环                         | 阶段 5（替代实现方式） |
| 7   | `eas-dev-review`    | 代码评审        | **Reviewer**                | 两轴评审（标准 / spec）；P0/P1/P2 分级                          | 阶段 6                 |
| 8   | `eas-dev-diagnose`  | 诊断调试        | **Technique**               | 4 阶段根因分析（复现 / 定位 / 修复 / 回归）                     | 阶段 7（bug 修复路径） |
| 9   | `eas-dev-finish`    | 收尾发布        | **Technique**               | 合并 / PR / 部署 / 文档同步的工作流                             | 阶段 8                 |
| 10  | `eas-dev-loop`      | 全流程编排      | **Pipeline**                | 把 1-9 组合成"完整开发闭环"（用户一键式）；可选                 | 全流程                 |

| 项       | 内容                                                        |
| -------- | ----------------------------------------------------------- |
| 选了什么 | 方案 B（10 个技能 = 9 个独立 + 1 个 Pipeline orchestrator） |
| 适用范围 | 所有未来"通用开发流程"场景（任何语言 / 框架）               |
| 生效日期 | 2026-08-08（草拟，待 Review）                               |
| 审批状态 | 📋 草拟                                                     |

## 依据 (Rationale)

1. **理由 1**：mattpocock README §Why These Skills Exist 明确反对"全流程托管"——"small, easy to adapt, and composable"是其核心卖点。方案 A 正是 mattpocock 警告的反模式。
2. **理由 2**：`eas-skill-creator` §5 大模式字段约束 + SKILL.md < 500 行约束 + 渐进式披露，天然要求"小颗粒度"。方案 B 与规范同构；方案 A 与规范相冲。
3. **理由 3**：superpowers 强流程驱动（C4 反）会剥夺创造性；方案 B 通过"启发为主 + 关键边界强制"保留 Agent 创造性——尤其是头脑风暴（`eas-dev-align`）保持 Inversion 全开，其他阶段收敛到具体模式。
4. **理由 4**：gstack ETHOS §"Boil the Ocean" + "Search Before Building" 第一性原理思维，被吸收进每个技能"第一性原理 / 心智模型"必填节——这是 EASBot 自有视角的统一抽象，与外部 4 套产品区分开来。
5. **理由 5**：ECC "Test-Driven + Plan Before Execute + Immutability" 基线作为行业最佳实践，落地为 `eas-dev-tdd` / `eas-dev-plan` / 全局代码风格基线（不强制 80% 覆盖率，违反 C4/C6）。
6. **否决方案 A 的核心理由**：单技能必然 > 500 行，违反 SKILL.md 上限 + 剥夺子阶段独立执行能力。
7. **否决方案 C 的核心理由**：包含元层技能（`using-superpowers` / `writing-skills` / `using-git-worktrees`）与 EASBot 既有 builtin 冲突。
8. **否决方案 D 的核心理由**：仍是 superpowers 仿制品；数量 7 个接近上限；未充分吸收 gstack / mattpocock 优点。

## 具体动作 (Actions)

- [ ] **新建设计文档**（`.easbot/knowledge/tasks/dev-skills-pack/spec.md`）：完整定义 10 个技能的功能、模式、输入输出、组合契约
- [ ] **新建设计文档**（`.easbot/knowledge/tasks/dev-skills-pack/tasks.md`）：逐技能创建任务清单
- [ ] **新建设计文档**（`.easbot/knowledge/tasks/dev-skills-pack/checklist.md`）：每技能的 §14 五维度评审清单
- [ ] **创建 10 个技能目录**（`skills/dev/eas-dev-{align,spec,design,plan,tdd,implement,review,diagnose,finish,loop}/`），每个含 `SKILL.md` + 可选 `references/` / `scripts/`
- [ ] **每个技能独立创建会话**：按 §14 评审规范走完整流程（避免单 session 上下文爆炸）
- [ ] **同步项目级文件**：
  - [ ] `AGENTS.md` §3 目录树追加 `dev/` 分类（含 10 个新技能）
  - [ ] `README.md` + `README.en.md` 目录结构块 + "开发技能一览"表 各加一行（**不**放进"内置技能一览"表）
  - [ ] `.claude-plugin/marketplace.json` `plugins[]` 追加 10 项
  - [ ] **`skills/builtin/eas-skill-using/SKILL.md` 不变**（dev 分类**不进** `eas-skill-using` 索引；按 description 自行匹配）
- [ ] **校验**：§5.2 顶部全量 `quick-validate.ts` 循环零失败
- [ ] **评审报告**：`docs/decisions/0015-review-dev-skills-pack.md`（按 §14.7 模板）

## 影响 (Impact)

### ✅ 正面影响

- 补齐 EASBot builtin 技能生态的"开发行为"维度，与既有"Agent 管理"维度对称
- 提供 EASBot 自有视角的统一抽象，区别于 mattpocock / superpowers / gstack / ECC
- 双重契约（独立 + 组合）满足不同用户偏好："只想评审" → 只用 `eas-dev-review`；"一站式" → 用 `eas-dev-loop`
- 第一性原理必填节使每个技能都给出"为什么这样做"的深层解释，启发 Agent 创造性

### ⚠️ 风险

- **R1. 技能间接口不一致导致组合失败** —— 缓解：通过 `spec.md` 定义明确的"输入 / 输出 / 上下文契约"，并在每个技能的 SKILL.md 中引用
- **R2. 10 个技能数量偏多，触发"能力索引爆炸"** —— 缓解：`eas-skill-using` 索引分类清晰（按"开发流程阶段"组织）；提供"何时用哪个"的决策树
- **R3. 第一性原理节易沦为"哲学说教"** —— 缓解：要求每节 1-2 段，含 1 个可验证的判断标准
- **R4. Pipeline orchestrator (`eas-dev-loop`) 可能再次陷入"全流程托管"反模式** —— 缓解：默认不加载；只有用户明确要求时启用；内部使用其他 9 个技能的独立执行能力

### ❌ 副作用 / 取舍

- **T1. 放弃了"一键全流程"便利性** —— 取舍：换来"独立可执行"灵活性 + "Agent 创造性"保留
- **T2. 不提供 superpowers 风格的强流程红线** —— 取舍：换取 C4 启发式哲学
- **T3. 不强制覆盖率指标** —— 取舍：通用流程不应强制量化指标；具体项目可在 `CONTEXT.md` 自定义

## 不适用范围 (Out of Scope)

- ❌ **不做语言 / 框架特定指导**：React 组件设计 / Python TDD / Go 项目结构等，由对应技术技能覆盖（`/skills/builtin/eas-react-*` 等）。本包严格限定通用流程。
- ❌ **不做项目脚手架 / 初始化**：项目初始化属 "项目级一次性任务"，由 `eas-skill-creator` + `eas-agent-evolution` 协同；本包聚焦"开发流程"非"项目创建"。
- ❌ **不做 CI / 部署平台特定集成**：Vercel / Fly.io / Render 等部署集成由对应工具技能覆盖。
- ❌ **不强制使用 `CONTEXT.md` / ADR 等文档结构**：每个技能可建议产出文档（如 spec / 设计笔记 / 决策记录），但具体文档系统选择留给项目。
- ❌ **不做工作量估算 / 排期**：本包聚焦"如何开发"，不涉及"何时完成 / 谁负责"——后者属项目管理范畴。

## 验收清单 (Acceptance Criteria)

- [ ] `.easbot/knowledge/tasks/dev-skills-pack/spec.md` 完整定义 10 个技能的功能、模式、输入输出、组合契约
- [ ] `.easbot/knowledge/tasks/dev-skills-pack/tasks.md` 含每技能的创建任务清单
- [ ] `.easbot/knowledge/tasks/dev-skills-pack/checklist.md` 含每技能的 §14 五维度评审清单
- [ ] 10 个技能目录创建完毕，每个含 `SKILL.md` + 必要 references
- [ ] 每个技能通过 `quick-validate.ts` 校验零失败
- [ ] 每个技能按 §14 评审规范通过五维度评审，P0 = 0；P1 = 0 或全部豁免
- [ ] AGENTS.md §3 目录树已更新
- [ ] README.md / README.en.md 表格已更新
- [ ] `.claude-plugin/marketplace.json` 已追加 10 项
- [ ] `skills/builtin/eas-skill-using/SKILL.md` **未改动**（dev 分类不进索引）
- [ ] `docs/decisions/0015-review-dev-skills-pack.md` 评审报告已落档
- [ ] 用户已确认规划结果

## 后续任务 (Follow-up)

| 任务                                                                    | 负责模块                     | 优先级 | 状态      |
| ----------------------------------------------------------------------- | ---------------------------- | ------ | --------- |
| 创建 `eas-dev-align`（Inversion 模式；最特殊，先做）                    | skills/dev/eas-dev-align     | 🔴 高  | 📋 待启动 |
| 创建 `eas-dev-spec`（Generator 模式；闭环起点）                         | skills/dev/eas-dev-spec      | 🔴 高  | 📋 待启动 |
| 创建 `eas-dev-design`（Pattern 模式）                                   | skills/dev/eas-dev-design    | 🔴 高  | 📋 待启动 |
| 创建 `eas-dev-plan`（Generator 模式）                                   | skills/dev/eas-dev-plan      | 🔴 高  | 📋 待启动 |
| 创建 `eas-dev-tdd`（Technique 模式）                                    | skills/dev/eas-dev-tdd       | 🟡 中  | 📋 待启动 |
| 创建 `eas-dev-implement`（Pipeline 模式）                               | skills/dev/eas-dev-implement | 🟡 中  | 📋 待启动 |
| 创建 `eas-dev-review`（Reviewer 模式）                                  | skills/dev/eas-dev-review    | 🔴 高  | 📋 待启动 |
| 创建 `eas-dev-diagnose`（Technique 模式）                               | skills/dev/eas-dev-diagnose  | 🟡 中  | 📋 待启动 |
| 创建 `eas-dev-finish`（Technique 模式）                                 | skills/dev/eas-dev-finish    | 🟢 低  | 📋 待启动 |
| 创建 `eas-dev-loop`（Pipeline 编排）                                    | skills/dev/eas-dev-loop      | 🟢 低  | 📋 待启动 |
| 同步 AGENTS.md / README* / marketplace.json（**不**改 eas-skill-using） | repo                         | 🔴 高  | 📋 待启动 |
| 全量 `quick-validate` + §14 评审 + 评审报告 0015                        | repo                         | 🔴 高  | 📋 待启动 |

## 关联 (References)

- **关联决策**：[0013-review-round3-frontmatter-metadata.md](./0013-review-round3-frontmatter-metadata.md)（frontmatter metadata 标准化是本决策的间接规范基线）
- **相关 spec**：[`.easbot/knowledge/tasks/dev-skills-pack/spec.md`](../../.easbot/knowledge/tasks/dev-skills-pack/spec.md)
- **相关 tasks**：[`.easbot/knowledge/tasks/dev-skills-pack/tasks.md`](../../.easbot/knowledge/tasks/dev-skills-pack/tasks.md)
- **相关 checklist**：[`.easbot/knowledge/tasks/dev-skills-pack/checklist.md`](../../.easbot/knowledge/tasks/dev-skills-pack/checklist.md)
- **外部参考**：
  - [mattpocock/skills README](https://github.com/mattpocock/skills)（核心理念：反对全流程托管）
  - [obra/superpowers README](https://github.com/obra/superpowers)（核心理念：TDD + Systematic + Verification）
  - [garrytan/gstack README + ETHOS](https://github.com/garrytan/gstack)（核心理念：Boil Ocean + First Principles）
  - [everything-claude-code](https://github.com/affaan-m/everything-claude-code)（核心理念：Agent-First + TDD 80%）
  - [eas-skill-creator SKILL.md](../../skills/builtin/eas-skill-creator/SKILL.md)（规范基线）

---

## 修订记录 (Revision History)

| 版本  | 日期       | 修订内容                                              | 修订人         |
| ----- | ---------- | ----------------------------------------------------- | -------------- |
| 1.0.0 | 2026-08-08 | 初版：10 个技能（9 独立 + 1 orchestrator）方案 B 选定 | Agent (EASBot) |

---

**最后更新**：2026-08-08
