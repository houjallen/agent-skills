---
name: eas-planning-writer
description: 该技能应在 Agent 处理跨 session、需要持久化进度、需要事后 Review 或文档化的复杂长任务时使用——典型场景包括多日推进、多阶段实施、需要决策追溯的项目级任务。
category: builtin
version: 1.0.0
---

# 基于文件的规划 (Planning with Files)

使用持久化的 Markdown 文件作为 Agent 的"磁盘上的工作记忆"，防止上下文窗口过载导致目标遗忘。

## 概述 (Overview)

`eas-planning-writer` 是项目级长任务（Project-level Task）的物理实现工具，对应"项目级长任务"分类——跨 session、需要持久化、文档化、会 Review 的工作。

技能把"任务计划 / 调研发现 / 进度记录"分别落地为三个文件，作为 Agent 跨工具调用、跨 session 的外部记忆：

- `task_plan.md` — 阶段、决策、错误
- `findings.md` — 研究、发现、学习
- `progress.md` — 会话日志、测试结果

## 何时使用 (When to Use)

**适用于**：

- **跨 session** 推进的工作（今日未完明日续做）
- 需要**事后 Review / 文档化**的任务（决策可追溯）
- 多阶段、跨工具调用的复杂任务（阶段数不是判断标准，关键看跨 session + Review 需求）
- 需要中断恢复的长任务
- 用户明确要求"做计划"或"先规划再执行"时

**不适用于**：

- 单次工具调用能完成的简单问题
- Agent 内部 todo 工具即可管理的单 session 子任务
- 单文件编辑、快速查询
- 已有 `task` 工具 / `scheduler.*` 工具更适合的场景

> **与其他任务工具的边界**：该技能是"项目级长任务"分类的物理实现层。与一次性 subagent 工具、定时调度工具、Agent 内部 todo 工具平行存在，不替代。选择标准：跨 session / 需要 Review / 文档化时用本技能；仅当前 session 内的步骤拆解用 Agent 内部 todo。

## 快速开始 (Quick Start)

### 1. 任务文件存放位置

项目级长任务文件统一存放在宿主项目的隐藏知识目录（不参与版本控制）：

```
<cwd>/.easbot/knowledge/tasks/{task-name}/
├── task_plan.md       # 任务计划（目标、阶段、决策）
├── findings.md        # 调研发现、问题记录
└── progress.md        # 进度记录
```

- `{task-name}` 使用 kebab-case
- `<cwd>` = 宿主项目根目录（Agent 调用本技能时的当前工作目录）
- **永远不要**放在 `docs/`（避免污染项目级发布文档）
- 三件套**固定结构**，不能缺少

### 2. 复制模板（主路径）

直接复制三个模板到任务目录，然后按需修改目标、阶段：

- [task_plan.md 模板](references/templates/task_plan.md) — 阶段追踪
- [findings.md 模板](references/templates/findings.md) — 研究存储
- [progress.md 模板](references/templates/progress.md) — 会话日志

模板本身已带完整 HTML 注释解释每个章节的"何时填 / 为什么填"，无需再读 SKILL.md 即可上手。

### 3. 任务执行核心流程

```
1. 读取 task_plan.md           # 刷新目标
2. 执行当前阶段动作
3. 每 2 次"查看/搜索/浏览器"操作 → 立即写入 findings.md（双动作规则）
4. 完成阶段 → 更新 task_plan.md 状态 (pending → in_progress → complete)
5. 记录行动到 progress.md（按"会话 N"分节记录）
6. 决策前重读 task_plan.md（注意力操纵）
7. 跨 session 推进 → 追加新"会话 N"节，不要改写历史
8. 上下文爆炸 → 拆子任务目录（见模板"子任务拆分判断"）
```

> **与模板 5 阶段的映射**：`task_plan.md` 模板定义了 5 个**粗阶段**（需求与发现 / 规划与结构 / 实现 / 测试与验证 / 交付），上方的 8 步流程是每个粗阶段**内部**的 day-to-day 操作序列。两者并不冲突：阶段 1-5 决定"做什么"，8 步决定"每天怎么做"。

### 4. 辅助脚本（可选）

仅在不想手动复制模板时使用；阶段完成度检查仍推荐：

- [scripts/init-planning-session.ts](scripts/init-planning-session.ts) — 从模板生成三件套
- [scripts/check-complete.ts](scripts/check-complete.ts) — 统计 `###` / `####` 阶段完成度

> 详细 CLI 参数、退出码、设计原则与扩展方式，请参阅 [scripts-specification.md](references/scripts-specification.md)。

## 核心模式 (Core Pattern)

### 1. 先创建计划

> 永远不要在没有 `task_plan.md` 的情况下开始复杂任务。

### 2. 双动作规则 (The 2-Action Rule)

> 每进行 2 次查看/浏览器/搜索操作后，**立即**将关键发现保存到 `findings.md`。

这可以防止视觉/多模态信息丢失。

### 3. 决策前阅读 (Read-Before-Decide)

在做出重大决策前，**重读** `task_plan.md`。这让目标回到注意力窗口中，避免长 session 后注意力漂移。

### 4. 行动后更新

完成阶段后：

- 标记阶段状态：`in_progress` → `complete`
- 记录错误到 `task_plan.md` 的"遇到的错误"表
- 记录创建/修改的文件到 `progress.md`

### 5. 永不重复失败

```
if action_failed:
    next_action != same_action
```

追踪已尝试的方法，改变策略。**遵循下方「三次尝试错误协议」。**

## 三次尝试错误协议 (3-Attempt Error Protocol)

```
尝试 1：诊断与修复
  → 仔细阅读错误
  → 识别根本原因
  → 应用针对性修复

尝试 2：替代方案
  → 同样的错误？尝试不同的方法
  → 不同的工具？不同的库？
  → 永远不要重复完全相同的失败操作

尝试 3：更广泛的反思
  → 质疑假设
  → 搜索解决方案
  → 考虑更新计划

3 次失败后：升级给用户（详见「三次尝试错误协议 (3-Attempt Error Protocol)」）
  → 解释你尝试了什么
  → 分享具体错误
  → 寻求指导
```

## 6 个问题重启测试 (6-Question Reboot Test)

如果 Agent 能回答以下问题，说明上下文管理稳固：

| # | 问题 | 答案来源 |
|---|------|----------|
| 1 | 我在哪？ | `task_plan.md` 中的当前阶段 |
| 2 | 我要去哪？ | 剩余阶段 |
| 3 | 目标是什么？ | 计划中的目标声明 |
| 4 | 我学到了什么？ | `findings.md` |
| 5 | 我做了什么？ | `progress.md` |
| 6 | 是否需要拆子任务目录？ | `progress.md` 中的「子任务拆分判断」节 |

> **与模板对齐**：本节与 `progress.md` 模板中的「6-Question Reboot Check」一致（含「是否需要拆子任务目录」）。

## 读 vs 写 决策矩阵

| 情况 | 动作 | 原因 |
|------|------|------|
| 刚写了一个文件 | **不要**读 | 内容还在上下文中 |
| 查看了图片/PDF | **立即**写 findings | 多模态 → 文本，防止丢失 |
| 浏览器返回数据 | 写入文件 | 截图不会持久保存 |
| 开始新阶段 | 阅读 plan/findings | 如果上下文陈旧，重新定位 |
| 发生错误 | 阅读相关文件 | 需要当前状态来修复 |
| session 间隔后恢复 | 阅读所有规划文件 | 恢复状态 |

## 反模式 (Anti-Patterns)

| ❌ 不要 | ✅ 应该 |
|---------|---------|
| 用 `todo` 工具跟踪跨 session 长任务 | 用本技能创建项目级任务目录 |
| 把任务文件放 `docs/` | 放 `.easbot/knowledge/tasks/{task-name}/` |
| 陈述目标一次后就忘记 | 决策前重读计划 |
| 隐藏错误并默默重试 | 记录到 `task_plan.md` 错误表 |
| 把所有内容塞进上下文 | 大内容存储到文件中 |
| 立即开始执行 | **先**创建 `task_plan.md` |
| 重复失败的动作 | 追踪尝试，改变方法 |

## 进阶参考 (Advanced References)

需要深入时按需加载：

- [context-engineering.md](references/context-engineering.md) — Manus 六大原则 + 三种上下文工程策略
- [examples.md](references/examples.md) — 实战示例（研究任务 / Bug 修复 / 功能开发 / 错误恢复）
- [scripts-specification.md](references/scripts-specification.md) — 辅助脚本 CLI、退出码、设计原则

## 与其他技能的关系 (Relationships with Other Skills)

- **eas-skill-using**: 加载本技能前可参考 `eas-skill-using` §关键概念（按 `Skill` 工具按 name 加载）确认 Skill 与 Tool 的边界
- **eas-skill-creator**: 本技能遵循 eas-skill-creator 定义的技能结构规范（frontmatter / 必填节 / 引用路径）
- **eas-prompt-creator**: 本技能的产物（决策文档模板）符合 eas-prompt-creator 八大类型中 Feature / Context 类型的边界控制原则

## 决策沉淀 (Decision Sediment)

跨 session 才会复用、影响其他模块、需要 Review 的关键判断，必须沉淀为决策记录。`progress.md` 是临时记录（会话级，不沉淀）；决策文档是永久归档。

### 沉淀路径（按影响范围二选一）

| 影响范围 | 落地路径 | 模板 | 适用场景 |
|----------|----------|------|----------|
| **单任务内** | `<task-dir>/0001-{topic}.md`（与三件套同目录） | [`00NN-requirement.md`](references/templates/decisions/00NN-requirement.md) | 阶段划分、模式选择、字段约定等单任务内的设计判断（最常见） |
| **跨任务 / 跨模块** | `<cwd>/docs/decisions/00NN-{topic}.md`（宿主项目级 ADR 目录） | [`00NN-architecture.md`](references/templates/decisions/00NN-architecture.md) / [`00NN-execution.md`](references/templates/decisions/00NN-execution.md) | 影响 ≥ 2 个任务、改变调用协议、需跨模块 Review 的判断 |

> **不要混淆**：`findings.md` 模板中的「决策沉淀」节只做**引用登记**（指向真正的决策归档文件），不是决策本身；本节给出真正落地的路径与模板。完整判定速查与反模式见 [requirement-decision-guide.md](references/requirement-decision-guide.md)。

### 路径变量 (Path Variables)

为支持技能在任意宿主项目下复用，统一采用 `<cwd>` 前缀约定：

| 占位符 | 含义 |
|--------|------|
| `<cwd>` | 宿主项目根目录（Agent 调用本技能时的当前工作目录） |
| `<cwd>/.easbot/knowledge/tasks/{task-name}/` | 宿主项目级任务文件目录（本技能三件套落地路径） |
| `<cwd>/docs/decisions/` | 宿主项目级 ADR 目录（由宿主项目维护，遵循 Michael Nygard 约定） |
| `<cwd>/docs/decisions/references/decision-template-guide.md` | 宿主项目 ADR 规范文档（可能存在） |

> **路径回退规则**：宿主项目若有自有决策目录（如 `<cwd>/.easbot/decisions/`、`<cwd>/adr/` 等），Agent 应优先遵循宿主项目规范。

### 沉淀规范

按"影响范围"选择模板（自包含于本技能目录内）：

| 类型 | 适用场景 | 章节数 | 模板 |
|------|----------|--------|------|
| **架构型** | 跨模块、影响 API/数据流、需 Review | 11 章 | [`00NN-architecture.md`](references/templates/decisions/00NN-architecture.md) |
| **执行型** | 心跳动作、阶段收尾、单模块修复 | 8 章 | [`00NN-execution.md`](references/templates/decisions/00NN-execution.md) |

> **模板定位**：本技能自包含这两份模板副本（精简自 ADR 行业规范 + 项目级实践）。完整规范、frontmatter 规范、修订与废弃流程以宿主项目 `<cwd>/docs/decisions/references/decision-template-guide.md` 为准（如存在）；不存在时按本目录模板自包含版本落地。
>
> **落地路径**：两份模板均落地到 `<cwd>/docs/decisions/00NN-{topic}.md`（或宿主项目自定义决策目录）。模板顶部 HTML 注释有详细说明。

### 沉淀判定速查

```
✅ 跨 session 才会复用 → 沉淀
✅ 影响其他模块 → 沉淀
✅ 需要 Review → 沉淀
❌ 纯局部代码修复 / 临时变量 → 不沉淀
```

不确定时默认按**架构型**处理（事后可降级为执行型）。
