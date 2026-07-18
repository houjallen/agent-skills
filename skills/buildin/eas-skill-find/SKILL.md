---
name: eas-skill-find
description: 该技能应在 Agent 需要在 EASBot 技能生态系统中查找、搜索或探索可用技能时使用。它教会 Agent 通过 `easbot skills find` 命令帮用户搜索候选技能，并按安装数与来源可信度筛选后给出可操作的安装建议。
category: builtin
version: 1.0.0
tags: [easbot, skill, discovery, search]
---

# eas-skill-find - EASBot 技能查找器 (EASBot Skill Finder)

## 概述 (Overview)

`eas-skill-find` 是 EASBot 项目的官方技能发现入口。它教 Agent 怎么用 `easbot skills find` 在 [skills.sh](https://skills.sh/) 市场里搜索、过滤、验证候选技能，并把结果以"安装命令 + 安装数 + 来源"的形式呈现给用户。

- 入口命令：`easbot skills find [query] [--owner <owner>]`
- 数据来源：skills.sh 公开 API（按安装数倒序）
- 安装命令：`easbot skills add <owner>/<repo>@<skill> -g -y`

## 何时使用 (When to Use)

该技能应在以下情况使用：

- Agent 需要查找 EASBot 生态系统中是否有覆盖用户需求的现成技能
- 用户希望扩展 Agent 能力 / 主动询问"有没有做 X 的技能"
- Agent 在执行任务前希望先确认是否有更合适的 skill 可加载，避免重复造轮子
- 排查问题时发现需要某个特定领域的辅助技能

不适用场景：

- 已知具体技能名 → 直接 `easbot skills add <owner>/<repo>@<skill>`
- 用户在配置 EASBot / 排查生态问题 → 用 `eas-skill-using` 或 `eas-skill-share`

## 快速参考 (Quick Reference)

```bash
# 交互式搜索（fzf 风格）
easbot skills find

# 按关键字搜索
easbot skills find typescript

# 限定 GitHub owner
easbot skills find react --owner houjallen

# 安装搜索结果（-g 全局，-y 跳过确认）
easbot skills add <owner>/<repo>@<skill> -g -y
```

## 搜索工作流 (Search Workflow)

### Step 1: 明确用户意图

先把用户的自然语言需求拆成可搜索的关键字：

| 用户表达 | 推荐关键字 |
|---|---|
| "怎么写 React 组件测试" | `react testing` |
| "帮我 review PR" | `pr review` |
| "有没有 changelog 模板" | `changelog` |
| "我想做 release notes" | `release notes` / `changelog` |

表达模糊时先追问 1-2 个问题再搜索，避免一次搜太宽泛。

### Step 2: 先看官方 Leaderboard

skills.sh 排行榜按安装数倒序，能直接命中很多热门需求：

- `vercel-labs/agent-skills` —— React / Next.js / Web 设计（百万级安装）
- `anthropics/skills` —— 前端设计 / 文档处理（百万级安装）
- `microsoft/skills` —— Azure / .NET / DevOps

如果排行榜已经覆盖用户需求，**直接给推荐**，跳过 CLI 搜索以节省时间。

### Step 3: 执行 `easbot skills find`

```bash
easbot skills find [keywords] [--owner <owner>]
```

- `[keywords]` —— 一个或多个关键字，空格分隔；不传则进入交互式 fzf 选择器
- `--owner <owner>` —— 可选，限定 GitHub owner 加速检索

返回结果按安装数倒序，每条形如：

```
vercel-labs/agent-skills / react-best-practices  ·  185K installs
  React + Next.js 性能优化建议（来自 Vercel 工程团队）
```

### Step 4: 验证质量再推荐

**不要只看搜索结果就推荐**。每条候选至少过三道关：

1. **安装数** —— 优先 1K+ 安装，<100 慎选
2. **来源可信度** —— 官方组织（`vercel-labs` / `anthropics` / `microsoft`）> 社区个人
3. **仓库活跃度** —— 进 GitHub 看 star / 最近提交，<100 star 或半年没更新建议换一条

### Step 5: 给出可操作的推荐

每条候选 4 行内展示，最多给 3 条：

```
我找到了一个可能用得上的技能：

  • vercel-labs/agent-skills / react-best-practices
    React + Next.js 性能优化建议（来自 Vercel 工程团队）
    185K installs
    安装: easbot skills add vercel-labs/agent-skills@react-best-practices -g -y
    详情: https://skills.sh/vercel-labs/agent-skills/react-best-practices
```

### Step 6: 用户同意后立即安装

```bash
easbot skills add <owner>/<repo>@<skill> -g -y
```

- `-g` —— 全局安装到 `${Global.Path.config}/skills/`，所有项目可用
- `-y` —— 跳过确认提示（非交互式）

如果只希望当前项目可用，去掉 `-g` 即可。安装后 EASBot Agent 通过 `Skill.all()` 自动扫描新技能，立即生效。

## 常见技能分类速查 (Skill Categories)

| 类别 | 常用关键字 | 主流来源 |
|---|---|---|
| Web Development | `react`, `nextjs`, `typescript`, `tailwind`, `css` | `vercel-labs/agent-skills` |
| Frontend Design | `frontend`, `design`, `ui`, `accessibility` | `anthropics/skills`, `vercel-labs/agent-skills` |
| Testing | `testing`, `jest`, `playwright`, `e2e` | `microsoft/skills`, `vercel-labs/agent-skills` |
| DevOps | `deploy`, `docker`, `k8s`, `ci-cd`, `github-actions` | `microsoft/skills` |
| Documentation | `docs`, `readme`, `changelog`, `api-docs` | `anthropics/skills` |
| Code Quality | `review`, `lint`, `refactor`, `best-practices` | `vercel-labs/agent-skills`, `microsoft/skills` |
| Productivity | `git`, `workflow`, `automation`, `commit` | `anthropics/skills` |

## 搜索技巧 (Tips)

1. **用具体关键字**：`react testing` 比 `testing` 精确得多
2. **多角度试词**：`deploy` 没结果就试 `deployment` / `ci-cd` / `release`
3. **限定 owner 提速**：知道来源时加 `--owner <owner>` 立刻收敛
4. **小众需求用组合关键字**：`figma plugin react` 比单 `figma` 更准

## 没找到结果时怎么办 (When Nothing Matches)

1. **诚实告诉用户**："我搜了 X 没找到匹配的技能"
2. **用 Agent 自身能力兜底**：仍然可以帮用户完成，告诉用户"我没找到专门做 X 的技能，但我可以直接帮你做"
3. **引导用户自己创建**：

```bash
easbot skills init my-xyz-skill
```

初始化一个 SKILL.md 模板，让用户填充自己的领域知识。

## 数据目录约定 (Data Layout)

`easbot skills find / add / list / remove / update` 共用同一棵数据树：

| 路径 | 用途 |
|---|---|
| `${Global.Path.config}/skills/` | 全局已安装技能（EASBot agent） |
| `<cwd>/.easbot/skills/` | 项目级已安装技能（EASBot agent） |
| `${Global.Path.config}/skills/.skill-lock.json` | 全局锁定文件 |
| `<cwd>/skills-lock.json` | 项目级锁定文件 |

EASBot Agent 启动时通过 `Skill.all()` 自动扫描这两条路径，所以**一旦安装就立即可用**，无需重启或重载。

## 注意事项 (Caveats)

- `easbot skills find` 需要联网调用 skills.sh API；网络不通时会回退到本地 `--owner` 已缓存列表
- 第三方未审核技能（特别是 `openclaw` 组织下的）会在 `add` 时提示风险；除非用户明确要求并加 `--dangerously-accept-openclaw-risks`，否则拒绝安装
- 安装操作会写 `${Global.Path.config}/skills/.skill-lock.json`，多设备同步时记得把这个锁文件纳入 git 或 dotfiles 管理

## 与其他技能的关系 (Relationships with Other Skills)

- **eas-skill-using** —— EASBot 技能生态中央导航；如果用户问"我装了哪些技能 / 都有啥用"，优先用它
- **eas-skill-creator** —— 用户想自己写一个技能时引导过去
