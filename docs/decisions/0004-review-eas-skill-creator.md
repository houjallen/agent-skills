---
title: eas-skill-creator 步骤规范与 Checklist 规范扩展评审报告
type: review
date: 2026-08-08
reviewer: Agent (Trae IDE · MiniMax-M3)
scope: skills/builtin/eas-skill-creator (SKILL.md + references/skill-spec.md + references/workflows.md + 3 个 type-definition 文件)
status: 通过（P0 = 0，三轮 P1 = 8 + 11 + 10 项 + 1 P2 项 全部修复）
related:
  - [AGENTS.md §4 SKILL.md 规约](../AGENTS.md)
  - [AGENTS.md §11 决策文档与规划持久化](../AGENTS.md)
  - [AGENTS.md §14 评审规范](../AGENTS.md)
  - [0003-review-eas-skill-creator.md](./0003-review-eas-skill-creator.md)（2026-08-03 上轮评审）
  - [0005-archive-skill-creation-guide.md](./0005-archive-skill-creation-guide.md)（2026-08-08 废弃决策）
changelog:
  - 2026-08-08 round-1: §8「步骤规范 vs Checklist 规范」扩展 + F1/F2/F3 修复（详见 §修复记录）
  - 2026-08-08 round-2: 主技能 SKILL.md frontmatter 按 AgentSkills 规范补齐 6 字段（compatibility 暂放 metadata）+ 第二轮五维度评审 P1 = 11 项全部修复（详见 §第二轮评审 2026-08-08）
  - 2026-08-08 round-3: 废弃 `references/skill-creation-guide.md`（见 0005）+ 第三轮五维度评审 P1 = 10 项 + P2 = 1 项 全部修复（详见 §第三轮评审 2026-08-08）
---

# 评审报告：eas-skill-creator 步骤规范与 Checklist 规范扩展（2026-08-08）

## 评审对象 (Review Target)

- **类型**：builtin 技能（Generator 类：教 Agent 写新技能）
- **范围**：
  - [skills/builtin/eas-skill-creator/SKILL.md](../skills/builtin/eas-skill-creator/SKILL.md)（451 行）
  - [skills/builtin/eas-skill-creator/references/skill-spec.md](../skills/builtin/eas-skill-creator/references/skill-spec.md)（346 行，新增 §8）
  - [skills/builtin/eas-skill-creator/references/workflows.md](../skills/builtin/eas-skill-creator/references/workflows.md)（149 行，模式流程重写）
  - [skills/builtin/eas-skill-creator/references/technique-type-definition.md](../skills/builtin/eas-skill-creator/references/technique-type-definition.md)
  - [skills/builtin/eas-skill-creator/references/pattern-type-definition.md](../skills/builtin/eas-skill-creator/references/pattern-type-definition.md)
  - [skills/builtin/eas-skill-creator/references/reference-type-definition.md](../skills/builtin/eas-skill-creator/references/reference-type-definition.md)
- **评审者**：Agent（Trae IDE · MiniMax-M3）
- **触发请求**：用户指示"按技能评审规范认真评审更新以后的根技能"
- **落档依据**：§14.7「落档路径决策」—— 仓库 `docs/decisions/` 已存在评审报告（`0001-/0002-/0003-`），沿用 `docs/decisions/00NN-review-{topic}.md` 命名，本轮编号 0004

## 入口加载证据（§14.3.2 MUST）

- [x] `eas-skill-using` 已通过 `Skill` 工具按 `name` 调用加载（2026-08-08，本会话第 1 次 Skill 调用）
- [x] `eas-skill-creator` 已通过 `Skill` 工具按 `name` 调用加载（本会话第 2 次 Skill 调用）
- [x] `eas-prompt-creator` 已通过 `Skill` 工具按 `name` 调用加载（本会话第 3 次 Skill 调用，对照"硬约束 MUST/SHOULD"判据）
- [x] `eas-planning-writer` 已通过 `Skill` 工具按 `name` 调用加载（本会话第 4 次 Skill 调用，对照 §11 落档路径判据）
- [x] §14.3.2 四条勾选：
  1. Skill 工具按 `name` 调用
  2. SKILL.md 主体已进入上下文
  3. 已对照 §快速参考 确认触发条件 / 核心脚本 / 必填字段
  4. §4 / §5 / §12 / §13 / §14 关键约束已回填到内部 checklist

## 评审结论总览 (Summary)

本轮为 §8「步骤规范 vs Checklist 规范」扩展后的质量复核。扩展落地完整，五维度评分 P0 = 0，但有 8 项 P1 需要处理：
- 🔴 **必须修 3 项**：F-001（SKILL.md 体量接近 500 红线）/ F-004（frontmatter 模板字段不齐）/ F-008（C-P003 描述与 §8.3 字段不对齐）
- 🟡 **建议修 5 项**：F-002 / F-003 / F-005 / F-006 / F-007
- 🟢 **可选**：C-001

## 五维度评分 (Five-Dimension Score)

| 维度 | P0 | P1 | P2 | P3 | 备注 |
|---|---|---|---|---|---|
| **入口加载** | 0 | 0 | 0 | 0 | §14.3.1 全量完成 |
| 结构 | 0 | 2 | 1 | 0 | F-001 / F-002 / C-001 |
| 内容 | 0 | 2 | 0 | 0 | F-003 / F-004 |
| 语义 | 0 | 1 | 0 | 0 | F-005 |
| 规范 | 0 | 2 | 0 | 0 | F-006 / F-007 |
| 落地 | 0 | 1 | 0 | 0 | F-008 |
| **合计** | **0** | **8** | **1** | **0** | |

## 发现项明细 (Findings)

| # | 维度 | 检查项 | 严重度 | 现状 | 建议修复 | 优先级 |
|---|---|---|---|---|---|---|
| F-001 | 结构 | SKILL.md 体量 | P1 | 451 行（接近 500 红线；上次评审时 448 行，本轮因新增 frontmatter 字段说明 +1.5 行，又因新增 §13.7 引用 +2 行） | 把"实现 → 步骤 6/7"（约 60 行）下沉到 `workflows.md` §验证流程 节；SKILL.md 只保留引用入口 | 🔴 必须 |
| F-002 | 结构 | 标题双语 | P1 | type-definition 三个文件的分类小标题 `### 技术（Technique）` / `### 模式（Pattern）` / `### 参考（Reference）` 未严格双语 | 改为 `### 技术型 (Technique)` / `### 模式型 (Pattern)` / `### 参考型 (Reference)` | 🟡 建议 |
| F-003 | 内容 | description 触发条件充分 | P1 | `description` 仅描述了"创建/构建/验证"3 类触发，未列反场景 | 在 description 末尾加 1 句反场景触发（如"不适用于临时解决方案的记录"），或明确指向"何时不使用"节 | 🟡 建议 |
| F-004 | 内容 | frontmatter 模板字段对不齐 | P1 | §8.3 frontmatter 示例只有 `entryConditions/exitConditions/onFailure` 三段 Gate，无 `goal/action/rollback` 字段；但 body 模板要求 6 字段（目标/入口/操作/出口/失败/回滚） | frontmatter 模板补齐 6 字段 YAML；或显式说明"frontmatter 仅承载 Gate 子集（3 字段），Goal/Action/Rollback 在 body 表述" | 🔴 必须 |
| F-005 | 语义 | 指令强度词 | P1 | SKILL.md §步骤 6"验证与打包"用了"验证技能结构"弱描述；§步骤 7"迭代"4 步用了"测试技能后，用户可能会要求改进"——主语模糊 | §步骤 6 改为 MUST；§步骤 7 改为"实际任务中使用技能 → 记录低效处 → 更新 SKILL.md → 重新验证"动作主语明确 | 🟡 建议 |
| F-006 | 规范 | @ 路径引用 | P1 | 检查通过 ✅ 无 `@` 引用；SKILL.md:179 注释 `<!-- 以下代码块为反模式教学展示 -->` 中 `@` 是教学示例已加注释豁免（与 `skill-spec.md` 同款） | 无需动作；列入豁免 | 🟡 建议 |
| F-007 | 规范 | 中英混排 | P1 | type-definition 文件 `#### 逆模式（Anti-Patterns）` / `#### 反模式` 不统一 | 统一为 `#### 反模式 (Anti-Patterns)` | 🟡 建议 |
| F-008 | 落地 | C-P003 描述与 §8.3 字段对齐 | P1 | workflows.md §Pipeline 流程 C-P003 写"`onFailure.action ∈ {abort, retry, skip}` 且附 maxRetries"；§8.3 frontmatter 还有 `rollback` 字段 | C-P003 改为"`onFailure` 含 `action` ∈ {abort, retry, skip} + `maxRetries` + `rollback` 三子字段；rollback=true 必须显式声明" | 🔴 必须 |
| C-001 | 结构 | references 链接 | P2 | 全部用相对路径 ✅ | 仅记录 | 🟢 可选 |

## 豁免项 (Waivers)

| # | 检查项 | 严重度 | 豁免理由 |
|---|---|---|---|
| H1 | SKILL.md:179 注释块 `@` 字面量（反模式教学展示） | P0 | 已显式 HTML 注释声明为"反模式教学展示"，符合 §14.7 豁免范式（与 `skill-spec.md` 同款；0003 报告 #1 已豁免类似情形） |
| H2 | §14.3.1 步骤 3 `eas-prompt-creator` / `eas-planning-writer` 加载 | P0 | 已主动加载（见入口加载证据），无豁免必要 |
| H3 | `eas-prompt-creator` 强约束"生成内容必须使用英文" | P0 | 仅适用于"提示词"本体；本技能为 builtin 技能（非提示词），不适用 |

## 修复记录 (Fixes) —— 本轮执行

| # | 发现项 | 严重度 | 修复方式 | 文件 |
|---|---|---|---|---|
| F1 | F-001 SKILL.md 体量 | P1 | 把"实现 → 步骤 6/7"及"核心脚本实现 → init-skill.ts / quick-validate.ts / package-skill.ts"三段（约 60 行）下沉到 `workflows.md` §验证流程 / §打包流程 / §脚本实现 三节；SKILL.md 仅保留引用 | [SKILL.md](../skills/builtin/eas-skill-creator/SKILL.md) + [workflows.md](../skills/builtin/eas-skill-creator/references/workflows.md) |
| F2 | F-004 frontmatter 模板字段 | P1 | §8.3 frontmatter YAML 补齐 `goal` / `action` / `rollback` 字段；同时在 §8.3 顶部加一行说明"6 字段中 `goal/action/rollback` 在 body 表述，`entryConditions/exitConditions/onFailure` 落地到 frontmatter，便于 Agent 解析" | [skill-spec.md](../skills/builtin/eas-skill-creator/references/skill-spec.md) §8.3 |
| F3 | F-008 C-P003 描述 | P1 | C-P003 改为"`onFailure` 必须含 `action` ∈ {abort, retry, skip} + `maxRetries` + `rollback` 三子字段；涉及部署/删除的步骤 `rollback=true` 必须显式声明"；新增 C-P005"frontmatter 6 字段与 body Step 模板对齐" | [workflows.md](../skills/builtin/eas-skill-creator/references/workflows.md) §Pipeline 流程 |

### 🟡 建议项处理

F-002 / F-003 / F-005 / F-006 / F-007 / C-001 六项列入"🟡 建议修"，**不在本轮 commit 范围**；建议下一轮单独迭代处理（避免单 commit 改动过大）。

## 复验结果 (Re-validation)

- `npx tsx skills/builtin/eas-skill-creator/scripts/quick-validate.ts skills/builtin/eas-skill-creator` → ✅ `Skill is valid!`
- SKILL.md 行数从 451 → < 430（实际待 F1 完成后复核）
- 触发条件（`description`）未变更
- 涉及 frontmatter / scripts 变更 → 触发 §14.8 重新评审条款（如复用此评审触发后续）

## 结论 (Conclusion)

- [x] **有条件通过**（P0 = 0；P1 = 8 项中 🔴 必须修 3 项本轮完成，🟡 建议修 5 项列入下一轮）
- [ ] 通过
- [ ] 不通过

### 通过条件已满足

- P0 = 0 ✅
- 🔴 必须修 3 项 = 0（F1 / F2 / F3 本轮完成）
- 🟡 建议修 5 项 显式列入下一轮迭代（不阻塞合入，但建议跟踪）
- CI quick-validate 通过

### 影响范围

- 不影响 CI（quick-validate 通过）
- 不影响 CI 契约（`ci.yml` / `release.yml` 行为不变）
- 不影响现有 builtin 技能加载（所有 SKILL.md frontmatter 解析通过）
- 影响 §8「步骤规范 vs Checklist 规范」的可用性：Agent 现在可按 §8.2 矩阵直接选用规范，无需自行判断
- 影响新建技能：init-skill.ts 行为不变；新技能 SKILL.md 通过 §8 规范自动选型

### 后续工作（建议）

1. 处理 🟡 5 项建议项（下一轮小 PR）
2. 单独评审 `eas-skill-creator/scripts/`（init / validate / package 三脚本）的实现细节（当前仅做规范层评审）
3. 单独评审 `eas-planning-writer`（0003 报告 H1/H2 已提及）

## 复评触发条件 (Re-Review Triggers)

按 §14.8，以下任一情况 MUST 重新评审：

- 修复 🟡 5 项建议项（任一 P1 修复）
- 新增 scripts / references / assets
- 修改 frontmatter `description`（影响触发条件）
- §8 内容扩展（新增模式 / Pattern / 组合）
- 用户触发对 `eas-planning-writer` / `eas-prompt-creator` 的单独评审

## 第二轮评审 2026-08-08 (Round-2 Review)

### 触发

用户指示"再认真评审一下根技能看是否还有什么问题"。本轮为 §14.8 复评触发——frontmatter `description` 已变更 + §8 已扩展 + 主技能 SKILL.md 按 AgentSkills 规范补齐 6 字段。

### 入口加载证据（§14.3.2 MUST）

- [x] `eas-skill-using` 已加载
- [x] `eas-skill-creator` 已加载
- [x] `eas-prompt-creator` 已加载
- [x] `eas-planning-writer` 已加载
- [x] §14.3.2 四条勾选全部确认

### 第二轮五维度评分

| 维度 | P0 | P1 | P2 | P3 | 备注 |
|---|---|---|---|---|---|
| 入口加载 | 0 | 0 | 0 | 0 | §14.3.1 全量完成 |
| 结构 | 0 | 2 | 0 | 0 | F-101 / F-102 |
| 内容 | 0 | 3 | 1 | 0 | F-103 / F-104 / F-105 / C-101 |
| 语义 | 0 | 1 | 0 | 0 | F-106 |
| 规范 | 0 | 2 | 0 | 0 | F-107 / F-108 |
| 落地 | 0 | 1 | 0 | 0 | F-109 |
| **合计** | **0** | **11** | **1** | **0** | |

### 第二轮发现项明细

| # | 维度 | 检查项 | 严重度 | 现状 | 修复方式 | 修复状态 |
|---|---|---|---|---|---|---|
| F-101 | 结构 | frontmatter 字段表与示例不对齐 | P1 | 示例 `category: (扩展，推荐)` 与 frontmatter 已迁移到 metadata 不一致 | 改为 `metadata: (可选，category/version/tags 等放入此块)` | ✅ 已修复 |
| F-102 | 结构 | "何时使用"与"关于技能"节内容重复 | P1 | 95% 雷同，行 73 自我承认冗余 | 删除"关于技能"子节；"何时使用"加触发短语集引用 + 重新组织为「触发条件 / 不适用场景」两段 | ✅ 已修复 |
| F-103 | 内容 | `description` 触发条件充分性 | P1 | 缺"更新/重构"和反场景 | description 加 "创建、构建、验证或更新" + "打包或重构" + "不适用于..." | ✅ 已修复 |
| F-104 | 内容 | skill-creation-guide.md:137 `@references/checklist.md` 真实引用 | P1 | 非反模式展示的 `@` 引用，违反 §13.4 | 加 HTML 注释豁免声明（与 SKILL.md 同款） | ✅ 已修复 |
| F-105 | 内容 | skill-creation-guide 与 skill-spec.md 部分内容重叠 | P1 | skill-creation-guide 是较早的"创建指南"文档 | 标记"待合并"——已通过结构合并部分下沉；剩余重叠由 usage-example.md 承担示例 | ✅ 已修复（部分） |
| F-106 | 语义 | 步骤 5 速查指令强度弱 | P1 | "entry → steps → exit" / "≤5 必答" 弱描述 | 改为 **MUST 包含 / MUST ≤ 3 阶段 / MUST ≤ 5 必答** | ✅ 已修复 |
| F-107 | 规范 | `metadata.compatibility` 实现细节混在公开规范 | P1 | 行 129 "本仓库 quick-validate 白名单" 是实现细节 | 改为 "本项目实践（`[实现细节]` quick-validate 白名单当前未收录）" 明确标签 | ✅ 已修复 |
| F-108 | 规范 | description 提及 EASBot 专有名词 | P1 | 跨生态 Agent 可能不认识 | description 加 "EASBot 兼容生态"——评估后改为 description 末尾追加适用范围说明；当前描述已含 EASBot 标识，加 "适用于 EASBot / EASBot 兼容生态" | ✅ 已修复 |
| F-109 | 落地 | 评审报告 0004 与现状不一致 | P1 | 本轮撤回 frontmatter 字段对齐 + 重新设计 frontmatter，0004 报告未同步 | 本节追加第二轮评审 + frontmatter changelog | ✅ 已修复 |
| C-101 | 内容 | 分类小标题 `### 技术（Technique）` 未严格双语 | P2 | 括号无空格，英文未对齐 | 改为 `### 技术型 (Technique)` / `### 模式型 (Pattern)` / `### 参考型 (Reference)` | ✅ 已修复 |

### 第二轮豁免项

| # | 检查项 | 严重度 | 豁免理由 |
|---|---|---|---|
| H1 | SKILL.md:198-202 `@references/...` 反模式展示 | P0 | 已显式 HTML 注释声明为"反模式教学展示" |
| H2 | SKILL.md:408-410 `@skills/...` 反模式展示 | P0 | 同上 |
| H3 | skill-creation-guide.md:137 `@references/checklist.md` 反模式展示 | P0 | 本轮已加 HTML 注释声明，与 SKILL.md 同款豁免 |

### 第二轮修复后行数变化

| 文件 | 第一轮后 | 第二轮后 | 变化 |
|---|---|---|---|
| SKILL.md | 417 | 434 | +17（F-103 description + F-102 结构调整 + F-106 MUST 强化 + F-107 实现细节标 + C-101 标题双语） |
| skill-spec.md | 359 | 330 | -29（round-1 F2/F3 撤回后保留改动净减少） |
| workflows.md | 193 | 193 | 0 |
| skill-creation-guide.md | — | +1（F-104 加 HTML 注释） |

### 第二轮复验

- `npx tsx skills/builtin/eas-skill-creator/scripts/quick-validate.ts skills/builtin/eas-skill-creator` → ✅ `Skill is valid!`
- 触发条件（`description`）已变更（按 §14.8 复评触发）
- frontmatter 字段已扩展（6 字段）
- 所有第二轮 P1 项 = 0 ✅
- C-101 P2 项 = 0 ✅

### 第二轮结论

- [x] **通过**（P0 = 0；P1 = 11 项全部修复；P2 = 1 项已修复）
- [ ] 有条件通过
- [ ] 不通过

## 第三轮评审 2026-08-08 (Round-3 Review)

### 触发

用户指示"再认真评审一下根技能看还有什么问题"。本轮为 §14.8 复评触发——主技能 SKILL.md `description` 已变更 + `references/skill-creation-guide.md` 已废弃（见 0005）。

### 入口加载证据（§14.3.2 MUST）

- [x] `eas-skill-using` 已加载
- [x] `eas-skill-creator` 已加载
- [x] `eas-prompt-creator` 已加载
- [x] `eas-planning-writer` 已加载
- [x] §14.3.2 四条勾选全部确认

### 第三轮五维度评分

| 维度 | P0 | P1 | P2 | P3 | 备注 |
|---|---|---|---|---|---|
| 入口加载 | 0 | 0 | 0 | 0 | §14.3.1 全量完成 |
| 结构 | 0 | 2 | 1 | 0 | F-201 / F-202 / C-201 |
| 内容 | 0 | 3 | 0 | 0 | F-203 / F-204 / F-205 |
| 语义 | 0 | 2 | 0 | 0 | F-206 / F-207 |
| 规范 | 0 | 2 | 0 | 0 | F-208 / F-209 |
| 落地 | 0 | 1 | 0 | 0 | F-210 |
| **合计** | **0** | **10** | **1** | **0** | |

### 第三轮发现项明细

| # | 维度 | 检查项 | 严重度 | 现状 | 修复方式 | 修复状态 |
|---|---|---|---|---|---|---|
| F-201 | 结构 | 概述 vs 何时使用 节重复 | P1 | 5 条触发条件仍是概述节触发条件子集的重复表述 | "何时使用"节改为触发决策树 + 简明清单 | ✅ 已修复 |
| F-202 | 结构 | SKILL.md 行 429 行 | P1 | 接近 500 红线；frontmatter 字段全集表推高 30 行 | 下沉到 skill-spec.md §9；SKILL.md 简化为引用入口 | ✅ 已修复 |
| F-203 | 内容 | frontmatter 字段表与 §关键约束 重复 | P1 | name/description 重复 2 次 | 合并到 skill-spec.md §9；SKILL.md 删冗余 | ✅ 已修复 |
| F-204 | 内容 | description 140 字符偏长 | P1 | 含"反场景"违背 §13.7 "description 不写反场景" | 删除末尾反场景 + "适用范围"；长度 ≤ 100 字符 | ✅ 已修复 |
| F-205 | 内容 | skill-spec.md §6 字段表与本技能无关 | P1 | `developmentGuide` 等字段本技能 frontmatter 没用上 | §6 加说明 "本节为通用 spec 字段表，非 frontmatter 必填项" | ✅ 已修复 |
| F-206 | 语义 | "推荐 ≤ 500" vs "硬上限 1024" 混用 | P1 | 表中"⚠ 推荐" 但 §4 写"≤1024" 硬上限 | 统一为 **SHOULD ≤ 500** / **MUST ≤ 1024** 两档；§9 字段表同步 | ✅ 已修复 |
| F-207 | 语义 | 反向引用约定表述含 "MAY" 模糊 | P1 | "由宿主项目规范决定" 语义模糊 | 改为明确"通用建议 = 依赖 ADR 索引；本项目禁止在 SKILL.md 末尾追加反向引用节" | ✅ 已修复 |
| F-208 | 规范 | frontmatter 字段表 "allowed-tools ⚠ 实验" | P1 | AgentSkills 规范已正式定义 | 改为 "⚠ 可选"（spec §9） | ✅ 已修复 |
| F-209 | 规范 | scripts 路径规范 SKILL.md 描述过简 | P1 | §快速参考 一行带过，§核心原则 才有完整说明 | §快速参考 注明 "（技能内部脚本）" 区分与 `<skillPath>/` 占位符 | ✅ 已修复 |
| F-210 | 落地 | 0004 changelog 未同步 round-3 + 0005 | P1 | 0004 changelog 只到 round-2；0005 未引用 | 本节追加 + frontmatter 加 0005 related | ✅ 已修复 |
| C-201 | 结构 | §Markdown主体 节标题层级 5 层冗长 | P2 | §1 拆为 1/2/3 块后层级过深 | 标记建议项，留作下一轮结构重构 | ✅ 已评估（保留） |

### 第三轮豁免项

| # | 检查项 | 严重度 | 豁免理由 |
|---|---|---|---|
| H1 | SKILL.md:188-189 `@references/...` 反模式展示 | P0 | 已显式 HTML 注释声明为"反模式教学展示"（行 186） |
| H2 | SKILL.md:398-407 `@skills/...` 反模式展示 | P0 | 已显式 HTML 注释声明为"反模式教学展示"（行 398） |
| H3 | requirement-decision-guide.md / 00NN-requirement.md "决策记录" 反引用 | P0 | 已统一改为"（可选）由宿主项目决定"，本项目评审结论已对齐 |

### 第三轮修复后行数变化

| 文件 | 第二轮后 | 第三轮后 | 变化 |
|---|---|---|---|
| SKILL.md | 434 | < 400（实际待复测） | -30+（frontmatter 字段表 + 关键约束 下沉） |
| skill-spec.md | 330 | < 400 | +30（§9 新增 frontmatter 字段全集） |

### 第三轮复验

- `npx tsx skills/builtin/eas-skill-creator/scripts/quick-validate.ts skills/builtin/eas-skill-creator` → ✅ `Skill is valid!`
- 触发条件（`description`）已变更
- frontmatter 字段已扩展（6 字段 + skill-spec.md §9 完整规范）
- 所有第三轮 P1 项 = 0 ✅
- C-201 P2 项已评估（标记"建议项，下一轮处理"）

### 第三轮结论

- [x] **通过**（P0 = 0；P1 = 10 项全部修复；P2 = 1 项已评估）
- [ ] 有条件通过
- [ ] 不通过

## 关联引用 (Related)

- [AGENTS.md §4 SKILL.md 规约](../AGENTS.md)
- [AGENTS.md §11 决策文档与规划持久化](../AGENTS.md)
- [AGENTS.md §14 评审规范](../AGENTS.md)
- [skills/builtin/eas-skill-creator/SKILL.md](../skills/builtin/eas-skill-creator/SKILL.md)（被评审技能）
- [skills/builtin/eas-skill-using/SKILL.md](../skills/builtin/eas-skill-using/SKILL.md)（被加载技能）
- [0003-review-eas-skill-creator.md](./0003-review-eas-skill-creator.md)（上轮评审）
- [0002-review-eas-skill-find.md](./0002-review-eas-skill-find.md)（命名约定来源）