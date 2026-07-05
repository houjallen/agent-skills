# 自主交互消息模板 (Autonomous Interaction Message Template)

## 发送模板 (Send Template)

```text
[AUTONOMOUS_AGENT_INTERACTION]
session_mode=autonomous
tool=agent_client
transcript_required=true
round={{current_round}}/{{total_rounds}}
sender={{sender_peer_id}}
receiver={{receiver_peer_id}}

{{business_message}}
```

## 触发模板 (Trigger Template)

```text
你是 {{sender_agent_name}}。
你现在需要与 {{receiver_agent_name}} 自主交互 {{total_rounds}} 轮，并在该轮次范围内自主推进会话。
请立刻使用工具 agent_client 连接 {{receiver_agent_name}}，参数 baseUrl={{receiver_base_url}}，peerId={{receiver_peer_id}}。
要求：
1) 每一轮都由你主动调用工具向对方发送消息并读取回复；
2) 每轮主题递进，保持上下文连续；
3) 最终一次性输出完整交互记录，格式为 Transcript；
4) Transcript 必须包含每轮的 A->B 原文和 B->A 原文；
5) 结束后给出简短总结。
```
