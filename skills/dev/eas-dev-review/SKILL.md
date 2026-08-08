---
name: eas-dev-review
description: 该技能应在代码完成后、提交 PR 前调用（"评审" / "code review" / "审查" / "review" / "PR 检查"）时使用。基于 spec / design 产出两轴评审（标准轴 / spec 轴），按 P0/P1/P2 分级输出 `review.md`。P0 阻止提交；P1 必须修复或显式豁免；P2 后续处理。
mode: Reviewer
composition: standalone
behavior:
  review_axes:
    - id: standards
      name: 标准轴
      description: "代码风格 / 命名 / 错误处理 / 性能 / 安全"
      severity_scale:
        - P0: "安全漏洞 / 不可逆数据丢失 / 生产事故风险"
        - P1: "风格严重违规 / 命名混乱 / 错误处理缺失 / 性能瓶颈"
        - P2: "小风格问题 / 可读性建议 / 文档不足"
    - id: spec
      name: spec 轴
      description: "忠实实现 / 接口契约 / 验收覆盖 / Out-of-Scope 守纪"
      severity_scale:
        - P0: "未实现 acceptance criteria / 接口契约不符 / 越界做 out-of-scope"
        - P1: "部分 AC 缺失 / 验收覆盖不全 / 接口偏离但有理由"
        - P2: "AC 实现但缺文档 / 测试覆盖略低"
  blocking_rules:
    - id: p0-blocks-merge
      rule: "P0 数量 > 0 → MUST 阻止合并"
      severity: must
metadata:
  category: dev
  version: 1.0.0
  author: EASBot
  compatibility: claude-code / codex / gemini-cli / 其他支持 Skill 协议的 Agent
  tags:
    - eas-dev
    - reviewer
    - code-review
    - pr-review
    - two-axis
---

# eas-dev-review - 代码评审 (Code Review)

> **分类位置**：`skills/dev/`（独立 dev 分类，**不**进 `eas-skill-using` 索引）
> **必填字段**：`name` / `description` / `mode=Reviewer` / `composition=standalone` / `behavior.review_axes` (2 axes × 3 severities) / `behavior.blocking_rules` (1 must) / `metadata.category=dev`
> **对应规划任务**：T-007 / 0014 决策

---

## 概述 (Overview)

`eas-dev-review` 对代码变更进行两轴评审：标准轴（代码质量）+ spec 轴（忠实度）。Reviewer 模式：固定分级输出 P0/P1/P2，附 blocking 规则确保 P0 阻止合并。

**不做什么**：

- ❌ 不改代码（产出 `review.md` 让作者改）
- ❌ 不评审自己写的代码（受 superpowers §"receiving-code-review" 启发）
- ❌ 不替代 CI（lint / type-check / 单测）；本技能聚焦**人工视角**的代码评审
- ❌ 不评审设计 / 架构（那是 `eas-dev-design` 自身的反思；code review 是实现层）

## 何时使用 (When to Use)

**该技能应在以下情况使用**：

- 代码完成后、提交 PR 前
- PR review 时（reviewer 视角）
- 多人协作前自查
- 重要功能发布前最后一次评审

**不适用于**：

- ❌ 一次性脚本 / 小工具
- ❌ typo 修复 / 单行改动
- ❌ 紧急 hotfix（评审推迟；commit 后再补）
- ❌ spec / design 还没确认（先回前置技能）

## 快速参考 (Quick Reference)

| 项 | 内容 |
|---|---|
| 模式 | Reviewer（两轴评审 + P0/P1/P2 分级） |
| 输入契约 | 代码 diff + spec.md / design.md（spec 轴必需；标准轴可选） |
| 输出契约 | `review.md`（P0/P1/P2 列表 + 具体修复建议） |
| 评审轴 | 标准轴 + spec 轴（`behavior.review_axes`） |
| 分级 | P0（阻止合并）/ P1（修复或豁免）/ P2（后续处理） |
| Blocking 规则 | P0 > 0 → MUST 阻止合并（`behavior.blocking_rules`） |
| 必读 references | [references/checklist.md](references/checklist.md) |
| 必含 assets | [assets/review-template.md](assets/review-template.md) |

## 第一性原理 (First Principles)

> **"评审 = 知识传递，不是审判"** —— PR 评审文化核心理念

**目的**：

- 防止"通过 CI 但生产事故"的代码进入主分支
- 跨人传递领域知识（reviewer 通过评审了解新代码）
- 保持代码风格一致性

**反模式**：

- ❌ "为了评而评"（挑剔小风格 = 噪音）
- ❌ "审判作者"（人身攻击 = 反团队）
- ❌ "一次大改"（应拆为多个小评审）

## 两轴评审 (Two-Axis Review)

### 轴 1：标准轴 (Standards)

**关注**：代码本身的质量

| 类别 | 检查项 | P0 | P1 | P2 |
|---|---|---|---|---|
| **安全** | SQL 注入 / XSS / CSRF / 硬编码密钥 | ✓ | | |
| **错误处理** | 异常未捕获 / 错误信息泄漏敏感数据 | | ✓ | |
| **性能** | N+1 查询 / O(n²) 循环 / 内存泄漏 | | ✓ | |
| **命名** | 命名混乱 / 缩写 / 不一致 | | ✓ | |
| **风格** | 与项目风格不符 / linter 警告 | | | ✓ |
| **可读性** | 复杂逻辑无注释 / 嵌套过深 | | | ✓ |

### 轴 2：spec 轴 (Spec Compliance)

**关注**：是否忠实实现 spec / design

| 类别 | 检查项 | P0 | P1 | P2 |
|---|---|---|---|---|
| **接口契约** | 与 spec.md §3 一致 | ✓ | | |
| **AC 覆盖** | 所有 acceptance_criteria 已实现 + 验证 | ✓ | | |
| **范围守纪** | 未做 out-of-scope 工作 | ✓ | | |
| **设计遵循** | 遵循 design.md 模块边界 | | ✓ | |
| **文档同步** | spec / design 有变更时 README 同步 | | | ✓ |
| **测试覆盖** | spec 中 acceptance 含 test-coverage 类型时达标 | | ✓ | |

## P0/P1/P2 分级 (Severity Levels)

### P0 (Blocker)

**判定**：阻塞合入；MUST 修复；不允许豁免

**示例**：

- 安全漏洞（SQL 注入 / XSS）
- 数据丢失风险
- spec 中 P0 验收项未实现
- 越界实现 out-of-scope

**流程**：P0 > 0 → MUST 阻止 PR 合入 → 作者修复 → 重新评审

### P1 (Must Fix or Exempt)

**判定**：必须修复；如不修复 MUST 显式豁免（在 review.md 中写明理由）

**示例**：

- 命名混乱 / 不一致
- 错误处理缺失（边界情况未覆盖）
- 部分 AC 缺失

**流程**：P1 > 0 → 作者选择"修复"或"豁免"；豁免 MUST 在 review.md 写明理由

### P2 (Nice to Fix)

**判定**：建议修复；可后续 PR 处理

**示例**：

- 小风格问题
- 可读性建议
- 文档不足

**流程**：P2 > 0 → 记录在 review.md；不阻止合入；后续 PR 处理

## 输入契约 (Input Contract)

| 项 | 要求 |
|---|---|
| 必备 | 代码 diff（git diff / patch 文件） |
| 必备（spec 轴） | spec.md（`status: confirmed`） |
| 可选（spec 轴） | design.md |
| 可选 | 项目级 CONTRIBUTING.md / 风格指南 |
| 拒绝 | 无 diff 或无 spec（NEVER；无法评审） |

## 输出契约 (Output Contract)

**必须产出 `review.md`**，路径建议：

- 项目级：`<cwd>/reviews/<topic>-review.md`
- 临时：`<cwd>/review.md`

**必含 5 章节**：

1. **Summary** —— 总体结论（PASS / FAIL）+ P0/P1/P2 计数
2. **Blocking Issues (P0)** —— 必须修复项
3. **Must Fix or Exempt (P1)** —— 修复或豁免
4. **Nice to Fix (P2)** —— 建议项
5. **Strengths** —— 做得好的部分（知识传递）

**模板见** [assets/review-template.md](assets/review-template.md)。

## 失败处理 (Failure Handling)

| 情况 | 动作 |
|---|---|
| 无 diff | 报错"无代码可评审" |
| 无 spec | 标准轴可继续；spec 轴报错"无法验证忠实度" |
| P0 > 0 | MUST 阻止 PR 合入；review.md 状态 = FAIL |
| P1 > 0 且全部豁免 | review.md 状态 = PASS with notes |

## 常见错误 (Common Mistakes)

| ❌ 不要 | ✅ 应该 |
|---|---|
| 评审自己写的代码 | 跳过；让别人评审 |
| 只挑小问题（P2）放过 P0 | P0 > 0 → 必阻止合入 |
| 不给具体修复建议 | 每条问题 MUST 附修复建议 |
| 越界建议（"重写整个模块"） | 评审仅限本次 diff；架构问题走 design 反思 |
| 风格争论不基于 linter | 风格争议 = 引 linter 规则 / 项目风格指南 |

## 下一步 (Next Steps)

| 下游技能 / 动作 | 何时使用 |
|---|---|
| 作者修复 P0 / P1 | review 状态 = FAIL |
| `eas-dev-finish` | review 状态 = PASS 后进入收尾 |
| `eas-dev-diagnose` | review 发现 bug → 转入诊断修复 |
| 用户讨论 | 评审有歧义；展开对话 |

## 参考资料 (References)

- [references/checklist.md](references/checklist.md) —— 标准轴 + spec 轴详细 checklist
- [assets/review-template.md](assets/review-template.md) —— review.md 产出模板

## 与其他技能的关系 (Relationships)

| 技能 | 关系 |
|---|---|
| `eas-dev-spec` | **上游**：spec.md 是 spec 轴对照基线 |
| `eas-dev-design` | **上游**：design.md 是 spec 轴对照基线 |
| `eas-dev-tdd` | **平行**：TDD 写测试时不需要 review；review 在合并前 |
| `eas-dev-finish` | **下游**：review PASS 后进入收尾 |
| `eas-dev-loop` | **上游**：loop 内每任务完成 = 触发 review |
| `eas-skill-creator` | **规范基线**：本技能遵循其结构 + 5 大模式 + frontmatter 规范 |
| `eas-skill-using` | **不重叠**：dev 分类不进索引 |

---

**最后更新**：2026-08-08