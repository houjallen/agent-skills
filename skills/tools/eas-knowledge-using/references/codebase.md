# codebase CLI 使用手册 (codebase Command Reference)

> 本文档是 `easbot codebase *`（agent 主 CLI）和 `easbot-codebase *`（独立 CLI）命令的**使用手册**。
>
> **版本对齐**（2026-09-25 同步）：
>
> - `@easbot/codebase`：**v0.3.24**（独立 npm 包；`package.json` 的 `version`）
> - `easbot`（主包）：**v0.3.24**（workspace 24 包统一版本）
> - `node` 要求：`>=22.22.2`（`@easbot/codebase` 的 `engines.node`）
>
> **真值源**：
>
> - agent CLI：`packages/agent/src/cli/commands/codebase.ts`（`registerCodebaseCommand`，决策 0089 子集过滤）
> - 独立 CLI：`packages/codebase/src/cli-handler.ts` + `packages/codebase/src/commands/*.ts`（`parseXxxOptions`）
> - 共用底层 handler：`handleCodebaseCli`（两者入口统一委派到此）
>
> **关键差异**：agent CLI **只暴露 13 个子命令**（运维逃生口 `index / recreate / clear / upgrade / embed-status / watch / stop / dead-code / circular / path` 不暴露给 LLM，避免误操作丢数据）。独立 CLI 暴露全部 **23 个**。
>
> 本文档与代码同步（2026-09-25）。

---

## 0. 独立 CLI 安装与调用（`easbot-codebase`）

> 安装命令、全局选项、入口矩阵见 [SKILL.md §双 CLI 入口与安装](../SKILL.md)。本节仅列 codebase 特有事项。

### 0.1 与 SKILL.md 安装节的差异

无独立 CLI 专属安装步骤；codebase 包结构（`bin.easbot-codebase` → `dist/cli.mjs`）与其他知识库一致。`@easbot/codebase` 是 `@easbot/agent` 内置依赖（pnpm workspace 自动绑定）。

### 0.2 子命令别名

- `embed` ⇔ `embed-status`（独立 CLI 接受两者，等价）

### 0.3 MCP 工具（9 个）

`easbot-codebase mcp` 启动 stdio MCP server，暴露：

- `query` / `node` / `context` / `impact`
- `callers` / `callees` / `explore`
- `status` / `doctor`

---

## 1. 子命令清单：Agent CLI vs 独立 CLI

### 1.1 双 CLI 子命令矩阵

| 子命令              | Agent CLI (`easbot codebase *`)                                                                               | 独立 CLI (`easbot-codebase *`)                                                             | 差异说明                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `init [dir]`        | ✅ `--force` / `--json`                                                                                       | ✅ `[dir]` / `--force` / `-f` / `--json` / `--skip-auto-sync`                              | agent CLI **不暴露 `--skip-auto-sync`**                                                 |
| `status [dir]`      | ✅ `--json`                                                                                                   | ✅ `[dir]` / `--json`                                                                      | 完全一致                                                                                |
| `doctor [dir]`      | ✅ `--json`                                                                                                   | ✅ `[dir]` / `--json`                                                                      | 完全一致                                                                                |
| `sync [dir]`        | ✅ `-q, --quiet` / `--json`                                                                                   | ✅ `[dir]` / `--embed` / `--no-embed` / `--quiet` / `-q` / `--json`                        | agent CLI **不暴露 `--embed` / `--no-embed`**（默认 FTS-only；agent 走 service 层）     |
| `config <get\|set>` | ✅ `--json`                                                                                                   | ✅ `--json` / `[dir]`                                                                      | agent CLI **不暴露 `[dir]` positional**                                                 |
| `mcp [dir]`         | ✅                                                                                                            | ✅ `[dir]`                                                                                 | agent CLI **不接收 `[dir]`**（统一走 ctx.worktree）                                     |
| `query <q...>`      | ✅ `--file` / `--kind` / `--max` / `--no-content` / `--intent` / `--json`                                     | ✅ + `--language=<lang>` / `--ast=<type>` / `--no-edges` / `--no-vector` / `--no-embed`    | agent CLI 是**精简子集**（高频 LLM 用法）                                               |
| `node <name\|id>`   | ✅ `--file` / `--no-content` / `--json`                                                                       | ✅ + `--kind` / `--edges` / `--max`                                                        | agent CLI **不暴露 `--kind` / `--edges` / `--max`**                                     |
| `context <id>`      | ✅ `--depth` / `--direction` / `--json`                                                                       | ✅ + `--max` / `--relation=<r1,r2,...>`                                                    | agent CLI **不暴露 `--max` / `--relation`**                                             |
| `impact <id>`       | ✅ `--depth` / `--max` / `--json`                                                                             | ✅ + `--relation=<r1,r2,...>`                                                              | agent CLI **不暴露 `--relation`**                                                       |
| `callers <symbol>`  | ✅ `--file` / `--kind` / `--max` / `--json`                                                                   | ✅ + `--dir=<dir>`                                                                         | agent CLI **不暴露 `--dir`**；独立 CLI **不暴露 `--node-id`**（CLI parse 函数无该分支） |
| `callees <symbol>`  | ✅ `--file` / `--kind` / `--max` / `--json`                                                                   | ✅ + `--dir=<dir>`                                                                         | agent CLI **不暴露 `--dir`**；独立 CLI **不暴露 `--node-id`**（CLI parse 函数无该分支） |
| `explore <query>`   | ✅ `--file` / `--kind` / `--max-files` / `--max-symbols` / `--depth` / `--no-content` / `--intent` / `--json` | ✅（同）                                                                                   | 完全一致                                                                                |
| `index [dir]`       | ❌ **不暴露**（决策 0089）                                                                                    | ✅ `[dir]` / `--embed` / `--no-embed` / `--batch=N` / `--json`                             | 运维逃生口，agent 走 sync 增量                                                          |
| `recreate`          | ❌ **不暴露**（决策 0089，destructive）                                                                       | ✅ `[dir]` / `--keep-config` / `--no-reindex` / `--no-embed` / `--force` / `-f` / `--json` | LLM 误操作丢数据风险                                                                    |
| `clear`             | ❌ **不暴露**（决策 0089，destructive）                                                                       | ✅ `[dir]` / `--keep-embeddings` / `--force` / `-f` / `--json`                             | 同上                                                                                    |
| `upgrade`           | ❌ **不暴露**                                                                                                 | ✅ `[dir]` / `--schema` / `--force` / `-f`                                                 | schema 升级由版本管理工具处理                                                           |
| `embed-status`      | ❌ **不暴露**                                                                                                 | ✅ `[dir]` / `--all` / `--dry-run` / `-n` / `--pending-list` / `-p` / `--json`             | 真生成 embedding 在 `easbot` REPL 内                                                    |
| `watch`             | ❌ **不暴露**                                                                                                 | ✅ `[dir]` / `--debounce=N` / `--interval=N`                                               | 长驻进程，agent CLI 不适合                                                              |
| `stop`              | ❌ **不暴露**                                                                                                 | ✅ `[dir]` / `--force` / `-f`                                                              | watch 配套                                                                              |
| `dead-code`         | ❌ **不暴露**                                                                                                 | ✅ `--type=` / `--no-exclude-entry` / `--limit=` / `--json`                                | 低频诊断                                                                                |
| `circular`          | ❌ **不暴露**                                                                                                 | ✅ `--relation=` / `--scope=<file\|module>` / `--json` / `--dir=`                          | 低频诊断                                                                                |
| `path`              | ❌ **不暴露**                                                                                                 | ✅ `--depth=` / `--relation=` / `--json` / `--dir=`                                        | 低频诊断                                                                                |

**统计**：agent CLI 暴露 **13 个**，独立 CLI 暴露 **23 个**，agent 缺失的 **10 个**子命令详见上方矩阵标注。

### 1.2 命名约定 (Conventions)

- **子命令别名**：`embed` ⇔ `embed-status`（独立 CLI 接受两者，等价）
- **参数约定**：graph-query 子命令同时接受 `--dir=<dir>` 和 positional `[dir]`（**仅独立 CLI**）；agent CLI 走 `options.dir` 注入

> **flags 形态总览**见 [SKILL.md §快速参考 §2](../SKILL.md)（三包通用对比）。

---

## 2. 共用子命令详解（agent CLI + 独立 CLI 都有）

> 本节覆盖 **13 个共用子命令**。两端的 flags 差异在每节"flags"表的"Agent CLI"列明确标注。

### 2.1 `init` — 创建 workspace 配置

```bash
# Agent CLI（不支持 --skip-auto-sync）
easbot codebase init [dir] [--force] [--json]

# 独立 CLI（完整 flags）
easbot-codebase init [dir] [--force] [--json] [--skip-auto-sync]
```

**flags**：

| flag               | Agent CLI     | 独立 CLI      | 说明                                               |
| ------------------ | ------------- | ------------- | -------------------------------------------------- |
| `[dir]`            | ✅ positional | ✅ positional | 工作区目录（agent CLI 不传时走 `ctx.config.root`） |
| `--force` / `-f`   | ✅            | ✅            | 强制覆盖已有 `.easbot/codebase.json` + db          |
| `--json`           | ✅            | ✅            | JSON 输出                                          |
| `--skip-auto-sync` | ❌            | ✅            | 跳过 init 之后的首次 auto-sync                     |

**典型用法**：

```bash
# Agent CLI：基本 init
easbot codebase init

# Agent CLI：强制重建
easbot codebase init --force

# 独立 CLI：只建 config 不跑首次 sync
easbot-codebase init --skip-auto-sync
```

---

### 2.2 `status` — 索引状态快照

```bash
easbot codebase status [--json] [dir]
# Agent CLI: easbot codebase status [--json]
# 独立 CLI: easbot-codebase status [--json] [dir]
```

**flags**：

| flag     | Agent CLI                 | 独立 CLI | 说明       |
| -------- | ------------------------- | -------- | ---------- |
| `[dir]`  | ❌（仅 `[dir]` 但走 ctx） | ✅       | 目标工作区 |
| `--json` | ✅                        | ✅       | JSON 输出  |

**输出字段**（人类可读模式）：

```
init codebase workspace
  packageName:  codebase
  rootDir:      /path/to/workspace
  configPath:   /path/to/workspace/.easbot/codebase.json
  dbPath:       /path/to/workspace/.easbot/db/codebase.db
  indexState:   ready | uninitialized | partial | failed
  schemaVersion: 5
  backend:      better-sqlite3 | node:sqlite | @tursodatabase/database
  llm:          { initialized: true, capabilities: { embedding: true, graph: true } }
  DB stats:     { nodes: 1234, edges: 5678, ... }
  recommendation: ...
```

**`recommendation` 行为**（状态不正常时给出下一步建议）：

| 状态                         | 建议                                                       |
| ---------------------------- | ---------------------------------------------------------- |
| config 缺失                  | `Run easbot codebase init`                                 |
| db 缺失                      | `Run easbot-codebase index`                                |
| `indexState = failed`        | `Last sync failed — run easbot-codebase index to retry`    |
| `isStale`                    | `Index is stale — run easbot-codebase recreate to rebuild` |
| `indexState = uninitialized` | `Run easbot-codebase index to populate`                    |
| `indexState = partial`       | `Re-run easbot-codebase index to fill missing files`       |

**典型用法**：

```bash
# 人类可读
easbot codebase status

# JSON 给脚本 / 监控
easbot codebase status --json | jq '.recommendation'
```

---

### 2.3 `doctor` — 健康检查

```bash
easbot codebase doctor [--json] [dir]
# Agent CLI: easbot codebase doctor [--json]
# 独立 CLI: easbot-codebase doctor [--json] [dir]
```

**flags**：

| flag     | Agent CLI | 独立 CLI | 说明       |
| -------- | --------- | -------- | ---------- |
| `[dir]`  | ❌        | ✅       | 目标工作区 |
| `--json` | ✅        | ✅       | JSON 输出  |

**检查内容**：

1. `config.json` 存在性 + 可解析性
2. db 文件存在性 + 路径
3. backend 可用性（`better-sqlite3` / `node:sqlite` / `@tursodatabase/database` 三选一）
4. db 完整性（FK / FTS sync / data quality / 4 张辅助表）

**退出码**：`healthy=true` → 0；`healthy=false` → 1。

> 本命令**没有 `--repair`** —— 修复需通过独立 CLI 的 `recreate` / `clear` / `upgrade` 实现。

---

### 2.4 `sync` — 增量同步

```bash
# Agent CLI（精简选项）
easbot codebase sync [dir] [-q|--quiet] [--json]

# 独立 CLI（完整选项）
easbot-codebase sync [--embed|--no-embed] [--quiet|-q] [--json] [dir]
```

**flags**：

| flag             | Agent CLI | 独立 CLI | 说明                           |
| ---------------- | --------- | -------- | ------------------------------ |
| `[dir]`          | ✅        | ✅       | 目标工作区                     |
| `-q` / `--quiet` | ✅        | ✅       | 仅输出最终汇总                 |
| `--json`         | ✅        | ✅       | JSON 输出                      |
| `--embed`        | ❌        | ✅       | 启用 embedding（默认关）       |
| `--no-embed`     | ❌        | ✅       | 显式跳过 embedding（默认行为） |

> **决策 0077 b**：codebase 默认 opt-out embedding。`--embed` 才会调用 LLM 跑向量化。
> Agent CLI 不暴露这两个 flag（embedding 控制走 service 层）。

> 注：两个 CLI **都没有 `--async`** —— `codebase sync` 一律前台执行；如需异步请用**独立 CLI**的 `watch` 子命令。

---

### 2.5 `config <get|set>` — 读 / 写 `.easbot/codebase.json`

```bash
# Agent CLI（无 positional dir）
easbot codebase config <get|set> [key] [value] [--json]

# 独立 CLI（支持 positional dir）
easbot-codebase config <get|set> [key] [value] [--json] [dir]
```

**子命令**：

| 子命令                     | 用途                                                                        |
| -------------------------- | --------------------------------------------------------------------------- |
| `config get [key]`         | 显示所有字段（或单个 key）                                                  |
| `config set <key> <value>` | 更新字段（**白名单**：`backend` / `schema_version` / `extraction_version`） |

**flags**：

| flag            | Agent CLI     | 独立 CLI      | 说明                       |
| --------------- | ------------- | ------------- | -------------------------- |
| `[key] [value]` | ✅ positional | ✅ positional | `set` 子命令的 key + value |
| `[dir]`         | ❌            | ✅ positional | 目标工作区                 |
| `--json`        | ✅            | ✅            | JSON 输出                  |

---

### 2.6 `query <q...>` — 混合搜索

```bash
# Agent CLI（精简 flags）
easbot codebase query <q...> [--file <p>] [--kind <kind>] [--max <n>] [--no-content] [--intent <text>] [--json]

# 独立 CLI（完整 flags）
easbot-codebase query <q...> [--language=<lang>] [--ast=<type>] [--max=<N>] [--no-edges] [--no-vector|--no-embed] [--json] [--dir=<dir>]
```

> ⚠️ **Agent CLI 与独立 CLI flags 显著不同**：
>
> - Agent CLI 用 `--file <p>` 空格形式；独立 CLI 用 `--file=<path>` 等号形式
> - Agent CLI 用 `--max <n>` 空格；独立 CLI 用 `--max=<N>`
> - Agent CLI **不暴露** `--language` / `--ast` / `--no-edges` / `--no-vector` / `--no-embed` / `--dir`
> - 独立 CLI **不接收** `--intent` / `--no-content`（这俩是 agent CLI 特有的 LLM 友好 flag）

**典型用法**：

```bash
# Agent CLI：基本搜索（空格形式 flags）
easbot codebase query "createHeartbeat" --max 10

# Agent CLI：附文件消歧 + 排名
easbot codebase query "parse" --file src/cli.ts --intent "find main entry"

# 独立 CLI：按语言 + AST 过滤
easbot-codebase query "describe" --language=ts --ast=function_declaration

# 独立 CLI：限制结果 + 跳过向量
easbot-codebase query "auth" --max=10 --no-vector
```

---

### 2.7 `node <name|id>` — 单节点详情

```bash
# Agent CLI（精简 flags）
easbot codebase node <name|id> [--file <p>] [--no-content] [--json]

# 独立 CLI（完整 flags）
easbot-codebase node <name|id> [--file=<path>] [--kind=<kind>] [--edges] [--max=<N>] [--json] [--dir=<dir>]
```

> ⚠️ Agent CLI **不暴露** `--kind` / `--edges` / `--max` / `--dir`。
> Agent CLI 用 `--file <p>` 空格；独立 CLI 用 `--file=<path>` 等号。

**退出码**：`found=true` → 0；`found=false` → 1。

**典型用法**：

```bash
# Agent CLI：按名字查
easbot codebase node Scheduler.createHeartbeat

# Agent CLI：不附源码
easbot codebase node parse --no-content

# 独立 CLI：按 raw id 查
easbot-codebase node 198

# 独立 CLI：同名消歧
easbot-codebase node parse --file=src/cli.ts

# 独立 CLI：附边详情
easbot-codebase node 198 --edges --max=20
```

---

### 2.8 `context <id>` — 子图上下文（BFS）

```bash
# Agent CLI（精简 flags）
easbot codebase context <id> [--depth <n>] [--direction <dir>] [--json]

# 独立 CLI（完整 flags）
easbot-codebase context <id> [--depth=<N>] [--max=<N>] [--direction=<incoming|outgoing|both>] [--relation=<r1,r2,...>] [--json] [--dir=<dir>]
```

> ⚠️ Agent CLI **不暴露** `--max` / `--relation` / `--dir`。

**flags**（仅独立 CLI 详尽）：

| flag                     | 默认   | 说明                           |
| ------------------------ | ------ | ------------------------------ |
| `<id>`                   | —      | 中心节点 id                    |
| `--depth=<N>`            | 2      | BFS 深度                       |
| `--max=<N>`              | 100    | 最大节点数（agent CLI 无）     |
| `--direction=<dir>`      | `both` | incoming / outgoing / both     |
| `--relation=<r1,r2,...>` | —      | 按关系类型过滤（agent CLI 无） |

**典型用法**：

```bash
# Agent CLI：2 层双向邻居
easbot codebase context 198

# Agent CLI：出向 + 限深
easbot codebase context 198 --direction outgoing --depth 1

# 独立 CLI：仅 CALLS 关系
easbot-codebase context 198 --relation=CALLS
```

---

### 2.9 `impact <id>` — blast radius（BFS 入边）

```bash
# Agent CLI
easbot codebase impact <id> [--depth <n>] [--max <n>] [--json]

# 独立 CLI
easbot-codebase impact <id> [--depth=<N>] [--relation=<r1,r2,...>] [--file=<path>] [--kind=<kind>] [--dir=<dir>] [--json]
```

> ⚠️ Agent CLI **不暴露** `--relation` / `--file` / `--kind` / `--dir`。

**flags**：

| flag                     | 默认                                                 | 说明                          |
| ------------------------ | ---------------------------------------------------- | ----------------------------- |
| `<id>`                   | —                                                    | 目标节点 id                   |
| `--depth=<N>` / `-d=N`   | 3                                                    | BFS 深度                      |
| `--relation=<r1,r2,...>` | 默认 `CALLS,REFERENCES,USES,IMPORTS,TYPE_REFERENCES` | 关系类型过滤（独立 CLI only） |
| `--file=<path>`          | —                                                    | 路径消歧（独立 CLI only）     |
| `--kind=<kind>`          | —                                                    | kind 过滤（独立 CLI only）    |
| `--dir=<dir>`            | —                                                    | 目标工作区（独立 CLI only）   |
| `--json`                 | —                                                    | JSON 输出                     |

**典型用法**：

```bash
# Agent CLI：影响面（默认深度 3）
easbot codebase impact 198

# Agent CLI：限深
easbot codebase impact 198 --depth 2

# 独立 CLI：限深 + 仅 CALLS
easbot-codebase impact 198 --depth=2 --relation=CALLS

# 独立 CLI：路径消歧 + kind 过滤
easbot-codebase impact 198 --file=src/cli.ts --kind=function_declaration
```

---

### 2.10 `callers <symbol>` — 谁调用了 `<symbol>`

```bash
# Agent CLI
easbot codebase callers <symbol> [--file <p>] [--kind <kind>] [--max <n>] [--json]

# 独立 CLI
easbot-codebase callers <symbol> [--file=<path>] [--kind=<kind>] [--max=<N>] [--dir=<dir>] [--json]
```

> ⚠️ Agent CLI 不暴露 `--dir`；独立 CLI 不暴露 `--intent` / `--no-content`。
> 注：`--node-id` 是 service 层字段（`runCallers` 接受 `opts.nodeId`），但 CLI **不暴露** `arg === '--node-id'` 分支；只能通过 positional `<symbol>` 走。

**flags**：

| flag            | 默认 | 说明                            |
| --------------- | ---- | ------------------------------- |
| `<symbol>`      | —    | symbol name（必填，positional） |
| `--file=<path>` | —    | 路径 / basename 消歧            |
| `--kind=<kind>` | —    | kind 过滤                       |
| `--max=<N>`     | 20   | 最大结果数                      |
| `--dir=<dir>`   | —    | 目标工作区                      |
| `--json`        | —    | JSON 输出                       |

**典型用法**：

```bash
# Agent CLI：基本查询
easbot codebase callers Scheduler.createHeartbeat

# Agent CLI：消歧 + 限制
easbot codebase callers parse --file src/cli.ts --max 10

# 独立 CLI：按 file / kind 过滤
easbot-codebase callers Scheduler.createHeartbeat --file=src/cli.ts --kind=function_declaration --max=20
```

---

### 2.11 `callees <symbol>` — `<symbol>` 调用了谁

```bash
# Agent CLI
easbot codebase callees <symbol> [--file <p>] [--kind <kind>] [--max <n>] [--json]

# 独立 CLI
easbot-codebase callees <symbol> [--file=<path>] [--kind=<kind>] [--max=<N>] [--dir=<dir>] [--json]
```

> ⚠️ Agent CLI 不暴露 `--dir`；独立 CLI 不暴露 `--intent` / `--no-content`。
> 注：`--node-id` 是 service 层字段（`runCallers` 接受 `opts.nodeId`），但 CLI **不暴露** `arg === '--node-id'` 分支；只能通过 positional `<symbol>` 走。

**flags**：与 `callers` 完全对称；flags 差异与 §2.10 一致。

---

### 2.12 `explore <query>` — **PRIMARY 工具**（源码 + 调用链）

```bash
easbot codebase explore <query> [--file <p>] [--kind <kind>] [--max-files <n>] [--max-symbols <n>] [--depth <n>] [--no-content] [--intent <text>] [--json]
# 两端 CLI flags 完全一致
```

**flags**：

| flag                                 | 默认 | 说明                       |
| ------------------------------------ | ---- | -------------------------- |
| `<query>`                            | —    | symbol name 或自然语言查询 |
| `--file <p>` / `--file=<path>`       | —    | 路径消歧                   |
| `--kind`                             | —    | kind 过滤                  |
| `--max-files <n>`                    | 5    | 入口文件数                 |
| `--max-symbols <n>`                  | 3    | 每文件 symbols 数          |
| `--depth <n>`                        | 1    | caller/callee 链深度       |
| `--no-content`                       | —    | 不附源码                   |
| `--intent <text>` / `--intent=<ctx>` | —    | LLM context string（排序） |
| `--json`                             | —    | JSON 输出                  |

**典型用法**：

```bash
# 一站式：源码 + 调用链
easbot codebase explore "createHeartbeat"

# 不附源码（仅 locations）
easbot codebase explore "createHeartbeat" --no-content

# 限制入口文件 + 调深链
easbot codebase explore "auth" --max-files 3 --depth 2
```

---

### 2.13 `mcp [dir]` — 启动 stdio MCP server

```bash
# Agent CLI（不接收 [dir]，统一走 ctx.worktree）
easbot codebase mcp

# 独立 CLI（接受 [dir] positional + --json）
easbot-codebase mcp [dir] [--json]
```

**flags**：

| flag     | Agent CLI    | 独立 CLI      | 说明                        |
| -------- | ------------ | ------------- | --------------------------- |
| `[dir]`  | ❌（不接收） | ✅ positional | 目标工作区                  |
| `--json` | ❌           | ✅            | JSON 输出（parse 函数 L32） |

> ⚠️ 注：`parseMcpOptions` 只接受 `--help` / `--json` + positional `[dir]`；不接受 `--dir=<dir>` 等号形式或 `--cwd`。

**暴露的 MCP 工具（9 个）**：

- `query` / `node` / `context` / `impact`
- `callers` / `callees` / `explore`
- `status` / `doctor`

---

## 3. 仅独立 CLI 暴露的子命令（10 个，决策 0089）

> 这 10 个子命令**只在 `easbot-codebase *` 独立 CLI 暴露**；agent CLI **不暴露**给 LLM。
> 原因：destructive / 长耗时 / 低频诊断，LLM 不应主动跑。

### 3.1 `index` — 全量索引

```bash
easbot-codebase index [dir] [--embed|--no-embed] [--batch=N] [--verbose|-v] [--quiet|-q] [--json]
```

**flags**：

| flag               | 说明                                             |
| ------------------ | ------------------------------------------------ |
| `[dir]`            | positional 工作区目录                            |
| `--embed`          | 显式启用 embedding（**默认关**：FTS + 关系足够） |
| `--no-embed`       | 显式跳过 embedding                               |
| `--batch=N`        | 批处理大小（默认 50）                            |
| `--verbose` / `-v` | 详细输出                                         |
| `--quiet` / `-q`   | 仅打印汇总                                       |
| `--json`           | JSON 输出                                        |

> **决策 0077 b**：codebase 默认 opt-out embedding。

**典型用法**：

```bash
# Bootstrap 当前 workspace
easbot-codebase index

# 启用 embedding
easbot-codebase index --embed

# 跳过 embedding 加速
easbot-codebase index --no-embed

# 详细输出
easbot-codebase index --verbose
```

---

### 3.2 `recreate` — 销毁 + 重建（**不可逆**）

```bash
easbot-codebase recreate [--keep-config] [--no-reindex] [--no-embed] [--force|-f] [--json] [dir]
```

**flags**：

| flag             | 说明                                    |
| ---------------- | --------------------------------------- |
| `[dir]`          | positional 工作区目录                   |
| `--keep-config`  | 保留 `.easbot/codebase.json`（只删 db） |
| `--no-reindex`   | 跳过自动 index 重建                     |
| `--no-embed`     | 转发给 `runIndex`：跳过 embedding       |
| `--force` / `-f` | 跳过确认提示                            |
| `--json`         | JSON 输出                               |

> ⚠️ 不可逆：所有索引数据（nodes / edges / FTS / embeddings）将被销毁。
> ❌ **Agent CLI 不暴露**（决策 0089）；用户主动跑必须用独立 CLI。

---

### 3.3 `clear` — 清空 db 但保留 config（**不可逆**）

```bash
easbot-codebase clear [--keep-embeddings] [--force|-f] [--json] [dir]
```

**flags**：

| flag                | 说明                                       |
| ------------------- | ------------------------------------------ |
| `[dir]`             | positional 工作区目录                      |
| `--keep-embeddings` | 保留 `node_embeddings` / `embedding_cache` |
| `--force` / `-f`    | 跳过确认提示                               |
| `--json`            | JSON 输出                                  |

> ❌ **Agent CLI 不暴露**（决策 0089）。

---

### 3.4 `upgrade` — 升级 `extraction_version`

```bash
easbot-codebase upgrade [--schema] [--force|-f] [--backup|-b] [--dry-run|-n] [--json] [dir]
```

**flags**：

| flag               | 说明                            |
| ------------------ | ------------------------------- |
| `[dir]`            | positional 工作区目录           |
| `--schema`         | 同时重跑 `ensureSchema`（幂等） |
| `--force` / `-f`   | 即使未 stale 也更新             |
| `--backup` / `-b`  | 升级前备份                      |
| `--dry-run` / `-n` | 仅打印计划，不实际执行          |
| `--json`           | JSON 输出                       |

> `upgrade` **不删数据**；只更新元数据。要重建 db 用 `recreate`。
> ❌ **Agent CLI 不暴露**。

**典型用法**：

```bash
# 检测 stale + 升级版本号
easbot-codebase upgrade

# 同时跑 schema 升级
easbot-codebase upgrade --schema

# 升级前备份
easbot-codebase upgrade --backup

# 仅预览
easbot-codebase upgrade --dry-run
```

---

### 3.5 `embed-status` — 检视 embedding 状态

```bash
easbot-codebase embed-status [--all] [--dry-run|-n] [--pending-list|-p] [--json] [dir]
# alias: easbot-codebase embed [相同 flags]
```

**flags**：

| flag                    | 说明                                           |
| ----------------------- | ---------------------------------------------- |
| `[dir]`                 | positional 工作区目录                          |
| `--all`                 | 显示所有 nodes（含已 embed）                   |
| `--dry-run` / `-n`      | 仅打印统计（默认行为；CLI 强制 `dryRun=true`） |
| `--pending-list` / `-p` | 列出 pending node ids                          |
| `--json`                | JSON 输出                                      |
| `--batch=N`             | 批大小                                         |

> ⚠️ `embed-status` 是**统计 only**，**不真生成 embedding**。真生成需在 `easbot` REPL 内通过 MCP `embed` tool 调用。
> ❌ **Agent CLI 不暴露**。

---

### 3.6 `watch` — 文件监听（阻塞）

```bash
easbot-codebase watch [--debounce=N] [--interval=N] [--backend=<type>] [--ignore=<pattern>]... [--on-load-failure=<throw|warn>] [--json] [dir]
```

**flags**：

| flag                              | 说明                                                                              |
| --------------------------------- | --------------------------------------------------------------------------------- |
| `[dir]`                           | positional 工作区目录                                                             |
| `--debounce=N`                    | per-path 去抖 ms（默认 200）                                                      |
| `--interval=N`                    | 轮询 ms（默认 500）                                                               |
| `--backend=<type>`                | 后端类型：`auto`（默认）/`fs-events`/`inotify`/`windows`/`brute-force`/`watchman` |
| `--ignore=<pattern>`              | gitignore-style 忽略模式（可重复追加）                                            |
| `--on-load-failure=<throw\|warn>` | binding 缺失时行为（默认 `warn`）                                                 |
| `--json`                          | JSON 输出                                                                         |

> 阻塞命令；按 Ctrl+C 退出。写 pid file 到 `.easbot/.watcher.pid`。
> ❌ **Agent CLI 不暴露**（长驻进程不适合 LLM 主动跑）。

**典型用法**：

```bash
# 启动监听（默认去抖 200ms / 轮询 500ms / auto backend）
easbot-codebase watch

# 调小去抖（敏感项目）
easbot-codebase watch --debounce=100 --interval=300

# 显式指定 backend
easbot-codebase watch --backend=inotify

# 追加 ignore pattern
easbot-codebase watch --ignore="node_modules" --ignore="dist"

# binding 缺失时 throw（立即报错）
easbot-codebase watch --on-load-failure=throw
```

---

### 3.7 `stop` — 停止 watch

```bash
easbot-codebase stop [--force|-f] [dir]
```

**flags**：

| flag             | 说明                      |
| ---------------- | ------------------------- |
| `[dir]`          | positional 工作区目录     |
| `--force` / `-f` | 忽略错误直接清理 pid file |

> ❌ **Agent CLI 不暴露**。

---

### 3.8 `dead-code` — 检测 dead code

```bash
easbot-codebase dead-code [--type=<t1,t2,...>] [--no-exclude-entry] [--limit=<N>] [--json]
```

**flags**：

| flag                 | 默认                    | 说明         |
| -------------------- | ----------------------- | ------------ |
| `--type=<t1,t2,...>` | `function,method,class` | AST 类型过滤 |
| `--no-exclude-entry` | exclude                 | 包含入口文件 |
| `--limit=<N>`        | 100                     | 结果上限     |
| `--json`             | —                       | JSON 输出    |

> ❌ **Agent CLI 不暴露**（低频诊断）。
> 注：parse 函数**无** `--dir` 分支也**无** positional `[dir]` 处理（`else if (!arg.startsWith('-'))` 不存在）；workspaceDir 走 ctx / `process.cwd()` 兜底。

**典型用法**：

```bash
# 默认扫描
easbot-codebase dead-code

# 仅函数 + 包含入口
easbot-codebase dead-code --type=function_declaration --no-exclude-entry
```

---

### 3.9 `circular` — 检测循环依赖（Tarjan SCC）

```bash
easbot-codebase circular [--relation=<r>] [--scope=<file|module>] [--json] [--dir=<dir>]
```

**flags**：

| flag              | 默认      | 说明       |
| ----------------- | --------- | ---------- |
| `--relation=<r>`  | `IMPORTS` | 关系类型   |
| `--scope=<scope>` | `file`    | 检测粒度   |
| `--json`          | —         | JSON 输出  |
| `--dir=<dir>`     | —         | 目标工作区 |

> ❌ **Agent CLI 不暴露**。

---

### 3.10 `path` — 两节点最短路径

```bash
easbot-codebase path <from> <to> [--depth=<N>] [--relation=<r1,r2,...>] [--json] [--dir=<dir>]
```

**flags**：

| flag                     | 默认 | 说明                |
| ------------------------ | ---- | ------------------- |
| `<from>` `<to>`          | —    | 起点 / 终点 node id |
| `--depth=<N>` / `-d=N`   | 6    | BFS 深度上限        |
| `--relation=<r1,r2,...>` | —    | 关系类型过滤        |
| `--json`                 | —    | JSON 输出           |
| `--dir=<dir>`            | —    | 目标工作区          |

**退出码**：`found=true` → 0；`found=false` → 1。

> ❌ **Agent CLI 不暴露**。

---

## 4. 反模式 (Anti-patterns)

> 这些是 CLI parser **实际会忽略或报错**的写法，Agent 必须避免。

- ❌ `easbot codebase search` —— **agent CLI 不存在**（独立 CLI 也没有 search alias，只有 `query`）
- ❌ `easbot codebase index` —— **agent CLI 不暴露**（决策 0089）；用户用 `easbot-codebase index`
- ❌ `easbot codebase recreate` —— **agent CLI 不暴露**（destructive）；用户用 `easbot-codebase recreate`
- ❌ `easbot codebase clear` —— **agent CLI 不暴露**（destructive）；用户用 `easbot-codebase clear`
- ❌ `easbot codebase upgrade` —— agent CLI 不暴露；用户用 `easbot-codebase upgrade`
- ❌ `easbot codebase embed-status` —— agent CLI 不暴露；用户用 `easbot-codebase embed-status`
- ❌ `easbot codebase watch` / `stop` —— agent CLI 不暴露（长驻进程）
- ❌ `easbot codebase dead-code` / `circular` / `path` —— agent CLI 不暴露（低频诊断）
- ❌ `easbot codebase reset` —— **不存在**
- ❌ `easbot codebase format-text` —— 不存在；`format-text` 是包内 helper
- ❌ `easbot codebase index --skip-auto-sync` —— 该 flag 仅存在于 `init`
- ❌ `easbot codebase sync --async` —— codebase sync 没有异步选项；需要异步请用 `watch`（独立 CLI only）
- ❌ `easbot codebase sync --embed` —— agent CLI 不暴露 `--embed` / `--no-embed`；独立 CLI 才支持
- ❌ `easbot codebase doctor --repair` —— codebase doctor 没有修复选项；修复走独立 CLI 的 `recreate` / `clear` / `upgrade`
- ❌ `easbot codebase query --language=ts --ast=class` —— agent CLI 不暴露 `--language` / `--ast`；独立 CLI 才支持
- ❌ `easbot codebase context --relation=CALLS` —— agent CLI 不暴露 `--relation`；独立 CLI 才支持
- ❌ `easbot codebase callers --node-id=198` —— **两端都不接受** `--node-id` flag（CLI parse 函数无该分支；`runCallers` 接受 `opts.nodeId` 但 CLI 无法传）
- ❌ `recreate` / `clear` 不带 `--force` —— 没有 `--force` 会被交互式确认拦截
- ❌ 编造未列出的 flag（如 `--workspace` / `--agent-id`）—— workspaceDir / agentId 走 ctx 注入
- ❌ `init` 之后立刻手动跑 `index`（agent CLI） —— agent CLI 不暴露 `index`；走 `easbot-codebase index` 或 sync 增量

---

## 5. 通用调用模式 (General Invocation Patterns)

codebase CLI 支持 4 种典型调用场景：

| 场景                       | 命令                                        | 适用                                               |
| -------------------------- | ------------------------------------------- | -------------------------------------------------- |
| **Agent 主 CLI（LLM）**    | `easbot codebase <op>`                      | LLM 编程场景；只暴露 13 个子命令（决策 0089 过滤） |
| **独立 CLI（standalone）** | `easbot-codebase <op>`                      | 调试 / 一次性操作 / 运维；暴露全 23 个子命令       |
| **MCP 客户端**             | 通过 `easbot codebase mcp` 暴露的 9 个 tool | 其他 AI Agent 通过 MCP 协议消费                    |
| **脚本 / CI**              | 直接调用任一 CLI                            | 定时任务 / 自动化流水线                            |

**核心约束**：

- **codebase CLI 命令空间独立**：只支持 `easbot codebase *` / `easbot-codebase *` 子命令集，不要混用其他命令
- **`--force` flag 仅独立 CLI 暴露**：`recreate` / `clear` 是 destructive，独立 CLI 才有 `--force` 强制标志
- agent CLI 不接收 positional `[dir]`（除 `mcp [dir]` 外）；workspaceDir 走 ctx 注入
- agentId / dbPath 等上下文参数走 ctx 注入，**两 CLI 都不暴露 flag**
