---
name: eas-agent-evolution
description: 该技能应在 Agent 需要进行自我初始化、身份认知建立、配置文件生成、备份恢复或持续进化时使用。覆盖 Agent 从 bootstrap 到持续完善的完整生命周期（init / identity / backup / evolve）。触发短语：初始化 Agent、Agent bootstrap、身份认知、备份配置、恢复配置、持续进化。不适用：纯业务任务 / 不涉及 Agent 配置的代码编写 / 第三方 Agent 框架。
category: builtin
version: 1.0.0
tags: [easbot, agent, bootstrap, identity, backup]
---

# eas-agent-evolution (EASBot Agent 自我进化技能)

> **CRITICAL**: 任何对 `eas-agent-evolution` 技能或模板的修改，必须调用本技能完成，禁止手动编辑。

## 概述 (Overview)

`eas-agent-evolution` 是 EASBot 多 Agent 协作生态系统的核心技能，负责指导 Agent 进行自我初始化和持续进化。该技能通过引导式信息收集、自动化文件生成与备份恢复机制，实现 Agent 的身份认知建立、行为准则定义和持续自我完善。

## 何时使用 (When to Use)

该技能应在以下场景使用：

- Agent 首次初始化，需要建立身份认知体系
- 需要生成或更新 BOOT.md、IDENTITY.md、SOUL.md、USER.md 等核心配置文件
- 需要通过交互式问答收集用户信息和 Agent 身份信息
- 需要备份或恢复 Agent 配置文件
- Agent 需要持续自我完善和进化

## 快速参考 (Quick Reference)

**核心脚本**：
- `scripts/init-agent.ts` - 初始化 Agent，生成核心配置文件
- `scripts/validate-config.ts` - 验证配置文件格式和完整性
- `scripts/update-agent.ts` - 更新 Agent 配置，支持增量更新
- `scripts/backup-config.ts` - 备份配置文件，支持恢复

**文件优先级**：
| Priority | 文件 | 说明 |
|----------|------|------|
| 1 | BOOT.md | 第一性原则 |
| 20 | IDENTITY.md | 身份定义 |
| 40 | SOUL.md | 行为准则 |
| 50 | USER.md | 用户信息 |

**关键前置阅读**：
- 调用 `init-agent.ts` 前必须先读 [workspace 与 agentId 说明](references/workspace-and-agent-id.md)，了解 `workspace` 与 `agentId` 的语义与硬约束。

## 核心功能 (Core Functions)

### 1. Agent 初始化 (Agent Initialization)

使用 `init-agent.ts` 脚本初始化 Agent：

```bash
npx tsx scripts/init-agent.ts --output .easbot
```

**命令行参数（9个核心参数）**：

| 参数 | 必填 | 说明 |
|------|------|------|
| `--workspace` | ✅ 必填 | Agent 的 workspace 路径 |
| `--output` | 否 | 输出目录，默认 `.easbot`（相对于 workspace） |
| `--non-interactive` | 否 | 非交互模式 |
| `--agent-name` | ✅ 必填 | Agent 身份名称 |
| `--user-name` | ✅ 必填 | 用户姓名 |
| `--preferred-name` | 否 | 用户称呼偏好 |
| `--mission` | ✅ 必填 | 核心使命 |
| `--core-relationship` | 否 | 核心关系 |
| `--core-values` | 否 | 核心价值观（逗号分隔） |
| `--behavior-style` | 否 | 行为风格 |
| `--decision-principles` | 否 | 决策原则（逗号分隔） |

**完整示例（9个参数，包括 --workspace）**：

```bash
npx tsx scripts/init-agent.ts \
  --workspace E:\work\apps\eas\easbot\packages\agent \
  --non-interactive \
  --output .easbot \
  --agent-name 小莫 \
  --user-name jallen \
  --preferred-name 剑哥 \
  --mission 与jallen一起探索和成长 \
  --core-relationship 伙伴 \
  --core-values 真诚,透明,信任 \
  --behavior-style 专业且友好 \
  --decision-principles 效率,准确性,安全性
```

**参数说明**：
- `--core-values` 和 `--decision-principles` 为多选参数，使用逗号分隔，无需引号
- 所有参数值会自动去除单双引号

**参数验证规则**：

在 `--non-interactive` 模式下，以下参数为必填：
- `workspace` - Agent 的 workspace 路径（必须传入）
- `agentName` - Agent 身份名称
- `userName` - 用户姓名
- `mission` - 核心使命

**交互式信息收集（默认模式）**：
- 第一轮（核心确定）：Agent 名称、用户姓名、称呼偏好、核心使命
- 第二轮（行为准则）：核心关系、核心价值观、行为风格、决策原则

**初始化输出文件**：
- `protocol.json` - 协议元数据文件，包含版本、时间和核心元数据

### 2. 配置验证 (Config Validation)

使用 `validate-config.ts` 脚本验证配置：

```bash
npx tsx scripts/validate-config.ts --config-path .easbot
```

### 3. 配置更新 (Config Update)

使用 `update-agent.ts` 脚本更新配置：

```bash
# 更新字符串字段
npx tsx scripts/update-agent.ts --field name --value "小莫"

# 更新数组字段（使用 --json）
npx tsx scripts/update-agent.ts --field coreValues --json '["真诚", "信任"]'

# 指定配置目录
npx tsx scripts/update-agent.ts --config-path .easbot --field name --value "新名称"
```

**命令行参数**：

| 参数 | 必填 | 说明 |
|------|------|------|
| `--config-path` | 否 | 配置目录，默认 `.easbot` |
| `--field` | ✅ | 要更新的字段名 |
| `--value` | 否 | 字段值（字符串） |
| `--json` | 否 | 字段值（JSON 格式，用于数组） |

**使用说明**：
- 使用 `--value` 更新字符串字段
- 使用 `--json` 更新数组字段（需要传入 JSON 格式）
- `--value` 和 `--json` 互斥，只能使用其中一个

### 4. 配置备份 (Config Backup)

使用 `backup-config.ts` 脚本备份配置：

```bash
npx tsx scripts/backup-config.ts --retention-days 30
```

## 文件结构 (File Structure)

```
workspace/.easbot/
├── BOOT.md          # Priority 1 - 第一性原则
├── IDENTITY.md      # Priority 20 - 身份定义
├── AGENTS.md        # Priority 30 - 工作区导航
├── SOUL.md          # Priority 40 - 行为准则
├── USER.md          # Priority 50 - 用户信息
├── TOOLS.md         # Priority 60 - 工具配置
├── CONTEXT.md       # Priority 70 - 动态上下文
└── CODER.md         # Priority 80 - Coder 模式专用
```

## 备份机制 (Backup Mechanism)

备份文件存储在 `Global.Path.data/backup/yyyy-mm-dd/` 目录下，按天组织：

```
~/.local/share/easbot/backup/
└── 2026-04-17/
    ├── BOOT.md
    ├── IDENTITY.md
    ├── SOUL.md
    └── USER.md
```

### 定时备份任务 (Scheduled Backup Task)

使用 `register-backup-task.ts` 脚本注册定时备份任务：

```bash
# 注册默认备份任务（每天凌晨 2 点）
npx tsx scripts/register-backup-task.ts register

# 自定义备份时间（每 6 小时）
npx tsx scripts/register-backup-task.ts register --cron="0 */6 * * *"

# 列出所有备份任务
npx tsx scripts/register-backup-task.ts list
```

备份命令作为 local command 由 scheduler 定时触发执行。

## 参考资料 (References)

- [workspace 与 agentId 说明](references/workspace-and-agent-id.md) — 初始化前必读
- [优先级系统说明](references/priority-system.md)
- [文件结构说明](references/file-structure.md)
- [内容分类说明](references/content-classification.md)
- [文件级修改规范](references/file-modification-rules.md)

## 模板文件 (Templates)

模板文件位于 `references/templates/` 目录：

- `boot-template.md` - BOOT.md 生成模板
- `identity-template.md` - IDENTITY.md 生成模板
- `soul-template.md` - SOUL.md 生成模板
- `user-template.md` - USER.md 生成模板
- `agents-template.md` - AGENTS.md 生成模板

## 与其他技能的关系 (Relationships with Other Skills)

- **eas-skill-creator**: 本技能遵循 eas-skill-creator 定义的技能结构
- **eas-prompt-creator**: 生成的配置文件符合 eas-prompt-creator 规范
- **eas-skill-using**: 本技能与 `eas-skill-using` 协同工作；概念边界（Skill vs Agent）见 `eas-skill-using` §关键概念（按 `Skill` 工具按 name 加载）
- **eas-skill-find**: 本技能支持通过 eas-skill-find 被发现

## 常见错误 (Common Mistakes)

- **错误**: 在更新配置时违背 BOOT.md 中的第一性原则
- **解决方案**: update-agent.ts 会自动验证并拒绝违反核心原则的更新

- **错误**: 忘记在更新前创建备份
- **解决方案**: update-agent.ts 默认自动创建备份，无需手动操作

## 文件级修改规范 (File-Level Modification Rules)

本技能管理的所有文件（`protocol.json` / 模板 / 生成文件）的修改规范统一维护在 [references/file-modification-rules.md](references/file-modification-rules.md)。**修改前必须先读该文档**。

涵盖的关键规则：

- `protocol.json` schema 与必填字段（agentId / workspace / name / userName / mission）
- 模板文件 frontmatter 规范（`name` / `description` ≤80 字符 / `type` / `scope` / `priority` / `permission`）
- 模板修改判定分级（MUST / SHOULD / MAY / cleanup）
- `init-agent.ts` 脚本修改触发场景与代码规范
- `question` 工具问题数量限制（每次 ≤3）与两轮信息收集设计
- `.meta.md` 文件规范与动态渲染（不预渲染、不生成静态 BOOT.md）
- 备份触发场景与目录结构（`~/.local/share/easbot/backup/yyyy-mm-dd/`）
