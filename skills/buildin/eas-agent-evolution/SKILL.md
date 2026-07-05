---
name: eas-agent-evolution
description: 该技能应在 Agent 需要进行自我初始化、身份认知建立、配置文件生成或持续进化时使用。技能提供完整的引导式信息收集、自动化文件生成和备份恢复机制，实现 Agent 的身份认知建立、行为准则定义和持续自我完善。
category: builtin
version: 1.0.0
tags: [easbot, agent, evolution, initialization, identity]
---

# eas-agent-evolution - EASBot Agent 自我进化技能 (EASBot Agent Evolution Skill)

> **⚠️ 重要声明**: 任何对 eas-agent-evolution 技能或模板的修改，必须调用 eas-agent-evolution 技能完成，禁止手动编辑。

## ⚠️ CRITICAL: workspace 参数说明

**MUST: Agent 必须传入自己的 workspace 路径**

Agent 运行时会在 `{{workspace}}/.easbot/` 目录下查找 `protocol.json` 配置文件。

### 关键概念

| 概念 | 说明 | 示例 |
|------|------|------|
| **agentId** | Agent 唯一标识符（peer-uuid 格式） | `peer-550e8400-e29b-41d4-a716-446655440000` |
| **workspace** | Agent 的工作目录（`Instance.directory`） | `E:\work\apps\eas\easbot\packages\agent` |
| **worktree** | Git 工作区根目录（`Instance.worktree`） | `E:\work\apps\eas\easbot` |
| **.easbot 目录** | 必须在 workspace 下，不能在 worktree 下 | `{{workspace}}/.easbot` |

### agentId 说明

**为什么需要 agentId？**

由于一个 session 可以随时切换 Agent，每个 Agent 需要一个唯一标识符来：

- 在多 Agent 协作中准确识别和路由消息
- 支持 session 内的 Agent 切换
- 提供持久化的 Agent 身份标识

**agentId 格式**：`peer-{uuid}`

- 使用 UUID v4 格式，确保全局唯一性
- 初始化时由 `init-agent.ts` 自动生成
- 生成后不可修改，存储在 `protocol.json.metadata.agentId`

**初始化时机**：

agentId 在 Agent 首次初始化时自动生成，使用 Agent 的 name 作为基础标识（虽然存在局限性，但在初始化阶段无法获取更多信息）。

### 为什么必须传 workspace？

多 Agent 协作时，每个 Agent 有自己的 workspace，但可能共享同一个 worktree：

```
worktree: E:\work\apps\eas\easbot
├── packages/
│   ├── agent1/                    # Agent 1 的 workspace
│   │   └── .easbot/             # ✅ 正确位置
│   ├── agent2/                    # Agent 2 的 workspace
│   │   └── .easbot/             # ✅ 正确位置
│   └── easbot/                    # easbot 源码（不是 workspace）
└── .easbot/                       # ❌ 错误位置（worktree 下）
```

### Agent 调用示例

**正确做法** ✅：
```bash
npx tsx skills/buildin/eas-agent-evolution/scripts/init-agent.ts \
  --workspace E:\work\apps\eas\easbot\packages\agent \
  --output .easbot \
  --agent-name 小莫 \
  --user-name jallen \
  --mission 与jallen一起探索和成长 \
  --core-relationship 伙伴 \
  --core-values 真诚,透明,信任 \
  --behavior-style 专业且友好 \
  --decision-principles 效率,准确性,安全性
```

**错误示例** ❌：
```bash
# 没有传 --workspace，脚本会报错
npx tsx skills/buildin/eas-agent-evolution/scripts/init-agent.ts --output .easbot
# 结果：Error: workspace (Agent workspace 路径) 为必填参数

# 在 easbot 源码目录下运行（不使用 --workspace）
cd e:\work\apps\eas\easbot
npx tsx skills/buildin/eas-agent-evolution/scripts/init-agent.ts --output .easbot
# 结果：workspace 被设置为 easbot 源码目录，而不是 Agent 的 workspace
```

### 如何获取 workspace？

在 eas-agent-evolution 技能中，Agent 可以通过 `Instance.directory` 获取自己的 workspace 路径。

## 概述 (Overview)

eas-agent-evolution 是 EASBot 多Agent协作生态系统的核心技能，负责指导 Agent 进行自我初始化和持续进化。该技能通过动态生成 BOOT.md、引导式信息收集和自动化文件生成，实现 Agent 的身份认知建立、行为准则定义和持续自我完善。

## 何时使用 (When to Use)

该技能应在以下情况使用：

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

## 核心功能 (Core Functions)

### 1. Agent 初始化

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

### 2. 配置验证

使用 `validate-config.ts` 脚本验证配置：

```bash
npx tsx scripts/validate-config.ts --config-path .easbot
```

### 3. 配置更新

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

### 4. 配置备份

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

### 定时备份任务

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

- [优先级系统说明](references/priority-system.md)
- [文件结构说明](references/file-structure.md)
- [内容分类说明](references/content-classification.md)

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
- **eas-skill-using**: 本技能与 eas-skill-using 协同工作
- **eas-skill-find**: 本技能支持通过 eas-skill-find 被发现

## 常见错误 (Common Mistakes)

- **错误**: 在更新配置时违背 BOOT.md 中的第一性原则
- **解决方案**: update-agent.ts 会自动验证并拒绝违反核心原则的更新

- **错误**: 忘记在更新前创建备份
- **解决方案**: update-agent.ts 默认自动创建备份，无需手动操作

## 文件级修改规范 (File-Level Modification Rules)

本文档定义了 eas-agent-evolution 技能相关文件的修改规范。所有修改必须遵循以下规则，详细信息请参阅 [references/file-modification-rules.md](references/file-modification-rules.md)。

### 核心配置文件修改规则

| 触发场景 | 目标文件 | 修改字段 | 输出格式 | 参考模板 |
|----------|----------|----------|----------|----------|
| 新增核心属性 | `protocol.json` | `metadata.name`, `metadata.userName`, `metadata.mission` | JSON，4空格缩进，尾部空行 | `templates/user-template.md` |
| 版本号升级 | `protocol.json` | `version` | JSON，4空格缩进 | - |
| 身份认知深化 | `IDENTITY.md` | `{{name}}`, `{{coreRelationship}}`, `{{identityFeatures}}` | Markdown，YAML frontmatter | `templates/identity-template.md` |
| 价值观演化 | `SOUL.md` | `{{coreValues}}`, `{{behaviorStyle}}`, `{{decisionPrinciples}}` | Markdown，YAML frontmatter | `templates/soul-template.md` |
| 用户偏好更新 | `USER.md` | `{{userName}}`, `{{preferredName}}`, `{{communicationPreferences}}` | Markdown，YAML frontmatter | `templates/user-template.md` |
| 初始化完成 | `protocol.json` | `setupCompletedAt` | ISO 8601 时间格式 | - |
| 备份触发 | `.easbot/` 目录 | 所有核心文件复制到备份目录 | 按日期组织 | - |

### protocol.json 修改规范

#### 修改触发场景

1. **首次初始化**: Agent 首次运行，需要收集核心信息
2. **身份信息更新**: 用户或 Agent 请求更新身份信息
3. **用户偏好变更**: 用户主动提供新的偏好设置
4. **版本升级**: 协议 schema 发生变更

#### 目标文件路径

```
.easbot/protocol.json
```

#### 必须新增的字段

| 字段 | JSONPath | 类型 | 说明 | 必填 |
|------|----------|------|------|------|
| version | `$.version` | number | 协议版本，固定为 1 | ✅ |
| bootstrapSeededAt | `$.bootstrapSeededAt` | string | ISO 8601 时间戳 | ✅ |
| setupCompletedAt | `$.setupCompletedAt` | string | ISO 8601 时间戳 | ✅ |
| metadata | `$.metadata` | object | 核心元数据 | ✅ |
| metadata.agentId | `$.metadata.agentId` | string | Agent 唯一标识符（peer-uuid 格式） | ✅ |
| metadata.workspace | `$.metadata.workspace` | string | 绝对路径 | ✅ |
| metadata.name | `$.metadata.name` | string | Agent 身份名称 | ✅ |
| metadata.userName | `$.metadata.userName` | string | 用户姓名 | ✅ |
| metadata.mission | `$.metadata.mission` | string | 核心使命 | ✅ |
| metadata.coreRelationship | `$.metadata.coreRelationship` | string | 核心关系 | ❌ |
| metadata.coreValues | `$.metadata.coreValues` | string[] | 核心价值观 | ❌ |
| metadata.behaviorStyle | `$.metadata.behaviorStyle` | string | 行为风格 | ❌ |
| metadata.decisionPrinciples | `$.metadata.decisionPrinciples` | string[] | 决策原则 | ❌ |

#### 输出格式要求

- 文件后缀: `.json`
- 缩进: 4 个空格
- 字符编码: UTF-8
- 换行符: LF (Unix 风格)
- 尾部空行: 必须保留
- JSON 语法: 严格符合 JSON 规范

#### 正确示例

```json
{
    "version": 1,
    "bootstrapSeededAt": "2024-01-01T00:00:00.000Z",
    "setupCompletedAt": "2024-01-01T00:00:00.000Z",
    "metadata": {
        "agentId": "peer-550e8400-e29b-41d4-a716-446655440000",
        "workspace": "e:\\work\\apps\\eas\\easbot",
        "name": "小莫",
        "userName": "jallen",
        "mission": "与jallen一起探索和成长"
    }
}
```

#### 错误示例

```json
// 错误 1: 缺少必填字段
{
    "version": 1,
    "setupCompletedAt": "2024-01-01T00:00:00.000Z"
}

// 错误 2: 缩进不一致
{
  "version": 1,
    "setupCompletedAt": "2024-01-01T00:00:00.000Z"
}

// 错误 3: 尾部多余逗号
{
    "version": 1,
    "setupCompletedAt": "2024-01-01T00:00:00.000Z",
}

// 错误 4: 非 ISO 8601 时间格式
{
    "version": 1,
    "bootstrapSeededAt": "2024/01/01 00:00:00",
    "setupCompletedAt": "2024/01/01 00:00:00"
}
```

### 模板文件修改规范

#### 判定标准分级

| 级别 | 含义 | Agent 行为 |
|------|------|-----------|
| **MUST** | 必须更新 | 触发时立即更新，不等待确认 |
| **SHOULD** | 推荐更新 | 建议更新，获得用户确认后执行 |
| **MAY** | 可选更新 | 由 Agent 自主判定是否需要更新 |
| **cleanup** | 清理规则 | 描述哪些内容应该被移除或归档 |

#### 模板列表

| 模板文件 | MUST 更新 | SHOULD 更新 | MAY 更新 | cleanup |
|----------|-----------|--------------|----------|-----------|
| `boot-template.md` | metadata 变更 | 第一性原则与行为偏差 | - | 移除临时内容 |
| `identity-template.md` | 名称/关系变更 | 认知深化/认知不一致 | 特征细化 | 废弃关系 |
| `soul-template.md` | 价值观/准则变更 | 重大事件反思/矛盾 | 风格微调/细化 | 过时边界/矛盾原则 |
| `user-template.md` | 姓名/称呼变更 | 互动后更新/风格变化 | 偏好细化/历史补充 | 过时关注点/归档历史 |
| `agents-template.md` | 目录结构变更/新增功能 | 安全规则/规则不符 | 组织细化/描述补充 | 废弃功能/过时路径 |

#### YAML Frontmatter 规范

每个模板文件必须包含以下 frontmatter 字段：

```yaml
---
name: [目标文件名，如 BOOT.md]
description: [简洁描述，≤80字符]
type: system
scope: all
priority: [优先级数字]
permission: [read|write]
---
```

**注意**: `update-conditions` 不再放在 frontmatter 中，而是放在模板内容的 `## 更新时机` 章节，Agent 读取模板时可以直接看到。

#### 描述字段编写规范

**长度限制**: ≤80 个字符

**内容要求**: 简洁描述文件定义的内容

**示例**:

- ✅ 正确: `定义第一性原则及优先级规则`
- ❌ 错误: `第一性原则文档` (过于简短，无信息量)
- ❌ 错误: `这是定义 Agent 第一性原则的模板文件...` (过长，超过 80 字符)

#### Markdown 内容规范

- 标题层级: 使用 `#` 一级标题开始
- 缩进: 2 个空格
- 换行符: LF (Unix 风格)
- 尾部空行: 文件末尾必须保留一个空行
- 代码块: 使用 ``` 标记，指定语言

### 引导脚本修改规范

#### init-agent.ts 修改规范

**修改触发场景**:
1. 新增必填字段
2. 修改问题收集流程
3. 调整文件生成顺序

**目标文件**: `scripts/init-agent.ts`

**输出格式**: TypeScript，ESM 模块语法，`.ts` 后缀

**代码规范**:
- 导入排序: 外部包 → 内部包 → 相对导入
- 类型定义: 使用 `interface` 定义数据结构
- 错误处理: 使用 `try/catch`，返回结构化错误信息
- 日志输出: 使用 `Log.create()` 模式

#### question 工具使用规范

**问题数量限制**: 每次最多 3 个问题

**问题类型设计**:

| 问题 | 类型 | 选项/自定义 | 核心确定 |
|------|------|------------|----------|
| `{{name}}` | 单选或填空 | 支持自定义 | ✅ 第一轮 |
| `{{userName}}` | 填空 | 仅支持自定义 | ✅ 第一轮 |
| `{{mission}}` | 填空 | 仅支持自定义 | ✅ 第一轮 |
| `{{coreRelationship}}` | 多选或填空 | 支持自定义 | ✅ 第二轮 |
| `{{coreValues}}` | 多选 | 不支持自定义 | ✅ 第二轮 |
| `{{behaviorStyle}}` | 单选 | 支持自定义 | ✅ 第二轮 |
| `{{decisionPrinciples}}` | 多选 | 不支持自定义 | ✅ 第二轮 |

**非核心字段** (后续按需更新):
- `{{preferredName}}`
- `{{communicationPreferences}}`
- `{{currentFocus}}`
- `{{interactionHistory}}`
- `{{personalPreferences}}`

### .meta 文件规范

每个模板文件需创建对应的 `.meta.md` 文件，记录版本信息：

```markdown
# [模板文件名] 元数据

## 版本信息

- **版本**: 1.0.0
- **作者**: eas-agent-evolution
- **创建时间**: 2024-01-01
- **最后修改时间**: 2024-01-01
- **最后修改理由**: [简要说明]

## 修改历史

| 版本 | 时间 | 修改理由 |
|------|------|----------|
| 1.0.0 | 2024-01-01 | 初始版本 |
```

### 动态渲染规范

#### 渲染时机

初始化阶段**不预渲染**、**不生成静态文件**。

模板变量在运行时从 `protocol.json.metadata` 节点实时读取：

- BOOT.md: `{{name}}`, `{{mission}}`
- IDENTITY.md: `{{name}}`,`{{userName}}`
- USER.md: `{{userName}}`

1. **初始化阶段**: 不预渲染、不生成静态 BOOT.md
2. **运行时**: 从 `protocol.json` 读取 `metadata` 节点
3. **变量更新**: 修改 `protocol.json` → 触发后台渲染

#### 渲染变量来源

| 变量 | 来源 | 更新方式 |
|------|------|----------|
| `{{name}}` | `protocol.json.metadata.name` | 更新协议 JSON |
| `{{mission}}` | `protocol.json.metadata.mission` | 更新协议 JSON |
| `{{userName}}` | `protocol.json.metadata.userName` | 更新协议 JSON |
| `{{coreValues}}` | `protocol.json.metadata.coreValues` | 更新协议 JSON |

#### 渲染原则

- **字符串替换**: 仅做变量替换，不增减空格或标点
- **原始文本保留**: 保持 "我是 {{name}}，我的核心使命是 {{mission}}。" 原样
- **实时一致**: 变量值始终与 `protocol.json` 同步
