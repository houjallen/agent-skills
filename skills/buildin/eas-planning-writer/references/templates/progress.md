# 进度日志 (Progress Log)
<!--
  内容：你的会话日志 - 按时间顺序记录你做了什么、什么时候做的以及发生了什么。
  原因：回答"5个问题重启测试"中的"我做了什么？"。帮助你在中断后恢复工作。
  时机：在完成每个阶段或遇到错误后更新。比 task_plan.md 更详细。
  路径：本文件位于 .easbot/knowledge/tasks/{task-name}/（仓库隐藏知识目录，不进 git）。
-->

## 会话 1：[日期]
<!--
  内容：第一次工作会话的日期。
  原因：帮助追踪工作发生的时间，便于在时间间隔后恢复。
  跨 session 推进：每开新会话追加"## 会话 N：[日期]"节。
  示例：## 会话 2：2026-07-23
-->

### 阶段 1：[标题]
<!--
  内容：此阶段采取的行动的详细日志。
  原因：提供已完成工作的上下文，使其更容易恢复或调试。
  时机：在你完成阶段工作的过程中更新，或者至少在完成时更新。
-->
- **状态 (Status):** in_progress
- **开始时间 (Started):** [timestamp]
<!--
  状态：与 task_plan.md 相同 (pending, in_progress, complete, skipped)
  时间戳：你开始此阶段的时间 (例如 "2026-01-15 10:00")
-->
- 采取的行动 (Actions taken):
  <!--
    内容：你执行的具体操作列表。
    示例：
      - Created todo.py with basic structure
      - Implemented add functionality
      - Fixed FileNotFoundError
  -->
  -
- 创建/修改的文件 (Files created/modified):
  <!--
    内容：你创建或更改了哪些文件。
    原因：快速参考哪些内容被触及。有助于调试和审查。
    示例：
      - todo.py (created)
      - todos.json (created by app)
      - task_plan.md (updated)
  -->
  -

### 阶段 2：[标题]
<!--
  内容：与阶段 1 结构相同，用于下一个阶段。
  原因：为每个阶段保留单独的日志条目，以清晰地追踪进度。
-->
- **状态 (Status):** pending
- 采取的行动 (Actions taken):
  -
- 创建/修改的文件 (Files created/modified):
  -

## 测试结果 (Test Results)
<!--
  内容：你运行的测试、预期结果以及实际发生的情况的表格。
  原因：记录功能的验证。有助于发现回归。
  时机：在你测试功能时更新，特别是在阶段 4（测试与验证）期间。
  示例：
    | Add task | python todo.py add "Buy milk" | Task added | Task added successfully | ✓ |
-->
| 测试 (Test) | 输入 (Input) | 预期 (Expected) | 实际 (Actual) | 状态 (Status) |
|------|-------|----------|--------|--------|
|      |       |          |        |        |

## 错误日志 (Error Log)
<!--
  内容：遇到的每个错误的详细日志，包括时间戳和解决尝试。
  原因：比 task_plan.md 的错误表更详细。帮助你从错误中学习。
  时机：错误发生时立即添加，即使你很快修复了它。
  示例：
    | 2026-01-15 10:35 | FileNotFoundError | 1 | Added file existence check |
-->
<!-- 保留所有错误 - 它们有助于避免重复 -->
| 时间戳 (Timestamp) | 错误 (Error) | 尝试 (Attempt) | 解决方案 (Resolution) |
|-----------|-------|---------|------------|
|           |       | 1       |            |

## 6 个问题重启检查 (6-Question Reboot Check)
<!--
  内容：六个问题，用于验证你的上下文是否稳固。
  原因：这是"重启测试"——如果你能回答全部 6 个问题，你可以有效地恢复工作。
  时机：定期更新，特别是在休息或上下文重置后恢复后。

  六个问题：
  1. 我在哪？ (Where am I?) → task_plan.md 中的当前阶段
  2. 我要去哪？ (Where am I going?) → 剩余阶段
  3. 目标是什么？ (What's the goal?) → 计划中的目标声明
  4. 我学到了什么？ (What have I learned?) → 见 findings.md
  5. 我做了什么？ (What have I done?) → 见本 progress.md
  6. 是否需要拆子任务目录？ → 见下方"子任务拆分判断"
-->
| 问题 (Question) | 答案 (Answer) |
|----------|--------|
| 我在哪？ | 阶段 X |
| 我要去哪？ | 剩余阶段 |
| 目标是什么？ | [目标声明] |
| 我学到了什么？ | 见 findings.md |
| 我做了什么？ | 见上文 |
| 是否需要拆子任务目录？ | 见下方 |

### 子任务拆分判断 (Sub-Task Split Heuristic)
<!--
  内容：评估本任务是否需要拆出独立的子 task 目录。
  触发条件（满足任一即拆）：
  - 本 session 工具调用已 > 50 次，记忆开始模糊
  - 子模块文件数 > 100，独立推进更高效
  - 用户明确要求"独立推进某子模块"

  拆分子任务时的标准动作：
  1. 在本 progress.md 末尾追加"移交独立 task 目录"段
  2. 在 .easbot/knowledge/tasks/<parent>/<subtask>/ 创建新三件套（同样遵循本技能的 SOP）
  3. 子任务 task_plan.md 顶部 HTML 注释引用父任务路径
  4. 父任务阶段列表标注 "delegated to <subtask>"
-->
- 是否需要拆？ (Should split?) [ ] 是 / [ ] 否
- 触发条件 (Trigger): [列出触发的具体条件]
- 子任务路径 (Sub-task path): [如 .easbot/knowledge/tasks/<parent>/<subtask>/]
- 拆分日期 (Split date): [YYYY-MM-DD]

---

<!--
  提醒：
  - 每开新 session 追加 "## 会话 N：[日期]" 节（不要改写旧会话）
  - 完成每个阶段或遇到错误后更新
  - 要详细 - 这是你的"发生了什么"日志
  - 包含错误的时间戳以追踪问题发生的时间
  - 决策沉淀统一在 findings.md（避免双源）
-->
*完成每个阶段或遇到错误后更新*