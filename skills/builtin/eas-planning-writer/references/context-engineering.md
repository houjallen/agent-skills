# Context 工程理论与本技能的落地

## 何时读此文件 (When to Read)

**如果你只想「使用」本技能**（创建任务目录 / 填三件套 / 跨 session 推进）——**无需读此文件**。`SKILL.md` 与 `references/templates/` 已足够。

**如果你想知道「为什么这个技能要这样设计」**——读下文。

## 目录 (Contents)

- [理论 1：上下文窗口 = RAM，文件系统 = Disk](#sec-1)
- [理论 2：注意力窗口有限](#sec-2)
- [理论 3：错误轨迹是隐式学习信号](#sec-3)
- [理论 4：多 Agent / 上下文隔离](#sec-4)
- [本技能的边界 (Out of Scope)](#out-of-scope)
- [关键引言](#key-quotes)

---

## 理论 1：上下文窗口 = RAM，文件系统 = Disk

**理论**：Context window ≈ RAM（易失、有限）；Filesystem ≈ Disk（持久、无限）。任何重要内容都要写入磁盘。

**本技能落地**：task_plan.md / findings.md / progress.md 三件套就是"磁盘上的工作记忆"——阶段、决策、错误、进度全部持久化到 Markdown，对抗上下文遗忘。

压缩时**保留指针**而非丢弃数据：本技能"决策沉淀 (Decision Sediment)"机制——进度临时记录，决策永久归档到 `docs/decisions/00NN-xxx.md`。

---

## 理论 2：注意力窗口有限

**理论**：经过约 50 次工具调用后，模型对初始目标的注意力衰减（"迷失在中间"效应）。单 Token 的 Prompt 前缀变化就会击穿 KV-cache 命中率（生产级 Agent **唯一**最重要的指标）。

**本技能落地**：
- "决策前阅读" 模式——做出重大决策前**重读** task_plan.md，让目标回到注意力窗口
- "跨 session 追加"——`progress.md` 按 `## 会话 N` 追加而非改写历史，保证 KV-cache 命中稳定

---

## 理论 3：错误轨迹是隐式学习信号

**理论**：把错误的转折留在上下文中，带有堆栈跟踪的失败操作让模型隐式更新信念；错误恢复是"真正 Agent 行为的最清晰信号之一"。

**本技能落地**：
- task_plan.md "遇到的错误" 表 + progress.md "错误日志" 表——所有错误**必须记录**，不允许隐藏或默默重试
- "3 次尝试错误协议"——失败 3 次后升级给用户，不死循环

---

## 理论 4：多 Agent / 上下文隔离

**理论**：超过 ~50 次工具调用后，规划 Agent 把 33% 的动作花在更新 todo.md；转向"专用规划 Agent 调用执行子 Agent"后大幅下降。

**本技能落地**：当任务上下文爆炸时（> 50 次工具调用 / > 100 文件），拆出独立子任务目录（`.easbot/knowledge/tasks/<parent>/<subtask>/`）——子 Agent 拥有自己的上下文窗口。

---

## 本技能的边界 (Out of Scope)

本技能**不解决**的 Context Engineering 问题，需要其他技能 / 平台层协同：

| 问题 | 解决方案 |
|------|---------|
| 多 Agent 协同 | 用 `eas-agent-creation` 技能 |
| 全局上下文压缩 | 由 Agent 平台层处理 |
| 工具集 Logit 屏蔽 | 由 `eas-tool-*` 工具集处理 |
| 全局 KV-cache 命中率优化 | 由 Prompt 模板设计处理 |

---

## 关键引言 (Key Quotes)

> "Context window = RAM (volatile, limited). Filesystem = Disk (persistent, unlimited). Anything important gets written to disk."

> "if action_failed: next_action != same_action. Track what you tried. Mutate the approach."

> "Error recovery is one of the clearest signals of TRUE agentic behavior."

> "Leave the wrong turns in the context."

---