# 模式型技能定义 (Pattern Skill Definition)

## 概述 (Overview)

模式型技能（Pattern Skills）专注于思考问题的方式和解决方法的通用框架。关于五大模式的完整定义，请参阅 [skill-spec.md](skill-spec.md)；关于「步骤规范 vs Checklist 规范」的归属决策，请参阅 [skill-spec.md §8](skill-spec.md)。

## 与五大模式的关系 (Relationship with Five Modes)

模式型技能可以对应以下模式：

| 模式型技能类型 | 对应模式 | 是否需要步骤规范 | 是否需要 Checklist 规范 |
|---|---|---|---|
| 架构模式 / 流程模式 | Pipeline | ✅ **必须**（流程化思维需步骤序列） | ⚠ 可选（Gate 条件清单） |
| 决策框架 | Inversion | ⚠ 可选（澄清阶段序列） | ❌ 不需要 |
| 审查模式 | Reviewer | ❌ 不需要 | ✅ **必须**（按严重度分级的清单） |

## 步骤规范 vs Checklist 规范 (Step Spec vs Checklist Spec)

模式型技能的特点是"提供思维框架"，选用哪种规范取决于框架是"操作型"还是"核查型"：

- **架构 / 流程模式**（"按 X 流程设计系统"）：✅ 必须用步骤规范，把框架拆为可执行的 Step 序列（每步含 Gate 三要素）。
- **审查模式**（"按 X 标准审 Y"）：✅ 必须用 Checklist 规范，落地 `references/checklist.md` 按 P0-P3 分级。
- **决策框架**（"在 X 情况下如何选"）：⚠ 可用"澄清阶段"作轻量步骤；❌ 不需要 checklist。

> **判断口径**：模式型技能若偏"流程化思维" → 步骤规范；偏"评价标准" → Checklist 规范。

## 结构模板 (Structure Template)

```markdown
# 模式名称

## 概述 (Overview)

模式的核心思想和适用场景。

## 何时使用 (When to Use)

- 使用条件 1
- 使用条件 2

## 模式定义 (Pattern Definition)

模式的具体定义和组成部分。

## 应用步骤 (Application Steps)

1. 步骤 1
2. 步骤 2

## 示例 (Examples)

实际应用的示例。
```

### 架构 / 流程模式模板（Pipeline 优先）

```markdown
# <模式名称>

## 概述 (Overview)

## 何时使用 (When to Use)

## 模式定义 (Pattern Definition)

## 步骤序列 (Step Sequence)

### Step 1: <步骤名>
- 目标 (Goal):
- 入口条件 (Entry):
- 操作 (Action):
- 出口条件 (Exit):
- 失败策略 (Failure):
- 回滚 (Rollback):

### Step 2: ...
```

### 审查模式模板（Checklist 优先）

参照 [skill-spec.md §8.4.3](skill-spec.md) 的 `references/checklist.md` 模板落地。

## 常见错误 (Common Mistakes)

| 错误 | 解决方案 |
|---|---|
| 过于抽象 | 结合具体示例说明 |
| 不明确边界 | 清楚定义适用和不适用的场景 |
| **流程模式漏写 Gate** | 每步 MUST 含入口 / 出口 / 失败三要素 |
| **审查模式漏分级** | checklist 按 P0-P3 分级，否则无法判断放行 |
