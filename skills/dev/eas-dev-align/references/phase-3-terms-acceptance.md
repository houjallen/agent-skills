# Phase 3: 术语 + 验收 (Terms & Acceptance)

> **所属技能**：`eas-dev-align`
> **目标**：对齐"语言"+"怎么算完成"——下游技能的契约。
> **必答对应**：`behavior.gate.phases[2]`（phase-3-acceptance）
> **前置依赖**：Phase 2 完成

---

## 目标 (Goal)

让 Agent 与用户对齐两个关键契约：

1. **术语表 (Glossary)**：确保双方用同一套词汇讨论问题（mattpocock §"Shared Language"）
2. **验收标准 (Acceptance Criteria)**：明确"怎么算做完"——下游技能可验证

## 怎么问 (How to Ask)

**主问题**：`behavior.gate.phases[2].question`：

> "怎么算'做完了'？"

**预设选项**（来自 `behavior.gate.phases[2].options`）：

| 选项 | 含义 | 下游影响 |
|---|---|---|
| `behavior-defined` | 可观察行为已定义 | 验收靠 E2E 测试；UI 优先；端到端验证 |
| `metric-defined` | 可量化指标已定义 | 验收靠指标（性能 / 准确率 / 响应时间） |
| `test-coverage` | 测试覆盖率达标 | 验收靠覆盖率（单测 / 集成测试比例） |
| `other` | 其他 | 用户自定义补充 |

## 输入 (Input)

- Phase 1 输出（动机）
- Phase 2 输出（目标 / 范围）
- 用户对完成度的描述

## 输出 (Output)

**Phase 3 输出项**（写入 `alignment.md` 的"术语表"和"验收"章节）：

### 术语表 (Glossary)

| 术语 | 定义 | 来源 |
|---|---|---|
| `term-a` | 具体含义（无歧义） | 用户定义 |
| `term-b` | 具体含义 | 用户定义 |
| ... | | |

### 验收标准 (Acceptance Criteria)

**主验收（Selected Type）**：

- [ ] AC-1：可观察行为 / 指标 / 测试覆盖（按用户选择的具体化）
- [ ] AC-2：同上
- [ ] ...

**副验收（其他类型补充）**：

- [ ] AC-N：附加验收项
- [ ] ...

**Done 判定**：

- AC-1 ~ AC-N 全部通过 + PR 合并 + 部署到 staging（视情况）

## 示例 (Example)

**承接 Phase 2 示例**（工单全文搜索）：

> "怎么算'做完了'？"
> - 🔘 可观察行为已定义（用户能搜到结果）
> - 🔘 可量化指标已定义（搜索响应时间 < 500ms）
> - 🔘 测试覆盖率达标（单测 ≥ 80%）
> - 🔘 其他

**用户选择**："可量化指标已定义"

**Agent 追问**：

- "哪些指标？" → "P99 搜索响应时间 < 500ms；准确率（前 5 结果含目标） ≥ 90%"
- "如何测量？" → "用 staging 环境的真实数据，跑 1000 条查询统计"
- "术语对齐" → 用户说"工单"指 `ticket`，"标签"指 `tag`，"客户"指 `customer`

**Phase 3 输出**：

```yaml
glossary:
  工单: ticket (数据模型实体)
  标签: tag (工单的多对多标签)
  客户: customer (购买方主体)
  全文搜索: full-text search (覆盖 title/content/tag/customer_name 字段)

acceptance_criteria:
  primary:
    type: metric-defined
    criteria:
      - id: AC-1
        name: P99 搜索响应时间
        target: < 500ms
        measurement: staging 跑 1000 条查询
      - id: AC-2
        name: 搜索准确率
        target: 前 5 结果包含目标工单 ≥ 90%
        measurement: 100 条人工标注 query 的检索结果
  secondary:
    - id: AC-3
      name: 测试覆盖率
      target: 核心逻辑单测 ≥ 80%
      measurement: jest --coverage
  done_definition:
    - 所有 AC 通过
    - PR 合并到 main
    - 部署到 staging
    - 通知客服团队上线
```

## 反模式 (Anti-Patterns)

| ❌ 不要 | ✅ 应该 |
|---|---|
| 验收标准含混（"差不多就行"） | 验收必有可量化 / 可观察的具体指标 |
| 术语表为空 | 至少有 3-5 个核心术语对齐 |
| 把"主观感受"当验收 | 验收 MUST 可被 Agent 自动或半自动验证 |
| 跳过 Phase 3 直接出 spec | 没有验收标准 = spec 不可执行 |

## 完成对齐 (Alignment Complete)

Phase 3 完成后：

1. **生成 `alignment.md`**（用 [assets/alignment-template.md](../assets/alignment-template.md)）
2. **告知用户**：对齐完成；询问是否进入下一阶段（`eas-dev-spec` / `eas-dev-design`）
3. **NEVER 自行决定下一阶段**：对齐结果 = 用户主导决策

---

**最后更新**：2026-08-08