# 使用示例 (Usage Examples)

本文档提供五大模式技能的创建示例。

## 1. Tool Wrapper 示例 (Tool Wrapper Examples)

### 创建 react-19-tool

```bash
tsx scripts/init-skill.ts react-19-tool --path ./skills --resources scripts,references
```

**SKILL.md**：
```yaml
---
name: react-19-tool
description: 该技能应在使用 React 19 Server Actions 时使用，提供最新的 API 用法和最佳实践。
mode: tool-wrapper
composition: single
deliveryChecklist:
  developmentGuide: true
  pitfallTable: true
  reviewProcess: false
  deploymentGuide: false
  observability: false
  scripts: false
---
```

# React 19 Server Actions

## 概述 (Overview)

提供 React 19 Server Actions 的最新 API 速查表。

## 何时使用 (When to Use)

- 需要使用 Server Actions 但不熟悉其 API
- 需要查找最新版本的语法

## API 速查表 (API Reference)

| 方法 | 用途 | 示例 |
|---|---|---|
| `startTransition` | 状态更新 | `startTransition(() => setState())` |

## 常见错误 (Common Mistakes)

| 错误 | 解决方案 |
|---|---|
| TypeError | 检查参数类型 |

## 2. Generator 示例 (Generator Examples)

### 创建 report-generator

```bash
tsx scripts/init-skill.ts report-generator --path ./skills --resources references
```

**SKILL.md**：
```yaml
---
name: report-generator
description: 该技能应在需要生成结构化报告时使用，输出严格遵循 JSON Schema。
mode: generator
composition: single
deliveryChecklist:
  developmentGuide: true
  pitfallTable: true
  reviewProcess: false
  deploymentGuide: false
  observability: false
  scripts: false
---
```

## 输出模板 (Output Template)

```json
{
  "title": "报告标题",
  "summary": "一句话总结",
  "sections": [{ "name": "章节名", "content": "内容" }]
}
```

## 校验规则 (Validation Rules)

- `title`: 必填，非空
- `sections`: 至少 1 项

## 3. Reviewer 示例 (Reviewer Examples)

### 创建 code-reviewer

```bash
tsx scripts/init-skill.ts code-reviewer --path ./skills --resources scripts,references
```

**SKILL.md**：
```yaml
---
name: code-reviewer
description: 该技能应在需要审查代码时使用，按清单逐项核查。
mode: reviewer
composition: single
deliveryChecklist:
  developmentGuide: true
  pitfallTable: true
  reviewProcess: true
  deploymentGuide: false
  observability: false
  scripts: false
reviewer:
  checklist:
    filePath: ./references/checklist.md
    severityLevels: [critical, high, medium, low]
  process:
    entry: 读取待审查的代码文件
    steps:
      - id: check-naming
        name: 检查命名规范
        checklistSection: §1 命名规范
      - id: check-error-handling
        name: 检查错误处理
        checklistSection: §2 错误处理
    exit: 输出结构化 JSON 报告
---
```

**references/checklist.md**：
```markdown
# 审查清单

## §1 命名规范 (Naming Conventions)

| # | 检查项 | 通过标准 | 严重程度 |
|---|---|---|---|
| 1.1 | 变量有意义 | 名称能反映用途 | high |
| 1.2 | 函数 camelCase | 函数名使用 camelCase | medium |

## §2 错误处理 (Error Handling)

| # | 检查项 | 通过标准 | 严重程度 |
|---|---|---|---|
| 2.1 | 关键操作 try-catch | 网络、文件操作必须捕获异常 | critical |
```

---

## 4. Inversion 示例 (Inversion Examples)

### 创建 deploy-clarifier

```bash
tsx scripts/init-skill.ts deploy-clarifier --path ./skills --resources references
```

**SKILL.md**：
```yaml
---
name: deploy-clarifier
description: 该技能应在执行部署任务前使用，确保关键参数已澄清。
mode: inversion
composition: single
deliveryChecklist:
  developmentGuide: true
  pitfallTable: true
  reviewProcess: false
  deploymentGuide: false
  observability: false
  scripts: false
behavior:
  gate:
    phases:
      - id: scope
        name: 范围澄清
        questions:
          - id: scope-1
            question: 部署范围是？
            options:
              - value: single
                label: 单服务
              - value: multi
                label: 多服务
              - value: full
                label: 全量部署
            required: true
      - id: environment
        name: 环境澄清
        questions:
          - id: env-1
            question: 目标环境是？
            options:
              - value: dev
                label: 开发环境
              - value: prod
                label: 生产环境
            required: true
    refuseActionWhenIncomplete: true
---
```

## 澄清流程 (Clarification Process)

### 阶段 1：范围澄清 (Scope Clarification)

必须问清楚部署范围。

### 阶段 2：环境澄清 (Environment Clarification)

必须问清楚目标环境。

## 原则 (Principles)

- 必答题 ≤ 5 个
- 每题 2~4 个选项
- 信息没齐，不开始执行
```

---

## 5. Pipeline 示例 (Pipeline Examples)

### 创建 deploy-pipeline

```bash
tsx scripts/init-skill.ts deploy-pipeline --path ./skills --resources scripts,references
```

**SKILL.md**：
```yaml
---
name: deploy-pipeline
description: 该技能应在需要执行部署流水线时使用，每步必须通过 Gate 才能继续。
mode: pipeline
composition: single
deliveryChecklist:
  developmentGuide: true
  pitfallTable: true
  reviewProcess: true
  deploymentGuide: true
  observability: true
  scripts: true
behavior:
  sequence:
    steps:
      - id: build
        name: 构建
        kind: transform
        gate:
          entryConditions:
            - type: dependency-met
          exitConditions:
            - type: output-generated
          onFailure:
            action: abort
      - id: deploy
        name: 部署
        kind: deploy
        dependsOn: [build]
        gate:
          entryConditions:
            - type: permission-checked
          exitConditions:
            - type: manual-approve
          onFailure:
            action: abort
            rollback: true
  policy:
    strictMode: true
    rollbackOnAbort: true
---
```

## 流水线步骤 (Pipeline Steps)

| 步骤 | 名称 | 失败策略 |
|---|---|---|
| 1 | 构建 | abort |
| 2 | 部署 | abort + rollback |
```

---

## 6. 组合模式示例 (Composition Examples)

### Pipeline + Reviewer

```yaml
---
name: deploy-review-pipeline
description: 该技能应在需要执行部署流水线并进行质量审查时使用。
mode: pipeline
composition: composed
secondaryModes:
  - reviewer
compositionConnections:
  - from: pipeline
    to: reviewer
    kind: gate
---
```

## 脚本命令 (Script Commands)

```bash
# 初始化技能
tsx scripts/init-skill.ts <skill-name> --path ./skills --resources scripts,references,assets --examples

# 验证技能
tsx scripts/quick-validate.ts ./skills/<skill-name>

# 打包技能
tsx scripts/package-skill.ts ./skills/<skill-name>
```
