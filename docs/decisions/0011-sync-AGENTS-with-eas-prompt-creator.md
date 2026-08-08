# 决策文档：AGENTS.md 与 eas-prompt-creator 规范对齐（2026-08-08）

> **触发场景**：用户指出 `AGENTS.md` §6 创建规范、§14 评审规范与 `eas-prompt-creator/references/{boundary-control,prompt-validation}.md` 存在冲突。
>
> **以 eas-prompt-creator 为权威源**（项目内专门负责"prompt 编写规范"的技能），AGENTS.md 作为项目级入口同步其约束。
>
> **本文件不替代评审报告**，作为单一决策的「规范对齐」记录，归档到 `docs/decisions/`（§11 跨技能决策）。

---

## 1. 冲突点对照

| # | 维度 | AGENTS.md 原规定 | eas-prompt-creator 规定 | 处理 |
|---|---|---|---|---|
| **C1** | 指令强度词 | 3 级（MUST / SHOULD / MAY）+ REQUIRED | 5 级（CRITICAL / NEVER / MUST / ALWAYS / DO NOT）+ 优先级排序 | AGENTS.md §13.3 升级为 7 级 |
| **C2** | 措辞优先级 | 未明确 | CRITICAL > NEVER > MUST > ALWAYS > DO NOT | AGENTS.md §13.3.2 新增 |
| **C3** | 提示词主体语言 | §12.5 文档中文 | "CRITICAL: 生成的所有提示词内容必须使用英文" | AGENTS.md §12.5 新增提示词主体语言条款 |
| **C4** | Token 预算 | SKILL.md < 500 行 | System prompt < 6,000 tokens；80K/120K/180K 衰减曲线 | AGENTS.md §13.5.5 新增 |
| **C5** | U 型注意力曲线 | 未提 | 关键内容放首尾 | AGENTS.md §13.5.5 末尾段新增 |
| **C6** | 双向约束 | 未提 | 工具使用规则 MUST 同时含"做什么 + 不做什么" | AGENTS.md §13.5.6 新增 |
| **C7** | 提示词生成反模式 | 7 条笼统 | 6 类具体（Prompt Chains / Flattery / Knowledge Dumps / Repeating Tool Descriptions / Missing Failure Handling / Ignoring Context Window Decay） | AGENTS.md §13.6 拆 §13.6.1 + §13.6.2 |
| **C8** | 评审规范引用 | §14.5 维度 3/5 未覆盖 C1-C7 | — | §14.5 维度 3/5 各加 1-2 项检查 |

---

## 2. AGENTS.md 修改清单

### 2.1 §12.5 新增"提示词主体语言"（C3）

```diff
+ - **提示词主体语言**（`eas-prompt-creator` 生成的所有 prompt 文件）：**MUST 全部使用英文**。仅 frontmatter `title` 可用中英双语；正文 / 边界控制 / 示例全部英文。代码注释可中文。来源：[`eas-prompt-creator/SKILL.md §语言要求`](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-prompt-creator/SKILL.md)。
```

### 2.2 §13.3 升级为 7 级体系（C1 / C2）

- §13.3.1 关键词体系表：从 4 行（4 类）扩到 7 行（7 级）
- §13.3.2 优先级排序：新增 5 级排序
- §13.3.3 措辞选用决策树：新增 ASCII 决策树

### 2.3 §13.5.5 新增（C4 / C5）

- Token 上限表
- 上下文衰减曲线表
- U 型注意力曲线段

### 2.4 §13.5.6 新增（C6）

- 双向约束原则节：含单向 / 双向对照表

### 2.5 §13.6 拆分为两节（C7）

- §13.6.1 项目级规范反模式（原 §13.6 内容保留）
- §13.6.2 提示词生成反模式（新增 6 类反模式表）

### 2.6 §13.7 自检清单扩展

新增 4 项：
- 指令强度词按 §13.3 体系选用
- 系统提示词 < 6,000 tokens
- 关键内容位置（U 型曲线）
- 工具使用双向约束
- 无 6 类提示词生成反模式
- 提示词主体语言全英文

### 2.7 §14.5 维度 3（语义）扩展（C1 / C6 / C5）

新增 3 项 P0/P1 检查：
- 指令强度词规范（升级）
- 安全/不可逆操作措辞（新增 P0）
- 双向约束（新增 P1）
- 关键内容位置（新增 P1）

### 2.8 §14.5 维度 5（落地）扩展（C3 / C4）

新增 2 项 P0/P1 检查：
- Token 预算（新增 P1）
- 提示词主体语言（新增 P0）

---

## 3. 行数变化

- 修改前：538 行
- 修改后：602 行
- 净增：+64 行
- 项目级合理上限：< 700 行 ✓

---

## 4. 验证

| 校验项 | 结果 |
|---|---|
| quick-validate 全量 12 个 skills | 12/12 PASS（无回归） |
| AGENTS.md 行数 | 602（< 700 上限） |
| 关键概念全部落地 | CRITICAL ✓ NEVER ✓ ALWAYS ✓ 6,000 tokens ✓ U 型 ✓ 双向 ✓ 6 类反模式 ✓ |

---

## 5. 影响面

| 受影响方 | 影响 |
|---|---|
| 后续 skill 创建者 | 写 SKILL.md / prompt 时按 §13.3.1 7 级体系选用强度词 |
| 后续评审者 | 按 §14.5 新增 5 项检查项评审 |
| `eas-prompt-creator` 用户 | 输出 prompt 时按 §12.5 + §13.6.2 双重约束 |
| 既有 12 个 skills | 无需修改（已通过既有评审） |

---

## 6. 与既有决策的关系

| 文件 | 关系 |
|---|---|
| [0006-review-all-skills.md](file:///e:/work/apps/eas/agent-skills/docs/decisions/0006-review-all-skills.md) | 第一轮全量评审（市场同步为主） |
| [0007-review-all-skills-round1.md](file:///e:/work/apps/eas/agent-skills/docs/decisions/0007-review-all-skills-round1.md) | 第二轮 SKILL.md 本体评审 |
| [0009-fix-closure-0006-0007-reviews.md](file:///e:/work/apps/eas/agent-skills/docs/decisions/0009-fix-closure-0006-0007-reviews.md) | 前两轮修复闭环 |
| [0010-review-all-skills-round2-description-spec.md](file:///e:/work/apps/eas/agent-skills/docs/decisions/0010-review-all-skills-round2-description-spec.md) | description 三要素专项 |
| **0011（本文件）** | **AGENTS.md ↔ eas-prompt-creator 规范对齐** |

---

**执行人**：Agent（按用户指令）
**触发 commit msg**：`[repo] docs: align AGENTS.md §13/§14 with eas-prompt-creator`
**评审依据**：[0011-sync-AGENTS-with-eas-prompt-creator.md](file:///e:/work/apps/eas/agent-skills/docs/decisions/0011-sync-AGENTS-with-eas-prompt-creator.md)
