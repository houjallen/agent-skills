# note CLI 使用手册 (note Command Reference)

> 本文档是 `easbot note *`（agent 主 CLI）和 `easbot-note *`（独立 CLI）命令的**使用手册**。
>
> **版本对齐**：见 [SKILL.md §版本对齐](../SKILL.md)（`@easbot/note` / `@easbot/codebase` / `@easbot/memory` / `easbot` 主包统一 v0.3.26；`node >=22.22.2`）。
>
> **真值源**：
>
> - agent CLI：`packages/agent/src/cli/commands/note.ts`（`registerNoteCommand`）
> - 独立 CLI：`packages/note/src/cli-handler.ts` + `packages/note/src/commands/*.ts`（`parseXxxOptions`）
> - 共用底层 handler：`handleNoteCli`（两者入口统一委派到此）
>
> **关键差异**：agent CLI 与独立 CLI 子命令**数量不同**（agent 11 vs 独立 12），但 **flags / positional 形态有差异**（agent CLI 用 commander space-form `[]`，独立 CLI 用 `=`-form；agent CLI `search` / `graph` / `sync` 等选项集与独立 CLI 不同）。
>
> 本文档与代码同步（`watch` 子命令已落地，仅独立 CLI）。

---

## 0. 独立 CLI 安装与调用（`easbot-note`）

> 安装命令、全局选项、入口矩阵见 [SKILL.md §双 CLI 入口与安装](../SKILL.md)。本节仅列 note 特有事项。

### 0.1 与 SKILL.md 安装节的差异

note 独立 CLI 的 `cli.ts` 有 `stripGlobalOptions()` 自动剥离 `--cwd` / `--config` / `--log-level` 等，避免子命令 parser 误把它们当 positional。其他知识库 CLI 无此 helper（行为不同点）。

### 0.2 MCP 工具（8 个）

`easbot-note mcp` 启动 stdio MCP server，暴露：

- `search` / `ingest` / `remove` / `sync`
- `graph_query` / `status` / `doctor` / `init`

---

## 1. 子命令清单：Agent CLI vs 独立 CLI

### 1.1 子命令对照（agent 11 vs 独立 12）

| 子命令    | Agent CLI (`easbot note *`)  | 独立 CLI (`easbot-note *`) | 子命令数量        |
| --------- | ---------------------------- | -------------------------- | ----------------- |
| `init`    | ✅                           | ✅                         | 双端              |
| `status`  | ✅                           | ✅                         | 双端              |
| `doctor`  | ✅                           | ✅                         | 双端              |
| `search`  | ✅                           | ✅                         | 双端              |
| `ingest`  | ✅                           | ✅                         | 双端              |
| `extract` | ✅                           | ✅                         | 双端              |
| `remove`  | ✅                           | ✅                         | 双端              |
| `sync`    | ✅                           | ✅                         | 双端              |
| `graph`   | ✅                           | ✅                         | 双端              |
| `config`  | ✅                           | ✅                         | 双端              |
| `mcp`     | ✅                           | ✅                         | 双端              |
| `watch`   | ❌（长驻进程不上 agent CLI） | ✅                         | **独立 cli only** |

**统计**：agent CLI **11 个**，独立 CLI **12 个**；`watch` 是唯一仅独立 CLI 暴露的命令（长驻进程 + 暂未桥接到 agent CLI）。其余 11 个子命令双端覆盖，但 flags / positional 形态不同。

### 1.2 flags 形态差异（note 特有）

note 独立 CLI **同时支持** `--flag <value>`（space-form）和 `--flag=<value>`（`=`-form）两种形式（codebase / memory 独立 CLI 只支持其一）。其他形态总览见 [SKILL.md §快速参考 §2](../SKILL.md)。

note 特有约束：

- **`--dir <path>` flag**：agent CLI 仅 `status` / `doctor` / `ingest` 三个子命令暴露（commander space-form）；独立 CLI **完全不接受** `--dir <path>` flag，workspaceDir 走 ctx / `--cwd` 全局选项 / positional `[dir]`
- **`--kind` / `--direction`**：agent CLI 报 unknown option；独立 CLI 静默忽略

---

## 2. 各命令详解（Agent CLI vs 独立 CLI flags 对照）

> 本节对 **12 个子命令**逐一对比两端 flags。**关键差异**在每节"flags"表的 "Agent CLI" / "独立 CLI" 列明确标注。

### 2.1 `init` — Bootstrap（一次性）

```bash
# Agent CLI
easbot note init [dir] [-f|--force] [--skip-auto-sync] [--json]

# 独立 CLI
easbot-note init [dir] [--force] [--skip-auto-sync] [--json]
```

**flags**：

| flag               | Agent CLI       | 独立 CLI             | 说明                           |
| ------------------ | --------------- | -------------------- | ------------------------------ |
| `[dir]`            | ✅ positional   | ✅ positional        | 工作区目录                     |
| `-f` / `--force`   | ✅（`-f` 简写） | ✅（只有 `--force`） | 强制覆盖已有 db                |
| `--skip-auto-sync` | ✅              | ✅                   | 跳过 init 之后的首次 auto-sync |
| `--json`           | ✅              | ✅                   | JSON 输出                      |

> ⚠️ `note init` 会下载 embedding 模型（首次可能耗时数分钟）。

**典型用法**：

```bash
# Agent CLI：默认 init
easbot note init

# Agent CLI：强制重建（-f 简写）
easbot note init -f

# 独立 CLI：跳过首次 sync
easbot-note init --skip-auto-sync
```

---

### 2.2 `status` — db / KG 快照

```bash
# Agent CLI
easbot note status [--dir <path>] [--json]

# 独立 CLI（注意：独立 CLI 无 --dir flag，dir 走 positional）
easbot-note status [--skip-embedding-probe] [--skip-llm] [--dir] [--json]
```

> 注：独立 CLI `parseStatusOptions` 接受 `--dir` 作为** positional**（`else if (!arg.startsWith('-')) opts.dir = arg`），不是 `--dir <path>` flag。Agent CLI 用 commander space-form `--dir <path>`。

**flags**：

| flag                     | Agent CLI                      | 独立 CLI                    | 说明                                    |
| ------------------------ | ------------------------------ | --------------------------- | --------------------------------------- |
| `--dir <path>` / `[dir]` | ✅ `--dir <path>`（commander） | ✅ positional（parse 函数） | 目标工作区                              |
| `--skip-embedding-probe` | ❌                             | ✅                          | 跳过 embedding probe（加速 / 离线场景） |
| `--skip-llm`             | ❌                             | ✅                          | 跳过 LLM 探测（独立 CLI only）          |
| `--json`                 | ✅                             | ✅                          | JSON 输出                               |

**输出字段**（人类可读模式）：

```
init note workspace
  packageName:  note
  rootDir:      /path/to/workspace
  configPath:   /path/to/workspace/.easbot/note.json
  dbPath:       /path/to/workspace/.easbot/db/note.db
  indexState:   ready | uninitialized | partial | failed
  schemaVersion: 5
  llm:          { initialized: true, capabilities: { embedding: true, graph: true, rerank: true } }
  DB stats:     { documents: 12, chunks: 87, nodes: 234, edges: 567, ... }
  extras:       { rerank_available: yes, fts_available: yes, meta/<key>: ... }
```

**典型用法**：

```bash
# 人类可读
easbot note status

# JSON 给脚本 / 监控
easbot note status --json | jq '.recommendation'
```

---

### 2.3 `doctor` — 完整性检查

```bash
# Agent CLI
easbot note doctor [--dir <path>] [--json]

# 独立 CLI（注意：独立 CLI 接受 `--dir` 作为 positional，且不暴露 `--dir <path>` flag）
easbot-note doctor [--skip-embedding-probe] [--skip-llm] [--dir] [--json]
```

> 注：独立 CLI `parseDoctorOptions` 在 L65 `else if (!arg.startsWith('-')) opts.dir = arg` 把 `--dir` 当 positional 接受（**不是** `--dir <path>` flag）。Agent CLI 用 commander space-form `--dir <path>`。

**flags**：

| flag                     | Agent CLI                      | 独立 CLI                        | 说明                                  |
| ------------------------ | ------------------------------ | ------------------------------- | ------------------------------------- |
| `--dir <path>` / `[dir]` | ✅ `--dir <path>`（commander） | ✅ positional（parse 函数 L65） | 目标工作区                            |
| `--skip-embedding-probe` | ❌                             | ✅                              | 跳过 embedding probe（独立 CLI only） |
| `--skip-llm`             | ❌                             | ✅                              | 跳过 LLM 探测（独立 CLI only）        |
| `--json`                 | ✅                             | ✅                              | JSON 输出                             |

**退出码**：`healthy=true` → 0；`healthy=false` → 1。

> 本命令**没有 `--repair`** —— 修复需通过 `init --force` 或手动删除 db 后重建。

---

### 2.4 `search` — 混合搜索（FTS + vector + rerank）

```bash
# Agent CLI（commander 简写 + 不含 --kind）
easbot note search <query>... [--mode <mode>] [--file <p>] [--max <n>] [--include-graph] [--rerank] [--min-score <n>] [--max-edges-per-node <n>] [--json]

# 独立 CLI（注意：独立 CLI 无 `--dir` flag）
easbot-note search <query>... [--mode <conservative|balanced|tokenmax>] [--max <n>] [--file <p>] [--include-graph] [--rerank] [--min-score <n>] [--max-edges-per-node <n>] [--cwd <dir>] [--json]
```

> ⚠️ **Agent CLI 与独立 CLI flags 主要差异**：
>
> - Agent CLI **不暴露** `--dir <path>`（workspaceDir 走 ctx）
> - Agent CLI **不暴露** `--kind`（commander 已移除；与 agent tool / MCP 对齐）
> - 独立 CLI **静默忽略** `--kind`（parse 时跳过；保留向后兼容）
> - **其余 flags 两端完全一致**：包括 `--rerank` / `--include-graph` / `--min-score` / `--max-edges-per-node`

**flags**：

| flag                   | Agent CLI              | 独立 CLI                                          | 说明                      |
| ---------------------- | ---------------------- | ------------------------------------------------- | ------------------------- |
| `<query>...`           | ✅                     | ✅                                                | 1 个或多个查询词          |
| `--mode`               | ✅ `<mode>`            | ✅ `<conservative\|balanced\|tokenmax>`           | 搜索模式                  |
| `--max`                | ✅ `<n>`               | ✅ `<n>`                                          | 最大返回数（默认 10）     |
| `--file`               | ✅ `<p>`               | ✅ `<p>`                                          | 按文件路径过滤            |
| `--include-graph`      | ✅                     | ✅                                                | 包含 KG 邻居              |
| `--rerank`             | ✅                     | ✅                                                | 启用 rerank               |
| `--min-score`          | ✅ `<n>`               | ✅ `<n>`（range [0, 1]）                          | 最低相关分数过滤          |
| `--max-edges-per-node` | ✅ `<n>`               | ✅ `<n>`（range [1, 100]）                        | 每节点最大边数            |
| `--dir` / `[dir]`      | ❌                     | ✅ positional（parse 函数 L141 静默忽略 `--cwd`） | 目标工作区                |
| `--kind`               | ❌（commander 已移除） | ✅ 但**静默忽略**                                 | 按 hit 来源过滤（已废弃） |

**典型用法**：

```bash
# Agent CLI：基本搜索
easbot note search "payment module"

# Agent CLI：扩域 + rerank
easbot note search "API design" --mode tokenmax --max 20 --rerank

# 独立 CLI：按文件过滤
easbot-note search "auth" --file "docs/*.md"

# 独立 CLI：包含 graph 邻居
easbot-note search "scheduler" --include-graph --max-edges-per-node 5
```

---

### 2.5 `ingest` — 摄入文档

```bash
# Agent CLI（用 --dir <path> 形式）
easbot note ingest <path>... [--dir <path>] [--no-embed] [--json]

# 独立 CLI（注意：独立 CLI 无 `--dir` flag；workspaceDir 走 ctx）
easbot-note ingest [<path>...] [--no-embed] [--path <p>] [--json]
```

> 注：独立 CLI `parseIngestOptions` 接受 `--path <value>` 或 `--path=<value>`（逗号分隔多路径）；workspaceDir 走 ctx。**没有 `--dir` flag 也没有 `--cwd` flag**（`parseSyncOptions` L83 注释也确认 `--dir` flag 已废弃）。

**flags**：

| flag           | Agent CLI     | 独立 CLI                  | 说明                   |
| -------------- | ------------- | ------------------------- | ---------------------- |
| `<path>...`    | ✅ positional | ✅ positional             | 1 个或多个路径         |
| `--path <p>`   | ❌            | ✅（parse 函数 L63 处理） | 路径（逗号分隔多路径） |
| `--dir <path>` | ✅            | ❌                        | 目标工作区             |
| `--no-embed`   | ✅            | ✅                        | 跳过 embedding 生成    |
| `--json`       | ✅            | ✅                        | JSON 输出              |

**典型用法**：

```bash
# Agent CLI：摄入单个文件
easbot note ingest docs/spec.md

# 独立 CLI：批量摄入 + no-embed
easbot-note ingest docs/ --no-embed
```

---

### 2.6 `extract` — 读取已 ingest 的 entity / chunk / document

```bash
# Agent CLI（不带 positional dir；<id|path> 必填）
easbot note extract [--chunk-id <id>] [--document-id <id>] [--path <p>] [--json]

# 独立 CLI（注意：独立 CLI 无 `--dir` flag）
easbot-note extract --chunk-id=<n> | --document-id=<n> | --path=<p> [--json]
```

> ⚠️ **必须传 `--chunk-id` / `--document-id` / `--path` 之一**；都不传 → CLI 直接报错退出。
> Agent CLI 用 `--chunk-id <id>` 空格；独立 CLI 用 `--chunk-id=<n>` 等号。

**flags**：

| flag            | Agent CLI | 独立 CLI                                | 说明               |
| --------------- | --------- | --------------------------------------- | ------------------ |
| `--chunk-id`    | ✅ `<id>` | ✅ `<n>`                                | 按 chunkId 查      |
| `--document-id` | ✅ `<id>` | ✅ `<n>`                                | 按 documentId 查   |
| `--path`        | ✅ `<p>`  | ✅ `<p>`                                | 按路径（子串匹配） |
| `--cwd <dir>`   | ❌        | ✅ 但**静默忽略**（parse 函数 L96-100） | 全局选项           |
| `--json`        | ✅        | ✅                                      | JSON 输出          |

**典型用法**：

```bash
# Agent CLI：按 documentId
easbot note extract --document-id 42

# 独立 CLI：按 documentId（等号形式）
easbot-note extract --document-id=42

# 独立 CLI：按路径
easbot-note extract --path=docs/spec.md
```

---

### 2.7 `remove` — 删除 note（destructive）

```bash
# Agent CLI（含 --force alias）
easbot note remove <id|path> [--confirm] [--force] [--json]

# 独立 CLI（注意：独立 CLI 无 `--dir` flag）
easbot-note remove <id|path> [--confirm|-y] [--json]
```

> ⚠️ Agent CLI **额外暴露** `--force` flag；独立 CLI **没有** `--force` flag。
> 默认是 dry-run；要真删必须 `--confirm` 或 `-y`。

**flags**：

| flag               | Agent CLI     | 独立 CLI      | 说明                                  |
| ------------------ | ------------- | ------------- | ------------------------------------- |
| `<id\|path>`       | ✅ positional | ✅ positional | documentId 或 workspace 相对路径      |
| `--confirm` / `-y` | ✅            | ✅            | 实际删除                              |
| `--force`          | ✅            | ❌            | agent CLI 别名（与 `--confirm` 等价） |
| `--json`           | ✅            | ✅            | JSON 输出                             |

**典型用法**：

```bash
# Agent CLI：实际删除（--confirm 或 --force）
easbot note remove docs/old.md --confirm
easbot note remove docs/old.md --force

# 独立 CLI：预览 + 实际删除
easbot-note remove docs/old.md                  # 预览
easbot-note remove docs/old.md --confirm        # 真删
easbot-note remove docs/old.md -y               # 真删（简写）
```

---

### 2.8 `sync` — 重扫 workspace

```bash
# Agent CLI（含 --repair / --repair-only）
easbot note sync [dir] [--async] [--quiet] [--repair] [--repair-only] [--json]

# 独立 CLI（注意：独立 CLI 无 `[dir]` / `--dir` flag；与代码 `parseSyncOptions` L83 注释一致：`--dir flag was removed - using --cwd instead`）
easbot-note sync [--async] [--quiet] [--repair] [--repair-only] [--json]
```

> ✅ **两端 flags 集一致**：包括 `--repair` / `--repair-only`。
> 唯一差异：Agent CLI 接受 positional `[dir]`，独立 CLI 走 `--dir <path>`。

**flags**：

| flag            | Agent CLI     | 独立 CLI | 说明                                                      |
| --------------- | ------------- | -------- | --------------------------------------------------------- |
| `[dir]`         | ✅ positional | ❌       | 目标工作区（独立 CLI 走 `--cwd` 全局选项）                |
| `--dir <path>`  | ❌            | ❌       | **两端都不暴露**；workspaceDir 走 ctx 或 `--cwd` 全局选项 |
| `--async`       | ✅            | ✅       | 后台 worker pool                                          |
| `--quiet`       | ✅            | ✅       | 静默                                                      |
| `--repair`      | ✅            | ✅       | 修复                                                      |
| `--repair-only` | ✅            | ✅       | 仅修复不重建                                              |
| `--json`        | ✅            | ✅       | JSON 输出                                                 |

**典型用法**：

```bash
# Agent CLI：后台异步 sync
easbot note sync --async

# Agent CLI：仅 repair
easbot note sync --repair-only

# 独立 CLI：前台 sync + 静默
easbot-note sync --quiet

# 独立 CLI：repair + 异步
easbot-note sync --repair --async
```

---

### 2.9 `graph` — KG 子图查询（ADR 0097 重构）

```bash
# Agent CLI（完整 graph_query schema：--mode / --chunk-id / --target-node-id / --max-depth / --relation-types / --max-edges-per-node）
easbot note graph <nodeId> [-m|--mode <mode>] [--chunk-id <id>] [--target-node-id <id>] [--max-depth <n>] [--relation-types <types>] [--max-edges-per-node <n>] [--json]

# 独立 CLI（注意：独立 CLI 无 `--dir` flag；只接受 `--depth` / `--json` + positional `<nodeId>`）
easbot-note graph <nodeId> [--depth <n>] [--json]
```

> ⚠️ **Agent CLI 与独立 CLI graph 命令显著不同**：
>
> - Agent CLI 对齐 `note.graph_query` service schema（ADR 0097）：`mode` / `chunk-id` / `target-node-id` / `max-depth` / `relation-types` / `max-edges-per-node`
> - 独立 CLI 是简化版（`--depth <n>` / `--dir` / `--json`；`--direction` 静默忽略 ADR 0096）
> - **graph schema 完全重构**，旧 `--kind` / `--direction` / `--scope` flag 全部移除

**flags**：

| flag               | Agent CLI     | 独立 CLI          | 说明                                             |
| ------------------ | ------------- | ----------------- | ------------------------------------------------ |
| `<nodeId>`         | ✅ positional | ✅ positional     | 节点 ID（必填）                                  |
| `-m` / `--mode`    | ✅ `<mode>`   | ❌                | mode（agent CLI only）                           |
| `--chunk-id`       | ✅ `<id>`     | ❌                | chunk id（agent CLI only）                       |
| `--target-node-id` | ✅ `<id>`     | ❌                | 目标 node id（agent CLI only）                   |
| `--max-depth`      | ✅ `<n>`      | ❌                | BFS 深度上限（agent CLI only；替代旧 `--depth`） |
| `--depth`          | ❌            | ✅ `<n>`          | BFS 深度（独立 CLI only）                        |
| `--relation-types` | ✅ `<types>`  | ❌                | 关系类型（agent CLI only；逗号分隔）             |
| `--direction`      | ❌（已移除）  | ❌ 但**静默忽略** | ADR 0096/0097 移除                               |

**典型用法**：

```bash
# Agent CLI：max-depth 形式（注意：不是 --depth）
easbot note graph 42 --max-depth 2

# Agent CLI：mode + relation-types
easbot note graph 42 --mode path --relation-types CALLS,IMPORTS

# 独立 CLI：--depth（注意：不是 --max-depth）
easbot-note graph 42 --depth 2
```

---

### 2.10 `config <get|set>` — 读 / 写配置

```bash
# Agent CLI
easbot note config <subcommand> [key] [value] [--json]

# 独立 CLI（注意：独立 CLI 无 `--dir` flag）
easbot-note config <get|set> [key] [value] [--json]
```

**子命令**：

| 子命令                     | 用途                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `config get [key]`         | 显示所有字段（或单个 key）                                                               |
| `config set <key> <value>` | 更新字段（**白名单**：embedding_model / graph_model / rerank_model / schema_version 等） |

**flags**：

| flag            | Agent CLI     | 独立 CLI      | 说明                       |
| --------------- | ------------- | ------------- | -------------------------- |
| `<subcommand>`  | ✅ positional | ✅ positional | `get` / `set`              |
| `[key] [value]` | ✅ positional | ✅ positional | `set` 子命令的 key + value |
| `--json`        | ✅            | ✅            | JSON 输出                  |

---

### 2.11 `mcp [dir]` — 启动 stdio MCP server

```bash
# Agent CLI（不接收 [dir]，统一走 ctx.worktree）
easbot note mcp

# 独立 CLI（接受 [dir]）
easbot-note mcp [dir]
```

**flags**：

| flag    | Agent CLI    | 独立 CLI      | 说明       |
| ------- | ------------ | ------------- | ---------- |
| `[dir]` | ❌（不接收） | ✅ positional | 目标工作区 |

**暴露的 MCP 工具（8 个）**：

- `search` / `ingest` / `remove` / `sync`
- `graph_query` / `status` / `doctor` / `init`

---

### 2.12 `watch` — 监听 note knowledge 目录 + 自动触发 sync（独立 CLI only）

```bash
# Agent CLI：不暴露
❌ easbot note watch                  # unknown command（agent CLI 不桥接）

# 独立 CLI
easbot-note watch [dir] [--debounce=N] [--interval=N] [--backend=<type>] [--ignore=<pattern>] [--on-load-failure=<throw|warn>] [--help|-h] [--json]
```

> ⚠️ **仅独立 CLI**（agent CLI 不暴露 watch —— 长驻进程 + 暂未桥接）。

**监听范围**（与 `note sync` 实际扫描的目录严格对齐 —— 不监听整个工作区）：

1. `note.json` 的 `sources`（默认 `['docs']`），每个元素 join workspaceDir
2. `note.json` 的 `extraPaths`（绝对路径直接用；相对路径 join workspaceDir）
3. dotdir `<workspaceDir>/.easbot/knowledge`（sync 末尾兜底扫描路径）

每个变化的文件触发一次 debounced `note sync --async`（fire-and-forget），**不在终端执行 sync 的输出**（避免长驻进程被 sync 输出污染）。

**flags**：

| flag                              | Agent CLI | 独立 CLI      | 说明                                                                      |
| --------------------------------- | --------- | ------------- | ------------------------------------------------------------------------- |
| `[dir]`                           | ❌        | ✅ positional | 目标工作区（独立 CLI only）                                               |
| `--debounce=N`                    | ❌        | ✅            | per-path debounce 间隔 ms（默认 200）                                     |
| `--interval=N`                    | ❌        | ✅            | 保留给 polling 兜底（默认 500）                                           |
| `--backend=<type>`                | ❌        | ✅            | `fs-events` / `inotify` / `windows` / `brute-force` / `watchman` / `auto` |
| `--ignore=<pattern>`              | ❌        | ✅（可重复）  | gitignore-style 追加 ignore                                               |
| `--on-load-failure=<throw\|warn>` | ❌        | ✅            | binding 缺失行为（默认 `warn`）                                           |
| `--json`                          | ❌        | ✅            | JSON 输出（保留位，未来可能扩展）                                         |
| `--help` / `-h`                   | ❌        | ✅            | 帮助                                                                      |

**终端实时输出**（阻塞命令，监听期间持续打印）：

```
[YYYY-MM-DDTHH:MM:SS.sssZ] + ADD    docs/spec.md
[YYYY-MM-DDTHH:MM:SS.sssZ] ~ CHANGE docs/old.md
[YYYY-MM-DDTHH:MM:SS.sssZ] → SYNC (debounced by docs/spec.md)
[YYYY-MM-DDTHH:MM:SS.sssZ] ✓ SYNC done (1889ms)
[YYYY-MM-DDTHH:MM:SS.sssZ] - UNLINK docs/deleted.md
```

- `+ ADD` / `~ CHANGE` / `- UNLINK` 着色（绿/黄/红）+ ISO 时间戳
- `→ SYNC (debounced by <path>)` —— debounce 窗口结束，触发 async sync
- `✓ SYNC done (<N>ms)` / `✗ SYNC failed: <reason>` —— sync 完成 / 失败

**停止方式**：`Ctrl+C`（SIGINT）或 `kill <pid>`（pid 在 `.easbot/.watcher.pid`）；note 当前**没有** `note stop` 子命令（codebase 有 `codebase stop`），停服需手动读 pid。

**预置条件**：

- 必须先跑 `easbot-note init`（watch **不自动 init**；首次启动若 note.json 缺失 → 友好报错并退出码 1）
- 至少存在一个 knowledge 目录（默认 `<workspaceDir>/docs` 或 `<workspaceDir>/.easbot/knowledge`）—— 否则抛 `no note knowledge directory found under <rootDir>` 错

**典型用法**：

```bash
# 基本：默认监听 <cwd>/docs + <cwd>/.easbot/knowledge
easbot-note watch

# 自定义 debounce（IDE 大文件保存抖动场景推荐 500ms）
easbot-note watch --debounce=500

# 监听其它 workspace
easbot-note watch /path/to/workspace

# 显式平台 backend（默认 auto）
easbot-note watch --backend=inotify

# 追加 ignore（与 codebase watch 同款 gitignore-style）
easbot-note watch --ignore='*.swp' --ignore='temp/**'
```

**典型排障**：

| 现象                            | 原因与解决                                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `⚠️ No watcher is running ...`  | `@parcel/watcher` binding 缺失且 auto-install 失败；手动 `pnpm install @parcel/watcher-<plat>-<arch>` |
| `Only N/M watchers started ...` | 部分目录 binding 安装失败；日志查具体哪个；降级后该目录变更不触发 sync                                |
| 启动后没有任何事件              | 监听目录无文件变化 / ignore 列表过宽 / 配置 sources/extraPaths 与实际目录不一致                       |
| sync 一直不打印 `✓ SYNC done`   | service layer `note.sync` 抛错（async fire-and-forget）—— 看 `✗ SYNC failed: <reason>` 行             |

---

> 这些是 CLI parser **实际会忽略或报错**的写法，Agent 必须避免。

| 命令写法                                                   | 错误类型                                                      | 替代写法                                                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| ❌ `easbot note doctor --repair`                           | agent CLI 报 unknown；独立 CLI 无 `--repair`                  | `easbot-note init --force` 重建                                                                |
| ❌ `easbot note remove <id>`（无 `--confirm` / `--force`） | 默认 dry-run，不真删                                          | agent CLI 加 `--confirm` / `--force`；独立 CLI 加 `--confirm` / `-y`                           |
| ❌ `easbot note init` 后不警告 embedding 下载              | embedding 模型首次下载耗时数分钟                              | init 前明确告知用户耗时 + 需授权                                                               |
| ❌ Agent 自行执行 `init`                                   | 涉及 embedding 下载 + workspace 写盘                          | 必须用户授权后手动跑                                                                           |
| ❌ `easbot note search --kind=document`                    | agent CLI 报 unknown option；独立 CLI 静默忽略                | 移除 `--kind` flag（已废弃）                                                                   |
| ❌ `easbot note graph --direction=outgoing`                | 两端都已移除（ADR 0096/0097）                                 | 移除 `--direction` flag                                                                        |
| ❌ `easbot note graph --depth 2`（agent CLI）              | agent CLI 不接受 `--depth`                                    | 改用 `--max-depth <n>`                                                                         |
| ❌ `easbot-note graph --max-depth 2`（独立 CLI）           | 独立 CLI 不接受 `--max-depth`                                 | 改用 `--depth <n>`                                                                             |
| ❌ `easbot note reset`                                     | 不存在；note 无 reset                                         | `easbot-note init --force` 重建                                                                |
| ❌ `easbot note format-text`                               | 不存在；`format-text` 是包内 helper                           | 不调用（无对应 CLI）                                                                           |
| ❌ Agent 自己跑 `remove <path> --confirm`                  | destructive                                                   | 必须显式用户授权                                                                               |
| ❌ `easbot-note remove --force`                            | 独立 CLI 不暴露 `--force`                                     | 改用 `--confirm` / `-y`                                                                        |
| ❌ `easbot note watch`                                     | agent CLI 不暴露（长驻进程 + 暂未桥接）                       | `easbot-note watch`（独立 CLI）                                                                |
| ❌ `easbot-note watch` 后未先 `easbot-note init`           | watch 不自动 init；首次启动若找不到 knowledge 目录 → 退出码 1 | 先跑 `easbot-note init`，确保 `<workspaceDir>/docs` 或 `<workspaceDir>/.easbot/knowledge` 存在 |
| ❌ 期望 watch 跑 sync 时打印详细结果                       | watch 是 fire-and-forget async sync；结果在 service log       | 看 `✗ SYNC failed: <reason>` 行而非终端                                                        |

---

## 4. 通用调用模式 (General Invocation Patterns)

note CLI 支持 4 种典型调用场景：

| 场景                       | 命令                                    | 适用                                                                                 |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| **Agent 主 CLI（LLM）**    | `easbot note <op>`                      | LLM 编程场景；commander space-form flags（`--flag <value>`）；**不含 `watch`**       |
| **独立 CLI（standalone）** | `easbot-note <op>`                      | 调试 / 一次性操作 / 长驻进程（`watch`）；独立 CLI 接受 `=`-form / positional `[dir]` |
| **MCP 客户端**             | 通过 `easbot note mcp` 暴露的 8 个 tool | 其他 AI Agent 通过 MCP 协议消费                                                      |
| **脚本 / CI**              | 直接调用任一 CLI                        | 定时任务 / 自动化流水线                                                              |

**核心约束**：

- **note CLI 命令空间独立**：只支持 `easbot note *` / `easbot-note *` 子命令集，不要混用其他命令
- `init` 涉及 embedding 模型下载，可能耗时数分钟 —— 非必要不要重复跑
- workspaceDir 等上下文参数**走 agent ctx 注入**，CLI 端一般不需要手动指定
- **`--dir <path>` agent CLI only**：仅 `status` / `doctor` / `ingest` 三个子命令暴露（commander space-form）；独立 CLI **完全不接受** `--dir <path>` flag，workspaceDir 走 ctx / `--cwd` 全局选项 / positional `[dir]`
- **`--kind` / `--direction` 已废弃**：agent CLI 报 unknown option；独立 CLI 静默忽略（保持向后兼容旧脚本）
- **`graph` 命令 schema 完全重构**（ADR 0097）：agent CLI 是新版（`--max-depth` / `--mode` / `--relation-types`）；独立 CLI 是简化版（`--depth`）
- **`watch` 仅独立 CLI**：长驻进程 + 暂未桥接到 agent CLI；阻塞命令，实时打印文件变化事件 + sync 触发/完成链路
