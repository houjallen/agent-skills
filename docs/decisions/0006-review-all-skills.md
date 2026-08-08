---
type: review
title: 评审报告：所有 builtin + tools 技能（12 个）批量合规审查
date: 2026-08-08
scope: skills/builtin/* (7) + skills/tools/* (5)
reviewer: Agent (小莫)
trigger: 用户请求「使用 eas-skill-creator 技能评审 e:\work\apps\eas\agent-skills\skills 所有技能的问题」
related: 0001-review-builtin-tools-skills.md, 0001-review-tools-doc-pdf-pptx-xlsx.md, 0002-review-eas-skill-find.md, 0003-review-eas-skill-creator.md, 0004-review-eas-skill-creator.md
---

# 评审报告：所有 builtin + tools 技能（2026-08-08）

## 评审对象 (Review Object)

- **类型**：跨技能批量评审（项目级 §14.2 "项目级变更 / 跨技能决策"）
- **范围**：全部 12 个 SKILL.md + frontmatter + marketplace.json + 项目级同步状态
  - builtin：`eas-skill-creator` / `eas-skill-find` / `eas-skill-using` / `eas-planning-writer` / `eas-agent-evolution` / `eas-agent-creation` / `eas-prompt-creator`
  - tools：`eas-chinese-writer` / `eas-pptx` / `eas-xlsx` / `eas-pdf` / `eas-docx`
- **评审者**：Agent (小莫)

## 入口加载证据 (Entry Skill Load Evidence, §14.3.2 MUST)

- [x] `eas-skill-using` 已通过 `Skill` 工具以 `name` 调用加载（**禁止**直接 `Read` SKILL.md 路径）
- [x] `eas-skill-creator` 已通过 `Skill` 工具以 `name` 调用加载
- [x] 已阅读 `eas-skill-using` §能力索引 + §场景映射 + §决策辅助 + §关键概念
- [x] 已阅读 `eas-skill-creator` §快速参考 + §脚本调用路径规范 + §五大模式 + §Skill Spec 引用
- [x] §14.3.2 四条勾选已逐条确认；约束已回填到本评审内部 checklist

> **加载时间**：2026-08-08
> **未触发额外加载理由**：本批评审对象是 SKILL.md 合规性（结构 / 内容 / 规范），不涉及提示词模板编写细节或跨技能规划沉淀，故未额外加载 `eas-prompt-creator` / `eas-planning-writer`（按 §14.3.3 例外允许；本评审目的与这两个技能的产出物不对齐）。

## 机械校验结果 (Mechanical Validation)

**全部 12 个技能跑 `quick-validate.ts` 均返回 ✅**。frontmatter / `name` (hyphen-case, ≤64) / `description` (≤1024, 第三人称, 无尖括号) 全部通过。

| # | 技能 | SKILL.md 行数 | SKILL.md 字节 | scripts/ | references/ | assets/ | 必填三节 | @ 引用 | description 长度 |
|---|---|---:|---:|:---:|:---:|:---:|:---:|---:|---:|
| 1 | eas-skill-creator | 359 | 29 254 | Y | Y | N | 概述✓/何时使用✓/快速参考✓ | 0 | 75 |
| 2 | eas-skill-find | 103 | 7 301 | N | Y | N | ✓✓✓ | 0 | 170 |
| 3 | eas-skill-using | 210 | 16 152 | N | N | N | ✓✓✓ | 0 | 111 |
| 4 | eas-planning-writer | 174 | 11 818 | Y | Y | N | ✓✓⚠ 用「快速开始」替代「快速参考」 | 0 | 89 |
| 5 | eas-agent-evolution | 179 | 8 936 | Y | Y | Y | ✓✓✓ | 0 | 83 |
| 6 | eas-agent-creation | 351 | 13 607 | N | Y | N | ✓✓✓ | 0 | 76 |
| 7 | eas-prompt-creator | 172 | 8 019 | N | Y | N | ✓✓✓ | 0 | 158 |
| 8 | eas-chinese-writer | 139 | 8 684 | N | Y | N | ✓✓✓ | 0 | 110 |
| 9 | eas-pptx | 472 | 27 484 | Y | Y | N | ✓✓✓ | 0 | 313 |
| 10 | eas-xlsx | 152 | 12 069 | Y | Y | Y | ✓✓✓ | 0 | 238 |
| 11 | eas-pdf | 196 | 13 808 | Y | Y | N | ✓✓✓ | 0 | 224 |
| 12 | eas-docx | 196 | 14 477 | Y | Y | N | ✓✓✓ | 0 | 281 |

## 五维度评分 (Five-Dimension Scorecard)

| 维度 | P0 | P1 | P2 | P3 | 备注 |
|---|---:|---:|---:|---:|---|
| **入口加载** (§14.5 维度 1 第 1 项) | 0 | 0 | 0 | 0 | §14.3.1 / §14.3.2 全部满足 |
| 结构 (Structure) | 0 | 5 | 6 | 0 | H1 标题形式不一致（4 处 P1）+ 章节双语化欠一致（P2） |
| 内容 (Content) | 0 | 1 | 2 | 0 | 「快速参考」节缺失 1 处 P1（已在 eas-planning-writer 标 P1）；其它 P2 |
| 语义 (Semantics) | 0 | 0 | 1 | 0 | 未发现 MUST/SHOULD 混用；H1 命名不统一属 P2 |
| 规范 (Compliance) | 0 | 0 | 0 | 0 | LF / 2 空格 / 无 @ 引用 / 代码块语言标记 / 命名规范全部通过；脚本依赖白名单合规 |
| 落地 (Actionability) | 9 | 4 | 0 | 0 | **项目级同步缺口**：8 个技能 marketplace.json 与 frontmatter.description 不一致（P0）；2 个技能版本不一致（P0） |

**总计**：P0 = 9 / P1 = 10 / P2 = 9 / P3 = 0

> **通过条件**：所有 P0 = 0 才能「通过」。本批评审发现 **P0 = 9 项**（集中在项目级同步缺口），按 §14.6 处理规则「P0 = 阻塞：禁止合入」。

## 发现项明细 (Findings Detail)

### P0：项目级同步（AGENTS.md §6.2 / §14.5 维度 5「项目级同步」P0）

> **通则**：AGENTS.md §6.2「演化 (Evolve)」明文要求 — frontmatter `description` 改了 → 同步 `README*.md` 表格描述；版本不一致 → 同步 marketplace.json；新建 builtin 技能 → 同步 `eas-skill-using` 索引。**`marketplace.json` 是项目级交付物，不同步即视为失同步**。

| # | 维度 | 检查项 | 技能 | 严重度 | 现状 | 建议修复 |
|---|---|---|---|:---:|---|---|
| P0-1 | 落地 | marketplace.json description 与 SKILL.md frontmatter.description 一致 | `eas-skill-creator` | **P0** | mp:`"该技能应用于创建、构建和验证EASBot技能..."`；fm:`"该技能应用于创建、构建、验证**或更新**EASBot技能..."` | 以 fm 为准同步 mp（或反过来统一语义）；若 fm 新增的"或更新"与"或重构"是新增能力，应 bump version |
| P0-2 | 落地 | marketplace.json description 与 fm description 一致 | `eas-skill-find` | **P0** | mp 缺「本地已装 / store 内技能检索（`--local` / `--path`）」段；fm 含 | 以 fm 为准同步 mp |
| P0-3 | 落地 | marketplace.json description 与 fm description 一致 | `eas-planning-writer` | **P0** | mp: `"跨 session、需要持久化进度的复杂任务...task_plan / findings / progress"`；fm: `"跨 session、需要持久化进度、需要事后 Review **或文档化**...多日推进、多阶段实施、需要决策追溯"` | fm 显式扩展了使用场景（多日推进 / 多阶段 / 决策追溯），需以 fm 同步 mp |
| P0-4 | 落地 | marketplace.json description 与 fm description 一致 | `eas-prompt-creator` | **P0** | mp 缺"八大类型"列举（Agent / Tool / Task / Command / Mode / Session / Feature / Context）；fm 含 | 以 fm 为准同步 mp |
| P0-5 | 落地 | marketplace.json description 与 fm description 一致 | `eas-pptx` | **P0** | fm 新增「18 配色方案 / 4 种风格配方 / 5 种页面类型 / Layout QA / Content QA 双层校验 / 文本溢出防护容器系统 / 布局安全规则 / 触发短语列举」等实质能力信息；mp 缺失 | 以 fm 同步 mp |
| P0-6 | 落地 | marketplace.json description 与 fm description 一致 | `eas-xlsx` | **P0** | fm 新增「触发短语」（spreadsheet / Excel / .xlsx 等 11 个）；mp 缺失 | 以 fm 同步 mp |
| P0-7 | 落地 | marketplace.json description 与 fm description 一致 | `eas-pdf` | **P0** | fm 新增「触发短语」（PDF / make a PDF / beautiful PDF 等 11 个）；mp 缺失 | 以 fm 同步 mp |
| P0-8 | 落地 | marketplace.json description 与 fm description 一致 | `eas-docx` | **P0** | fm 新增「底层栈说明 / 触发短语」（Word / docx / 报告 / 合同 / 公文 / 提案 / 备忘录）；mp 缺失 | 以 fm 同步 mp |
| P0-9 | 落地 | marketplace.json version 与 fm version 一致 | `eas-planning-writer` / `eas-skill-find` | **P0** | `eas-planning-writer`: mp `0.1.0` vs fm `1.0.0`；`eas-skill-find`: mp `1.0.0` vs fm `1.1.0` | mp bump 到 fm 当前版本 |

### P1：内容 / 结构

| # | 维度 | 检查项 | 技能 | 严重度 | 现状 | 建议修复 |
|---|---|---|---|:---:|---|---|
| P1-1 | 结构 | H1 标题用双语形式 | `eas-pptx` / `eas-xlsx` / `eas-pdf` / `eas-docx` | **P1** | 4 个 tools 技能 H1 全为纯英文 `# eas-pptx` / `# eas-xlsx` / `# eas-pdf` / `# eas-docx`，未带中文括注 | 改为 `# eas-pptx (PPTX 演示文稿生成与编辑)` 等双语形式（§13.2） |
| P1-2 | 结构 | H1 标题与 frontmatter.name 一致且格式统一 | `eas-skill-creator` | **P1** | H1 `# eas-skill-creator - EASBot技能创建构建器 (EASBot Skill Creator Builder)` 用 `-` 串联 + `()` 双语，与其它技能不一致 | 统一为 `# <name> (<中文>)` 单一形式 |
| P1-3 | 结构 | H1 标题中英文术语大小写规范 | `eas-prompt-creator` / `eas-chinese-writer` | **P1** | `eas-prompt-creator` H1 `# Eas Prompt Creator - ...` 中 `Eas` 大写；`eas-chinese-writer` H1 `# EAS Chinese Writer - ...` 与 frontmatter.name `eas-chinese-writer` 不符 | 统一为 frontmatter.name 形式 `# eas-prompt-creator (提示词创建器)` / `# eas-chinese-writer (中文文档与注释编写规范)` |
| P1-4 | 结构 | H1 标题包含技能名 | `eas-planning-writer` | **P1** | H1 `# 基于文件的规划 (Planning with Files)` 完全不含技能名 `eas-planning-writer`，影响技能识别 | 改为 `# eas-planning-writer (基于文件的规划)` |
| P1-5 | 内容 | 必填三节齐全（§13.5） | `eas-planning-writer` | **P1** | 用「## 快速开始 (Quick Start)」替代「## 快速参考 (Quick Reference)」；其它 11 个技能均含「快速参考」节 | 改名为「## 快速参考 (Quick Reference)」以与其它 builtin 技能一致 |
| P1-6 | 落地 | README* 表格中的 description 与 fm description 一致 | `eas-skill-creator` / `eas-skill-find` / `eas-prompt-creator` | **P1** | 经 Grep 比对，README.md / README.en.md 表格中描述是**简短概述**而非完整 fm description，但语义基本对齐；本评审**豁免**（README 用短句、fm 用完整 description 属常见分层做法，§6.2 仅要求表格描述与 fm 语义一致） | 不修复（豁免：详见下方「豁免项」） |
| P1-7 | 落地 | README* 表格包含全部 12 个技能 | （项目级） | **P1** | 已确认 README.md（7 个 builtin + 5 个 tools）+ README.en.md 全部覆盖 12 个技能 | 不修复 |
| P1-8 | 落地 | `eas-skill-using` 能力索引覆盖全部 builtin 技能 | `eas-skill-using` | **P1** | 已确认 6 个非 self builtin 技能（skill-find / skill-creator / agent-creation / agent-evolution / prompt-creator / planning-writer）均在「当前 builtin 技能能力索引」节；tools 类技能不进入此索引（§6.2） | 不修复（合规） |

### P2：风格 / 美观

| # | 维度 | 检查项 | 现状 | 建议修复 |
|---|---|---|---|---|
| P2-1 | 内容 | 概述是否含主观评价词 | 全部 12 个 SKILL.md 概述均无「非常好 / 极其强大 / 完美」 | 不修复（合规） |
| P2-2 | 结构 | 二级标题是否全部用双语 `## 中文 (English)` | 除 `eas-planning-writer` / `eas-pptx` / `eas-docx` / `eas-pdf` / `eas-xlsx` 中存在少量二级标题**未带括注**（如 `## 概述 (Overview)` 已合规，但部分二级如 `## 创作模式` / `## 内容写作` / `## 内容质量 QA` 仅中文） | 后续迭代时统一为双语形式 |
| P2-3 | 语义 | H1 形式跨技能统一 | 12 个技能 H1 形式各异（部分纯英文 / 部分双语 / 部分含 dash 分隔） | 后续迭代统一为 `# <name> (<中文>)` 单一形式 |
| P2-4 | 落地 | 各 SKILL.md 末尾是否含「决策沉淀 (Decision Sediment)」节 | `eas-planning-writer` / `eas-pdf` / `eas-docx` / `eas-xlsx` / `eas-pptx` 5 个技能含此节 | **不视为违规**：经抽样，这 5 个技能的「决策沉淀」节内容均为**技能本体的设计选择**（记录"为什么选 X 而不选 Y"），**未反向引用评审报告 / 决策文档路径**，符合 §4.5 / §14.7 的"禁止反向引用评审报告"精神；属 §13.5 可选节「决策沉淀」的合法用法 |
| P2-5 | 落地 | scripts/ 子目录是否整齐 | 全部 scripts/ 仅含脚本，无杂项；helpers/、templates/ 子目录合理 | 不修复（合规） |
| P2-6 | 结构 | 是否在 H1 之后立刻给出"何时使用本技能"反模式 | `eas-skill-creator` 的 SKILL.md 首屏顺序为 H1 → 概述 → 技能类型（§4/§5）→ 何时使用，未违反 §4.4（"「如何使用本技能」不要放首屏"——指不要把使用指南放首屏，但「何时使用」节本身就是 SKILL.md 模板的必填节，不算违规） | 不修复（合规） |

## 豁免项 (Exemptions)

| # | 检查项 | 严重度 | 豁免理由 |
|---|---|---|---|
| EX-1 | P1-6 README* 表格 description 与 fm description 完全对齐 | P1 | §6.2 仅要求"表格描述"与 fm 语义一致，未要求字面完全相同；README 表格用短句概述 + fm 用完整触发条件是合理的分层做法。**豁免：保留分层** |
| EX-2 | P2-4 5 个技能含「决策沉淀」节 | P2 | 该 5 个技能的本节内容均为技能本体设计选择（无反向引用评审报告路径），符合 §4.5 / §14.7 的"禁止反向引用评审报告"精神。**豁免：保留为技能本体设计文档** |
| EX-3 | 「如何使用本技能」首屏检查 | P2 | §4.4 原文指"「如何使用本技能」不要放首屏（§4）"——指不要把使用指南（how-to）放首屏；「何时使用 (When to Use)」是 SKILL.md 必填节（§13.5），位置在 H1 之后其它章节之前属合规模板。**豁免：模板强制** |
| EX-4 | `eas-skill-using` 不含 `tools/` 技能索引 | — | §6.2 明文规定 `tools` 类技能不进入 `eas-skill-using` 索引（"由 Agent 按 frontmatter description 自行匹配"）。**豁免：合规** |

## 结论 (Conclusion)

- [ ] **通过**（所有 P0 = 0）
- [ ] **有条件通过**（附豁免列表）
- [x] **不通过**（必须修复 P0 项）

> **本批评审结论：不通过**。理由：**P0 项 = 9，全部集中在「项目级同步缺口」（marketplace.json 与 SKILL.md frontmatter 失同步）**。按 §14.6「P0 = 阻塞：禁止合入」必须全部修复后才能合入。

### 修复优先级 (Fix Priority)

| 优先级 | 项数 | 涉及技能 |
|---|:---:|---|
| **必须修复（合入前）** | 9 P0 | 8 个技能的 marketplace.json description 同步 + 2 个技能的 marketplace.json version 同步（其中 1 项与 P0-3 重复计算） |
| **建议修复（后续 PR）** | 10 P1 + 9 P2 | H1 双语 / H1 含技能名 / 必填节命名等 |

### 修复方式建议 (Suggested Fix Path)

1. **新增 `[repo] chore: sync marketplace.json with skill frontmatter` 提交**（AGENTS.md §7.1 `[repo]` 前缀，合规）
2. 修复 P0-1 ~ P0-8：以各 SKILL.md fm `description` 为权威源，覆盖 `.claude-plugin/marketplace.json` 对应 `description` 字段
3. 修复 P0-9：将 `eas-planning-writer` mp version 由 `0.1.0` bump 到 `1.0.0`；`eas-skill-find` mp version 由 `1.0.0` bump 到 `1.1.0`
4. 修复完成后跑 `npx tsx skills/builtin/eas-skill-creator/scripts/quick-validate.ts` 全量循环再次确认零失败
5. 触发 §14.8「修复闭环」：P0 全部清零后可重新走评审并升 P1 为后续 PR 处理

## 风险点 (Risks)

- **marketplace.json 同步**是项目级「事实交付物」失同步，不修复会导致外部用户通过 marketplace 看到的 description 与 GitHub 上看到的 SKILL.md 不一致，损害项目可信度
- **版本号不同步**会让外部用户无法判断哪个版本是「最新版」，触发自动更新工具（如 `claude plugin update`）的版本比较失败
- **H1 标题 / 必填节命名**类 P1/P2 项**不影响**功能可用性，但影响**项目内一致性**，建议纳入后续 PR 修复

## 与既有评审的关系 (Relationship with Existing Reviews)

本批评审与已有评审的关系如下（去重聚合）：

| 历史评审 | 本评审新增 |
|---|---|
| `0001-review-builtin-tools-skills.md` | 已评过 8 个技能，本次复用其结论并扩展至 12 个；本评审**新增 marketplace.json 同步缺口**发现 |
| `0001-review-tools-doc-pdf-pptx-xlsx.md` | 已评过 4 个 tools 技能，本次复用其结论 |
| `0002-review-eas-skill-find.md` | 本次**新增** `marketplace.json` 同步缺口（P0-2 / P0-9） |
| `0003-review-eas-skill-creator.md` / `0004-review-eas-skill-creator.md` | 本次**新增** `marketplace.json` 同步缺口（P0-1 / P1-2） |

> 本评审不与既有评审重复落档发现项；既有评审已修复项不在本评审列出。

## 评审方法附录 (Method Appendix)

- **机械校验**：`npx tsx skills/builtin/eas-skill-creator/scripts/quick-validate.ts <skill-dir>` 跑全量 12 个技能
- **行数 / 字节 / 章节统计**：PowerShell `Get-Content` + `Measure-Object` + `Select-String` 完成
- **frontmatter 抽取**：YAML 分隔符 `---` 包围块定位后正则匹配
- **description 一致性比对**：JS-YAML 反序列化 marketplace.json + SKILL.md frontmatter 字符串 trim 后等值比对
- **scripts 依赖白名单检查**：grep `^import .* from '[^.]'` 比对 AGENTS.md §12.7 白名单（`js-yaml` / `jszip` / `@easbot/agent` / Node 内置）
- **`@` 路径引用检查**：正则 `(@[A-Za-z]+\.md)` 全局匹配 SKILL.md / references/*.md