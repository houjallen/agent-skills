# agent-skills

> A reusable skill library for the EASBot agent ecosystem — an `agent-skills` management repository (no application code; root-level maintenance scripts retained).
>
> 中文版本: [README.md](./README.md)

## Overview

`agent-skills` is EASBot's **agent-skills management repository**. It aggregates the builtin (`buildin`) and tools (`tools`) categories of skills for EASBot, designed for agents to load, compose, and reuse. The repository itself contains **no application code, no build artifacts, and no test suite**; `package.json` is only a metadata manifest (declares the dependency on `@easbot/agent` and the `files` field) and provides no `build`/`lint`/`test` scripts. The root `scripts/` directory holds **project-level maintenance scripts** (changelog generation, version bump, docs sync, etc.), which share the same conventions as the per-skill `scripts/` folders. Every skill follows the unified `SKILL.md` specification, providing description, trigger scenarios, references, and scripts.

### Install & Use

```bash
# Install all skills via the EASBot CLI
easbot skills add houjallen/agent-skills

# Or install the metadata npm package
npm install @easbot/agent-skills
```

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
    ├── buildin/         # Core builtin skills
    │   ├── eas-agent-creation/      # Skill lifecycle management (create / evolve / deprecate)
    │   ├── eas-agent-evolution/     # Agent self-init and identity bootstrapping
    │   ├── eas-planning-writer/     # Authoring of plans and decision docs
    │   ├── eas-prompt-creator/      # Designing and generating prompts of various kinds
    │   ├── eas-skill-creator/       # Official skill builder, validator, and packager
    │   ├── eas-skill-find/          # Search and discover skills in the ecosystem
    │   └── eas-skill-using/         # Central navigation for the skill ecosystem
    └── tools/           # General-purpose utility skills
        └── eas-chinese-writer/      # Chinese writing and i18n assistance
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

## Getting Started

Every skill is a self-contained, loadable unit. The simplest way to use them is to let your agent load the target skill's `SKILL.md` into context and follow its "When to Use" and "Quick Reference" sections.

Example flow with the central navigation:

1. When unsure which skill to use, load `eas-skill-using/SKILL.md`
2. It returns a capability index and a scenario → skill mapping
3. Follow its guidance to load the concrete skill (e.g. `eas-skill-creator`) and execute the task

## Design Principles

- **Single responsibility** — each skill focuses on one class of problem or capability
- **Unified structure** — every skill conforms to the same `SKILL.md` spec
- **Composable** — skills can be chained or nested to handle complex tasks
- **Evolvable** — skills support versioning and deprecation

## License

This project is released under the [MIT License](./LICENSE).
