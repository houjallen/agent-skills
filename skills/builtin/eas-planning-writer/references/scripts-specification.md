---
name: scripts-specification
description: "eas-planning-writer 辅助脚本规范 — init-planning-session.ts 与 check-complete.ts 的 CLI 参数、退出码、调用约定、设计原则。"
category: reference
---

# 脚本规范 (Scripts Specification)

`eas-planning-writer` 自带两个 TypeScript 辅助脚本，均位于 `scripts/` 目录。本文件描述其 CLI 接口、退出码、设计原则与常见问题。

## 何时读此文件 (When to Read)

- 想了解脚本支持哪些参数 / 默认值 / 退出码
- 需要扩展脚本功能或排查脚本行为
- 想理解为什么脚本"不引入外部依赖"的设计取舍

**只想使用脚本**：直接看 [SKILL.md §辅助脚本](../SKILL.md)，调用示例已足够。

## 目录 (Contents)

- [通用约定 (Shared Conventions)](#通用约定-shared-conventions)
- [init-planning-session.ts](#init-planning-sessionts)
- [check-complete.ts](#check-completets)
- [设计原则 (Design Principles)](#设计原则-design-principles)
- [常见问题 (FAQ)](#常见问题-faq)

---

## 通用约定 (Shared Conventions)

### 运行环境

- **运行时**：Node.js >= 22.22.3（项目 EASBot 最低版本）
- **TypeScript 执行器**：`tsx`（无需预编译）
- **Shebang**：`#!/usr/bin/env tsx`（两个脚本均带，可直接 `./init-planning-session.ts` 执行）

### 依赖策略

- **零外部依赖**：仅使用 Node.js 内置模块（`node:fs` / `node:path` / `node:url`）
- **不引入 npm 包**，避免污染宿主项目的 `package.json`

### 输出格式

- 所有日志以 `[eas-planning-writer]` 前缀开头，便于在大量输出中过滤
- 正常流程用 `console.log`，错误用 `console.error` + `process.exit(1)`
- **不使用**项目 `Log` 命名空间（`packages/utils/src/utils/log.ts`）—— 那是 `packages/*` 业务代码的工具，技能 scripts 独立运行不引入跨包依赖

### ESM 模块

- 两个脚本均为 ESM（`import` / `export`），与 `tsconfig.base.json` 的 `verbatimModuleSyntax` 对齐
- 入口检测用 `process.argv[1] === __filename` 或 `import.meta.url`（避免直接 import 时副作用执行）

### 默认输出路径

| 脚本 | 默认值 |
|------|--------|
| `init-planning-session.ts` | `.easbot/knowledge/tasks/`（相对当前工作目录） |
| `check-complete.ts` | `<cwd>/task_plan.md`（当前工作目录） |

实际推荐落地路径是 `<cwd>/.easbot/knowledge/tasks/<task-name>/`。

---

## init-planning-session.ts

从 `references/templates/` 读取模板，落地 `task_plan.md` / `findings.md` / `progress.md` 到目标目录。**文件已存在则跳过**，不覆盖用户内容。

### CLI

```bash
npx tsx scripts/init-planning-session.ts [选项]
```

| 参数 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--output <dir>` | `-o <dir>` | 规划文件的输出目录（相对路径） | `.easbot/knowledge/tasks` |
| `--help` | `-h` | 显示帮助信息 | — |

### 调用示例

```bash
# 推荐：为单个任务创建三件套
npx tsx scripts/init-planning-session.ts \
  --output <cwd>/.easbot/knowledge/tasks/my-task

# 使用简写
npx tsx scripts/init-planning-session.ts -o .easbot/knowledge/tasks/my-task

# 使用默认输出目录（不推荐：会创建 .easbot/knowledge/tasks/task_plan.md 等"裸文件"）
npx tsx scripts/init-planning-session.ts
```

### 输出示例

```
[eas-planning-writer] 初始化任务目录: <cwd>/.easbot/knowledge/tasks/my-task
[eas-planning-writer] 已创建: <cwd>/.easbot/knowledge/tasks/my-task/task_plan.md
[eas-planning-writer] 已创建: <cwd>/.easbot/knowledge/tasks/my-task/findings.md
[eas-planning-writer] 已创建: <cwd>/.easbot/knowledge/tasks/my-task/progress.md
[eas-planning-writer] 三件套落地完成。下一步：编辑 task_plan.md 设定目标与阶段。
```

若目标文件已存在：

```
[eas-planning-writer] 跳过（已存在）: <cwd>/.easbot/knowledge/tasks/my-task/task_plan.md
```

### 退出码 (Exit Codes)

| Code | 含义 |
|------|------|
| `0` | 成功（含部分文件已存在跳过的情况） |
| `1` | 参数错误 / 输出目录非法 / 模板缺失 / 写入失败 |

### 校验规则

- 输出目录必须是**相对路径**（绝对路径会被拒绝，防止污染全仓库）
- 不能是 `.` / `./` / `/` / 空字符串
- 路径不存在会自动 `mkdir -p`

### 内部 API 导出

脚本额外导出函数供测试或集成使用：

```ts
import {
  createPlanningFiles,
  readTemplate,
  PLANNING_FILES,
  parseArgs,
  validateOutputDir,
} from './init-planning-session.js';
```

| 导出 | 说明 |
|------|------|
| `createPlanningFiles(outputDir)` | 执行完整落地流程 |
| `readTemplate(name)` | 读取模板内容，缺失时抛错 |
| `PLANNING_FILES` | `['task_plan.md', 'findings.md', 'progress.md']`（常量元组） |
| `parseArgs(argv)` | 解析 CLI 参数，返回输出目录 |
| `validateOutputDir(dir)` | 校验目录合法性 |

---

## check-complete.ts

扫描 `task_plan.md`，统计 `### 阶段 N` / `#### 阶段 N` 标题的数量与状态（`pending` / `in_progress` / `complete` / `skipped`），输出完成度报告。**始终 exit 0**——未完成任务是正常状态。

### CLI

```bash
npx tsx scripts/check-complete.ts [<plan-file>]
```

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `<plan-file>` | 待检查的 `task_plan.md` 路径 | `<cwd>/task_plan.md` |

### 调用示例

```bash
# 检查当前工作目录的 task_plan.md
npx tsx scripts/check-complete.ts

# 检查指定任务的 task_plan.md
npx tsx scripts/check-complete.ts \
  <cwd>/.easbot/knowledge/tasks/my-task/task_plan.md
```

### 输出示例

**全部完成：**

```
[eas-planning-writer] ALL PHASES COMPLETE (5/5)
```

**含跳过阶段：**

```
[eas-planning-writer] ALL PHASES COMPLETE (4+1 skipped/5)
```

**任务进行中：**

```
[eas-planning-writer] Task in progress (2/5 phases complete, 0 skipped)
[eas-planning-writer] 1 phase(s) still in progress.
[eas-planning-writer] 2 phase(s) pending.
```

**无 task_plan.md（视为"无活跃任务"，正常退出）：**

```
[eas-planning-writer] No task_plan.md found — no active planning session.
```

**无阶段标题（视为"未初始化阶段"，正常退出）：**

```
[eas-planning-writer] No phases found in <path>.
```

### 退出码 (Exit Codes)

| Code | 含义 |
|------|------|
| `0` | **始终为 0**——本脚本是"只读探针"，不阻塞调用方 |

### 阶段识别规则

- 标题正则：`^#{3,4}\s*(?:阶段\|Phase)\s+\d+\b`（H3/H4，中英文 + 数字编号必填）
- 状态正则：`\*\*(?:Status\|状态(?:\s*\(Status\))?):\*\*\s*(complete\|in_progress\|pending\|skipped)`
- 备选状态：`[complete]` / `[in_progress]` 等方括号内联格式

**为什么严格按"阶段 N"命名**：避免误命中"阶段总结""阶段性评估"等字样。

### 内部 API 导出

```ts
import {
  checkComplete,
  PHASE_HEADING_REGEX,
  STATUS_REGEX,
} from './check-complete.js';
```

| 导出 | 说明 |
|------|------|
| `checkComplete(planFile)` | 执行扫描并打印结果 |
| `PHASE_HEADING_REGEX` | 阶段标题正则（可复用） |
| `STATUS_REGEX` | 状态正则（可复用） |

---

## 设计原则 (Design Principles)

### 1. 零外部依赖

脚本**只用** Node.js 内置模块。理由：

- 技能可能在任意宿主项目下使用，不假设宿主有特定 npm 包
- 避免污染宿主 `package.json`
- 减少供应链攻击面

### 2. 模板读取而非兜底默认

`init-planning-session.ts` 在模板缺失时**直接抛错**，不再生成兜底默认内容。理由：

- 单一来源原则：模板只存在于 `references/templates/`
- 默认内容会随时间漂移，导致"为什么我的 task_plan.md 和别人不一样"的困惑

### 3. 默认路径相对化

`DEFAULT_OUTPUT_DIR = '.easbot/knowledge/tasks'`（不带 `<cwd>` 前缀）—— 因为脚本始终在宿主项目根目录调用，相对路径即等价于 `<cwd>` 下的绝对路径。

### 4. 不覆盖用户内容

`init-planning-session.ts` 检查文件存在后再写——保护 Agent 在推进过程中已编辑的内容。需覆盖请先删除旧文件。

### 5. 退出码语义化

- `init-planning-session.ts`：`exit 1` 表示参数/IO 错误（**用户应处理**）
- `check-complete.ts`：始终 `exit 0`（**只读探针，不阻塞**）

---

## 常见问题 (FAQ)

**Q: 脚本可以全局安装吗？**
A: 不推荐。本技能设计为"宿主项目级使用"，脚本路径与模板路径都是相对的；全局安装会破坏模板解析。

**Q: 为什么不用项目 `Log` 命名空间？**
A: `packages/utils/src/utils/log.ts` 是 EASBot 业务代码的工具，要求宿主项目安装 `@easbot/utils`。技能脚本独立运行，引入跨包依赖会破坏"零外部依赖"原则。如果宿主项目确实需要统一日志风格，可在调用方包装一层。

**Q: 如何扩展脚本支持新的文件类型？**
A: 修改 `PLANNING_FILES` 常量 + 在 `references/templates/` 下添加同名模板即可。`init-planning-session.ts` 无需其他改动。

**Q: `check-complete.ts` 能否识别中文阶段标题（如"阶段甲"）？**
A: 不能。当前正则严格要求 `阶段 N` / `Phase N` 数字编号。如果需要自定义命名，可修改 `PHASE_HEADING_REGEX` 常量。

---

**版本**：与 `eas-planning-writer` SKILL.md 同步迭代