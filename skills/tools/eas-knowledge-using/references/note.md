# note CLI 使用手册 (note Command Reference)

> 本文档是 `easbot note *` 命令的**使用手册**，按子命令列出 flags、用法、输出示例、典型场景。

---

## 1. 子命令清单 (Command Index)

| 子命令 | 用途 | 关键 flags |
|---|---|---|
| `init` | 一次性 bootstrap（创建 db + 下载 embedding 模型） | `--force` / `--json` / `--skip-auto-sync` |
| `search` | 混合搜索（FTS + vector + rerank） | `<query>` / `--mode` / `--max` / `--file` / `--kind` / `--include-graph` / `--cwd` / `--json` |
| `ingest` | 摄入文档到 KG | `<path>` / `--no-embed` |
| `extract` | 读取已 ingest 的 KG entity / relation | `<documentId|chunkId|path>` |
| `remove` | 删除 note + 级联 KG（destructive） | `<id>` / `--confirm` / `-y` |
| `sync` | 重扫 workspace + reconcile | `--async` / `--quiet` / `--json` / `--dir` |
| `graph` | KG 子图查询 | `<nodeId>` / `--kind` / `--depth` / `--direction` |
| `status` | db / ingest queue / KG size 快照 | （无 flag） |
| `doctor` | 完整性检查 | `--json` |
| `mcp` | 启动 MCP stdio server | — |
| `config` | 查看 / 修改 note 配置 | 子命令 |
| `format-text` | CLI 内部 helper | — |

---

## 2. 各命令详解 (Command Details)

### 2.1 `init` — Bootstrap（一次性）

```bash
easbot note init [--force] [--json] [--skip-auto-sync]
```

**flags**：

| flag | 说明 |
|---|---|
| `--force` / `-f` | 强制覆盖已有 db |
| `--json` | JSON 输出 |
| `--skip-auto-sync` | 跳过 init 之后的首次 auto-sync |

**典型用法**：

```bash
# 一次性 bootstrap（含 embedding 模型下载，可能耗时数分钟）
easbot note init

# 强制重新初始化
easbot note init --force
```

> ⚠️ `note init` 会下载 embedding 模型（首次可能耗时数分钟）。

---

### 2.2 `search` — 混合搜索

```bash
easbot note search <query> [--mode=balanced] [--max=10] [--file=<glob>] [--kind=document|chunk|node] [--include-graph] [--cwd=<dir>] [--json]
```

**flags**：

| flag | 取值 | 说明 |
|---|---|---|
| `--mode` | `conservative` / `balanced` / `tokenmax` | 搜索模式（默认 `balanced`） |
| `--max` | 整数 | 最大返回数（默认 10；**注意：flag 名是 `--max` 不是 `--limit`**） |
| `--file` | glob | 按文件路径过滤（子串匹配） |
| `--kind` | `document` / `chunk` / `node` | 按 hit 来源过滤 |
| `--include-graph` | — | 包含 KG 邻居（会显著增加 token，按需开启） |
| `--cwd` | 路径 | 指定 cwd |
| `--json` | — | JSON 输出 |

**典型用法**：

```bash
# 基本搜索
easbot note search "payment module"

# 按文件过滤
easbot note search "auth" --file="docs/*.md"

# 扩域搜索
easbot note search "API design" --mode=tokenmax --max=20
```

---

### 2.3 `ingest` — 摄入文档

```bash
easbot note ingest <path> [--no-embed]
```

**flags**：

| flag | 说明 |
|---|---|
| `--no-embed` | 跳过 embedding 生成（适合大批量摄取后再单独跑 embed） |

**典型用法**：

```bash
# 摄入单个文件
easbot note ingest docs/spec.md

# 摄入但不跑 embedding（之后单独 embed）
easbot note ingest docs/big-archive.md --no-embed
```

---

### 2.4 `extract` — 读取已 ingest 的 KG

```bash
easbot note extract <documentId|chunkId|path>
```

**参数**（三选一，positional）：

| 类型 | 说明 |
|---|---|
| `<documentId>` | 整数 ID |
| `<chunkId>` | 整数 ID |
| `<path>` | workspace 相对路径（子串匹配） |

**典型用法**：

```bash
easbot note extract 42             # 按 documentId
easbot note extract 100            # 按 chunkId
easbot note extract docs/spec.md   # 按路径
```

---

### 2.5 `remove` — 删除 note

```bash
easbot note remove <id> [--confirm|-y]
```

**flags**：

| flag | 说明 |
|---|---|
| `--confirm` / `-y` | 实际删除（默认 dry-run，仅打印预览） |

> 注：`note remove` **没有 `--force` flag**。删除是级联删除 KG 关系；如需预览确认，先不带 `--confirm` 跑一次看 dry-run 输出。

**典型用法**：

```bash
# 预览删除（默认 dry-run）
easbot note remove docs/old.md

# 实际删除
easbot note remove docs/old.md --confirm
# 等价于
easbot note remove docs/old.md -y
```

> ⚠️ 删除会级联删除 KG 关系。

---

### 2.6 `sync` — 重扫 workspace

```bash
easbot note sync [--async] [--quiet] [--json] [--dir <dir>]
```

**flags**：

| flag | 说明 |
|---|---|
| `--async` | 后台 worker pool（适合大批量） |
| `--quiet` / `-q` | 静默（不打印每文件进度） |
| `--json` | JSON 输出 |
| `--dir <dir>` | 指定 workspace 路径 |

**典型用法**：

```bash
# 前台 sync（默认）
easbot note sync

# 后台异步 sync
easbot note sync --async

# 静默跑
easbot note sync --quiet
```

---

### 2.7 `graph` — KG 子图查询

```bash
easbot note graph <nodeId> [--kind=nodes|edges|neighbors] [--depth=1] [--direction=both]
```

**flags**：

| flag | 取值 | 说明 |
|---|---|---|
| `--kind` | `nodes` / `edges` / `neighbors` | 查询类型（默认 `neighbors`） |
| `--depth` | 1-5 | BFS 深度（默认 1） |
| `--direction` | `incoming` / `outgoing` / `both` | 边方向（默认 `both`） |

**典型用法**：

```bash
# 单节点邻居
easbot note graph 42

# 出向 2 层邻居
easbot note graph 42 --kind=neighbors --direction=outgoing --depth=2
```

---

### 2.8 `status` — db / KG 快照

```bash
easbot note status
```

无 flag。返回 db stats / ingest queue / KG size 摘要。

---

### 2.9 `doctor` — 完整性检查

```bash
easbot note doctor [--json]
```

**flags**：

| flag | 说明 |
|---|---|
| `--json` | JSON 输出 |

> 本命令**没有 `--repair`** —— 修复需通过 `init --force` 或手动删除 db 后重建。

---

### 2.10 辅助子命令 (Auxiliary)

| 子命令 | 用途 |
|---|---|
| `mcp` | 启动 MCP stdio server |
| `config` | 查看 / 修改 note 配置 |
| `format-text` | CLI 内部 helper |

---

## 3. 反模式 (Anti-patterns)

- ❌ 给 `doctor` 加 `--repair` —— note doctor 没有修复选项
- ❌ 给 `remove` 不带 `--confirm` 就调 —— 默认 dry-run；要真删必须 `--confirm`
- ❌ `init` 时不警告 embedding 下载 —— embedding 模型首次下载可能耗时数分钟
- ❌ 让 Agent 自行执行 `init` —— 涉及 embedding 下载，必须用户授权后手动跑
- ❌ 编造未列出的 flag（如 `--limit` 不传整数） —— CLI 报参数错误
- ❌ 跨 kb 编造 op（如 `easbot note reset`） —— note 没有 reset；要清空走 `init --force` 重建
- ❌ 让 Agent 自己跑 `--force` 标志的 destructive 命令 —— 必须显式用户授权

---

## 4. 通用调用模式 (General Invocation Patterns)

note CLI 支持 3 种典型调用场景：

| 场景 | 调用方式 | 适用 |
|---|---|---|
| **脚本 / CI** | 直接调用 `easbot note <op>` | 定时任务 / 自动化流水线 |
| **Agent 通过内置接口** | `easbot note <op>` 或 agent 暴露的对应 note 接口（取决于 agent 框架） | AI agent 编程场景 |
| **人工排错** | 直接在终端跑 | 调试 / 一次性操作 |

**核心约束**：

- 三个知识库的 CLI 命令空间**完全独立**：不要跨 kb 拼接命令
- `init` 涉及 embedding 模型下载，可能耗时数分钟——非必要不要重复跑
- workspaceDir 等上下文参数**走 agent 上下文注入**，CLI 端一般不需要手动指定