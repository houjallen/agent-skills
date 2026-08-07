# 技术型技能定义 (Technique Skill Definition)

## 概述 (Overview)

技术型技能（Technique Skills）专注于有明确步骤可遵循的具体方法或操作。关于五大模式的完整定义，请参阅 [skill-spec.md](skill-spec.md)；关于「步骤规范 vs Checklist 规范」的归属决策，请参阅 [skill-spec.md §8](skill-spec.md)。

## 与五大模式的关系 (Relationship with Five Modes)

| 技术型技能类型 | 对应模式 | 是否需要步骤规范 | 是否需要 Checklist 规范 |
|---|---|---|---|
| API 使用指南 | Tool Wrapper | ❌ 不需要 | ⚠ 可选（常见错误表） |
| 代码生成器 | Generator | ⚠ 可选（生成阶段步骤） | ✅ 推荐（输出校验清单） |
| 操作流程 / 部署 | Pipeline | ✅ **必须** | ⚠ 可选（Gate 条件清单） |
| 单元测试执行 | Pipeline | ✅ **必须** | ⚠ 可选 |

## 步骤规范 vs Checklist 规范 (Step Spec vs Checklist Spec)

技术型技能的特点是"可一步步操作"，因此：

- **Pipeline 类技术（部署、ETL、CI）**：✅ 必须有步骤规范，每步含 Gate 三要素（目标/入口/操作/出口/失败/回滚）。
- **Generator 类技术（生成器、模板）**：⚠ 步骤可选，但 ✅ 输出后 MUST 用 checklist 自检。
- **Tool Wrapper 类技术（API 文档）**：❌ 不需要步骤规范；⚠ 可选「常见错误表」作轻度 checklist。

> **判断口径**：问自己"用户用这个技能是要按顺序做一系列事，还是按表查一个用法？"前者 → 步骤规范；后者 → 常见错误表即可。

## 结构模板 (Structure Template)

```markdown
# 技术名称

## 概述 (Overview)

简要说明技术的目的和用途。

## 何时使用 (When to Use)

- 场景 1
- 场景 2

## 前提条件 (Prerequisites)

- 依赖项 1
- 依赖项 2

## 详细步骤 (Detailed Steps)

1. 步骤 1
2. 步骤 2

## 代码示例 (Code Examples)

关键实现代码。

## 常见错误 (Common Mistakes)

| 错误 | 解决方案 |
|---|---|
| 错误 1 | 方案 1 |
```

## 最佳实践 (Best Practices)

1. 明确前提条件
2. 提供完整代码示例
3. 包含错误处理
4. 提供验证步骤
5. **Pipeline 类技术必须展开 Gate 三要素**（参考 [skill-spec.md §8.3](skill-spec.md)）
6. **Generator 类技术必须配输出校验 checklist**（参考 [skill-spec.md §8.4.4](skill-spec.md)）

## 反模式 (Anti-Patterns)

| ❌ 反模式 | ✅ 应该 |
|---|---|
| API 文档写 "Step 1: 调用 / Step 2: 返回" | 用 API 速查表 + 示例代替 |
| Pipeline 写"步骤 1-5" 但不写 Gate | 每步 MUST 含 Gate 三要素 |
| Generator 不配校验 checklist | 配 C-G 系列 checklist 防错 |
| 步骤里夹杂"可能 / 大概 / 建议试试" | 用 MUST / SHOULD 明确指令强度 |
