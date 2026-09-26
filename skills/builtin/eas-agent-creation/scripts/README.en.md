[中文](./README.md) | English

# @eas-skills/eas-agent-creation

Standalone CLI package for `eas-agent-creation` — runs without a host Agent via `npx tsx` or `pnpm dlx`, enabling create / evolve / review of AI skills from any repo root.

> **Path convention**: this is the npm package README; readers are assumed to run commands from the **repo root** (`easbot/`). All absolute `skills/builtin/eas-agent-creation/scripts/...` paths below refer to the package's physical location inside this monorepo — substitute with your local layout when applying the snippet.

## Version

v0.3.27
## Features

- **Lifecycle coverage**: six operations — `create` / `evolve` / `assess` / `list` / `apply-plan` / `review`
- **Standalone CLI**: `src/cli.ts` is bundled by `tsup` into `dist/cli.{mjs,cjs}`, wired to a global `bin.eas-agent-creation` so the CLI runs without spinning up a host Agent
- **Dual-form ToolDefinition**: a single `tool.ts` works both as a standalone CLI (`tsx src/cli.ts <op>`) and as an `@easbot/plugin` / `@easbot/llm` import (`import { toolDefinition }` then `bindTools`)
- **Type-safe by default**: every API is `zod`-validated; `operationSchema` uses `discriminatedUnion` to narrow required fields per operation
- **XDG-compliant paths**: global storage follows `xdg-basedir`; placement is governed by `scope=project|global`
- **Observable**: `--log-level` / `--print-logs` / `--debug` controls; LLM review results include `rawOutput` for debugging

## Installation

### Option 1: Install from npm (downstream users)

```bash
pnpm add @eas-skills/eas-agent-creation
# Or run directly via npx (no install required, fetches the latest version on demand)
pnpm dlx @eas-skills/eas-agent-creation --help
```

### Option 2: Develop this repo (run source via `tsx`)

> ⚠️ This skill is shipped under `skills/builtin/eas-agent-creation/`, and there is **no** pnpm workspace root (the repo root has neither `package.json` nor `pnpm-workspace.yaml`). The `scripts/` subdirectory is an independent npm package, so you **must** install its dependencies before invoking `src/cli.ts`.

```bash
cd <skillPath>/scripts

# Install runtime + dev deps (@easbot/llm / @easbot/plugin / @easbot/utils / tsx / tsup / ai / zod ...)
pnpm install
# If the lockfile drifts from your local pnpm version, add --no-frozen-lockfile
# pnpm install --no-frozen-lockfile

# Verify the install
ls node_modules/@easbot
# Expected output includes at least: llm  plugin  utils
```

After this, calling `npx tsx src/cli.ts ...` repeatedly inside `scripts/` does not need reinstalling.

> The built artifacts `<skillPath>/scripts/dist/cli.{mjs,cjs}` are already checked in; if you only want to run the CLI without touching source, use the artifact directly:
>
> ```bash
> node <skillPath>/scripts/dist/cli.mjs --help
> ```

## Usage

### 1. Direct CLI invocation

```bash
# Create a new skill (scope=project by default)
npx tsx src/cli.ts create \
  --requirement "Create a skill that helps review code naming conventions" \
  --hints "include a naming checklist,support both Chinese and English identifiers"

# Self-assessment (default 7-day window)
npx tsx src/cli.ts assess --windowDays 7

# Evolution (dry run)
npx tsx src/cli.ts evolve --dryRun

# Apply an evolution plan (requires human approval)
npx tsx src/cli.ts apply-plan \
  --planId "<plan-id>" \
  --approvedBy "user@example.com"

# LLM-based review
npx tsx src/cli.ts review \
  --skillName <name> \
  --variant reviewer

# List registered skills (filter by mode)
npx tsx src/cli.ts list --mode reviewer --limit 10

# Create into the global directory (~/.config/easbot/skills)
npx tsx src/cli.ts create --requirement "..." --scope global
```

> Three invocation styles are mutually exclusive; priority is `--args '<json>'` > `<op> --key value` > `--op <op> --key value`. See [`../references/cli.md`](../references/cli.md).

### 2. Inject as a ToolDefinition into a language model

```typescript
import { toolDefinition } from '@eas-skills/eas-agent-creation/tool';
import { generateText } from 'ai';

const result = await generateText({
  model: yourLanguageModel,
  tools: { creation: toolDefinition },
  prompt: 'Create a React 19 Server Actions cheat-sheet skill',
});
// The model will call creation(operation='create', requirement=..., hints=...)
```

> `toolDefinition.execute(args, ctx)` validates with `operationSchema` internally and then dispatches to `runOperation(validated, ctx)` — the CLI and host paths share exactly the same runtime.

## 6 Operations

| Operation    | Purpose                                                              | Key flags                                                                                       |
| ------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `create`     | Generate a new skill from a requirement (`Creator` + mode templates) | `--requirement` (≥10 chars), `--hints <csv>`, `--scope project\|global`                         |
| `evolve`     | Run the evolution engine (dry-run or apply)                          | `--dryRun` (boolean flag)                                                                       |
| `assess`     | Self-assess skills; also calls `Llm.reviewSkill` when LLM is ready   | `--windowDays <1-90>`                                                                           |
| `list`       | List registered skills                                               | `--mode <tool-wrapper\|generator\|reviewer\|inversion\|pipeline>`, `--limit`, `--offset`        |
| `apply-plan` | Apply a previously produced evolution plan (requires approval)       | `--planId <id>`, `--approvedBy <id>`                                                            |
| `review`     | LLM-based skill review via `.easbot/easbot.json` `language_model`    | `--skillName <name>`, `--temperature` / `--topP` / `--topK` / `--maxOutputTokens` / `--variant` |

> Full CLI entry / global options / flag coercion rules / storage paths / troubleshooting → see [`../references/cli.md`](../references/cli.md).

## Modes & Composition

The `create` operation infers one of five modes via `inferComposition`:

| Mode           | Tagline           | When to use                                           |
| -------------- | ----------------- | ----------------------------------------------------- |
| `tool-wrapper` | Patch knowledge   | The model lacks current API / library know-how        |
| `generator`    | Stable output     | Output must follow a strict schema / template         |
| `reviewer`     | Checklist audit   | Need item-by-item review against a checklist          |
| `inversion`    | Ask first         | Requirements are ambiguous or missing critical params |
| `pipeline`     | Step-by-step gate | Process must run in sequence with strict gates        |

Composition is supported for 2–3 modes (`composition: 'composed'`, 1–2 `secondaryModes`); the wiring is declared via `compositionConnections`.

## Storage Paths

| `scope`             | Default location                                               | Use case                                     |
| ------------------- | -------------------------------------------------------------- | -------------------------------------------- |
| `project` (default) | `{cwd}/.easbot/skills/{name}/SKILL.md`                         | Project-scoped skill (versioned in the repo) |
| `global`            | `~/.config/easbot/skills/{name}/SKILL.md` (XDG Base Directory) | Cross-project shared skill                   |

> Host callers can override via `ToolContext.directory`; in CLI mode the working directory is injected by `--cwd`.

> **Known issue (Review 0024 P1)**: `Evolver` is still hardcoded to `~/.easbot/created` (`evolver.ts executeAction`), which does not align with `Creation.create` writing to `{cwd}/.easbot/skills/{name}`. The Evolver disk-write migration is tracked separately.

## Development

```bash
# Install deps
pnpm install

# Build (emits dist/cli.{mjs,cjs})
pnpm build

# Run tests
pnpm test

# Static analysis + fix
pnpm lint
pnpm lint:fix

# Type check
pnpm type-check

# Publish (Windows / Unix-like via publish.ps1 / publish.sh respectively)
pnpm publish:npm:win
pnpm publish:npm
```

## Directory Layout

```
src/
├── cli.ts                 # Standalone CLI entry (loadEnv → Global.init → Log.init → Instance.init → bootstrapLlm → runOp)
├── tool.ts                # operationSchema + toolDefinition + runOperation (shared by three call sites)
├── tool.txt               # Tool description template (injected into system message by llm.bindTools)
├── llm.ts                 # Llm namespace (reviewSkill + REVIEW_SYSTEM_PROMPT)
├── global.ts              # Global namespace (XDG paths)
├── hook.ts                # HookRegistry (CreationRequest / EvolutionRequest hooks)
├── bus/                   # Bus event bus (CreationComplete / SkillRemoved ...)
├── project/
│   ├── instance.ts        # Instance.init(cwd) path injection
│   └── state.ts           # Project state cache
└── creation/
    ├── creation.ts        # Creation namespace (create/evolve/assess/list/applyPlan)
    ├── creator.ts         # Creator: assemble SkillSpec + persist
    ├── evolver.ts         # Evolver: evolution engine
    ├── assessor.ts        # Assessor: self-assessment
    ├── validator.ts       # Validator: validate SkillSpec
    ├── memory.ts          # Memory: persistence
    ├── store.ts           # Store: skill registry
    ├── memory-bridge.ts   # Bridge to @easbot/memory
    ├── errors.ts          # CreationError
    ├── events.ts          # CreationEvents (Schema-validated)
    ├── types.ts           # Composition / SkillMode / SelfAssessment / EvolverQuota
    ├── spec/              # Per-mode specs (skill / gate / workflow / review / bundle / portability)
    ├── template/modes/    # SKILL.md templates for the five modes
    └── __tests__/         # Vitest unit tests
```

## License

MIT
