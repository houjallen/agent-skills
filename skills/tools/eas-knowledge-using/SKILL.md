---
name: eas-knowledge-using
description: 该技能应在 Agent 需要执行或解释知识库 CLI 操作（init / doctor / status / sync / index / forget / reset / consolidate 等）时使用，覆盖 codebase / note / memory 三个共享知识库的命令空间。触发短语：跑 codebase status / 跑 note doctor / 跑 memory sync / 知识库健康诊断 / 重建索引 / 初始化知识库 / CLI 操作知识库 / knowledge base CLI / 知识库重建。不适用：agent 已有的内建检索 / 持久化接口（直接调用）/ 一次性脚本（用 bash）/ 单文件文档检索（按需选用知识库）。
license: MIT
mode: pipeline
composition: single
metadata:
  category: tools
  version: 0.2.0
  author: EASBot
  compatibility: easbot-agent-tools-v0.5
  tags: [easbot, knowledge-base, codebase, note, memory, cli, init, doctor, status, sync]
behavior:
  sequence:
    steps:
      - id: detect-signal
        kind: analyze
        purpose: 识别知识库类型（codebase / note / memory）与目标 CLI 操作
        entryConditions:
          - type: input-exists
          - type: permission-checked
        exit: 已确认 kb ∈ {codebase, note, memory} 且 op 与该 kb 支持的 op 集合对齐
        onFailure:
          action: abort
          maxRetries: 0
          rollback: false
      - id: get-permission
        kind: analyze
        purpose: 向用户索要授权（init / recreate / clear / reset 等 destructive op 必须确认）
        entryConditions:
          - type: dependency-met
          - type: permission-checked
        exit: 用户明确授权或拒绝
        onFailure:
          action: abort
          maxRetries: 0
          rollback: false
      - id: run-cli
        kind: generate
        purpose: 输出 LLM-friendly CLI 模板，由用户/Agent 在终端执行
        entryConditions:
          - type: dependency-met
          - type: input-exists
        exit: CLI 命令完整、kb + op 对齐、flags 正确
        onFailure:
          action: retry
          maxRetries: 1
          rollback: false
      - id: verify-retry
        kind: review
        purpose: 验证操作结果
        entryConditions:
          - type: dependency-met
          - type: output-generated
        exit: 用户确认成功 / 下次 tool 调用成功
        onFailure:
          action: skip
          maxRetries: 1
          rollback: false
  failure_strategy: 用户拒绝授权 → agent 上报错误回上层；CLI 执行失败 → agent 把 stderr 透传给用户
---

# eas-knowledge-using (知识库 CLI 引导)

## 概述 (Overview)

`eas-knowledge-using` 是 EASBot 三大知识库（`codebase` / `note` / `memory`）的 **CLI 操作引导层**。当 Agent 或用户需要执行知识库的 CLI-only 操作（init / doctor / status / sync / index / reset / consolidate 等）时，本技能负责：

- 识别 **知识库类型**（`codebase` / `note` / `memory`）与 **目标 CLI 操作**
- 输出 **对应 CLI 命令模板**（`easbot <kb> <op> [flags]`）
- 在 destructive 操作（`init` / `recreate` / `clear` / `reset`）前 **显式索要用户授权**

> **本技能仅做 CLI 命令输出**，不直接调用 CLI；不解释 agent 内建检索 / 持久化接口的内部行为。

## 何时使用 (When to Use)

### 触发场景 (Triggers)

- 用户说 "用 CLI 跑 {kb} {op}" / "帮我初始化 {kb}" / "跑下 {kb} doctor" / "重建 {kb} 索引"
- 用户说 "查下 {kb} 状态" / "{kb} db 健康吗" / "codebase 健康诊断"
- Agent 主动判断某个操作只能通过 CLI 完成（init / doctor / consolidate / reset / recreate 等常见 CLI-only 操作）

### 不适用场景 (Out of Scope)

- ❌ **Agent 已有的内建检索 / 持久化接口** → 直接调用 agent 的内置方法；本技能只处理 CLI 入口
- ❌ **临时一次性脚本** → 直接用 `bash` 工具
- ❌ **CLI 帮助以外的 side effect** → 本技能不直接调用 CLI

## 快速参考 (Quick Reference)

| 知识库 | 常用 op（**优先 Agent 内建接口**） | CLI-only op（**仅 CLI**） |
|---|---|---|
| **codebase** | `search` / `explore` / `callers` / `callees` / `impact` / `context` / `node` / `sync` | `index`（bootstrap）/ `init` / `status` / `doctor` / `recreate` / `clear` |
| **note** | `search` / `ingest` / `extract` / `remove` / `sync` / `graph_query` | `init` / `status` / `doctor` |
| **memory** | `recall` / `remember` / `forget` / `extract` / `graph_query` / `status` | `init`（auto-fallback）/ `doctor` / `consolidate` / `reset` |

> **每个 kb 的完整 CLI 命令手册**见各自 reference：
>
> - [codebase CLI 手册](references/codebase.md) — 19 个子命令（含 7 主命令 + 12 auxiliary）+ flags + 用法
> - [note CLI 手册](references/note.md) — 12 个子命令（含 10 主命令 + 2 auxiliary）+ flags + 用法
> - [memory CLI 手册](references/memory.md) — 13 个子命令（含 11 主命令 + 2 auxiliary）+ flags + 用法

> 上表快速参考仅列**主 CLI-only op**；每个 kb 的完整子命令清单（含 auxiliary 子命令如 query / path / mcp / explore 等）见 references。

**核心约束**：

- **优先走 Agent 内建接口**：每个 kb 的常用 op（search / explore / recall / remember 等）应走 agent 已有的内建方法，不走 CLI
- **CLI-only op**：`{kb} init` / `codebase index` / `{kb} status` / `{kb} doctor` / `memory consolidate` / `memory reset` / `codebase recreate` / `codebase clear` — 这些 op **必须 CLI**
- **三个知识库独立命令空间**：`easbot codebase *` / `easbot note *` / `easbot memory *`，互不混用
- **destructive op 必须显式授权**：`init` / `recreate` / `clear` / `reset` / `doctor --repair`

## 工作流 (Workflow)

### 阶段 1：detect-signal — 识别信号

**输入**：用户的自然语言请求。

**解析逻辑**：

1. **识别 kb 类型**：用户明确指定 "codebase" / "note" / "memory"
2. **识别 op 类型**：
   - 用户说 "init" / "初始化" → op = **init**
   - 用户说 "doctor" / "健康检查" / "诊断" → op = **doctor**
   - 用户说 "status" / "状态" → op = **status**
   - 用户说 "sync" / "重建索引" → op = **sync**（codebase / note 支持）
   - 用户说 "reset" / "清空记忆" → op = **reset**（仅 memory）
   - 用户说 "forget" / "删除记忆" → op = **forget**（memory 可走 agent 内建接口或 CLI）
   - 用户说 "index" → op = **index**（仅 codebase，等价 init 首次 sync）
   - 用户说 "consolidate" / "整理记忆" → op = **consolidate**（仅 memory）
   - 用户说 "recreate" / "clear" → op = **recreate** / **clear**（仅 codebase，destructive）

**退出条件**：已确认 `kb ∈ {codebase, note, memory}` 且 `op` 在该 kb 的 op 集合内。

### 阶段 2：get-permission — 用户授权

按 op 类型索要不同强度的授权：

| op | 授权提示 | 是否阻塞 |
|---|---|---|
| `init` / `index` | "Will create `<workspaceDir>/.easbot/{kb}.json` + db. Continue? (y/N)" | **阻塞**（创建 workspace 资源） |
| `doctor` | 只读检查，无确认 | **非阻塞** |
| `doctor --repair` | "Will modify db. Continue? (y/N)" | **阻塞**（destructive） |
| `codebase recreate` / `codebase clear` | "Will destroy db (irreversible). Continue? (y/N)" | **阻塞**（destructive） |
| `memory reset` | "Will clear all memory facts (irreversible). Continue? (y/N)" | **阻塞**（destructive） |
| `memory forget` | "Will delete matching facts. Continue? (y/N)" | **阻塞**（destructive） |
| `status` / `sync` | 只读 / 增量更新，可直接执行 | **非阻塞**（sync 高负载需提示但不阻塞） |

**退出条件**：destructive op 必须用户回复 `y` / `yes` / `确认`；只读 op 可直接进入下一阶段。

### 阶段 3：run-cli — 输出 CLI 命令模板

按目标 kb + op 生成对应命令：

**模板格式**：

```markdown
Run this command in the terminal:

  easbot {kb} {op} {flags}
```

> **命令细节见**：[references/codebase.md](references/codebase.md) / [references/note.md](references/note.md) / [references/memory.md](references/memory.md)。

**反模式**：

- ❌ 不要让 Agent 自己执行 CLI 命令（agent 不应直接调用 destructive CLI）
- ❌ 不要在 CLI 命令里加 `agentId` / `dir` 等参数（走 ctx 注入，CLI 端用默认即可）
- ❌ 不要跨 kb 编造 op（如 `easbot memory sync` 不存在，应明确告知 user）

### 阶段 4：verify-retry — 验证结果

CLI 执行后，Agent 不能自动获得成功反馈。应**主动告知**："CLI 执行后请告知结果"。用户回复 "成功" / "done" / "ok" → 视为操作完成。

## 与其他技能的协作 (Relationships with Other Skills)

- **本技能独立加载**：不依赖任何前置技能，可在隔离 context 下直接激活
- **匹配机制**：由 Agent 按本技能的 frontmatter `description` 自行匹配，无需索引注册

## 常见错误 (Common Mistakes)

- ❌ 让 Agent 自行执行 `easbot {kb} init` → ✅ 仅输出命令，让用户执行
- ❌ 跳过用户授权直接生成 init / recreate / clear / reset 命令 → ✅ destructive op 必须显式授权
- ❌ 跨 kb 错用命令（如 `easbot memory sync`）→ ✅ 先查 reference 确认 kb 的 op 集合
- ❌ 把常用 op（如 search / ingest / recall）也走 CLI → ✅ 那些 op 走 Agent 内建接口，本技能只处理 CLI-only op
- ❌ 用户拒绝 init 时仍继续引导 doctor → ✅ 拒绝后回退上报，由用户决定下一步

## 参考资料 (References)

- [codebase CLI 使用手册](references/codebase.md) — `easbot codebase *` 19 个子命令、flags、典型用法、反模式
- [note CLI 使用手册](references/note.md) — `easbot note *` 12 个子命令、flags、典型用法、反模式
- [memory CLI 使用手册](references/memory.md) — `easbot memory *` 13 个子命令、flags、典型用法、反模式
