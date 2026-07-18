# 发现与决策 (Findings & Decisions)
<!--
  内容：你的任务知识库。存储你所有的发现和决定。
  原因：上下文窗口是有限的。这个文件是你的"外部存储器"——持久且无限。
  时机：在任何发现之后更新，特别是在 2 次查看/浏览器/搜索操作之后（双动作规则）。
  路径：本文件位于 .easbot/knowledge/tasks/{task-name}/（决策 0034），不进 git。
-->

## 需求 (Requirements)
<!--
  内容：用户要求的细分，分解为具体需求。
  原因：保持需求可见，以免忘记你要构建什么。
  时机：在阶段 1（需求与发现）期间填写。
  示例：
    - 命令行界面
    - 添加任务
    - 列出所有任务
    - 删除任务
    - Python 实现
-->
<!-- 从用户请求中捕获 -->
-

## 研究发现 (Research Findings)
<!--
  内容：从网络搜索、文档阅读或探索中获得的关键发现。
  原因：多模态内容（图片、浏览器结果）不会持久保存。立即写下来。
  时机：每进行 2 次查看/浏览器/搜索操作后，更新此部分（双动作规则）。
  示例：
    - Python 的 argparse 模块支持子命令，适合清晰的 CLI 设计
    - JSON 模块可以轻松处理文件持久化
    - 标准模式：python script.py <command> [args]
-->
<!-- 探索过程中的关键发现 -->
-

## 技术决策 (Technical Decisions)
<!--
  内容：你做出的架构和实现选择，以及理由。
  原因：你会忘记为什么选择某种技术或方法。这个表格保留了这些知识。
  时机：每当你做出重大的技术选择时更新。
  示例：
    | Use JSON for storage | Simple, human-readable, built-in Python support |
    | argparse with subcommands | Clean CLI: python todo.py add "task" |
-->
<!-- 做出的决策及其理由 -->
| 决策 (Decision) | 理由 (Rationale) |
|----------|-----------|
|          |           |

## 遇到的问题 (Issues Encountered)
<!--
  内容：你遇到的问题以及你是如何解决的。
  原因：类似于 task_plan.md 中的错误，但侧重于更广泛的问题（不仅仅是代码错误）。
  时机：当你遇到阻碍或意外挑战时记录。
  示例：
    | Empty file causes JSONDecodeError | Added explicit empty file check before json.load() |
-->
<!-- 错误及其解决方法 -->
| 问题 (Issue) | 解决方案 (Resolution) |
|-------|------------|
|       |            |

## 资源 (Resources)
<!--
  内容：你发现有用的 URL、文件路径、API 参考、文档链接。
  原因：便于以后参考。不要在上下文中丢失重要链接。
  时机：发现有用资源时添加。
  示例：
    - Python argparse docs: https://docs.python.org/3/library/argparse.html
    - Project structure: src/main.py, src/utils.py
-->
<!-- URL、文件路径、API 参考 -->
-

## 视觉/浏览器发现 (Visual/Browser Findings)
<!--
  内容：你从查看图像、PDF 或浏览器结果中学到的信息。
  原因：关键 - 视觉/多模态内容不会在上下文中持久保存。必须作为文本捕获。
  时机：在查看图像或浏览器结果后立即进行。不要等待！
  示例：
    - Screenshot shows login form has email and password fields
    - Browser shows API returns JSON with "status" and "data" keys
-->
<!-- 关键：每 2 次查看/浏览器操作后更新 -->
<!-- 多模态内容必须立即捕获为文本 -->
-

## 决策沉淀 (Decision Sediment)

<!--
  关键判断（如架构选型、流程优化）必须沉淀为决策日志：
  .easbot/knowledge/tasks/{task-name}/progress.md  ← 进度临时记录
  docs/decisions/00NN-{task}-xxx.md                ← 决策永久归档
  Review 决策日志后，可将进度文件清理或保留。
-->
- (待补充：每条关键判断对应一条决策日志引用)

---
<!--
  提醒：双动作规则 (The 2-Action Rule)
  每进行 2 次查看/浏览器/搜索操作后，你必须更新此文件。
  这可以防止视觉信息在上下文重置时丢失。
-->
*每进行 2 次查看/浏览器/搜索操作后更新此文件*
*这可以防止视觉信息丢失*
