---
name: eas-skill-find
description: 该技能应在 Agent 需要在 EASBot 技能生态中搜索候选技能、或在执行任务前确认是否有更合适的现成 skill 可加载时使用。覆盖 skills.sh 远程市场搜索、过滤、验证、安装的完整链路；本地已装 / store 内技能检索（`--local` / `--path`）见 references/local-search.md。
category: builtin
version: 1.1.0
tags: [easbot, skill, discovery, search, market, skills.sh]
---

# eas-skill-find (EASBot 技能查找器)

## 概述 (Overview)

`eas-skill-find` 是 EASBot 的官方技能发现入口。它教 Agent 怎么用 `easbot skills find` 在 [skills.sh](https://skills.sh/) 公共市场里搜索、过滤、验证候选技能，并以"安装命令 + 安装数 + 来源"形式呈现给用户。

**两套搜索模式**：
- **远程搜索**（默认）—— 调 skills.sh `/api/search`，按 install 数倒序
- **本地搜索**（`--local` / `--path`）—— 扫 store 索引或文件系统，详见 [references/local-search.md](references/local-search.md)

## 何时使用 (When to Use)

该技能应在以下情况使用：

- Agent 需要查找 EASBot 生态系统中是否有覆盖用户需求的现成技能（**先于自己造轮子**）
- 用户希望扩展 Agent 能力 / 主动询问"有没有做 X 的技能"
- Agent 在执行任务前希望先确认是否有更合适的 skill 可加载
- 排查问题时需要某个特定领域的辅助技能

不适用场景：

- 已知具体技能名 → 直接 `easbot skills add <owner>/<repo>@<skill>`
- 已装技能列表 / 已装技能用途 → 用 `eas-skill-using`
- 用户想自己写一个技能 → 用 `eas-skill-creator`
- 用户在配置 EASBot / 排查生态问题 → 用 `eas-skill-using`

## 快速参考 (Quick Reference)

| 项目 | 取值 / 说明 |
| --- | --- |
| 入口命令 | `easbot skills find [query] [flags]` |
| 数据源 | skills.sh 公共 API（`${SKILLS_API_URL:-https://skills.sh}/api/search`） |
| 排序 | 按 install 数倒序（API 强制，客户端无 `--sort` flag） |
| 限制 | API 默认 limit=10；无 `--limit` flag（要更多结果用更窄的 `--owner` / 更精确的关键字） |
| 过滤 | `--owner <name>` 限定 GitHub owner（仅远程模式有效） |
| 输出模式 | 默认 TTY 渲染（fzf 风格）；`--json` 输出结构化 JSON |
| 本地模式 | `--local` 查 store 内已登记 skill；`--path <dir>` 扫文件系统 SKILL.md（详见 references） |
| 安装命令 | `easbot skills add <owner>/<repo>@<skill> -g -y` |

> **本技能主文件仅覆盖远程搜索**。本地搜索（`--local` / `--path`）的语义、输出格式、文件结构约束见 [references/local-search.md](references/local-search.md)。

## 远程搜索工作流 (Remote Search Workflow)

### Step 1：明确用户意图 (Clarify User Intent)

把用户自然语言需求拆成可搜索的关键字：

| 用户表达 | 推荐关键字 |
|---|---|
| "怎么写 React 组件测试" | `react testing` |
| "帮我 review PR" | `pr review` |
| "有没有 changelog 模板" | `changelog` |
| "我想做 release notes" | `release notes` / `changelog` |

表达模糊时 SHOULD 先追问 1-2 个问题再搜索，避免一次搜太宽泛。

### Step 2：执行 `easbot skills find` (Run the Search Command)

```bash
# 交互式 fzf（不传 query）
easbot skills find

# 按关键字
easbot skills find react testing

# 限定 GitHub owner（提速）
easbot skills find react --owner vercel-labs
```

返回结果按 install 数倒序（API 强制），每条形如：

```
vercel-labs/agent-skills / react-best-practices  ·  185K installs
  React + Next.js 性能优化建议（来自 Vercel 工程团队）
```

### Step 3：验证质量再推荐 (Validate Before Recommending)

**MUST 不要只看搜索结果就推荐**。每条候选至少过三道关：

1. **安装数** —— 优先 1K+ 安装；<100 SHOULD 直接跳过
2. **来源可信度** —— 官方组织（`vercel-labs` / `anthropics` / `microsoft`）> 社区个人
3. **仓库活跃度** —— 进 GitHub 看 star / 最近提交；<100 star 或半年没更新 SHOULD 换一条

> **失败兜底**：若 `easbot skills find` 调用失败（网络 / API / 超时），MUST NOT 回退到任何缓存列表 —— 直接跳到「没找到结果时怎么办 (When Nothing Matches)」节走兜底路径。

### Step 4：给出可操作的推荐 (Present Actionable Recommendations)

每条候选 4 行内展示，最多给 3 条：

```
我找到了一个可能用得上的技能：

  • vercel-labs/agent-skills / react-best-practices
    React + Next.js 性能优化建议（来自 Vercel 工程团队）
    185K installs
    安装: easbot skills add vercel-labs/agent-skills@react-best-practices -g -y
    详情: https://skills.sh/vercel-labs/agent-skills/react-best-practices
```

### Step 5：用户同意后立即安装 (Install on User Approval)

```bash
easbot skills add <owner>/<repo>@<skill> -g -y
```

- `-g` —— 全局安装；不加则项目级（`<cwd>/<agent>/skills/`，如 `.claude/skills/`、`.agents/skills/`、`.easbot/skills/` 等各家 agent 目录）
- `-y` —— 跳过确认提示（非交互式）

安装后 EASBot Agent 启动时自动扫描新技能，立即生效。

## 搜索技巧 (Tips)

1. **用具体关键字**：`react testing` 比 `testing` 精确得多
2. **多角度试词**：`deploy` 没结果就试 `deployment` / `ci-cd` / `release`
3. **限定 owner 提速**：知道来源时加 `--owner <owner>` 立刻收敛（**仅远程模式有效**）
4. **小众需求用组合关键字**：`figma plugin react` 比单 `figma` 更准
5. **优先看高 install 数**：API 按 install 数倒序，顶部结果通常是社区验证过的

## 没找到结果时怎么办 (When Nothing Matches)

1. **诚实告诉用户**："我搜了 X 没找到匹配的技能"
2. **用 Agent 自身能力兜底**：仍然可以帮用户完成，告诉用户"我没找到专门做 X 的技能，但我可以直接帮你做"
3. **引导用户自己创建**：`eas-skill-creator` 负责这个流程

## 注意事项 (Caveats)

- `easbot skills find` 默认需要联网调 skills.sh API。**网络失败时不回退到任何缓存列表** —— 直接报错，让 Agent 走「没找到结果时怎么办 (When Nothing Matches)」节的兜底路径
- 第三方未审核技能（特别是 `openclaw` 组织下的）会在 `add` 时提示风险；除非用户明确要求并加 `--dangerously-accept-openclaw-risks`，否则拒绝安装
- API 限制为 top 10；想要更多结果**用 `--owner` 收窄范围**，而不是期待"翻页"（没有这个 flag）
- `--json` 输出可被脚本消费（CI / 自动化场景）；默认 TTY 输出走 fzf 交互

## 与其他技能的关系 (Relationships with Other Skills)

- **eas-skill-using** —— EASBot 技能生态中央导航；如果用户问"我装了哪些技能 / 都有啥用"，优先用它
- **eas-skill-creator** —— 用户想自己写一个技能时引导过去
- **本技能** —— 找"**新**"技能（远程市场 / 本地 store / 文件系统），与 `eas-skill-using`（查"**已装**"技能）互补
- 本地搜索细节（`--local` / `--path` 输出格式、filesystem scan 规则）见 [references/local-search.md](references/local-search.md)
