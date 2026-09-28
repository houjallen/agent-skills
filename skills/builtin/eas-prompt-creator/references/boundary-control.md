# 边界控制规范 (Boundary Control Specification)

> **CRITICAL: 本规范严格对齐 [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119)。所有关键字要求（MUST / MUST NOT / SHALL / SHALL NOT / SHOULD / SHOULD NOT / REQUIRED / MAY / OPTIONAL）MUST 按 RFC 2119 原文解读。**
>
> **CRITICAL: EASBot 关键字（NEVER / DO NOT / ALWAYS / CRITICAL / MUST）是 RFC 2119 关键字的同义书写形式（见 §2）。它们 MUST NOT 用于引入 RFC 4 级层次之外的第 5 级要求强度。**

## 1. RFC 2119 — 四级需求层次 (Four-Level Requirement Hierarchy)

RFC 2119 定义了唯一的、规范化的四级需求层次。EASBot 提示词中的每一个要求关键字 MUST 解析到这四级之一。

| 级别 (Level) | 正向关键字集 (Positive)             | 负向关键字集 (Negative)              | 含义                                                                             |
| ------------ | ----------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| L1           | **MUST** / **SHALL** / **REQUIRED** | **MUST NOT** / **SHALL NOT**         | 绝对要求。违反即破坏正确性、安全性或互操作性。                                   |
| L2           | **SHOULD** / **RECOMMENDED**        | **SHOULD NOT** / **NOT RECOMMENDED** | 强推荐。可能存在合理的例外，但 MUST 充分理解其影响并审慎权衡后才能选择不同做法。 |
| L3           | **MAY** / **OPTIONAL**              | （无，见 §3）                        | 真正的可选。不同实现可选包含或省略。                                             |
| L4           | （无）                              | （无）                               | 无要求。该层次之外的语句不携带规范效力。                                         |

### 1.1 RFC 2119 关键字定义 · 原文 (Keyword Definitions · Verbatim)

以下定义摘自 RFC 2119 §3 ([rfc-editor.org/rfc/rfc2119](https://www.rfc-editor.org/rfc/rfc2119))。Agent MUST 将其视为权威依据：

- **MUST** / **SHALL** / **REQUIRED** — 该定义是规范的绝对要求。
- **MUST NOT** / **SHALL NOT** — 该定义是规范的绝对禁止。
- **SHOULD** / **RECOMMENDED** — 在特定情形下可能存在合理的理由忽略此项，但在选择不同做法之前 MUST 充分理解并仔细权衡所有影响。
- **SHOULD NOT** / **NOT RECOMMENDED** — SHOULD 的反向。
- **MAY** / **OPTIONAL** — 该项是真正可选的。一个实现可以选择包含，另一实现可以选择省略。

### 1.2 同级关键字的同义性 (Synonymy Within a Level)

- **MUST** / **SHALL** / **REQUIRED** 为同义词（RFC 2119 §6）。作者 MAY 选择任意一个；选择最易读的那个。
- **MUST NOT** / **SHALL NOT** 为同义词。
- **SHOULD** / **RECOMMENDED** 为同义词。
- **SHOULD NOT** / **NOT RECOMMENDED** 为同义词。
- **MAY** / **OPTIONAL** 为同义词。

在同一份提示词文件中，**每个级别 MUST 精确选择一个同义词**以保持一致性。在同一 Boundaries 章节内混合使用 MUST 和 SHALL 属于**违规**（见 §6 自检表项 C4）。

## 2. EASBot 关键字表 (EASBot Keyword Table)

下表列出 EASBot 在 RFC 2119 各层级使用的关键字。所有列出的关键字在当前规范中等价；任选一个即可。同一 Boundaries 章节内 MUST NOT 混用同一级别的不同关键字。

| EASBot 关键字 | RFC 2119 别名  | 备注                                                                                        |
| ------------- | -------------- | ------------------------------------------------------------------------------------------- |
| `NEVER`       | **MUST NOT**   | 硬性禁止。与 MUST NOT 等价。                                                                |
| `MUST`        | **MUST**       | 与 RFC 2119 MUST 一致，全大写以强调。                                                       |
| `ALWAYS`      | **MUST**       | 强制性正向动作。与 MUST 等价；倾向于描述流程性习惯时使用。                                  |
| `CRITICAL`    | （仅作强调）   | **非 RFC 2119 级别。** 仅为视觉强调块，必须包裹一个 MUST/MUST NOT 规则。MUST NOT 单独使用。 |
| `DO NOT`      | **SHOULD NOT** | 不推荐动作。与 SHOULD NOT 等价。绝不比 MUST NOT 更强。                                      |

### 2.1 `CRITICAL` 块 · 仅作强调 (The `CRITICAL` Block · Emphasis-Only)

`CRITICAL` 是写作工具，不是级别。其唯一合法形式为：

```markdown
### CRITICAL

[单条 MUST 遵循的绝对规则。必须本身包含 MUST 或 MUST NOT 关键字。]
```

**MUST NOT** 在没有底层 MUST/MUST NOT 正文的情况下单独使用 `CRITICAL`。这条规则本身是 MUST。

## 3. 完整关键字表 (The Complete Keyword Table)

下表 14 个关键字是 EASBot 提示词中**唯一**允许使用的边界控制词。任何表外的词（如 "mustn't"、"shall not"、"have to"、"must always"、"recommend"、"might"、"could"、"should perhaps"）MUST NOT 用作要求关键字。

> **EASBot 别名 vs RFC 2119 关键字 (EASBot Aliases vs RFC 2119 Keywords)**：§2 的 EASBot 别名表（5 个：`MUST` / `NEVER` / `ALWAYS` / `CRITICAL` / `DO NOT`）是 §3 表的**子集**，提供项目内惯用的同义书写形式。
> §3 表中的**剩余 RFC 2119 关键字**（`SHALL` / `REQUIRED` / `SHALL NOT` / `RECOMMENDED` / `NOT RECOMMENDED` / `OPTIONAL` 等）按 RFC 2119 原文直用即可，无需额外 EASBot 别名。
> 任意 EASBot 别名与 RFC 2119 关键字在同一边界章节内 MUST NOT 混用（见 §6 自检表项 C3）。

| RFC 2119 关键字     | EASBot 别名      | 级别 | 类型 |
| ------------------- | ---------------- | ---- | ---- |
| **MUST**            | `MUST`、`ALWAYS` | L1   | 正向 |
| **SHALL**           | —                | L1   | 正向 |
| **REQUIRED**        | —                | L1   | 正向 |
| **MUST NOT**        | `NEVER`          | L1   | 负向 |
| **SHALL NOT**       | —                | L1   | 负向 |
| **SHOULD**          | —                | L2   | 正向 |
| **RECOMMENDED**     | —                | L2   | 正向 |
| **SHOULD NOT**      | `DO NOT`         | L2   | 负向 |
| **NOT RECOMMENDED** | —                | L2   | 负向 |
| **MAY**             | —                | L3   | 正向 |
| **OPTIONAL**        | —                | L3   | 正向 |

## 4. 正确层级 (Correct Hierarchy)

RFC 2119 定义的 4 级层次是 EASBot 提示词中**唯一**的层次结构（见 §1）。在 L1 内，`NEVER`、`MUST`、`ALWAYS` 是同级；选取对该规则最自然的同义词。

## 5. 使用模式 (Usage Patterns)

### 5.1 绝对禁止 · L1 负向 (Absolute Prohibition · L1 Negative)

```markdown
### NEVER / MUST NOT

- 不要生成或猜测 URL，除非明确用于编程辅助
- 在未读取文件前不要编辑文件
- 不要未经用户确认就删除文件
- 不要在未明确要求时提交代码变更
```

### 5.2 绝对要求 · L1 正向 (Absolute Requirement · L1 Positive)

```markdown
### MUST / ALWAYS

- 严格遵循指定的输出格式
- 使用绝对文件路径
- 编辑前验证文件内容
```

### 5.3 强推荐 · L2 (Strong Recommendation · L2)

```markdown
### SHOULD / RECOMMENDED

- 在合并前运行测试
- 对重复模式使用辅助工具

### SHOULD NOT / DO NOT / NOT RECOMMENDED

- 不要添加超出需求范围的功能
- 不要创建不必要的文件
- 不要使用含糊不清的描述
```

### 5.4 可选 · L3 (Optional · L3)

```markdown
### MAY / OPTIONAL

- 可以在响应末尾添加简要总结
- 可以在重复调用时缓存结果
```

### 5.5 关键强调块 (Critical Emphasis Block)

```markdown
### CRITICAL

上述规则 MUST NOT 被弱化。Plan mode 当前 ACTIVE — 任何编辑 MUST 视为违规。
```

## 6. RFC 2119 合规自检表 (RFC 2119 Compliance Checklist)

发布任何提示词前，作者 MUST 验证以下各项。未通过的项 MUST 修复或显式记录为豁免。

- [ ] **C1** 每条要求语句都使用 §3 表中的 14 个关键字之一。
- [ ] **C2** 没有发明强度词。英文：`"must always"`、`"must never"`、`"should perhaps"`、`"could"`、`"might"`、`"have to"`、`"need to"`；中文：`"必须要"`、`"应该要"`、`"可能"`、`"或许"`、`"最好"`（作为要求强度词时）。
- [ ] **C3** 在同一 Boundaries 章节内，每个级别仅使用一种同义词（不混用 MUST+SHALL；不混用 SHOULD+RECOMMENDED）。
- [ ] **C4** `CRITICAL` 块始终包含底层 MUST/MUST NOT 正文。
- [ ] **C5** L2 规则若允许例外，必须记录例外触发条件（"在特定情形下存在合理理由..." 见 RFC 2119 §3）。
- [ ] **C6** L3 规则不包含 SHOULD 等效措辞（"you should probably..."、"it's better to..."）。
- [ ] **C7** 每条规则都可真假测试。空泛规则（"be careful"、"be reasonable"）MUST 重写或删除。
- [ ] **C8** 安全/不可逆操作使用 **MUST NOT**（NEVER），而非 SHOULD NOT（DO NOT）。
- [ ] **C9** 双向约束确实是双向的：每条正向规则都有对应的负向规则（反之亦然）。

> **C9 适用范围 (Scope of C9)**：
>
> - **操作型规则 (Operational Rules)** MUST 双向：包括工具使用（哪把工具 / 不用哪把）、文件操作（读 / 不读、写 / 不写）、状态变更（提交 / 不提交、删除 / 不删除）。缺失任一方向 = 违规。
> - **陈述型规则 (Declarative Rules)** MAY 单向：包括身份描述、能力清单、背景信息、目标陈述（如 `MUST be EASBot's code assistant`）。陈述型规则不需要负向镜像。

- [ ] **C10** 关键规则解释理由（"Reason: ..."）— RFC 2119 精神对 L1 的 **REQUIRED**。

## 7. 示例章节 (Example Section)

```markdown
## Boundaries

### NEVER

- 在未读取文件前编辑文件
- 未经确认删除文件
- 执行破坏性命令

### MUST

- 遵循指定的输出格式
- 返回有效 JSON
- 失败时包含错误信息

### SHOULD

- 合并 PR 前运行测试
- 对重复模式使用辅助工具

### SHOULD NOT

- 添加超出需求的功能
- 创建不必要的文件
- 使用含糊描述

### MAY

- 重复调用时缓存结果
- 在响应末尾添加简要总结

### CRITICAL

本操作不可逆。必须先获得确认才能继续。
```

## 8. 常见模式 (Common Patterns)

### 8.1 文件操作 (File Operations)

```markdown
### NEVER

- 在未读取文件前编辑它
- 未经确认覆盖文件

### MUST

- 使用绝对路径
- 编辑时保留原有内容
```

### 8.2 代码生成 (Code Generation)

```markdown
### NEVER

- 添加超出需求的功能
- 留下无法工作的代码

### SHOULD NOT

- 添加不必要的注释
- 创建过早的抽象

### MUST

- 遵循现有代码风格
- 编写惯用代码
```

### 8.3 工具使用 (Tool Usage)

```markdown
### NEVER

- 将工具用于非预期用途
- 跳过必填参数

### MUST

- 提供所有必填参数
- 检查结果中的错误
```

### 8.4 任务管理 (Task Management)

```markdown
### NEVER

- 批量将多个任务标记为完成
- 跳过任务状态更新

### MUST

- 开始时标记 in_progress
- 完成后立即标记 completed
```

## 9. 质量自检表 (Quality Checklist)

- [ ] 所有绝对禁止使用 **MUST NOT**（NEVER）。
- [ ] 所有绝对要求使用 **MUST**（或 SHALL/REQUIRED）。
- [ ] 强推荐使用 **SHOULD**（或 RECOMMENDED）。
- [ ] `CRITICAL` 仅作强调块（§2.1），不作为级别。
- [ ] 同一章节内无矛盾的边界声明。
- [ ] 边界具体而非空泛 — 每条规则都可按 §C7 测试。
- [ ] 边界覆盖常见错误。
- [ ] 使用的每个关键字都在 §3 表中 — 没有发明词汇（§C1、§C2）。
- [ ] 同级别内的同义词保持一致（§C3）。
- [ ] RFC 2119 合规自检表（§6）的全部 10 项均通过。
