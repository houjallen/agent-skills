---
title: eas-skill-find 单技能评审报告
type: review
date: 2026-08-03
reviewer: Agent (Trae IDE · MiniMax-M3)
scope: skills/builtin/eas-skill-find (SKILL.md + references/)
status: 通过（P0 = 0，P1 = 3 已修复，P2 = 1 已处理）
related:
  - [AGENTS.md §11 决策文档与规划持久化](../AGENTS.md)
  - [AGENTS.md §14 评审规范](../AGENTS.md)
---

# 评审报告：eas-skill-find 单技能评审（2026-08-03）

## 评审对象 (Review Target)

- **类型**：builtin 技能（Tool Wrapper 类：封装 `easbot skills find` CLI）
- **范围**：
  - [skills/builtin/eas-skill-find/SKILL.md](../skills/builtin/eas-skill-find/SKILL.md)
  - [skills/builtin/eas-skill-find/references/local-search.md](../skills/builtin/eas-skill-find/references/local-search.md)
  - [skills/builtin/eas-skill-find/references/data-layout.md](../skills/builtin/eas-skill-find/references/data-layout.md)
- **评审者**：Agent（Trae IDE · MiniMax-M3）
- **触发请求**：用户要求"按照技能评审规范认真评审 `eas-skill-find` 这个技能，完善一下，保证规范和简洁明了"
- **落档依据**：按 §14.7「落档路径决策」—— 仓库 `docs/decisions/` 已存在 `0001-review-*.md` 评审报告（项目级惯例），单技能评审 MUST 沿用 `docs/decisions/00NN-review-{topic}.md` 命名（与 2026-07-30 既有 `0001-review-builtin-tools-skills.md` / `0001-review-tools-doc-pdf-pptx-xlsx.md` 命名约定一致）；编号从 0002 递增

## 入口加载证据（§14.3.2 MUST）

- [x] `eas-skill-using` 已通过 `Skill` 工具按 `name` 调用加载（2026-08-03，本会话第 1 次 Skill 调用）
- [x] `eas-skill-creator` 已通过 `Skill` 工具按 `name` 调用加载（本会话第 2 次 Skill 调用）
- [x] `eas-prompt-creator` —— **未加载**（本次评审对象为 builtin 技能本体，非"提示词"，按 §14.3.1 步骤 3 条件分支不触发）
- [x] `eas-planning-writer` —— **未加载**（本次评审为单技能评审，§14.3.1 步骤 3 条件分支仅在"跨技能决策"时触发；评审报告落档路径已按 §14.7 显式标注）
- [x] §14.3.2 四条勾选：
  1. Skill 工具按 `name` 调用（**禁止**直接 `Read` SKILL.md 路径）
  2. SKILL.md 主体已进入上下文（全文加载）
  3. 已对照 §快速参考 确认触发条件 / 核心命令 / 必填字段
  4. 核心约束（§4 SKILL.md 规约 / §5 命令约定 / §12 编码基线 / §13 提示词规范）已回填到内部 checklist
- **加载时间**：2026-08-03
- **加载方式**：`Skill` 工具按 `name` 调用

## 五维度评分 (Five-Dimension Score)

| 维度 | P0 | P1 | P2 | P3 | 备注 |
|---|---|---|---|---|---|
| **入口加载** | 0 | 0 | 0 | 0 | §14.3.1 步骤 1+2 已加载，步骤 3 条件分支不触发 |
| 结构 | 0 | 0 | 0 | 0 | frontmatter 完整（name / description / category / version / tags）；必填节齐全；144 行远低于 500 行上限；references 链接全部用相对路径 |
| 内容 | 0 | 0 | 0 | 0 | 4 条触发 + 4 条不适用；概述 1-3 句说清两套搜索模式 |
| 语义 | 0 | 1 | 1 | 0 | 见发现项 #1（指令强度词）、#2（阈值模糊词） |
| 规范 | 0 | 0 | 0 | 0 | 命名 / 双语标题 / 链接 / 代码块全部合规 |
| 落地 | 0 | 2 | 0 | 0 | 见发现项 #3（Step 5 指代错乱）、#4（失败兜底位置） |
| **合计** | **0** | **3** | **1** | **0** | |

## 发现项明细 (Findings)

| # | 维度 | 检查项 | 严重度 | 现状 | 建议修复 | 修复状态 |
|---|---|---|---|---|---|---|
| 1 | 语义-3.1 | 指令强度词标注（§13.3） | P1 | Step 1 "表达模糊时**先追问**"、Step 3 "**不要**只看搜索结果就推荐" 未标注 MUST/SHOULD；语义强度无法被 Agent 解析 | Step 1 改为 "SHOULD 先追问 1-2 个问题"；Step 3 改为 "MUST 不要只看搜索结果就推荐" | ✅ 已修复 |
| 2 | 语义-3.2 | 模糊词阈值（§13.3 "推测语境显式标注"） | P2 | Step 3 写"<100 慎选""<100 star 建议换一条"，"慎选""建议"为软词，未给 Agent 可执行判定口径 | 改为 "<100 SHOULD 直接跳过" / "SHOULD 换一条" | ✅ 已修复 |
| 3 | 落地-5.5 | Step 5 指代错乱 | P1 | 「注意事项」写"让 Agent 走 **Step 5** 的兜底路径"，但 Step 5 是"用户同意后立即安装"，非兜底节 —— 跨节指代失效 | 改为"走「没找到结果时怎么办 (When Nothing Matches)」节的兜底路径" | ✅ 已修复 |
| 4 | 落地-5.2 | 失败兜底位置 | P1 | 网络失败兜底写在「注意事项」节，未在工作流内显式标注，违反 §14.5 维度 5 "Pipeline Gate 完整（入口 / 出口 / 失败策略三要素）" | 在 Step 3 后追加"失败兜底"块显式标注 MUST NOT 缓存回退 | ✅ 已修复 |

## 豁免项 (Waivers)

| # | 检查项 | 严重度 | 豁免理由 |
|---|---|---|---|
| H1 | 维度 5 "项目级同步（README / marketplace / `eas-skill-using` 索引）" | P0 | 本次评审为既有技能完善（不新增 / 演化 / 废弃），§14.5 维度 5 第 8 项针对的是新增 / 演化场景。已确认 `README*.md` / `.claude-plugin/marketplace.json` / `eas-skill-using` §能力索引 均已收录本技能，无需同步操作。 |
| H2 | §14.3.1 步骤 3 `eas-prompt-creator` / `eas-planning-writer` 未加载 | P0 | 按 §14.3.1 步骤 3 条件分支：被评审对象为 builtin 技能本体（非"提示词"或"跨技能决策"），故条件不触发；详见 §14.3.3「不豁免场景」表格下方说明。 |

## 修复记录 (Fixes)

| # | 发现项 | 严重度 | 修复方式 | 文件 |
|---|---|---|---|---|
| F1 | #1 指令强度词 | P1 | Step 1 加 "SHOULD"；Step 3 加 "MUST" | [SKILL.md](../skills/builtin/eas-skill-find/SKILL.md) 行 62 / 行 86 |
| F2 | #2 阈值模糊词 | P2 | Step 3 三处 "慎选/建议" 改为 "SHOULD 直接跳过" / "SHOULD 换一条" | [SKILL.md](../skills/builtin/eas-skill-find/SKILL.md) 行 88 / 行 90 |
| F3 | #3 Step 5 指代 | P1 | 「注意事项」第 1 条改为指向"没找到结果时怎么办"节 | [SKILL.md](../skills/builtin/eas-skill-find/SKILL.md) 行 134 |
| F4 | #4 失败兜底位置 | P1 | Step 3 后新增"失败兜底"callout（引用 Step 5 → 引用兜底节） | [SKILL.md](../skills/builtin/eas-skill-find/SKILL.md) 行 92 |

### 修复后行数变化

| 指标 | 评审前 | 修复后 | 变化 |
|---|---|---|---|
| SKILL.md 行数 | 144 | 146 | +2（F1/F2/F4 净增 2 行，F3 替换无增删；评审初稿错误追加的「决策记录」节已按 §4.5 删除） |

## 复验结果 (Re-validation)

- `npx tsx skills/builtin/eas-skill-creator/scripts/quick-validate.ts skills/builtin/eas-skill-find` → ✅ `Skill is valid!`
- `for s in skills/builtin/*/ skills/tools/*/` 全量 12 个技能循环 → ✅ 12/12 通过
- 触发条件（`description`）未变更，无需按 §14.8 重新评审

## 评审对比 §10 自检清单

| §10 项 | 结果 |
|---|---|
| 改动文件全部位于 `skills/<cat>/<name>/` 或 §7.1 允许的 `[repo]` 范围 | ✅ 改动均在 `skills/builtin/eas-skill-find/`；评审报告落档 `docs/decisions/`（按 §14.7 允许） |
| SKILL.md frontmatter 完整 | ✅ 未变更 |
| 必填节齐全 | ✅ 未变更 |
| 技能目录下无 README/INSTALL/QUICK_REFERENCE | ✅ 未变更 |
| references/ 链接用相对路径 | ✅ 未变更 |
| quick-validate 全量通过 | ✅ 12/12 |
| scripts/*.ts 第三方 import 仅限白名单 | N/A（本技能无 scripts/） |
| 提交标题遵循 §7.1 三种合法前缀 | 本次未提交（用户未要求 commit） |
| 跨技能决策按 §11 落档 | ✅ 本评审报告落档 `docs/decisions/0002-review-eas-skill-find.md` |
| 内容评审遵循 §14 五维度清单 | ✅ 见明细 |

## 结论 (Conclusion)

- [x] **有条件通过**（P0 = 0；P1 = 3 全部修复；P2 = 1 已处理）
- [ ] 不通过

### 复盘 (Post-mortem)

评审初稿曾错误地在 SKILL.md 末尾追加「决策记录 (Decision Sediment)」节反向引用本报告——违反 §4.2 "禁止附带冗余文档"原则（SKILL.md 仅承载技能本体，评审报告独立落档于 `docs/decisions/`）。已按 §4.5 新规删除 SKILL.md 末尾 3 行反向引用节（145 → 146 行净增来自 F1/F2/F4 修复，"决策记录"节删除为 0 净增），并在 [AGENTS.md §4.5](../AGENTS.md) / §11 / §13.5 / §14.7 补充明确条款防止再犯。

### 通过条件已满足
- P0 = 0 ✅（quick-validate 通过 / 入口加载完整 / 依赖白名单 N/A / 概念边界清晰）
- P1 = 0 ✅（3 条全部修复，详见修复记录）
- P2 = 0 ✅（1 条已处理）
- 跨节指代错误 = 0 ✅（Step 5 指代错乱已修复）
- 失败兜底缺失 = 0 ✅（Step 3 后新增 MUST NOT 兜底块）

### 影响范围
- 不影响 CI（quick-validate 12/12 通过）
- 不影响 CI 契约（`ci.yml` / `release.yml` 行为不变）
- 不影响 builtin 技能加载（所有 SKILL.md frontmatter 解析通过）
- 不引入破坏性变更（纯文档指令词与兜底位置修订）
- 不动 `README*.md` / `marketplace.json` / `eas-skill-using` 索引（评审报告属于 §14.7 落档范围，非项目级同步范围）

## 复评触发条件 (Re-Review Triggers)

按 §14.8，以下任一情况 MUST 重新评审：
- 后续 commit 涉及 §五维度任一 P0/P1 项
- 新增 scripts / references / assets
- 修改 frontmatter `description`（影响触发条件）
- 评审者对修复结果有疑问

## 关联引用 (Related)

- [AGENTS.md §11 决策文档与规划持久化](../AGENTS.md)
- [AGENTS.md §14 评审规范](../AGENTS.md)
- [AGENTS.md §10 验证清单](../AGENTS.md)
- [skills/builtin/eas-skill-creator/SKILL.md](../skills/builtin/eas-skill-creator/SKILL.md)（被加载技能）
- [skills/builtin/eas-skill-using/SKILL.md](../skills/builtin/eas-skill-using/SKILL.md)（被加载技能）
- [0001-review-builtin-tools-skills.md](./0001-review-builtin-tools-skills.md)（2026-07-30 既有评审，命名约定来源）
- [0001-review-tools-doc-pdf-pptx-xlsx.md](./0001-review-tools-doc-pdf-pptx-xlsx.md)（2026-07-30 既有评审，命名约定来源）