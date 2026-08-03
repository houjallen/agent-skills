# 本地搜索 (Local Search)

> 主技能文件 `SKILL.md` 重点说远程搜索（skills.sh）。本 references 详述 **`--local` / `--path` 两个 flag 的语义、输出、约束**。

## 何时切到本地模式 (When to Use Local)

远程模式适合"**找新技能**"。本地模式适合以下场景：

- 用户问"我装了哪些 skill" → 用 `--local`（或更直接的 `eas-skill-using`）
- 用户给了一个本地仓库路径想知道里头有什么 skill → 用 `--path <dir>`
- 网络不通 / 想离线搜索 → `--local`（不依赖 skills.sh API）
- 调试 store 索引是否正确写入了新 source → `find xlsx --local` 验证

## 入口与 flag (Entry & Flags)

```bash
# 查 store 内所有 skill（按 query 过滤）
easbot skills find [query] --local

# 扫文件系统 SKILL.md（任意目录）
easbot skills find [query] --local --path <dir>

# JSON 输出（脚本 / 自动化）
easbot skills find xlsx --local --json
```

| Flag | 作用 | 互斥 |
|---|---|---|
| `--local` | 切换到本地模式 | 与远程互斥（同时无） |
| `--path <dir>` | 扫 `<dir>` 下所有 SKILL.md（filesystem scan 模式） | 与 store 模式互斥（不传走 store，传走 filesystem） |
| `--json` | 输出结构化 JSON | 与 TTY 互斥（脚本场景） |
| `--owner` | **本地模式忽略**（仅远程有效） |  |

## Store 模式 vs Filesystem 模式 (Store Mode vs Filesystem Mode)

**`--local` 不传 `--path`** → 读 `<data>/easbot/skills/store/index.json`（v6 三层 schema：market → plugin → skill），按 query 过滤 skillName。

输出按"市场（market） → 插件（plugin） → skill"三层缩进：

```
Local skills matching "xlsx" (1)

6ca138fd  (github)  https://github.com/houjallen/agent-skills.git  ...
  └ plugin: agent-skills  (1 skill)
    eas-xlsx
```

**`--local --path <dir>`** → 用 `Glob.scan('**\/SKILL.md')` 扫 `<dir>`，按 query 过滤 skillName。

输出按"skill 名 → store 路径"扁平分组：

```
Local skills matching "xlsx" (1)

eas-xlsx
  └ C:/Users/you/.local/share/easbot/skills/store/.../eas-xlsx
```

**两套输出的差异**：
- Store 模式按"来源（market → plugin）"分组 —— 适合看"这个 source 有哪些 skill"
- Filesystem 模式按"skill 名"分组（同名 skill 合并到同一组）—— 适合看"哪些路径下有这个 skill"

## 不传 query (No Query)

不传 query 时返回**该模式下所有 skill**（store 模式 = store 内全部；filesystem 模式 = 扫到的全部 SKILL.md）。

## 与远程模式的区别 (Differences from Remote)

| 维度 | 远程 | 本地（`--local`） |
|---|---|---|
| 数据源 | skills.sh `/api/search` | `<data>/easbot/skills/store/index.json` |
| 联网 | 必须 | 不必须 |
| 排序 | install 数倒序 | 按 skillName 字母序 |
| 结果数 | top 10（API 限） | 全部匹配 |
| 安装命令 | `easbot skills add <owner>/<repo>@<skill>` | 该 skill 已登记在 store（`easbot skills add <source>` 重新 add） |
| Owner 过滤 | 支持 `--owner` | **不支持**（store 内是已登记的，owner 信息在 market 层） |

## Store 物理结构补充 (Store Layout Hint)

> 完整路径表 / 锁文件 / 加载顺序见 [data-layout.md](data-layout.md)。这一节只覆盖 find 实际用到的：

- Store 物理根：`<data>/easbot/skills/store/<marketId-hash>/`
- market 派生：`sha256(type|url|ref)`，不同 source（github / well-known / local）天然分目录
- plugin 派生：源仓库 basename（如 `agent-skills`）或源端 manifest 声明
- skill 物理路径：`<marketId-hash>/<源端 subpath>/<skillName>/SKILL.md`（保留源端 subpath，如 `skills/builtin/eas-xlsx`）

`find --local` 拿到的 `storePath` 字段就是 skill 在 store 里的**绝对路径**，Agent 可直接用 Skill 工具的 `path` 参数加载。

## 注意 (Caveats)

- `--local` 不读 network，**不**触发任何 skills.sh 调用（与远程模式完全隔离）
- `--path` 扫的是文件系统 SKILL.md，**不**经过 store 索引；不存在的 path 直接报错
- 想看"已装到 agent 的 skill"用 `eas-skill-using`（find 查的是 store / filesystem，不是 agent front-end）
- 装到 agent 后的运行时加载路径（`Skill.all()`）与 find 无关 —— 见 [data-layout.md](data-layout.md)
