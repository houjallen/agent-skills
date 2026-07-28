# AGENTS.md

> 本文件为 Agent / AI 助手在此仓库的协作约定。
> 本仓库是 **EASBot agent-skills 管理项目**：核心是 skills 资源库，**不持有应用代码**。
> 核心产物是 `skills/**/SKILL.md` 及其附属的 `scripts/` / `references/` / `assets/`。
> 根 `scripts/` 仅放**项目级维护脚本**（version bump、changelog、docs 同步等）。
> `package.json` 是元信息包，**无运行时入口**；含 `lint*` / `format*` / `lint-staged` 但**不强制 CI 门禁**。

## 1. 项目身份

- **类型**：agent-skills 管理项目（无应用代码；保留根级维护脚本）。
- **职责**：聚合 EASBot 内置（`builtin/`）与工具（`tools/`）类技能，供各类 Agent 加载、组合与复用。
- **许可**：MIT（见 [LICENSE](./LICENSE)）。
- **元包名**：`@easbot/agent-skills`。
- **scripts 区分**：
  - 根 `scripts/` —— 项目维护脚本（changelog / version bump / docs 同步），由维护者或 CI 调用。
  - `skills/<cat>/<name>/scripts/` —— 技能包内部脚本，由加载该技能的 Agent 调用。
  两者都遵循 §12 规范，只是归属层级不同。

## 2. 不强制 CI 门禁的工具

`package.json` 已配 `lint*` / `format*` / `lint-staged`（biome）与 `type-check`（tsc），但**不作为 CI 强门禁**（CI 只验 `quick-validate.ts`）。`pnpm test` / `vitest` 未启用。

Agent 行为：修改 TS/JSON/MD 后**可手动** `npm run lint:fix`，但不要假定 CI 会兜底；交付前以 `quick-validate.ts` 通过为准。

## 3. 目录结构

```
agent-skills/
├── README.md / README.en.md / LICENSE
├── AGENTS.md               # 本文件
├── package.json            # 元信息包（依赖 @easbot/agent、声明 files）
├── scripts/                # 项目级维护脚本（见 §5.1）
├── .claude-plugin/         # Claude marketplace 索引（marketplace.json）
├── .github/                # CI / Issue 模板
├── .husky/                 # git hooks（commit-msg / pre-commit）
└── skills/
    ├── builtin/         # 内置核心技能（7 个）
    │   ├── eas-agent-creation/
    │   ├── eas-agent-evolution/
    │   ├── eas-planning-writer/
    │   ├── eas-prompt-creator/
    │   ├── eas-skill-creator/
    │   ├── eas-skill-find/
    │   └── eas-skill-using/
    └── tools/           # 通用工具类技能（1 个）
        └── eas-chinese-writer/
```

每个技能的标准目录模板：

```
<skill-name>/
├── SKILL.md            # 入口（frontmatter + 正文，强制）
├── scripts/            # 可选，TS 脚本（npx tsx 调用）
├── references/         # 可选，按需 Read
└── assets/             # 可选，模板 / 资源
```

**改动边界**：

- 改一个技能时，**只动该技能目录**与 `skills/<cat>/` 下的同级文件。
- 不要把技能文件散落到仓库根目录；不要自创 `builtin` / `tools` 之外的分类。

## 4. SKILL.md 规约（最高优先级）

1. **首段必须是 YAML frontmatter**（`---` 包围），至少包含：
   - `name`：hyphen-case，正则 `[a-z0-9-]+`，**≤ 64 字符**；推荐 `eas-` 前缀。
   - `description`：以"该技能应在…"开头，**≤ 1024 字符**（推荐 ≤ 500），覆盖触发 / 不触发。
   - 可选：`category` / `version` / `tags` / `mode` / `composition` / `allowed-tools` 等白名单键；其它键被 `quick-validate.ts` 拒收。
2. **禁止附带 README/INSTALL/QUICK_REFERENCE 等独立文档**；说明全部内联在 `SKILL.md` + `references/`。
3. 正文 MUST 包含「何时使用 (When to Use)」+「快速参考 (Quick Reference)」。
4. 详细说明拆到 `references/`，避免 `SKILL.md` 过长（参考样例：`skills/builtin/eas-skill-using/SKILL.md`）。

## 5. 可用命令（脚本）

所有脚本通过 `npx tsx` 在仓库根调用。`scripts/` 依赖策略详见 §12.7。

### 5.1 项目维护脚本（根 `scripts/`）

| 用途 | 命令 | 依赖 |
| --- | --- | --- |
| 为 `docs/*.md` 补 frontmatter | `npx tsx scripts/docs_add_frontmatter.ts` | `js-yaml` |
| 同步 docs 目录（生成索引、修正 name/category） | `npx tsx scripts/docs_sync_automation.ts [--validate]` | `js-yaml` |
| 生成 CHANGELOG | `npx tsx scripts/generate-changelog.ts [version]` | 零依赖 |
| 手动升级版本号 + tag | `npx tsx scripts/bump-version.ts <major\|minor\|patch>` | 零依赖 |
| pre-commit 版本升级（默认禁用，`ENABLE_VERSION_BUMP=1` 启用） | `npx tsx scripts/pre-commit-version.ts` | 零依赖 |
| 生成 `.claude-plugin/marketplace.json` | `npx tsx scripts/generate-plugin.ts [output-dir]` | 零依赖 |
| 发布前全量技能校验 | `bash scripts/publish.sh` / `scripts/publish.ps1` | 零依赖 |

> 根 `scripts/` 在 `package.json` 中以 `npm run` 别名暴露（如 `npm run plugin:generate`）。
> **校验技能结构请用 `skills/builtin/eas-skill-creator/scripts/quick-validate.ts`（§5.2），不要用根 `scripts/` 同名/同义脚本。**

### 5.2 技能包内部脚本

| 用途 | 命令 | 依赖 |
| --- | --- | --- |
| 校验单个技能 | `npx tsx skills/builtin/eas-skill-creator/scripts/quick-validate.ts <skill-dir>` | `js-yaml` |
| 初始化技能骨架 | `npx tsx skills/builtin/eas-skill-creator/scripts/init-skill.ts <name> --path <dest> [--resources scripts,references,assets] [--examples]` | 零依赖 |
| 打包为 `.skill`（ZIP） | `npx tsx skills/builtin/eas-skill-creator/scripts/package-skill.ts <skill-dir> [output-dir]` | `js-yaml` + `jszip` |
| Agent 配置：初始化 / 备份 / 校验 / 增量更新 | `npx tsx skills/builtin/eas-agent-evolution/scripts/{init,backup-config,validate-config,update}-agent.ts ...` | 零依赖 |
| 注册定时备份任务（唯一允许 `import @easbot/agent`） | `npx tsx skills/builtin/eas-agent-evolution/scripts/register-backup-task.ts <register\|list\|delete\|help> [--cron <expr>]` | `@easbot/agent` |
| 初始化规划三件套 / 检查完成度 | `npx tsx skills/builtin/eas-planning-writer/scripts/{init-planning-session,check-complete}.ts ...` | 零依赖 |

**全量"事实上的 test suite"**（CI 跑、Agent 自检都可用）：

```bash
for s in skills/builtin/*/ skills/tools/*/; do
  [ -f "$s/SKILL.md" ] && npx tsx skills/builtin/eas-skill-creator/scripts/quick-validate.ts "$s"
done
```

> 脚本改动需谨慎，与技能内容改动**分开提交**。

## 6. 技能生命周期 (Skill Lifecycle)

技能"内部怎么做"由 [`eas-skill-creator/SKILL.md`](./skills/builtin/eas-skill-creator/SKILL.md) 完整定义。本节只约定 **Agent 工作流边界** + 创建后必须同步更新的项目级文档。

### 6.1 创建（Create）

**第一步：必须先加载这两个技能（顺序固定）**

加载技能 ≠ Read 文件路径。Agent MUST 通过 `Use Skill:` 命名空间激活，路径用 `<skill-name>/xxx` 占位符（运行时由 Agent 解析为实际安装路径）。

1. **`Use Skill: eas-skill-using`** —— 确认分类（`builtin` / `tools`）、检查是否已有可复用技能、能力索引要随之更新。`eas-skill-using` 是中央导航，**不是引用文件**，被激活后作为工作上下文的一部分存在。
2. **`Use Skill: eas-skill-creator`** —— 按其"实现 §步骤 1~7"完整执行（含需求收集、模式选择、`init-skill.ts` 初始化、内容填充、`quick-validate.ts` 校验）。

> **可选辅助**：`Use Skill: eas-skill-find` 可搜索互联网外部相似技能作为参考（不是必须步骤，仅在第一步"是否已有可复用技能"存疑时使用）。

**第二步：同步更新项目级文件**

| # | 文件 | 必改 |
| --- | --- | --- |
| 1 | `AGENTS.md` §3 | 目录树追加新技能 |
| 2 | `README.md` + `README.en.md` | "目录结构"块新增一行；"内置技能一览"或"工具类技能"表新增一行 |
| 3 | `.claude-plugin/marketplace.json` | `plugins[]` 追加 `{name, description, source, category, author}` |
| 4 | `skills/builtin/eas-skill-using/SKILL.md` | 能力索引 + 决策辅助流程图 + 场景映射 各加一节；必要时 bump `version` |
| 5 | `package.json` | **仅元信息**：仅当新技能引入新第三方依赖时调整 `devDependencies`；用户明确要求"不动 `package.json`"时跳过 |

> `CHANGELOG.md` 由 `scripts/generate-changelog.ts` 在发布时自动生成，**不要手动编辑**。

**第三步：自检** —— 跑 §10 验证清单 + §5.2 顶部全量循环。

### 6.2 演化（Evolve）

- 流程：`Use Skill: eas-skill-creator` → 走其"实现"节步骤 → 在该技能目录内完成。
- **项目级同步**：
  - frontmatter `description` 改了 → 同步激活 `Use Skill: eas-skill-using` 更新其能力索引条目 + `README*.md` 表格描述。
  - 新增 `scripts/*.ts` → §5.2 表格追加一行；引入新外部依赖 → §12.7 末尾追加说明。

### 6.3 废弃（Deprecate）

- 流程：frontmatter `description` 开头加"**【已废弃】**"前缀 → 保留目录 1 个 minor 周期 → 下次 minor 时彻底删除。
- **项目级同步**（与 §6.1 反向）：§3 目录树 / `README*.md` / `marketplace.json` / `Use Skill: eas-skill-using` 内的能力索引 一并删除该技能条目。

## 7. 提交与变更约定 (Commit Conventions)

由 `.husky/commit-msg` 强制校验，CI 不再二次校验。

### 7.1 三种合法前缀（正则见 `.husky/commit-msg`）

| 前缀 | 适用 |
| --- | --- |
| `[skill: <name>]` | 改一个技能（影响 `skills/<cat>/<name>/`） |
| `[repo]` | 改仓库维护（根 `scripts/` / `AGENTS.md` / `README*` / `.github/` / `.husky/` / `package.json` / CI） |
| `[auto]` | CI / release bot 写入（自动版本号、CHANGELOG 生成） |

`<name>` 必须为 hyphen-case。`<type> ∈ {feat, fix, docs, test, chore, refactor, perf, ci}`，可附 `(scope)`。

### 7.2 原则

- **Atomic 提交**：一个 commit 只对应"一个技能的一次逻辑变更"。跨技能的决策先按 §11 落档。
- 改动 `SKILL.md` / `references/*.md` / `scripts/*.ts` / `assets/*` 任一项都属于该技能。
- 项目级元信息（README / AGENTS / `eas-skill-using` 索引 / `marketplace.json`）用 `[repo]` 单独提交。

### 7.3 标准工作流

```bash
git status && git diff && git log --oneline -10     # 检查现状
git add <精确文件>                                   # 暂存（避免误带 .env）
git commit -m "[skill: eas-skill-creator] docs: clarify naming convention"
git status && git log -1                              # 验证
```

### 7.4 Hooks

| Hook | 行为 |
| --- | --- |
| `pre-commit` | **默认禁用**（仅打印提示）；`ENABLE_VERSION_BUMP=1` 时升级版本 + 重生 CHANGELOG + 创建 tag |
| `commit-msg` | **强制**：校验首行正则；不合规直接拒绝 |
| `pre-push` | 未配置 |

### 7.5 CI 契约

| Workflow | 触发 | 动作 |
| --- | --- | --- |
| `ci.yml` | `push` / `pull_request` 到 `main` / `develop` | 跑 §5.2 顶部全量 `quick-validate`；任一失败 → workflow 失败 |
| `release.yml` | `push` tag `easbot-skills@*` 或 `workflow_dispatch` | 创建 GitHub Release + 校验版本号格式（**不打 npm 包**） |

> Agent 修改技能后**本地先跑一次** §5.2 顶部循环；不依赖 CI 兜底。

### 7.6 安全红线

- **NEVER** 修改 git config / 跑破坏性命令（`push --force` / `reset --hard` / `clean -f` 等） / 跳 hooks（`--no-verify`） / 强推 `main` / **自行提交未经请求的变更**——除非用户**明确**要求。

### 7.7 Amend 规则（极少用）

`git commit --amend` 仅在**全部满足**时使用：(1) 用户明确要求 / pre-commit hook 自动改文件需补入；(2) HEAD 是当前会话由你创建；(3) commit **未推送**。**commit 失败 / 已推** → NEVER amend，**新建 commit**。

## 8. 协作流程（Agent 工作流）

1. 进入仓库后先 `Read` `README.md` + 本 `AGENTS.md`。
2. 不确定改哪个技能时，`Use Skill: eas-skill-using` 激活中央导航；如需搜索生态内相似技能作参考，`Use Skill: eas-skill-find`。
3. **加载技能必须用 `Use Skill: <name>` 命名空间**，**不要**手动 `Read` `<skill>/SKILL.md` 路径。技能一旦激活即作为工作上下文的一部分存在，而不是被引用的文件。
4. 修改前对目标技能跑 `quick-validate.ts`；修改后复跑 + §10 自检。
5. 完成后给出"修改清单 + 是否通过校验 + 风险点"。

## 9. 易错点与反模式

- ❌ `SKILL.md` 堆全量内容 → ✅ 详情下沉 `references/`。
- ❌ 自创 `builtin` / `tools` 之外的分类。
- ❌ `SKILL.md` 缺 "When to Use" / "Quick Reference"。
- ❌ 把技能脚本 / 模板 / prompt 散落到仓库根目录（根 `scripts/` 仅放项目级脚本）。
- ❌ 拉其它仓库源码 / 依赖 / `package.json` 进本仓库。
- ❌ 假定 `pnpm test` / build / lint 必跑 —— CI 只验 `quick-validate`。

## 10. 验证清单（提交前自检）

- [ ] 改动文件全部位于 `skills/<cat>/<name>/` 或 §7.1 允许的 `[repo]` 范围。
- [ ] `SKILL.md` frontmatter 完整：`name`（hyphen-case、≤64）/ `description`（第三人称、≤1024）。
- [ ] `SKILL.md` 含「何时使用」+「快速参考」。
- [ ] 技能目录下无 `README.md` / `INSTALLATION_GUIDE.md` / `QUICK_REFERENCE.md`。
- [ ] `references/` 链接用标准 Markdown 相对路径（**禁止 `@` 路径引用**）。
- [ ] 用 §5.2 顶部全量循环跑过一次 `quick-validate`。
- [ ] `scripts/*.ts` 第三方 import 仅限 `js-yaml` / `jszip` / `@easbot/agent`（仅 `register-backup-task.ts`）。
- [ ] 提交标题遵循 §7.1 三种合法前缀之一。
- [ ] 跨技能决策按 §11 落档（先于 commit）。

## 11. 决策文档与规划持久化

- **单技能决策** → `<skill-name>/0001-<topic>.md`（数字递增），与该技能同生命周期。
- **跨技能决策** → `docs/decisions/00NN-<topic>.md`（`docs/` 不存在则新建），由相关技能共同引用。
- **长任务 / 多步骤实施规划** → `<cwd>/.easbot/knowledge/tasks/<task-name>/`（`.gitignore` 忽略，**不**入仓）。
- **初始化协议模板**：`skills/builtin/eas-agent-evolution/assets/BOOTSTRAP.md` 是 Agent 自初始化协议来源，**勿**手动编辑。

## 12. 编码与格式基线

来源：根目录 `.editorconfig` / `.gitattributes` / skill 规范。

- **行尾**：LF（`*.md` 同）。
- **缩进**：2 空格。
- **代码注释**：中文；`console.log` 等**用户可见输出**保持英文。
- **文档语言**：正文中文，技术术语（Agent / Skill / Script / Pipeline / Reviewer / Generator / Inversion / MCP / KV-cache / ADR 等）保持英文。
- **标题**：双语形式 `## 中文 (English)`。
- **二进制白名单**（`.gitattributes`）：`*.jpg` / `*.png` / `*.gif` / `*.pdf` / `*.docx` / 字体文件。
- **scripts/ 依赖白名单**（与 §5 表格保持一致）：
  - `js-yaml` — 仅 `quick-validate.ts` / `package-skill.ts`。
  - `jszip` — 仅 `package-skill.ts`。
  - `@easbot/agent` — 仅 `eas-agent-evolution/scripts/register-backup-task.ts`。
  其它需求落地到调用方环境，不入仓。

## 13. 提示词规范 (Prompt Conventions)

适用于**所有以本项目为场景**的提示词：`SKILL.md` 正文 / `references/*.md` / CI workflow 中 AI 调用 prompt / Agent 引导语。Skill 自身的 `name` / `description` 已在 §4 规约；本节约束**正文内容**的写法。

### 13.1 人称与语气

- `description` 用第三人称"该技能应在…"（§4.1）。
- 正文指令可用第二人称（"你应当…" / "MUST…"）；**避免**「我们」「咱们」等带入式表达。
- 禁用「非常好」「极其强大」等主观评价；用事实和场景描述代替。
- 禁用「可能」「大概」做关键结论；推测语境显式标注"推测 / 假设"。

### 13.2 中英文混排

- 正文中文；**专有名词保留英文**（§12.5 列表 + 补充：KV-cache / ADR / HOC）。
- 代码 / 命令 / 文件名 / 路径始终英文。
- 所有 `##` / `###` 标题用双语 `中文 (English)` 形式，如 `## 概述 (Overview)`。
- 首次出现的中文术语可附英文括注一次，后续不再重复。

### 13.3 指令强度词

| 关键词 | 含义 | 适用 |
| --- | --- | --- |
| `MUST` / `MUST NOT` | 强制：违反 = 失败 | 校验、契约、安全 |
| `REQUIRED` | 强制（同 MUST） | 协议字段 |
| `SHOULD` / `SHOULD NOT` | 推荐：有理由可违反 + 需说明 | 最佳实践 |
| `MAY` | 可选：实现者自决 | 扩展点、可选参数 |

> 同一段中 `MUST` 与 `SHOULD` 不能并列表述——必选与推荐分开段落。

### 13.4 链接与代码引用

- 文件链接用相对路径：`[SKILL.md](SKILL.md)`、`[scripts/init.ts](scripts/init.ts)`。
- **禁止 `@xxx.md` 文件路径引用**（与 npm scope `@scope/pkg` 区分）。
- 行内代码一律用反引号 `` ` `` 包裹。
- 代码块必须带语言标记（` ```ts ` / ` ```bash ` / ` ```yaml `），不允许裸 ` ``` `。
- 占位符用 `<placeholder>` 形式（不用 `[...]` / `{...}`，避免与模板语法冲突）。

### 13.5 章节模板

**必填**（如适用）：

```
## 概述 (Overview)            # 1-3 句说清"是什么 / 解决什么"
## 何时使用 (When to Use)      # 触发条件 + 反场景
## 快速参考 (Quick Reference)  # 表格 / 列表，速查要点
```

**可选**：`## 核心模式 (Core Pattern)` / `## 实现 (Implementation)` / `## 常见错误 (Common Mistakes)` / `## 进阶参考 (Advanced References)` / `## 决策沉淀 (Decision Sediment)`。

> 「如何使用本技能」不要放首屏（§4）。

### 13.6 反模式（提示词层）

| ❌ 不要 | ✅ 应该 |
| --- | --- |
| 「使用本技能当…」 | 「该技能应在…时使用」 |
| 「这个工具很好用」 | 删掉 / 替换为具体能力 |
| 「你可以…」模糊指令 | 「MUST …」「SHOULD …」明确指令 |
| README 风格"项目介绍"塞进 SKILL.md | 仅描述触发条件 + 入口；详情下沉 `references/` |
| 链接用 `@references/...` | 用标准相对路径 `[xxx.md](references/xxx.md)` |
| 中文段落夹杂大段英文 | 中文为主，英文仅保留专有名词 + 代码 / 命令 |
| `SKILL.md` 堆 500+ 行 | 拆到 `references/`，主入口保持 < 500 行 |

### 13.7 自检清单（写完提示词后）

- [ ] 标题全部为双语 `中文 (English)` 形式
- [ ] 必填三节（概述 / 何时使用 / 快速参考）齐全
- [ ] `MUST` / `SHOULD` 含义明确、未在同一段混用
- [ ] 所有链接用相对路径、**无 `@` 路径引用**
- [ ] 代码块全部带语言标记
- [ ] 专有名词（Agent / Skill / Script 等）保留英文
- [ ] 无主观评价词（"非常好" / "极其强大"）
- [ ] 通过 §10 验证清单
