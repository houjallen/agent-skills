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
    └── tools/           # 通用工具类技能（5 个）
        ├── eas-chinese-writer/
        ├── eas-docx/      # Word 文档（CREATE / EDIT / ACCEPT-CHANGES）
        ├── eas-pdf/       # 设计驱动 PDF（CREATE / FILL / REFORMAT）
        ├── eas-pptx/      # PPT 演示（CREATE / EDIT / READ）
        └── eas-xlsx/      # Excel/电子表格（READ / CREATE / EDIT / FIX / VALIDATE）
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
| 4 | `skills/builtin/eas-skill-using/SKILL.md` | **仅 `builtin` 类别**：能力索引 + 决策辅助流程图 + 场景映射 各加一节；必要时 bump `version`。（`tools` 类技能不进入能力索引，由 Agent 按 frontmatter description 自行匹配） |
| 5 | `package.json` | **仅元信息**：仅当新技能引入新第三方依赖时调整 `devDependencies`；用户明确要求"不动 `package.json`"时跳过 |

> `CHANGELOG.md` 由 `scripts/generate-changelog.ts` 在发布时自动生成，**不要手动编辑**。

**第三步：自检** —— 跑 §10 验证清单 + §5.2 顶部全量循环。

### 6.2 演化（Evolve）

- 流程：`Use Skill: eas-skill-creator` → 走其"实现"节步骤 → 在该技能目录内完成。
- **项目级同步**：
  - frontmatter `description` 改了 → 同步 `README*.md` 表格描述。
  - 若是 `builtin` 技能：额外同步 `eas-skill-using` 的能力索引 + 决策辅助流程图 + 场景映射（`tools` 类技能不进入 eas-skill-using 索引）。
  - 新增 `scripts/*.ts` → §5.2 表格追加一行；引入新外部依赖 → §12.7 末尾追加说明。

### 6.3 废弃（Deprecate）

- 流程：frontmatter `description` 开头加"**【已废弃】**"前缀 → 保留目录 1 个 minor 周期 → 下次 minor 时彻底删除。
- **项目级同步**（与 §6.1 反向）：§3 目录树 / `README*.md` / `marketplace.json` 一并删除；**若是 builtin 技能**，额外删除 `Use Skill: eas-skill-using` 内的能力索引条目（`tools` 技能无此条目）。

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
- [ ] 内容评审遵循 §14 五维度清单（结构 / 内容 / 语义 / 规范 / 落地），所有 P0/P1 项必须为 0。

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

## 14. 评审规范 (Review Specification)

本节约束**如何评审一份技能 / 一份提示词 / 一组仓库级变更**：评审的目标、范围、入口、流程、五维度清单、严重度分级与产出物。§10 是「自检」（开发者本人提交前快速过一遍），§14 是「评审」（多视角、按清单、有产出、可追溯）。**两者不可互相替代**。

### 14.1 评审目标 (Review Goals)

| # | 目标 | 通过条件 |
|---|---|---|
| 1 | **符合最佳实践** | 命中 §4 SKILL.md 规约 + §5 命令约定 + §12 编码基线 + §13 提示词规范 |
| 2 | **目标明确** | `description` 仅描述触发条件；正文首段能让 Agent 在 30 秒内判断「该不该加载」 |
| 3 | **内容简洁** | `SKILL.md` < 500 行；`description` ≤ 500 字符（硬上限 1024）；无冗余、无套话 |
| 4 | **不混淆** | 概念边界清晰：Skill vs Tool vs Task vs Agent；与其他技能职责无重叠 |
| 5 | **不冲突** | 与 `AGENTS.md` 已有章节、CI 契约、`quick-validate` 规则三者无矛盾 |
| 6 | **语义明确** | MUST / SHOULD / MAY 按 §13.3 使用；不存在「可能」「大概」做关键结论 |
| 7 | **步骤清晰** | Pipeline 类技能步骤序列 + Gate 三要素齐全；Reviewer 类检查项按严重度分级 |
| 8 | **能够落地** | 给出的指令可被 Agent 直接执行；脚本路径遵循 §5.2 规范；不依赖 CI 兜底 |

### 14.2 评审范围 (Review Scope)

| 范围 | 评审对象 | 评审者 |
|---|---|---|
| **新增技能** | `SKILL.md` + `scripts/` + `references/` + `assets/` 全量 | 走 `eas-skill-creator` + 加载对应领域技能 |
| **演化现有技能** | `description` / frontmatter / 必填节 / `scripts/` 增量 | 走 `eas-skill-creator` |
| **提示词变更** | Agent / Tool / Task / Command / Mode / Session / Feature / Context 八大类型 | 走 `eas-prompt-creator` |
| **项目级变更** | `AGENTS.md` / `README*` / `marketplace.json` / `package.json` / `scripts/` | 走 `eas-skill-using` 选技能组合 |
| **跨技能决策** | `docs/decisions/00NN-*.md` | 走 `eas-planning-writer` 决策沉淀 |

### 14.3 评审入口 (Review Entry)

> **[MUST] 任何评审 MUST 按下表顺序在评审执行前完成技能加载；未完成加载即开始评审视为违反本规范。**
> 即使评审者已熟悉全部规范或被评审对象为单个技能文件，仍 MUST 走完本节规定的加载序列——目的是保证上下文含有"生态全局视图 + 结构规范"两套事实，避免凭记忆评审。

#### 14.3.1 强制加载序列 (Mandatory Load Sequence)

按**从广到专**的顺序依次加载，每次加载后等待技能主体进入上下文后再执行下一步：

| 步骤 | 命令 | 目的 | 不可跳过理由 |
|---|---|---|---|
| **1** | `Use Skill: eas-skill-using` | 拿到 builtin 技能生态的能力索引与场景映射 | 评审者须确认被评审对象在生态中的位置：是否已被废弃 / 已被新技能替代 / 与其他技能职责是否重叠 |
| **2** | `Use Skill: eas-skill-creator` | 拿到 SKILL.md 结构规范、5 大模式、frontmatter 约束、`scripts/` / `references/` / `assets/` 规则 | 评审维度 1（结构）+ 维度 4（规范）的判据来源；不加载此技能则维度清单的"通过条件"无权威依据 |
| **3（条件）** | 评审对象为**提示词**时：`Use Skill: eas-prompt-creator` | 拿到八大提示词类型规范 + 验证清单 | 评审维度 3（语义）中"指令强度词 / 边界控制 / Token 预算"的判据来源 |
| **3（条件）** | 评审对象为**跨技能决策**时：`Use Skill: eas-planning-writer` | 拿到决策沉淀规范与三件套落地路径 | 评审产出物 §14.7 落档路径的判据来源 |
| **4** | 执行五维度评审（§14.5） | — | 必须在步骤 1-3 全部加载完成后才允许开始 |
| **5** | 产出评审报告（§14.7） | — | 同上 |

> **顺序硬约束**：步骤 1 → 步骤 2 → 步骤 3 是单向链。**禁止**先加载 `eas-skill-creator` 再加载 `eas-skill-using`——后者负责"是否还要评这个对象"的前置判断，先加载结构规范会浪费上下文。

#### 14.3.2 加载完成判定 (Load Completion Check)

步骤 1-3 视为"已加载"必须同时满足：

- [ ] 通过 `skill` 工具以 `name` 调用（**禁止**直接 `Read` SKILL.md 路径）
- [ ] 上下文已包含该技能 SKILL.md 主体（`name + description` 不足以视为已加载）
- [ ] 已阅读该技能 §「快速参考」或等效章节，确认其触发条件、核心脚本、必填字段
- [ ] 加载后已将该技能的核心约束**回填**到本评审任务的内部 checklist（防止"加载了但没用来评判"）

> **反模式**：加载技能后直接跳到执行步骤 4，但未对照技能 §快速参考 做实际判据——属于"加载了但未使用"，按 §14.9 视为无效评审。

#### 14.3.3 例外与豁免 (Exceptions)

- **不豁免场景**：评审任何 builtin / tools 技能、任何提示词、任何跨技能决策——均 MUST 加载 §14.3.1 全量。
- **可豁免场景（仅限以下两类）**：
  - **极小变更**：仅修改错别字、链接断链修复、单行 typo——此类变更无需评审，走 §10 自检即可；评审报告可显式声明"变更低于评审阈值，已豁免"。
  - **纯文档 README 同步**：仅同步 `README*.md` / `marketplace.json` 中已被评审过的字段映射——仍 MUST 引用上游评审报告 ID。
- **豁免申请方式**：评审报告 §豁免项（§14.7）中列出，附"未加载 X 技能"的明确理由；缺少理由的豁免按 §14.6 视为 P1。

### 14.4 评审流程 (Review Workflow)

> **[MUST] 评审流程的第一阶段是「入口技能加载」而非「开始评审」。** 未完成 §14.3.1 强制加载序列即开始后续阶段，按 §14.6 视为 P0。

```
入口加载（§14.3 MUST） → 启动阶段 → 五维度并行评审（§14.5） → 严重度分级（§14.6） → 产出评审报告（§14.7） → 修复闭环（§14.8）
```

| 阶段 | 输入 | 输出 | 工具 | Gate（不通过则不可进入下一阶段） |
|---|---|---|---|---|
| **入口加载** | 被评审对象（文件 / 路径） | 已加载的 §14.3.1 序列技能上下文 | `skill` 工具 | §14.3.2 全部勾选；缺一项 = 阻塞 |
| **启动** | 入口加载完成的上下文 + 被评审对象 | 评审 scope 边界（明确评什么 / 不评什么） | `Read` / `Grep` / `Glob` | 评审报告 §评审对象 已填写 |
| **评审** | scope 边界 + 维度清单 + 规范来源 | 每维度发现项（含严重度） | `Read` / `Grep` / `quick-validate` | 五维度清单全跑，无维度遗漏 |
| **分级** | 发现项 | P0 / P1 / P2 / P3 分类 | 人工判定（按 §14.6） | 每条发现项 MUST 有严重度 |
| **产出** | 分级后发现项 + 入口加载证据 | 评审报告（§14.7） | `Write` 到 PR 描述 / 评论 | 报告 §五维度评分 + §入口加载 已填写 |
| **闭环** | 评审报告 | 修复 commit | `git commit -m "[skill: <name>] fix: ..."` | 所有 P0 = 0；P1 = 0 或全部豁免 |

> **Gate 强制**：表中每行「Gate」列是 MUST 通过条件。任何 Gate 未通过即视为评审未完成，不得进入下一阶段，也不得提交评审报告。
> **入口加载是第一个 Gate**：评审者在对话中未实际加载 §14.3.1 序列技能，产出的评审报告按 §14.6 直接判 P0。

### 14.5 五维度评审清单 (Five-Dimension Checklist)

#### 维度 1：结构 (Structure)

| 检查项 | 通过条件 | 严重度 |
|---|---|---|
| **入口技能加载** | 评审者 MUST 已按 §14.3.1 完成 `eas-skill-using` + `eas-skill-creator`（提示词评审加 `eas-prompt-creator`、跨技能决策加 `eas-planning-writer`）加载；§14.3.2 全部勾选 | **P0** |
| 技能目录结构正确 | 含 `SKILL.md`；可选 `scripts/` / `references/` / `assets/` 不混入根目录 | P0 |
| frontmatter 完整 | `name`（hyphen-case、≤64）/ `description`（第三人称、≤1024） | P0 |
| 必填节齐全 | 概述 / 何时使用 / 快速参考 齐全（§13.5） | P0 |
| 无冗余文档 | 技能目录下无 `README.md` / `INSTALLATION_GUIDE.md` / `QUICK_REFERENCE.md`（§4.2） | P0 |
| `SKILL.md` 体量 | < 500 行；超过则拆 `references/`（§13.6） | P1 |
| 章节层级合理 | 二级 = 双语标题；三级以下可只用中文 | P2 |
| references 链接 | 用相对路径 `[xxx.md](references/xxx.md)`（§13.4） | P0 |

#### 维度 2：内容 (Content)

| 检查项 | 通过条件 | 严重度 |
|---|---|---|
| 概述准确 | 1-3 句说清"是什么 / 解决什么"，无主观评价 | P1 |
| 何时使用完整 | 触发条件 + 反场景；不少于 3 条 | P1 |
| 快速参考可用 | 表格 / 列表，速查要点齐全 | P2 |
| `description` 触发条件充分 | 覆盖 5+ 触发短语 + 1+ 反场景；不总结过程 | P0 |
| scripts 必要性 | 只在「重复 / 确定性可靠」时引入；非 demo 用例 | P1 |
| references 信息不重复 | 信息在 SKILL.md 或 references 中只出现一次 | P1 |

#### 维度 3：语义 (Semantics)

| 检查项 | 通过条件 | 严重度 |
|---|---|---|
| 指令强度词规范 | MUST / SHOULD / MAY 按 §13.3 使用，不混用 | P0 |
| 无歧义指令 | 不出现"可能 / 大概 / 建议试试"做关键结论；推测标注"推测 / 假设" | P1 |
| 无主观评价 | 不出现"非常好 / 极其强大 / 完美" | P2 |
| 人称规范 | `description` 第三人称；正文用第二人称（"你应当…" / "MUST…"） | P1 |
| 概念边界 | Skill / Tool / Task / Agent 区分清晰，不混淆（见 `eas-skill-using` §关键概念） | P0 |
| 与其他技能不冲突 | 职责与既有 builtin 不重叠；若有重叠 MUST 在决策文档说明 | P0 |

#### 维度 4：规范 (Compliance)

| 检查项 | 通过条件 | 严重度 |
|---|---|---|
| 命名规范 | `name` 全部小写 + 连字符；推荐 `eas-` 前缀（§4.1） | P0 |
| 标题双语 | 所有 `##` / `###` 用 `## 中文 (English)` 形式（§13.2） | P1 |
| 链接无 `@` 引用 | 不出现 `@references/...` 或 `[xxx](@references/xxx.md)`（§13.4） | P0 |
| 代码块带语言标记 | ` ```ts ` / ` ```bash ` / ` ```yaml `；无裸 ` ``` `（§13.4） | P1 |
| scripts 依赖白名单 | 仅 `js-yaml` / `jszip` / `@easbot/agent`（§12.7） | P0 |
| 行尾 LF + 2 空格缩进 | 与 `.editorconfig` 一致（§12.1） | P2 |
| 中英文混排 | 正文中文；专有名词保留英文（§12.5 / §13.2） | P1 |
| 通过 `quick-validate` | §5.2 顶部全量循环零失败 | P0 |
| 提交前缀合法 | `[skill: <name>]` / `[repo]` / `[auto]` 之一（§7.1） | P0 |

#### 维度 5：落地 (Actionability)

| 检查项 | 通过条件 | 严重度 |
|---|---|---|
| 脚本路径规范 | 默认 `scripts/xxx.ts`；模板/跨技能用 `<skillPath>/scripts/xxx.ts`；无硬编码绝对路径（§5.2 / `eas-skill-creator` 脚本调用路径规范） | P0 |
| Pipeline Gate 完整 | 入口 / 出口 / 失败策略三要素齐全 | P1 |
| Reviewer 检查项分级 | `references/checklist.md` 按严重度分级（P0/P1/P2） | P1 |
| Inversion Gate 完整 | `behavior.gate.phases` ≤ 5 必答、每题 2-4 选项 | P1 |
| 失败处理可执行 | Reviewer / Pipeline / Inversion 三类必须包含失败兜底（不依赖 Agent 自决） | P0 |
| 上下文预算 | name+description ≤ 1024 字符；SKILL.md < 500 行；references 单文件 < 10k 字 | P2 |
| 项目级同步 | 新增 / 演化 / 废弃技能按 §6.1 / §6.2 / §6.3 同步 README / marketplace / `eas-skill-using` 索引 | P0 |
| 决策落档 | 跨技能决策已写入 `docs/decisions/00NN-*.md`（§11） | P0 |

### 14.6 严重度分级 (Severity Levels)

| 级别 | 含义 | 处理 |
|---|---|---|
| **P0** | 阻塞：违反 = 契约失败 / CI 失败 / 概念错乱 | **MUST** 修复，**禁止合入**；评审报告中明确列为 Blocker |
| **P1** | 重要：影响可读性 / 可维护性 / 一致性 | **MUST** 修复或显式豁免（评审报告中给出理由） |
| **P2** | 推荐：风格 / 美观 / 体量优化 | **SHOULD** 修复；可在后续 PR 中处理 |
| **P3** | 建议：锦上添花 | **MAY** 修复；评审报告可选列出 |

> **通过条件**：所有 P0 项为 0；P1 项 = 0 或每项附豁免理由；P2/P3 不阻塞合入。
> **冲突解决**：评审者与开发者对严重度有分歧时，**MUST** 在评审报告中给出依据，由项目维护者按 §13.3 指令强度词裁定。

### 14.7 评审产出物 (Review Deliverables)

每次评审 MUST 产出**一份评审报告**，落地到以下位置之一：

| 评审类型 | 落地位置 | 模板 |
|---|---|---|
| 技能评审（单技能内） | `<skill-name>/0001-review-{topic}.md` | `<skill-name>/0001-review-{topic}.md` 自由结构，但 MUST 含下方 5 节 |
| 跨技能评审 | `docs/decisions/00NN-review-{topic}.md` | 复用 `eas-planning-writer` 决策模板 |
| PR 评审 | PR 描述 / 评论 | 下方 Markdown 模板 |

#### 评审报告最小结构

```markdown
# 评审报告：{被评审对象}（{YYYY-MM-DD}）

### 评审对象
- 类型：技能 / 提示词 / 项目级 / 跨技能
- 范围：列出文件清单
- 评审者：<name or "Agent">

### 入口加载证据（§14.3.2 MUST）
- [ ] `eas-skill-using` 已加载（`Use Skill:` 调用记录 / 时间戳）
- [ ] `eas-skill-creator` 已加载
- [ ] `eas-prompt-creator` 已加载（仅提示词评审）
- [ ] `eas-planning-writer` 已加载（仅跨技能决策评审）
- [ ] §14.3.2 四条勾选已逐条确认
- 加载时间：{YYYY-MM-DD HH:MM}
- 加载方式：`skill` 工具按 `name` 调用（**禁止**直接 `Read` SKILL.md 路径）

### 五维度评分
| 维度 | P0 | P1 | P2 | P3 | 备注 |
|---|---|---|---|---|---|
| **入口加载** | 0 | 0 | 0 | 0 | §14.5 维度 1 第 1 项 |
| 结构 | 0 | 0 | 0 | 0 | |
| 内容 | 0 | 0 | 0 | 0 | |
| 语义 | 0 | 0 | 0 | 0 | |
| 规范 | 0 | 0 | 0 | 0 | |
| 落地 | 0 | 0 | 0 | 0 | |

### 发现项明细
| # | 维度 | 检查项 | 严重度 | 现状 | 建议修复 |
|---|---|---|---|---|---|

### 豁免项（如有）
| # | 检查项 | 严重度 | 豁免理由 |
|---|---|---|---|

### 结论
- [ ] 通过（所有 P0 = 0，P1 = 0 或全部豁免）
- [ ] 有条件通过（附豁免列表）
- [ ] 不通过（必须修复 P0/P1）
```

### 14.8 修复闭环 (Fix Closure)

| 评审结果 | 后续动作 |
|---|---|
| **通过** | 直接 commit（遵循 §7.1 / §10 / §13.7） |
| **有条件通过** | 在 commit 前补齐豁免列表；评审报告附在 PR 描述 |
| **不通过** | 修复 P0/P1 项 → 重新跑 `quick-validate` → 重新评审；**禁止**带 P0 合并 |

> **重新评审触发条件**：以下任一情况 MUST 重新评审：
> - 修复 commit 涉及 §14.5 任一 P0/P1 项；
> - 新增 scripts / references / assets；
> - 修改 frontmatter `description`（影响触发条件）；
> - 评审者对修复结果有疑问。

### 14.9 评审反模式 (Review Anti-Patterns)

| ❌ 不要 | ✅ 应该 |
|---|---|
| **跳过 §14.3.1 强制加载序列，直接开始评审** | MUST 按 §14.3.1 顺序加载 `eas-skill-using` → `eas-skill-creator`（必要时再加 `eas-prompt-creator` / `eas-planning-writer`）后再开始 |
| **倒序加载（先 `eas-skill-creator` 后 `eas-skill-using`）** | 严格按 §14.3.1 顺序；中央导航必须是第一步 |
| **只加载元数据（`name + description`）就视为已加载** | 必须把 SKILL.md 主体加载到上下文，并按 §14.3.2 第 3 条对照 §快速参考 |
| **加载后未对照技能约束做判据**（"加载了但没用来评判"） | 加载后 MUST 将该技能的核心约束**回填**到本评审的内部 checklist（§14.3.2 第 4 条） |
| 跳过 `eas-skill-using` 直接评审 | 先激活中央导航，确认对象在生态中的位置 |
| 只跑 `quick-validate` 就下结论 | `quick-validate` 是 §14.5 维度 4 中的一项；其余 4 维度仍 MUST 人工评审 |
| 评审者直接 `Read` SKILL.md 路径 | 通过 `Skill` 命名空间以 `name` 加载（§8.3） |
| 把评审发现写在对话里不落档 | 评审报告 MUST 落到 §14.7 指定路径 |
| P1 项无豁免理由直接放过 | P1 项必须 = 0 或附豁免理由，否则评审报告「不通过」 |
| 评审与 §10 自检混为一谈 | §10 = 自检（开发者本人）；§14 = 评审（多视角 + 报告 + 闭环） |
| 跨技能评审仅在 PR 评论里写 | 必须落档到 `docs/decisions/00NN-*.md`（§11） |
| 把"评审"等同于"找 bug" | 评审目标 §14.1 的 8 项缺一不可；"符合最佳实践 + 语义明确 + 步骤清晰"是评审，不是 bug 排查 |

### 14.10 与其他章节的关系 (Relationship with Other Sections)

| 章节 | 关系 |
|---|---|
| §4 SKILL.md 规约 | 评审维度 1/4 的规则来源 |
| §5 可用命令 | 评审维度 5 中脚本路径规范的依据 |
| §6 生命周期 | 评审范围 §14.2 的分类依据 |
| §7 提交与变更约定 | 评审产出物 §14.7 的 commit 前置条件 |
| §8 协作流程 | 评审入口 §14.3 必须遵循的加载规范 |
| §10 验证清单 | §10 = 自检（开发者本人，提交前快查）；§14 = 评审（多视角，提交前/合入前必走） |
| §11 决策文档 | 跨技能评审产出物 §14.7 的落档路径 |
| §12 编码与格式基线 | 评审维度 4 的规则来源 |
| §13 提示词规范 | 评审维度 3/4 的规则来源 |

> **一句话定位**：**§10 保证「能提交」，§14 保证「值得合入」。** 两者串联才能确保仓库质量。
