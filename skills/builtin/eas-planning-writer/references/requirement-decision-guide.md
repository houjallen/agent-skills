---
name: requirement-decision-guide
description: "eas-planning-writer 需求决策模板使用指南 —— 阶段 1 完成后落地 0001-initial-design.md 的流程、路径与反模式。"
category: reference
---

# 项目级长任务需求决策模板使用指南 (Task Requirement Decision Template Guide)

> **本指南是 `eas-planning-writer` 阶段 1 需求收集 → 阶段 2 规划启动之间的「决策沉淀」规范。**
> 当 `task_profile` 收集完毕（满足 [requirements-gathering.md §6.1 退出条件](requirements-gathering.md#六退出条件与跳过规则-exit--skip-rules)）后，必须把关键设计判断沉淀为可追溯的决策记录。

---

## 一、为什么需要决策沉淀 (Why)

仅靠 `task_profile`（结构化 YAML）有三个不够：

1. **`task_profile` 是 Agent 内部数据结构**——不能跨 session 共享，不能 Review，不能被人类快速读懂
2. **需求收集过程中做出的关键判断**（如"为什么阶段数估为 5 而非 8"、"为什么跨 session 设为 true"）如果只留在对话上下文，下次重启就丢失
3. **决策理由必须显式写明**——避免后续 Review 时"为什么这样做"成谜

所以阶段 1 结束后、阶段 2 启动前，**必须产出决策文档**。

---

## 二、三类决策沉淀场景 (Three Scenarios)

按"影响范围"分三类，对应不同的沉淀路径：

| 场景 | 触发条件 | 沉淀路径 | 模板 |
|------|----------|----------|------|
| **场景 A：任务级需求决策** | 单个任务内的阶段划分、模式选择、字段约定 | `<task-dir>/0001-{topic}.md` | [`00NN-requirement.md`](templates/decisions/00NN-requirement.md) |
| **场景 B：跨任务架构决策** | 影响 ≥ 2 个任务 / 改变任务间协议 / 引入新约定 | `<cwd>/docs/decisions/00NN-{topic}.md` | 通用 ADR 模板（架构型） |
| **场景 C：执行型决策** | 阶段 7 迭代后的小决策、bugfix 决策 | `<cwd>/docs/decisions/00NN-{topic}.md` | 通用 ADR 模板（执行型） |

**沉淀路径说明**：
- `<task-dir>` = `<cwd>/.easbot/knowledge/tasks/{task-name}/`（本技能三件套落地目录）
- `docs/decisions/` 是 ADR（Architecture Decision Record）行业标准目录约定（Michael Nygard 格式）。Agent 在宿主项目下落地跨任务决策时，推荐沿用此约定；若宿主项目已建立自有决策目录（如 `<cwd>/.easbot/decisions/`、`<cwd>/adr/` 等），Agent 应优先遵循宿主项目规范。

**路径变量说明**：
- `<cwd>`：宿主项目根目录（Agent 调用本技能时的当前工作目录）
- `<task-dir>`：单个任务的三件套目录

**判定速查**：
- ✅ 影响 1 个任务内的设计 → **场景 A**（本目录模板）
- ✅ 影响 ≥ 2 个任务 / 改变调用协议 → **场景 B**（宿主项目级 ADR）
- ✅ 迭代过程中的小调整 → **场景 C**（宿主项目级 ADR 执行型）

**重要**：场景 B 和 C 的模板**不在本技能目录内**，由宿主项目决定其格式。本目录仅提供场景 A 的模板；宿主项目如有自有 ADR 规范，Agent 应优先遵循宿主项目规范。

---

## 三、模板结构 (Template Anatomy)

### 3.1 任务级需求决策 9 章节

完整结构见 [`00NN-requirement.md`](templates/decisions/00NN-requirement.md)。每章作用：

| # | 章节 | 作用 | 必填 |
|---|---|---|---|
| 1 | **背景 (Context)** | 用户原始诉求、收集到的需求摘要 | ✅ |
| 2 | **需求画像 (Requirement Profile)** | 直接附上阶段 1 产出的 `task_profile` | ✅ |
| 3 | **关键判断 (Key Judgments)** | 阶段 1 过程中做出的关键判断清单 | ✅ |
| 4 | **备选方案 (Alternatives)** | 至少 2 个候选（模式、字段、路径）| ✅ |
| 5 | **决策 (Decision)** | 选了什么 + 表格明确 | ✅ |
| 6 | **依据 (Rationale)** | 为什么选这个 | ✅ |
| 7 | **具体动作 (Actions)** | 可勾选清单（落到文件路径）| ✅ |
| 8 | **影响 (Impact)** | 正面 ✅ / 风险 ⚠️ / 副作用 ❌ | ✅ |
| 9 | **回溯链接 (Backlinks)** | 指向后续阶段产出 + 跨任务 ADR | ✅ |

### 3.2 与 `task_profile` 的关系

```
task_profile (阶段 1 产出)
        │
        │ 输入
        ▼
00NN-requirement.md (本模板)
        │
        │ 驱动
        ▼
task_plan.md / findings.md / progress.md (阶段 2-5 产出)
```

**铁律**：
- `task_profile` 的字段 MUST 100% 出现在决策文档的「需求画像」章节
- 决策文档「关键判断」章节 MUST 列出 `task_profile` 中无法表达的设计选择（如"为什么阶段数估为 5"、"为什么兜底策略选 A"）
- 决策文档「回溯链接」章节 MUST 指向最终产出的 task_plan.md / findings.md / progress.md

---

## 四、使用流程 (Usage Flow)

### 4.1 在阶段 1 → 阶段 2 衔接处

```bash
# 假设 <task-dir> 是单个任务的三件套目录（如 .easbot/knowledge/tasks/my-task/）

# 1. 复制模板（使用本技能目录内的模板）
cp <eas-planning-writer>/references/templates/decisions/00NN-requirement.md \
   <task-dir>/0001-initial-design.md

# 2. 填写 frontmatter（自动从 task_profile 复制 name/date/keywords）
# 3. 把 task_profile 粘贴到「需求画像」章节
# 4. 补充「关键判断」「备选方案」「决策」「依据」「具体动作」「影响」「回溯链接」
# 5. 在 task_plan.md 阶段 1 的"产出需求决策文档"勾选框打勾
# 6. 在 progress.md 记录"会话 1：阶段 1 完成 + 决策文档落地"
```

### 4.2 决策编号规则

```
00NN-{topic}.md
```

- `00NN`：4 位编号，**从 0001 开始**（每个任务目录独立计数）
- 第一个需求决策通常是 `0001-initial-design.md`
- 修订追加"修订记录"章节，不另起文件

### 4.3 路径选择

**默认路径**（推荐）：
```
<task-dir>/0001-{topic}.md
```

- 与任务三件套同目录，绑在一起
- 容易找（不需要翻 `<cwd>/docs/decisions/`）

**可选路径**（仅在以下情况使用）：
```
<cwd>/.easbot/skills/{task-name}/decisions/00NN-{topic}.md
```

- 决策属于"私密实验性"性质，不希望公开
- 需要宿主项目支持 `.easbot/` 私有知识目录约定

---

## 五、修订与归档 (Revision & Archive)

- **修订追加**：不另起文件，在原文件追加"修订记录"章节，frontmatter `version` 递增
- **跨任务升级**：影响 ≥ 2 个任务的设计决策，迁移到 `<cwd>/docs/decisions/00NN-{topic}.md`（宿主项目级 ADR）
- **废弃流程**：在本决策文件顶部加 `status: deprecated`，并加 `supersedes` 指向替代决策编号

---

## 六、反模式 (Anti-Patterns)

| ❌ 不要 | ✅ 应该 |
|---|---|
| 阶段 1 完成后直接进阶段 2，无决策文档 | 必产决策文档，再进阶段 2 |
| `task_profile` 与决策文档内容不一致 | 决策文档的「需求画像」 MUST 100% 复制 task_profile |
| 决策文档写完就丢，不在 task_plan.md 引用 | task_plan.md 阶段 1 勾选"产出需求决策文档" |
| 决策文档不写备选方案 | 至少 2 个并列候选 |
| 决策文档无"具体动作"清单 | 每条 MUST 含可勾选落地动作 |
| 跨任务决策放本目录 | 影响 ≥ 2 个任务必须升级到宿主项目级 ADR |
| 修订另起 v2 文件 | 在原文件追加"修订记录" |
| 引用本任务目录外的路径 | 本任务是自包含的，**只允许引用本任务目录内部** |

---

## 七、跨目录引用约束 (Cross-Directory Reference Constraint)

**[MUST] 本任务目录（`<task-dir>/`）是自包含的，决策文档内 MUST NOT 出现以下引用：**

- ❌ 引用本任务目录**之外**的绝对路径
- ❌ 引用 `../../` 跨越本任务目录外的相对路径
- ❌ 引用宿主项目内的具体路径作为**本任务内部可访问的资源**（即不能从本任务目录"读取/写入"宿主项目的文件）

**[MAY] 允许的引用形式：**

- ✅ 本任务目录内部相对路径（如 `[task_plan.md](task_plan.md)`）
- ✅ 通用占位符 `<cwd>/...` 表示"宿主项目根目录下"（仅用于**说明产物落地位置**，不是"本任务内部资源"）
- ✅ 通用占位符 `<eas-planning-writer>/...` 表示"本技能目录内部"（用于引用本技能模板）
- ✅ 引用**行业标准约定**作为推荐路径（如 `docs/decisions/` 是 ADR 行业标准目录，Agent 可在落地说明中推荐使用；若宿主项目已有自有约定，Agent 应优先遵循）

**理由**：本技能可能被不同项目、不同 Agent 框架调用。"自包含"是指本技能**自身不依赖宿主项目的特定文件**，而不是"不能提及任何约定"。Agent 在说明落地路径时可以推荐行业标准目录（如 ADR 的 `docs/decisions/`），但实际写入应遵循宿主项目自有约定。

---

## 八、速查卡片 (Cheat Sheet)

```
任务需求决策速查：

0. 阶段 1 完成后、阶段 2 启动前 MUST 产决策文档
1. 路径：<task-dir>/0001-{topic}.md
2. 编号：00NN 单调递增（每个任务目录独立计数）
3. 必含：task_profile 复制 + 关键判断 + 备选 + 决策 + 动作 + 影响 + 回溯
4. task_plan.md 阶段 1 勾选"产出需求决策文档"标记落地完成
5. 跨任务影响 → 升级到宿主项目级 ADR（路径与模板由宿主项目决定）
6. 修订不另起文件，追加"修订记录"章节
7. 模板见 ./templates/decisions/00NN-requirement.md（9 章节）
8. [MUST] 本任务目录自包含，MUST NOT 引用目录外资源
```

---

**版本**：1.0.0 · 与本技能 SKILL.md 及 requirements-gathering.md 配套使用