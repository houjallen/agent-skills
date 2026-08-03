---
name: {skill-name}-requirement
description: "{skill-name}: 一句话决策标题 —— 关键设计判断（不超过 200 字）"
category: requirement
author: <name>
version: 1.0.0
date: "YYYY-MM-DD"
keywords:
  - "{skill-name}"
  - <tag1>
  - <tag2>
supersedes: <旧决策编号，可选>
status: proposed
---

# {skill-name} - 00NN: 决策标题（中文）

<!--
  本模板用于"技能级需求决策"：在 eas-skill-creator 步骤 1 需求收集完成后、
  步骤 2 模式决策启动前产出。记录关键设计判断，避免上下文丢失。
  使用方法：复制本文 → 替换所有占位符 → 删除本注释块。
  详细规范：见 <eas-skill-creator>/references/requirement-decision-guide.md（同目录）

  路径约束：
  - 本文件是模板，仅供复制使用
  - 复制后落地到 <cwd>/skills/builtin/{skill-name}/00NN-{topic}.md
  - 落地后 MUST 用相对路径引用同目录的 SKILL.md / scripts/
  - MUST NOT 引用本技能目录外的资源
-->

> **决策日期**：YYYY-MM-DD
> **决策人**：<决策人姓名>（自主推进，待 Review）
> **状态**：📋 草拟 / 🟡 临时生效 / ✅ 已通过 / ❌ 已废弃
> **类型**：技能级需求决策
> **影响范围**：技能 `{skill-name}` 单技能内
> **相关 requirement_profile**：见「需求画像」章节
> **关联决策**：<若有宿主项目级 ADR 引用，列编号>

---

## 背景 (Context)

<!-- 为什么需要做这个决策？用户原始诉求是什么？3-5 行足够。 -->

[描述用户原始诉求、触发因素、当前需求环境]

---

## 需求画像 (Requirement Profile)

<!-- 直接复制步骤 1 产出的 requirement_profile。MUST 100% 一致。 -->

```yaml
requirement_profile:
  domain: code | design | writing | business | data | hybrid   # [MUST]
  scenarios: [<3+ 具体使用场景>]                                # [MUST]
  triggers: [<5+ 触发短语>]                                    # [MUST]
  boundaries: [<不应触发的场景>]                                # [MUST]
  constraints:                                                  # [SHOULD]
    - <硬约束>
  assumptions:                                                  # [SHOULD]
    - <已验证的假设>
  primary_mode_candidate: <pipeline | generator | reviewer | inversion | tool_wrapper>  # [MUST]
  secondary_mode_candidate: <可选>                              # [MAY]
  rounds_used: <实际提问轮次>                                   # [MUST]
  compressed: <true | false>                                    # [MUST]
  compressed_reason: <若压缩，引用 PRD/Spec/原技能名>            # [MAY]
```

---

## 关键判断 (Key Judgments)

<!-- 步骤 1 过程中做出的关键判断清单。`requirement_profile` 无法表达的设计选择。 -->

| # | 判断 | 理由 |
|---|------|------|
| 1 | <例：选择 `code` 领域而非 `hybrid`> | <用户场景全部是 SDK 封装，无设计/写作场景> |
| 2 | <例：选择 Pipeline 而非 Reviewer> | <需要按顺序执行初始化/调用/清理，不能跳步> |
| 3 | <...> | <...> |

---

## 备选方案 (Alternatives)

<!-- 至少 2 个并列候选。每个方案用优缺点表。 -->

### 方案 A：<名称>

| 维度 | 评估 |
|------|------|
| 优点 | - ... |
| 缺点 | - ... |
| 风险 | - ... |
| 成本 | - ... |

### 方案 B：<名称>

| 维度 | 评估 |
|------|------|
| 优点 | - ... |
| 缺点 | - ... |
| 风险 | - ... |
| 成本 | - ... |

<!-- 若有方案 C/D，依此类推 -->

---

## 决策 (Decision)

<!-- 一句话说清选了什么，然后用表格明确。 -->

**本决策选择：方案 X**。

| 项 | 内容 |
|------|------|
| 选了什么 | 方案 X |
| 适用范围 | 技能 `{skill-name}` 内所有未来变更 |
| 生效日期 | YYYY-MM-DD |
| 审批状态 | 📋 草拟 / 🟡 临时生效 / ✅ 已 Review 通过 |

---

## 依据 (Rationale)

<!-- 为什么选这个？与备选对比的关键理由。3-5 条足够。 -->

1. **理由 1**：[与方案 Y 相比，方案 X 在 [维度] 上更优，因为 ...]
2. **理由 2**：[...]
3. **理由 3**：[...]
4. **否决方案 Y 的核心理由**：[...]

---

## 具体动作 (Actions)

<!-- 可勾选清单，必须落到文件路径。MUST 项。 -->

- [ ] 创建 `<cwd>/skills/builtin/{skill-name}/SKILL.md`，含 frontmatter + 双语标题 + 必填章节
- [ ] 创建 `<cwd>/skills/builtin/{skill-name}/references/` 目录
- [ ] 创建 `<cwd>/skills/builtin/{skill-name}/scripts/` 目录（如需要）
- [ ] 创建 `<cwd>/skills/builtin/{skill-name}/assets/` 目录（如需要）
- [ ] 运行 `tsx <skillPath>/scripts/init-skill.ts {skill-name} --path <cwd>/skills/builtin --resources scripts,references,assets --examples`（**`<skillPath>`** 为 `eas-skill-creator` 技能的实际安装路径，例如 `{cwd}/skills/builtin/eas-skill-creator` 或 `~/.local/share/easbot/skills/builtin/eas-skill-creator`）
- [ ] 验证：`tsx <skillPath>/scripts/quick-validate.ts <cwd>/skills/builtin/{skill-name}`（同上，`<skillPath>` 替换为实际路径）
- [ ] （可选）由宿主项目决定是否在 SKILL.md 末尾追加"决策记录"小节；通用建议是不强制，ADR 由宿主项目级 `docs/decisions/` 索引统一管理

---

## 影响 (Impact)

<!-- 正面 ✅ / 风险 ⚠️ / 副作用 ❌。MUST 项。 -->

### ✅ 正面影响

- [...]

### ⚠️ 风险

- [...]

### ❌ 副作用 / 取舍

- [...]

---

## 回溯链接 (Backlinks)

<!-- 指向后续步骤产出 + 宿主项目级 ADR（如有）。MUST 项。 -->

### 后续步骤产出（本决策驱动）

- SKILL.md：`<cwd>/skills/builtin/{skill-name}/SKILL.md`
- scripts/：`<cwd>/skills/builtin/{skill-name}/scripts/`
- references/：`<cwd>/skills/builtin/{skill-name}/references/`
- assets/：`<cwd>/skills/builtin/{skill-name}/assets/`（如有）

### 宿主项目级 ADR 引用（如有）

- <编号 1>：<标题>
- <编号 2>：<标题>

---

## 修订记录 (Revision History)

<!-- 不另起文件，修订追加在本节。version 在 frontmatter 递增。 -->

| 版本 | 日期 | 修订内容 | 修订人 |
|------|------|----------|--------|
| 1.0.0 | YYYY-MM-DD | 初版 | <name> |

---

**最后更新**：YYYY-MM-DD

<!--
  本模板路径：<eas-skill-creator>/references/templates/00NN-requirement.md
  使用指南：<eas-skill-creator>/references/templates/requirement-decision-guide.md
  落地路径：<cwd>/skills/builtin/{skill-name}/00NN-{topic}.md
  [MUST] 落地后 MUST 保持自包含，仅引用同目录文件，MUST NOT 跨技能目录引用
-->