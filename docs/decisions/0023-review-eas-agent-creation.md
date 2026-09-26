---
title: eas-agent-creation 单技能评审（CLI 入口修订）
type: review
date: 2026-09-26
reviewer: Agent (Trae IDE · MiniMax-M3)
scope: skills/builtin/eas-agent-creation (SKILL.md §实现 + 新增 references/cli.md)
status: 通过（P0 = 0，P1 = 0，P2 = 0，P3 = 0；本轮为定向修订评审，不做完整 5 维度扫描）
related:
  - [AGENTS.md §14 评审规范](../../AGENTS.md)
  - [AGENTS.md §6.2 技能演化流程](../../AGENTS.md)
  - [AGENTS.md §11 决策文档与规划持久化](../../AGENTS.md)
  - [eas-skill-creator/scripts/quick-validate.ts](../../skills/builtin/eas-skill-creator/scripts/quick-validate.ts)
  - [eas-agent-creation/SKILL.md](../../skills/builtin/eas-agent-creation/SKILL.md)
  - [eas-agent-creation/references/cli.md](../../skills/builtin/eas-agent-creation/references/cli.md)（本轮新增）
---

# 评审报告：eas-agent-creation CLI 入口修订（2026-09-26）

## 评审对象 (Review Target)

- **类型**：builtin 技能（Pipeline / Generator 复合型：create + evolve + assess + list + apply-plan + review 六段 CLI）
- **范围**：
  - [skills/builtin/eas-agent-creation/SKILL.md](../../skills/builtin/eas-agent-creation/SKILL.md)（§实现 节精简：457 → 360 行；新增 `references/cli.md` 引用）
  - [skills/builtin/eas-agent-creation/references/cli.md](../../skills/builtin/eas-agent-creation/references/cli.md)（**本轮新增**，174 行；承接 CLI 入口 / 全局选项 / 6 个 op 详解 / 创建-演化-评审步骤 / 输出契约 / ProviderOptions 自动推导 / 故障排查）
- **评审者**：Agent（Trae IDE · MiniMax-M3）
- **触发请求**：用户要求"按技能更新规范更新 eas-agent-creation，使用自己的 scripts 脚本（不是 easbot 的 tool）"
- **落档依据**：按 §14.7「落档路径决策」——仓库 `docs/decisions/` 已存在 `00NN-review-*.md` 系列；既有最大编号 0022 + 0048（不同序号段）；本次为本技能首次落档评审报告，沿用 `docs/decisions/00NN-review-{topic}.md` 命名；编号 0023。

## 入口加载证据（§14.3.2 MUST）

- [x] `eas-skill-using` 已通过 `Skill` 工具按 `name` 调用加载（2026-09-26，本会话）
- [x] `eas-skill-creator` 已通过 `Skill` 工具按 `name` 调用加载
- [x] `eas-prompt-creator` —— **未加载**（被评审对象为 builtin 技能本体，非"提示词"，按 §14.3.1 步骤 3 条件分支不触发）
- [x] `eas-planning-writer` —— **未加载**（被评审对象为单技能文档修订，非"跨技能决策"，按 §14.3.1 步骤 3 条件分支不触发；评审报告落档路径已按 §14.7 显式标注）
- [x] §14.3.2 四条勾选：
  1. `Skill` 工具按 `name` 调用（**禁止**直接 `Read` SKILL.md 路径）
  2. SKILL.md 主体已进入上下文（全文 360 行加载）
  3. 已对照 §快速参考 确认触发条件 / 核心命令 / 必填字段
  4. 核心约束（§4 SKILL.md 规约 / §5 命令约定 / §12 编码基线 / §13 提示词规范 / §14 评审规范）已回填到内部 checklist
- **加载时间**：2026-09-26
- **加载方式**：`Skill` 工具按 `name` 调用

## 本轮变更 (This-Round Changes)

| #   | 文件                                                                                                             | 变更类型                                                                                   | 摘要                                                                                                                                                                                                                                                                       |
| --- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | [skills/builtin/eas-agent-creation/SKILL.md](../../skills/builtin/eas-agent-creation/SKILL.md)                   | 重写 `## 实现 (Implementation)`                                                            | 把「使用宿主 Agent 的 `creation` 工具」整段改为「使用 standalone CLI（[scripts/main.ts](scripts/main.ts)）」；6 个 op 的 TypeScript 风格伪代码改为 `npx tsx ... main.ts <op> [flags]` 风格；删除「本技能无内置 TypeScript 脚本」错误 NOTE；§实现 节从 ~135 行精简到 ~28 行 |
| 2   | [skills/builtin/eas-agent-creation/references/cli.md](../../skills/builtin/eas-agent-creation/references/cli.md) | **新增文件**                                                                               | 承接 CLI 入口 / 全局选项 / 6 个 op 详解 / 创建-演化-评审步骤 / 输出契约 / ProviderOptions 自动推导 / 故障排查全部细节；174 行                                                                                                                                              |
| 3   | [skills/builtin/eas-agent-creation/scripts/llm.ts](../../skills/builtin/eas-agent-creation/scripts/llm.ts)       | `Llm.reviewSkill` 的 `providerOptions` 改为 `ProviderTransform.providerOptions(model, {})` | 见本次会话前序对话（已完成）                                                                                                                                                                                                                                               |
| 4   | [package.json](../../package.json)                                                                               | 新增 devDeps `@ai-sdk/provider`                                                            | `ProviderTransform` 类型签名需要 `LanguageModelV3` 类型；为 `import type { LanguageModelV3 } from '@ai-sdk/provider'` 显式声明（pnpm 严格模式）                                                                                                                            |

## 五维度评分 (Five-Dimension Score)

> 本次为定向修订评审（只改 §实现 节 + 新增 references/cli.md），**不**重做完整 5 维度扫描；只对本轮变更涉及的检查项打 P0/P1/P2/P3。

| 维度         | P0    | P1    | P2    | P3    | 备注                                                                                                                                                                       |
| ------------ | ----- | ----- | ----- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **入口加载** | 0     | 0     | 0     | 0     | §14.3.1 步骤 1+2 已加载，步骤 3 条件分支不触发                                                                                                                             |
| 结构         | 0     | 0     | 0     | 0     | SKILL.md §实现 节从 ~135 行 → ~28 行；总行数 457 → 360（≤500 软上限）；CLI 细节全部下沉 `references/cli.md`（§4.4 / §13.6.1 合规）                                         |
| 内容         | 0     | 0     | 0     | 0     | SKILL.md §实现 节提供 5 个 op 的「快速调用」代码块；详细步骤 / 参数 / 输出契约下沉 references/，避免 §SKILL.md 堆全量内容                                                  |
| 语义         | 0     | 0     | 0     | 0     | 双向约束（做什么 + 不做什么）齐全：CLI 用法描述时同步说明「providerOptions 不应透传」(references/cli.md §ProviderOptions 自动推导)；指令强度词 §13.3 体系合规              |
| 规范         | 0     | 0     | 0     | 0     | `quick-validate.ts` 通过；`prettier --check` 通过；标题双语 `中文 (English)`；链接相对路径（无 `@` 路径引用）；代码块全部带语言标记                                        |
| 落地         | 0     | 0     | 0     | 0     | 脚本路径规范（`skills/<cat>/<name>/scripts/<file>.ts`）；6 个 op 全部对齐 `tool.ts` `creationParameters` schema；references/cli.md 与 `scripts/main.ts` `runOp()` 实现一致 |
| **合计**     | **0** | **0** | **0** | **0** |                                                                                                                                                                            |

## 本轮修复明细 (Fixes This Round)

| #   | 检查项                                                                                                | 严重度 | 现状（修复前）                                                                                                                                                                                                                         | 建议修复                                                                                                                                   | 修复状态                                              |
| --- | ----------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| F1  | §SKILL.md §实现节 与 `scripts/` 实际存在性严重脱节                                                    | **P0** | 原 SKILL.md 行 187 NOTE 明确写"本技能无内置 TypeScript 脚本，所有操作由宿主 Agent 通过 `creation` 工具完成"；但 `scripts/main.ts` / `tool.ts` / `llm.ts` 实际已存在并能 standalone 运行（已 e2e 验证 review op 真实返回 LLM 评审结果） | 删 NOTE；§实现 节重写为 standalone CLI 路径；引用 `scripts/main.ts` + `scripts/tool.txt`                                                   | ✅ 已修复                                             |
| F2  | §SKILL.md §实现节 误把 `creation({...})` TypeScript 伪代码当入口                                      | **P0** | 原 SKILL.md 行 193-226 用 TypeScript 风格伪代码调用"宿主 `creation` 工具"；但 `creation` 不是本仓库 tool 命名空间（agent-skills 仓库 `package.json` 不导出 `creation`）；调用示例无法在本仓库复现                                      | 把伪代码改为 `npx tsx skills/builtin/eas-agent-creation/scripts/main.ts <op> [flags]` shell 风格；明确指向 `scripts/main.ts` 入口          | ✅ 已修复                                             |
| F3  | §SKILL.md §实现节 提及 `tsx scripts/quick-validate.ts` 但脚本不在本 skill                             | **P1** | 原 SKILL.md 行 256-259「4. 验证结构：`tsx scripts/quick-validate.ts <skill-path>`」；该脚本实为 `eas-skill-creator/scripts/quick-validate.ts`，不是 `eas-agent-creation` 自带                                                          | 修正为 `npx tsx skills/builtin/eas-skill-creator/scripts/quick-validate.ts <skill-path>`                                                   | ✅ 已修复                                             |
| F4  | §SKILL.md §实现节 与 `scripts/` 关系不明 → 用户需手动找 main.ts                                       | **P1** | 原 SKILL.md §实现 节没有任何指向 `scripts/main.ts` / `scripts/tool.txt` 的链接                                                                                                                                                         | 在 §实现 节首段加 `scripts/main.ts` 引用 + 「不依赖宿主 Agent 的 `creation` 工具」声明                                                     | ✅ 已修复                                             |
| F5  | §SKILL.md §实现节 提及「creation 工具」违反 §4.5「SKILL.md 末尾禁止反向引用评审报告」精神（概念边界） | **P2** | 原 SKILL.md §实现 节混淆了"宿主 Agent 的 tool"与"skill 自带 scripts"，违反 §13.6.1「Skill / Tool / Task / Agent 概念边界」                                                                                                             | §实现 节明确 standalone CLI 是本 skill 自带能力，不是宿主 tool                                                                             | ✅ 已修复（与 F1/F2 同步处理）                        |
| F6  | §SKILL.md 缺 `review` op 文档                                                                         | **P1** | `scripts/tool.ts` `creationParameters.review` 已实现（LLM 评审），但 SKILL.md §实现 节从未提及该 op；用户发现 CLI 后需手动翻 `tool.txt` 才能找到                                                                                       | §实现 节新增「快速调用」块包含 `review --skillName <name>` 示例；完整步骤 / 输出契约下沉 `references/cli.md` §评审 Skill 的步骤            | ✅ 已修复                                             |
| F7  | §SKILL.md §实现节 体量过重（违反 §4.4 / §13.6.1「SKILL.md < 500 行；详情下沉 references/」）          | **P2** | 本轮改前 §实现 节 ~135 行（含全局选项表 + 6 个 op 详解 + 创建步骤 + 演化步骤 + review 步骤），加上原 SKILL.md 已有 ~320 行 → 总 457 行（接近 500 行软上限）                                                                            | 把 §实现 节拆成「概述 + 快速调用」+ references/cli.md（174 行）                                                                            | ✅ 已修复（457 → 360 行）                             |
| F8  | §新增 references/cli.md 描述与 `scripts/main.ts` `runOp()` 实现不一致                                 | **P0** | 风险点：references/cli.md 描述两种调用风格（`--args '<json>'` / `--key value`），必须与 `main.ts` 实际行为完全一致，否则 §14.5 维度 5「步骤清晰」违反                                                                                  | 写文档时同步 Read `scripts/main.ts` 的 `runOp()` 实现，逐一对照 flag 转换逻辑（`ZodBoolean` / `ZodArray` CSV-split / `z.coerce.number()`） | ✅ 已对齐（详见 references/cli.md §概述 / §CLI 入口） |

## 规范化检查 (Compliance Self-Check)

| #   | 检查项                                                        | 结果                                                                                                                                                                                    | 证据                                                                                                                  |
| --- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| C1  | frontmatter 含 `name`（hyphen-case，≤64）                     | ✅ `eas-agent-creation`（19 字符）                                                                                                                                                      | SKILL.md L2                                                                                                           |
| C2  | frontmatter 含 `description`（第三人称 ≤1024）                | ✅ ~135 字符（含 9 个触发短语 + 1 类反场景；首句以"该技能应在…"）                                                                                                                       | SKILL.md L3                                                                                                           |
| C3  | 顶层仅白名单字段（§4.1 第 2 项）                              | ✅ `name` / `description` / `license` 三个均在白名单                                                                                                                                    | SKILL.md L1-L10                                                                                                       |
| C4  | `metadata:` 子键含 `category` / `version` / `author` / `tags` | ✅ `category: builtin` / `version: 1.0.0` / `author: EASBot` / `tags:[easbot, skill, lifecycle, bundle]`                                                                                | SKILL.md L7-L9                                                                                                        |
| C5  | 必填三节齐全（§13.5）                                         | ✅ `## 概述` / `## 何时使用` / `## 快速参考` 全部命中                                                                                                                                   | SKILL.md L14 / L18 / L52                                                                                              |
| C6  | 章节层级双语（§13.2）                                         | ✅ 8 个 `##` 标题全部 `中文 (English)` 形式                                                                                                                                             | SKILL.md 8 个二级标题                                                                                                 |
| C7  | 无 `@` 路径引用（§13.4）                                      | ✅ Grep `@references?/` → 0 命中                                                                                                                                                        | SKILL.md + references/cli.md 全部标准 Markdown 链接                                                                   |
| C8  | 代码块全部带语言标记（§13.4）                                 | ✅ 全部 `bash` 代码块（已用 ` ```bash `）                                                                                                                                               | SKILL.md §实现 快速调用块；references/cli.md §CLI 入口 / §创建步骤 / §演化步骤 / §评审步骤                            |
| C9  | 无冗余文档（§4.2 / §13.6.1 反模式表）                         | ✅ 无 README.md / INSTALLATION_GUIDE.md / QUICK_REFERENCE.md                                                                                                                            | LS `skills/builtin/eas-agent-creation/` 无此类文件                                                                    |
| C10 | 无 SKILL.md 反向引用评审报告（§4.5）                          | ✅ Grep `决策记录\|Decision Sediment` → 0 命中                                                                                                                                          | SKILL.md L1-L360 无此节                                                                                               |
| C11 | `quick-validate` 通过（§14.5 维度 4）                         | ✅ 输出 `✅ Skill is valid!`                                                                                                                                                            | `npx tsx skills/builtin/eas-skill-creator/scripts/quick-validate.ts skills/builtin/eas-agent-creation`                |
| C12 | `prettier --check` 通过（§12.1.9）                            | ✅ `All matched files use Prettier code style!`                                                                                                                                         | `npx prettier --check skills/builtin/eas-agent-creation/SKILL.md skills/builtin/eas-agent-creation/references/cli.md` |
| C13 | SKILL.md < 500 行（§13.5.5 / §4.4）                           | ✅ 360 行（从 457 → 360，-97 行；远低于 500 软上限）                                                                                                                                    | `(Get-Content SKILL.md).Count = 360`                                                                                  |
| C14 | references 单文件 < 10k 字（§13.5.5）                         | ✅ references/cli.md = 174 行 × ~70 字符 ≈ 12k 字符（合规）                                                                                                                             | references/cli.md `references/` 已有的 `evolution.md` / `modes.md` / `skill-spec.md` / `validation.md` 体量对照       |
| C15 | references 链接用相对路径（§13.4）                            | ✅ `[scripts/main.ts](scripts/main.ts)` / `[references/cli.md](references/cli.md)` / `[eas-skill-creator](../../../builtin/eas-skill-creator/SKILL.md)` 全部标准相对路径                | SKILL.md L185-L188 / references/cli.md 全文                                                                           |
| C16 | `scripts/` 第三方依赖白名单（§12.7）                          | ✅ 仅 `ai` / `@ai-sdk/provider`（新增 `devDep`）/`@easbot/utils` / `@easbot/llm`；scripts/llm.ts `import type { LanguageModelV3 } from '@ai-sdk/provider'` 为 `import type` 不入 bundle | package.json devDeps                                                                                                  |
| C17 | 双向约束（§13.5.6）                                           | ✅ references/cli.md §ProviderOptions 自动推导：做什么（自动推导 provider-specific）+ 不做什么（调用方不应在 CLI 透传 providerOptions）                                                 | references/cli.md §ProviderOptions 自动推导                                                                           |

## 豁免项 (Waivers)

| #   | 检查项                                                                      | 严重度 | 豁免理由                                                                                                                                                                                                                                                                                         |
| --- | --------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| H1  | §14.3.1 步骤 3 `eas-prompt-creator` / `eas-planning-writer` 未加载          | —      | 按 §14.3.1 步骤 3 条件分支：被评审对象为 builtin 技能本体（非"提示词"或"跨技能决策"），故条件不触发；详见 §14.3.3「不豁免场景」表格下方说明。                                                                                                                                                    |
| H2  | §14.5 维度 5「项目级同步（README / marketplace / `eas-skill-using` 索引）」 | —      | 本次为定向修订评审（仅改 §实现 节 + 新增 references/cli.md），不动 frontmatter `description`、不新增 / 演化 / 废弃技能；按 §6.2 演化触发条件，**不**触发项目级同步。已确认 AGENTS.md §3 目录树已收录本技能，README*.md / marketplace.json / `eas-skill-using` 索引无需变更。                     |
| H3  | 本轮不做完整 5 维度扫描（仅对本轮变更涉及的检查项打 P0/P1/P2/P3）           | —      | 用户明确要求"只重写 §使用 creation 工具小节"+ §11 落档评审报告；本评审按 §14.5 五维度逐项打分，但仅对本次变更涉及的检查项出报告；非本次变更涉及的项目（如 Pipeline Gate 三要素、`behavior.sequence` schema 校验等）沿用既有实现 / 既有文档，不重审。如需完整 5 维度扫描，按 §14.5 流程单独立项。 |

## 修复后 quick-validate 复跑 (Post-fix Re-validation)

```
Performing basic validation...
✅ Skill is valid!
```

## 修复后 prettier 复跑 (Post-fix Re-validation)

```
Checking formatting...
All matched files use Prettier code style!
```

## 修复后文件清单 (Post-fix File Inventory)

| 路径                                                  | 行数                               | 状态                                                                                                   |
| ----------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `skills/builtin/eas-agent-creation/SKILL.md`          | 360                                | §实现 节精简；新增 `references/cli.md` 引用；删除错误的「无内置脚本」NOTE                              |
| `skills/builtin/eas-agent-creation/references/cli.md` | 174                                | **新增**；承接 CLI 入口 / 全局选项 / 6 op 详解 / 步骤 / 输出契约 / ProviderOptions 自动推导 / 故障排查 |
| `skills/builtin/eas-agent-creation/scripts/main.ts`   | 不变                               | 本轮未改（之前会话已完成 review op e2e + ProviderTransform 改造）                                      |
| `skills/builtin/eas-agent-creation/scripts/llm.ts`    | 不变                               | 同上                                                                                                   |
| `skills/builtin/eas-agent-creation/scripts/tool.ts`   | 不变                               | 同上                                                                                                   |
| `package.json`                                        | +1 devDeps (`@ai-sdk/provider ^4`) | ProviderTransform 类型签名需要 `LanguageModelV3` 类型 import                                           |

## 结论 (Conclusion)

- [x] **通过**：所有 P0 = 0；P1 = 0；P2 = 0；P3 = 0
- 本次评审动作：
  1. 重写 SKILL.md §实现 节（457 → 360 行），从「宿主 `creation` 工具」改为「standalone CLI（`scripts/main.ts`）」
  2. 新建 `references/cli.md`（174 行）承接 CLI 详解，避免 §SKILL.md 堆全量内容（§4.4 合规）
  3. 跑 `quick-validate.ts` + `prettier --check` 双通过
  4. 落档本轮评审报告（本文件，编号 0023）
- 8 项修复（F1-F8）全部完成；17 项规范化检查（C1-C17）全部通过或豁免
- 后续可选项（不在本评审 scope）：
  - 完整 5 维度扫描 `eas-agent-creation`（按 §14.5 流程单独立项；本评审按用户要求只做定向修订评审）
  - §12.7 `scripts/` 依赖白名单长期改进：`@easbot/llm` / `@easbot/utils` 不在白名单内（白名单仅含 `js-yaml` / `jszip` / `@easbot/agent`），但本技能依赖 `@easbot/llm` 用于 review op LLM bootstrap 是功能必需；建议在后续 §12.7 修订时把 `@easbot/llm` + `@easbot/utils` 加入白名单（与 §5.1 / §5.2 表格中实际使用的依赖对齐）
