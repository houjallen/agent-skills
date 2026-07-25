# 技能需求决策模板使用指南 (Requirement Decision Template Guide)

> **本指南是 `eas-skill-creator` 步骤 1 需求收集 → 步骤 2 模式决策之间的「决策沉淀」规范。**
> 当 `requirement_profile` 收集完毕（满足本技能 SKILL.md 步骤 1.3 的退出条件）后，必须把关键设计判断沉淀为可追溯的决策记录。

---

## 一、为什么需要决策沉淀 (Why)

仅靠 `requirement_profile`（结构化 YAML）有三个不够：

1. **`requirement_profile` 是 Agent 内部数据结构**——不能跨 session 共享，不能 Review，不能被人类快速读懂
2. **需求收集过程中做出的关键判断**（如"为什么选 Pipeline 而非 Reviewer"、"为什么用 Inversion 而非 Pipeline+Inversion"）如果只留在对话上下文，下次重启就丢失
3. **决策理由必须显式写明**——避免后续 Review 时"为什么这样做"成谜

所以步骤 1 结束后、步骤 2 启动前，**必须产出决策文档**。

---

## 二、三类决策沉淀场景 (Three Scenarios)

按"影响范围"分三类，对应不同的沉淀路径：

| 场景 | 触发条件 | 沉淀路径 | 模板 |
|------|----------|----------|------|
| **场景 A：技能级需求决策** | 单技能内的模式选择、领域判断、字段约定 | `<cwd>/skills/{skill-name}/00NN-{topic}.md` | [`00NN-requirement.md`](templates/00NN-requirement.md) |
| **场景 B：跨技能架构决策** | 影响 ≥ 2 个技能 / 改变技能间协议 / 引入新约定 | `<cwd>/docs/decisions/00NN-{topic}.md` | 通用 ADR 模板（架构型） |
| **场景 C：执行型决策** | 步骤 7 迭代后的小决策、bugfix 决策 | `<cwd>/docs/decisions/00NN-{topic}.md` | 通用 ADR 模板（执行型） |

**沉淀路径说明**：`docs/decisions/` 是 ADR（Architecture Decision Record）行业标准目录约定（Michael Nygard 格式）。Agent 在宿主项目下落地跨技能决策时，推荐沿用此约定；若宿主项目已建立自有决策目录（如 `<cwd>/.easbot/decisions/`、`<cwd>/adr/` 等），Agent 应优先遵循宿主项目规范。

**路径变量说明**：
- `<cwd>`：使用本根技能的**宿主项目**根目录（Agent 调用本技能时的当前工作目录）
- `<cwd>/skills/{skill-name}/`：宿主项目下的技能目录
- `<cwd>/docs/decisions/`：宿主项目下的决策目录（与本技能无关，由宿主项目维护）

**判定速查**：
- ✅ 影响 1 个技能内的设计 → **场景 A**（本目录模板）
- ✅ 影响 ≥ 2 个技能 / 改变调用协议 → **场景 B**（宿主项目级 ADR）
- ✅ 迭代过程中的小调整 → **场景 C**（宿主项目级 ADR 执行型）

**重要**：场景 B 和 C 的模板**不在本技能目录内**，由宿主项目决定其格式。本目录仅提供场景 A 的模板；宿主项目如有自有 ADR 规范，Agent 应优先遵循宿主项目规范。

---

## 三、模板结构 (Template Anatomy)

### 3.1 技能级需求决策 9 章节

完整结构见 [`00NN-requirement.md`](templates/00NN-requirement.md)。每章作用：

| # | 章节 | 作用 | 必填 |
|---|---|---|---|
| 1 | **背景 (Context)** | 用户原始诉求、收集到的需求摘要 | ✅ |
| 2 | **需求画像 (Requirement Profile)** | 直接附上步骤 1 产出的 `requirement_profile` | ✅ |
| 3 | **关键判断 (Key Judgments)** | 步骤 1 过程中做出的关键判断清单 | ✅ |
| 4 | **备选方案 (Alternatives)** | 至少 2 个候选（模式、字段、路径）| ✅ |
| 5 | **决策 (Decision)** | 选了什么 + 表格明确 | ✅ |
| 6 | **依据 (Rationale)** | 为什么选这个 | ✅ |
| 7 | **具体动作 (Actions)** | 可勾选清单（落到文件路径）| ✅ |
| 8 | **影响 (Impact)** | 正面 ✅ / 风险 ⚠️ / 副作用 ❌ | ✅ |
| 9 | **回溯链接 (Backlinks)** | 指向后续步骤产出 + 宿主项目级 ADR | ✅ |

### 3.2 与 `requirement_profile` 的关系

```
requirement_profile (步骤 1 产出)
        │
        │ 输入
        ▼
00NN-requirement.md (本模板)
        │
        │ 驱动
        ▼
SKILL.md / scripts/ (步骤 2-7 产出)
```

**铁律**：
- `requirement_profile` 的字段 MUST 100% 出现在决策文档的「需求画像」章节
- 决策文档「关键判断」章节 MUST 列出 `requirement_profile` 中无法表达的设计选择（如"为什么选 Pipeline"）
- 决策文档「回溯链接」章节 MUST 指向最终产出的 SKILL.md / scripts

---

## 四、使用流程 (Usage Flow)

### 4.1 在步骤 1 → 步骤 2 衔接处

```bash
# 假设 <cwd> 是宿主项目根目录（如 /path/to/your-project）

# 1. 复制模板（使用本技能目录内的模板）
cp <eas-skill-creator>/references/templates/00NN-requirement.md \
   <cwd>/skills/{new-skill}/0001-initial-design.md

# 2. 填写 frontmatter（自动从 requirement_profile 复制 name/date/keywords）
# 3. 把 requirement_profile 粘贴到「需求画像」章节
# 4. 补充「关键判断」「备选方案」「决策」「依据」「具体动作」「影响」「回溯链接」
# 5. 在新技能的 SKILL.md 末尾追加"决策记录"小节，链接到本决策文档
```

### 4.2 决策编号规则

```
00NN-{topic}.md
```

- `00NN`：4 位编号，**从 0001 开始**（每个技能目录独立计数）
- 第一个需求决策通常是 `0001-initial-design.md`
- 修订追加"修订记录"章节，不另起文件

### 4.3 路径选择

**默认路径**（推荐）：
```
<cwd>/skills/{skill-name}/00NN-{topic}.md
```

- 与技能同目录，绑在一起
- 容易找（不需要翻 `<cwd>/docs/decisions/`）

**可选路径**（仅在以下情况使用）：
```
<cwd>/.easbot/skills/{skill-name}/decisions/00NN-{topic}.md
```

- 技能目录在 `<cwd>/.easbot/skills/`（私有）而非 `<cwd>/skills/`（公开）
- 决策属于"私密实验性"性质，不希望公开
- 需要宿主项目支持 `.easbot/` 私有知识目录约定

---

## 五、与其他决策沉淀的关系 (Relationship)

| 维度 | 本目录（技能级） | 宿主项目级决策目录 |
|------|------------------|-------------------|
| **范围** | 单技能 | 跨模块 / 跨技能 / 全局 |
| **永久性** | 半永久（随技能迭代） | 永久归档 |
| **Review** | 技能 owner 或本技能 | 宿主项目维护者 |
| **模板** | [`00NN-requirement.md`](templates/00NN-requirement.md) | 宿主项目自有 ADR 模板 |
| **触发** | 步骤 1 完成时 | 任何时候（特别是心跳、跨模块决策） |

**互相升级**：
- 技能级决策后续影响跨技能 → 沉淀为宿主项目级 ADR，加 `supersedes` 链接
- 宿主项目级 ADR 反过来约束新技能 → 新技能决策 MUST 引用相关 ADR 编号

---

## 六、反模式 (Anti-Patterns)

| ❌ 不要 | ✅ 应该 |
|---|---|
| 步骤 1 完成后直接进步骤 2，无决策文档 | 必产决策文档，再进步骤 2 |
| `requirement_profile` 与决策文档内容不一致 | 决策文档的「需求画像」 MUST 100% 复制 requirement_profile |
| 决策文档写完就丢，不在 SKILL.md 引用 | SKILL.md 末尾加"决策记录"小节链接 |
| 决策文档不写备选方案 | 至少 2 个并列候选 |
| 决策文档无"具体动作"清单 | 每条 MUST 含可勾选落地动作 |
| 跨技能决策放本目录 | 影响 ≥ 2 个技能必须升级到宿主项目级 ADR |
| 修订另起 v2 文件 | 在原文件追加"修订记录" |
| 引用本技能目录外的路径 | 本技能是自包含的，**只允许引用本技能目录内部** |

---

## 七、跨目录引用约束 (Cross-Directory Reference Constraint)

**[MUST] 本技能目录（`eas-skill-creator/`）是自包含的，模板与文档内 MUST NOT 出现以下引用：**

- ❌ 引用本技能目录**之外**的绝对路径
- ❌ 引用 `../../` 跨越本技能目录外的相对路径
- ❌ 引用宿主项目内的具体路径作为**本技能内部可访问的资源**（即不能从本技能目录"读取/写入"宿主项目的文件）

**[MAY] 允许的引用形式：**

- ✅ 本技能目录内部相对路径（如 `[guide.md](requirement-decision-guide.md)`）
- ✅ 通用占位符 `<cwd>/...` 表示"宿主项目根目录下"（仅用于**说明产物落地位置**，不是"本技能内部资源"）
- ✅ 通用占位符 `<eas-skill-creator>/...` 表示"本技能目录内部"（用于引用本技能模板）
- ✅ 引用**行业标准约定**作为推荐路径（如 `docs/decisions/` 是 ADR 行业标准目录，Agent 可在落地说明中推荐使用；若宿主项目已有自有约定，Agent 应优先遵循）

**理由**：本技能可能被不同项目、不同 Agent 框架调用。"自包含"是指本技能**自身不依赖宿主项目的特定文件**，而不是"不能提及任何约定"。Agent 在说明落地路径时可以推荐行业标准目录（如 ADR 的 `docs/decisions/`），但实际写入应遵循宿主项目自有约定。

---

## 八、速查卡片 (Cheat Sheet)

```
技能需求决策速查：

0. 步骤 1 完成后、步骤 2 启动前 MUST 产决策文档
1. 路径：<cwd>/skills/{skill-name}/00NN-{topic}.md
2. 编号：00NN 单调递增（每个技能目录独立计数）
3. 必含：requirement_profile 复制 + 关键判断 + 备选 + 决策 + 动作 + 影响 + 回溯
4. 新技能 SKILL.md 末尾加"决策记录"小节，链向决策文档
5. 跨技能影响 → 升级到宿主项目级 ADR（路径与模板由宿主项目决定）
6. 修订不另起文件，追加"修订记录"章节
7. 模板见 ./templates/00NN-requirement.md（9 章节）
8. [MUST] 本技能目录自包含，MUST NOT 引用目录外资源
```

---

**版本**：1.0.0 · 与 `eas-skill-creator` 步骤 1-2 衔接配套使用