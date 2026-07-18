# EASBot 任务体系对齐说明 (EASBot Task System Alignment)

本参考文档说明 `eas-planning-writer` 与 EASBot 四类任务管理工具的定位、边界与协作模式，确保 Agent 在合适的场景选择合适的工具。

## EASBot 四类任务回顾

参见 `spec/task-management.md`：

| 类别 | 工具 / 命名空间 | 持久化 | 启动方 |
|------|----------------|--------|--------|
| 1. 一次性 subagent | `task` 工具 | 内存 | 用户 / Agent |
| 2. 定时任务 | `scheduler.*` 工具 | DB | 用户 / Agent |
| 3. 项目级长任务 | **本技能**（文件 + 决策） | `.easbot/knowledge/tasks/{task-name}/` | 用户 / 小莫 |
| 4. Agent 内部 todo | `todo` 工具 | DB（`['todo', sessionId]`） | Agent |

## `eas-planning-writer` 在体系中的位置

`eas-planning-writer` 是"**项目级长任务**"分类的物理实现层。它不引入新的工具，而是为该分类提供：

- 固定的三件套文件结构（`task_plan.md` / `findings.md` / `progress.md`）
- 模板与初始化脚本
- Manus 上下文工程实践（防止长任务"迷失在中间"）
- 与决策 0034 文档架构的联动

**核心定位**：跨 session、需要文档化、会 Review 的长任务。

## 决策树：选择合适的工具

```
[需要执行任务]
  ├─ 简单查询 / 单文件编辑
  │   └─ 直接执行，无需任何任务工具
  │
  ├─ 启动一个独立 subagent 做一次性工作
  │   └─ 使用 `task` 工具（一次性，内存）
  │
  ├─ 定时/周期执行（如心跳、清理）
  │   └─ 使用 `scheduler.*` 工具（DB 持久化）
  │
  ├─ 当前 session 内的多步子任务
  │   └─ 使用 `todo` 工具（DB per session）
  │
  └─ 跨 session、需文档化、 Review 的长任务
      └─ 使用 `eas-planning-writer`（文件跟踪，不进 git）
```

## 与 `todo` 工具的边界

最容易混淆的是 `eas-planning-writer` 与 `todo` 工具，二者区别如下：

| 维度 | 项目级长任务（本技能） | Agent todo |
|------|----------------------|-----------|
| 规划主体 | 用户 / 小莫 | Agent 自己 |
| 生命周期 | 数小时 / 数天 / 跨 session | 单次 session |
| 存储 | `.easbot/knowledge/tasks/` | DB（`['todo', sessionId]`） |
| 持久化 | 文件（不进 git） | DB |
| 跨 session | ✅ | ❌ |
| Review | ✅ | ❌ |

**判断标准**：

- 如果任务在 session 结束后还要继续 → `eas-planning-writer`
- 如果只是 Agent 自己在当前 session 内的步骤拆解 → `todo` 工具

## 与 `task` 工具的协作

`task` 工具启动的 subagent **也可**使用本技能：

```
用户 → 启动 subagent (task 工具) → subagent 创建项目级任务目录 → 写入进度
```

subagent 调研发现写入 `findings.md`，进度写入 `progress.md`，完成后主 session 读取。

## 与决策 0034 的联动

根据决策 0034 文档三层架构：

- **L1**（`docs/`，进 git） — 不放任务文件
- **L2**（`.easbot/knowledge/tasks/`，**不进 git**） — 本技能的标准存放位置
- **L3**（`.easbot/`，不进 git） — 小莫私有知识

**严禁**：

- ❌ 把任务文件放 `docs/task/`
- ❌ 把任务文件提交进 git
- ❌ 把任务文件与小莫私有笔记混放

## 长任务中的关键判断 → 决策沉淀

长任务中做出的关键判断（如架构选型、流程优化）必须沉淀为决策日志：

```
.easbot/knowledge/tasks/{task-name}/progress.md       ← 进度临时记录
docs/decisions/00NN-{task}-xxx.md                     ← 决策永久归档
```

Review 决策日志后，可将进度文件清理或保留。

## 相关文档 (Related Documents)

- `spec/task-management.md` — EASBot 任务管理规范（必读）
- `docs/decisions/0034-documentation-structure.md` — 文档三层架构
- `docs/decisions/0016-heartbeat-autonomy-boundary.md` — 心跳约束
- `AGENTS.md` — 项目元规范
