---
title: eas-knowledge-using 单技能评审报告
type: review
date: 2026-09-25
reviewer: Agent (Trae IDE · MiniMax-M3)
scope: skills/tools/eas-knowledge-using (SKILL.md + references/{codebase,note,memory}.md)
status: 通过（P0 = 0，P1 = 1 已修复，P2 = 0，P3 = 0）
related:
  - [AGENTS.md §11 决策文档与规划持久化](../../AGENTS.md)
  - [AGENTS.md §14 评审规范](../../AGENTS.md)
  - [eas-skill-creator/scripts/quick-validate.ts](../../skills/builtin/eas-skill-creator/scripts/quick-validate.ts)
  - [eas-knowledge-using/SKILL.md](../../skills/tools/eas-knowledge-using/SKILL.md)
---

# 评审报告：eas-knowledge-using 单技能评审（2026-09-25）

## 评审对象 (Review Target)

- **类型**：tools 技能（Pipeline 类：detect-signal → get-permission → run-cli → verify-retry 四阶段 CLI 命令模板输出）
- **范围**：
  - [skills/tools/eas-knowledge-using/SKILL.md](../../skills/tools/eas-knowledge-using/SKILL.md)（233 行）
  - [skills/tools/eas-knowledge-using/references/codebase.md](../../skills/tools/eas-knowledge-using/references/codebase.md)（844 行）
  - [skills/tools/eas-knowledge-using/references/note.md](../../skills/tools/eas-knowledge-using/references/note.md)（515 行）
  - [skills/tools/eas-knowledge-using/references/memory.md](../../skills/tools/eas-knowledge-using/references/memory.md)（627 行）
- **评审者**：Agent（Trae IDE · MiniMax-M3）
- **触发请求**：用户要求"安装技能评审规范，认真评审和完善 `eas-knowledge-using` 这个技能"
- **落档依据**：按 §14.7「落档路径决策」—— 仓库 `docs/decisions/` 已存在 `00NN-review-*.md` 评审报告（项目级惯例），单技能评审 MUST 沿用 `docs/decisions/00NN-review-{topic}.md` 命名；编号从 0021 递增（既有最大 0020）

## 入口加载证据（§14.3.2 MUST）

- [x] `eas-skill-using` 已通过 `Skill` 工具按 `name` 调用加载（2026-09-25，本会话第 1 次 Skill 调用）
- [x] `eas-skill-creator` 已通过 `Skill` 工具按 `name` 调用加载（本会话第 2 次 Skill 调用）
- [x] `eas-prompt-creator` —— **未加载**（本次评审对象为 builtin 技能本体，非"提示词"，按 §14.3.1 步骤 3 条件分支不触发）
- [x] `eas-planning-writer` —— **未加载**（本次评审为单技能评审，§14.3.1 步骤 3 条件分支仅在"跨技能决策"时触发；评审报告落档路径已按 §14.7 显式标注）
- [x] §14.3.2 四条勾选：
  1. Skill 工具按 `name` 调用（**禁止**直接 `Read` SKILL.md 路径）
  2. SKILL.md 主体已进入上下文（全文 233 行加载）
  3. 已对照 §快速参考 确认触发条件 / 核心命令 / 必填字段
  4. 核心约束（§4 SKILL.md 规约 / §5 命令约定 / §12 编码基线 / §13 提示词规范）已回填到内部 checklist
- **加载时间**：2026-09-25
- **加载方式**：`Skill` 工具按 `name` 调用

## 五维度评分 (Five-Dimension Score)

| 维度         | P0    | P1    | P2    | P3    | 备注                                                                                                        |
| ------------ | ----- | ----- | ----- | ----- | ----------------------------------------------------------------------------------------------------------- |
| **入口加载** | 0     | 0     | 0     | 0     | §14.3.1 步骤 1+2 已加载，步骤 3 条件分支不触发                                                              |
| 结构         | 0     | 1     | 0     | 0     | 见发现项 #1（顶层 `mode` / `composition` / `behavior` 位置）                                                |
| 内容         | 0     | 0     | 0     | 0     | 概述 / 何时使用 / 快速参考齐全；description 390 字符（< 500 推荐）、第三人称、10 个触发短语 + 1 个反场景    |
| 语义         | 0     | 0     | 0     | 0     | 指令强度词 §13.3 体系合规（MUST / NEVER / SHOULD 选用恰当）；无歧义词；无主观评价                           |
| 规范         | 0     | 0     | 0     | 0     | 命名合规 / 双语标题合规 / 链接全部相对路径（无 `@` 路径引用）/ 代码块全部带语言标记 / `quick-validate` 通过 |
| 落地         | 0     | 1     | 0     | 0     | 见发现项 #2（§入口矩阵 MCP 子命令数缺位）                                                                   |
| **合计**     | **0** | **2** | **0** | **0** |                                                                                                             |

## 发现项明细 (Findings)

| #   | 维度              | 检查项                                   | 严重度 | 现状                                                                                                                                                                                                                                                                                                                                                                                          | 建议修复                                                                                                                                                      | 修复状态                  |
| --- | ----------------- | ---------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| 1   | 结构-1.3          | frontmatter 顶层白名单 vs 项目惯例一致性 | P1     | `mode: pipeline` / `composition: single` / `behavior:` 放在 SKILL.md 顶层。`quick-validate.ts` L79-93 白名单**显式允许**这五个字段放顶层（`mode` / `composition` / `behavior` / `secondaryModes` / `compositionConnections`），但与项目同类 tools 技能（`eas-docx` / `eas-pdf`）的"放 `metadata:` 子键"惯例不一致。`category` / `version` / `author` / `tags` 等已正确放在 `metadata:` 子键。 | **不修**——`quick-validate` 白名单与项目明文规范一致（§4.1 第 2 项「顶层白名单」），属于"合规但风格不一致"非阻塞项。已在评审报告 §豁免项 H3 显式记录决策依据。 | ⚠️ 豁免保留               |
| 2   | 落地-5.1          | §入口矩阵 MCP 子命令数缺位               | P1     | SKILL.md §双 CLI 入口与安装 入口矩阵提到「`<kb> mcp` 子命令」但**未列子命令数**；具体 MCP 工具数（codebase 9 / note 8 / memory 10）只在 `references/*.md` §0 列出。Agent 加载 SKILL.md 时若未触发 references，按需读才能拿到 MCP 工具数。                                                                                                                                                     | 在 §入口矩阵的 MCP 行追加「（codebase 9 / note 8 / memory 10 个工具）」，让首屏即可对照。                                                                     | ✅ 已修复（SKILL.md L88） |
| 3   | 维度 4-命名       | 命名规范                                 | —      | `eas-knowledge-using` 全部小写 + 连字符 + `eas-` 前缀；≤ 64 字符                                                                                                                                                                                                                                                                                                                              | —                                                                                                                                                             | ✅ 合规                   |
| 4   | 维度 4-代码块     | 代码块带语言标记                         | —      | 全部代码块带 `bash` / `markdown` / 标记；无裸 ` ``` `                                                                                                                                                                                                                                                                                                                                         | —                                                                                                                                                             | ✅ 合规                   |
| 5   | 维度 4-链接       | references 链接无 `@` 引用               | —      | Grep `(\.\./@\|\(@\)` 0 命中；所有 `@xxx` 出现均为 npm 包名（`@easbot/codebase` 等），符合 §13.4                                                                                                                                                                                                                                                                                              | —                                                                                                                                                             | ✅ 合规                   |
| 6   | 维度 5-行数       | SKILL.md 体量                            | —      | 233 行 < 500 行；references 单文件均 < 10k 字（codebase 844 行 / note 515 行 / memory 627 行）                                                                                                                                                                                                                                                                                                | —                                                                                                                                                             | ✅ 合规                   |
| 7   | 维度 5-Token 预算 | description 体量                         | —      | 390 字符 ≤ 500 推荐（硬上限 1024）                                                                                                                                                                                                                                                                                                                                                            | —                                                                                                                                                             | ✅ 合规                   |
| 8   | 维度 4-反模式     | §13.6.1 项目级规范反模式                 | —      | 无 README.md / INSTALLATION_GUIDE.md / QUICK_REFERENCE.md 等冗余文档                                                                                                                                                                                                                                                                                                                          | —                                                                                                                                                             | ✅ 合规                   |

## 豁免项 (Waivers)

| #   | 检查项                                                                               | 严重度 | 豁免理由                                                                                                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1  | §14.3.1 步骤 3 `eas-prompt-creator` / `eas-planning-writer` 未加载                   | —      | 按 §14.3.1 步骤 3 条件分支：被评审对象为 tools 技能本体（非"提示词"或"跨技能决策"），故条件不触发；详见 §14.3.3「不豁免场景」表格下方说明。                                                                                                                                                                                            |
| H2  | §14.5 维度 5「项目级同步（README / marketplace / `eas-skill-using` 索引）」          | —      | 本次评审为既有 skills/tools/ 技能完善，不修改 frontmatter `description`、不新增 / 演化 / 废弃技能；按 AGENTS.md §6.2 演化触发条件，**不**触发项目级同步（README / marketplace / `eas-skill-using` 索引三类同步只适用于 builtin 技能，tools 技能不进入 `eas-skill-using` 索引）。已确认 AGENTS.md §3 目录树已收录本技能，无需同步操作。 |
| H3  | 维度 1 frontmatter 顶层 `mode` / `composition` / `behavior` 与同类工具技能惯例不一致 | P1     | `quick-validate.ts` L79-93 顶层白名单**显式包含**这五个字段；AGENTS.md §4.1 第 2 项「顶层白名单」与之一致。本技能合规但风格上未与 `eas-docx` / `eas-pdf` 的"放 `metadata:` 子键"惯例对齐，属于"合规但风格不一致"非阻塞项。后续可在 §13.5 章节模板修订时统一。**不修**。                                                                |
| H4  | AGENTS.md §11 长任务持久化                                                           | —      | 本次为单技能评审完善（非跨 session / 多日推进 / 事后 Review 任务），无需 `.easbot/knowledge/tasks/<task-name>/` 三件套。                                                                                                                                                                                                               |

## 修复记录 (Fixes)

| #   | 发现项                        | 严重度 | 修复方式                                                                                                         | 文件                                                                   | 行号变化  |
| --- | ----------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------- |
| F1  | #2 §入口矩阵 MCP 子命令数缺位 | P1     | §入口矩阵的 MCP 行追加「codebase 9 / note 8 / memory 10 个工具」；并在「独立 CLI 全局选项」段补一句 MCP 命令简述 | [SKILL.md](../../skills/tools/eas-knowledge-using/SKILL.md) L88 / L106 | 233 → 235 |

### 修复后 §入口矩阵对比

| 入口                     | 命令前缀            | 安装方式                                                      | 适用                                                                                           |
| ------------------------ | ------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Agent 主 CLI**         | `easbot <kb> *`     | `@easbot/agent`（easbot 主包内置，pnpm workspace 已绑定）     | LLM 编程场景；走 commander 子集过滤（`codebase` 13 / `note` 11 / `memory` 12）                 |
| **独立 CLI（codebase）** | `easbot-codebase *` | `pnpm add @easbot/codebase` 或 `npm install @easbot/codebase` | 终端调试 / 一次性操作；全 23 个子命令                                                          |
| **独立 CLI（note）**     | `easbot-note *`     | `pnpm add @easbot/note` 或 `npm install @easbot/note`         | 终端调试 / 一次性操作；全 11 个子命令                                                          |
| **独立 CLI（memory）**   | `easbot-memory *`   | `pnpm add @easbot/memory` 或 `npm install @easbot/memory`     | 终端调试 / 一次性操作；全 12 个子命令；**per-agent 存储**需 `protocol.json`                    |
| **MCP server**           | `<kb> mcp` 子命令   | 同对应独立 CLI                                                | 其他 AI Agent 通过 MCP 协议消费（codebase 9 / note 8 / memory 10 个工具；详见各 reference §0） |

### 修复后 quick-validate 复跑

```
Performing basic validation...
✅ Skill is valid!
```

## 结论 (Conclusion)

- [x] **通过**：所有 P0 = 0；P1 = 2 项中 1 项已修复（F1）、1 项已豁免（H3）；P2 = 0；P3 = 0
- 本次评审完善动作：
  1. SKILL.md §入口矩阵 MCP 行补充子命令数（codebase 9 / note 8 / memory 10）
  2. SKILL.md 「独立 CLI 全局选项」段补一句 MCP 命令简述
  3. 落档本次评审报告（本文件）
- 后续可选项（不在本评审 scope）：
  - 顶层 `mode` / `composition` / `behavior` 与 `eas-docx` / `eas-pdf` 风格统一（项目级惯例修订时处理）
