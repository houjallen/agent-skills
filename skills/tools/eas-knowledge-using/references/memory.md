# memory CLI 使用手册 (memory Command Reference)

> 本文档是 `easbot memory *`（agent 主 CLI）和 `easbot-memory *`（独立 CLI）命令的**使用手册**。
>
> **版本对齐**：见 [SKILL.md §版本对齐](../SKILL.md)（`@easbot/memory` / `@easbot/note` / `@easbot/codebase` / `easbot` 主包统一 v0.3.26；`node >=22.22.2`）。
>
> **重要**：memory 是 **per-agent 存储**（每个 Agent 一份独立 db），区别于 workspace 共享资源。`agentId` 通过 ctx 自动注入（agent CLI 走 bridge 从 `protocol.json` 注入；独立 CLI 读 `.easbot/protocol.json` → `metadata.agentId`）。
>
> **真值源**：
>
> - agent CLI：`packages/agent/src/cli/commands/memory.ts`（`registerMemoryCommand`）
> - 独立 CLI：`packages/memory/src/cli-handler.ts` + `packages/memory/src/commands/*.ts`（`parseXxxOptions`）
> - 共用底层 handler：`handleMemoryCli`（两者入口统一委派到此）
>
> **关键差异**：agent CLI 与独立 CLI 子命令**数量相同**（各 12 个），但 **flags 形态 / 是否暴露有差异**。`--agent` / `--workspace-dir` 在**两端都不暴露**（workspaceDir 走 ctx，agentId 走 ctx；CLI parse 函数无这两个 flag 解析）。
>
> 本文档与代码同步。

---

## 0. 独立 CLI 安装与调用（`easbot-memory`）

> 安装命令、全局选项、入口矩阵见 [SKILL.md §双 CLI 入口与安装](../SKILL.md)。本节仅列 memory 特有事项。

### 0.1 与 SKILL.md 安装节的差异

memory 是 **per-agent 存储**（每个 Agent 一份独立 db），区别于 workspace 共享资源。`agentId` 通过 ctx 自动注入（agent CLI 走 bridge 从 `protocol.json` 注入；独立 CLI 读 `.easbot/protocol.json` → `metadata.agentId`）。agent 通常**自动 init** per-agent 存储（无需手动触发），仅在 auto-init 失败时才需要手动跑 CLI。

### 0.2 agentId 解析（独立 CLI 特有）

memory 独立 CLI 跑时按以下优先级解析 `agentId`：

1. **`.easbot/protocol.json`** 的 `metadata.agentId`（推荐）
2. 环境变量 `EASBOT_AGENT_ID`
3. 回退到 `'default'`（仅对 `status` / `doctor` 等全局视图有意义）

**手动准备 `protocol.json`**：

```bash
# 在目标 workspace 根目录创建（或由 easbot agent 自动创建）
mkdir -p .easbot
cat > .easbot/protocol.json <<EOF
{
  "metadata": {
    "agentId": "my-custom-agent",
    "preferredName": "小莫"
  }
}
EOF

# 现在跑 easbot-memory 命令会用 my-custom-agent
easbot-memory recall --query "test"
```

### 0.3 MCP 工具（10 个）

`easbot-memory mcp` 启动 stdio MCP server，暴露：

- `recall` / `remember` / `forget` / `extract` / `consolidate`
- `graph_query` / `status` / `doctor` / `init` / `sync`

---

## 1. 子命令清单：Agent CLI vs 独立 CLI

### 1.1 子命令对照（12 vs 12，子命令集合相同）

| 子命令        | Agent CLI (`easbot memory *`) | 独立 CLI (`easbot-memory *`) | 子命令数量 |
| ------------- | ----------------------------- | ---------------------------- | ---------- |
| `init`        | ✅                            | ✅                           | 双端       |
| `recall`      | ✅                            | ✅                           | 双端       |
| `remember`    | ✅                            | ✅                           | 双端       |
| `forget`      | ✅                            | ✅                           | 双端       |
| `extract`     | ✅                            | ✅                           | 双端       |
| `consolidate` | ✅                            | ✅                           | 双端       |
| `sync`        | ✅                            | ✅                           | 双端       |
| `graph`       | ✅                            | ✅                           | 双端       |
| `status`      | ✅                            | ✅                           | 双端       |
| `doctor`      | ✅                            | ✅                           | 双端       |
| `config`      | ✅                            | ✅                           | 双端       |
| `mcp`         | ✅                            | ✅                           | 双端       |

**统计**：两端都是 **12 个子命令**，**完全覆盖**；但每个子命令的 flags 形态 / 暴露子集有差异。

### 1.2 flags 形态差异（memory 特有）

memory **两端都是 space-form**（独立 CLI 不像 codebase 那样强制 `=`-form；不像 note 那样同时支持两种）。其他形态总览见 [SKILL.md §快速参考 §2](../SKILL.md)。

memory 特有约束：

- **`--agent` / `--workspace-dir`**：**两端都不暴露**（agentId / workspaceDir 走 ctx 注入；parse 函数无这两个 flag 解析）
- **`status --agent` / `doctor --agent`**：两端都不支持（`status` / `doctor` 是全局诊断视图，v0.5.1 起）

---

## 2. 各命令详解（Agent CLI vs 独立 CLI flags 对照）

> 本节对 **12 个子命令**逐一对比两端 flags。**关键差异**在每节"flags"表的 "Agent CLI" / "独立 CLI" 列明确标注。

### 2.1 `init` — Bootstrap（per-agent）

```bash
# Agent CLI（commander 简写 + 无 --workspace-dir / --agent）
easbot memory init [dir] [-f|--force] [--json]

# 独立 CLI（positional dir + 无 --workspace-dir / --agent）
easbot-memory init [dir] [--force] [--json]
```

**flags**：

| flag              | Agent CLI                                     | 独立 CLI                               | 说明                                                                                            |
| ----------------- | --------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `[dir]`           | ✅ positional（commander 注入到 options.dir） | ✅ positional                          | 工作区目录（agent CLI 不传时走 `ctx.config.root \|\| ctx.config.directory \|\| process.cwd()`） |
| `-f` / `--force`  | ✅（`-f` 简写）                               | ✅（只有 `--force`）                   | 强制覆盖已有 db                                                                                 |
| `--workspace-dir` | ❌                                            | ❌                                     | **两端都不暴露**（workspaceDir 走 ctx，cli-handler 注入）                                       |
| `--agent`         | ❌                                            | ❌ 但 parse 函数**静默忽略**（L60-62） | agentId（走 ctx）                                                                               |
| `--json`          | ✅                                            | ✅                                     | JSON 输出                                                                                       |

**典型用法**：

```bash
# Agent CLI：默认 init
easbot memory init

# Agent CLI：强制重建（-f 简写）
easbot memory init -f

# 独立 CLI：指定 dir 重建
easbot-memory init /path/to/workspace --force
```

> 注：agent 通常**自动 init** per-agent 存储（无需手动触发），仅在 auto-init 失败时才需要手动跑 CLI。

---

### 2.2 `recall` — 混合搜索（FTS + vector + KG）

```bash
# Agent CLI（commander 简写 + KG 邻居相关 flags）
easbot memory recall [-q|--query <text>] [-l|--limit <n>] [-c|--category <cat>] [--min-importance <n>] [--min-score <n>] [--include-graph] [--max-depth <n>] [--max-edges-per-node <n>] [--include-shared] [--json]

# 独立 CLI（无简写；包含 --depth 别名 + 全部 KG flags）
easbot-memory recall --query <q> [--limit <n>] [--category <c>] [--min-importance <n>] [--min-score <n>] [--include-graph] [--depth|--max-depth <n>] [--max-edges-per-node <n>] [--include-shared] [--json]
```

> ⚠️ **`--query` 是必填**；CLI 不会自动从 agent ctx 注入 query（agent 暴露的 recall 接口会自动注入）。
> Agent CLI 提供 `-q` / `-l` / `-c` 简写；独立 CLI 不提供简写。
> Agent CLI `--depth` 不可用（commander 已移除），独立 CLI `--depth` 是 `--max-depth` 别名。

**flags**：

| flag                   | Agent CLI   | 独立 CLI                            | 说明                                            |
| ---------------------- | ----------- | ----------------------------------- | ----------------------------------------------- |
| `-q` / `--query`       | ✅ `<text>` | ✅ `<q>`（必填）                    | 查询文本                                        |
| `-l` / `--limit`       | ✅ `<n>`    | ✅ `<n>`                            | 最大返回数（默认 10）                           |
| `-c` / `--category`    | ✅ `<cat>`  | ✅ `<c>`                            | 按 category 过滤                                |
| `--min-importance`     | ✅ `<n>`    | ✅ `<n>`                            | 最低 importance 阈值                            |
| `--min-score`          | ✅ `<n>`    | ✅ `<n>`                            | 最低相关分数过滤（range [0, 1]；默认 0 不过滤） |
| `--include-graph`      | ✅          | ✅                                  | 包含 KG 邻居                                    |
| `--max-depth`          | ✅ `<n>`    | ✅ `<n>`（默认 2；range [1, 5]）    | KG BFS 深度                                     |
| `--depth`              | ❌          | ✅ `<n>`                            | `--max-depth` 别名（仅独立 CLI）                |
| `--max-edges-per-node` | ✅ `<n>`    | ✅ `<n>`（默认 10；range [1, 100]） | 每节点最大边数                                  |
| `--include-shared`     | ✅          | ✅                                  | 包含共享事实（默认否）                          |
| `--json`               | ✅          | ✅                                  | JSON 输出                                       |

**典型用法**：

```bash
# Agent CLI：基本 recall（-q 简写）
easbot memory recall -q "payment module"

# Agent CLI：高 importance + KG 邻居
easbot memory recall -q "scheduler" -c decision --min-importance 7 --include-graph --max-depth 2

# 独立 CLI：完整 --query 形式 + --depth 别名
easbot-memory recall --query "framework choice" --limit 30 --depth 2
```

---

### 2.3 `remember` — 持久化 fact

```bash
# Agent CLI（含 -c / -i 简写 + --tag 可重复）
easbot memory remember [--content <text>] [-c|--category <cat>] [-i|--importance <n>] [--tag <tag>] [--session <id>] [--json]

# 独立 CLI（无简写；--tag 单数）
easbot-memory remember --content <text> --category <c> --importance <1-10> [--tag <t>] [--session <s>] [--json]
```

> 注：CLI `remember` **没有 `--workspace-dir` / `--agent` flag**（两端都不暴露）。
> Agent CLI 的 `--tag` 用 commander accumulator，可重复传多次；独立 CLI 的 `--tag` 是单数。

**flags**：

| flag                  | Agent CLI                | 独立 CLI         | 是否必填 | 说明                       |
| --------------------- | ------------------------ | ---------------- | -------- | -------------------------- |
| `--content`           | ✅ `<text>`              | ✅ `<text>`      | **是**   | fact 内容                  |
| `-c` / `--category`   | ✅ `<cat>`               | ✅ `<c>`         | **是**   | fact 分类                  |
| `-i` / `--importance` | ✅ `<n>`                 | ✅ `<1-10>`      | **是**   | 重要性（1-10）             |
| `--tag`               | ✅ 可重复（accumulator） | ✅ `<t>`（单数） | 否       | tag                        |
| `--session`           | ✅ `<id>`                | ✅ `<s>`         | 否       | 关联 session id            |
| `--json`              | ✅                       | ✅               | 否       | JSON 输出                  |
| `--workspace-dir`     | ❌                       | ❌               | —        | **两端都不暴露**（走 ctx） |
| `--agent`             | ❌                       | ❌ 静默忽略      | —        | **两端都不写入**（走 ctx） |

**典型用法**：

```bash
# Agent CLI：记录 user preference（带 -c / -i 简写）
easbot memory remember --content "User prefers pnpm over npm" -c user_preference -i 8

# Agent CLI：多 tag
easbot memory remember --content "..." -c workflow -i 7 --tag monorepo --tag build

# 独立 CLI：完整 --category / --importance 形式
easbot-memory remember --content "Don't run npm install in monorepo root" --category error_pattern --importance 7
```

> ⚠️ 漏 `--content` / `--category` / `--importance` → CLI 直接报错退出。

---

### 2.4 `forget` — 按条件删除

```bash
# Agent CLI（含 -c 简写）
easbot memory forget [--fact-id <id>] [-c|--category <cat>] [--from <iso>] [--to <iso>] [--max-delete <n>] [--dry-run] [--json]

# 独立 CLI（无简写；flags 完全相同）
easbot-memory forget (--fact-id <id> | --category <c> | --from <ISO> --to <ISO>) [--max-delete <n>] [--dry-run] [--json]
```

> 注：`forget` 命令**至少要传一个过滤条件**（`--fact-id` / `--category` / `--from` / `--to`）；都不传 → CLI 报错。
> 不支持 `--query` 文本查询。

**flags**：

| flag                | Agent CLI  | 独立 CLI    | 说明                    |
| ------------------- | ---------- | ----------- | ----------------------- |
| `--fact-id`         | ✅ `<id>`  | ✅ `<id>`   | 按 factId 精确删除      |
| `-c` / `--category` | ✅ `<cat>` | ✅ `<c>`    | 按 category 过滤        |
| `--from`            | ✅ `<iso>` | ✅ `<ISO>`  | 时间窗口起点            |
| `--to`              | ✅ `<iso>` | ✅ `<ISO>`  | 时间窗口终点            |
| `--max-delete`      | ✅ `<n>`   | ✅ `<n>`    | 最大删除数（默认 1000） |
| `--dry-run`         | ✅         | ✅          | 仅预览（默认行为）      |
| `--json`            | ✅         | ✅          | JSON 输出               |
| `--workspace-dir`   | ❌         | ❌          | **两端都不暴露**        |
| `--agent`           | ❌         | ❌ 静默忽略 | **两端都不写入**        |

**典型用法**：

```bash
# Agent CLI：按 factId 精确删除
easbot memory forget --fact-id 42

# Agent CLI：预览按 category 删除（-c 简写）
easbot memory forget -c test

# 独立 CLI：实际删除 error_pattern 类（限 50 条）
easbot-memory forget --category error_pattern --max-delete 50

# 独立 CLI：按时间窗口删除
easbot-memory forget --from <YYYY-MM-DD> --to <YYYY-MM-DD> --max-delete 100
```

---

### 2.5 `extract` — 聚合当前 session

```bash
# Agent CLI（含 -s 简写）
easbot memory extract [-s|--session <id>] [--last-n <n>] [--from-msg <id>] [--json]

# 独立 CLI（无简写；--session 必填）
easbot-memory extract --session <sessionId> [--last-n <n>] [--from-msg <id>] [--json]
```

> 注：`--session` 是**必填**；CLI 不会自动从 agent ctx 注入 sessionId（agent 暴露的 extract 接口通常会自动注入）。
> 仅聚合当前 session 已捕获的 facts，**不**运行新抽取。

**flags**：

| flag               | Agent CLI | 独立 CLI         | 是否必填 | 说明                       |
| ------------------ | --------- | ---------------- | -------- | -------------------------- |
| `-s` / `--session` | ✅ `<id>` | ✅ `<sessionId>` | **是**   | session ID                 |
| `--last-n`         | ✅ `<n>`  | ✅ `<n>`         | 否       | 最近 N 条事实（默认 10）   |
| `--from-msg`       | ✅ `<id>` | ✅ `<id>`        | 否       | 从指定 message id 开始聚合 |
| `--json`           | ✅        | ✅               | 否       | JSON 输出                  |
| `--workspace-dir`  | ❌        | ❌               | —        | **两端都不暴露**           |
| `--agent`          | ❌        | ❌ 静默忽略      | —        | **两端都不写入**           |

**典型用法**：

```bash
# Agent CLI：聚合当前 session 最近 10 条（-s 简写）
easbot memory extract -s abc123

# 独立 CLI：聚合最近 50 条
easbot-memory extract --session abc123 --last-n 50
```

---

### 2.6 `consolidate` — 去重 + 归档

```bash
# Agent CLI
easbot memory consolidate [--window-days <n>] [--json]

# 独立 CLI（结构相同）
easbot-memory consolidate [--window-days <n>] [--json]
```

**flags**：

| flag              | Agent CLI | 独立 CLI            | 说明                            |
| ----------------- | --------- | ------------------- | ------------------------------- |
| `--window-days`   | ✅ `<n>`  | ✅ `<n>`（默认 30） | 时间窗口（仅整理 N 天内的事实） |
| `--json`          | ✅        | ✅                  | JSON 输出                       |
| `--workspace-dir` | ❌        | ❌                  | **两端都不暴露**                |
| `--agent`         | ❌        | ❌ 静默忽略         | **两端都不写入**                |

**典型用法**：

```bash
# 全量整理
easbot memory consolidate

# 仅整理最近 30 天
easbot memory consolidate --window-days 30
```

---

### 2.7 `sync` — db→.md 同步 + 过期归档

```bash
# Agent CLI
easbot memory sync [--window-days <n>] [--dry-run] [--json]

# 独立 CLI（结构相同；--agent 静默忽略）
easbot-memory sync [--window-days <n>] [--dry-run] [--json]
```

> 注：`--agent` flag 已废弃（agentId 走 ctx）；**两端都不暴露** `--agent`。

**flags**：

| flag              | Agent CLI                        | 独立 CLI                  | 说明                               |
| ----------------- | -------------------------------- | ------------------------- | ---------------------------------- |
| `--window-days`   | ✅ `<n>`（1-3650 整数；默认 30） | ✅ `<n>`（含范围校验）    | 归档阈值天数                       |
| `--dry-run`       | ✅                               | ✅                        | 仅打印计划（生成阶段仍写盘，幂等） |
| `--json`          | ✅                               | ✅                        | JSON 输出                          |
| `--agent`         | ❌（已移除）                     | ❌ parse 函数**静默忽略** | agentId（走 ctx）                  |
| `--workspace-dir` | ❌                               | ❌                        | **两端都不暴露**                   |

**两阶段流水线（ADR 0069）**：

1. **阶段 A**：db → `.md` 兜底生成（幂等：已存在的 file_path 自动跳过）
2. **阶段 B**：`active/` 下过期文件归档（`> window-days`），仅 `--dry-run=false` 时执行

**典型用法**：

```bash
# 标准 sync（默认 30 天归档阈值）
easbot memory sync

# 调整归档窗口为 60 天
easbot memory sync --window-days 60

# 预览模式（仅打印，不归档）
easbot memory sync --dry-run
```

---

### 2.8 `graph` — KG 子图查询（ADR 0097 重构）

```bash
# Agent CLI（无 --depth / --max-depth 别名；保留 --max-depth）
easbot memory graph [-q|--query <text>] [--node-id <id>] [--max-depth <n>] [--max-nodes <n>] [--max-edges-per-node <n>] [--json]

# 独立 CLI（支持 --depth 作为 --max-depth 别名）
easbot-memory graph [--query <q>] [--node-id <id>] [--max-depth <n>|--depth <n>] [--max-nodes <n>] [--max-edges-per-node <n>] [--json]
```

> ⚠️ **历史 flags 已删除**（参见 ADR 0096/0097）：
>
> - `--kind` / `--start-node` / `--scope` / `--type` / `--relation` 全部移除（ADR 0096/0097）
> - `--agent` flag 移除（agentId 走 ctx）
> - 传这些 flag 会被静默忽略

**flags**：

| flag                   | Agent CLI                           | 独立 CLI    | 说明                               |
| ---------------------- | ----------------------------------- | ----------- | ---------------------------------- |
| `-q` / `--query`       | ✅ `<text>`                         | ✅ `<q>`    | 节点 name 模糊匹配                 |
| `--node-id`            | ✅ `<id>`                           | ✅ `<id>`   | BFS 起点                           |
| `--max-depth`          | ✅ `<n>`（默认 2；range [1, 5]）    | ✅ `<n>`    | BFS 深度                           |
| `--depth`              | ❌                                  | ✅ `<n>`    | `--max-depth` 的别名（仅独立 CLI） |
| `--max-nodes`          | ✅ `<n>`（默认 100；最大 500）      | ✅ `<n>`    | 最大返回节点数                     |
| `--max-edges-per-node` | ✅ `<n>`（默认 10；range [1, 100]） | ✅ `<n>`    | 每节点最大边数                     |
| `--json`               | ✅                                  | ✅          | JSON 输出                          |
| `--workspace-dir`      | ❌                                  | ❌          | **两端都不暴露**                   |
| `--agent`              | ❌                                  | ❌ 静默忽略 | **两端都不写入**                   |

**典型用法**：

```bash
# Agent CLI：按 query 模糊匹配 + 2 层邻居
easbot memory graph -q "createHeartbeat" --max-depth 2

# Agent CLI：按 node-id 精确查
easbot memory graph --node-id 42 --max-depth 1

# 独立 CLI：用 --depth 别名（注意：不是 --max-depth）
easbot-memory graph --query "scheduler" --depth 2

# 独立 CLI：限制返回节点数 + 每节点边数
easbot-memory graph --query "scheduler" --max-nodes 20 --max-edges-per-node 3
```

---

### 2.9 `status` — db 状态快照

```bash
# Agent CLI（无 --agent）
easbot memory status [--json]

# 独立 CLI（结构相同；--agent 静默忽略）
easbot-memory status [--json]
```

> 注：`status` 是全局诊断视图（v0.5.1 起）；`--agent` 已从 agent CLI 移除；独立 CLI parse 函数**静默忽略** `--agent`（L48-50）。

**flags**：

| flag              | Agent CLI           | 独立 CLI                  | 说明                                    |
| ----------------- | ------------------- | ------------------------- | --------------------------------------- |
| `--json`          | ✅                  | ✅                        | JSON 输出                               |
| `--agent`         | ❌（v0.5.1 已移除） | ❌ parse 函数**静默忽略** | agentId 走 ctx（status 永远走全局统计） |
| `--workspace-dir` | ❌                  | ❌                        | **两端都不暴露**                        |

**输出字段**（人类可读模式）：

```
memory status
  packageName:  memory
  workspaceDir: /path/to/workspace
  agentId:      <ctx.agentId> | default
  configPath:   /path/to/workspace/.easbot/memory.json
  dbPath:       /path/to/workspace/.easbot/db/memory.db
  schemaVersion: 5
  llm:          { initialized: true, capabilities: { embedding: true, graph: true } }
  DB stats:     { memory_facts: 234, memory_vectors: 234, ... }
  extras:       { agent_id: ..., fts_available: yes, facts/<cat>: <n>, meta/<key>: ... }
```

**典型用法**：

```bash
# 人类可读
easbot memory status

# JSON 给脚本 / 监控
easbot memory status --json | jq '.dbStats'
```

---

### 2.10 `doctor` — 完整性检查

```bash
# Agent CLI
easbot memory doctor [--repair] [--json]

# 独立 CLI（结构相同；parse 函数无 --agent 处理）
easbot-memory doctor [--repair] [--json]
```

> 注：独立 CLI `doctor` 的 parse 函数**根本无** `--agent` 分支（L35-47），传 `--agent` 走 unknown-arg 路径。

**flags**：

| flag              | Agent CLI | 独立 CLI                  | 说明                                    |
| ----------------- | --------- | ------------------------- | --------------------------------------- |
| `--repair`        | ✅        | ✅                        | 修复（**destructive**，需用户授权）     |
| `--json`          | ✅        | ✅                        | JSON 输出                               |
| `--agent`         | ❌        | ❌ parse 函数**无此分支** | agentId 走 ctx（doctor 走全局健康检查） |
| `--workspace-dir` | ❌        | ❌                        | **两端都不暴露**                        |

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

### 2.11 `config` — 查看 / 修改 memory 配置

```bash
# Agent CLI（无 positional subcommand）
easbot memory config [--json]

# 独立 CLI（结构相同，只读视图）
easbot-memory config [--json]
```

**flags**：

| flag     | Agent CLI | 独立 CLI | 说明      |
| -------- | --------- | -------- | --------- |
| `--json` | ✅        | ✅       | JSON 输出 |

> 注：当前 memory `config` 是**只读视图**（不暴露 `get/set` 子命令）；如需修改走 `.easbot/memory.json` 直接编辑。

---

### 2.12 `mcp` — 启动 stdio MCP server

```bash
# Agent CLI（无 positional start）
easbot memory mcp

# 独立 CLI（接受 [dir]）
easbot-memory mcp [dir]
```

**flags**：

| flag     | Agent CLI    | 独立 CLI      | 说明                                        |
| -------- | ------------ | ------------- | ------------------------------------------- |
| `[dir]`  | ❌（不接收） | ✅ positional | 启动 MCP server（默认 start；保留向后兼容） |
| `--json` | ❌           | ✅            | JSON 输出（parse 函数 L39）                 |

**暴露的 MCP 工具（10 个）**：

- `recall` / `remember` / `forget` / `extract` / `consolidate`
- `graph_query` / `status` / `doctor` / `init` / `sync`

**典型用法**：

```bash
# 启动 MCP server（stdin/stdout JSON-RPC）
easbot memory mcp
```

---

## 3. Categories 分类全集

| Category              | 用途                                      |
| --------------------- | ----------------------------------------- |
| `user_preference`     | 编码风格 / 工具选择 / 沟通偏好            |
| `technical_fact`      | 项目特定技术知识 / 配置 / 架构            |
| `decision`            | 含 rationale 的决策（架构 / 设计 / 流程） |
| `workflow`            | 任务执行流程（部署 / 测试 / review）      |
| `error_pattern`       | 重复出现的错误 + 修复方案                 |
| `exploration_finding` | 探索代码 / 系统 / 领域 / 外部资源的发现   |
| `experience_summary`  | 任务完成后提炼的可复用经验                |
| `tool_usage`          | 使用工具 / API / CLI / 库的有效模式       |
| `skill_creation`      | 创建 / 改进技能的经验                     |
| `task_context`        | 持续 / 重复任务的上下文                   |
| `relationship`        | 团队结构 / ownership / 利益相关方         |
| `reminder`            | 时效性 / 待办事项                         |
| `test`                | 仅测试数据（生产避免）                    |
| `other`               | 不属于上述分类                            |

---

## 4. 反模式 (Anti-patterns)

> 这些是 CLI parser **实际会忽略或报错**的写法，Agent 必须避免。

- ❌ `easbot memory reset` —— **不存在**；memory 没有 reset 子命令。要清空走 `forget --category=test --max-delete=N`（dry-run 先预览）+ 谨慎操作，或在 agent tool 内调 `memory.reset()` service
- ❌ `easbot memory format-text` —— 不存在；`format-text` 是包内 helper
- ❌ `easbot memory recall --query`（漏 `--query`） —— **agent CLI**：不传 `--query` 时**不强制报错**，但 service 层会要求（agent 暴露的 recall 接口会自动注入）；用户主动跑会拿到空结果。**独立 CLI**：`--query` **强制必填**，不传直接报错退出
- ❌ `easbot memory remember`（漏 `--content` / `--category` / `--importance`） —— 两端 CLI 都报错
- ❌ `easbot memory extract`（漏 `--session`） —— CLI 报错
- ❌ `easbot memory forget`（没传 `--fact-id` / `--category` / `--from` / `--to` 任何一个） —— CLI 报错
- ❌ `easbot memory forget --query <text>` —— CLI `forget` **不支持 `--query` 文本查询**；只支持 `--fact-id` / `--category` / `--from` / `--to`
- ❌ `easbot memory sync --agent <id>` —— `--agent` 已废弃；agentId 走 ctx
- ❌ `easbot memory graph --kind <k>` / `--start-node` / `--scope` —— 历史 flag 全部移除（ADR 0096/0097）；传 `--query` / `--node-id` 替代
- ❌ `easbot memory graph --depth`（agent CLI） —— **agent CLI 不接受 `--depth`**，要用 `--max-depth`
- ❌ `easbot memory status --agent <id>` —— `status` 是全局诊断视图（v0.5.1 起不再支持 `--agent`）
- ❌ `easbot memory init --workspace-dir <dir>`（agent CLI） —— **两端都不暴露** `--workspace-dir`（workspaceDir 走 ctx；传 `[dir]` positional 即可）
- ❌ `easbot-memory init --workspace-dir <dir>` —— 独立 CLI 也**不暴露** `--workspace-dir`
- ❌ `easbot memory mcp start`（agent CLI） —— **agent CLI 不接受** `[start]` positional
- ❌ `easbot memory doctor --agent <id>` —— **两端都不支持** `--agent`（doctor 走全局健康检查）
- ❌ 让 Agent 自行执行 `forget --max-delete 1000` —— destructive，必须用户授权 + 建议先 `--dry-run` 预览
- ❌ 让 Agent 自行执行 `doctor --repair` —— destructive，必须用户授权
- ❌ `remember` 低 importance（1-4）大量事实 —— 会撑爆 KG；`importance < 5` 慎重 remember
- ❌ `remember` 后立刻 `recall` 验证 —— 已 persist，浪费 token；如确需验证，等几秒后查 index

---

## 5. 通用调用模式 (General Invocation Patterns)

memory CLI 支持 4 种典型调用场景：

| 场景                       | 命令                                       | 适用                                                                                                |
| -------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| **Agent 主 CLI（LLM）**    | `easbot memory <op>`                       | LLM 编程场景；commander space-form flags（`--flag <value>`）；`-q` / `-l` / `-c` / `-i` / `-s` 简写 |
| **独立 CLI（standalone）** | `easbot-memory <op>`                       | 调试 / 一次性操作；独立 CLI 也是 space-form flags；自动读 `.easbot/protocol.json` 解析 agentId      |
| **MCP 客户端**             | 通过 `easbot memory mcp` 暴露的 10 个 tool | 其他 AI Agent 通过 MCP 协议消费                                                                     |
| **脚本 / CI**              | 直接调用任一 CLI                           | 定时任务 / 自动化流水线                                                                             |

**核心约束**：

- **memory CLI 命令空间独立**：只支持 `easbot memory *` / `easbot-memory *` 子命令集，不要混用其他命令
- memory 是 **per-agent 存储**——agentId 通过 ctx 注入（独立 CLI 读 `protocol.json` → `metadata.agentId`），**两端都不接收 `--agent` flag**
- **`--workspace-dir` flag 两端都不暴露**：workspaceDir 由 cli-handler 注入（`opts.workspaceDir ?? process.cwd()` 兜底）
- `forget` / `doctor --repair` 是 **destructive** 操作
- **`--query` 文本查询仅 recall 支持**：`forget` 不支持（用 `--fact-id` / `--category` / `--from` / `--to`）
- **`--depth` 别名仅独立 CLI 支持**：agent CLI 必须用 `--max-depth`（ADR 0097 统一命名）
