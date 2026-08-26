# codebase CLI 使用手册 (codebase Command Reference)

> 本文档是 `easbot codebase *` 命令的**使用手册**，按子命令列出 flags、用法、输出示例、典型场景。

---

## 1. 子命令清单 (Command Index)

| 子命令 | 用途 | 关键 flags |
|---|---|---|
| `init` | 一次性创建 workspace 配置（`.easbot/codebase.json`）+ 空 db | `--force` / `--json` / `--skip-auto-sync` |
| `index` | 首次 bootstrap 索引（建 db + 跑首次 sync）或增量索引指定路径 | `[path]` / `--no-embed` / `--batch=N` |
| `status` | 显示当前 workspace 的 config / db / index_state | `--dir` / `--json` |
| `sync` | 重扫 workspace 增量同步（embed + reconcile） | `--json` / `--quiet` / `--no-embed` / `--embed` |
| `doctor` | 健康检查（config / backend / db 完整性） | `--json` |
| `recreate` | 销毁并重建 db（**不可逆**） | `--keep-config` / `--force` / `--json` |
| `clear` | 清空 db 但保留 config（**不可逆**） | `--keep-embeddings` / `--force` / `--json` |
| `config` | 查看 / 修改 codebase 配置 | 子命令 |
| `query` | 一次性 FTS 查询（无 embedding） | `<query>` |
| `path` | 按路径查询节点 | `<path>` |
| `node-detail` | 单节点详情 | `<name>` |
| `mcp` | 启动 MCP stdio server | — |
| `embed` | 单独跑 embedding pipeline | — |
| `upgrade` | 升级 db schema | — |
| `watch` | 文件监听模式（增量） | — |
| `stop` | 停止 watch | — |
| `circular` | 检测循环依赖 | — |
| `dead-code` | 检测 dead code | — |
| `explore` | CLI 等价的 explore 查询 | `<query>` |

---

## 2. 各命令详解 (Command Details)

### 2.1 `init` — 创建 workspace 配置

```bash
easbot codebase init [--force] [--json] [--skip-auto-sync]
```

**flags**：

| flag | 说明 |
|---|---|
| `--force` / `-f` | 强制覆盖已有 `.easbot/codebase.json` |
| `--json` | JSON 输出 |
| `--skip-auto-sync` | 跳过 init 之后的首次 auto-sync（仅建 config + 空 db） |

**典型用法**：

```bash
# 在当前 workspace 初始化
easbot codebase init

# 强制重新初始化
easbot codebase init --force

# 只创建配置，不跑首次 sync（之后手动跑 index）
easbot codebase init --skip-auto-sync
```

---

### 2.2 `index` — Bootstrap / 增量索引

```bash
easbot codebase index [path] [--no-embed] [--batch=N]
```

**参数**：

| 名称 | 说明 |
|---|---|
| `[path]` | 要索引的目录（默认当前 workspace），作为 positional arg 传入 |

**flags**：

| flag | 说明 |
|---|---|
| `--no-embed` | 跳过 embedding 生成（更快，适合先结构化后批量 embed） |
| `--batch=N` | 批处理大小，默认 50 |

**典型用法**：

```bash
# Bootstrap 当前 workspace（首次 init 后跑）
easbot codebase index

# 增量索引某个子目录
easbot codebase index packages/agent

# 跳过 embedding 加速
easbot codebase index --no-embed
```

**输出**：进度行 + 最终汇总（嵌入数量 / 跳过原因 / backend）。

---

### 2.3 `status` — 索引状态快照

```bash
easbot codebase status [--dir <dir>] [--json]
```

**flags**：

| flag | 说明 |
|---|---|
| `--dir <dir>` | 指定 workspace 路径（默认 cwd） |
| `--json` | JSON 输出（脚本友好） |

**输出字段**：

```
rootDir / codebaseDir / config / db / indexState / schemaVersion /
extractionVersion / backend / nodes / edges / 💡 recommendation
```

**`recommendation` 行为**（状态不正常时给出下一步建议）：

| 状态 | 建议 |
|---|---|
| config 缺失 | `Run \`easbot codebase init\`` |
| db 缺失 | `Run \`easbot codebase index\`` |
| `indexState = failed` | `Last sync failed — run \`easbot codebase index\` to retry` |
| `isStale` | `Index is stale — run \`easbot codebase recreate\` to rebuild` |
| `indexState = uninitialized` | `Run \`easbot codebase index\` to populate` |
| `indexState = partial` | `Re-run \`easbot codebase index\` to fill missing files` |

**典型用法**：

```bash
# 人类可读输出
easbot codebase status

# JSON 给脚本用
easbot codebase status --json | jq '.recommendation'
```

---

### 2.4 `sync` — 增量同步

```bash
easbot codebase sync [--json] [--quiet] [--no-embed|--embed]
```

**flags**：

| flag | 说明 |
|---|---|
| `--json` | JSON 输出 |
| `--quiet` / `-q` | 仅输出最终汇总（默认每个阶段都打印） |
| `--no-embed` | 跳过 embedding（与 `--embed` 互斥；缺省 `--embed`） |
| `--embed` | 显式声明跑 embedding（默认） |

> 注：本命令**没有 `--async`** —— codebase sync 一律前台执行；如需异步请用 `watch` 子命令。

**典型用法**：

```bash
# 标准前台 sync
easbot codebase sync

# 静默跑（大目录时）
easbot codebase sync --quiet

# 跳过 embedding 加速（适合大批量）
easbot codebase sync --no-embed
```

---

### 2.5 `doctor` — 健康检查

```bash
easbot codebase doctor [--json]
```

**flags**：

| flag | 说明 |
|---|---|
| `--json` | JSON 输出 |

**检查内容**：

1. config.json 存在性与可解析性
2. db 文件存在性 + 路径
3. backend 可用性（`better-sqlite3` / `node:sqlite` / `@tursodatabase/database` 三选一）
4. db 完整性（FK / FTS sync / data quality / 4 张辅助表）

**典型用法**：

```bash
# 人类可读输出
easbot codebase doctor

# JSON 给脚本 / 健康检查脚本用
easbot codebase doctor --json | jq '.healthy'
```

> 本命令**没有 `--repair`** —— 修复需通过 `recreate` 或 `clear` 实现（不可逆）。

---

### 2.6 `recreate` — 销毁 + 重建 db（**不可逆**）

```bash
easbot codebase recreate [--keep-config] [--force] [--json]
```

**flags**：

| flag | 说明 |
|---|---|
| `--keep-config` | 保留 `.easbot/codebase.json`（仅重建 db；默认会一并清掉 config） |
| `--force` / `-f` | 跳过确认提示直接执行 |
| `--json` | JSON 输出 |

**典型用法**：

```bash
# 完整重建（含 config）
easbot codebase recreate --force

# 只重建 db 保留 config
easbot codebase recreate --keep-config --force
```

> ⚠️ 不可逆操作：所有索引数据（nodes / edges / FTS / embeddings）将被销毁。

---

### 2.7 `clear` — 清空 db 但保留 config（**不可逆**）

```bash
easbot codebase clear [--keep-embeddings] [--force] [--json]
```

**flags**：

| flag | 说明 |
|---|---|
| `--keep-embeddings` | 保留 embedding 表（仅清空 nodes / edges / FTS） |
| `--force` / `-f` | 跳过确认提示直接执行 |
| `--json` | JSON 输出 |

**典型用法**：

```bash
# 完整清空 db，保留 config
easbot codebase clear --force

# 清空但保留 embedding 缓存
easbot codebase clear --keep-embeddings --force
```

> ⚠️ 不可逆操作：所有 db 数据将被销毁。

---

### 2.8 辅助子命令 (Auxiliary)

| 子命令 | flags | 用途 |
|---|---|---|
| `config` | 子命令 | 查看 / 修改 codebase 配置 |
| `query` | `<query>` / `--json` / `--no-edges` / `--no-vector` / `--no-embed` / `-l` / `--language` | 一次性 FTS 查询（无 embedding）；适合 grep-style 临时查询 |
| `path` | `<path>` / `--json` | 按文件路径查询节点 |
| `node-detail` | `<name>` / `--json` | 单节点详情（等价 agent 暴露的 node 接口） |
| `mcp` | — | 启动 MCP stdio server（供其他 Agent 通过 MCP 协议消费 codebase） |
| `embed` | `[dir]` / `--all` / `--batch=N` / `--dry-run` / `--pending-list` / `--json` | 单独跑 embedding pipeline |
| `upgrade` | — | 升级 db schema（处理 schema_version 不兼容时） |
| `watch` | — | 启动文件监听模式（增量自动 sync） |
| `stop` | — | 停止 watch |
| `circular` | — | 检测循环依赖（structural 视角） |
| `dead-code` | — | 检测 dead code（启发式） |
| `explore` | `<query>` | CLI 等价的 explore 查询 |

> 这些子命令大多可被 agent 暴露的对应接口等价调用（如 `codebase(operation="...")`）；CLI 入口主要用于自动化脚本或人工排错。

---

## 3. 反模式 (Anti-patterns)

- ❌ 在 `index` 命令用 `--skip-auto-sync` —— 该 flag 仅存在于 `init`，`index` 无此选项
- ❌ 给 `sync` 加 `--async` —— codebase sync 没有异步选项；需要异步请用 `watch`
- ❌ 给 `doctor` 加 `--repair` —— codebase doctor 没有修复选项，修复走 `recreate` 或 `clear`（不可逆）
- ❌ `recreate` / `clear` 不带 `--force` —— 没有 `--force` 会被交互式确认拦截
- ❌ 给 `recreate` / `clear` 加 positional `[dir]` —— 命令不接受 positional dir 参数
- ❌ 让 Agent 自行执行 `recreate` / `clear` —— 不可逆，必须用户授权 + `--force`
- ❌ 编造未列出的 flag（如 `--workspace` / `--agent-id`） —— workspaceDir / agentId 走 ctx 注入，CLI 端用默认即可
- ❌ `init` 之后立刻手动跑 `index` —— `init` 默认会跑首次 auto-sync；要跳过请加 `--skip-auto-sync`

---

## 4. 通用调用模式 (General Invocation Patterns)

codebase CLI 支持 3 种典型调用场景：

| 场景 | 调用方式 | 适用 |
|---|---|---|
| **脚本 / CI** | 直接调用 `easbot codebase <op>` | 定时任务 / 自动化流水线 |
| **Agent 通过内置接口** | `easbot codebase <op>` 或 agent 暴露的对应 codebase 接口（取决于 agent 框架） | AI agent 编程场景 |
| **人工排错** | 直接在终端跑 | 调试 / 一次性操作 |

**核心约束**：

- 三个知识库的 CLI 命令空间**完全独立**：不要跨 kb 拼接命令
- `init` / `index` / `recreate` / `clear` / `doctor` 都是**destructive 或重负载**操作，需要先看 `doctor` 评估现状
- workspaceDir / agentId / dbPath 等上下文参数**走 agent 上下文注入**，CLI 端一般不需要手动指定