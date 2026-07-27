# workspace 与 agentId 说明 (Workspace and Agent ID Specification)

## 概述 (Overview)

本文档说明 `eas-agent-evolution` 技能中两个关键概念：`workspace` 与 `agentId`。这两者在初始化脚本中被强校验，Agent 调用前必须理解。

## CRITICAL：Agent 必须传入自己的 workspace 路径

Agent 运行时会在 `{{workspace}}/.easbot/` 目录下查找 `protocol.json` 配置文件。

## 关键概念 (Key Concepts)

| 概念 | 说明 | 示例 |
|------|------|------|
| **agentId** | Agent 唯一标识符（peer-uuid 格式） | `peer-550e8400-e29b-41d4-a716-446655440000` |
| **workspace** | Agent 的工作目录（`Instance.directory`） | `E:\work\apps\eas\easbot\packages\agent` |
| **worktree** | Git 工作区根目录（`Instance.worktree`） | `E:\work\apps\eas\easbot` |
| **.easbot 目录** | 必须在 workspace 下，不能在 worktree 下 | `{{workspace}}/.easbot` |

## agentId 说明 (Agent ID)

### 为什么需要 agentId？

由于一个 session 可以随时切换 Agent，每个 Agent 需要一个唯一标识符来：

- 在多 Agent 协作中准确识别和路由消息
- 支持 session 内的 Agent 切换
- 提供持久化的 Agent 身份标识

### agentId 格式：`peer-{uuid}`

- 使用 UUID v4 格式，确保全局唯一性
- 初始化时由 `init-agent.ts` 自动生成
- 生成后不可修改，存储在 `protocol.json.metadata.agentId`

### 初始化时机

agentId 在 Agent 首次初始化时自动生成，使用 Agent 的 name 作为基础标识（虽然存在局限性，但在初始化阶段无法获取更多信息）。

## 为什么必须传 workspace？(Why Workspace is Required)

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

## Agent 调用示例 (Invocation Examples)

> **作用域说明**：在技能内部调用脚本时，基于技能作用域使用**相对路径** `scripts/init-agent.ts`，绝对不能使用 `skills/builtin/eas-agent-evolution/scripts/init-agent.ts` 这种绝对路径。

### 正确做法 ✅

```bash
npx tsx scripts/init-agent.ts \
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

### 错误示例 ❌

```bash
# 没有传 --workspace，脚本会报错
npx tsx scripts/init-agent.ts --output .easbot
# 结果：Error: workspace (Agent workspace 路径) 为必填参数

# 在 easbot 源码目录下运行（不使用 --workspace）
cd e:\work\apps\eas\easbot
npx tsx scripts/init-agent.ts --output .easbot
# 结果：workspace 被设置为 easbot 源码目录，而不是 Agent 的 workspace

# 使用技能绝对路径调用是错误的（违反技能作用域）
npx tsx skills/builtin/eas-agent-evolution/scripts/init-agent.ts --output .easbot
# 结果：应基于技能作用域使用 scripts/init-agent.ts 相对路径
```

## 如何获取 workspace？(How to Resolve Workspace)

在 `eas-agent-evolution` 技能中，Agent 可以通过 `Instance.directory` 获取自己的 workspace 路径。