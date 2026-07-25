# EASBot Agent Skills 更新日志

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

