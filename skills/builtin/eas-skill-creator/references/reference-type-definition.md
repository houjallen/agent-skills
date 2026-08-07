# 参考型技能定义 (Reference Skill Definition)

## 概述 (Overview)

参考型技能（Reference Skills）专注于提供 API 文档、语法指南、工具文档等静态信息资源。关于五大模式的完整定义，请参阅 [skill-spec.md](skill-spec.md)；关于「步骤规范 vs Checklist 规范」的归属决策，请参阅 [skill-spec.md §8](skill-spec.md)。

## 与五大模式的关系 (Relationship with Five Modes)

| 参考型技能类型 | 对应模式 | 是否需要步骤规范 | 是否需要 Checklist 规范 |
|---|---|---|---|
| API 文档 | Tool Wrapper | ❌ 不需要 | ❌ 不需要 |
| 语法 / 规范参考 | Tool Wrapper | ❌ 不需要 | ❌ 不需要 |
| 规范参考（核查用）| Reviewer | ❌ 不需要 | ⚠ 可选（轻度 checklist） |

## 步骤规范 vs Checklist 规范 (Step Spec vs Checklist Spec)

参考型技能的核心是"提供静态信息供按需查阅"，**两者都不需要**：

- ❌ **不需要步骤规范**——参考型技能不执行流程；写"Step 1: 查 API / Step 2: 调用"是无意义的伪步骤。
- ❌ **不需要 Checklist 规范**——参考型技能不产出可核查的产物；若 Agent 需要核查某物，那是 Reviewer 模式技能的工作。

> **判断口径**：参考型技能的关键词是"查"——查 API、查规范、查语法。如果技能的核心动词是"查"而不是"做"，就属于参考型。

## 结构模板 (Structure Template)

```markdown
# 参考主题

## 概述 (Overview)

简要说明参考内容的目的和范围。

## 主要内容 (Main Content)

### 章节 1 (Chapter 1)

- 详细信息
- 示例代码

## 索引 (Index)

快速导航链接。
```

## 最佳实践 (Best Practices)

1. 结构化组织内容
2. 提供快速导航索引
3. 定期更新保持准确
4. **避免写成步骤序列**——参考型不执行流程
5. **避免堆 checklist**——参考型不核查产物

## 常见错误 (Common Mistakes)

| 错误 | 解决方案 |
|---|---|
| 信息过时 | 定期审核更新 |
| 结构混乱 | 使用清晰分类 |
| 难以检索 | 提供索引和标签 |
| **错把参考型写成 Pipeline** | 参考型 = 静态信息，不要硬拆步骤 |
| **错把参考型写成 Reviewer** | 参考型 ≠ 核查；如需核查另建 Reviewer 技能 |
