---
name: 0019-upgrade-eas-dev-research-to-builtin
description: "0019: 架构决策 —— 将 eas-dev-research 从 dev 包升级到 builtin/eas-research（v3.0.0）；去 dev 耦合；明确通用研究 / 代码内部调研边界；不单独加代码 research 分支"
category: architecture
author: Agent (EASBot)
version: 1.0.0
date: "2026-08-08"
keywords:
  - "0019"
  - upgrade
  - eas-research
  - builtin
  - deprecate-eas-dev-research
  - architecture
  - host-project
supersedes: docs/decisions/0014-dev-skills-pack-architecture.md §C9（部分修订）
related:
  - "0014-dev-skills-pack-architecture.md"
  - "0016-review-dev-skills-pack-round2.md"
  - "0018-review-eas-dev-research.md"
related_paths:
  - "skills/builtin/eas-research/SKILL.md"
  - "skills/builtin/eas-research/references/research-report.md"
  - "skills/builtin/eas-research/references/comparison-analysis.md"
  - "skills/builtin/eas-research/assets/research-report-template.md"
  - "skills/builtin/eas-research/assets/comparison-analysis-template.md"
  - "AGENTS.md"
  - "README.md"
  - "README.en.md"
  - ".claude-plugin/marketplace.json"
status: active
---

# 0019: 架构决策 —— `eas-dev-research` 升级到 `builtin/eas-research`（v3.0.0）

> **决策日期**：2026-08-08
> **决策人**：Agent（按用户指令"认真分析，研究是不是更像通用的 research 技能，是不是应该升级到 builtin 更合适"）
> **状态**：✅ active（已落地）
> **类型**：架构型
> **影响范围**：
> - 技能从 `skills/dev/eas-dev-research/` → `skills/builtin/eas-research/`（路径迁移 + 重命名）
> - SKILL.md / 2 个 references / 2 个 assets 内容去 dev 耦合（v2.0.0 → v3.0.0）
> - AGENTS.md §3 目录树 + 内置技能从 7 → 8 个
> - `eas-skill-using` 能力索引新增一条（条目 7）+ 决策辅助第 8 步 + 场景映射加 1 条
> - README.md / README.en.md 内置技能一览表各加一行
> - `.claude-plugin/marketplace.json` plugins[] 加 1 条（22 → 23）
> **关联决策**：0014-dev-skills-pack-architecture.md（dev 包 10 技能架构；本决策对 §C9 部分修订）

---

## 1. 背景 (Context)

EASBot agent-skills 仓库当前架构（0014 决策后）：

| 分类 | 数量 | 定位 | 选入标准 |
|---|---|---|---|
| `builtin/` | 7 | EASBot 核心管理技能 | 服务 Agent 自身管理（find / creator / creation / evolution / prompt-creator / planning-writer / using） |
| `tools/` | 5 | 通用工具类技能 | 服务内容产出格式（docx / pdf / pptx / xlsx / chinese-writer） |
| `dev/` | 10 | 开发流程技能 | 服务软件开发流程（align / spec / design / plan / tdd / implement / review / diagnose / finish / loop） |

**问题发现**：用户在第三轮评审（0018）后提出疑问——

> "认真分析，这个技能是不是更好像通用的 research 技能，是不是应该升级到 builtin 更合适，他不止是 dev 开发相关的技能"

经客观分析，`eas-dev-research` 当前定义（v2.0.0）：

- **覆盖场景**：调研 / 分析 / 对比（技术选型 / 根因调研 / 趋势与最佳实践）—— **不限于 dev**
- **不做什么**：❌ 不写代码 / 不做架构设计 / 不写 spec / 不调 bug —— **与 dev 闭环显式切割**
- **依赖关系**：与 dev 闭环**无依赖**（独立技能）
- **典型用户**：任何需要做研究的人（产品 / 运营 / 战略 / 学术）—— **不仅开发者**

→ **`eas-dev-research` 当前定位（dev 包）与实际能力（通用研究）不匹配**，存在**分类错位**问题。

---

## 2. 备选方案 (Alternatives)

### 方案 A：保持 `skills/dev/eas-dev-research/`，仅修边界描述

| 维度 | 评估 |
|---|---|
| 优点 | 最小变更；不动项目级文件 |
| 缺点 | 命名（`eas-dev-`）与位置（`dev/`）持续暗示"dev 专属"；**未填 builtin 空白点**；用户原话诉求未满足 |
| 风险 | 长期错位；后续引用 / 查找时混淆 |
| 成本 | 极低（仅 SKILL.md 改 description） |

### 方案 B：升到 `skills/builtin/eas-research/`（重命名 + 去 dev 耦合）—— **本决策选择**

| 维度 | 评估 |
|---|---|
| 优点 | 命名 / 位置 / 实际能力完全一致；填 builtin 空白点（`eas-skill-using` 能力索引无 research 类）；清晰边界（vs dev 包）；与 builtin 命名风格统一（`eas-research` vs `eas-skill-find`） |
| 缺点 | 触发决策文档（0019）+ 项目级同步 6 个文件；需 1 个 `[repo]` commit + 1 个 `[skill: eas-research]` commit |
| 风险 | 误用（用户期望 research 一定能产出真实数据 —— 实际依赖 Agent 工具能力；SKILL.md 已显式说明） |
| 成本 | 中（5 个技能文件重写 + 4 个项目级文件同步） |

### 方案 C：升到 builtin 但保留 `eas-dev-research` 名字（兼容命名）

| 维度 | 评估 |
|---|---|
| 优点 | 兼容历史引用；旧脚本 / 文档无需更新 |
| 缺点 | 命名（`eas-dev-`）仍暗示"dev 专属"——**与升级目的矛盾**；不一致 |
| 风险 | 长期错位；用户引用时仍以为 dev 专用 |
| 成本 | 低（路径迁移 + 命名保留） |

---

## 3. 决策 (Decision)

**本决策选择：方案 B** —— 升级到 `builtin/eas-research`（v3.0.0；路径迁移 + 重命名 + 去 dev 耦合）。

| 项 | 内容 |
|---|---|
| 选了什么 | `skills/dev/eas-dev-research/` → `skills/builtin/eas-research/`（重命名 + 路径迁移） |
| 版本 | v2.0.0 → **v3.0.0**（架构升级：分类从 dev → builtin） |
| `metadata.category` | `dev` → **`builtin`** |
| 路径根 | `<cwd>/.easbot/knowledge/docs/dev/<topic>/` → `<cwd>/.easbot/knowledge/docs/research/<topic>/` |
| 适用日期 | 2026-08-08 |
| 审批状态 | ✅ active |

---

## 4. 关于"代码 research 分支是否单独加"的决策

用户在第三轮评审后追加提问：

> "具体分析需不需要单独下次一个代码 research 的分支"

**分析结论**：**不需要**。代码相关调研分两类：

| 类型 | 示例 | 本技能处理 |
|---|---|---|
| **代码外部调研**（开源 / 选型 / 趋势） | "Rust 异步运行时有哪些" / "PostgreSQL vs MySQL" / "2025 年 React 趋势" | ✅ 本技能 `research-report`（用 `research_type: technical`） |
| **代码内部调研**（已有 codebase） | "现有 codebase 怎么调用 X API" / "这个 bug 的根因" | ❌ 走 `eas-dev-spec` / `eas-dev-design` / `eas-dev-diagnose` / `eas-dev-review`（dev 闭环已覆盖） |

**理由**：

1. dev 闭环 4 个技能（spec / design / diagnose / review）已覆盖代码内部调研
2. 通用 research 的 `research_type: technical` 已覆盖技术领域（含代码外部）
3. 单独"代码 research"子 reference 会增加模板复杂度而无明显收益（违反 §0014 C6 反过度工程化）

**最终决策**：**不单独加代码 research 分支**。`eas-research` SKILL.md §"代码 research 处理"节显式说明两类调研的路由边界。

---

## 5. 依据 (Rationale)

### 理由 1：`eas-skill-using` 能力索引现有 6 条无 research 类（现 7 条）

现有 6 个 builtin 都是"服务 Agent 自身"（find / creator / creation / evolution / prompt-creator / planning-writer / using）或"内容产出"（在 tools/）—— **没有"通用调研 / 分析"能力**。`eas-research` 填补真实空白。

### 理由 2：dev 包 C9 原则仍适用，但边界已变

0014 决策 §C9：

> 本包作为新分类 `skills/dev/`（与 `builtin/` / `tools/` 并列，不进 `eas-skill-using` 索引）；开发者按 description 自行匹配。

**原则仍适用**：dev 包 10 个技能**继续**不进 `eas-skill-using` 索引；dev 流程专属。

**边界已变**：`eas-research` 从 dev 包**抽出**，归 builtin —— 它**不**是 dev 流程专属，**不**是 dev 闭环任何步骤的"开发者按 description 自行匹配"，而是**通用调研能力**，需在 `eas-skill-using` 能力索引中显式收录供任何 builtin / dev / tools 技能引用。

### 理由 3：与现有 6 个 builtin 同级，符合 EASBot 设计哲学

EASBot 设计哲学（0014 §C8）："不与既有 builtin 冲突"。`eas-research` **不**与现有 6 个 builtin 任何职责重叠（find 找技能 / creator 写技能 / creation 管理技能生命周期 / evolution Agent 配置 / prompt-creator 写提示词 / planning-writer 项目级长任务；research 是"调研分析"全新维度）。

### 理由 4：去 dev 耦合后边界清晰

升级后的 SKILL.md §"不做什么"明确：

- ❌ 不写代码 / 不做架构设计（软件代码层 —— `eas-dev-design`）
- ❌ 不写需求 spec（软件需求层 —— `eas-dev-spec`）
- ❌ 不做软件 bug 调试（`eas-dev-diagnose`）
- ❌ 不做软件 PR 评审（`eas-dev-review`）
- ❌ 不做项目级软件决策（`eas-dev-align` 启动 dev 闭环）
- ❌ 不替代领域专家（医学 / 法律 / 金融）

→ `eas-research` 与 dev 包 10 个技能**互补不重叠**；与 builtin 6 个技能**互补不重叠**；与 tools 5 个技能**互补不重叠**。

---

## 6. 具体动作 (Actions)

### 6.1 已落地（2026-08-08）

- [x] **路径迁移**：`skills/dev/eas-dev-research/` → `skills/builtin/eas-research/`（OS 移动 + git add，未 commit）
- [x] **SKILL.md 重写**（v3.0.0）：模式不变（Pattern + orchestrator）；`metadata.category: dev` → `builtin`；新增 §"代码 research 处理"节；落地路径从 `docs/dev/<topic>/` 改为 `docs/research/<topic>/`
- [x] **references/ 通用化**：
  - `parent_skill: eas-dev-research` → `eas-research`
  - 移除 dev 耦合描述（保留边界说明）
  - 落地路径全面 `docs/dev/` → `docs/research/`
  - 临时路径 `dev-scratch-<topic>-*` → `scratch-research-<topic>` / `scratch-comparison-<topic>`
- [x] **assets/ 同步重写**：去掉 dev 路径规范
- [x] **AGENTS.md §3**：builtin 目录 7 → 8 个，加 `eas-research/`
- [x] **eas-skill-using 能力索引**：新增第 7 条（eas-research）；决策辅助第 8 步（"是做调研 / 对比 / 分析 / 写报告？"）；场景映射加 1 条（"先调研再开发"）
- [x] **README.md**：目录树加一行 + 内置技能一览表加一行
- [x] **README.en.md**：目录树加一行 + 内置技能一览表加一行
- [x] **.claude-plugin/marketplace.json**：`plugins[]` 加 1 条（`eas-research` v3.0.0），22 → 23

### 6.2 待执行（待用户明确要求时）

- [ ] **commit 落地**（按 §7.1 / §7.3 / §7.5）：
  - 1 个 `[skill: eas-research] docs:` commit（含 5 个文件：SKILL.md + 2 references + 2 assets）
  - 1 个 `[repo] docs:` commit（含 4 个项目级文件：AGENTS.md + eas-skill-using/SKILL.md + README.md + README.en.md + marketplace.json + 0019 决策文档）
- [ ] **CHANGELOG** 更新（自动生成）

---

## 7. 影响 (Impact)

### ✅ 正面影响

- **填 builtin 空白点**：`eas-skill-using` 能力索引从 6 → 7 条；EASBot 生态能力更完整
- **职责清晰化**：`eas-research` = 通用研究 / `eas-dev-*` = 软件开发流程；互不混淆
- **可被任意技能引用**：dev 包 / tools 包 / 用户任务都可"先调研再做事"
- **路径规范对齐**：与 AGENTS.md §11 范围声明（"§11 仅收录已稳定目录，不收录未规范目录"）一致

### ⚠️ 风险

- **R1 历史引用断裂** —— 旧 `skills/dev/eas-dev-research/` 路径不存在；如有外部脚本 / 文档引用需更新
  - **缓解**：本仓库内 git 历史保留（旧 commit 仍可追溯）；文档同步在 §6.1
- **R2 误用期望** —— 用户期望 research 一定能产出真实数据（实际依赖 Agent 工具能力）
  - **缓解**：SKILL.md §"不做什么" + §"失败处理"已显式声明
- **R3 dev 包 0014 决策 §C9 部分修订** —— "dev 不进 builtin 索引"原则被本决策部分打破（仅 research 一个）
  - **缓解**：dev 包 10 个技能**仍**不进 builtin 索引；本决策明确说明 `eas-research` 从 dev 包**抽出**归 builtin 的理由（不是"dev 也可进 builtin"，而是"它根本不是 dev 技能"）

### ❌ 副作用 / 取舍

- **T1 升级期间**：`skills/dev/eas-dev-research/` 路径不再存在；如未 commit 就切换，旧引用可能断链
  - **缓解**：所有变更待用户 commit 决策时一次落地（atomic commit）
- **T2 `metadata.category: dev` → `builtin` 是不可逆分类变更** —— 后续如有 dev 包内部调研类技能，**不得**命名为 `eas-research`（名称已被占用）
  - **缓解**：0014 §C9 命名规范仍适用（dev 包内技能统一 `eas-dev-<verb>`）

---

## 8. 不适用范围 (Out of Scope)

- ❌ **dev 包 10 个技能（align / spec / design / plan / tdd / implement / review / diagnose / finish / loop）继续保留在 `skills/dev/`** —— 本决策仅升级 1 个技能
- ❌ **`eas-skill-using` 不重命名 / 不重构** —— 仅能力索引加 1 条
- ❌ **AGENTS.md §11 不重新定义** —— `eas-research` 落地路径根从 `docs/dev/` 改为 `docs/research/`，但 §11 范围声明的"项目级知识沉淀目录"通用原则不变
- ❌ **`marketplace.json` 的 `category: builtin` 字段不重新分类** —— 仅加 1 条 plugin

---

## 9. 验收清单 (Acceptance Criteria)

- [x] `skills/dev/eas-dev-research/` 不再存在；`skills/builtin/eas-research/` 存在
- [x] `SKILL.md` `name: eas-research` + `metadata.category: builtin` + `mode: Pattern` + `composition: orchestrator`
- [x] 2 个 references frontmatter `parent_skill: eas-research`
- [x] 2 个 assets 引用路径 `../SKILL.md`（相对路径正确）
- [x] AGENTS.md §3 builtin 8 个（含 `eas-research`）
- [x] `eas-skill-using` 能力索引含 eas-research
- [x] `eas-skill-using` 决策辅助含 9 步（含"调研"步骤）
- [x] `eas-skill-using` 场景映射含"先调研再开发"
- [x] README.md / README.en.md 内置技能一览表含 `eas-research` 一行
- [x] `.claude-plugin/marketplace.json` `plugins[]` 含 `eas-research` v3.0.0
- [ ] quick-validate PASS（待用户 commit 前最后一次确认）
- [x] 全文件 `�` 乱码 = 0 处
- [x] 12 处输出契约路径引用全部 `<cwd>/.easbot/knowledge/docs/research/<topic>/...`
- [ ] user commit 决策 + 实际 commit（按 §7.6 待用户明确要求）

---

## 10. 关联 (References)

- **关联决策**：[0014-dev-skills-pack-architecture.md](./0014-dev-skills-pack-architecture.md) §C9（部分修订："dev 不进 builtin 索引"原则仍适用，但 `eas-research` 已从 dev 包抽出归 builtin）
- **上轮评审**：[0018-review-eas-dev-research.md](./0018-review-eas-dev-research.md)（PASS；用户随后提出本决策需求）
- **相关 spec**：[.easbot/knowledge/tasks/dev-skills-pack/spec.md](../../.easbot/knowledge/tasks/dev-skills-pack/spec.md)（dev 包原始设计）
- **相关 reviews**：[0015-review-dev-skills-pack.md](./0015-review-dev-skills-pack.md) / [0016-review-dev-skills-pack-round2.md](./0016-review-dev-skills-pack-round2.md) / [0017-review-dev-skills-pack-round3.md](./0017-review-dev-skills-pack-round3.md)
- **外部参考**：
  - `eas-skill-using` §关键概念："生态 = builtin + 市场技能"
  - `eas-skill-using` §决策辅助流程（用于本决策的"加载哪些 builtin"判断）

---

## 11. 修订记录 (Revision History)

| 版本 | 日期 | 修订内容 | 修订人 |
|---|---|---|---|
| 1.0.0 | 2026-08-08 | 初版：决策落地 `eas-dev-research` → `builtin/eas-research`（v3.0.0）；去 dev 耦合；明确通用研究 / 代码内部调研边界；不单独加代码 research 分支 | Agent (EASBot) |

---

**最后更新**：2026-08-08
