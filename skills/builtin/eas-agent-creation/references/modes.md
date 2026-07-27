# 模式详解 (Mode Details)

## 概述 (Overview)

本文档详细定义五种 Skill 模式的结构、适用场景和设计原则。

## 1. Tool Wrapper（补知识）

### 核心问题
模型不知道某个库/工具/API 的最新用法。

### Skill 形态
- `SKILL.md` 含 API 速查表 + 调用示例 + 常见坑
- `references/` 放完整文档片段
- `scripts/` 放最小可执行样例

### 关键设计
- 不重新发明库本身，只做"专家知识压缩包"
- 标注版本（`metadata.compatibility`）
- 列明不适用场景（避免误用）

### 示例结构
```
skill-name/
├── SKILL.md
├── references/
│   ├── api-cheatsheet.md
│   └── version-notes.md
└── scripts/
    └── example.ts
```

## 2. Generator（稳输出）

### 核心问题
输出格式不稳定，需要严格 Schema/模板。

### Skill 形态
- `SKILL.md` 含固定输出模板 + 校验规则
- `templates/` 放 JSON/Markdown/代码模板
- `examples/` 放正反例

### 关键设计
- 输出模板必须含**占位符 + 校验清单**
- 失败模式要写明（缺字段、超长、格式错误如何兜底）
- 通常与 Tool 配合调用（LLM 生成 + Tool 校验）

### 示例结构
```
skill-name/
├── SKILL.md
├── templates/
│   └── output-schema.json
└── examples/
    ├── good.md
    └── bad.md
```

## 3. Reviewer（按标准审）

### 核心问题
需要按标准清单逐项核查。

### Skill 形态
- `SKILL.md` body 写审查流程（entry / steps / exit）
- `references/checklist.md` 独立清单（可被外部 PR/CI 引用）
- `scripts/` 放自动化检查脚本

### 关键设计（拆开"检查什么"与"怎么检查"）

| 维度 | 检查什么 | 怎么检查 |
|---|---|---|
| **位置** | `references/checklist.md` | SKILL.md body |
| **变化频率** | 频繁（换场景就换清单） | 稳定（流程几乎不变） |
| **本质** | 数据/规则 | 程序/逻辑 |

### 示例结构
```
skill-name/
├── SKILL.md
└── references/
    ├── checklist.md
    └── scoring-rubric.md
```

## 4. Inversion（先问再做）

### 核心问题
需求存在歧义/缺关键参数，直接执行会浪费 token。

### Skill 形态
- `SKILL.md` 含「必问清单」+「反问模板」
- `references/` 放结构化问题清单
- `references/when_to_ask.md` 说明何时问、何时猜

### 强约束原则
**信息没齐，就不要开始输出**。

### 三段式默认结构
1. **阶段 1 — 范围澄清**（问题 / 用户 / 规模）
2. **阶段 2 — 环境澄清**（部署环境 / 技术栈）
3. **阶段 3 — 约束澄清**（预算 / 合规要求）

### 关键设计
- 必问项 ≤ 5 个，超出则拆 Skill
- 每个问题必须 2~4 个可选项（避免开放式问答）
- 未完成必答项时**默认拒绝执行**

## 5. Pipeline（每步过 Gate）

### 核心问题
流程必须按顺序执行，跳步会导致错误。

### Skill 形态
- `SKILL.md` 含步骤序列 + 每步的输入/输出契约
- `behavior.sequence` 结构化定义步骤依赖图
- `references/gate.md` 说明每步的准入准出门槛

### 核心论点
**没过 gate，就不能往下走**。

### Gate 三要素

| 要素 | 含义 | 示例 |
|---|---|---|
| **入口条件** | 进入该步的前置检查 | 上一步已通过 + 输入文件存在 |
| **准出门槛** | 通过该步的硬性条件 | 公用 API 已确认 + docstring 已生成 |
| **失败兜底** | 未通过时的处理 | 报错 + 终止流程 / 跳过 + 标记风险 |

### 失败策略

| 策略 | 适用场景 | 示例 |
|---|---|---|
| `abort` | 关键步骤（权限/安全） | 安全门禁失败立即终止 |
| `skip` | 可选步骤（辅助优化） | 文档润色失败跳过 |
| `retry` | 临时性失败（网络/LLM 限流） | docstring 生成失败重试 2 次 |

## 6. 模式组合矩阵

| 主模式 | 可组合 | 典型场景 | 形式 |
|---|---|---|---|
| **Pipeline** | + Reviewer | 多阶段流水线每步审查 | Pipeline 中嵌入 Reviewer 做 gate |
| **Pipeline** | + Inversion | 部署流水线前置澄清 | Pipeline 起始用 Inversion |
| **Generator** | + Reviewer | 自动生成报告 + 合规审查 | Generator 输出后 Reviewer 核查 |
| **Pipeline** | + Inversion + Reviewer | 关键决策全链路管控 | 完整 3-mode 组合 |
| **Tool Wrapper** | + Inversion | 复杂 SDK 调用前置澄清 | 知识补充前先澄清需求 |

## 7. 模式转换矩阵

| 从 → 到 | 触发条件 | 转换动作 |
|---|---|---|
| Tool Wrapper → Generator | 知识+固定输出结构 | 加 `templates/` + `behavior.sequence` |
| Tool Wrapper → Pipeline | 知识+必须按顺序执行 | 升级为 Bundle + `behavior.sequence` |
| Generator → Reviewer | 输出结构化+需对照标准核查 | 加 `references/checklist.md` + `behavior.gate` |
| Generator → Pipeline | 输出+多阶段 | 加 `behavior.sequence` 拆 stage |
| Reviewer → Pipeline | 多阶段审查 | 拆为两个 Skill + Bundle 编排 |
