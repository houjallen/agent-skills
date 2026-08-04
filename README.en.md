# agent-skills

> A reusable skill library for the EASBot agent ecosystem — an `agent-skills` management repository (no application code; root-level maintenance scripts retained).
>
> 中文版本: [README.md](./README.md)

## Overview

`agent-skills` is EASBot's **agent-skills management repository**. It aggregates the builtin (`builtin`) and tools (`tools`) categories of skills for EASBot, designed for agents to load, compose, and reuse. The repository itself contains **no application code, no build artifacts, and no application-level test suite**; `package.json` is a metadata manifest (declares the dependency on `@easbot/agent` and the `files` field). It ships with `biome` + `lint-staged` configured **for local development of root maintenance scripts and per-skill scripts only** — **not enforced as a CI gate** (CI only runs `quick-validate.ts`; see [AGENTS.md §2](./AGENTS.md#2-不强制-ci-门禁的工具)). The root `scripts/` directory holds **project-level maintenance scripts** (changelog generation, version bump, docs sync, etc.), which share the same conventions as the per-skill `scripts/` folders. Every skill follows the unified `SKILL.md` specification, providing description, trigger scenarios, references, and scripts.

### Install & Use

```bash
# Install all skills via the EASBot CLI
easbot skills add houjallen/agent-skills

# Or install the metadata npm package
npm install @easbot/agent-skills
```

## `easbot-agent-skills` CLI (bundled with this repo)

The `@easbot/agent-skills` package ships an executable command, `easbot-agent-skills`, which is a lightweight host process wrapper around `@easbot/skills`. Every skill-management operation (add / remove / list / find / update / store / doctor / use / init, etc.) is dispatched through it, and it is equivalent to `easbot-skills` and `easbot skills ...`.

### Install & Enable

```bash
# Global install (recommended)
npm install -g @easbot/agent-skills

# Or local to your project
npm install @easbot/agent-skills
```

Once installed, `easbot-agent-skills` is available immediately; the build artifact lives at `dist/cli.mjs` (produced by `pnpm build`, registered via the `bin` field in `package.json`).

### Global Flags

| Flag | Description |
| --- | --- |
| `--help` / `-h` | Print full help (recognized at both top level and subcommand level) |
| `--version` / `-v` | Print the current package version |
| `--log-level <DEBUG\|INFO\|WARN\|ERROR>` | Log level (default `INFO`) |
| `--print-logs` | Mirror logs to stdout |
| `--debug` | Enable debug mode (verbose dev logs) |

### Common Commands

```bash
# Add skills
easbot-agent-skills add houjallen/agent-skills
easbot-agent-skills add https://github.com/houjallen/agent-skills -g

# List installed skills
easbot-agent-skills list -p          # project scope only
easbot-agent-skills list -g          # global scope only
easbot-agent-skills list --json      # JSON output

# Search (interactive)
easbot-agent-skills find typescript --owner houjallen

# Remove
easbot-agent-skills remove my-skill -y
easbot-agent-skills rm --agent claude-code my-skill

# Update
easbot-agent-skills update -g
easbot-agent-skills update my-skill --all

# One-shot use (no lock file written)
easbot-agent-skills use houjallen/agent-skills@eas-skill-creator

# Store operations
easbot-agent-skills store list [keyword]
easbot-agent-skills store clean --force
easbot-agent-skills store remove <sourceKey>

# Doctor (health check)
easbot-agent-skills doctor
easbot-agent-skills dr -g -y

# Initialize a new skill skeleton
easbot-agent-skills init my-skill
```

### Relation to Other Entry Points

| Entry point | Purpose |
| --- | --- |
| `easbot-agent-skills ...` | Bundled with this repo (host wrapper; imports `@easbot/skills` at runtime) |
| `easbot-skills ...` | Standalone CLI shipped by `@easbot/skills` (also calls `handleSkillsCli`) |
| `easbot skills ...` | Delegated from `@easbot/agent` main CLI via Commander.js — equivalent to the two above |

All three entry points are equivalent; the difference is only the host (agent / agent-skills package / this repo's wrapper) — **the underlying implementation is identical**.

### Troubleshooting

- `easbot-agent-skills: unknown command: ...` → typo or unsupported in this version; run `easbot-agent-skills --help` for the full command list
- Command hangs on an interactive prompt → pass `-y / --yes` to skip confirmation
- Need to see low-level logs → pass `--log-level DEBUG --print-logs`

For the full command / flag reference, see the output of `easbot-agent-skills --help`.

## Repository Layout

```
agent-skills/
├── README.md            # Chinese description
├── README.en.md         # English README
├── LICENSE              # MIT License
├── AGENTS.md            # Agent / contributor conventions
├── package.json         # Metadata manifest (depends on @easbot/agent, declares files)
├── scripts/             # Project-level maintenance scripts (see table below)
└── skills/
    ├── builtin/         # Core builtin skills
    │   ├── eas-agent-creation/      # Skill lifecycle management (create / evolve / deprecate)
    │   ├── eas-agent-evolution/     # Agent self-init and identity bootstrapping
    │   ├── eas-planning-writer/     # Authoring of plans and decision docs
    │   ├── eas-prompt-creator/      # Designing and generating prompts of various kinds
    │   ├── eas-skill-creator/       # Official skill builder, validator, and packager
    │   ├── eas-skill-find/          # Search and discover skills in the ecosystem
    │   └── eas-skill-using/         # Central navigation for the skill ecosystem
    └── tools/           # General-purpose utility skills
        ├── eas-chinese-writer/      # Chinese writing and i18n assistance
        ├── eas-docx/                # Word document generation / editing / accept-changes
        ├── eas-pdf/                 # Design-driven PDF generation / form fill / restyle
        ├── eas-pptx/                # PowerPoint generation / editing / design system
        └── eas-xlsx/                # Excel/spreadsheet read / create / edit / validate
```

## Project Maintenance Scripts (root `scripts/`)

Engineering scripts invoked locally or by CI by repository maintainers. See [AGENTS.md §5.1](./AGENTS.md#51-project-maintenance-scripts-root-scripts) for the full command reference.

| Script | Purpose |
| --- | --- |
| `docs_add_frontmatter.ts` | Add frontmatter to `docs/*.md` |
| `docs_sync_automation.ts` | Sync the `docs/` directory (generate index, fix name/category) |
| `generate-changelog.ts` | Generate CHANGELOG from git commits |
| `bump-version.ts` | Manually bump versions and create a tag |
| `pre-commit-version.ts` | Pre-commit hook variant, disabled by default |
| `generate-plugin.ts` | Generate `.claude-plugin/marketplace.json` |
| `generate-well-known.ts` | Generate `.well-known/agent-skills/index.json` (v1 protocol; clean + rebuild by default), exposes skills to external agents via the well-known URL discovery / load flow. Pass `--validate` to auto-run schema validation. |
| `docs/schemas/agent-skills/validate-v1.cjs` | Validate `.well-known/agent-skills/index.json` against the v1 schema. Manual run: `npm run well-known:validate`. |
| `publish.sh` / `publish.ps1` | Run `quick-validate` against every skill before publishing to npm |

## Builtin Skills

| Skill | Description |
| --- | --- |
| `eas-agent-creation` | Lifecycle entry point for EASBot skills — covers requirement capture, mode selection, creation, evolution, and deprecation |
| `eas-agent-evolution` | Self-initialization, identity bootstrapping, config generation, and continuous evolution of an agent |
| `eas-planning-writer` | Authoring of planning and decision documents (`task_plan` / `progress` / `decisions` / `findings`) |
| `eas-prompt-creator` | Design and generation of prompts for Agent / Command / Context / Task / Feature / Mode and more |
| `eas-skill-creator` | Official skill builder with full guidance on creating, structuring, validating, and packaging skills |
| `eas-skill-find` | Search, discover, and explore available skills inside the EASBot ecosystem |
| `eas-skill-using` | Central navigation of the skill ecosystem — answers "which skill should I use?" and gives typical combinations |

## Tools

| Skill | Description |
| --- | --- |
| `eas-chinese-writer` | Chinese writing and i18n assistance, including i18n / JSDoc / terminology guides |
| `eas-docx` | Word (.docx) processing: CREATE (docx-js from-scratch) / EDIT (XML unpack/edit/pack) / ACCEPT-CHANGES |
| `eas-pdf` | Design-driven PDF processing: CREATE (from-scratch) / FILL (form fields) / REFORMAT (restyle existing docs) |
| `eas-pptx` | PowerPoint (.pptx) processing: CREATE (PptxGenJS) / EDIT (XML-based on template) / READ (markitdown) |
| `eas-xlsx` | Excel/spreadsheet processing: READ (analyze) / CREATE (XML template) / EDIT (XML direct) / FIX (formulas) / VALIDATE |

## Getting Started

Every skill is a self-contained, loadable unit. The simplest way to use them is to let your agent load the target skill's `SKILL.md` into context and follow its "When to Use" and "Quick Reference" sections.

Example flow with the central navigation:

1. When unsure which skill to use, load `eas-skill-using/SKILL.md`
2. It returns a capability index and a scenario → skill mapping
3. Follow its guidance to load the concrete skill (e.g. `eas-skill-creator`) and execute the task

If you already know which skill you want (e.g. `eas-skill-creator`), just have the agent load that `SKILL.md` directly — no need to go through the central navigation.

### Repository-wide Skill Validation

After editing or adding a skill, run a full validation pass:

```bash
for s in skills/builtin/*/ skills/tools/*/; do
  [ -f "$s/SKILL.md" ] && npx tsx skills/builtin/eas-skill-creator/scripts/quick-validate.ts "$s"
done
```

See [AGENTS.md §5.2](./AGENTS.md#52-skill-internal-scripts) for details.

## Design Principles

- **Single responsibility** — each skill focuses on one class of problem or capability
- **Unified structure** — every skill conforms to the same `SKILL.md` spec
- **Composable** — skills can be chained or nested to handle complex tasks
- **Evolvable** — skills support versioning and deprecation

## License

This project is released under the [MIT License](./LICENSE).

## Changes & Contributing

- Version history and release process: see [CHANGELOG.md](./CHANGELOG.md)
- Maintenance rules, commit conventions, and collaboration flow: see [AGENTS.md](./AGENTS.md)
- Before adding or evolving a skill, load `eas-skill-using/SKILL.md` to confirm the category, then load `eas-skill-creator/SKILL.md` to follow the creation spec
