# EASBot Agent Skills 更新日志

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

