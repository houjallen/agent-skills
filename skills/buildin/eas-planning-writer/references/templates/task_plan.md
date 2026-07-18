# 任务计划：[简要描述]
<!--
  内容：这是你整个任务的路线图。把它想象成你"磁盘上的工作记忆"。
  原因：经过 50 次以上的工具调用后，你最初的目标可能会被遗忘。这个文件让它们保持新鲜。
  时机：首先创建这个，在开始任何工作之前。每个阶段完成后更新。
  路径：本文件位于 .easbot/knowledge/tasks/{task-name}/（决策 0034），不进 git。
-->

## 目标 (Goal)
<!-- 
  内容：用一句话清楚地描述你想要实现的目标。
  原因：这是你的北极星。重读它可以让你专注于最终状态。
  示例："Create a Python CLI todo app with add, list, and delete functionality."
-->
[一句话描述最终状态]

## 当前阶段 (Current Phase)
<!-- 
  内容：你当前正在进行的阶段（例如，“阶段 1”，“阶段 3”）。
  原因：快速参考你在任务中的位置。随着进度更新此项。
-->
阶段 1

## 阶段 (Phases)
<!-- 
  内容：将你的任务分解为 3-7 个逻辑阶段。每个阶段都应该是可完成的。
  原因：将工作分解为阶段可以防止不知所措，并使进度可见。
  时机：完成每个阶段后更新状态：pending → in_progress → complete
-->

### 阶段 1：需求与发现 (Requirements & Discovery)
<!--
  内容：了解需要做什么并收集初始信息。
  原因：在不了解的情况下开始会导致精力浪费。此阶段可以防止这种情况。
-->
- [ ] 理解用户意图
- [ ] 识别约束和需求
- [ ] 将发现记录在 findings.md 中
- **状态 (Status):** in_progress
<!-- 
  状态值：
  - pending: 尚未开始
  - in_progress: 当前正在进行
  - complete: 已完成此阶段
-->

### 阶段 2：规划与结构 (Planning & Structure)
<!-- 
  内容：决定你将如何处理问题以及你将使用什么结构。
  原因：良好的规划可以防止返工。记录决策以便你记住为什么选择它们。
-->
- [ ] 定义技术方案
- [ ] 如果需要，创建项目结构
- [ ] 记录决策及其理由
- **状态 (Status):** pending

### 阶段 3：实现 (Implementation)
<!-- 
  内容：实际构建/创建/编写解决方案。
  原因：这是工作发生的地方。如果需要，分解为更小的子任务。
-->
- [ ] 一步一步执行计划
- [ ] 执行前将代码写入文件
- [ ] 增量测试
- **状态 (Status):** pending

### 阶段 4：测试与验证 (Testing & Verification)
<!--
  内容：验证一切工作正常并满足需求。
  原因：尽早发现问题可以节省时间。在 progress.md 中记录测试结果。
-->
- [ ] 验证所有需求已满足
- [ ] 在 progress.md 中记录测试结果
- [ ] 修复发现的任何问题
- **状态 (Status):** pending

### 阶段 5：交付 (Delivery)
<!-- 
  内容：最终审查并移交给用户。
  原因：确保没有遗漏，并且交付物是完整的。
-->
- [ ] 审查所有输出文件
- [ ] 确保交付物完整
- [ ] 交付给用户
- **状态 (Status):** pending

## 关键问题 (Key Questions)
<!--
  内容：你在任务期间需要回答的重要问题。
  原因：这些指导你的研究和决策。随做随答。
  示例：
    1. Should tasks persist between sessions? (Yes - need file storage)
    2. What format for storing tasks? (JSON file)
-->
1. [要回答的问题]
2. [要回答的问题]

## 已做决策 (Decisions Made)
<!--
  内容：你做出的技术和设计决策，以及背后的理由。
  原因：你会忘记为什么做出选择。这个表格帮助你记住并证明决策的合理性。
  时机：每当你做出重大选择（技术、方法、结构）时更新。
  示例：
    | Use JSON for storage | Simple, human-readable, built-in Python support |
-->
| 决策 (Decision) | 理由 (Rationale) |
|----------|-----------|
|          |           |

## 遇到的错误 (Errors Encountered)
<!--
  内容：你遇到的每一个错误，它是第几次尝试，以及你是如何解决它的。
  原因：记录错误可以防止重复相同的错误。这对学习至关重要。
  时机：错误发生时立即添加，即使你很快修复了它。
  示例：
    | FileNotFoundError | 1 | Check if file exists, create empty list if not |
    | JSONDecodeError | 2 | Handle empty file case explicitly |
-->
| 错误 (Error) | 尝试 (Attempt) | 解决方案 (Resolution) |
|-------|---------|------------|
|       | 1       |            |

## 笔记 (Notes)
<!-- 
  提醒：
  - 随着进度更新阶段状态：pending → in_progress → complete
  - 重大决策前重读此计划（注意力操纵）
  - 记录所有错误 - 它们有助于避免重复
  - 永远不要重复失败的动作 - 改为改变你的方法
-->
- 随着进度更新阶段状态：pending → in_progress → complete
- 重大决策前重读此计划（注意力操纵）
- 记录所有错误 - 它们有助于避免重复
