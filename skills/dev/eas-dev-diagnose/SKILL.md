---
name: eas-dev-diagnose
description: 该技能应在用户报告 bug / 需要诊断时（"有 bug" / "调试" / "诊断" / "复现" / "debug" / "investigate" / "线上问题"）使用。Technique 模式：4 阶段根因分析（复现 → 定位 → 修复 → 回归）。NEVER 跳过复现；NEVER 直接给方案；根因未明不许动手。
mode: Technique
composition: standalone
scope: coder
behavior:
  sequence:
    steps:
      - id: reproduce
        name: 复现：最小重现用例
        gate:
          rule: 'MUST 有可重现的最小用例；无复现 = 不可修复'
          severity: must
        strong_constraints:
          - id: never-skip-reproduce
            text: 'NEVER 跳过复现阶段'
            severity: must
      - id: locate
        name: 定位：找根因（不是症状）
        gate:
          rule: 'MUST 找到根因；不许只解释症状'
          severity: must
        strong_constraints:
          - id: never-direct-fix
            text: 'NEVER 未定位根因直接给修复方案'
            severity: must
      - id: fix
        name: 修复：最小变更 + 解释
        gate:
          rule: 'MUST 最小变更；MUST 解释为什么这是根因而非症状修复'
          severity: must
      - id: regression
        name: 回归：加测试防止再犯
        gate:
          rule: 'MUST 加回归测试；MUST 验证修复前后行为差异'
          severity: must
metadata:
  category: dev
  version: 1.0.0
  author: EASBot
  compatibility: claude-code / codex / gemini-cli / 其他支持 Skill 协议的 Agent
  tags:
    - eas-dev
    - technique
    - debug
    - diagnose
    - root-cause
    - 4-phases
---

# eas-dev-diagnose - 诊断调试 (Diagnostic Debugging)

> **分类位置**：`skills/dev/`（独立 dev 分类，**不**进 `eas-skill-using` 索引）
> **必填字段**：`name` / `description` / `mode=Technique` / `composition=standalone` / `behavior.sequence.steps` (4 step) + `strong_constraints` (2 NEVER) / `metadata.category=dev`
> **对应规划任务**：T-008 / 0014 决策

---

## 概述 (Overview)

`eas-dev-diagnose` 按 4 阶段根因分析流程调试 bug。Technique 模式：复现 → 定位 → 修复 → 回归，每步 MUST 通过强制 Gate。**核心约束**：`NEVER 跳过复现` / `NEVER 未定位根因直接给方案`。

**不做什么**：

- ❌ 不添加新功能（bug 修复 ≠ 新功能）
- ❌ 不重构（除非根因指向架构问题）
- ❌ 不跳过复现（无可重现 = 不可修复）
- ❌ 不直接给修复方案（必先定位根因）

## 何时使用 (When to Use)

**该技能应在以下情况使用**：

- 用户报告 bug / 异常行为
- 用户说 "调试" / "诊断" / "复现" / "debug" / "investigate"
- 线上事故排查
- 性能回归 / 数据异常
- 测试失败但原因不明

**不适用于**：

- ❌ 功能添加（走 `eas-dev-align` → `eas-dev-spec` → ...）
- ❌ 已知原因的简单修复（已知根因 = 直接修）
- ❌ 用户体验问题（非 bug 类，走 `eas-dev-align`）
- ❌ 性能优化（先定位瓶颈，再走 diagnose 流程）

## 快速参考 (Quick Reference)

| 项              | 内容                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 模式            | Technique（4 阶段固定序列）                                                                                                                 |
| 输入契约        | bug 报告（现象 / 触发条件 / 期望行为 / 实际行为）                                                                                           |
| 输出契约        | `diagnose.md`（复现 / 定位 / 修复 / 回归 4 章节）                                                                                           |
| 序列步骤        | reproduce → locate → fix → regression（`behavior.sequence.steps`）                                                                          |
| 强约束          | 2 条 NEVER：`NEVER 跳过复现` / `NEVER 直接给方案`                                                                                           |
| 必读 references | [references/4-phases.md](references/4-phases.md) / [references/anti-patterns-symptom-fixing.md](references/anti-patterns-symptom-fixing.md) |

## 第一性原理 (First Principles)

> **"修症状 = 不修"** —— superpowers §"systematic-debugging"

**判断标准**：

1. **找到根因了吗？** → 是 → 进入修复；否 → 继续定位
2. **修复后能解释"为什么这是根因"吗？** → 是 → 修复有效；否 → 可能只是症状修复
3. **回归测试能防再犯吗？** → 是 → 完成；否 → 补测试

**反模式**：

- ❌ "重启试试"（无复现 = 无验证 = 无修复）
- ❌ "换个 API 试试"（未理解根因 = 赌博）
- ❌ "加 try/catch"（吞掉错误 ≠ 修复）
- ❌ "加日志看看"（观测 ≠ 修复）

## 4 阶段详解 (Four Phases)

### Phase 1: 复现 (Reproduce)

**目标**：造一个**最小可重现用例**（Minimal Reproducible Case, MRC）。

**动作**：

1. 收集现象：用户报告的具体表现（错误信息 / 异常行为 / 性能数据）
2. 收集触发条件：环境 / 输入 / 时间 / 数据状态
3. 写最小复现：剥离无关变量，用最小输入重现
4. 验证：可重复触发；触发条件确定

**Gate**：

```yaml
gate:
  rule: 'MUST 有可重现的最小用例'
  severity: must
```

**强约束**：`NEVER 跳过复现阶段`。

**复现产出**：

```yaml
mrc:
  description: <一句话描述>
  input: <最小输入>
  expected: <期望行为>
  actual: <实际行为>
  trigger_rate: <必现 / 概率 / 特定条件>
  environment: <环境信息>
  steps:
    - <步骤 1>
    - <步骤 2>
    - <步骤 3>
```

### Phase 2: 定位 (Locate)

**目标**：找到**根因**（root cause），不是症状（symptom）。

**动作**：

1. **区分症状与根因**：
   - 症状：用户可见的现象（如"500 错误"）
   - 根因：导致症状的根本原因（如"SQL 查询缺少索引 → 全表扫描 → 超时 → 500"）
2. **逐层排查**：
   - 用户层：操作 / 输入
   - 应用层：代码逻辑 / 状态
   - 数据层：DB / 缓存 / 队列
   - 基础设施：网络 / 资源 / 依赖
3. **验证根因**：根据根因推演，能解释所有症状；移除根因 = 症状消失

**Gate**：

```yaml
gate:
  rule: 'MUST 找到根因'
  severity: must
```

**强约束**：`NEVER 未定位根因直接给修复方案`。

**定位产出**：

```yaml
root_cause:
  description: <一句话根因>
  layer: <user / application / data / infrastructure>
  evidence: <证据：日志 / 调用栈 / 数据 / 实验>
  why_symptoms_explainable: <此根因如何解释所有症状>
```

### Phase 3: 修复 (Fix)

**目标**：**最小变更**修复根因。

**动作**：

1. 写最小代码改动（消除根因）
2. 解释"为什么这是根因修复而非症状修复"
3. 验证：复现用例触发 → 行为正确

**Gate**：

```yaml
gate:
  rule: 'MUST 最小变更；MUST 解释根因修复'
  severity: must
```

**修复产出**：

```yaml
fix:
  change_type: <code / config / data / infra>
  files: <改动文件>
  diff_summary: <一句话改动>
  why_root_cause_fix: <为什么这是根因修复>
  why_not_symptom_fix: <为什么不是症状修复（如"加 try/catch"）>
```

### Phase 4: 回归 (Regression)

**目标**：加测试**防止再犯**。

**动作**：

1. 写回归测试（覆盖复现用例 + 根因触发条件）
2. 验证测试在修复前失败、修复后通过
3. 加监控 / 告警（视情况）

**Gate**：

```yaml
gate:
  rule: 'MUST 加回归测试；MUST 验证修复前后行为差异'
  severity: must
```

**回归产出**：

```yaml
regression_test:
  test_file: <测试文件>
  test_name: <测试名>
  before_fix_behavior: <修复前：测试失败>
  after_fix_behavior: <修复后：测试通过>
  monitoring: <可选：新增监控指标>
```

## 输入契约 (Input Contract)

| 项   | 要求                                |
| ---- | ----------------------------------- |
| 必备 | bug 现象描述（用户原话 / 错误信息） |
| 必备 | 触发条件（何时发生 / 频率）         |
| 必备 | 期望行为 vs 实际行为                |
| 可选 | 日志 / 调用栈 / 截图                |
| 可选 | 已有的修复尝试                      |

## 输出契约 (Output Contract)

**必须产出 `diagnose.md`**，落地路径规范（dev 技能通用默认；宿主项目可在自有 `.easbot/AGENTS.md` 中声明覆盖）：

| 场景               | 路径                                                   |
| ------------------ | ------------------------------------------------------ |
| **项目级（推荐）** | `<cwd>/.easbot/knowledge/docs/dev/<topic>/diagnose.md` |
| **临时 / 探索性**  | `<cwd>/.easbot/state/dev-scratch-<topic>-diagnose.md`  |

**禁止路径**（会污染版本控制）：

- ❌ `<cwd>/diagnose.md`（仓库根，会入仓）
- ❌ `<cwd>/diagnoses/...`（仓库根平级，会入仓）

**`<topic>` 命名**：kebab-case，≤ 64 字符；bug 类推荐用 `fix-<topic>` 前缀（如 `fix-cache-stampede`）。

**frontmatter 必含字段**：`topic` / `phase: diagnose` / `status: investigating|fixed|closed` / `severity: P0|P1|P2` / `reproduction_mrc`（最小复现用例引用） / `created_at` / `updated_at`。

**必含 4 章节**：

1. 复现 (Reproduce) —— MRC 详情
2. 定位 (Locate) —— 根因 + 证据
3. 修复 (Fix) —— 最小变更 + 解释
4. 回归 (Regression) —— 回归测试 + 监控

## 失败处理 (Failure Handling)

| 情况                   | 动作                                  |
| ---------------------- | ------------------------------------- |
| 无法复现               | 报错"无可重现 = 不可修复"；NEVER 跳过 |
| 根因不明确             | 继续 Phase 2；NEVER 猜根因            |
| 修复无效               | 回 Phase 2 重新定位                   |
| 回归测试在修复前已通过 | 测试无效；NEVER commit                |

## 常见错误 (Common Mistakes)

| ❌ 不要              | ✅ 应该                     |
| -------------------- | --------------------------- |
| 跳过复现直接猜根因   | 先复现；无可重现 = 不可修复 |
| 把症状当根因         | 区分症状 vs 根因；逐层排查  |
| 大范围改动           | 最小变更；不动无关代码      |
| 修复不加测试         | MUST 加回归测试             |
| 修复后未验证复现用例 | 修复后 MUST 跑复现用例确认  |

## 下一步 (Next Steps)

| 下游技能         | 何时使用                      |
| ---------------- | ----------------------------- |
| `eas-dev-tdd`    | 修复需要新建模块 / 大量改动   |
| `eas-dev-review` | 修复完成后进入 review         |
| `eas-dev-finish` | 修复 + review PASS 后进入收尾 |

## 参考资料 (References)

- [references/4-phases.md](references/4-phases.md) —— 4 阶段详解 + 示例
- [references/anti-patterns-symptom-fixing.md](references/anti-patterns-symptom-fixing.md) —— 修症状反模式库

## 与其他技能的关系 (Relationships)

| 技能                | 关系                                                         |
| ------------------- | ------------------------------------------------------------ |
| `eas-dev-tdd`       | **下游**：修复如需新建模块 / 大量改动走 TDD                  |
| `eas-dev-review`    | **下游**：修复完成后 review                                  |
| `eas-dev-finish`    | **下游**：修复 + review 后收尾                               |
| `eas-dev-loop`      | **平行**：loop 不自动触发 diagnose（bug 需人工启动）         |
| `eas-skill-creator` | **规范基线**：本技能遵循其结构 + 5 大模式 + frontmatter 规范 |
| `eas-skill-using`   | **不重叠**：dev 分类不进索引                                 |

---

**最后更新**：2026-08-08
