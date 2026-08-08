# 评审报告：全部 12 个 skills 第一轮全量评审（2026-08-08）

> **本评审按 AGENTS.md §14 评审规范执行**。沿用项目级惯例（既有 `0001-review-builtin-tools-skills.md` / `0001-review-tools-doc-pdf-pptx-xlsx.md` / `0006-review-all-skills.md`），落档到 `docs/decisions/00NN-review-{topic}.md`。

---

### 评审对象

- **类型**：跨技能批量评审（评全部 12 个 SKILL.md）
- **范围**：
  - builtin/：`eas-agent-creation` / `eas-agent-evolution` / `eas-planning-writer` / `eas-prompt-creator` / `eas-skill-creator` / `eas-skill-find` / `eas-skill-using`（7 个）
  - tools/：`eas-chinese-writer` / `eas-docx` / `eas-pdf` / `eas-pptx` / `eas-xlsx`（5 个）
- **关联项目级文件**：`AGENTS.md` / `README.md` / `README.en.md` / `.claude-plugin/marketplace.json` / `skills/builtin/eas-skill-using/SKILL.md`（能力索引）
- **评审者**：Agent（按用户指令"按规范第一轮评审"）

---

### 入口加载证据（§14.3.2 MUST）

- [x] `eas-skill-using` 已加载（首步按 name 调用，加载到 SKILL.md 主体）
- [x] `eas-skill-creator` 已加载（第二步按 name 调用，加载到 SKILL.md 主体）
- [x] §14.3.2 第 3 条：已对照两技能 §快速参考，确认触发条件 / 核心脚本 / 必填字段
- [x] §14.3.2 第 4 条：已将两技能核心约束回填到本评审 checklist（结构 §4 / 内容 §13.5 / 语义 §13.3 / 规范 §12+§13 / 落地 §5.2+§6.1）
- **加载时间**：2026-08-08
- **加载方式**：`Skill` 工具按 `name` 调用（**未**直接 `Read` SKILL.md 路径）

---

### 五维度评分（汇总 12 个 skill）

| 维度 | P0 | P1 | P2 | P3 | 备注 |
|---|---|---|---|---|---|
| **入口加载** | 0 | 0 | 0 | 0 | §14.5 维度 1 第 1 项已勾选 |
| 结构 | 1 | 7 | 0 | 0 | eas-planning-writer 缺快速参考；多 SKILL.md 缺 tags |
| 内容 | 0 | 2 | 0 | 0 | 模糊措辞 / 决策沉淀节反向引用 |
| 语义 | 0 | 2 | 1 | 0 | 措辞强度 / 主观评价 |
| 规范 | 0 | 3 | 1 | 0 | 裸代码块 / 标题双语 / 体量 |
| 落地 | 1 | 1 | 0 | 0 | 版本号不一致（项目级同步缺失） |
| **合计** | **2** | **15** | **2** | **0** | |

---

### 发现项明细

#### 结构维度 (Structure)

| # | 维度 | 检查项 | 严重度 | 现状 | 建议修复 |
|---|---|---|---|---|---|
| S1 | 结构 | 必填节齐全 | **P0** | [eas-planning-writer/SKILL.md](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-planning-writer/SKILL.md) 缺「## 快速参考 (Quick Reference)」节（§13.5 必填三节缺一） | 在 §「概述」与「实现」之间新增「## 快速参考 (Quick Reference)」节（表格 / 列表形式速查要点） |
| S2 | 结构 | frontmatter 完整 | P1 | [eas-chinese-writer/SKILL.md](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-chinese-writer/SKILL.md) 缺 `version` + `tags` | 补 `version: 1.0.0`（或对齐 marketplace）+ `tags: [...]` |
| S3 | 结构 | frontmatter 完整 | P1 | [eas-docx/SKILL.md](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-docx/SKILL.md) / [eas-pdf](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-pdf/SKILL.md) / [eas-pptx](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-pptx/SKILL.md) / [eas-xlsx](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-xlsx/SKILL.md) / [eas-planning-writer](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-planning-writer/SKILL.md) 5 个缺 `tags` | 各补 `tags: [...]` |
| S4 | 结构 | 无冗余文档 | P1 | [skills/tools/eas-pdf/references/overview.md](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-pdf/references/overview.md) 含 3 处裸 ` ``` `（按 §13.4 P1） | 补语言标记（`markdown` / `bash` / `python` 等） |

#### 内容维度 (Content)

| # | 维度 | 检查项 | 严重度 | 现状 | 建议修复 |
|---|---|---|---|---|---|
| C1 | 内容 | 无歧义指令 | P1 | [eas-skill-find/SKILL.md](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-skill-find/SKILL.md) L100「我找到了一个**可能**用得上的技能」—— §13.3 关键结论禁用「可能」 | 改写为肯定句（"我找到了一个候选技能"），或在结论句后追加明确取舍条件 |
| C2 | 内容 | references 信息不重复 | P1 | 4 个 tools 技能末尾含「## 决策沉淀 (Decision Sediment)」节（[eas-docx](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-docx/SKILL.md#L258) / [eas-pdf](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-pdf/SKILL.md#L245) / [eas-pptx](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-pptx/SKILL.md#L631) / [eas-xlsx](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-xlsx/SKILL.md#L193)）—— §4.5 / §13.5 注释明确禁止 builtin/tools 通用约定使用该节标题反向引用评审报告（注：`eas-planning-writer` 因自身是规划决策技能属合理例外，不计入违规） | 删除 4 个 skills 末尾「决策沉淀」节，将内容迁出至 `docs/decisions/00NN-{topic}.md` |

#### 语义维度 (Semantics)

| # | 维度 | 检查项 | 严重度 | 现状 | 建议修复 |
|---|---|---|---|---|---|
| M1 | 语义 | 指令强度词规范 | P1 | [eas-skill-creator/SKILL.md](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-skill-creator/SKILL.md) L156-157「**可能**无需加载到上下文即可执行」「**可能**需要被 Agent 读取」—— 关键事实陈述可豁免，但若属推断应标"推测" | 若为推断，标"推测"；否则改为肯定句 |
| M2 | 语义 | 人称规范 | P1 | [eas-skill-using/SKILL.md](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-skill-using/SKILL.md) L61 / L257「技能**可能**位于多个目录」—— 同一事实陈述两处，重复且未明确"推测"标签 | 至少一处保留，另一处改为肯定句 |
| M3 | 语义 | 无主观评价 | P2 | [eas-pptx/SKILL.md](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-pptx/SKILL.md) L478「**完美** pill」 | 改为技术描述（"标准 pill" / "圆角等于半高"） |

#### 规范维度 (Compliance)

| # | 维度 | 检查项 | 严重度 | 现状 | 建议修复 |
|---|---|---|---|---|---|
| R1 | 规范 | 代码块带语言标记 | P1 | [eas-chinese-writer/SKILL.md](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-chinese-writer/SKILL.md) L68 / L146 / L152 / L160 / L173 含 5 处裸 ` ``` ` | 补 `markdown` / `typescript` / `javascript` 等 |
| R2 | 规范 | 代码块带语言标记 | P1 | [eas-chinese-writer/references/terminology-guide.md](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-chinese-writer/references/terminology-guide.md) L122 / L149 含 2 处裸 ` ``` ` | 补语言标记 |
| R3 | 规范 | 代码块带语言标记 | P1 | [eas-chinese-writer/references/jsdoc-examples.md](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-chinese-writer/references/jsdoc-examples.md) L19 含 1 处裸 ` ``` ` | 补语言标记（`typescript` / `javascript`） |
| R4 | 规范 | 标题双语 | P2 | [eas-pptx/SKILL.md](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-pptx/SKILL.md) L145「## 演示计划」—— 但实际是 ` ``` ` 代码块内示例文档标题（属代码块示例，非真实节标题） | 复核上下文：确属示例则 PASS；如为真实节则补 `(Outline)` |
| R5 | 规范 | `SKILL.md` 体量 | P2 | [eas-pptx/SKILL.md](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-pptx/SKILL.md) 472 行（接近 §13.6 500 行红线） | 监控增长；超 500 行前主动拆分「设计系统速查」/「布局安全」等到 `references/` |

#### 落地维度 (Actionability)

| # | 维度 | 检查项 | 严重度 | 现状 | 建议修复 |
|---|---|---|---|---|---|
| A1 | 落地 | 项目级同步（§6.1） | **P0** | 版本号不同步：[eas-planning-writer/SKILL.md](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-planning-writer/SKILL.md) `version: 1.0.0` vs [.claude-plugin/marketplace.json](file:///e:/work/apps/eas/agent-skills/.claude-plugin/marketplace.json) `version: 0.1.0` | 统一为 1.0.0（以 SKILL.md 为准），更新 marketplace.json |
| A2 | 落地 | 项目级同步（§6.1） | P1 | [eas-chinese-writer](file:///e:/work/apps/eas/agent-skills/.claude-plugin/marketplace.json) marketplace `version: 0.1.0` 但 SKILL.md 无 version 字段——双向失同步 | 先在 SKILL.md 补 `version: 0.1.0`（与 marketplace 对齐）或对齐到 1.0.0，再跑 §5.2 全量循环 |

---

### 豁免项

| # | 检查项 | 严重度 | 豁免理由 |
|---|---|---|---|
| — | （本轮无豁免） | — | — |

> **说明**：C2（4 个 tools 技能「决策沉淀」节反向引用评审报告）按 §14.7 评审产出物规范要求"评审报告独立落档"，故该节内容须迁出至 `docs/decisions/`，不豁免。
> R4 经复核上下文后实际为 ` ``` ` 代码块示例文档标题（非真实节），可豁免，但需在评审报告复核栏确认。

---

### 复核栏（评审者对边缘项的二次确认）

- **R4 复核**：已读 [eas-pptx/SKILL.md](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-pptx/SKILL.md) L142-180 上下文，「## 演示计划」位于 ```` ```markdown ```` 代码块内（属示例文档结构），非真实 SKILL.md 节标题——**确认 PASS**，从 R4 表中撤销。

---

### 结论

- [ ] 通过（所有 P0 = 0，P1 = 0 或全部豁免）—— **不通过**
- [x] 有条件通过（附豁免列表）—— 修复 2 项 P0 后通过
- [ ] 不通过（必须修复 P0/P1）

**最终结论**：**有条件通过**。本轮发现的 2 项 P0（`eas-planning-writer` 缺「快速参考」节、`eas-planning-writer` 版本号项目级不同步）必须修复；其余 15 项 P1 与 2 项 P2 按 §14.8 修复闭环处理。

---

### 推荐修复顺序

| 优先级 | 任务 | 关联文件 |
|---|---|---|
| P0-1 | 新增 `eas-planning-writer/SKILL.md`「## 快速参考 (Quick Reference)」节 | [SKILL.md](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-planning-writer/SKILL.md) |
| P0-2 | 统一 `eas-planning-writer` 版本号为 1.0.0（marketplace.json 0.1.0 → 1.0.0） | [marketplace.json](file:///e:/work/apps/eas/agent-skills/.claude-plugin/marketplace.json) |
| P1-1 | 4 个 tools 技能移除「## 决策沉淀」节并迁出至 `docs/decisions/00NN-{topic}.md` | [eas-docx](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-docx/SKILL.md) / [eas-pdf](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-pdf/SKILL.md) / [eas-pptx](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-pptx/SKILL.md) / [eas-xlsx](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-xlsx/SKILL.md) |
| P1-2 | 补 5 个 skills 缺失的 `tags` 字段（chinese-writer 还要补 version） | 见 S2 / S3 |
| P1-3 | 修复 8 处裸 ` ``` ` 代码块（缺语言标记） | 见 R1 / R2 / R3 |
| P1-4 | `eas-skill-find` L100 / `eas-skill-using` L61、L257 / `eas-skill-creator` L156-157 模糊措辞改写 | 见 C1 / M1 / M2 |
| P2 | `eas-pptx` L478「完美」改技术描述 | 见 M3 |

---

### 与既有评审报告的关系

- 本报告编号 0007，**不替代**：
  - 0001-review-builtin-tools-skills.md（跨技能批量，评 8 个 builtin/tools）
  - 0001-review-tools-doc-pdf-pptx-xlsx.md（评 4 个 office tools）
  - 0002-review-eas-skill-find.md（单技能）
  - 0003-review-eas-skill-creator.md + 0004-review-eas-skill-creator.md（单技能两轮）
  - 0006-review-all-skills.md（上一轮全量）
- 本报告**叠加**于既有评审，作为 2026-08-08 时点的全量基线；既有评审报告中已修复项不重复列出（除非重新出现）。
