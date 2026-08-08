---
name: eas-dev-tdd
description: 该技能应在用户按 TDD 方式实现单个任务（"TDD" / "红-绿-重构" / "写测试先行" / "tdd"）时使用。基于 `eas-dev-plan` 的单个任务，严格执行红-绿-重构循环：1) 写失败测试（MUST 失败）；2) 写最小实现代码（MUST 让测试通过）；3) 重构（MUST 不破坏测试）。含测试反模式库（私有状态 / 过度 mock / 不测实现 / 测试替身等）。
mode: Technique
composition: standalone
behavior:
  sequence:
    steps:
      - id: red-write-failing-test
        name: 红灯：写失败测试
        gate:
          rule: "测试 MUST 失败才能进入下一步；不许写实现前让测试通过"
          severity: must
      - id: green-minimal-implementation
        name: 绿灯：写最小实现
        gate:
          rule: "实现 MUST 最小；不许写超出测试范围的代码"
          severity: must
      - id: refactor-improve
        name: 重构：改进代码
        gate:
          rule: "重构 MUST 不破坏测试；测试必须全绿"
          severity: must
metadata:
  category: dev
  version: 1.0.0
  author: EASBot
  compatibility: claude-code / codex / gemini-cli / 其他支持 Skill 协议的 Agent
  tags:
    - eas-dev
    - technique
    - tdd
    - red-green-refactor
    - testing
---

# eas-dev-tdd - TDD 实现 (Test-Driven Development)

> **分类位置**：`skills/dev/`（独立 dev 分类，**不**进 `eas-skill-using` 索引）
> **必填字段**：`name` / `description` / `mode=Technique` / `composition=standalone` / `behavior.sequence.steps` (3 必答 gate) / `metadata.category=dev`
> **对应规划任务**：T-005 / 0014 决策

---

## 概述 (Overview)

`eas-dev-tdd` 按 TDD 红-绿-重构循环实现单个任务。Technique 模式：3 步固定序列 + 3 道强制 Gate（每步必答）+ 测试反模式库，确保"测试先行、最小实现、持续重构"的核心约束。

**不做什么**：

- ❌ 不拆任务（任务粒度由 `eas-dev-plan` 决定）
- ❌ 不做多任务调度（多任务由 `eas-dev-implement` 调度）
- ❌ 不评审（评审由 `eas-dev-review` 处理）
- ❌ 不跳过 Gate 步骤（违反 TDD 根本原则）

## 何时使用 (When to Use)

**该技能应在以下情况使用**：

- 用户说 "TDD" / "红-绿-重构" / "写测试先行" / "tdd"
- 单个 `eas-dev-plan` 任务的实现
- 需要确保测试覆盖的行为
- 团队 / 项目约定 TDD 是默认实现方式

**不适用于**：

- ❌ 已有代码的功能修改（先写测试不适用；走 `eas-dev-diagnose`）
- ❌ 一次性脚本 / 调试代码（无需测试）
- ❌ UI 原型快速验证（先原型后测试）
- ❌ 配置文件 / 文档（无需测试）

## 快速参考 (Quick Reference)

| 项 | 内容 |
|---|---|
| 模式 | Technique（3 步固定序列） |
| 输入契约 | `tasks.md` 中单个任务（7 字段齐全） |
| 输出契约 | 测试代码 + 实现代码 + commit 历史 |
| 序列步骤 | 红 → 绿 → 重构（`behavior.sequence.steps`） |
| Gate 数量 | 3 道 must（每步 1 道） |
| 必读 references | [references/red-green-refactor.md](references/red-green-refactor.md) / [references/testing-anti-patterns.md](references/testing-anti-patterns.md) |
| 失败处理 | Gate 失败 → MUST 报错并指出当前步骤 |

## 第一性原理 (First Principles)

> **"测试是规约，不是验证"** —— TDD 核心

**目的**：

1. **设计先行**：写测试 = 设计 API（接口契约先于实现）
2. **反馈速率**：测试先写 = 写实现时立即验证（无空跑）
3. **重构信心**：测试在 = 重构不怕破坏

**判断标准**：

1. **测试是否先于实现？** → 必须
2. **测试是否真的失败过？** → 必须（不许"测试先写但实现已经能通过"）
3. **实现是否最小？** → 必须（不许超出测试范围写代码）

## 红-绿-重构 3 步序列 (Red-Green-Refactor)

### Step 1: 红灯 (Red) - 写失败测试

**动作**：

1. 读任务 acceptance_steps
2. 写测试覆盖每条 acceptance
3. 运行测试 → MUST 失败
4. 验证失败原因是"功能未实现"而非"测试代码错误"

**Gate**：

```yaml
gate:
  rule: "测试 MUST 失败才能进入下一步"
  severity: must
```

**反模式**：

- ❌ 写测试但实现已经能通过（测试无效）
- ❌ 测试因为语法错误 / import 错误失败（不算 TDD）
- ❌ 跳过红灯直接绿灯（失去 TDD 价值）

### Step 2: 绿灯 (Green) - 写最小实现

**动作**：

1. 写最小代码让测试通过
2. 运行测试 → MUST 通过
3. 不写超出测试范围的代码（YAGNI）

**Gate**：

```yaml
gate:
  rule: "实现 MUST 最小；不许写超出测试范围的代码"
  severity: must
```

**反模式**：

- ❌ "顺便" 实现其他功能（YAGNI 违反）
- ❌ 重构（在绿灯阶段 = 抢重构的活）
- ❌ 不运行测试就 commit

### Step 3: 重构 (Refactor) - 改进代码

**动作**：

1. 改进代码结构（命名 / 提取函数 / 消除重复）
2. 运行测试 → MUST 仍通过
3. 重复直到满意

**Gate**：

```yaml
gate:
  rule: "重构 MUST 不破坏测试"
  severity: must
```

**反模式**：

- ❌ 改逻辑（重构 = 不改逻辑，只改结构）
- ❌ 添加新功能（不是重构）
- ❌ 不运行测试就 commit

## 输入契约 (Input Contract)

| 项 | 要求 |
|---|---|
| 必备 | `tasks.md` 中单个任务（含 7 字段） |
| 可选 | spec.md（参考验收标准） |
| 拒绝 | 任务超 5 分钟（MUST 回 `eas-dev-plan` 拆分） |

## 输出契约 (Output Contract)

- **测试代码**：`tests/<...>.test.ts` 或同目录 `.test.ts`
- **实现代码**：`src/<...>.ts`
- **commit 历史**：3 步 × 1 commit = 3 commits（或合并为 1 个合规 commit）

**commit 模板**：

```
test(<scope>): red light for <feature>
（写失败测试，验证失败）
```

```
feat(<scope>): green light for <feature>
（最小实现，让测试通过）
```

```
refactor(<scope>): <description>
（重构，测试仍全绿）
```

## 测试反模式库 (Anti-Patterns)

详见 [references/testing-anti-patterns.md](references/testing-anti-patterns.md)。

**5 大反模式**：

1. **私有状态测试**：测试依赖类的私有字段（应测行为而非状态）
2. **过度 mock**：mock 所有依赖（应仅 mock 边界）
3. **不测实现**：测试调用顺序而非结果（应测可观察行为）
4. **测试替身**：用真实 DB / API 跑测试（应仅在 seam test 用）
5. **测试代码本身的反模式**：跳过 / `.skip` 遗留 / 不清理的 setup

## 失败处理 (Failure Handling)

| 情况 | 动作 |
|---|---|
| 红灯阶段测试不失败 | 报错"测试无法失败 = 无法进入 TDD 循环" |
| 绿灯阶段超出最小 | 报错"实现超出测试范围" |
| 重构阶段破坏测试 | 报错"重构改变了行为；回滚逻辑改动" |
| 任务超 5 分钟 | 报错"颗粒度过粗；回 `eas-dev-plan` 拆分" |

## 常见错误 (Common Mistakes)

| ❌ 不要 | ✅ 应该 |
|---|---|
| 跳过红灯阶段 | TDD 价值 = 红灯验证测试有效性 |
| 绿灯阶段"顺便"加功能 | YAGNI；下个迭代再说 |
| 重构阶段改逻辑 | 重构 = 不改逻辑；改逻辑 = 新功能 |
| 测试覆盖 100% | 测试覆盖 = 行为覆盖；100% 行覆盖 ≠ 100% 行为 |
| 测试用真实 DB | 用 testcontainers / 内存数据库 |

## 下一步 (Next Steps)

| 下游技能 | 何时使用 |
|---|---|
| `eas-dev-review` | 单个任务完成后，进入 PR review |
| `eas-dev-implement` | 多任务 TDD 自动调度 |
| `eas-dev-finish` | 所有任务完成，进入收尾发布 |

## 参考资料 (References)

- [references/red-green-refactor.md](references/red-green-refactor.md) —— 3 步详解
- [references/testing-anti-patterns.md](references/testing-anti-patterns.md) —— 测试反模式库

## 与其他技能的关系 (Relationships)

| 技能 | 关系 |
|---|---|
| `eas-dev-plan` | **上游**：tasks.md 是 TDD 的输入 |
| `eas-dev-review` | **下游**：TDD 完成后进入 review |
| `eas-dev-implement` | **平行**：implement 内部调用 tdd |
| `eas-dev-finish` | **下游**：所有 TDD 完成后进入收尾 |
| `eas-dev-loop` | **上游**：loop 内每任务实现 = tdd |
| `eas-skill-creator` | **规范基线**：本技能遵循其结构 + 5 大模式 + frontmatter 规范 |
| `eas-skill-using` | **不重叠**：dev 分类不进索引 |

---

**最后更新**：2026-08-08