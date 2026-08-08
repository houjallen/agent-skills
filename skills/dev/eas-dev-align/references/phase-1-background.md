# Phase 1: 背景澄清 (Background)

> **所属技能**：`eas-dev-align`
> **目标**：挖掘"为什么做"——需求背后的真正动机。
> **必答对应**：`behavior.gate.phases[0]`（phase-1-background）

---

## 目标 (Goal)

让 Agent 理解用户提出这个需求的**真实动机**——是解决用户痛点？偿还技术债？还是抓住新机会？

动机决定优先级，决定下游技能的取舍策略。

## 怎么问 (How to Ask)

**主问题**：`behavior.gate.phases[0].question`：

> "这个需求背后的'为什么'是什么？"

**预设选项**（来自 `behavior.gate.phases[0].options`）：

| 选项 | 含义 | 下游影响 |
|---|---|---|
| `user-pain` | 解决用户痛点 | 优先级高；UX 优先；测试覆盖用户场景 |
| `tech-debt` | 偿还技术债 | 优先级中；性能 / 可维护性优先；测试覆盖边界 |
| `opportunity` | 抓住新机会 | 优先级视情况；速度优先；测试覆盖核心路径 |
| `other` | 其他 | 用户自定义补充 |

## 输入 (Input)

- 用户原始需求描述
- 之前对话的相关上下文（如有）

## 输出 (Output)

**Phase 1 输出项**（写入 `alignment.md` 的"背景"章节）：

- **Motivation**：用户选定的动机类型
- **Reasoning**：用户对为什么做这件事的具体说明（自由文本）
- **Stakeholders**：受影响方（用户 / 团队 / 客户 / 系统）
- **Risk of NOT doing**：不做这件事的风险 / 代价

## 示例 (Example)

**用户说**："我要给系统加个全文搜索功能"

**Agent 加载 `eas-dev-align`** → 进入 phase-1：

> "这个需求背后的'为什么'是什么？"
> - 🔘 解决用户痛点（用户反馈找不到历史文档）
> - 🔘 偿还技术债（现有搜索 API 不稳定，需重构）
> - 🔘 抓住新机会（老板要求接入 AI 增强搜索）
> - 🔘 其他（请说明）

**用户选择**："用户痛点"

**Agent 追问**：

- "哪些用户受影响？" → "客服和销售"
- "他们的痛点具体是？" → "找不到历史工单，平均每次浪费 5 分钟"
- "不做会怎样？" → "客户满意度持续下降"

**Phase 1 输出**：

```yaml
motivation: user-pain
reasoning: 客服和销售找不到历史工单，平均每次浪费 5 分钟
stakeholders: [客服团队, 销售团队]
risk_of_not_doing: 客户满意度持续下降；NPS 月环比下降 5%
```

## 反模式 (Anti-Patterns)

| ❌ 不要 | ✅ 应该 |
|---|---|
| 接受模糊回答（"就是想加"） | 追问具体场景 / 受影响方 / 不做的代价 |
| 跳过 phase-1 直接问 phase-2 | phase-1 是 phase-2/3 的前提；动机不清 = 范围不清 |
| Agent 自行假设动机 | 必须由用户确认；Agent 不替用户决策 |

## 下一步 (Next Step)

完成 Phase 1 后，进入 **Phase 2：目标 + 范围** → [phase-2-goal-scope.md](phase-2-goal-scope.md)

---

**最后更新**：2026-08-08