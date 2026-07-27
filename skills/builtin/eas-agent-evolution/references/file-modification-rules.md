# 文件级修改规范 (File-Level Modification Rules)

本文档详细定义了 eas-agent-evolution 技能相关文件的修改规范。

## 概述

eas-agent-evolution 技能管理以下核心文件：

| 文件类型 | 文件路径 | 说明 |
|----------|----------|------|
| 协议文件 | `.easbot/protocol.json` | 存储初始化状态和元数据 |
| 模板文件 | `skills/buildin/eas-agent-evolution/references/templates/*.md` | 配置文档模板 |
| 生成文件 | `.easbot/*.md` | 运行时加载的配置文件 |

## 修改原则

### 核心原则

1. **必须使用技能**: 任何对 eas-agent-evolution 技能或模板的修改，必须调用 eas-agent-evolution 技能完成，禁止手动编辑
2. **协议驱动**: 核心变量存储在 `protocol.json` 中，更新协议 JSON 触发后台渲染
3. **动态渲染**: 初始化阶段不预渲染、不生成静态文件
4. **工具写入**: 禁止人工落盘，所有写入必须通过工具完成

### 修改权限

| 文件 | Agent 可修改 | 修改方式 |
|------|-------------|----------|
| `protocol.json` | ✅ | 通过工具写入 |
| `BOOT.md` | ❌ | 动态渲染，不可直接修改 |
| `IDENTITY.md` | ✅ | 通过 eas-agent-evolution 技能 |
| `SOUL.md` | ✅ | 通过 eas-agent-evolution 技能 |
| `USER.md` | ✅ | 通过 eas-agent-evolution 技能 |
| `AGENTS.md` | ✅ | 通过 eas-agent-evolution 技能 |
| 模板文件 | ❌ | 技能开发时修改 |

## protocol.json 修改规范

### 文件路径

```
.easbot/protocol.json
```

### Schema 定义

```typescript
interface ProtocolConfig {
  version: number;           // 协议版本，固定为 1
  bootstrapSeededAt: string; // ISO 8601 时间戳
  setupCompletedAt: string;  // ISO 8601 时间戳
  metadata: ProtocolMetadata;
}

interface ProtocolMetadata {
  agentId: string;                 // Agent 唯一标识符（peer-uuid 格式）
  workspace: string;              // 工作区绝对路径
  name: string;                    // Agent 身份名称
  userName: string;                // 用户姓名
  mission: string;                 // 核心使命
  coreRelationship?: string;      // 核心关系（可选）
  coreValues?: string[];          // 核心价值观（可选）
  behaviorStyle?: string;         // 行为风格（可选）
  decisionPrinciples?: string[];  // 决策原则（可选）
}
```

### 修改触发场景

| 场景 | 修改字段 | 说明 |
|------|----------|------|
| 首次初始化 | 所有必填字段 | Agent 首次运行 |
| agentId 生成 | `metadata.agentId` | 初始化时自动生成（不可修改） |
| 身份名称变更 | `metadata.name` | 用户或 Agent 请求修改 |
| 用户姓名变更 | `metadata.userName` | 用户主动提供 |
| 核心使命变更 | `metadata.mission` | 身份认知深化 |
| 初始化完成 | `setupCompletedAt` | 首次初始化完成 |
| 版本升级 | `version` | 协议 schema 变更 |

### 必填字段

| 字段 | JSONPath | 类型 | 说明 |
|------|----------|------|------|
| version | `$.version` | number | 固定为 1 |
| bootstrapSeededAt | `$.bootstrapSeededAt` | string | ISO 8601 格式 |
| setupCompletedAt | `$.setupCompletedAt` | string | ISO 8601 格式 |
| metadata | `$.metadata` | object | 非空对象 |
| metadata.agentId | `$.metadata.agentId` | string | Agent 唯一标识符（peer-uuid 格式） |
| metadata.workspace | `$.metadata.workspace` | string | 绝对路径 |
| metadata.name | `$.metadata.name` | string | 非空字符串 |
| metadata.userName | `$.metadata.userName` | string | 非空字符串 |
| metadata.mission | `$.metadata.mission` | string | 非空字符串 |

### 输出格式要求

- **文件后缀**: `.json`
- **缩进**: 4 个空格
- **字符编码**: UTF-8
- **换行符**: LF (Unix 风格)
- **尾部空行**: 必须保留
- **JSON 语法**: 严格符合 JSON 规范

### 正确示例

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

### 错误示例

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

## 模板文件修改规范

### 判定标准分级

每个模板文件使用 `update-conditions` 定义更新时机，采用 MUST/SHOULD/MAY 三级判定：

| 级别 | 含义 | Agent 行为 |
|------|------|-----------|
| **MUST** | 必须更新 | 触发时立即更新，不等待确认 |
| **SHOULD** | 推荐更新 | 建议更新，获得用户确认后执行 |
| **MAY** | 可选更新 | 由 Agent 自主判定是否需要更新 |
| **cleanup** | 清理规则 | 描述哪些内容应该被移除或归档 |

### 判定原则

参考 prompt-spec.md 和实际提示词规范：

1. **MUST 级**：用户明确要求、核心数据变更、存在明显矛盾
2. **SHOULD 级**：存在偏差但不紧急、重大事件后反思
3. **MAY 级**：细化、优化性质，由 Agent 根据上下文判定
4. **cleanup**：保持文档简洁，过时内容及时清理

### 模板列表

| 模板文件 | 生成目标文件 | MUST 更新 | SHOULD 更新 | MAY 更新 | cleanup |
|----------|--------------|-----------|--------------|----------|-----------|
| `boot-template.md` | `BOOT.md` | metadata 变更 | 第一性原则与行为偏差 | - | 移除临时内容 |
| `identity-template.md` | `IDENTITY.md` | 名称/关系变更 | 认知深化/认知不一致 | 特征细化 | 废弃关系 |
| `soul-template.md` | `SOUL.md` | 价值观/准则变更 | 重大事件反思/矛盾 | 风格微调/细化 | 过时边界/矛盾原则 |
| `user-template.md` | `USER.md` | 姓名/称呼变更 | 互动后更新/风格变化 | 偏好细化/历史补充 | 过时关注点/归档历史 |
| `agents-template.md` | `AGENTS.md` | 目录结构变更/新增功能 | 安全规则/规则不符 | 组织细化/描述补充 | 废弃功能/过时路径 |

### YAML Frontmatter 规范

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

**注意**: `update-conditions` 不放在 frontmatter 中，而是放在模板内容的 `## 更新时机` 章节。Agent 读取模板时可以直接看到更新时机，无需额外加载文档。

### Description 字段编写规范

**长度限制**: ≤80 个字符

**内容要求**: 包含三要素
1. **定义内容**: 该模板定义哪些内容
2. **占位符说明**: 包含哪些占位符
3. **更新条件**: 何时需要更新

**格式**: `定义[内容]；占位符[占位符列表]；需随[触发条件]而更新`

**示例**:

- ✅ 正确: `定义第一性原则、优先级规则及导航索引；占位符{{name}}{{mission}}{{files}}；需随身份核心变更而更新`
- ❌ 错误: `第一性原则文档` (过短，缺少占位符和更新条件)
- ❌ 错误: `这是定义 Agent 第一性原则的模板文件，包含核心使命、优先级规则和冲突处理等内容，需要在身份信息变更时更新` (过长，超过 80 字符)

### Markdown 内容规范

- **标题层级**: 使用 `#` 一级标题开始
- **缩进**: 2 个空格
- **换行符**: LF (Unix 风格)
- **尾部空行**: 文件末尾必须保留一个空行
- **代码块**: 使用 ``` 标记，指定语言

### 条件块使用规范

使用 Handlebars 条件块处理可选内容：

```handlebars
{{#if variableName}}
[当 variableName 存在时的内容]
{{/if}}
```

### 循环块使用规范

使用 Handlebars 循环块处理列表内容：

```handlebars
{{#each items}}
| {{name}} | {{priority}} | {{description}} | {{status}} |
{{/each}}
```

## 引导脚本修改规范

### init-agent.ts 修改规范

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

## question 工具使用规范

### 问题数量限制

**每次最多 3 个问题**

### 问题设计

| 问题 | 类型 | 选项/自定义 | 核心确定 |
|------|------|------------|----------|
| `{{name}}` | 单选或填空 | 支持自定义 | ✅ 第一轮 |
| `{{userName}}` | 填空 | 仅支持自定义 | ✅ 第一轮 |
| `{{mission}}` | 填空 | 仅支持自定义 | ✅ 第一轮 |
| `{{coreRelationship}}` | 多选或填空 | 支持自定义 | ✅ 第二轮 |
| `{{coreValues}}` | 多选 | 不支持自定义 | ✅ 第二轮 |
| `{{behaviorStyle}}` | 单选 | 支持自定义 | ✅ 第二轮 |
| `{{decisionPrinciples}}` | 多选 | 不支持自定义 | ✅ 第二轮 |

### 第一轮问题设计

**主题**: 核心确定（3 个问题）

```typescript
const round1Questions = [
  {
    question: "你希望被称为什么名字？",
    header: "身份名称",
    options: [
      { label: "小莫", description: "简洁优雅的名字" },
      { label: "小爱", description: "友好亲切的名字" },
      { label: "小明", description: "经典常见的名字" }
    ],
    multiple: false,
    custom: true
  },
  {
    question: "请问你的名字是什么？",
    header: "用户姓名",
    custom: true
  },
  {
    question: "你的核心使命是什么？你为什么而存在？",
    header: "核心使命",
    custom: true
  }
];
```

### 第二轮问题设计

**主题**: 行为准则（3 个问题）

```typescript
const round2Questions = [
  {
    question: "你最重要的关系是什么？",
    header: "核心关系",
    options: [
      { label: "合作伙伴", description: "共同协作完成目标" },
      { label: "朋友", description: "真诚友好的陪伴" },
      { label: "导师", description: "指导和学习的关系" },
      { label: "助手", description: "帮助完成任务" }
    ],
    multiple: false,
    custom: true
  },
  {
    question: "你信奉哪些核心价值观？（可多选）",
    header: "核心价值观",
    options: [
      { label: "真诚", description: "保持真实和诚实" },
      { label: "信任", description: "建立相互信任" },
      { label: "成长", description: "持续学习和进步" },
      { label: "专业", description: "追求专业能力" },
      { label: "创新", description: "鼓励创新思维" }
    ],
    multiple: true,
    custom: false
  },
  {
    question: "你倾向哪种行为风格？",
    header: "行为风格",
    options: [
      { label: "正式专业", description: "严谨专业的表达方式" },
      { label: "轻松友好", description: "轻松愉快的交流氛围" },
      { label: "简洁直接", description: "简洁明了的表达" },
      { label: "详细深入", description: "详细全面的解答" }
    ],
    multiple: false,
    custom: true
  }
];
```

### 非核心字段

以下字段由 Agent 后续按需更新，无需立即收集：

- `{{preferredName}}` - 用户称呼偏好
- `{{communicationPreferences}}` - 沟通偏好
- `{{currentFocus}}` - 当前关注点
- `{{interactionHistory}}` - 互动历史
- `{{personalPreferences}}` - 个人偏好

## .meta 文件规范

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

## 动态渲染规范

### 渲染时机

1. **初始化阶段**: 不预渲染、不生成静态 BOOT.md
2. **运行时**: 从 `protocol.json` 读取 `metadata` 节点
3. **变量更新**: 修改 `protocol.json` → 触发后台渲染

### 渲染变量来源

| 变量 | 来源 | 更新方式 |
|------|------|----------|
| `{{name}}` | `protocol.json.metadata.name` | 更新协议 JSON |
| `{{mission}}` | `protocol.json.metadata.mission` | 更新协议 JSON |
| `{{userName}}` | `protocol.json.metadata.userName` | 更新协议 JSON |
| `{{coreValues}}` | `protocol.json.metadata.coreValues` | 更新协议 JSON |

### 渲染原则

- **字符串替换**: 仅做变量替换，不增减空格或标点
- **原始文本保留**: 保持 "我是 {{name}}，我的核心使命是 {{mission}}。" 原样
- **实时一致**: 变量值始终与 `protocol.json` 同步

### 渲染示例

**输入 (boot-template.md)**:
```markdown
我是 {{name}}，我的核心使命是 {{mission}}。
```

**输入 (protocol.json.metadata)**:
```json
{
  "name": "小莫",
  "mission": "与jallen一起探索和成长"
}
```

**输出 (BOOT.md)**:
```markdown
我是 小莫，我的核心使命是 与jallen一起探索和成长。
```

## 备份规范

### 备份触发场景

1. 执行文件更新操作前
2. 定时任务触发（每日凌晨 2 点）
3. Agent 请求手动备份

### 备份目录结构

```
~/.local/share/easbot/backup/
└── 2026-04-17/
    ├── BOOT.md
    ├── IDENTITY.md
    ├── SOUL.md
    └── USER.md
```

### 备份内容

- `BOOT.md`
- `IDENTITY.md`
- `SOUL.md`
- `USER.md`
- `AGENTS.md`
- `protocol.json`
