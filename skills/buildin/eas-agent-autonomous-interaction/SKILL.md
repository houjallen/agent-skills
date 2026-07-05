---
name: eas-agent-autonomous-interaction
description: 该技能应在多Agent协作任务需要自主会话推进时触发，适用于任一Agent需要主动调用agent_client连接其他Agent、持续多轮交换信息、沉淀可审计Transcript并产出协作结论的通用业务场景。
category: builtin
version: 1.0.0
tags: [easbot, agent, autonomous, duplex, agent_client, trigger, transcript]
---

# Agent自主交互指导 (Agent Autonomous Interaction Guide)

## 概述 (Overview)

该技能用于规范多Agent自主交互流程。任一Agent在协作中都可自行调用 `agent_client` 与其他Agent持续协作，最终输出完整 Transcript 与总结。

该技能核心目标：
- 明确触发条件，确保Agent知道何时进入自主协作模式
- 统一交互协议，减少漏发、错发、重复触发
- 提供消息增强模板，让发送消息时自动携带触发指令

## 何时使用 (When to Use)

以下场景必须触发本技能：
- 需要多个Agent在同一任务中持续多轮协作
- 需要Agent主动使用 `agent_client` 连接并协作其他Agent
- 需要将 A->B、B->A 对话整理为可审计 Transcript
- 需要将跨Agent的协作过程沉淀为结构化结论与可回放记录

## 快速参考 (Quick Reference)

- **发起方Agent职责**: 明确协作目标与轮次边界
- **执行方Agent职责**: 自主 connect/send/receive/exchange
- **交互工具**: `agent_client`
- **输出要求**: 完整 Transcript + 简短总结
- **校验要求**: 必须包含轮次、双方原文、失败重试记录

## 触发协议 (Trigger Protocol)

当执行Agent收到协作请求时，必须识别以下触发语义：
- “自主交互 N 轮”
- “使用 agent_client 连接另一个Agent”
- “输出完整 Transcript”

识别后立刻进入自主模式，不等待额外确认。

## 消息增强规则 (Message Augmentation Rules)

执行Agent每次向目标Agent发送消息时，在业务正文前主动拼接以下元信息段：

```text
[AUTONOMOUS_AGENT_INTERACTION]
session_mode=autonomous
tool=agent_client
transcript_required=true
round=<current_round>/<total_rounds>
sender=<agent_peer_id>
receiver=<target_peer_id>
```

然后再拼接本轮业务消息正文。该规则用于：
- 帮助目标Agent判断当前处于自主协作会话
- 帮助后续日志与Transcript回放
- 降低多Agent上下文错位概率

## 执行流程 (Execution Flow)

1. 读取协作触发消息并提取参数（轮次、目标baseUrl、target peerId）。
2. 使用 `agent_client` 建立连接或复用连接。
3. 进入自主循环：
   - 组装增强消息并发送
   - 读取目标Agent回复
   - 更新轮次上下文并推进下一轮
4. 完成后一次性输出：
   - 轮次明细（A->B、B->A）
   - 关键决策点
   - 失败与重试说明
   - 最终总结

## Transcript格式 (Transcript Format)

输出必须遵循：

```text
Transcript
Round 1
Agent-A -> Agent-B: ...
Agent-B -> Agent-A: ...
Round 2
Agent-A -> Agent-B: ...
Agent-B -> Agent-A: ...
...
Summary
- ...
```

## 常见错误 (Common Mistakes)

- 发起方Agent反复外层硬编码驱动，导致执行方无法自主推进
- 未调用 `agent_client`，仅在本地“假设对话”
- 省略轮次字段，导致无法审计
- 缺失失败重试记录，无法排查不稳定链路

## TODO (TODO)

- [ ] 将本技能加入系统提示词默认技能集合
- [ ] 在消息发送层统一注入 `AUTONOMOUS_AGENT_INTERACTION` 元信息段
- [ ] 为 `agent_client` 增加 `autonomous` 便捷参数模板
- [ ] 增加端到端验证脚本，覆盖 http/websocket/stdio 三通道
- [ ] 将以下全局指令并入系统提示词模板：
  - `From now on, act as my expert assistant with access to all your reasoning and knowledge.`
  - `Always provide a clear answer, step-by-step explanation, alternatives, and practical action plan.`
  - `Never give vague answers. Break broad requests into parts and act as a domain professional.`
