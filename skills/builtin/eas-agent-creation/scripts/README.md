[English](./README.en.md) | 中文

# @eas-skills/eas-agent-creation

`eas-agent-creation` 的 standalone CLI 包 —— 不依赖宿主 Agent,通过 `npx tsx` 或 `pnpm dlx` 即可在任意仓库根目录创建 / 演化 / 评审 AI 技能。

> **路径约定**：本文档是 npm 包的 README,默认读者在**仓库根**(`easbot/`)运行命令。下文所有 `skills/builtin/eas-agent-creation/scripts/...` 绝对路径均是 npm 包在 monorepo 内的物理位置,读者执行时按本机实际路径替换。

## 版本

v0.3.28
## 特性

- **生命周期管理**:覆盖技能 `create` / `evolve` / `assess` / `list` / `apply-plan` / `review` 六个操作
- **Standalone CLI**:`src/cli.ts` 经 `tsup` 打包后输出 `dist/cli.{mjs,cjs}`,通过 `bin.eas-agent-creation` 直接挂到全局,无需宿主 Agent 启动
- **ToolDefinition 双形态**:同一份 `tool.ts` 既可独立运行(`tsx src/cli.ts <op>`),也可被 `@easbot/plugin` / `@easbot/llm` 直接 `import { toolDefinition }` 后 `bindTools` 给语言模型
- **类型安全**:核心 API 全部基于 `zod` schema(`operationSchema` 用 `discriminatedUnion` 收窄必填字段)
- **XDG 路径合规**:全局目录遵循 `xdg-basedir`,落盘位置由 `scope=project|global` 决定
- **可观测**:`--log-level` / `--print-logs` / `--debug` 控制日志;LLM 评审结果包含 `rawOutput` 便于排查

## 安装

### 方式一:npm 安装(下游用户)

```bash
pnpm add @eas-skills/eas-agent-creation
# 或直接 npx(无需安装,临时拉最新版本)
pnpm dlx @eas-skills/eas-agent-creation --help
```

### 方式二:开发本仓库(直接 `tsx` 跑源码)

> ⚠️ 本技能直接落在 `skills/builtin/eas-agent-creation/`,**没有** pnpm workspace 根(仓库根无 `package.json` / `pnpm-workspace.yaml`)。`scripts/` 子目录是一个独立的 npm 包,调用 `src/cli.ts` 前**必须**先在 `scripts/` 下安装依赖。

```bash
cd <skillPath>/scripts

# 安装运行时 + 开发依赖(@easbot/llm / @easbot/plugin / @easbot/utils / tsx / tsup / ai / zod ...)
pnpm install
# 若 lockfile 与本机 pnpm 版本不一致,可加 --no-frozen-lockfile
# pnpm install --no-frozen-lockfile

# 验证安装
ls node_modules/@easbot
# 期望输出至少包含: llm  plugin  utils
```

之后在 `scripts/` 下反复调用 `npx tsx src/cli.ts ...` 不需要重装。

> 产物路径 `<skillPath>/scripts/dist/cli.{mjs,cjs}` 已在仓库提交;若不想改源码、只想跑 CLI,直接用产物也行:
>
> ```bash
> node <skillPath>/scripts/dist/cli.mjs --help
> ```

## 使用

### 1. 直接调用 CLI

```bash
# 创建新 skill(scope=project,默认)
npx tsx src/cli.ts create \
  --requirement "创建一个帮助审查代码命名的技能" \
  --hints "包含命名规范清单,支持中英文命名"

# 自检(默认 7 天窗口)
npx tsx src/cli.ts assess --windowDays 7

# 演化(试运行)
npx tsx src/cli.ts evolve --dryRun

# 应用演化计划(需人工审批)
npx tsx src/cli.ts apply-plan \
  --planId "<plan-id>" \
  --approvedBy "user@example.com"

# LLM 评审
npx tsx src/cli.ts review \
  --skillName <name> \
  --variant reviewer

# 列出已注册 skill(按 mode 过滤)
npx tsx src/cli.ts list --mode reviewer --limit 10

# 创建到全局目录(~/.config/easbot/skills)
npx tsx src/cli.ts create --requirement "..." --scope global
```

> 三种调用风格互斥,优先级 `--args '<json>'` > `<op> --key value` > `--op <op> --key value`。详见 [`../references/cli.md`](../references/cli.md)。

### 2. 作为 ToolDefinition 注入语言模型

```typescript
import { toolDefinition } from '@eas-skills/eas-agent-creation/tool';
import { generateText } from 'ai';

const result = await generateText({
  model: yourLanguageModel,
  tools: { creation: toolDefinition },
  prompt: '创建一个 React 19 Server Actions 速查技能',
});
// 模型会调 creation(operation='create', requirement=..., hints=...)
```

> `toolDefinition.execute(args, ctx)` 内部用 `operationSchema` 校验,然后调 `runOperation(validated, ctx)`,与 CLI 行为完全一致。

## 6 个操作 (Operations)

| 操作         | 用途                                                                 | 关键参数                                                                                        |
| ------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `create`     | 根据需求生成新 skill(由 `Creator` + 模式模板拼装)                    | `--requirement`(≥10 字符)、`--hints <csv>`、`--scope project\|global`                           |
| `evolve`     | 跑演化引擎(试运行 / 正式执行)                                        | `--dryRun`(boolean flag)                                                                        |
| `assess`     | 自检 skill 能力与弱点,顺带调 `Llm.reviewSkill`(已注入时)             | `--windowDays <1-90>`                                                                           |
| `list`       | 列出已注册 skill                                                     | `--mode <tool-wrapper\|generator\|reviewer\|inversion\|pipeline>`、`--limit`、`--offset`        |
| `apply-plan` | 应用已生成的演化计划(需人工审批)                                     | `--planId <id>`、`--approvedBy <id>`                                                            |
| `review`     | LLM 评审 skill,基于 `.easbot/easbot.json` 顶层 `language_model` 配置 | `--skillName <name>`、`--temperature` / `--topP` / `--topK` / `--maxOutputTokens` / `--variant` |

> 详细 CLI 入口 / 全局选项 / flag 转换规则 / 落盘路径 / 故障排查见 [`../references/cli.md`](../references/cli.md)。

## 模式与 Composition

`create` 操作按需求关键词推断 5 种模式之一(`inferComposition`):

| 模式           | 一句话      | 触发场景                         |
| -------------- | ----------- | -------------------------------- |
| `tool-wrapper` | 补知识      | 模型不知道某个库/工具/API 的用法 |
| `generator`    | 稳输出      | 输出格式需严格 Schema/模板       |
| `reviewer`     | 按标准审    | 需要按清单逐项核查               |
| `inversion`    | 先问再做    | 需求存在歧义/缺关键参数          |
| `pipeline`     | 每步过 Gate | 流程必须按顺序执行               |

支持 2~3 种模式组合(`composition: 'composed'`,`secondaryModes` 1~2 个),连接关系由 `compositionConnections` 声明。

## 落盘路径 (Storage Paths)

| `scope`         | 默认落盘位置                                                       | 适用场景                      |
| --------------- | ------------------------------------------------------------------ | ----------------------------- |
| `project`(默认) | `{cwd}/.easbot/skills/{name}/SKILL.md`                             | 项目级 skill,提交仓库版本管理 |
| `global`        | `~/.config/easbot/skills/{name}/SKILL.md`(遵循 XDG Base Directory) | 跨项目共享 skill              |

> host 调用可通过 `ToolContext.directory` 覆盖默认目录;CLI 场景下由 `--cwd` 注入。

## 开发

```bash
# 安装依赖
pnpm install

# 构建(产物 dist/cli.{mjs,cjs})
pnpm build

# 测试
pnpm test

# 静态检查 + 修复
pnpm lint
pnpm lint:fix

# 类型检查
pnpm type-check

# 发布(Windows / 类 Unix 分别走 publish.ps1 / publish.sh)
pnpm publish:npm:win
pnpm publish:npm
```

## 目录结构

```
src/
├── cli.ts                 # standalone CLI 入口(loadEnv → Global.init → Log.init → Instance.init → bootstrapLlm → runOp)
├── tool.ts                # operationSchema + toolDefinition + runOperation(三态共用)
├── tool.txt               # tool description 模板(供 llm bindTools 注入系统消息)
├── llm.ts                 # Llm 命名空间(reviewSkill + REVIEW_SYSTEM_PROMPT)
├── global.ts              # Global 命名空间(XDG 路径)
├── hook.ts                # HookRegistry(CreationRequest / EvolutionRequest 钩子)
├── bus/                   # Bus 事件总线(CreationComplete / SkillRemoved 等)
├── project/
│   ├── instance.ts        # Instance.init(cwd) 注入路径
│   └── state.ts           # Project state 缓存
└── creation/
    ├── creation.ts        # Creation 命名空间(create/evolve/assess/list/applyPlan)
    ├── creator.ts         # Creator: 拼装 SkillSpec + 落盘
    ├── evolver.ts         # Evolver: 演化引擎
    ├── assessor.ts        # Assessor: 自评
    ├── validator.ts       # Validator: 校验 SkillSpec
    ├── memory.ts          # Memory: 持久化
    ├── store.ts           # Store: skill 注册表
    ├── memory-bridge.ts   # 与 @easbot/memory 桥接
    ├── errors.ts          # CreationError
    ├── events.ts          # CreationEvents(Schema 校验)
    ├── types.ts           # Composition / SkillMode / SelfAssessment / EvolverQuota
    ├── spec/              # 各模式 spec(skill / gate / workflow / review / bundle / portability)
    ├── template/modes/    # 5 种模式的 SKILL.md 模板(generator / inversion / pipeline / reviewer / tool-wrapper)
    └── __tests__/         # vitest 单元测试
```

## 许可证

MIT
