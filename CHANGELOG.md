# EASBot Agent Skills 更新日志

## 0.3.27

_2026-09-27_

### ✨ 新功能

- **[repo]** feat(scripts): sync README top-of-file version anchor (zh/en) on version bump ([ff67cff](https://github.com/houjallen/agent-skills/commit/ff67cff))
- **[repo]** feat(scripts): add list-published-versions to audit workspace packages on npm ([f5eca0f](https://github.com/houjallen/agent-skills/commit/f5eca0f))
- **[repo]** feat(skill): bundle eas-agent-creation standalone CLI package + reviews ([f8ca135](https://github.com/houjallen/agent-skills/commit/f8ca135))

### 🔧 构建/工具

- **[repo]** chore: bundle housekeeping changes (scripts / skills / config) ([184c236](https://github.com/houjallen/agent-skills/commit/184c236))
- **[repo]** chore: bundle housekeeping changes (scripts / skills / config) ([caf45bd](https://github.com/houjallen/agent-skills/commit/caf45bd))



## 0.3.26

_2026-09-25_

**影响技能 (1)**：`eas-knowledge-using`

### 🐛 修复

- **[repo]** fix(format): split brace-expansion glob in package.json scripts ([b74d5bb](https://github.com/houjallen/agent-skills/commit/b74d5bb))

### 📝 文档

- **[skill:eas-knowledge-using]** docs: sync references to upstream v0.3.26 + entry-matrix MCP count ([1f3ae1d](https://github.com/houjallen/agent-skills/commit/1f3ae1d))
- **[repo]** docs: add 0022 review report for eas-knowledge-using (round 2) ([59897b2](https://github.com/houjallen/agent-skills/commit/59897b2))

### 🔧 构建/工具

- **[repo]** chore: update CHANGELOG.md post prettier lint-staged ([4613b07](https://github.com/houjallen/agent-skills/commit/4613b07))



## 0.3.25

_2026-09-25_

**影响技能 (4)**：`eas-agent-evolution`、`eas-knowledge-using`、`eas-research`、`eas-skill-creator`

### ✨ 新功能

- **[repo]** feat(well-known): add `files` field to skill index entries ([9dcc656](https://github.com/houjallen/agent-skills/commit/9dcc656))
- **[repo]** feat(skills): inject `scope: coder` into dev skills pack (10 skills) ([c18287e](https://github.com/houjallen/agent-skills/commit/c18287e))
- **[skill:eas-skill-creator]** feat(validate): add `scope` to top-level frontmatter allowlist ([7abb31b](https://github.com/houjallen/agent-skills/commit/7abb31b))

### 🐛 修复

- **[skill:eas-agent-evolution]** fix: add prettier-ignore around handlebars table template ([0aa10ce](https://github.com/houjallen/agent-skills/commit/0aa10ce))
- **[skill:eas-skill-creator]** fix(validate): remove stray backslash in placeholder regex ([33e4711](https://github.com/houjallen/agent-skills/commit/33e4711))
- **[repo]** fix(schema): allow non-builtin/tools categories in skillPath ([4a7aa17](https://github.com/houjallen/agent-skills/commit/4a7aa17))

### 📝 文档

- **[repo]** docs: extend 12.1 markdown authoring conventions (handlebars / table wrap / nested code) ([7fa520b](https://github.com/houjallen/agent-skills/commit/7fa520b))
- **[repo]** docs: add 12.1 markdown authoring conventions to AGENTS.md ([83b4704](https://github.com/houjallen/agent-skills/commit/83b4704))
- **[repo]** docs: add 0021 review report for eas-knowledge-using ([3eb4c30](https://github.com/houjallen/agent-skills/commit/3eb4c30))
- **[skill:eas-knowledge-using]** docs: sync references to upstream v0.3.26 + entry-matrix MCP count ([d36ce85](https://github.com/houjallen/agent-skills/commit/d36ce85))
- **[skill:eas-research]** docs: fix description format per §9.3 spec ([1dacf1c](https://github.com/houjallen/agent-skills/commit/1dacf1c))
- **[repo]** docs: add 0020 review report for eas-research v3.0.0 (round 2) ([67e3ad2](https://github.com/houjallen/agent-skills/commit/67e3ad2))
- **[repo]** docs: project-level sync for eas-research v3.0.0 builtin upgrade ([397947e](https://github.com/houjallen/agent-skills/commit/397947e))
- **[skill:eas-research]** docs: upgrade from skills/dev/eas-dev-research to builtin (v3.0.0) ([c0b0cd0](https://github.com/houjallen/agent-skills/commit/c0b0cd0))

### 🔧 构建/工具

- **[repo]** chore(format): batch reformat markdown with prettier ([8f04a57](https://github.com/houjallen/agent-skills/commit/8f04a57))
- **[repo]** chore: extend format:fix to run prettier on markdown ([1d68273](https://github.com/houjallen/agent-skills/commit/1d68273))
- **[repo]** chore(prettier): add overrides for _.md/_.mdx (printWidth 100 + proseWrap preserve) ([2f2c20d](https://github.com/houjallen/agent-skills/commit/2f2c20d))
- **[repo]** chore(pnpm): bump @easbot deps to 0.3.26 + prettier/lint-staged ([884a711](https://github.com/houjallen/agent-skills/commit/884a711))
- **[repo]** chore: bundle housekeeping changes (pnpm / scripts / skill / cli) ([ddf8746](https://github.com/houjallen/agent-skills/commit/ddf8746))
- **[repo]** chore(skills): register eas-knowledge-using in marketplace/AGENTS/README ([80b4c17](https://github.com/houjallen/agent-skills/commit/80b4c17))
- **[repo]** chore(husky): wire lint-staged into pre-commit hook ([a67bb79](https://github.com/houjallen/agent-skills/commit/a67bb79))
- **[repo]** chore: sync marketplace.json ([cd94cdb](https://github.com/houjallen/agent-skills/commit/cd94cdb))
- **[repo]** chore: sync leftover project-level files ([a0f9b99](https://github.com/houjallen/agent-skills/commit/a0f9b99))
- **[repo]** chore(pnpm): migrate overrides to pnpm-workspace.yaml ([1c57972](https://github.com/houjallen/agent-skills/commit/1c57972))

### 👷 CI/CD

- **[repo]** ci: migrate from npm ci to pnpm install --frozen-lockfile ([49a51b6](https://github.com/houjallen/agent-skills/commit/49a51b6))

## 0.3.14

_2026-08-08_

**影响技能 (22)**：`eas-agent-creation`、`eas-agent-evolution`、`eas-chinese-writer`、`eas-dev`、`eas-dev-align`、`eas-dev-design`、`eas-dev-diagnose`、`eas-dev-finish`、`eas-dev-implement`、`eas-dev-loop`、`eas-dev-plan`、`eas-dev-review`、`eas-dev-spec`、`eas-docx`、`eas-pdf`、`eas-planning-writer`、`eas-pptx`、`eas-prompt-creator`、`eas-skill-creator`、`eas-skill-find`、`eas-skill-using`、`eas-xlsx`

### ✨ 新功能

- **[skill:eas-dev]** feat: add 10 dev skills for full development loop ([40c092a](https://github.com/houjallen/agent-skills/commit/40c092a))

### 🐛 修复

- **[skill:eas-skill-creator]** fix(validator): align top-level whitelist + placeholder detection ([1335299](https://github.com/houjallen/agent-skills/commit/1335299))

### 📝 文档

- **[repo]** docs: add 0017 review report for dev skills pack round 3 ([4b0af99](https://github.com/houjallen/agent-skills/commit/4b0af99))
- **[skill:eas-dev-plan]** docs: normalize tasks-template phase to spec value ([0cd9a15](https://github.com/houjallen/agent-skills/commit/0cd9a15))
- **[skill:eas-dev-design]** docs: normalize design-template phase to spec value ([45897f4](https://github.com/houjallen/agent-skills/commit/45897f4))
- **[skill:eas-dev-spec]** docs: normalize spec-template phase to spec value ([6086a7b](https://github.com/houjallen/agent-skills/commit/6086a7b))
- **[skill:eas-dev-align]** docs: normalize alignment-template phase to spec value ([2a3e8b8](https://github.com/houjallen/agent-skills/commit/2a3e8b8))
- **[skill:eas-dev-review]** docs: complete review-template.md frontmatter to match output contract ([eb2bf13](https://github.com/houjallen/agent-skills/commit/eb2bf13))
- **[skill:eas-dev-loop]** docs: sync interrupt-resume.md paths to .easbot/state/dev-loop-<topic>.json ([6640645](https://github.com/houjallen/agent-skills/commit/6640645))
- **[repo]** docs: add 0016 review report for dev skills pack round 2 ([3aebe35](https://github.com/houjallen/agent-skills/commit/3aebe35))
- **[skill:eas-dev-loop]** docs: migrate interrupt_resume.state_storage to .easbot/state/dev-loop-<topic>.json ([d5ee670](https://github.com/houjallen/agent-skills/commit/d5ee670))
- **[skill:eas-dev-implement]** docs: declare scheduler role + delegate downstream paths ([0f6e3dd](https://github.com/houjallen/agent-skills/commit/0f6e3dd))
- **[skill:eas-dev-finish]** docs: inline output contract finish/ sub-group ([cd6636b](https://github.com/houjallen/agent-skills/commit/cd6636b))
- **[skill:eas-dev-diagnose]** docs: inline output contract path convention ([88eb817](https://github.com/houjallen/agent-skills/commit/88eb817))
- **[skill:eas-dev-review]** docs: inline output contract path convention ([7c29249](https://github.com/houjallen/agent-skills/commit/7c29249))
- **[skill:eas-dev-plan]** docs: inline output contract path convention ([354d41e](https://github.com/houjallen/agent-skills/commit/354d41e))
- **[skill:eas-dev-design]** docs: inline output contract path convention ([6adb327](https://github.com/houjallen/agent-skills/commit/6adb327))
- **[skill:eas-dev-spec]** docs: inline output contract path convention ([b1d09ce](https://github.com/houjallen/agent-skills/commit/b1d09ce))
- **[skill:eas-dev-align]** docs: inline output contract path convention ([c1e37db](https://github.com/houjallen/agent-skills/commit/c1e37db))
- **[repo]** docs: clarify §11 scope - only knowledge sediment dirs, runtime paths follow skill inline convention ([529647d](https://github.com/houjallen/agent-skills/commit/529647d))
- **[repo]** docs: sync project-level files for dev-skills-pack (dev category) ([d409883](https://github.com/houjallen/agent-skills/commit/d409883))
- **[repo]** docs: add 0015 review report for dev-skills-pack ([9fa9d7a](https://github.com/houjallen/agent-skills/commit/9fa9d7a))
- **[repo]** docs: add 0014 architecture decision for dev-skills-pack ([39e4c2b](https://github.com/houjallen/agent-skills/commit/39e4c2b))
- **[repo]** docs: sediment 0012 decision + 0013 review for frontmatter normalize ([b24172f](https://github.com/houjallen/agent-skills/commit/b24172f))
- **[repo]** docs: align frontmatter spec with metadata-block policy ([6a05198](https://github.com/houjallen/agent-skills/commit/6a05198))

### 🔧 构建/工具

- **[skill:eas-xlsx]** chore(refactor): remove duplicated frontmatter fields, normalize metadata block ([ae2a98a](https://github.com/houjallen/agent-skills/commit/ae2a98a))
- **[skill:eas-pptx]** chore(refactor): remove duplicated frontmatter fields, normalize metadata block ([77f86aa](https://github.com/houjallen/agent-skills/commit/77f86aa))
- **[skill:eas-pdf]** chore(refactor): remove duplicated frontmatter fields, normalize metadata block ([8e41809](https://github.com/houjallen/agent-skills/commit/8e41809))
- **[skill:eas-docx]** chore(refactor): remove duplicated frontmatter fields, normalize metadata block ([5d97513](https://github.com/houjallen/agent-skills/commit/5d97513))
- **[skill:eas-chinese-writer]** chore(refactor): move frontmatter fields into metadata block ([1dcd666](https://github.com/houjallen/agent-skills/commit/1dcd666))
- **[skill:eas-skill-using]** chore(refactor): move frontmatter fields into metadata block ([63175bd](https://github.com/houjallen/agent-skills/commit/63175bd))
- **[skill:eas-skill-find]** chore(refactor): move frontmatter fields into metadata block ([d2ec3b8](https://github.com/houjallen/agent-skills/commit/d2ec3b8))
- **[skill:eas-prompt-creator]** chore(refactor): move frontmatter fields into metadata block ([b593048](https://github.com/houjallen/agent-skills/commit/b593048))
- **[skill:eas-planning-writer]** chore(refactor): move frontmatter fields into metadata block ([21c14c5](https://github.com/houjallen/agent-skills/commit/21c14c5))
- **[skill:eas-agent-evolution]** chore(refactor): move frontmatter fields into metadata block ([7855df4](https://github.com/houjallen/agent-skills/commit/7855df4))
- **[skill:eas-agent-creation]** chore(refactor): move frontmatter fields into metadata block ([900a102](https://github.com/houjallen/agent-skills/commit/900a102))

## 0.3.13

_2026-08-08_

**影响技能 (11)**：`eas-agent-creation`、`eas-agent-evolution`、`eas-chinese-writer`、`eas-pdf`、`eas-planning-writer`、`eas-pptx`、`eas-prompt-creator`、`eas-skill-creator`、`eas-skill-find`、`eas-skill-using`、`eas-xlsx`

### ✨ 新功能

- **[skill:eas-skill-creator]** feat(spec): 新增 §8 步骤规范 vs Checklist 规范及五大模式映射 ([a8bfffc](https://github.com/houjallen/agent-skills/commit/a8bfffc))
- **[repo]** feat(cli): add src/cli.ts host wrapper that delegates to @easbot/skills.handleSkillsCli ([777a27a](https://github.com/houjallen/agent-skills/commit/777a27a))

### 🐛 修复

- **[repo]** fix(cli): align wrapper to @easbot/skills two-step init pattern; intercept subcommand --help ([3d5b283](https://github.com/houjallen/agent-skills/commit/3d5b283))

### ♻️ 重构

- **[skill:eas-skill-creator]** refactor: 废弃 references/skill-creation-guide.md（决策见 0005） ([4f6d6ad](https://github.com/houjallen/agent-skills/commit/4f6d6ad))
- **[skill:eas-skill-creator]** refactor: frontmatter 补齐 6 字段 + 下沉模式示例到 references ([fcf9f9a](https://github.com/houjallen/agent-skills/commit/fcf9f9a))
- **[repo]** refactor(scripts): switch publish to monorepo flow (pnpm --filter) ([5b74f8e](https://github.com/houjallen/agent-skills/commit/5b74f8e))

### 📝 文档

- **[repo]** docs: 落档 6 个评审报告与决策文档 ([a3f4a94](https://github.com/houjallen/agent-skills/commit/a3f4a94))
- **[repo]** docs: align AGENTS.md §13/§14 with eas-prompt-creator ([297f40b](https://github.com/houjallen/agent-skills/commit/297f40b))
- **[repo]** docs: sync marketplace.json with all 12 skills frontmatter ([cbfa1a3](https://github.com/houjallen/agent-skills/commit/cbfa1a3))
- **[skill:eas-xlsx]** docs: align description with §9.3 three-element spec ([2514826](https://github.com/houjallen/agent-skills/commit/2514826))
- **[skill:eas-pptx]** docs: align description with §9.3 three-element spec ([989d6e0](https://github.com/houjallen/agent-skills/commit/989d6e0))
- **[skill:eas-pdf]** docs: align description with §9.3 three-element spec ([6f8229d](https://github.com/houjallen/agent-skills/commit/6f8229d))
- **[skill:eas-chinese-writer]** docs: align description with §9.3 three-element spec ([beb0eb6](https://github.com/houjallen/agent-skills/commit/beb0eb6))
- **[skill:eas-skill-using]** docs: align description with §9.3 three-element spec ([8559d51](https://github.com/houjallen/agent-skills/commit/8559d51))
- **[skill:eas-skill-find]** docs: align description with §9.3 three-element spec ([f6cd5ee](https://github.com/houjallen/agent-skills/commit/f6cd5ee))
- **[skill:eas-prompt-creator]** docs: align description with §9.3 three-element spec ([5e231e7](https://github.com/houjallen/agent-skills/commit/5e231e7))
- **[skill:eas-planning-writer]** docs: align description with §9.3 three-element spec ([2a62a7c](https://github.com/houjallen/agent-skills/commit/2a62a7c))
- **[skill:eas-agent-evolution]** docs: align description with §9.3 three-element spec ([240dc8b](https://github.com/houjallen/agent-skills/commit/240dc8b))
- **[skill:eas-agent-creation]** docs: align description with §9.3 three-element spec ([da9a92c](https://github.com/houjallen/agent-skills/commit/da9a92c))
- **[skill:eas-skill-creator]** docs(spec): add §9.3 description three-element spec ([f2560b1](https://github.com/houjallen/agent-skills/commit/f2560b1))
- **[repo]** docs: 落档 0004 / 0005 评审与废弃决策 ([5399731](https://github.com/houjallen/agent-skills/commit/5399731))
- **[repo]** docs(readme): document easbot-agent-skills CLI (install, flags, common commands, relation to other entry points) ([13e81b9](https://github.com/houjallen/agent-skills/commit/13e81b9))

### 🔧 构建/工具

- **[repo]** chore(deps): lock @easbot/utils@^0.3.12 added in 3d5b283 ([142ad8f](https://github.com/houjallen/agent-skills/commit/142ad8f))

## 0.3.12

_2026-08-04_

**影响技能 (2)**：`eas-skill-creator`、`eas-skill-find`

### ✨ 新功能

- **[repo]** feat(schemas): add skillPath field to well-known v1 schema + validator ([37f116c](https://github.com/houjallen/agent-skills/commit/37f116c))
- **[repo]** feat(scripts): add well-known v1 schema + validator + generate --validate ([27dbff6](https://github.com/houjallen/agent-skills/commit/27dbff6))

### 🐛 修复

- **[repo]** fix(schemas): align v1 schema + validator to real generate-well-known.ts shape ([44e027b](https://github.com/houjallen/agent-skills/commit/44e027b))
- **[repo]** fix(schemas): align well-known v1 schema URL to easbot.cn ([941078f](https://github.com/houjallen/agent-skills/commit/941078f))

### 📝 文档

- **[repo]** docs: commit ADR 0048 (skillPath) referenced by 37f116c ([fa767df](https://github.com/houjallen/agent-skills/commit/fa767df))
- **[skill:eas-skill-find]** docs: rewrite data-layout.md to XDG + store/cache multi-tier architecture 评审依据: docs/decisions/0002-review-eas-skill-find.md ([7a88f52](https://github.com/houjallen/agent-skills/commit/7a88f52))
- **[repo]** docs: commit review sediment docs (0002 / 0003) with explicit scope reference 评审依据: docs/decisions/0002-review-eas-skill-find.md 关联 ADR: docs/decisions/0003-review-eas-skill-creator.md ([a036582](https://github.com/houjallen/agent-skills/commit/a036582))
- **[repo]** docs: require commit msg to reference decision sediment docs 评审依据: docs/decisions/0002-review-eas-skill-find.md / 0003-review-eas-skill-creator.md ([73aed38](https://github.com/houjallen/agent-skills/commit/73aed38))
- **[repo]** docs: add §7.3 commit message style (msg file workflow + cleanup) ([e398d15](https://github.com/houjallen/agent-skills/commit/e398d15))
- **[repo]** docs: clarify review sediment path decision + forbid SKILL.md reverse-reference ([f4f2ec5](https://github.com/houjallen/agent-skills/commit/f4f2ec5))
- **[skill:eas-skill-creator]** docs: remove SKILL.md reverse-reference requirement + use generic phrasing ([b9e6183](https://github.com/houjallen/agent-skills/commit/b9e6183))
- **[skill:eas-skill-find]** docs: refine remote search workflow (MUST/SHOULD + failure gate) + track local-search ref ([de7298a](https://github.com/houjallen/agent-skills/commit/de7298a))

### 🔧 构建/工具

- **[repo]** chore(gitignore): add local IDE / agent tool config dirs ([ea541b2](https://github.com/houjallen/agent-skills/commit/ea541b2))

## 0.3.11

_2026-07-30_

**影响技能 (12)**：`eas-agent-creation`、`eas-agent-evolution`、`eas-chinese-writer`、`eas-docx`、`eas-pdf`、`eas-planning-writer`、`eas-pptx`、`eas-prompt-creator`、`eas-skill-creator`、`eas-skill-find`、`eas-skill-using`、`eas-xlsx`

### ♻️ 重构

- **[skill:eas-pptx]** refactor: integrate pptx-generator content and move design CSV to references/design-data ([f0ac04c](https://github.com/houjallen/agent-skills/commit/f0ac04c))
- **[skill:eas-docx]** refactor: replace .NET OpenXML SDK stack with docx-js + Python helper scripts ([7c7ff4a](https://github.com/houjallen/agent-skills/commit/7c7ff4a))
- **[skill:eas-pdf]** refactor: unify structure, move design.md to references/aesthetic-system.md, README to references/overview.md ([a769877](https://github.com/houjallen/agent-skills/commit/a769877))
- **[skill:eas-xlsx]** refactor: unify mode composition, path placeholders, and rename template to assets/xlsx_template ([10b0fc1](https://github.com/houjallen/agent-skills/commit/10b0fc1))

### 📝 文档

- **[repo]** docs: add builtin+tools skill review report (8 skills, all P0/P1/P2 closed) ([616d440](https://github.com/houjallen/agent-skills/commit/616d440))
- **[skill:eas-chinese-writer]** docs: add relationships section + fix cross-skill reference ([f0ca844](https://github.com/houjallen/agent-skills/commit/f0ca844))
- **[skill:eas-skill-using]** docs: fix 3 cross-skill references to eas-planning-writer ([4b4b3dc](https://github.com/houjallen/agent-skills/commit/4b4b3dc))
- **[skill:eas-skill-find]** docs: fix cross-skill reference ([8f500da](https://github.com/houjallen/agent-skills/commit/8f500da))
- **[skill:eas-skill-creator]** docs: deduplicate mode content + annotate anti-pattern blocks ([cf7290d](https://github.com/houjallen/agent-skills/commit/cf7290d))
- **[skill:eas-planning-writer]** docs: align frontmatter + add relationships section ([e7b8864](https://github.com/houjallen/agent-skills/commit/e7b8864))
- **[skill:eas-agent-evolution]** docs: fix cross-skill reference ([4bd0e17](https://github.com/houjallen/agent-skills/commit/4bd0e17))
- **[skill:eas-agent-creation]** docs: move mode details to references + annotate tool source ([6fcc84a](https://github.com/houjallen/agent-skills/commit/6fcc84a))
- **[skill:eas-prompt-creator]** docs: declare inversion mode + fix cross-skill reference ([f20586b](https://github.com/houjallen/agent-skills/commit/f20586b))
- **[repo]** docs: add §14 review specification (5-dimension checklist + mandatory load sequence) ([0461a15](https://github.com/houjallen/agent-skills/commit/0461a15))
- **[repo]** docs: add review report for 4 office document skills (eas-docx/eas-pdf/eas-pptx/eas-xlsx) ([a95d33d](https://github.com/houjallen/agent-skills/commit/a95d33d))
- **[skill:eas-xlsx]** docs: declare runtime dependencies in frontmatter ([504a278](https://github.com/houjallen/agent-skills/commit/504a278))
- **[skill:eas-docx]** docs: declare runtime dependencies in frontmatter ([80cea0f](https://github.com/houjallen/agent-skills/commit/80cea0f))
- **[skill:eas-pdf]** docs: add counter-scenario + declare runtime dependencies ([f3ba3ed](https://github.com/houjallen/agent-skills/commit/f3ba3ed))
- **[skill:eas-pptx]** docs: fix broken references links + declare runtime dependencies ([75e67c2](https://github.com/houjallen/agent-skills/commit/75e67c2))
- **[repo]** docs: sync project metadata for 4 office document skills + fix quick-validate frontmatter regex ([1abcdda](https://github.com/houjallen/agent-skills/commit/1abcdda))
- **[repo]** docs: align README* + AGENTS.md on lint/test model + Use Skill loading ([2233ac9](https://github.com/houjallen/agent-skills/commit/2233ac9))
- **[skill:eas-skill-creator]** docs: align 00NN-requirement.md link to skill-path placeholder ([0e72f8d](https://github.com/houjallen/agent-skills/commit/0e72f8d))
- **[skill:eas-planning-writer]** docs: review & fix conflicts + unify terminology ([6a4c04a](https://github.com/houjallen/agent-skills/commit/6a4c04a))
- **[skill:eas-skill-using]** docs: align navigation with newly-landed eas-planning-writer ([26a611e](https://github.com/houjallen/agent-skills/commit/26a611e))
- **[skill:eas-skill-creator]** docs: add Quick Reference section ([7fa98eb](https://github.com/houjallen/agent-skills/commit/7fa98eb))

### 🔧 构建/工具

- **[repo]** chore: trim package.json description to single line ([af40741](https://github.com/houjallen/agent-skills/commit/af40741))
- **[repo]** chore: tighten biome lint rules + adjust global identifiers ([fb6223c](https://github.com/houjallen/agent-skills/commit/fb6223c))
- **[repo]** chore: ignore skills-lock.json ([a63c5d2](https://github.com/houjallen/agent-skills/commit/a63c5d2))
- **[repo]** chore: add tsconfig and refresh pnpm-workspace allowlist ([421da75](https://github.com/houjallen/agent-skills/commit/421da75))

## 0.3.10

_2026-07-26_

**影响技能 (7)**：`eas-agent-creation`、`eas-agent-evolution`、`eas-chinese-writer`、`eas-planning-writer`、`eas-prompt-creator`、`eas-skill-find`、`eas-skill-using`

### 🐛 修复

- **[repo]** fix(scripts): tagExists 使用 refs/tags 限定符避免 ambiguous argument 误判 ([59b8f12](https://github.com/houjallen/agent-skills/commit/59b8f12))

### 📝 文档

- **[skill:eas-skill-find]** docs: 补充数据目录约定参考（data-layout） ([181b5b1](https://github.com/houjallen/agent-skills/commit/181b5b1))
- **[skill:eas-agent-evolution]** docs: 补充 workspace 与 agentId 说明 ([5ae22eb](https://github.com/houjallen/agent-skills/commit/5ae22eb))
- **[skill:eas-skill-find]** docs: 同步最新规范 ([9b065a4](https://github.com/houjallen/agent-skills/commit/9b065a4))
- **[skill:eas-prompt-creator]** docs: 同步最新规范 ([f76aaba](https://github.com/houjallen/agent-skills/commit/f76aaba))
- **[skill:eas-planning-writer]** docs: 同步最新规范 ([c5e8c5e](https://github.com/houjallen/agent-skills/commit/c5e8c5e))
- **[skill:eas-skill-using]** docs: 同步最新规范 ([882d68c](https://github.com/houjallen/agent-skills/commit/882d68c))
- **[skill:eas-chinese-writer]** docs: 同步最新规范 ([72a423d](https://github.com/houjallen/agent-skills/commit/72a423d))
- **[skill:eas-agent-evolution]** docs: 同步最新规范 ([e9e417e](https://github.com/houjallen/agent-skills/commit/e9e417e))
- **[skill:eas-agent-creation]** docs: 同步最新规范 ([d9fa8d0](https://github.com/houjallen/agent-skills/commit/d9fa8d0))
- **[repo]** docs: 完善仓库定位与用法描述 ([bd12a5c](https://github.com/houjallen/agent-skills/commit/bd12a5c))

### 🔧 构建/工具

- **[repo]** chore: revert package.json to 0.3.9 as baseline for bump test ([bdba04e](https://github.com/houjallen/agent-skills/commit/bdba04e))
- **[repo]** chore: 准备版本 0.3.9 基线 ([6119782](https://github.com/houjallen/agent-skills/commit/6119782))
- **[repo]** chore: verify package.json + pnpm-lock.yaml sync ([c643183](https://github.com/houjallen/agent-skills/commit/c643183))
- **[repo]** chore: 引入项目级维护脚本（版本管理、文档同步、发布） ([0de4e41](https://github.com/houjallen/agent-skills/commit/0de4e41))
- **[repo]** chore: 引入项目脚手架（agent-skills 元信息包与协作约定） ([6d0fa7b](https://github.com/houjallen/agent-skills/commit/6d0fa7b))

### 👷 CI/CD

- **[repo]** ci: 引入 pnpm-workspace.yaml 显式声明 native build 白名单 ([5af2bd6](https://github.com/houjallen/agent-skills/commit/5af2bd6))
- **[repo]** ci: 引入 husky hooks（pre-commit 版本管理、commit-msg 格式校验） ([b630d9a](https://github.com/houjallen/agent-skills/commit/b630d9a))
- **[repo]** ci: 引入 GitHub Actions 工作流（CI 与发布） ([54b4fb3](https://github.com/houjallen/agent-skills/commit/54b4fb3))
