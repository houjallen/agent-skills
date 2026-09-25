# codebase 独立 CLI 专属子命令手册（Standalone-Only Subcommand Reference）

> 本文档是 [codebase.md](codebase.md) 的**拆分文件**，承载原 §3 / §4 全部内容。
>
> **拆分原因**（P1-3 评审修复）：codebase.md 拆前 ~850 行 / ~35k 字符，超 `eas-skill-using` 规范建议的 "references 单文件 < 10k 字" 上限 3.5 倍。拆分后：
>
> - [codebase.md](codebase.md) —— 13 个共用子命令 + 通用调用模式（~550 行）
> - [codebase-standalone-only.md](codebase-standalone-only.md)（本文）—— 10 个独立 CLI only 子命令 + 反模式（~300 行）
>
> **版本对齐**：
>
> - `@easbot/codebase`：**v0.3.26**（独立 npm 包；`package.json` 的 `version`）
> - `easbot`（主包）：**v0.3.26**（workspace 24 包统一版本）
> - `node` 要求：`>=22.22.2`（`@easbot/codebase` 的 `engines.node`）
>
> **真值源**：`packages/codebase/src/cli-handler.ts` + `packages/codebase/src/commands/*.ts`（`parseXxxOptions`）。
>
> **决策追溯**：
>
> - **决策 0089**：agent CLI 不暴露本文件描述的 10 个子命令（destructive / 长耗时 / 低频诊断；LLM 不应主动跑）
> - **决策 0077 b**：codebase 默认 opt-out embedding
>
> 本文档与代码同步。

---

## 1. 仅独立 CLI 暴露的子命令（10 个，决策 0089）

> 这 10 个子命令**只在 `easbot-codebase *` 独立 CLI 暴露**；agent CLI **不暴露**给 LLM。
> 原因：destructive / 长耗时 / 低频诊断，LLM 不应主动跑。

### 1.1 `index` — 全量索引

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

### 1.2 `recreate` — 销毁 + 重建（**不可逆**）

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

**destructive 三步法示范**（与 SKILL.md §destructive 三步法对齐）：

```bash
# Step 1：先 dry-run 预览当前 db 状态
easbot-codebase status --json | jq '.recommendation'

# Step 2：把 status 推荐意见 + 影响面（节点数 / 边数 / embedding 数）展示给用户
#   用户回复 y / yes / 确认 → 才进入 Step 3；拒绝 → 回退到 SKILL.md detect-signal

# Step 3：实际重建（必须带 --force）
easbot-codebase recreate --force
```

---

### 1.3 `clear` — 清空 db 但保留 config（**不可逆**）

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

**destructive 三步法示范**：

```bash
# Step 1：先 dry-run 看会删多少（--keep-embeddings 决定是否保留 embedding）
easbot-codebase clear --keep-embeddings --json | jq '.willDelete'

# Step 2：把将删行数展示给用户；用户确认
# Step 3：执行（必须 --force）
easbot-codebase clear --keep-embeddings --force
```

---

### 1.4 `upgrade` — 升级 `extraction_version`

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

### 1.5 `embed-status` — 检视 embedding 状态

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

### 1.6 `watch` — 文件监听（阻塞）

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

### 1.7 `stop` — 停止 watch

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

### 1.8 `dead-code` — 检测 dead code

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

### 1.9 `circular` — 检测循环依赖（Tarjan SCC）

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

### 1.10 `path` — 两节点最短路径

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

## 2. 反模式 (Anti-patterns)

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
- ❌ **跳过 dry-run 直接 `recreate` / `clear`** —— 必须按 SKILL.md §destructive 三步法：先 `status --json` 看影响 → 用户确认 → 才 `--force` 执行
