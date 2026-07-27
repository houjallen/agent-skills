# 优先级系统说明 (Priority System)

## 概述

优先级系统是 EASBot 提示词加载机制的核心，决定了文档的加载顺序、覆盖规则和冲突处理策略。

## Priority 定义

Priority 是一个从 1 到 2000 的整数，数字越小表示优先级越高，越先被加载。

### Priority 决定的行为

1. **加载顺序**：高优先级文档先于低优先级文档加载
2. **覆盖规则**：后加载的文档可以覆盖先加载文档中的同名变量
3. **冲突处理**：通过优先级机制解决多文档间的配置冲突

## 优先级体系

### Priority 1-20：内核第一性原则（不可修改）

| Priority | 文件 | 说明 | 加载条件 | Agent可修改 |
|----------|------|------|----------|-------------|
| 1 | BOOT.md | 第一性原则/启动指令 | 始终加载 | ❌ |
| 10 | AGENTS.md | 系统入口/工作区导航 | 始终加载 | ✅ |
| 20 | BOOTSTRAP.md | 首次运行引导 | 仅首次运行时存在 | ❌ |

### Priority 20-40：身份核心定义

| Priority | 文件 | 说明 | 加载条件 | Agent可修改 |
|----------|------|------|----------|-------------|
| 30 | IDENTITY.md | 基础身份定义 | 始终加载 | ✅ |

### Priority 40-60：行为准则和用户关系

| Priority | 文件 | 说明 | 加载条件 | Agent可修改 |
|----------|------|------|----------|-------------|
| 40 | SOUL.md | 核心灵魂/行为准则 | 始终加载 | ✅ |
| 50 | USER.md | 用户信息/偏好 | 始终加载 | ✅ |

### Priority 60-80：工具和上下文

| Priority | 文件 | 说明 | 加载条件 | Agent可修改 |
|----------|------|------|----------|-------------|
| 60 | TOOLS.md | 工具说明/环境配置 | 始终加载 | ✅ |
| 70 | CONTEXT.md | 动态上下文信息 | 按需加载 | ✅ |

### Priority 80-100：模式特定文档

| Priority | 文件 | 说明 | 加载条件 | Agent可修改 |
|----------|------|------|----------|-------------|
| 80 | CODER.md | Coder 模式专用 | 仅 Coder 模式 | ✅ |
| 90 | HEARTBEAT.md | 心跳任务定义 | 始终加载 | ✅ |

### Priority 100-200：记忆系统

| Priority | 文件 | 说明 | 加载条件 | Agent可修改 |
|----------|------|------|----------|-------------|
| 100 | MEMORY.md | 长期记忆 | 按需加载 | ❌（用户侧） |

### Priority 2000+：扩展和规则

| Priority | 文件 | 说明 | 加载条件 | Agent可修改 |
|----------|------|------|----------|-------------|
| 2000+ | rules/*.md | 扩展规则 | 按需加载 | ✅ |

## 加载规则

### 1. 基本加载顺序

按 Priority 从小到大依次加载，同 Priority 按文件名排序。

### 2. 合并规则

- 后加载的文档内容追加到已有内容
- 同名变量后来者覆盖
- 特殊标记（如 `[writable]`）决定可修改性

### 3. 条件加载

- `scope: 'all'` - 所有模式加载
- `scope: 'general'` - 仅 General 模式加载
- `scope: 'coder'` - 仅 Coder 模式加载
- `dynamic: true` - 动态内容，可实时更新

### 4. 权限控制

- `permission: 'read'` - 只读
- `permission: 'write'` - 可写
- `owner` - 文件所属 Agent
- `share` - 临时共享给其他 Agent

## agentId 与优先级系统

### agentId 定义

`agentId` 是每个 Agent 的唯一标识符，格式为 `peer-{uuid}`，用于在多 Agent 协作环境中准确识别和路由消息。

### agentId 在 protocol.json 中的位置

agentId 存储在 `protocol.json.metadata.agentId` 字段：

```json
{
  "version": 1,
  "metadata": {
    "agentId": "peer-550e8400-e29b-41d4-a716-446655440000",
    "name": "小莫",
    "workspace": "e:\\work\\apps\\eas\\easbot"
  }
}
```

### agentId 的优先级特性

| 特性 | 说明 |
|------|------|
| **不可修改** | agentId 生成后不可更改，确保身份一致性 |
| **全局唯一** | 使用 UUID v4 格式，避免冲突 |
| **加载时机** | 在 BOOT.md 加载前必须就绪 |
| **作用域** | 影响所有优先级文档的身份识别 |

### agentId 与文件加载

在加载任何优先级文档之前，系统会通过 `protocol.json.metadata.agentId` 验证 Agent 身份：

1. **加载 BOOT.md 前**：验证 agentId 存在且格式正确
2. **加载 IDENTITY.md 时**：使用 agentId 作为身份标识的一部分
3. **多 Agent 切换时**：通过 agentId 快速切换上下文

## 冲突处理

### 优先级冲突

当多个文档定义冲突时：

1. 高优先级文档优先生效
2. 同优先级按加载顺序后者覆盖
3. 明确标记的不可覆盖项优先

### 语义冲突

当文档含义冲突时：

1. 第一性原则（BOOT.md）不可违背
2. 核心身份（IDENTITY.md, SOUL.md）次之
3. 具体规则可以覆盖通用规则

## 示例加载序列

### 首次运行

```
Priority 1:  BOOT.md          (第一性原则)
Priority 10: BOOTSTRAP.txt    (引导初始化)
Priority 20: IDENTITY.md      (创建中...)
Priority 30: AGENTS.md        (创建中...)
Priority 40: SOUL.md          (创建中...)
Priority 50: USER.md          (创建中...)
```

### 正常会话

```
Priority 1:  BOOT.md
Priority 20: IDENTITY.md
Priority 30: AGENTS.md
Priority 40: SOUL.md
Priority 50: USER.md
Priority 60: TOOLS.md
Priority 100: MEMORY.md
```

### Coder 模式

```
Priority 1:  BOOT.md
Priority 20: IDENTITY.md
Priority 30: AGENTS.md (包含项目描述)
Priority 40: SOUL.md
Priority 50: USER.md
Priority 60: TOOLS.md
Priority 80: CODER.md  (额外加载)
Priority 100: MEMORY.md
```
