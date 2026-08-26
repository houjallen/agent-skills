# memory CLI 使用手册 (memory Command Reference)

> 本文档是 `easbot memory *` 命令的**使用手册**，按子命令列出 flags、用法、输出示例、典型场景。
>
> **重要**：memory 是 **per-agent 存储**（每个 Agent 一份独立 db），区别于 codebase / note 的 workspace 共享资源。`agentId` 通过 ctx 自动注入。

---

## 1. 子命令清单 (Command Index)

| 子命令 | 用途 | 关键 flags |
|---|---|---|
| `init` | 创建 per-agent db（agent 通常自动 init，CLI 仅作 fallback） | `--workspace-dir` / `--agent` / `--force` / `--json` |
| `recall` | 混合搜索（FTS + vector） | `<query>` / `--limit` / `--category` / `--min-importance` |
| `remember` | 持久化新 fact（自动抽取 entity 入 KG） | `<content>` / `--category`（必填） / `--importance`（必填） / `--json` |
| `forget` | 按条件删除 facts | `--category` / `--max-delete` / `--dry-run` |
| `extract` | 聚合当前 session 的 facts + KG | `--session`（必填） / `--last-n` |
| `graph` | KG 子图查询 | `--agent` / `--kind` / `--start-node` / `--depth` / `--scope` / `--max-nodes` |
| `status` | db 状态快照（counts / fts / vector / schema） | `--json` |
| `doctor` | 完整性检查 | `--repair` / `--json` |
| `consolidate` | 去重 → 归档 | `--agent` / `--window-days` / `--json` |
| `reset` | 清空所有 facts（**不可逆**） | `--dry-run` |
| `mcp` | 启动 MCP stdio server | — |
| `config` | 查看 / 修改 memory 配置 | 子命令 |
| `format-text` | CLI 内部 helper | — |

---

## 2. 各命令详解 (Command Details)

### 2.1 `init` — Bootstrap（per-agent）

```bash
easbot memory init [--workspace-dir <dir>] [--agent <agentId>] [--force] [--json]
```

**flags**：

| flag | 说明 |
|---|---|
| `--workspace-dir <dir>` | 指定 workspace 路径（默认 ctx 注入） |
| `--agent <agentId>` | 指定 agent ID（默认 ctx 注入） |
| `--force` | 强制覆盖已有 db |
| `--json` | JSON 输出 |

**典型用法**：

```bash
# 默认 init（用 ctx 注入的 agentId + workspaceDir）
easbot memory init

# 手动指定 agent
easbot memory init --agent my-custom-agent

# 强制重建
easbot memory init --force
```

> 注：agent 通常**自动 init** per-agent 存储（无需手动触发），仅在 auto-init 失败时才需要手动跑 CLI。

---

### 2.2 `recall` — 混合搜索

```bash
easbot memory recall <query> [--limit=10] [--category <cat>] [--min-importance <1-10>]
```

**flags**：

| flag | 取值 | 说明 |
|---|---|---|
| `--limit` | 整数 | 最大返回数（默认 10） |
| `--category` | 见 §3 分类全集 | 按 category 过滤 |
| `--min-importance` | 1-10 | 最低 importance 阈值 |

**典型用法**：

```bash
# 基本 recall
easbot memory recall "payment module"

# 仅高 importance 的 decision 类
easbot memory recall "API design" --category decision --min-importance 7

# 大量搜索
easbot memory recall "framework choice" --limit 30
```

---

### 2.3 `remember` — 持久化 fact

```bash
easbot memory remember <content> --category <cat> --importance <1-10> [--json]
```

**flags**：

| flag | 取值 | 是否必填 | 说明 |
|---|---|---|---|
| `--category` | 见 §3 分类全集 | **是** | fact 分类 |
| `--importance` | 1-10 | **是** | 重要性（9-10 关键；7-8 高频；5-6 中等；1-4 低） |
| `--json` | — | 否 | JSON 输出 |

> 注：CLI `remember` **没有 `--tags` flag**（tags 由 agent 暴露的 remember 接口通过 `tags` 参数写入）。

**典型用法**：

```bash
# 记录 user preference（必填 category + importance）
easbot memory remember "User prefers pnpm over npm" --category user_preference --importance 8

# 记录错误模式
easbot memory remember "Don't run npm install in monorepo root — causes hoisting issues" --category error_pattern --importance 7
```

> ⚠️ 漏 `--category` 或 `--importance` → CLI 直接报错退出。

---

### 2.4 `forget` — 按条件删除

```bash
easbot memory forget [--category <cat>] [--max-delete <N>] [--dry-run]
```

**flags**：

| flag | 说明 |
|---|---|
| `--category` | 按 category 过滤 |
| `--max-delete` | 最大删除数，默认 1000；超过 abort |
| `--dry-run` | 仅预览（默认行为） |

**典型用法**：

```bash
# 预览（默认 dry-run）
easbot memory forget --category test

# 实际删除 error_pattern 类（限 50 条）
easbot memory forget --category error_pattern --max-delete 50

# 删除前必先 dry-run 预览
easbot memory forget --category workflow --max-delete 100
```

> 注：`forget` 命令**只支持按 category / max-delete 过滤**，**不支持 `--query` 文本查询**。如需文本匹配，请用 agent 暴露的 forget 接口（通常按 factId / category / time 过滤）。

---

### 2.5 `extract` — 聚合当前 session

```bash
easbot memory extract --session <sessionId> [--last-n <N>]
```

**flags**：

| flag | 是否必填 | 说明 |
|---|---|---|
| `--session` | **是** | session ID（不传则 CLI 报错退出） |
| `--last-n` | 否 | 最近 N 条事实（默认 10） |

> 注：`--session` 是**必填**；CLI 不会自动从 agent ctx 注入 sessionId（agent 暴露的 extract 接口通常会自动注入）。

**典型用法**：

```bash
# 聚合当前 session 最近 10 条
easbot memory extract --session abc123

# 聚合最近 50 条
easbot memory extract --session abc123 --last-n 50
```

> 仅聚合当前 session 已捕获的 facts，**不**运行新抽取。

---

### 2.6 `graph` — KG 子图查询

```bash
easbot memory graph [--agent <agentId>] [--kind <nodes|edges|neighbors>] [--start-node <id>] [--depth <1-3>] [--scope <self|agent|both>] [--max-nodes <N>]
```

**flags**：

| flag | 取值 | 说明 |
|---|---|---|
| `--agent` | agentId | 指定 agent（不传兜底 `default`） |
| `--kind` | `nodes` / `edges` / `neighbors` | 查询类型（默认 `nodes`） |
| `--start-node` | 正整数 | BFS 起点（`kind=neighbors` 时必填） |
| `--depth` | 1-3 | BFS 深度（默认 2） |
| `--scope` | `self` / `agent` / `both` | 作用域（`both` 需要 `isTrustedLocal: true`） |
| `--max-nodes` | 整数 | 最大返回节点数（默认 50） |

**典型用法**：

```bash
# 列所有 nodes
easbot memory graph

# 邻居查询
easbot memory graph --kind neighbors --start-node 42 --depth 2

# 指定 agent
easbot memory graph --agent my-agent --kind nodes
```

---

### 2.7 `status` — db 状态快照

```bash
easbot memory status [--json]
```

**flags**：

| flag | 说明 |
|---|---|
| `--json` | JSON 输出 |

返回 counts / fts / vector index / schema version 摘要。

---

### 2.8 `doctor` — 完整性检查

```bash
easbot memory doctor [--repair] [--json]
```

**flags**：

| flag | 说明 |
|---|---|
| `--repair` | 修复（**destructive**，需用户授权） |
| `--json` | JSON 输出 |

**典型用法**：

```bash
# 只读检查
easbot memory doctor

# JSON 给脚本
easbot memory doctor --json

# 修复（destructive）
easbot memory doctor --repair
```

---

### 2.9 `consolidate` — 去重 + 归档

```bash
easbot memory consolidate [--agent <agentId>] [--window-days <N>] [--json]
```

**flags**：

| flag | 说明 |
|---|---|
| `--agent` | 指定 agent（默认 ctx 注入） |
| `--window-days` | 时间窗口（默认所有） |
| `--json` | JSON 输出 |

**典型用法**：

```bash
# 全量整理
easbot memory consolidate

# 仅整理最近 30 天
easbot memory consolidate --window-days 30
```

---

### 2.10 `reset` — 清空所有 facts（**不可逆**）

```bash
easbot memory reset [--dry-run]
```

**flags**：

| flag | 说明 |
|---|---|
| `--dry-run` | 仅打印将删除的 fact 数（默认 `false`） |

**典型用法**：

```bash
# 预览
easbot memory reset --dry-run

# 实际清空（**不可逆**）
easbot memory reset
```

> ⚠️ `reset` 是不可逆操作：所有记忆将被永久删除。**不会**重置 codebase / note 知识库（kb 之间独立），**不会**影响 Agent 配置文件（`.easbot/BOOT.md` / `IDENTITY.md` 等）。

---

### 2.11 辅助子命令 (Auxiliary)

| 子命令 | 用途 |
|---|---|
| `mcp` | 启动 MCP stdio server |
| `config` | 查看 / 修改 memory 配置 |
| `format-text` | CLI 内部 helper |

---

## 3. Categories 分类全集

| Category | 用途 |
|---|---|
| `user_preference` | 编码风格 / 工具选择 / 沟通偏好 |
| `technical_fact` | 项目特定技术知识 / 配置 / 架构 |
| `decision` | 含 rationale 的决策（架构 / 设计 / 流程） |
| `workflow` | 任务执行流程（部署 / 测试 / review） |
| `error_pattern` | 重复出现的错误 + 修复方案 |
| `exploration_finding` | 探索代码 / 系统 / 领域 / 外部资源的发现 |
| `experience_summary` | 任务完成后提炼的可复用经验 |
| `tool_usage` | 使用工具 / API / CLI / 库的有效模式 |
| `skill_creation` | 创建 / 改进技能的经验 |
| `task_context` | 持续 / 重复任务的上下文 |
| `relationship` | 团队结构 / ownership / 利益相关方 |
| `reminder` | 时效性 / 待办事项 |
| `test` | 仅测试数据（生产避免） |
| `other` | 不属于上述分类 |

---

## 4. 反模式 (Anti-patterns)

- ❌ 给 `forget` 加 `--query` —— CLI `forget` **不支持文本查询**，只支持 `--category` / `--max-delete` / `--dry-run`
- ❌ `forget` 不指定 `--category` 或 `--max-delete` —— CLI 会报参数错误
- ❌ 让 Agent 自行执行 `reset` —— 不可逆，必须用户授权 + 建议先 `--dry-run` 预览
- ❌ 让 Agent 自行执行 `doctor --repair` —— destructive，必须用户授权
- ❌ 把 memory reset 当作 codebase/note reset —— 三个 kb 独立，reset 仅影响 memory
- ❌ 编造未列出的 op（如 `easbot memory sync` / `easbot memory search`） —— `sync` 不适用 memory（per-agent 自动）；memory 的查询走 `recall` 而不是 `search`
- ❌ `remember` 低 importance（1-4）大量事实 —— 会撑爆 KG；`importance < 5` 慎重 remember
- ❌ `remember` 后立刻 `recall` 验证 —— 已 persist，浪费 token；如确需验证，等几秒后查 index

---

## 5. 通用调用模式 (General Invocation Patterns)

memory CLI 支持 3 种典型调用场景：

| 场景 | 调用方式 | 适用 |
|---|---|---|
| **脚本 / CI** | 直接调用 `easbot memory <op>` | 定时任务 / 自动化流水线 |
| **Agent 通过内置接口** | `easbot memory <op>` 或 agent 暴露的对应 memory 接口（取决于 agent 框架） | AI agent 编程场景 |
| **人工排错** | 直接在终端跑 | 调试 / 一次性操作 |

**核心约束**：

- 三个知识库的 CLI 命令空间**完全独立**：不要跨 kb 拼接命令
- memory 是 **per-agent 存储**——CLI 端需显式 `--agent` / `--workspace-dir`，不像 codebase/note 自动用 ctx
- `reset` 是**不可逆**操作；其他 kb（codebase/note）的清空走 recreate/clear，互不影响