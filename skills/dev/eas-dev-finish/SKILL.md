---
name: eas-dev-finish
description: 该技能应在代码完成后进入收尾发布（"合并" / "merge" / "发 PR" / "发布" / "finish" / "deploy" / "ship"）时使用。Technique 模式：7 步收尾 checklist（测试全绿 → 评审通过 → 文档同步 → PR 创建 → merge → 部署 → 通知）。MUST 按顺序执行；任一步未完成 MUST 报错。
mode: Technique
composition: standalone
scope: coder
behavior:
  sequence:
    steps:
      - id: tests-green
        name: 测试全绿
        gate:
          rule: "所有测试 MUST 通过（单测 / 集成 / E2E）"
          severity: must
      - id: review-passed
        name: 评审通过
        gate:
          rule: "review.md 状态 = PASS（P0 = 0；P1 修复或豁免）"
          severity: must
      - id: docs-synced
        name: 文档同步
        gate:
          rule: "README / API 文档 / CHANGELOG MUST 同步（如接口变更）"
          severity: must
      - id: pr-created
        name: PR 创建
        gate:
          rule: "PR 描述 MUST 含 spec 链接 + review 链接 + 测试计划"
          severity: must
      - id: merge-decision
        name: merge 决策
        gate:
          rule: "MUST 询问用户 merge 策略（merge commit / squash / rebase）"
          severity: must
      - id: deploy
        name: 部署（如适用）
        gate:
          rule: "CI MUST 通过；deploy MUST 成功；smoke test MUST 通过"
          severity: must
      - id: notify
        name: 通知（如适用）
        gate:
          rule: "相关方 MUST 收到通知（含变更摘要 + 影响范围）"
          severity: must
metadata:
  category: dev
  version: 1.0.0
  author: EASBot
  compatibility: claude-code / codex / gemini-cli / 其他支持 Skill 协议的 Agent
  tags:
    - eas-dev
    - technique
    - finish
    - ship
    - merge
    - deploy
---

# eas-dev-finish - 收尾发布 (Finish & Ship)

> **分类位置**：`skills/dev/`（独立 dev 分类，**不**进 `eas-skill-using` 索引）
> **必填字段**：`name` / `description` / `mode=Technique` / `composition=standalone` / `behavior.sequence.steps` (7 step) / `metadata.category=dev`
> **对应规划任务**：T-009 / 0014 决策

---

## 概述 (Overview)

`eas-dev-finish` 按 7 步 checklist 完成开发闭环的收尾发布。Technique 模式：测试 → 评审 → 文档 → PR → merge → 部署 → 通知，每步 MUST 通过强制 Gate。

**核心原则**："完成 ≠ 部署"（superpowers §"finishing-a-development-branch"）—— 代码 review 通过 ≠ 已发布。

**不做什么**：

- ❌ 不写代码（代码已 review PASS）
- ❌ 不评审（review 已 PASS）
- ❌ 不跳步骤（顺序由行为依赖决定）
- ❌ 不自动 merge（必询问用户）

## 何时使用 (When to Use)

**该技能应在以下情况使用**：

- 代码完成 + review PASS 后
- 用户说 "合并" / "merge" / "发 PR" / "发布" / "finish" / "deploy" / "ship"
- 准备合并 feature branch
- 准备部署到 staging / production

**不适用于**：

- ❌ 代码未完成（先 `eas-dev-tdd` / `eas-dev-implement`）
- ❌ review 未 PASS（先修复 P0/P1）
- ❌ hotfix 紧急发布（简化流程；事后补 checklist）
- ❌ 撤销变更 / 回滚（这是 git revert 操作）

## 快速参考 (Quick Reference)

| 项 | 内容 |
|---|---|
| 模式 | Technique（7 步固定序列） |
| 输入契约 | review.md（PASS）+ 代码变更 |
| 输出契约 | PR URL + merge commit + 部署记录 + 通知 |
| 序列步骤 | tests → review → docs → PR → merge → deploy → notify（`behavior.sequence.steps`） |
| Gate 数量 | 7 道 must（每步 1 道） |
| 必读 references | [references/finish-checklist.md](references/finish-checklist.md) |
| 失败处理 | 任一 Gate 失败 → MUST 报错并指出步骤 |

## 第一性原理 (First Principles)

> **"完成 ≠ 部署"** —— superpowers §"finishing-a-development-branch"

**目的**：

1. **避免"以为发布 = 实际未发布"**：完整 7 步确保每步都实际完成
2. **可追溯**：每步有产出（PR URL / 部署记录 / 通知消息）
3. **可回滚**：merge commit + deploy 记录支持快速回滚

**反模式**：

- ❌ "代码 push 就当发布"（push ≠ deploy）
- ❌ "PR 创建就当完成"（PR ≠ merge ≠ deploy）
- ❌ "代码合了就走"（合了 ≠ 部署 ≠ 通知）

## 7 步详解 (Seven Steps)

### Step 1: tests-green（测试全绿）

**动作**：

1. 跑完整测试套件（单测 / 集成 / E2E）
2. 跑 linter / type-check
3. 验证覆盖率符合 spec 要求

**Gate**：

```yaml
gate:
  rule: "所有测试 MUST 通过"
  severity: must
```

**失败动作**：报错"测试未全绿"；返回失败测试列表。

### Step 2: review-passed（评审通过）

**动作**：

1. 读 review.md
2. 验证 status = PASS
3. 验证 P0 = 0；P1 = 0 或全部豁免

**Gate**：

```yaml
gate:
  rule: "review.md 状态 = PASS"
  severity: must
```

**失败动作**：报错"review 未 PASS"；返回 review.md 路径。

### Step 3: docs-synced（文档同步）

**动作**：

1. 检查接口变更（如有）→ 更新 README / API 文档
2. 更新 CHANGELOG（如有用户可见变更）
3. 清理过期注释

**Gate**：

```yaml
gate:
  rule: "README / API 文档 / CHANGELOG MUST 同步"
  severity: must
```

**失败动作**：报错"文档未同步"；返回过期项列表。

### Step 4: pr-created（PR 创建）

**动作**：

1. 用 gh / git CLI 创建 PR
2. 写 PR 描述：spec 链接 + review 链接 + 测试计划 + 验收摘要

**Gate**：

```yaml
gate:
  rule: "PR 描述 MUST 含 spec 链接 + review 链接 + 测试计划"
  severity: must
```

**失败动作**：报错"PR 描述不完整"；返回缺失字段。

### Step 5: merge-decision（merge 决策）

**动作**：

1. **MUST 询问用户** merge 策略（merge commit / squash / rebase）
2. 询问是否需要 code owner review（如果未设置）
3. 根据用户决策执行 merge

**Gate**：

```yaml
gate:
  rule: "MUST 询问用户 merge 策略"
  severity: must
```

**失败动作**：报错"未询问用户"；列出可选策略。

### Step 6: deploy（如适用）

**动作**：

1. 等待 CI 通过
2. 触发部署（手动 / 自动）
3. 验证 smoke test 通过

**Gate**：

```yaml
gate:
  rule: "CI MUST 通过；deploy MUST 成功；smoke test MUST 通过"
  severity: must
```

**失败动作**：报错"部署失败"；返回失败步骤；建议回滚。

### Step 7: notify（如适用）

**动作**：

1. 通知相关方（团队 / 客户 / 监控）
2. 通知内容：变更摘要 + 影响范围 + 回滚方案

**Gate**：

```yaml
gate:
  rule: "相关方 MUST 收到通知"
  severity: must
```

**失败动作**：报错"通知失败"；返回未送达列表。

## 输入契约 (Input Contract)

| 项 | 要求 |
|---|---|
| 必备 | `review.md`（status = PASS） |
| 必备 | 测试报告（status = passed） |
| 可选 | 部署平台 / 通知渠道配置 |
| 拒绝 | review 未 PASS 或测试未全绿（NEVER） |

## 输出契约 (Output Contract)

**收尾产物分组 `finish/`**（dev 技能通用默认；宿主项目可在自有 `.easbot/AGENTS.md` 中声明覆盖）：

| 产物 | 路径 |
|---|---|
| **PR 描述 / URL** | `<cwd>/.easbot/knowledge/docs/dev/<topic>/finish/pr.md` |
| **merge 决策 / commit** | `<cwd>/.easbot/knowledge/docs/dev/<topic>/finish/merge.md` |
| **部署记录 / smoke test** | `<cwd>/.easbot/knowledge/docs/dev/<topic>/finish/deploy.md` |
| **通知消息**（按需） | `<cwd>/.easbot/knowledge/docs/dev/<topic>/finish/notify.md` |

**禁止路径**（会污染版本控制）：

- ❌ `<cwd>/pr.md` / `<cwd>/deploy.md` 等仓库根平级位置
- ❌ 任何 `<cwd>/docs/` 子目录（`docs/` 是发布文档目录，禁止 dev 中间产物落地）

**`<topic>` 命名**：kebab-case，≤ 64 字符。

**frontmatter 必含字段**：

- `pr.md`：`topic` / `phase: finish` / `pr_url` / `merged_at` / `merge_strategy`
- `merge.md`：`topic` / `phase: finish` / `merge_commit` / `decision_made_by`
- `deploy.md`：`topic` / `phase: finish` / `deploy_env` / `deploy_at` / `smoke_test_status`

## 失败处理 (Failure Handling)

| 情况 | 动作 |
|---|---|
| 任一 Gate 失败 | 报错 + 指出步骤；状态保存 |
| CI 失败 | 回滚部署；报给用户 |
| 部署失败 | 立即回滚；记录原因 |
| 通知失败 | 重试一次；仍失败则记录待人工处理 |

## 常见错误 (Common Mistakes)

| ❌ 不要 | ✅ 应该 |
|---|---|
| 跳过文档同步 | 文档 = 用户契约；必同步 |
| 自动 merge | 必询问用户 |
| 部署后不通知 | 通知 = 让相关方知情 |
| 部署失败不回滚 | 必立即回滚 |
| "完成" = push | 完成 ≠ merge ≠ deploy |

## 下一步 (Next Steps)

| 下游动作 | 何时使用 |
|---|---|
| 关闭任务 | 收尾完成；归档文档 |
| 开始新需求 | 回到 `eas-dev-align` |
| 监控生产 | 部署后观察 |

## 参考资料 (References)

- [references/finish-checklist.md](references/finish-checklist.md) —— 7 步详细 checklist

## 与其他技能的关系 (Relationships)

| 技能 | 关系 |
|---|---|
| `eas-dev-review` | **上游**：review PASS 是入口 |
| `eas-dev-tdd` | **上游**：测试全绿是入口 |
| `eas-dev-implement` | **上游**：任务完成是入口 |
| `eas-dev-loop` | **上游**：loop 收尾阶段 |
| `eas-skill-creator` | **规范基线**：本技能遵循其结构 + 5 大模式 + frontmatter 规范 |
| `eas-skill-using` | **不重叠**：dev 分类不进索引 |

---

**最后更新**：2026-08-08