# 评审报告：第三轮 frontmatter 标准化为 metadata 子键（2026-08-08）

> **本评审按 AGENTS.md §14 评审规范执行**。聚焦 SKILL.md frontmatter 结构：顶层白名单收窄 + 项目扩展字段进 `metadata:` 子键。
> **触发**: 用户指出 `eas-planning-writer/SKILL.md#L4-5` 不符合 `eas-skill-creator` 1.0.4 新规范（应放 metadata 里）。
> **决策依据**: [0012-cross-skill-decision-frontmatter-metadata-normalize.md](./0012-cross-skill-decision-frontmatter-metadata-normalize.md)

---

## 1. 评审对象 (Review Scope)

| 项 | 内容 |
|---|------|
| 类型 | 项目级跨技能变更（涉及所有 builtin + tools）+ quick-validate 校验器修复 |
| 范围 | 11 个 SKILL.md frontmatter + 1 个校验器 + 2 个规范文档 |
| 评审者 | Agent（按用户指令 "按规范认真检查"） |
| 触发场景 | [eas-planning-writer/SKILL.md L1-7](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-planning-writer/SKILL.md#L1-L7) frontmatter 经第一轮评审补完字段后，用户发现 `category`/`version`/`tags` 平铺写法与 §9.4 新规范矛盾 |

## 2. 入口加载证据 (§14.3.2 MUST)

- [x] `eas-skill-using` 已加载（首步按 name 调用）
- [x] `eas-skill-creator` 已加载（按 name 调用）
- [x] §14.3.2 第 3 条：已对照 skill-spec.md §9.1 §9.2 §9.3 §9.4 完整规范
- [x] §14.3.2 第 4 条：已将 §9.4 字段分层策略 + AGENTS.md §4 回填到本评审 checklist
- 加载时间：2026-08-08
- 加载方式：`skill` 工具按 `name` 调用（**禁止**直接 Read SKILL.md 路径）

## 3. 现场事实基线 (Ground Truth - PRE-FIX)

### 3.1 quick-validate.ts 白名单（修正前 L77-93）

```typescript
const allowedProperties = new Set([
  'name', 'description', 'license', 'allowed-tools', 'metadata',
  'category',         // ❌ 应在 metadata 块内
  'version',          // ❌ 应在 metadata 块内
  'tags',             // ❌ 应在 metadata 块内
  'mode', 'composition', 'secondaryModes', 'compositionConnections',
  'behavior', 'reviewer', 'deliveryChecklist',
]);
```

**修正后白名单**: `category` / `version` / `tags` 已移出（[quick-validate.ts#L77-93](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-skill-creator/scripts/quick-validate.ts#L77-L93)）。

### 3.2 各技能 frontmatter 写法现状（修正前）

| # | 技能 | 顶层平铺字段 | metadata 块 | 合规 |
|---|------|-------------|-------------|------|
| 1 | eas-agent-creation | category/version/tags | ❌ 无 | ❌ 完全平铺 |
| 2 | eas-agent-evolution | category/version/tags | ❌ 无 | ❌ 完全平铺 |
| 3 | eas-planning-writer | category/version/tags | ❌ 无 | ❌ 完全平铺（**用户首指**） |
| 4 | eas-prompt-creator | category/version/tags + mode/composition/behavior | ❌ 无 | ❌ 完全平铺 + 模式字段混层 |
| 5 | eas-skill-creator | license + metadata (category/version/author/compatibility/tags) | ✅ 已合规 | ✅ 零变更（正例） |
| 6 | eas-skill-find | category/version/tags | ❌ 无 | ❌ 完全平铺 |
| 7 | eas-skill-using | category/version/tags | ❌ 无 | ❌ 完全平铺 |
| 8 | eas-chinese-writer | category/version/tags | ❌ 无 | ❌ 完全平铺 |
| 9 | eas-docx | version/category/tags | ✅ 已有（双写过渡） | ❌ 双写（去除顶层） |
| 10 | eas-pdf | version/category/tags | ✅ 已有（双写过渡） | ❌ 双写（去除顶层） |
| 11 | eas-pptx | version/category/tags | ✅ 已有（双写过渡） | ❌ 双写（去除顶层） |
| 12 | eas-xlsx | version/category/tags | ✅ 已有（双写过渡） | ❌ 双写（去除顶层） |

**统计**: 12 个技能中：
- ✅ 完全合规 1/12（`eas-skill-creator`）
- ❌ 完全平铺 7/12（#1-4 + #6-8）
- ❌ 双写 4/12（#9-12 tools 类，演进到一半的过渡态）
- **待修总计 11/12**；**合规率仅 8.3%**

### 3.3 §9.4 「字段分层策略」原文（skill-spec.md）

> | **AgentSkills 标准**（顶层） | `name` / `description` / `license` / `metadata` / `allowed-tools` | 通用；跨 Agent 互操作 |
> | --- | --- | --- |
> | **本项目扩展**（metadata 块内） | `category` / `version` / `author` / `compatibility` / `tags` | EASBot 内部组织；不影响外部 Agent |

### 3.4 AGENTS.md §4.1 frontmatter 规约冲突

当前表述：「可选：`category` / `version` / `tags` / `mode` / `composition` / `allowed-tools` 等白名单键；其它键被 `quick-validate.ts` 拒收。」

**问题**: 把 `category` / `version` / `tags` 与 `mode` / `composition` 并列在「顶层可选」，未指明「应在 metadata 子键」。

## 4. 五维度评分 (Pre-Fix)

| 维度 | P0 | P1 | P2 | P3 | 备注 |
|---|---|---|---|---|---|
| **入口加载** | 0 | 0 | 0 | 0 | §14.3.1 / §14.3.2 全部满足 |
| **结构 (Structure)** | **11** | 0 | 0 | 0 | 11 个 SKILL.md 含 `category`/`version`/`tags` 在顶层违反 §9.4 |
| **内容 (Content)** | 0 | 1 | 0 | 0 | AGENTS.md §4.1 第 3 条表述模糊 |
| **语义 (Semantics)** | 0 | 1 | 0 | 0 | quick-validate.ts 错误提示「Hint: put custom metadata under metadata block」——脚本自身已承认应分层，白名单未跟进 |
| **规范 (Compliance)** | **1** | 0 | 0 | 0 | quick-validate.ts 白名单与 §9.4 矛盾 |
| **落地 (Actionability)** | 0 | 0 | 0 | 0 | 修复动作明确（机械替换） |
| **合计** | **12** | **2** | **0** | **0** | **修正后 P0 应全清 0** |

> **失败判定**: P0 = 12 + P1 = 2，**评审结论: 不通过**。按 §14.4 / §14.8 必须修复全部 P0 后重新评审。

## 5. 发现项明细 (Findings Detail)

### 5.1 P0 项（12 项）

| # | 维度 | 检查项 | 严重度 | 文件 | 修复建议 |
|---|------|--------|--------|------|----------|
| F1 | 结构 | frontmatter `category/version/tags` 在顶层 | **P0** | eas-agent-creation/SKILL.md#L4-6 | 进 metadata 块；新增 license |
| F2 | 结构 | 同 F1 | **P0** | eas-agent-evolution/SKILL.md#L4-6 | 同上 |
| F3 | 结构 | 同 F1（**用户首指**） | **P0** | eas-planning-writer/SKILL.md#L4-6 | 同上 |
| F4 | 结构 | category/version/tags 在顶层 + mode/composition/behavior 也含 | **P0** | eas-prompt-creator/SKILL.md#L4-6 | 扩展字段进 metadata；模式字段留顶层 |
| F5 | 结构 | category/version/tags 在顶层 | **P0** | eas-skill-find/SKILL.md#L4-6 | 进 metadata；新增 license |
| F6 | 结构 | 同 F5 | **P0** | eas-skill-using/SKILL.md#L4-6 | 同上 |
| F7 | 结构 | 同 F5 | **P0** | eas-chinese-writer/SKILL.md#L4-6 | 同上 |
| F8 | 结构 | 双写：顶层 + metadata 块都含 version/category/tags | **P0** | eas-docx/SKILL.md#L4-6 | 移除顶层；metadata 块统一字段类型 |
| F9 | 结构 | 同 F8 | **P0** | eas-pdf/SKILL.md#L4-6 | 同上 |
| F10 | 结构 | 同 F8 | **P0** | eas-pptx/SKILL.md#L4-6 | 同上 |
| F11 | 结构 | 同 F8 | **P0** | eas-xlsx/SKILL.md#L4-6 | 同上 |
| F12 | 规范 | quick-validate.ts 白名单包含项目扩展字段 | **P0** | quick-validate.ts#L77-93 | **已修复**：移出白名单 |

### 5.2 P1 项（2 项）

| # | 维度 | 检查项 | 严重度 | 文件 | 修复建议 |
|---|------|--------|--------|------|----------|
| F13 | 内容 | AGENTS.md §4.1 第 3 条表述模糊 | **P1** | AGENTS.md#L74 | 改为 `mode`/`composition`/`behavior`/`allowed-tools`；**项目扩展字段** MUST 进 metadata 子键 |
| F14 | 语义 | quick-validate.ts 错误提示文案与白名单不一致 | **P1** | quick-validate.ts#L106 | 已自动与白名单对齐；保留文案 |

### 5.3 修订明细（按 §7.1 Atomic 提交分解为 11 个 skill commit）

| Skill | 当前 frontmatter 写法 | 修正目标 | Commit |
|-------|----------------------|----------|--------|
| [eas-agent-creation](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-agent-creation/SKILL.md) | 平铺，无 license | metadata + license | `[skill: eas-agent-creation] chore(refactor)` |
| [eas-agent-evolution](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-agent-evolution/SKILL.md) | 平铺，无 license | metadata + license | `[skill: eas-agent-evolution] chore(refactor)` |
| [eas-planning-writer](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-planning-writer/SKILL.md) | 平铺，无 license（**用户首指**） | metadata + license | `[skill: eas-planning-writer] chore(refactor)` |
| [eas-prompt-creator](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-prompt-creator/SKILL.md) | 平铺扩展字段 + 模式字段 | 扩展字段进 metadata；模式字段留顶层 | `[skill: eas-prompt-creator] chore(refactor)` |
| [eas-skill-find](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-skill-find/SKILL.md) | 平铺，无 license | metadata + license | `[skill: eas-skill-find] chore(refactor)` |
| [eas-skill-using](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-skill-using/SKILL.md) | 平铺，无 license | metadata + license | `[skill: eas-skill-using] chore(refactor)` |
| [eas-chinese-writer](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-tools/eas-chinese-writer/SKILL.md) | 平铺，无 license | metadata + license | `[skill: eas-chinese-writer] chore(refactor)` |
| [eas-docx](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-tools/eas-docx/SKILL.md) | 双写 | 去顶层；metadata 块统一 | `[skill: eas-docx] chore(refactor)` |
| [eas-pdf](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-tools/eas-pdf/SKILL.md) | 双写 | 同上 | `[skill: eas-pdf] chore(refactor)` |
| [eas-pptx](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-tools/eas-pptx/SKILL.md) | 双写 | 同上 | `[skill: eas-pptx] chore(refactor)` |
| [eas-xlsx](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-tools/eas-xlsx/SKILL.md) | 双写 | 同上 | `[skill: eas-xlsx] chore(refactor)` |
| [eas-skill-creator](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-skill-creator/SKILL.md) | ✅ 合规，零变更 | — | (无 commit) |

**只动 frontmatter，body 一律不动**（按 §6.2 演化原则「最小变更」）。

## 6. quick-validate.ts 修复方案 —— 已完成

```typescript
// 修正前 (L77-93)
const allowedProperties = new Set([
  'name', 'description', 'license', 'allowed-tools', 'metadata',
  'category', 'version', 'tags',                              // ❌ 移除
  'mode', 'composition', 'secondaryModes', 'compositionConnections',
  'behavior', 'reviewer', 'deliveryChecklist',
]);

// 修正后
const allowedProperties = new Set([
  'name', 'description', 'license', 'allowed-tools', 'metadata',
  'mode', 'composition', 'secondaryModes', 'compositionConnections',
  'behavior', 'reviewer', 'deliveryChecklist',
]);
// 项目扩展字段（category/version/tags/author/compatibility 等）
//   MUST 放入 metadata 子键。metadata 内 sub-keys 不校验。
```

## 7. 豁免项 (Waivers)

无 P1 豁免项。F13/F14 全部修复。

## 8. 验证结果 (Validation Result)

### 8.1 PRE-FIX（白名单收窄前）

```
12/12 quick-validate PASS  ← 假阳性（白名单鼓励反模式）
```

### 8.2 白名单收窄后（本评审执行后立刻跑）

```
11/12 FAIL, 1/12 PASS  ← 真实暴露问题
- FAIL: eas-agent-creation, eas-agent-evolution, eas-planning-writer,
       eas-prompt-creator, eas-skill-find, eas-skill-using,
       eas-chinese-writer, eas-docx, eas-pdf, eas-pptx, eas-xlsx
- PASS: eas-skill-creator
```

### 8.3 POST-FIX 预期

修复后：`12/12 quick-validate PASS`（真合规）。

## 9. 结论 (Conclusion)

- [x] **通过**（所有 P0 = 0，P1 = 0；详见 §11 修后复核表）
- [ ] 有条件通过（附豁免列表）
- [ ] 不通过（必须修复 P0/P1）

按 §14.8 修复闭环（全部完成 ✅）：

1. ✅ 决策落档（0012）
2. ✅ quick-validate.ts 白名单收窄（F12 完成）
3. ✅ 修复 11 个 SKILL.md frontmatter（11 个原子修改，待 git commit）
4. ✅ 同步 AGENTS.md §4 + §14.5 + skill-spec.md §9.1（[repo] 修订，待 commit）
5. ✅ 跑 §5.2 全量 quick-validate 12/12 **真合规 PASS**
6. ✅ 本评审报告末尾追加「修后复核表」**通过**（详见 §11）

> **commit 待办（按 §7.1 Atomic 提交）**：
> 1. `[skill: eas-skill-creator] fix(validator): align top-level whitelist + placeholder detection`（quick-validate.ts：白名单收窄 + placeholder 正则精度化，评审依据 0013）
> 2-12. 11 个 `[skill: <name>] chore(refactor): move frontmatter fields into metadata block`（每个技能独立）
> 13. `[repo] docs: align frontmatter spec with metadata-block policy`（AGENTS.md §4 §14.5 + skill-spec.md §9.1 §9.4）
> 14. `[repo] docs: 0012 + 0013 决策与评审落档`（docs/decisions/）

## 10. 与既有评审的关系

| 评审文件 | 关系 |
|---------|------|
| [0006-review-all-skills.md](./0006-review-all-skills.md) | 第一轮（市场同步为主） |
| [0007-review-all-skills-round1.md](./0007-review-all-skills-round1.md) | 第二轮 SKILL.md 本体 |
| [0009-fix-closure-0006-0007-reviews.md](./0009-fix-closure-0006-0007-reviews.md) | 前两轮闭环 |
| [0010-review-all-skills-round2-description-spec.md](./0010-review-all-skills-round2-description-spec.md) | description 三要素专项 |
| [0011-sync-AGENTS-with-eas-prompt-creator.md](./0011-sync-AGENTS-with-eas-prompt-creator.md) | AGENTS.md ↔ eas-prompt-creator 规范对齐 |
| [0012-cross-skill-decision-frontmatter-metadata-normalize.md](./0012-cross-skill-decision-frontmatter-metadata-normalize.md) | **本次决策依据** |
| **0013（本文件）** | **第三轮 frontmatter 标准化评审** |

---

## 11. 修后复核表 (POST-FIX Re-validation)

> 本次跨技能 frontmatter 标准化任务 — 全部修复完成 ✅

| 校验项 | 期望 | 实际 | 通过 |
|---|---|---|---|
| quick-validate 全量（基础）12/12 PASS | ✓ | **12/12 PASS** | ☑ |
| 11 个 SKILL.md frontmatter 合规 | ✓ | 全部进 metadata 子键 | ☑ |
| AGENTS.md §4 + §14.5 维度 1 同步 | ✓ | 已加注「顶层仅白名单 + 扩展字段进 metadata」 | ☑ |
| skill-spec.md §9.1 + §9.4 同步 | ✓ | §9.1 表头加位置注；§9.4 增加「5 大模式顶层」层 | ☑ |
| quick-validate.ts 白名单收窄 | ✓ | 已移除 category/version/tags | ☑ |
| quick-validate.ts placeholder 检测精度化 | ✓ | 改为正则匹配 `[TODO:` / `<TODO:` / `<!-- TODO` 结构化标记；规避 shell 命令示例中的 `placeholder` 误判 | ☑ |
| quick-validate `--complete` 全量 12/12 PASS | ✓ | **12/12 PASS, 0 fail**（含之前误报的 eas-pptx） | ☑ |
| 决策同步 0012 + 评审 0013 落档 | ✓ | 均已落档 | ☑ |

### 11.1 修后最终验证日志 (2026-08-08)

**基础校验 12/12 PASS**：

```
Performing basic validation... PASS (12/12)

eas-agent-creation     ✅ Skill is valid!
eas-agent-evolution    ✅ Skill is valid!
eas-planning-writer    ✅ Skill is valid!
eas-prompt-creator     ✅ Skill is valid!
eas-skill-creator      ✅ Skill is valid!
eas-skill-find         ✅ Skill is valid!
eas-skill-using        ✅ Skill is valid!
eas-chinese-writer     ✅ Skill is valid!
eas-docx               ✅ Skill is valid!
eas-pdf                ✅ Skill is valid!
eas-pptx               ✅ Skill is valid!
eas-xlsx               ✅ Skill is valid!
```

**完整校验（含目录结构 + 占位符检测）12/12 PASS**：

```
PASS  eas-agent-creation
PASS  eas-agent-evolution
PASS  eas-planning-writer
PASS  eas-prompt-creator
PASS  eas-skill-creator
PASS  eas-skill-find
PASS  eas-skill-using
PASS  eas-chinese-writer
PASS  eas-docx
PASS  eas-pdf
PASS  eas-pptx           ← 误报修复后转 PASS
PASS  eas-xlsx

=================================
SUMMARY: 12 pass, 0 fail
```

### 11.2 修后五维度评分 (POST-FIX)

| 维度 | P0 | P1 | P2 | P3 | 备注 |
|---|---|---|---|---|---|
| **入口加载** | 0 | 0 | 0 | 0 | §14.3.1 / §14.3.2 全部满足 |
| **结构 (Structure)** | 0 | 0 | 0 | 0 | 11 个 SKILL.md frontmatter 已全部进 metadata 子键 |
| **内容 (Content)** | 0 | 0 | 0 | 0 | AGENTS.md §4 + §14.5 + skill-spec.md §9.1 已同步 |
| **语义 (Semantics)** | 0 | 0 | 0 | 0 | quick-validate.ts 错误提示与白名单对齐 |
| **规范 (Compliance)** | 0 | 0 | 0 | 0 | **基础 12/12 + --complete 12/12 全 PASS** |
| **落地 (Actionability)** | 0 | 0 | 0 | 0 | 修复动作全部完成 |
| **合计** | **0** | **0** | **0** | **0** | **真合规（0 P0 / 0 P1 / 0 P2）** |

### 11.3 二次修复闭环（用户指令「有问题你就要处理修正」）

`--complete` 模式发现的 `eas-pptx` `placeholder` 误判问题已**立即修复**，不走 P2 follow-up：

- **触发**: `quick-validate.ts` L217 原文 `content.includes('placeholder')` 把 SKILL.md 正文中 grep 命令示例里的 `placeholder` 字符串误判为占位符
- **修复**: 改用正则 `/\[TODO:|\<TODO:|<!--\s*TODO\b/` 仅匹配 3 种结构化待办标记：
  - `[TODO:...]` — 数组式占位符
  - `<TODO:...>` — 标签式占位符
  - `<!-- TODO ... -->` — HTML 注释式待办
- **效果**: 正文里的 `placeholder` / `TODO` 关键词**不**再误判；`eas-pptx/SKILL.md` 文本无需改动
- **commit 待办**: 合并进第 1 个 commit（`[skill: eas-skill-creator] fix(validator): align top-level whitelist with skill-spec §9.4`）

### 11.4 最终结论

> 修后复核全部勾选（含二次修复闭环）。本评审报告结论：**✅ 通过**（P0 = 0，P1 = 0，P2 = 0，含 eas-pptx placeholder 误报已修复）。
>
> 全部修复均在本评审任务内闭环，无需开任何 P2 follow-up。
