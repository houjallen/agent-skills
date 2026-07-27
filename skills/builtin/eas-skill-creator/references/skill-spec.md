# Skill Spec 规范参考 (Skill Spec Specification)

本文档定义 Skill 的类型系统、模式规范与结构化输出模板。

---

## 1. 五大模式快速对照 (Five Mode Quick Reference)

| # | 模式 | 一句话定义 | 典型场景 | 侧别 |
|---|---|---|---|---|
| 1 | **Tool Wrapper** | 给模型补某个库的专家知识 | 补 API/库/工具的最新用法 | 内容侧 |
| 2 | **Generator** | 按固定模板/格式稳定输出 | 报表生成、Schema 化输出、代码脚手架 | 内容侧 |
| 3 | **Reviewer** | 按标准清单逐项核查 | 代码评审、合规审查、Pre-PR 检查 | 行动侧 |
| 4 | **Inversion** | 先问清楚：反向澄清需求 | 模糊需求澄清、关键参数反问 | 行动侧 |
| 5 | **Pipeline** | 不能跳步：流程化多步串联 | 部署流水线、数据 ETL、多阶段审查 | 行动侧 |

---

## 2. 模式选型决策树 (Mode Selection Decision Tree)

```
                 用户需求
                    ↓
        ┌───────────────────────────┐
        │ 1. 是否需要补外部知识？      │ ─Yes─→ Tool Wrapper
        └───────────────────────────┘
                    │ No
        ┌───────────────────────────┐
        │ 2. 输出是否需要固定结构？    │ ─Yes─→ Generator
        └───────────────────────────┘
                    │ No
        ┌───────────────────────────┐
        │ 3. 是否需要按清单逐项核查？  │ ─Yes─→ Reviewer
        └───────────────────────────┘
                    │ No
        ┌───────────────────────────┐
        │ 4. 是否存在歧义需先澄清？    │ ─Yes─→ Inversion
        └───────────────────────────┘
                    │ No
        ┌───────────────────────────┐
        │ 5. 是否必须按顺序多步执行？  │ ─Yes─→ Pipeline
        └───────────────────────────┘
                    │ No
                  （默认基础 Skill）
```

---

## 3. 快速创建流程 (Quick Creation Process)

### 步骤 1：确定模式 (Determine Mode)

根据需求判断技能模式（参考上方决策树）。

### 步骤 2：初始化技能 (Initialize Skill)

使用 `tsx scripts/init-skill.ts <技能名> --path <输出目录> --resources scripts,references,assets --examples` 创建基础结构。

### 步骤 3：编辑文件 (Edit Files)

根据模式填充内容：
- **Tool Wrapper**: 补充 API 速查表、调用示例
- **Generator**: 定义输出模板、校验规则
- **Reviewer**: 编写审查流程 + `references/checklist.md`
- **Inversion**: 设计澄清问题（≤5 必答，每题 2~4 选项）
- **Pipeline**: 定义步骤序列 + Gate 三要素

---

## 4. 每种模式的关键字段 (Mode Key Fields)

### 4.1 Tool Wrapper

**frontmatter 必须字段**：
```yaml
mode: tool-wrapper
composition: single
```

**body 必需内容**：
- 概述 (Overview)
- 何时使用 (When to Use)
- API 速查表 / 调用示例
- 常见错误表 (Pitfall Table)

---

### 4.2 Generator

**frontmatter 必须字段**：
```yaml
mode: generator
composition: single
```

**body 必需内容**：
- 概述 (Overview)
- 何时使用 (When to Use)
- 输出模板（JSON/Markdown/代码）
- 校验规则
- 失败处理

---

### 4.3 Reviewer

**frontmatter 必须字段**：
```yaml
mode: reviewer
composition: single
reviewer:
  checklist:
    filePath: ./references/checklist.md
    severityLevels: [critical, high, medium, low]
  process:
    entry: 读取待审查的代码文件
    steps:
      - id: step-1
        name: 检查项名称
        checklistSection: §1 对应章节
    exit: 输出结构化 JSON 报告
```

**references/checklist.md 必须包含**：
- 按严重程度分级的检查项
- 每项含：通过标准、检查方法（manual/auto）

**输出格式**：
```json
{
  "passed": true | false,
  "failed": ["失败项编号"],
  "severity": ["critical", "high"],
  "comments": { "编号": "说明" }
}
```

---

### 4.4 Inversion

**frontmatter 必须字段**：
```yaml
mode: inversion
composition: single
behavior:
  gate:
    phases:
      - id: phase-1
        name: 阶段名称
        questions:
          - id: q-1
            question: 问题内容
            options:
              - value: opt1
                label: 选项1
            required: true
    refuseActionWhenIncomplete: true
```

**必须遵循**：
- 必答题 ≤ 5 个
- 每题 2~4 个选项
- 全部必答完成才能开始执行

---

### 4.5 Pipeline

**frontmatter 必须字段**：
```yaml
mode: pipeline
composition: single
behavior:
  sequence:
    steps:
      - id: step-1
        name: 步骤名称
        kind: transform | analyze | generate | review | deploy
        gate:
          entryConditions:
            - type: dependency-met | input-exists | permission-checked
          exitConditions:
            - type: output-generated | review-passed | manual-approve
          onFailure:
            action: abort | skip | retry
            maxRetries: 2
            rollback: true | false
```

**必须遵循**：
- 每步定义 Gate 三要素（入口/出口/失败策略）
- `dependsOn` 声明前置依赖
- 依赖图无循环

---

## 5. 组合模式 (Composition Modes)

**frontmatter 模板**：
```yaml
mode: <主模式>
composition: composed
secondaryModes:
  - <次要模式1>
  - <次要模式2>  # 最多 2 个
compositionConnections:
  - from: <模式A>
    to: <模式B>
    kind: sequence | gate | embed
```

**典型组合**：
| 主模式 | 次要模式 | 场景 |
|---|---|---|
| Pipeline | + Reviewer | 多阶段审查流水线 |
| Pipeline | + Inversion | 部署前置澄清 |
| Generator | + Reviewer | 生成 + 合规审查 |

---

## 6. 交付完整性自检 (Delivery Checklist)

| 项目 | 说明 | 审查类必须 |
|---|---|---|
| `developmentGuide` | When to Use + 典型用法 | — |
| `pitfallTable` | 已知坑 + 反模式 | — |
| `reviewProcess` | 准入准出清单 | ✅ |
| `deploymentGuide` | 安装/卸载命令 | 部署类必须 |
| `observability` | 日志/调试入口 | 运维类必须 |
| `scripts` | 辅助脚本目录 | 有脚本必须 |

---

## 7. 关键原则 (Key Principles)

1. **description 决定触发**：第三人称，描述何时使用，不描述过程
2. **渐进式披露**：详细内容放 references/，body 保持精简（<500 行）
3. **Gate 是强约束**：没过 Gate 不继续，行为侧模式的灵魂
4. **模式可组合**：鼓励 2~3 种模式叠加，1+2 > 1
