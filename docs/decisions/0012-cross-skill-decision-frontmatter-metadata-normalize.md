# 跨技能决策：SKILL.md frontmatter 标准化为 `metadata:` 子键（2026-08-08）

> **CRITICAL**: 本决策为跨技能协议变更（§11），影响全部 12 个 skills 的 frontmatter 结构规范。
> **执行顺序**: 本决策先执行，再产出 `0013-review-round3-frontmatter-metadata.md` 五维度评审报告；先决策后评审，与 §14.4 评审流程一致。

---

## 1. 决策摘要 (Decision Summary)

将 SKILL.md YAML frontmatter 中**项目扩展字段**统一收拢到 `metadata:` 子键下，**移除顶层平铺写法**。

### 顶层 vs metadata 块对照表

| 字段 | 新位置 | 决策依据 |
|------|--------|----------|
| `name` | **顶层** | AgentSkills 规范必填顶层 |
| `description` | **顶层** | AgentSkills 规范必填顶层 |
| `license` | **顶层** | AgentSkills 规范顶层字段 |
| `metadata` | **顶层** | AgentSkills 规范顶层字段（自由扩展容器） |
| `mode` / `composition` / `behavior` / `reviewer` / `secondaryModes` / `compositionConnections` / `deliveryChecklist` | **顶层** | 五大模式与组合模式规范字段 |
| `allowed-tools` | **顶层** | AgentSkills 规范顶层字段 |
| `category` / `version` / `tags` / `author` / `compatibility` | **`metadata:` 子键** | 项目扩展字段，按 §9.4 「字段分层策略」推荐放 metadata 块 |

## 2. 冲突诊断 (Conflict Diagnosis)

### 2.1 与 quick-validate.ts 白名单冲突

**修正前实现** (`eas-skill-creator/scripts/quick-validate.ts` L77-93) 白名单同时包含：

```typescript
const allowedProperties = new Set([
  'name', 'description', 'license', 'allowed-tools', 'metadata',
  'category',         // ❌ 应在 metadata 块内
  'version',          // ❌ 应在 metadata 块内
  'tags',             // ❌ 应在 metadata 块内
  // ...
]);
```

导致 review-rounds 第 1 / 2 轮得出「12/12 quick-validate PASS」假阳性——**白名单本身在鼓励反模式**。

### 2.2 与 skill-spec.md §9.4 字段分层策略冲突

[`skill-spec.md` §9.4](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-skill-creator/references/skill-spec.md#94-字段分层策略-field-layering-strategy) 明确写：

> | **本项目扩展**（metadata 块内） | `category` / `version` / `author` / `compatibility` / `tags` | EASBot 内部组织；不影响外部 Agent |

### 2.3 与 AgentSkills 标准不一致

[AgentSkills 规范](https://agentskills.io/specification) 的顶层字段只有：`name` / `description` / `license` / `metadata` / `allowed-tools`。`category` / `version` / `tags` 应放在 `metadata` 子键中。

## 3. 决策内容 (Decision)

### 3.1 新规范 (New Spec)

SKILL.md frontmatter **MUST** 采用如下结构：

```yaml
---
name: <hyphen-case>                   # AgentSkills 标准顶层
description: <text ≤ 1024>             # AgentSkills 标准顶层
license: MIT                          # AgentSkills 标准顶层（推荐）
metadata:                             # AgentSkills 顶层「自由扩展容器」
  category: builtin | tools
  version: <semver>
  author: <name>
  compatibility: <text>
  tags: [<array>]
# 仅以下模式字段留在顶层（如适用）：
mode: <mode>
composition: <single|composed>
behavior: ...
---
```

### 3.2 quick-validate.ts 行为变更 (Validator Behavior Change) —— 已完成

白名单**移出** `category` / `version` / `tags` 三个键：

```typescript
const allowedTopLevel = new Set([
  // AgentSkills 标准顶层字段
  'name', 'description', 'license', 'allowed-tools', 'metadata',
  // 5 大模式与组合模式字段（保留顶层）
  'mode', 'composition', 'secondaryModes', 'compositionConnections',
  'behavior', 'reviewer', 'deliveryChecklist',
]);
// metadata 块内 sub-keys（category / version / author / compatibility / tags /
//   dependencies / sources 等）不校验（自由扩展容器，§9.4）。
```

### 3.3 评分升级 (Severity Up)

违反新规范的 SKILL.md frontmatter **P0**：

> **P0 判定**: 违反 = quick-validate 直接拒绝 = CI 失败

## 4. 影响面 (Impact Analysis)

### 4.1 受影响文件 (15 项，11 个 SKILL.md 待修)

| # | 类型 | 文件 | 当前写法 | 修正动作 |
|---|------|------|----------|----------|
| 1 | builtin | `skills/builtin/eas-agent-creation/SKILL.md` | `category`/`version`/`tags` 平铺，无 metadata/license | 进 metadata；新增 license |
| 2 | builtin | `skills/builtin/eas-agent-evolution/SKILL.md` | 同上 | 同上 |
| 3 | builtin | `skills/builtin/eas-planning-writer/SKILL.md` | 同上（**用户首指**） | 同上 |
| 4 | builtin | `skills/builtin/eas-prompt-creator/SKILL.md` | `category`/`version`/`tags` 平铺 + `mode`/`composition`/`behavior` 顶层 | 扩展字段进 metadata；模式字段保持顶层 |
| 5 | builtin | `skills/builtin/eas-skill-creator/SKILL.md` | ✅ 已合规，正例 | 零变更 |
| 6 | builtin | `skills/builtin/eas-skill-find/SKILL.md` | 顶层 category/version/tags | 进 metadata；新增 license |
| 7 | builtin | `skills/builtin/eas-skill-using/SKILL.md` | 同上 | 同上 |
| 8 | tools | `skills/tools/eas-chinese-writer/SKILL.md` | 同上 | 同上 |
| 9 | tools | `skills/tools/eas-docx/SKILL.md` | **双写**：顶层 + metadata 块嵌套 | 移除顶层；metadata 块统一字段类型 |
| 10 | tools | `skills/tools/eas-pdf/SKILL.md` | 同双写 | 同上 |
| 11 | tools | `skills/tools/eas-pptx/SKILL.md` | 同双写 | 同上 |
| 12 | tools | `skills/tools/eas-xlsx/SKILL.md` | 同双写 | 同上 |
| 13 | 脚本 | `skills/builtin/eas-skill-creator/scripts/quick-validate.ts` | 白名单含 category/version/tags | **已完成**：移出白名单 |
| 14 | 规范 | `skills/builtin/eas-skill-creator/references/skill-spec.md` §9.1 | 扩展字段「可选」未明层级 | §9.1 表头加注「MUST metadata 子键」 |
| 15 | 项目级 | `AGENTS.md` §4.1 + §14.5 维度 1 第 3 项 | 「可选」未明层级 | 改为 MUST 子键 + 加检「顶层仅白名单」 |

> **修订统计**: 实际待修 SKILL.md = **11 个**（不是先前粗估 8 个）。**7 个完全平铺**（builtin 5 + tools 2），**4 个为「演进到一半」的双写**（tools 4）。零回归的合规样本: `eas-skill-creator`（1 个）。

### 4.2 受影响规范文档

| 文档 | 状态 | 修正 |
|------|------|------|
| `AGENTS.md` §4.1 frontmatter 规约 | 「category/version/tags」列在「可选」下未明确限制层级 | 改为「`mode` / `composition` / `behavior` / `allowed-tools`；**项目扩展字段** MUST 进 `metadata:` 子键」 |
| `AGENTS.md` §14.5 维度 1 第 3 项 frontmatter 检查 | 仅检 `name`/`description` | 加检「顶层仅含白名单字段；扩展字段进 metadata」 |
| `skills/builtin/eas-skill-creator/references/skill-spec.md` §9.1 | 扩展字段「可选」未明层级 | §9.1 表头加注「MUST metadata 子键」 |

## 5. 折中方案 (Alternatives Considered)

| 备选 | 否决理由 |
|------|----------|
| **A. 维持现状**（继续允许平铺） | 与 §9.4 字段分层策略冲突；quick-validate.ts 是「鼓励反模式」 |
| **B. 完全禁止 `metadata:` 块**（强制全部平铺） | 与 AgentSkills 标准顶层字段冲突；tools 类技能损失 `dependencies`/`sources` 等结构化元数据能力 |
| **C. 本决策采纳**：白名单收窄到 AgentSkills 标准 + 模式字段；扩展字段必须进 metadata | ✅ 与外部规范一致；✅ 结构清晰；✅ 修后契合 |

## 6. 执行计划 (Execution Plan)

按 §7.3 Atomic 提交 + §14.8 修复闭环：

1. ✅ **决策同步落地**（本文件）
2. ✅ **评审报告落地**：[`0013-review-round3-frontmatter-metadata.md`](./0013-review-round3-frontmatter-metadata.md)
3. ✅ **quick-validate.ts 修正**：`[skill: eas-skill-creator] fix(validator): align top-level whitelist with skill-spec §9.4`（已执行）
4. ⏳ **11 个技能 frontmatter 修正**：各一次 `[skill: <name>] chore(refactor): move frontmatter fields into metadata block` commit
5. ⏳ **skill-spec.md §9.1 + AGENTS.md §4 §14.5 同步**：`[repo] docs: align frontmatter spec with metadata-block policy`
6. ⏳ 跑 §5.2 全量 quick-validate 12/12 PASS，补 0013 修后复核表

## 7. 回溯条件 (Rollback Conditions)

如下任一条件触发，**MUST 回滚本决策**：

1. AgentSkills 规范未来版本支持 `category` / `version` / `tags` 顶层（与 §9.4 矛盾）→ 解除白名单限制
2. 某个 tools 类技能要求 `dependencies`/`sources` 在顶层（违反新规范）→ 添加到白名单
3. CI runner 报 quick-validate 误报率 > 5% → 临时回退一版

## 8. 与既有决策关系 (Relationships)

| 决策文件 | 关系 |
|----------|------|
| [0010-review-all-skills-round2-description-spec.md](./0010-review-all-skills-round2-description-spec.md) | 第二轮评审，**本决策前置**：必须先规范 frontmatter 结构才能做 description 评审 |
| [0011-sync-AGENTS-with-eas-prompt-creator.md](./0011-sync-AGENTS-with-eas-prompt-creator.md) | AGENTS.md §13 §14 同步；本决策新增 §4 §14.5 维度 1 同步 |
| [0009-fix-closure-0006-0007-reviews.md](./0009-fix-closure-0006-0007-reviews.md) | 第一二轮修复闭环；本决策为第三次全量同步 |
| **0012（本文件）** | **frontmatter 标准化为 metadata 子键决策** |
| [0013-review-round3-frontmatter-metadata.md](./0013-review-round3-frontmatter-metadata.md) | 本次五维度评审报告 |

---

**执行人**: Agent（按用户指令）
**触发 commit msg**: `[repo] chore(skills): normalize frontmatter to metadata block`（决策同步）
**评审依据**: [0013-review-round3-frontmatter-metadata.md](./0013-review-round3-frontmatter-metadata.md)
