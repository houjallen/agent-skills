---
topic: <评审主题 / PR 编号>
created_at: <YYYY-MM-DD>
reviewer: <评审者>
spec_ref: <path-to-spec.md>
design_ref: <path-to-design.md> (optional)
diff_ref: <git-diff-output-or-link>
---

# <主题> - 代码评审报告 (Code Review Report)

> **生成方式**：通过 [`eas-dev-review`](../SKILL.md) 技能产出
> **评审输入**：[`<spec_ref>`](<spec_ref>) + [`<diff_ref>`](<diff_ref>)
> **总体结论**：✅ PASS / ⚠️ PASS with notes / ❌ FAIL

---

## 1. Summary

| 项 | 值 |
|---|---|
| 总体结论 | ✅ PASS / ⚠️ PASS with notes / ❌ FAIL |
| P0 数量 | <N> |
| P1 数量 | <N>（已豁免 <M>） |
| P2 数量 | <N> |
| 是否阻止合入 | 是（P0 > 0）/ 否 |
| Strengths | <1-3 句话> |

---

## 2. Blocking Issues (P0)

> MUST 修复；修复前禁止合入

### P0-1: <标题>

- **轴**：标准轴 / spec 轴
- **类别**：<安全 / 接口契约 / 验收覆盖 / 范围守纪>
- **位置**：`<file>:<line>`
- **问题描述**：<具体描述>
- **修复建议**：<具体修复方案>
- **参考**：<spec / doc / best practice>

### P0-N: ...

---

## 3. Must Fix or Exempt (P1)

> MUST 修复；不修复 MUST 在下方"豁免列表"中显式豁免

### P1-1: <标题>

- **轴**：标准轴 / spec 轴
- **类别**：<错误处理 / 性能 / 命名 / 设计遵循 / 测试覆盖>
- **位置**：`<file>:<line>`
- **问题描述**：<具体描述>
- **修复建议**：<具体修复方案>
- **状态**：⏳ 待修复 / ✅ 已豁免

### P1-N: ...

### 豁免列表 (Exemptions)

| P1 ID | 豁免理由 | 豁免人 | 日期 |
|---|---|---|---|
| P1-X | <理由> | <name> | <YYYY-MM-DD> |

---

## 4. Nice to Fix (P2)

> 建议修复；不阻止合入；后续 PR 处理

### P2-1: <标题>

- **轴**：标准轴 / spec 轴
- **类别**：<风格 / 可读性 / 文档同步>
- **位置**：`<file>:<line>`
- **建议**：<一句话建议>

### P2-N: ...

---

## 5. Strengths

> 做得好的部分（知识传递 + 鼓励）

- ✅ <做得好的点 1>
- ✅ <做得好的点 2>
- ✅ <做得好的点 3>

---

## 元数据 (Metadata)

| 项 | 值 |
|---|---|
| 评审时间 | <YYYY-MM-DD> |
| 评审者 | <name> |
| spec 引用 | <path> |
| design 引用 | <path> |
| diff 引用 | <path> |
| 总体结论 | ✅ / ⚠️ / ❌ |
| 下一步 | `eas-dev-finish`（PASS）/ 修复 P0-P1（FAIL） |

---

**最后更新**：<YYYY-MM-DD>