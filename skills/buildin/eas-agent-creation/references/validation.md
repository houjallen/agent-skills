# Validation 规则 (Validation Rules)

## 概述 (Overview)

本文档定义 SkillSpec 的校验规则，包括通用校验和各模式专属的强校验。

## 1. 通用校验

| 字段 | 规则 | 等级 |
|---|---|---|
| `mode` | 必填，且为 5 个枚举值之一 | error |
| `composition='composed'` | 必须含 1~2 个 `secondaryModes` | error |
| `secondaryModes.length > 2` | 警告 | warn |
| `deliveryChecklist` | 缺失时警告，不阻塞创建 | warn |
| `deliveryChecklist` 任一 false | 列出缺失项 | warn |

## 2. Reviewer 模式强校验

| 规则 | 等级 |
|---|---|
| `reviewer.checklist.filePath` 必填 | error |
| `references/checklist.md` 文件必须存在（解析 ≥ 1 项勾选项） | error |
| `reviewer.process.entry / steps / exit` 三段必填 | error |
| `reviewer.checklist.severityLevels` 必填 | error |
| 清单 0 项警告 | warn |
| 每步 gate 缺失警告（推荐 auto-check） | warn |

## 3. Inversion 模式强校验

| 规则 | 等级 |
|---|---|
| `behavior.gate.phases` 必填（推荐 3 阶段） | error |
| 每个 `phase.questions` 必填且 ≥ 1 题 | error |
| 必答题 options ≥ 2（避免开放问答） | error |
| 每个 `phase.exitGate` 推荐声明 | warn |
| `refuseActionWhenIncomplete: false` 警告（默认应为 true） | warn |

## 4. Pipeline 模式强校验

| 规则 | 等级 |
|---|---|
| `behavior.sequence.steps` 必填且 ≥ 2 步 | error |
| 每步 `gate.entryConditions / exitConditions / onFailure` 三要素必填 | error |
| `dependsOn` 引用必须存在 | error |
| `dependsOn` 不能自引用 | error |
| 依赖图无循环（DFS 检测） | error |
| `reviewer.skillName` 必须存在于 `Skill.all()` | error |

## 5. Composed Skill 校验

| 规则 | 等级 |
|---|---|
| `composed` 时 `secondaryModes` 必填 1~2 个 | error |
| `secondaryModes.length > 2` 警告（最多 3 模式） | warn |
| action-side 组合（含 reviewer/inversion/pipeline）必须声明 `compositionConnections` | warn |

## 6. Skill 间依赖闭包校验

| 规则 | 等级 |
|---|---|
| `requires` 引用的 Skill 必须存在 | error |
| `conflicts` 加载时检测冲突并警告 | warn |
| 加载顺序按拓扑排序（`requires` 在前） | — |

## 7. 依赖关系语义

| 关系类型 | 语义 | 落地 |
|---|---|---|
| **`references/`** | 文档引用（信息层） | 仅 SKILL.md 内容读取，不强制加载 |
| **`requires`** | 硬依赖（功能层） | 必须先加载依赖 Skill 才能用 |
| **`conflicts`** | 互斥（互斥层） | 与某 Skill 互斥，禁止同时加载 |
| **`suggests`** | 软推荐（推荐层） | 建议同时加载但不强制 |

## 8. 校验示例

### 正确的 Reviewer SkillSpec

```yaml
mode: reviewer
reviewer:
  checklist:
    filePath: ./references/checklist.md
    severityLevels: [critical, high, medium, low]
  process:
    entry: 读取待审查代码
    steps:
      - id: check-naming
        name: 检查命名规范
        checklistSection: §1 命名规范
    exit: 输出结构化 JSON
```

### 错误的 Reviewer SkillSpec（缺少 checklist.filePath）

```yaml
mode: reviewer
reviewer:
  checklist:
    # filePath 缺失 → error
    severityLevels: [critical, high, medium, low]
  process:
    entry: 读取待审查代码
    steps: []
    exit: 输出结果
```

### 错误的 Pipeline SkillSpec（Gate 三要素不全）

```yaml
mode: pipeline
behavior:
  sequence:
    - id: step1
      name: 解析输入
      kind: parse
      gate:
        # entryConditions 缺失 → error
        # exitConditions 缺失 → error
        # onFailure 缺失 → error
```
