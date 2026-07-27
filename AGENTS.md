# AGENTS.md

> 本文件为 Agent / AI 助手在此仓库工作时提供协作约定。
> 本仓库是 **EASBot agent-skills 管理项目**：核心是 skills 资源库，**不持有应用代码**。
> 核心产物是 `skills/**/SKILL.md` 及其附属的 `scripts/`、`references/`、`assets/`。
> 根 `scripts/` 目录仅放**项目级维护脚本**（version bump、changelog、docs 同步等），与各技能内部的 `scripts/` 同根同源。
> `package.json` 仅作为元信息包存在（依赖 `@easbot/agent`，声明 `files`），不提供 `build`/`lint`/`test` scripts。

## 1. 项目身份

- **类型**：agent-skills 管理项目（无应用代码、无单元测试套件；保留根级维护脚本）。
- **职责**：聚合 EASBot 内置（`builtin/`）和工具（`tools/`）类技能，供各类 Agent 加载、组合与复用。
- **许可**：MIT（见 [LICENSE](./LICENSE)）。
- **说明文档**：[README.md](./README.md) / [README.en.md](./README.en.md)。
- **元包名**：`@easbot/agent-skills`（仅声明依赖与 `files`，无运行时入口）。
- **两类 scripts 区分**：
  - **根 `scripts/`** —— 项目维护脚本（changelog / version bump / docs 同步 / docs 结构校验），由仓库维护者本地或 CI 调用。
  - **`skills/<category>/<name>/scripts/`** —— 技能包内部脚本，由加载该技能的 Agent 调用。
  两者都遵循 §12 的代码规范，只是归属层级不同。

## 2. 不存在的常规命令（请勿猜测）

这是一个 skills 资源库，不是软件工程意义上的代码仓库。**以下命令通常不适用**：

- `pnpm build` / `npm run build` / `cargo build` —— 没有构建产物。
- `pnpm lint` / `eslint` / `prettier` —— 仓库未配置代码风格工具。
- `pnpm test` / `vitest` / `jest` —— 没有单元测试套件。

如需"校验技能"，使用技能自带的脚本（见 §5），而非通用 lint/test。

## 3. 目录结构与改动边界

```
agent-skills/
├── README.md / README.en.md / LICENSE
├── AGENTS.md               # 本文件
├── package.json            # 元信息包（依赖 @easbot/agent、声明 files）
├── scripts/                # 项目级维护脚本（见 §5.1）
├── .github/                # CI / Issue 模板
└── skills/
    ├── builtin/         # 内置核心技能（不要新增非 builtin 类别）
    │   ├── eas-agent-creation/
    │   ├── eas-agent-evolution/
    │   ├── eas-planning-writer/
    │   ├── eas-prompt-creator/
    │   ├── eas-skill-creator/
    │   ├── eas-skill-find/
    │   └── eas-skill-using/
    └── tools/           # 通用工具类技能
        └── eas-chinese-writer/
```

每个技能的标准目录模板：

```
<skill-name>/
├── SKILL.md            # 入口（frontmatter + 正文，强制）
├── scripts/            # 可选，提供 TS 脚本（npx tsx 调用）
├── references/         # 可选，技能加载时按需 Read
└── assets/             # 可选，模板 / 资源
```

**改动边界规则**：

- 改一个技能时，**只动该技能目录**与 `skills/<category>/` 下的同级文件。
- 不要把技能文件散落到仓库根目录。
- 不要在 `README.md` 中新增"分类"以外的目录结构。
- 新增技能前，确认其类别属于 `builtin` 还是 `tools`，不要自创分类。

## 4. SKILL.md 规约（最高优先级）

`SKILL.md` 是技能的入口文件，所有技能必须遵守：

1. **首段必须是 YAML frontmatter**（`---` 包围），至少包含：
   - `name`：与目录名一致；`hyphen-case`，正则 `[a-z0-9-]+`，**≤ 64 字符**；推荐以 `eas-` 前缀。
   - `description`：以第三人称"该技能应在…"开头，**≤ 1024 字符**（推荐 ≤ 500），覆盖触发 / 不触发场景。
   - 可选：`category`、`version`、`tags`、`mode`、`composition`、`allowed-tools` 等白名单键。其它键会被 `quick-validate.ts` 拒收。
2. **禁止的附带文档**：技能目录中**禁止**出现 `README.md`、`INSTALLATION_GUIDE.md`、`QUICK_REFERENCE.md` 等独立文档名；说明全部内联在 `SKILL.md` + `references/`。
3. **正文必须有"何时使用 / When to Use"**：明确触发场景与反场景。
4. **正文必须有"快速参考 / Quick Reference"**：列出能力要点而非全量内容。
5. **详细说明拆到 `references/`**，避免 `SKILL.md` 过长。
6. **引用路径**用相对路径（`./references/xxx.md`、`./scripts/yyy.ts`）。
7. 不要把"如何加载本技能"放在首屏（只在文末说明一次即可）。

参考样例：`skills/builtin/eas-skill-using/SKILL.md`。

## 5. 可用命令（脚本）

所有脚本通过 `npx tsx` 在仓库根目录调用。`package.json` **仅作为元信息包**（依赖 `@easbot/agent`、声明 `files`），不提供 `build`/`lint`/`test` scripts；脚本运行所需依赖按需临时安装。

### 5.1 项目维护脚本（根 `scripts/`）

供仓库维护者本地或 CI 调用的工程级脚本，与技能内部脚本同源但**作用域不同**。

| 用途 | 命令 | 依赖 |
| --- | --- | --- |
| 为 docs/*.md 补 frontmatter | `npx tsx scripts/docs_add_frontmatter.ts` | `js-yaml`（按需 `npm i --no-save`） |
| 同步 docs 目录（生成 README 索引、修正 name/category） | `npx tsx scripts/docs_sync_automation.ts [--validate]` | `js-yaml`（按需） |
| 根据 git commits 生成 CHANGELOG | `npx tsx scripts/generate-changelog.ts [version]` | 零依赖 |
| 手动升级版本号（含子项目）与 tag | `npx tsx scripts/bump-version.ts <major\|minor\|patch>` | 零依赖 |
| pre-commit 用的版本升级（默认禁用，需 `ENABLE_VERSION_BUMP=1`） | `npx tsx scripts/pre-commit-version.ts` | 零依赖 |
| 生成 `.claude-plugin/marketplace.json` | `npx tsx scripts/generate-plugin.ts [output-dir]`（默认 `.claude-plugin`） | 零依赖 |

> 根 `scripts/` 下的脚本可在 `package.json` 的 `scripts` 字段中以 `npm run` 别名形式暴露（如 `npm run plugin:generate`），便于 CI / 一键调用；同时也支持 `npx tsx scripts/<name>.ts` 直接调用。其依赖按需 `npm install --no-save <pkg>` 后再跑。
> 校验技能结构请用 `skills/builtin/eas-skill-creator/scripts/quick-validate.ts`（见 §5.2），不要用根 `scripts/` 下任何同名/同义脚本。

### 5.2 技能包内部脚本

| 用途 | 命令 | 依赖 |
| --- | --- | --- |
| 校验单个技能结构 | `npx tsx skills/builtin/eas-skill-creator/scripts/quick-validate.ts <skill-dir>` | `js-yaml` |
| 初始化空技能骨架 | `npx tsx skills/builtin/eas-skill-creator/scripts/init-skill.ts <name> --path <dest> [--resources scripts,references,assets] [--examples]` | 零依赖 |
| 打包为 `.skill`（ZIP） | `npx tsx skills/builtin/eas-skill-creator/scripts/package-skill.ts <skill-dir> [output-dir]` | `js-yaml` + `jszip` |
| 初始化 Agent 配置 | `npx tsx skills/builtin/eas-agent-evolution/scripts/init-agent.ts --workspace <path> [--output <dir>] [--non-interactive] --agent-name <name> --user-name <name> ...` | 零依赖 |
| 备份 Agent 配置 | `npx tsx skills/builtin/eas-agent-evolution/scripts/backup-config.ts [--config-path <path>]` | 零依赖 |
| 校验 Agent 配置 | `npx tsx skills/builtin/eas-agent-evolution/scripts/validate-config.ts [--config-path <path>]` | 零依赖 |
| 增量更新 Agent 配置 | `npx tsx skills/builtin/eas-agent-evolution/scripts/update-agent.ts ...` | 零依赖 |
| 注册定时备份任务 | `npx tsx skills/builtin/eas-agent-evolution/scripts/register-backup-task.ts <register\|list\|delete\|help> [--cron <expr>] [--config-path <path>]` | 由 `@easbot/agent` 提供（见下文说明） |
| 初始化规划三件套 | `npx tsx skills/builtin/eas-planning-writer/scripts/init-planning-session.ts [--output <dir>]` | 零依赖 |
| 检查规划完成度 | `npx tsx skills/builtin/eas-planning-writer/scripts/check-complete.ts` | 零依赖 |

> **`register-backup-task.ts` 的特殊性**：本脚本依赖 `@easbot/agent` 的 `Scheduler` API。它是仓库内**唯一**允许 import `@easbot/agent` 的 scripts 文件；其他脚本仍须遵循 §12 的"零外部依赖"原则。该脚本通过 `package.json` 的 `dependencies."@easbot/agent"` 引用，调用前先 `npm install` 即可。

全仓"事实上的 test suite"（循环校验全部 8 个技能）：

```bash
for s in skills/builtin/*/ skills/tools/*/; do
  [ -f "$s/SKILL.md" ] && npx tsx skills/builtin/eas-skill-creator/scripts/quick-validate.ts "$s"
done
```

> 这些脚本**不是**构建步骤，而是仓库 / 技能级别的辅助工具。脚本改动需谨慎，与技能内容改动分开提交。

## 6. 创建 / 演化 / 废弃技能 (Skill Lifecycle)

技能的"内部怎么做"由 [`eas-skill-creator/SKILL.md`](./skills/builtin/eas-skill-creator/SKILL.md) 完整定义（含 7 步创建流程、五大模式、frontmatter / Markdown 主体规范、bundled resources 原则）。本节只约定 **Agent 工作流边界** 与 **创建后必须同步更新的项目级文档清单**。

### 6.1 创建新技能（Create）

**第一步：必须先加载这两个技能**（顺序固定）

1. [`eas-skill-using/SKILL.md`](./skills/builtin/eas-skill-using/SKILL.md) —— 确认分类（`builtin` / `tools`）、检查是否已有可复用技能、能力索引要随之更新
2. [`eas-skill-creator/SKILL.md`](./skills/builtin/eas-skill-creator/SKILL.md) —— 按其"实现 (Implementation) §步骤 1~7"完整执行创建流程（含需求收集、模式选择、`init-skill.ts` 初始化、内容填充、`quick-validate.ts` 校验）

**第二步：创建完成后，必须同步更新以下项目级文件**（不只是技能目录内）

| # | 文件 | 必改内容 |
| --- | --- | --- |
| 1 | `AGENTS.md` §3 目录结构 | 在 `skills/builtin/` 或 `skills/tools/` 树里追加新技能目录 |
| 2 | `README.md` + `README.en.md` | "目录结构"块新增一行；"内置技能一览（builtin）"或"工具类技能（tools）"表新增一行 |
| 3 | `.claude-plugin/marketplace.json` | `plugins[]` 数组新增一个对象（`name` / `description` / `source` / `category` / `author`） |
| 4 | `skills/builtin/eas-skill-using/SKILL.md` | "当前 builtin 技能能力索引"节新增条目；"决策辅助"流程图加新分支；"场景映射"表补新场景；必要时 bump `version` |
| 5 | `package.json`（**仅元信息**） | 仅当新技能引入新的第三方依赖（如新增 `jszip`）时调整 `devDependencies` —— 用户明确要求"不动 `package.json`"时跳过此项 |

> `CHANGELOG.md` 由 `scripts/generate-changelog.ts` 在发布时自动生成，**不要手动编辑**。

**第三步：自检** —— 跑 §10 验证清单 + §5.2 全量校验脚本。

### 6.2 演化现有技能（Evolve）

- 触发：技能失败率高、描述不清晰、模式升级、内容重构
- 流程：加载 [`eas-skill-creator/SKILL.md`](./skills/builtin/eas-skill-creator/SKILL.md) → 走其"实现"节对应步骤 → 在该技能目录内完成
- **项目级同步**：
  - 若 frontmatter `description` 改了 → 同步 `skills/builtin/eas-skill-using/SKILL.md` 能力索引条目 + `README.md` / `README.en.md` 表格描述
  - 若新增了 `scripts/*.ts` → AGENTS.md §5.2 表格追加一行；新脚本若新增外部依赖，AGENTS.md §12 末尾追加说明

### 6.3 废弃技能（Deprecate）

- 流程：frontmatter `description` 开头加"**【已废弃】**"前缀（保留目录 1 个 minor 版本周期，期间修复迁移问题）→ 下次 minor 时彻底删除目录
- **项目级同步**（与 §6.1 创建反向）：
  - `AGENTS.md` §3 目录结构删除该技能
  - `README.md` / `README.en.md` 表格删除该技能行
  - `.claude-plugin/marketplace.json` 删除该 plugin 条目
  - `skills/builtin/eas-skill-using/SKILL.md` 能力索引 + 决策辅助 + 场景映射 一并删除该技能条目

## 7. 提交与变更约定 (Commit Conventions)

- **Atomic 提交**：一个 commit 只对应"一个技能的一次逻辑变更"。不要把多个技能的改动混在同一次提交。
- **Commit 标题**：`[skill: <name>] <动词> <摘要>`，例如 `[skill: eas-skill-creator] docs: clarify naming convention`。
- **基础设施类 commit**：`§6` 列出的项目级元信息变更（README / AGENTS / `eas-skill-using` 索引 / marketplace.json）单独提交，标题 `[meta] <动词> <摘要>`。
- **影响范围**：改动 `SKILL.md`、`references/*.md`、`scripts/*.ts`、`assets/*` 任一项都属于该技能的变更。

## 8. 协作流程（Agent 工作流）

1. 进入仓库后，先 `Read` `README.md` 与本 `AGENTS.md`。
2. 不确定改哪个技能时，加载 `skills/builtin/eas-skill-using/SKILL.md` 作为中央导航。
3. **不要**手动 `Read` `<skill>/SKILL.md` 路径，优先使用 `Skill` 命名空间（详见 `eas-skill-using/SKILL.md §如何加载本技能`）。这条对运行时代码生效，对仓库内编辑任务仅作"参考"的实现提醒。
4. 修改前用 §5.2 `quick-validate.ts` 对目标技能做一次结构校验（修改后可再次复跑）。
5. 完成后给出"修改清单 + 是否通过校验 + 风险点"。

## 9. 易错点与反模式

- ❌ 在 `SKILL.md` 中堆全量内容 → ✅ 详情下沉 `references/`，主入口保持精简。
- ❌ 用 `"新建/AI/通用"`等含糊分类名 → ✅ 复用 `builtin` / `tools` 两类。
- ❌ `SKILL.md` 缺少 "When to Use" / "Quick Reference" 两段 → ✅ 任意一缺即视为不规范。
- ❌ 把技能内部的脚本、模板、prompt 散落到仓库根目录 → ✅ 收纳进对应技能的 `scripts/`、`assets/`。根 `scripts/` 仅放项目级维护脚本（见 §5.1）。
- ❌ 把其它仓库的源码、依赖、`package.json` 拉进本仓库 → ✅ 本仓库不持有应用代码。
- ❌ 推测存在 `pnpm test` / build / lint 命令 → ✅ 确认不存在，直接说明。

## 10. 验证清单（提交前自检）

- [ ] 改动文件全部位于 `skills/<category>/<name>/` 内。
- [ ] `SKILL.md` frontmatter 完整，含 `name`（hyphen-case、≤64）/ `description`（第三人称、≤1024）。
- [ ] `SKILL.md` 包含"何时使用"与"快速参考"两节。
- [ ] 技能目录下没有 `README.md` / `INSTALLATION_GUIDE.md` / `QUICK_REFERENCE.md` 这类附加文档。
- [ ] `references/` / `scripts/` / `assets/` 的相对路径正确，且 `references/` 链接用标准 Markdown 相对链接（**禁止 `@` 链接**）。
- [ ] 至少用 `quick-validate.ts` 对修改/新增的技能跑过一次结构校验。
- [ ] 所有 scripts/*.ts（根 `scripts/` 与 `skills/<category>/<name>/scripts/`）中除 `js-yaml` / `jszip` / `@easbot/agent`（仅 `register-backup-task.ts`）外不出现其他第三方 import。
- [ ] 提交标题遵循 `[skill: <name>] ...` 形式。
- [ ] 跨技能的设计决策按 §11 落档。

## 11. 决策文档与规划持久化

- **单技能决策** → `<skill-name>/0001-<topic>.md`（数字递增），与该技能同生命周期。
- **跨技能决策** → `docs/decisions/00NN-<topic>.md`（`docs/` 不存在则新建），由相关技能共同引用。
- **长任务 / 多步骤实施规划** → 写入 `<cwd>/.easbot/knowledge/tasks/<task-name>/`（此目录被 `.gitignore` 忽略，本地工作区落档，**不**入仓）。
- **初始化协议模板**：`skills/builtin/eas-agent-evolution/assets/BOOTSTRAP.md` 是 Agent 自初始化的协议来源，**勿**手动编辑该文件。

## 12. 编码与格式基线

来源：根目录 `.editorconfig`、`.gitattributes`、skill 规范。

- **行尾**：LF（强制，`*.md` 同样遵守，行尾空白除外）。
- **缩进**：2 空格；`.md` 关闭 `trim_trailing_whitespace`；`.md` 强制 `insert_final_newline = true`。
- **代码注释**：中文；`console.log` 等**用户可见输出**保持英文。
- **文档语言**：正文中文，技术术语（Agent / Skill / Script / Pipeline / Reviewer / Generator / Inversion / MCP 等）保持英文。
- **标题**：双语形式，例如 `## 概述 (Overview)`。
- **二进制白名单**（`.gitattributes`）：`*.jpg / *.png / *.gif / *.pdf / *.docx / 字体文件` 显式标记为 binary。
- **scripts/**：TypeScript only，Shebang 必须是 `#!/usr/bin/env tsx`；**优先** Node 内置模块。允许的外部依赖：
  - `js-yaml` —— 仅 `quick-validate.ts` / `package-skill.ts` 需要；
  - `jszip` —— 仅 `package-skill.ts` 需要；
  - `@easbot/agent` —— 仅 `eas-agent-evolution/scripts/register-backup-task.ts` 允许（通过根 `package.json.dependencies` 解析）。
  其它需求落地到调用方环境，不入仓。
