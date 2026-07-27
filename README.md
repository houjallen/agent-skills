# agent-skills

> EASBot Agent 技能库 —— EASBot agent-skills 管理项目（无应用代码，保留根级维护脚本）。
>
> English version: [README.en.md](./README.en.md)

## 项目简介

`agent-skills` 是 EASBot 的 **agent-skills 管理项目**，聚合了 EASBot 内置（`builtin`）与工具（`tools`）类技能，供各类 Agent 加载、组合与复用。仓库本体**不包含应用代码、无构建产物、无单元测试套件**；`package.json` 仅作为元信息包存在（声明对 `@easbot/agent` 的依赖与 `files` 字段），不提供 `build`/`lint`/`test` scripts。根 `scripts/` 目录仅放**项目级维护脚本**（changelog 生成、版本号升级、docs 同步等），与各技能内部的 `scripts/` 同根同源。每个技能遵循统一的 `SKILL.md` 规范，提供描述、触发场景、参考资料与脚本。

### 安装与使用

```bash
# 通过 EASBot CLI 安装全部技能
easbot skills add houjallen/agent-skills

# 或作为 npm 元包安装
npm install @easbot/agent-skills
```

## 目录结构

```
agent-skills/
├── README.md            # 中文说明
├── README.en.md         # English README
├── LICENSE              # MIT License
├── AGENTS.md            # Agent / 协作者约定
├── package.json         # 元信息包（依赖 @easbot/agent，声明 files）
├── scripts/             # 项目级维护脚本（见下表）
└── skills/
    ├── builtin/         # 内置核心技能
    │   ├── eas-agent-creation/      # 技能生命周期管理（创建/演化/废弃）
    │   ├── eas-agent-evolution/     # Agent 自我初始化与身份认知
    │   ├── eas-planning-writer/     # 计划与决策文档撰写
    │   ├── eas-prompt-creator/      # 各类 Prompt 模板的设计与生成
    │   ├── eas-skill-creator/       # 技能创建、构建与打包
    │   ├── eas-skill-find/          # 技能搜索与发现
    │   └── eas-skill-using/         # 技能生态中央导航
    └── tools/           # 通用工具类技能
        └── eas-chinese-writer/      # 中文写作与本地化辅助
```

## 项目维护脚本（根 `scripts/`）

仓库维护者本地或 CI 调用的工程级脚本，详见 [AGENTS.md §5.1](./AGENTS.md#51-项目维护脚本根-scripts)。

| 脚本 | 用途 |
| --- | --- |
| `docs_add_frontmatter.ts` | 为 `docs/*.md` 补 frontmatter |
| `docs_sync_automation.ts` | 同步 docs 目录（生成索引、修正 name/category） |
| `generate-changelog.ts` | 根据 git commits 生成 CHANGELOG |
| `bump-version.ts` | 手动升级版本号并打 tag |
| `pre-commit-version.ts` | pre-commit hook 用，默认禁用 |
| `publish.sh` / `publish.ps1` | 发布到 npm 前对全部技能跑一次 `quick-validate` 校验 |

## 内置技能一览（builtin）

| 技能 | 说明 |
| --- | --- |
| `eas-agent-creation` | EASBot 技能生命周期管理入口，覆盖技能从需求捕获、模式选择、创建、演化和废弃的全链路 |
| `eas-agent-evolution` | Agent 自我初始化、身份认知建立、配置文件生成与持续进化 |
| `eas-planning-writer` | 计划与决策文档的撰写（task_plan / progress / decisions / findings） |
| `eas-prompt-creator` | Agent / Command / Context / Task / Feature / Mode 等 Prompt 的设计与生成 |
| `eas-skill-creator` | 官方技能创建与构建工具，提供创建、结构化、验证、打包技能的完整指导 |
| `eas-skill-find` | 在 EASBot 技能生态系统中查找、搜索与探索可用技能 |
| `eas-skill-using` | 技能生态中央导航，给出"我应该用哪个技能"的判断与典型场景下的推荐组合 |

## 工具类技能（tools）

| 技能 | 说明 |
| --- | --- |
| `eas-chinese-writer` | 中文写作与本地化辅助，含 i18n / JSDoc / 术语指南 |

## 快速开始

每个技能都是独立可加载的单元。最简单的使用方式是让 Agent 在对话上下文中加载目标技能的 `SKILL.md`，并按照其中的"何时使用"和"快速参考"部分进行调用。

以中央导航为例：

1. 当你不确定该加载哪个技能时，加载 `eas-skill-using/SKILL.md`
2. 它会给出当前生态的能力索引与场景 → 技能映射
3. 按指引进一步加载具体技能（如 `eas-skill-creator`）执行任务

如果已经知道要用哪个技能（例如 `eas-skill-creator`），直接让 Agent 加载对应 `SKILL.md` 即可——不必走中央导航。

### 全仓技能结构校验

修改 / 新增技能后，跑一遍全量校验：

```bash
for s in skills/builtin/*/ skills/tools/*/; do
  [ -f "$s/SKILL.md" ] && npx tsx skills/builtin/eas-skill-creator/scripts/quick-validate.ts "$s"
done
```

详见 [AGENTS.md §5.2](./AGENTS.md#52-技能包内部脚本)。

## 设计原则

- **职责单一**：每个技能聚焦一类问题或一类能力
- **结构统一**：所有技能遵循一致的 `SKILL.md` 规范
- **可组合**：技能之间可串联、嵌套组合完成复杂任务
- **可演化**：技能支持版本迭代与废弃流程

## 许可

本项目基于 [MIT License](./LICENSE) 开源。

## 变更与贡献

- 版本变更与发布流程详见 [CHANGELOG.md](./CHANGELOG.md)
- 仓库维护、提交约定、协作流程详见 [AGENTS.md](./AGENTS.md)
- 新增 / 演化技能时务必先加载 `eas-skill-using/SKILL.md` 确认分类，再加载 `eas-skill-creator/SKILL.md` 按规约创建
