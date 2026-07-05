# Evolution 流程 (Evolution Process)

## 概述 (Overview)

本文档定义 EASBot Skill 的演化流程，包括自我评估、计划生成和计划执行。

## 1. 演化流程概述

```
Scheduler Trigger / Agent Request
        ↓
SelfAssessor.assess()
   ├─ 按 refId 聚合 Experience
   ├─ 按模式维度分组指标
   └─ 识别弱点和机会
        ↓
Evolver.planEvolution()
   ├─ 高失败率 → revise-spec
   ├─ 新需求 → create-skill
   └─ 重复技能 → merge
        ↓
applyPlan()
   ├─ 自动执行（低风险）
   └─ 人工审批（高风险）
        ↓
Skill Evolved
```

## 2. SelfAssessor 自我评估

### 按模式维度聚合指标

```typescript
{
  successByMode: Record<SkillMode, { rate, count, avgMs }>,
  failureByMode: Record<SkillMode, { topErrors[] }>,
  trendByMode: Record<SkillMode, 'up' | 'down' | 'stable'>
}
```

### 基础指标

| 指标 | 计算公式 | 阈值 |
|---|---|---|
| 成功率 | `successCount / totalCalls` | ≥ 0.7 健康 |
| 平均时延 | `ΣdurationMs / totalCalls` | ≤ 5000ms 健康 |
| 用户反馈 | `Σfeedback.score / feedbackCount` | ≥ 0.6 健康 |
| 采样量 | `totalCalls` | ≥ 20 才有统计意义 |

## 3. 弱点识别规则

| 规则 | 条件 | 严重度 |
|---|---|---|
| 高失败率 | 失败率 > 80% 且样本 >= 10 | high |
| 中等失败率 | 失败率 > 50% | medium |
| 样本不足 | 样本 < 5 且成功率 < 1 | medium |

## 4. 机会发现规则

| 规则 | 条件 | 建议 |
|---|---|---|
| 高频失败 | 失败率 >= 70% 且调用 >= 20 次 | optimize |
| 中等失败率 | 失败率 >= 40% 且调用 >= 10 次 | merge |
| 高频成功 | 成功率 >= 95% 且调用 >= 20 次 | 记录为稳定能力 |

## 5. Evolver 计划生成

### 规则 1: high 弱点 → create-skill

```typescript
for (const w of assessment.weaknesses.filter(x => x.severity === 'high')) {
  plans.push({
    priority: 'high',
    target: 'skill',
    actions: [{ kind: 'create-skill', spec: synthesizeReplacementSkill(w) }],
    expectedImpact: `Fix ${w.area}: ${w.evidence[0]}`,
    risk: { reversibility: 'easy', blastRadius: `Only affects calls to ${w.area}` },
    approval: { required: true, reason: `High severity weakness: ${w.evidence[0]}` },
  });
}
```

### 规则 2: optimize 机会 → revise-spec

```typescript
for (const o of assessment.opportunities.filter(x => x.kind === 'optimize')) {
  plans.push({
    priority: 'medium',
    target: 'skill',
    actions: [{ kind: 'revise-spec', specId: extractSkillName(o.rationale) }],
    expectedImpact: o.rationale,
    risk: { reversibility: 'easy', blastRadius: o.rationale },
    approval: { required: false },
  });
}
```

### 规则 3: merge 机会 → deprecate + create-skill

```typescript
for (const o of assessment.opportunities.filter(x => x.kind === 'merge')) {
  plans.push({
    priority: 'low',
    target: 'skill',
    actions: [
      { kind: 'create-skill', spec: newSkill },
      { kind: 'deprecate', specId: skillId, reason: 'merged into ' + skillId },
    ],
    expectedImpact: o.rationale,
    risk: { reversibility: 'hard', blastRadius: o.rationale },
    approval: { required: true, reason: 'merge involves deprecate, requires manual confirmation' },
  });
}
```

## 6. 日预算与冷却机制

| 参数 | 值 | 说明 |
|---|---|---|
| DAILY_BUDGET | 10 | 每日最大进化次数 |
| COOLDOWN_DAYS | 7 | 连续 2 次 rollback 后冷却天数 |

## 7. 模式间转换矩阵

| 从 → 到 | 触发条件 | 转换动作 |
|---|---|---|
| Tool Wrapper → Generator | 知识+固定输出结构 | 加 `templates/` + `behavior.sequence` |
| Tool Wrapper → Pipeline | 知识+必须按顺序执行 | 升级为 Bundle + `behavior.sequence` |
| Generator → Reviewer | 输出结构化+需对照标准核查 | 加 `references/checklist.md` + `behavior.gate` |
| Generator → Pipeline | 输出+多阶段 | 加 `behavior.sequence` 拆 stage |
| Reviewer → Pipeline | 多阶段审查 | 拆为两个 Skill + Bundle 编排 |
| Inversion → 任意 | 澄清完成后进入执行 | Inversion 不变，新增下游 Skill |
| Pipeline → Bundle | 流水线太复杂需拆分 | 转为 Bundle，pipeline.yaml 抽到 references |

## 8. 决策日志

每次 Skill 创建/演化时记录到 MemoryBridge：

```typescript
{
  type: 'creation',
  specId: 'skill-name',
  mode: 'tool-wrapper',
  composition: 'composed',
  secondaryModes: ['generator'],
  deliveryChecklist: { ... },
  origin: 'created' | 'evolved',
  result: 'success' | 'failed',
  durationMs: 1234,
  createdAt: ISO,
}
```

## 9. MemoryBridge 命名空间

```
~/.easbot/memory-bridge/
  ├── experiences.jsonl              # 经验（按 refId 分组）
  ├── patterns.jsonl                  # 规律（按 mode 分组）
  ├── knowledge.jsonl                 # 知识（沉淀）
  ├── assessment-snapshots.jsonl      # 评估快照（按 mode 聚合）
  └── evolution-state.json            # 进化状态
```
