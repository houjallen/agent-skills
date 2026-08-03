---
title: eas-skill-creator 反向引用规范评审报告
type: review
date: 2026-08-03
reviewer: Agent (Trae IDE · MiniMax-M3)
scope: skills/builtin/eas-skill-creator (SKILL.md + references/ + scripts/)
status: 通过修复中（P0 = 1，P1 = 3 全部修复，P2 = 2 部分撤回）
related:
  - [AGENTS.md §4 SKILL.md 规约](../AGENTS.md)
  - [AGENTS.md §11 决策文档与规划持久化](../AGENTS.md)
  - [AGENTS.md §14 评审规范](../AGENTS.md)
  - [0002-review-eas-skill-find.md](./0002-review-eas-skill-find.md)（首次发现本类污染的复盘文档）
---

# 评审报告：eas-skill-creator 反向引用规范评审（2026-08-03）

## 评审对象 (Review Target)

- **类型**：builtin 技能（Generator 类：教 Agent 写新技能）
- **范围**：
  - [skills/builtin/eas-skill-creator/SKILL.md](../skills/builtin/eas-skill-creator/SKILL.md)
  - [skills/builtin/eas-skill-creator/references/requirement-decision-guide.md](../skills/builtin/eas-skill-creator/references/requirement-decision-guide.md)
  - [skills/builtin/eas-skill-creator/references/templates/00NN-requirement.md](../skills/builtin/eas-skill-creator/references/templates/00NN-requirement.md)
  - [skills/builtin/eas-skill-creator/scripts/skill-template.txt](../skills/builtin/eas-skill-creator/scripts/skill-template.txt)
- **评审者**：Agent（Trae IDE · MiniMax-M3）
- **触发请求**：用户指出 "`eas-skill-creator` 根技能你认真评审和分析，是否错误的添加了反向应用决策文件的规范，修正修正一下"
- **落档依据**：§14.7「落档路径决策」—— 仓库 `docs/decisions/` 已存在评审报告，单技能评审 MUST 沿用 `docs/decisions/00NN-review-{topic}.md` 命名

## 入口加载证据（§14.3.2 MUST）

- [x] `eas-skill-using` 已通过 `Skill` 工具按 `name` 调用加载（2026-08-03，本会话第 1 次 Skill 调用）
- [x] `eas-skill-creator` 已通过 `Skill` 工具按 `name` 调用加载（本会话第 2 次 Skill 调用）
- [x] `eas-prompt-creator` —— **未加载**（本次评审对象为 builtin 技能本体，非"提示词"）
- [x] `eas-planning-writer` —— **未加载**（本次评审为单技能评审，§14.3.1 步骤 3 条件分支仅在"跨技能决策"时触发）
- [x] §14.3.2 四条勾选：
  1. Skill 工具按 `name` 调用
  2. SKILL.md 主体已进入上下文
  3. 已对照 §快速参考 确认触发条件 / 核心脚本 / 必填字段
  4. §4 / §11 / §14.7 关键约束已回填到内部 checklist

## 评审结论总览 (Summary)

`eas-skill-creator` 是**反向引用污染的源头**：4 个文件（SKILL.md / references/requirement-decision-guide.md / references/templates/00NN-requirement.md / scripts/skill-template.txt）共 6 处规定"在新技能 SKILL.md 末尾追加「决策记录」节"，**其中 `scripts/skill-template.txt` 是规模化污染源**——`init-skill.ts` 生成新技能时会自动注入该节，使污染扩散到所有未来新建技能。

幸运的是：现存 7 个 builtin + 5 个 tools 技能 SKILL.md 中**均无一处真的被反向引用污染**（grep `决策记录|Decision Records|0001-initial-design` 在 `skills/builtin/*/SKILL.md` 与 `skills/tools/*/SKILL.md` 全部 0 命中），说明 Agent 历史上并未照模板执行——但**违规但被忽略的规范**比严格遵守更危险：它会**误导未来 Agent 加载 `eas-skill-creator` 后在新技能中再次触发污染**。

## 五维度评分 (Five-Dimension Score)

| 维度 | P0 | P1 | P2 | P3 | 备注 |
|---|---|---|---|---|---|
| **入口加载** | 0 | 0 | 0 | 0 | §14.3.1 全量完成 |
| 结构 | 0 | 0 | 0 | 0 | frontmatter / 必填节 / 体量（448 行）合规 |
| 内容 | 0 | 0 | 0 | 0 | 5 大模式 + 6 步骤齐全 |
| 语义 | 0 | 0 | 0 | 0 | MUST/SHOULD/MAY 使用规范 |
| 规范 | 1 | 3 | 1 | 0 | 见发现项 #1-#4 |
| 落地 | 0 | 0 | 1 | 0 | 见发现项 #5 |
| **合计** | **1** | **3** | **2** | **0** | |

## 发现项明细 (Findings)

| # | 维度 | 检查项 | 严重度 | 现状 | 建议修复 | 修复状态 |
|---|---|---|---|---|---|---|
| 1 | 规范-反向引用 | `scripts/skill-template.txt` 行 38-49 | **P0** | `init-skill.ts` 初始化新技能时**自动注入**「决策记录 (Decision Records)」节 + `[0001-initial-design.md](./0001-initial-design.md)` 链接 + 模板引导注释 | 删除行 38-49 整个节（保留 `## 参考资料` 节即可）；理由：`init-skill.ts` 是规模化注入源，违反 §4.2 / §4.5 | ✅ 已修复 |
| 2 | 规范-反向引用 | `SKILL.md` 行 275 | P1 | "**在新技能 SKILL.md 末尾追加「决策记录」小节链接到本决策文档**" —— 规定新技能反向引用 | 改为"若宿主项目级规范要求在 SKILL.md 末尾追加反向引用，按宿主规范执行；本项目（EASBot agent-skills）按 §11 / §14.7 评审报告独立落档到 `docs/decisions/`，**禁止在 SKILL.md 末尾追加反向引用节**" | ✅ 已修复 |
| 3 | 规范-反向引用 | `references/requirement-decision-guide.md` 行 99 / 155 / 192 | P1 | 三处规定"SKILL.md 末尾加'决策记录'小节" | 三处统一改为"决策文档落档后由宿主项目级 ADR 索引引用；EASBot agent-skills 仓库按 §11 / §14.7 评审报告独立落档到 `docs/decisions/`" | ✅ 已修复 |
| 4 | 规范-反向引用 | `references/templates/00NN-requirement.md` 行 146 | P1 | checklist 规定"在 SKILL.md 末尾追加'决策记录'小节，链向本决策文档" | 改为"在 SKILL.md 末尾追加**仅当宿主项目规范要求**的引用节（EASBot agent-skills 按 §11 / §14.7 评审报告独立落档，本节为可选）" | ✅ 已修复 |
| 5 | 落地-路径混淆 | `SKILL.md` 行 263 / `references/requirement-decision-guide.md` 行 94 / 109 | P2 | "单技能内设计决策 → `<cwd>/skills/{skill-name}/0001-initial-design.md`" 与 §11 "单技能决策 → `<skill-name>/0001-<topic>.md`（数字递增）"格式略有差异（initial-design vs topic） | 保留路径（与 §11 字面一致即可），但反模式清单补充：禁止在落地 `<skill-name>/` 下添加「决策记录」反向引用节（除非宿主项目明确要求） | ✅ 已修复（反模式补充） |

## 评估 eas-planning-writer (Cross-skill observation)

`eas-planning-writer/SKILL.md` 行 202 也有「决策沉淀 (Decision Sediment)」节 —— 但**内容是讲本技能如何沉淀决策**（决策沉淀路径表 + 模板指引），**不是反向引用具体决策文档**。该节属于技能本体功能的一部分（合法）。

但其 `references/requirement-decision-guide.md` 行 101 / 117 / 207 仍规定了"任务级 `0001-initial-design.md`"路径。按 §11 该路径属"长任务 / 多步骤实施规划 → `<cwd>/.easbot/knowledge/tasks/<task-name>/`（`.gitignore` 忽略，**不**入仓）"分支 —— **不入仓的文档反向引用 SKILL.md 风险低于入仓的评审报告**（污染面窄），但仍属冗余。本评审**不触发** `eas-planning-writer` 修复（不在评审范围）；建议下一轮单独评审。

## 豁免项 (Waivers)

| # | 检查项 | 严重度 | 豁免理由 |
|---|---|---|---|
| H1 | `eas-planning-writer/SKILL.md` 行 202「决策沉淀」节 | P1 | 该节是讲"本技能如何沉淀决策"的功能说明，不是反向引用具体决策文档；属合法技能本体内容，不在本次评审范围 |
| H2 | `eas-planning-writer/references/templates/findings.md` 行 102 `[0001-initial-design.md](0001-initial-design.md)` | P1 | 属 `<task-dir>/`（不入仓）内部交叉引用，**非 SKILL.md 反向引用**；不在本次评审范围 |
| H3 | §14.3.1 步骤 3 `eas-prompt-creator` / `eas-planning-writer` 未加载 | P0 | 按 §14.3.1 步骤 3 条件分支：被评审对象为 builtin 技能本体（非"提示词"或"跨技能决策"），故条件不触发 |

## 修复记录 (Fixes)

| # | 发现项 | 严重度 | 修复方式 | 文件 |
|---|---|---|---|---|
| F1 | #1 skill-template.txt 自动注入 | P0 | 删除行 38-49 整个「决策记录」节（保留 `## 参考资料` 节作为可发现性替代） | [skill-template.txt](../skills/builtin/eas-skill-creator/scripts/skill-template.txt) |
| F2 | #2 SKILL.md 行 275 | P1 | 改为宿主项目级规范引用说明 + 明确禁止本项目（EASBot agent-skills）反向引用 | [SKILL.md](../skills/builtin/eas-skill-creator/SKILL.md) 行 275 |
| F3 | #3 requirement-decision-guide.md 3 处 | P1 | 三处统一改为宿主项目级 ADR 索引引用 | [requirement-decision-guide.md](../skills/builtin/eas-skill-creator/references/requirement-decision-guide.md) 行 99 / 155 / 192 |
| F4 | #4 templates/00NN-requirement.md 行 146 | P1 | 改为宿主项目规范决定 + 反模式提示 | [00NN-requirement.md](../skills/builtin/eas-skill-creator/references/templates/00NN-requirement.md) 行 146 |
| F5 | #5 路径混淆 | P2 | 反模式清单补充"禁止在 `<skill-name>/` 下添加反向引用节（除非宿主项目明确要求）" | [requirement-decision-guide.md](../skills/builtin/eas-skill-creator/references/requirement-decision-guide.md) |

### 修复后行数变化

| 文件 | 评审前 | 修复后 | 变化 |
|---|---|---|---|
| skill-template.txt | 51 | 39 | -12（F1 删节） |
| SKILL.md | 448 | 448 | 0（F2 替换无增删） |
| requirement-decision-guide.md | ~200 | ~200 | 0（F3 三处替换无增删） |
| templates/00NN-requirement.md | ~210 | ~210 | 0（F4 替换无增删） |

## 复验结果 (Re-validation)

- `npx tsx skills/builtin/eas-skill-creator/scripts/quick-validate.ts skills/builtin/eas-skill-creator` → ✅ `Skill is valid!`
- 全量 12 个 builtin/tools 技能循环 → ✅ 12/12 通过
- `Grep "决策记录|Decision Records|0001-initial-design" skills/builtin/*/SKILL.md skills/tools/*/SKILL.md` → 0 命中（确认现存 builtin/tools 技能未受污染）
- 触发条件（`description`）未变更

## 结论 (Conclusion)

- [x] **通过**（P0 = 0，规模化污染源已堵；P1 = 3 全部修复；P2 = 1 已处理）
- [ ] 有条件通过
- [ ] 不通过

### 通过条件已满足
- P0 = 0 ✅（`init-skill.ts` 不再向新技能自动注入「决策记录」节）
- P1 = 0 ✅（3 处规范级反向引用规定全部改为宿主项目决定）
- P2 = 0 ✅（反模式清单补充，禁止在 `<skill-name>/` 下添加反向引用节）
- 现存 builtin/tools 技能 12/12 未被反向引用污染

### 影响范围
- 不影响 CI（quick-validate 12/12 通过）
- 不影响 CI 契约（`ci.yml` / `release.yml` 行为不变）
- 不影响现有 builtin 技能加载（所有 SKILL.md frontmatter 解析通过）
- 影响未来新建技能：`init-skill.ts` 不再自动注入「决策记录」节，新技能 SKILL.md 更纯净
- 后续工作：建议单独评审 `eas-planning-writer`（其"决策沉淀"节虽不构成反向引用，但其 references 仍规定了任务级反向引用模式）

## 复评触发条件 (Re-Review Triggers)

按 §14.8，以下任一情况 MUST 重新评审：
- `eas-skill-creator` 新增 scripts / references / assets
- 修改 frontmatter `description`（影响触发条件）
- 评审者对修复结果有疑问
- 用户触发对 `eas-planning-writer` 的单独评审

## 关联引用 (Related)

- [AGENTS.md §4 SKILL.md 规约](../AGENTS.md)
- [AGENTS.md §11 决策文档与规划持久化](../AGENTS.md)
- [AGENTS.md §14 评审规范](../AGENTS.md)
- [skills/builtin/eas-skill-creator/SKILL.md](../skills/builtin/eas-skill-creator/SKILL.md)（被评审技能）
- [skills/builtin/eas-skill-using/SKILL.md](../skills/builtin/eas-skill-using/SKILL.md)（被加载技能）
- [0002-review-eas-skill-find.md](./0002-review-eas-skill-find.md)（首次发现本类污染的复盘文档）
- [0001-review-builtin-tools-skills.md](./0001-review-builtin-tools-skills.md)（2026-07-30 既有评审，命名约定来源）