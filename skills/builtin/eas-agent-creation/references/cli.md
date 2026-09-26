# CLI 使用手册 (CLI Usage Guide)

> 本文档承接 [SKILL.md §实现](../SKILL.md) 中 CLI 调用细节。SKILL.md 仅保留高层入口,详细 flag / 步骤 / 输出契约在本文件展开。
>
> **路径约定**：本文档所有 `npx tsx <skillPath>/scripts/src/cli.ts ...` 命令的脚本路径用 `<skillPath>` 占位符指向 `eas-agent-creation` 技能目录(本 monorepo = `skills/builtin/eas-agent-creation/`,全局 = `~/.local/share/easbot/skills/eas-agent-creation/`)。跨环境调用时可用 `--cwd <dir>` 覆盖;前置安装步骤需 `cd` 到 npm 包物理位置。**禁止硬编码** `skills/builtin/eas-agent-creation/scripts/...` 绝对路径(违反 [eas-skill-creator §脚本调用路径规范](file:///c:/Users/houjian/.trae/skills/eas-skill-creator))。
>
> 实际入口:[`src/cli.ts`](../scripts/src/cli.ts)。`tsup` 打包入口由 [`tsup.config.ts`](../scripts/tsup.config.ts) 的 `entry: ['src/cli.ts']` 决定,产物 `scripts/dist/cli.{mjs,cjs}` 通过 [`package.json#bin.eas-agent-creation`](../scripts/package.json) 暴露。核心 schema 在 [`src/tool.ts`](../scripts/src/tool.ts),LLM 评审在 [`src/llm.ts`](../scripts/src/llm.ts)。

## 前置安装 (Prerequisites)

> 本技能直接落在 `skills/builtin/eas-agent-creation/`,**没有** pnpm workspace 根(仓库根无 `package.json` / `pnpm-workspace.yaml`)。`scripts/` 子目录本身是一个独立的 npm 包,有独立的 [`package.json`](../scripts/package.json) 与依赖清单,调用 `src/cli.ts` 前**必须**先在 `scripts/` 下安装依赖。

```bash
# 1. 进入技能脚本目录(物理路径,本 monorepo 内是 skills/builtin/eas-agent-creation/scripts)
cd <skillPath>/scripts

# 2. 安装运行时 + 开发依赖(@easbot/llm / @easbot/plugin / @easbot/utils / tsx / tsup / ai / zod ...)
pnpm install
# 若 lockfile 与本机 pnpm 版本不一致,可加 --no-frozen-lockfile
# pnpm install --no-frozen-lockfile

# 3. 验证安装(应能看到 scripts/node_modules)
ls node_modules/@easbot
# 期望输出至少包含: llm  plugin  utils
```

安装一次即可,之后在 `scripts/` 目录反复调用 `npx tsx src/cli.ts ...` 不需要重装。

> 产物路径 `scripts/dist/cli.{mjs,cjs}` 已经在本仓库提交;若不想改源码、只想跑 CLI,直接用产物也行:
>
> ```bash
> node <skillPath>/scripts/dist/cli.mjs --help
> ```

## 概述 (Overview)

`eas-agent-creation` 自带 standalone CLI(`src/cli.ts`),通过 `npx tsx` 直接调用,**不依赖宿主 Agent 的 `creation` 工具**。Agent 可在任意仓库根目录运行该 CLI 完成 6 类操作:

- `create` — 根据需求生成 skill
- `evolve` — 跑演化引擎(试运行 / 正式执行)
- `assess` — 自检 skill 能力与弱点
- `list` — 列出已注册 skill
- `apply-plan` — 应用已生成的演化计划(需人工审批)
- `review` — LLM 评审 skill(基于 `.easbot/easbot.json` 顶层 `language_model`)

CLI 同时支持三种调用风格:

| 风格                        | 示例                                         | 备注                                                         |
| --------------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| `--args '<json>'`           | `--args '{"operation":"create",...}'`        | 与 LLM `tool_call` 等价;PowerShell 下用 here-string 或文件传 |
| `<op> --key value ...`      | `create --requirement "..." --hints "a,b,c"` | 友好 CLI 风格;op 作为第一个非 flag token                     |
| `--op <op> --key value ...` | `--op create --requirement "..."`            | 显式 op 标志(便于脚本化)                                     |

> 风格互斥:`--args` 与散 flag 不混用;`--op <op>` 与首个非 flag token 也互斥。

## CLI 入口 (CLI Entry)

```bash
# 在仓库根(或 --cwd 指向的工作区)运行
npx tsx <skillPath>/scripts/src/cli.ts <command> [flags]
```

> 提示:依赖未装会触发 `ERR_MODULE_NOT_FOUND: Cannot find package '@easbot/utils'` 等错误,回到"前置安装"小节排查。

## 全局选项 (Global Options)

| 选项               | 说明                                                           |
| ------------------ | -------------------------------------------------------------- |
| `--cwd <dir>`      | 工作目录(默认 `process.cwd()`);传给 `Instance.init(cwd)`       |
| `--log-level <L>`  | `DEBUG` / `INFO` / `WARN` / `ERROR`(默认 `INFO`)               |
| `--print-logs`     | 把日志打印到 stderr                                            |
| `--debug`          | 等价于 `--log-level DEBUG`(同时开启 `Log.init({ dev: true })`) |
| `--help` / `-h`    | 输出 usage(在 Log.init 之前拦截,快路径)                        |
| `--version` / `-v` | 输出 `package.json` 版本号(从仓库根 `package.json` 读取)       |

## 6 个操作 (Six Operations)

| Operation    | 用途                                                             | 关键参数                                                                                                                     |
| ------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `create`     | 根据需求生成新 skill                                             | `--requirement <text>`(≥10 字符)、`--hints <csv>`、`--scope project\|global`(默认 `project`)                                 |
| `evolve`     | 跑演化引擎(试运行 / 正式执行)                                    | `--dryRun`(boolean flag;不接 value)                                                                                          |
| `assess`     | 自检 skill 能力与弱点;若 LLM 已注入则顺带调 `Llm.reviewSkill`    | `--windowDays <1-90>`(默认 `assess` 实现决定)                                                                                |
| `list`       | 列出已注册 skill                                                 | `--mode <tool-wrapper\|generator\|reviewer\|inversion\|pipeline>`、`--limit <n>`、`--offset <n>`                             |
| `apply-plan` | 应用已生成的演化计划(需人工审批)                                 | `--planId <id>`、`--approvedBy <id>`                                                                                         |
| `review`     | LLM 评审 skill(基于 `.easbot/easbot.json` 顶层 `language_model`) | `--skillName <name>`(必填)、`--temperature <0-2>`、`--topP <0-1>`、`--topK <n>`、`--maxOutputTokens <n>`、`--variant <name>` |

> flag 转换规则由 [`src/cli.ts runOp()`](../scripts/src/cli.ts) 根据 `toolDefinition.args` 的 zod schema 自动驱动:
>
> - `ZodBoolean` 字段:flag 出现即 `true`(无需接 value)
> - `ZodArray` 字段:`--hints "a,b,c"` → `['a','b','c']`(CSV split + trim + 去空)
> - 其他字段(`z.coerce.number()` 等):接下一个 token;若下一个 token 缺失或以 `--` 开头,记 `true`(避免 silent drop)

## 创建 Skill 的步骤 (Creation Steps)

### 步骤 1:分析需求 (Analyze Requirements)

理解用户需求的本质,判断需要的模式组合(参见 [SKILL.md §模式选择决策树](../SKILL.md))。5 种模式枚举:`tool-wrapper` / `generator` / `reviewer` / `inversion` / `pipeline`(对应 `SkillModes` 常量)。

### 步骤 2:调用 CLI create (Invoke CLI create)

```bash
npx tsx <skillPath>/scripts/src/cli.ts create \
  --requirement "创建一个帮助审查代码命名的技能" \
  --hints "包含命名规范清单,支持中英文命名" \
  --scope project
```

工具将返回生成结果,包含:

- `name`: skill 名称
- `description`: 描述
- `mode` / `composition`: 模式与组合
- `body`: SKILL.md body 渲染结果
- `path`: 实际落盘路径(由 `Creator.register` 决定,与磁盘一致)
- `scope`: 实际使用的 scope

### 步骤 3:使用 eas-skill-creator 完善 (Refine via eas-skill-creator)

**关键**:CLI `create` 只生成骨架,必须使用 `eas-skill-creator` 完善:

1. **完善示例**:添加正向 / 反向使用示例
2. **补全文档**:填充 `references/` 目录的详细内容
3. **优化模板**:补充具体参数和配置
4. **验证结构**:`npx tsx skills/builtin/eas-skill-creator/scripts/quick-validate.ts <skill-path>`

### 步骤 4:测试使用 (Test in Real Tasks)

在实际任务中验证 skill 效果。

## 演化 Skill 的步骤 (Evolution Steps)

### 步骤 1:获取评估 (Run Self Assessment)

```bash
npx tsx <skillPath>/scripts/src/cli.ts assess --windowDays 7
```

返回 `SelfAssessment`(含 `capabilities[]` / `weaknesses[]` / `opportunities[]`)。若 LLM 已注入(`bootstrapLlm` 成功),CLI 会顺带对每个 capability 调 `Llm.reviewSkill`,结果挂在 `llmReviews` 字段。

### 步骤 2:分析弱点 (Analyze Weaknesses)

查看返回的 `weaknesses` 和 `opportunities` 列表。

### 步骤 3:使用 eas-skill-creator 优化 (Optimize via eas-skill-creator)

根据弱点分析结果,使用 `eas-skill-creator` 完善 skill 内容:

- 针对识别的问题补充示例
- 修复已知坑
- 优化验证规则

### 步骤 4:运行进化 (Run Evolution)

```bash
# 试运行:生成计划不应用
npx tsx <skillPath>/scripts/src/cli.ts evolve --dryRun

# 正式运行:生成并执行计划
npx tsx <skillPath>/scripts/src/cli.ts evolve
```

### 步骤 5:应用计划(如需审批) (Apply Plan)

如果计划需要人工审批:

```bash
npx tsx <skillPath>/scripts/src/cli.ts apply-plan \
  --planId "<plan-id>" \
  --approvedBy "user@example.com"
```

## 评审 Skill 的步骤 (Review Steps)

CLI `review` 操作调用 `.easbot/easbot.json` 顶层配置的 `language_model`(通过 `@easbot/llm` `bootstrapLlm`),由 LLM 按统一 JSON Schema 评分并返回改进建议。

```bash
npx tsx <skillPath>/scripts/src/cli.ts review \
  --skillName <name> \
  --temperature 0.3 \
  --topP 0.95 \
  --topK 40 \
  --maxOutputTokens 32000 \
  --variant reviewer
```

### 评审维度 (Review Criteria)

| 维度                  | 含义                              |
| --------------------- | --------------------------------- |
| `description-clarity` | description 与 when-to-use 清晰度 |
| `output-schema`       | schema / 输出格式完整性           |
| `validation-rules`    | validation rules 完备性           |
| `examples`            | examples 覆盖度(good/bad)         |
| `portability`         | 可移植性(platforms / tools)       |

> 详细 rubric(0-3 broken / 4-6 adequate / 7-8 strong / 9-10 excellent)与 system prompt 见 [`src/llm.ts REVIEW_SYSTEM_PROMPT`](../scripts/src/llm.ts)。

### 输出契约 (Output Contract)

`review` 操作返回 `SkillReview` 对象,字段如下:

| 字段          | 类型                              | 说明                                                             |
| ------------- | --------------------------------- | ---------------------------------------------------------------- |
| `skillName`   | `string`                          | 技能名                                                           |
| `score`       | `number` (0-10)                   | 综合评分(rounded average of 5 criteria)                          |
| `passed`      | `boolean`                         | `score >= 7` 通过                                                |
| `criteria`    | `Array<{ name, score, comment }>` | 评审要点(数组;`name` 严格匹配上述 5 个枚举)                      |
| `suggestions` | `string[]`                        | 改进建议(3-7 条,按 impact 排序,每条必须点名 section / criterion) |
| `variant?`    | `string`                          | 使用的变体名(如果传入)                                           |
| `rawOutput?`  | `string`                          | LLM 原始 JSON 输出(便于排查 parse 失败)                          |

### ProviderOptions 自动推导 (ProviderOptions Auto-Derivation)

provider-specific 选项(如 `anthropic.beta`、`openai.reasoning_effort` 等)由 `ProviderTransform.providerOptions(model, {})` 从 `language_model` 元数据**自动推导**。调用方**无需**也不应在 CLI 透传 `providerOptions`。

内部实现路径(见 [`src/llm.ts`](../scripts/src/llm.ts)):

1. `model` 是 AI SDK `LanguageModelV3` 实例,`model.provider` / `model.modelId` 由 `@easbot/llm` bootstrap 写入
2. `Provider.getModel(model.provider, model.modelId)` 拿到完整 `Provider.Model` 元数据
3. `ProviderTransform.providerOptions(providerModel, {})` 推导 provider-specific 选项

### SKILL.md 读取路径

`review` 操作读取 SKILL.md 的位置(由 `defaultDirectoryForScope('project')` + `ctx.directory` 推导):

| 模式       | 读取路径                                                |
| ---------- | ------------------------------------------------------- |
| CLI 默认   | `{process.cwd()}/.easbot/skills/{skillName}/SKILL.md`   |
| Host 调用  | `{ctx.directory}/.easbot/skills/{skillName}/SKILL.md`   |
| 文件不存在 | 返回 `{ error: 'SKILL.md not found', skillPath, hint }` |

## 落盘路径 (Storage Paths)

| `scope`   | 落盘位置                                                           |
| --------- | ------------------------------------------------------------------ |
| `project` | `{cwd}/.easbot/skills/{name}/SKILL.md`(默认)                       |
| `global`  | `~/.config/easbot/skills/{name}/SKILL.md`(遵循 XDG Base Directory) |

## 实现约束 (Implementation Constraints)

- **CLI 初始化顺序**(对标 `@easbot/memory`):
  1. `loadEnv()` —— 动态 import 避免 `xdg-basedir` 提前缓存
  2. 设置 `EASBOT_LANG` 默认值(默认 `en-US`)
  3. `Global.init()` —— 创建 `~/.easbot` 全局目录(XDG 兼容),必须在 `Log.init` 前
  4. 拦截 `--help` / `--version`(在 `Log.init` 之前,快路径)
  5. `Log.init({ logDir, print, dev, level })` —— 接住 `--log-level` / `--print-logs` / `--debug`(此时 `Global.Path.log` 已就绪)
  6. `Instance.init(cwd)` —— 注入路径(依赖 `Global.init` 完成)
  7. `bootstrapLanguageLlm(cwd)` —— 从 `.easbot/easbot.json` 读 `language_model`,通过 `@easbot/llm` 注入到 `Llm` 命名空间
  8. `runOp(remaining)` —— 走 `toolArgsSchema` 校验 + `toolDefinition.execute`
  9. `finally` 兜底:`Instance.dispose()` + `Log.close()`

- **toolArgsSchema 单一来源**:新增 op / 新增字段时**只改** [`src/tool.ts`](../scripts/src/tool.ts) 的 `creationParameters` + `operationSchema`;`cli.ts` 的 `runOp()` 通过 schema 反射自动支持,无需改 `cli.ts`。

- **bootstrapLlm 失败不阻塞 CLI**:`bootstrapLanguageLlm` 失败时 `console.warn` 降级到 mock;`review` 操作会显式报 `languageLlm not configured`,但不影响 `create` / `evolve` / `assess` / `list` / `apply-plan`。

- **运行时产物路径**:CLI 默认落盘到 `{cwd}/.easbot/skills/{name}/SKILL.md`(scope='project');scope='global' 时落到 `~/.config/easbot/skills/{name}/SKILL.md`(与 EASBot skill 平铺加载逻辑一致,无 `create/` 中间层)。`runOperation case 'create'` 的返回 `path` 直接来自 `Creation.create → Creator.register`,与磁盘一致。

- **ToolDefinition 双形态**:同一个 `tool.ts` 同时支持
  - 独立 CLI(`tsx src/cli.ts <op>`)
  - ToolDefinition 注入(`import { toolDefinition } from '.../tool'; llm.bindTools([toolDefinition])`)

  两者走完全相同的 `runOperation(validated, ctx)`,只是 `ctx` 的来源不同(CLI 内部 mock vs Host 提供)。

## 故障排查 (Troubleshooting)

| 症状                                                                     | 可能原因 / 解决                                                                                                                                                  |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `languageLlm model is not configured`                                    | `.easbot/easbot.json` 顶层未配 `model` / `language_model`;补字段后重跑                                                                                           |
| `--args is not valid JSON`                                               | PowerShell 引号吃 JSON;改用 `--key value` 散 flag 风格,或用 here-string / 文件传 `args.json`                                                                     |
| `expected number, received string`                                       | CLI 默认按 `z.coerce.number()` 转换;如类型不符,检查 `toolDefinition.args[key]` 是不是用 `z.number()` 而非 coerce                                                 |
| `expected array, received string`(如 `--hints`)                          | `ZodArray` 字段传入 CSV(`--hints "a,b,c"`);`cli.ts runOp()` 内已自动 split                                                                                       |
| `expected enum, received string`(如 `--mode`)                            | `list --mode` 的合法值是 5 种 `SkillModes`(`tool-wrapper` / `generator` / `reviewer` / `inversion` / `pipeline`),**不是** `always` / `contextual`                |
| `review` 返回 `passed: false, score: 0` + rawOutput 是 JSON              | LLM 输出非 JSON 时降级;检查 `.easbot/easbot.json` 的 `language_model` 是否支持结构化输出                                                                         |
| `SKILL.md not found`                                                     | `review` / `assess` 找不到 SKILL.md;确认 `--cwd` 指向的工作区根下有 `.easbot/skills/{skillName}/SKILL.md`,或用 `--scope global` 创建到 `~/.config/easbot/skills` |
| `Error: operation is required (use --op <op> or pass <op> as first arg)` | CLI argv 第一个非 flag token 缺失;补 `<op>` 或 `--op <op>`                                                                                                       |
| `Error: toolDefinition.execute is not implemented`                       | `toolDefinition.execute` 在构建时未被打入;检查 `tsup` entry 配置与 `tool.ts` 导出                                                                                |

## 版本与发布 (Versioning & Publishing)

- 版本号从仓库根 `package.json` 读取(`cli.ts getVersion()` 走 `__dirname/../../../../package.json` 候选路径)
- 发布脚本:[`scripts/publish.ps1`](../scripts/scripts/publish.ps1)(Windows)/ [`scripts/publish.sh`](../scripts/scripts/publish.sh)(Unix)
- 构建产物:`tsup --env.NODE_ENV production` → `dist/cli.{mjs,cjs}` + `chunks/`
