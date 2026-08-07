---
title: 废弃 eas-skill-creator/references/skill-creation-guide.md
type: decision
date: 2026-08-08
status: 已批准
reviewer: Agent (Trae IDE · MiniMax-M3)
scope: skills/builtin/eas-skill-creator/references/skill-creation-guide.md
related:
  - [AGENTS.md §4 SKILL.md 规约](../AGENTS.md)
  - [AGENTS.md §6.3 技能废弃流程](../AGENTS.md)
  - [0004-review-eas-skill-creator.md](./0004-review-eas-skill-creator.md)
---

# 决策：废弃 `skill-creation-guide.md`

## 背景 (Background)

`eas-skill-creator/references/skill-creation-guide.md` 是早期创建的"技能创建实践指南"。在 2026-08-08 第二轮评审（0004）中已被标注 `[待合并 - 历史文档]`，本次用户指示"认真复习这个文档，业务这个技能是通用根技能，没必要描述这个，已经有 `skill-spec.md`"——明确判定删除。

## 决策 (Decision)

**删除** `skills/builtin/eas-skill-creator/references/skill-creation-guide.md`。

理由：

1. **职责 100% 重复**：8 个章节全部内容已在 SKILL.md / skill-spec.md / workflows.md 三个文件中有更新版本覆盖（详见下表）。
2. **违反 AGENTS.md §4.2 禁止附带冗余文档**：技能应仅包含 AI Agent 完成工作所需的信息。
3. **违反 AGENTS.md §13.6 反模式**：作为"实践指南"分散副本存在，破坏单一权威源。
4. **违反渐进式披露**：通用根技能已用 `skill-spec.md` 作为权威规范，无需第二份"实践指南"。
5. **不破坏 API**：没有任何 references 文件依赖该文件（grep 验证）。

## 内容归属对照表 (Content Attribution)

| skill-creation-guide.md 章节 | 已归属到 |
|---|---|
| §技能解剖 / 目录结构 | SKILL.md §核心功能 1. 技能的构成 |
| §SKILL.md 结构 / 必需部分 / 可选部分 | SKILL.md §Markdown主体 必需部分 + 可选部分 |
| §资源规划 (scripts/references/assets 何时使用) | SKILL.md §核心功能 1. 脚本 / 参考资料 / 资产 |
| §写作规范 / Frontmatter 写作 | SKILL.md §核心功能 1. YAML前置信息 + skill-spec.md §4 |
| §Body 写作 + 常见错误 | SKILL.md §技能创建规范 + 常见错误 |
| §脚本编写规范 / TypeScript 脚本 / 最佳实践 | SKILL.md §核心脚本实现 + workflows.md §核心脚本实现 |
| §渐进式披露 / 三级加载 / 引用规范 | SKILL.md §渐进式披露设计原则 + §参考资料 |

## 关键判断 (Key Judgments)

| 判断点 | 结论 |
|---|---|
| 是否新增独有内容？ | **否**——所有内容在其它文件均有更新版本 |
| 是否被其它文件依赖？ | **否**——grep 验证无任何 references 引用 |
| 删除是否破坏 CI？ | **否**——quick-validate 不检查特定 references 是否存在 |
| 是否需要过渡期保留？ | **否**——本仓库遵循 AGENTS.md §6.3 流程；该文件已加 `[待合并 - 历史文档]` 标记 1 个评审周期（round-2 评审 0004） |

## 具体动作 (Action Items)

| # | 动作 | 文件 |
|---|---|---|
| 1 | 落档本决策文档 | `docs/decisions/0005-archive-skill-creation-guide.md` |
| 2 | 删除 SKILL.md §详细定义参考 中对 skill-creation-guide.md 的引用 | `SKILL.md` 行 47 |
| 3 | 删除 SKILL.md §快速参考 中对 skill-creation-guide.md 的引用 | `SKILL.md` 行 88 |
| 4 | 删除文件本身 | `skills/builtin/eas-skill-creator/references/skill-creation-guide.md` |
| 5 | 运行 quick-validate 校验 | — |

## 影响 (Impact)

- **正面**：消除冗余文档，缩短 SKILL.md 索引清单，提升 `skill-spec.md` 单一权威源地位
- **中性**：本仓库 12 个 builtin/tools 技能均无引用该文件，无破坏面
- **风险**：0（grep 全量验证无引用依赖）

## 关联引用 (Related)

- [AGENTS.md §4 SKILL.md 规约](../AGENTS.md)
- [AGENTS.md §6 技能生命周期](../AGENTS.md)
- [AGENTS.md §13 提示词规范](../AGENTS.md)
- [0004-review-eas-skill-creator.md](./0004-review-eas-skill-creator.md)（第二轮评审标记 `[待合并 - 历史文档]`）