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

> **本节为通用 spec 字段表，**非本技能 frontmatter 必填项**。按需选用：Reviewer 类技能必须 `reviewProcess`；有 `scripts/` 的技能必须含脚本目录；其他字段为建议性自检项。**

---

## 7. 关键原则 (Key Principles)

1. **description 决定触发**：第三人称，描述何时使用，不描述过程
2. **渐进式披露**：详细内容放 references/，body 保持精简（<500 行）
3. **Gate 是强约束**：没过 Gate 不继续，行为侧模式的灵魂
4. **模式可组合**：鼓励 2~3 种模式叠加，1+2 > 1

---

## 8. 步骤规范 vs Checklist 规范 (Step Spec vs Checklist Spec)

> 技能主体可能需要"一步步执行"也可能需要"逐项核查"——两种规范正交，应按模式选用。

### 8.1 何时用步骤规范 vs Checklist 规范

| 触发问题 | → 用步骤规范 | → 用 Checklist 规范 |
|---|---|---|
| 技能的核心是"**按顺序做事**"吗？ | ✅ 必须有步骤序列 | ❌ 不需要 |
| 技能的核心是"**逐项核对**"吗？ | ❌ 不需要 | ✅ 必须有 checklist |
| 技能需要"**生成后自检**"吗？ | ⚠ 可选（步骤内嵌校验） | ✅ 独立 checklist 更佳 |
| 技能需要"**多阶段 Gate 控流**"吗？ | ✅ Pipeline 步骤规范 | ⚠ 可选 Gate 条件清单 |

### 8.2 五大模式必选/可选矩阵

| 模式 | 步骤规范 (Step Spec) | Checklist 规范 (Checklist Spec) |
|---|---|---|
| **Tool Wrapper** | ❌ 不需要 | ⚠ 可选（仅「常见错误表」可作为轻度 checklist） |
| **Generator** | ⚠ 可选（生成阶段步骤） | ✅ **推荐**（输出模板校验清单） |
| **Reviewer** | ❌ 不需要 | ✅ **必须**（`references/checklist.md` 按严重度分级） |
| **Inversion** | ⚠ 可选（澄清阶段序列） | ❌ 不需要 |
| **Pipeline** | ✅ **必须**（`behavior.sequence.steps` + Gate 三要素） | ⚠ 可选（Gate 条件清单） |
| **Reference 类型技能** | ❌ 不需要 | ❌ 不需要（静态信息） |

> **硬约束**：Reviewer 模式 = 必须有 checklist；Pipeline 模式 = 必须有步骤规范（详见 §4.3 / §4.5）。
> **反模式**：Tool Wrapper 写 checklist（补知识不核查）/ Reference 写步骤（静态信息无流程）。

### 8.3 步骤规范最小结构 (Step Spec Minimum Structure)

适用场景：**Pipeline** 主模式 + **Inversion** / **Generator** 可选用。

```markdown
## 步骤序列 (Step Sequence)

### Step 1: <步骤名>
- **目标 (Goal)**: 本步要完成什么（1 句）
- **入口条件 (Entry)**: 前置依赖 / 必备输入（MUST 满足才能开始）
- **操作 (Action)**: 具体动作（动词开头，1~3 句）
- **出口条件 (Exit)**: 完成后产生的产物 / 状态
- **失败策略 (Failure)**: abort | retry | skip；含 maxRetries
- **回滚 (Rollback)**: 是否需要回滚 + 回滚动作

### Step 2: <步骤名>
...

## Gate 三要素 (Three Gates)

每步 MUST 明确三要素：
1. **入口 Gate**：依赖就绪、权限就位、输入存在
2. **出口 Gate**：产物已生成、校验已通过、人工已批准
3. **失败 Gate**：失败时的兜底动作 + 通知方式
```

### 8.4 Checklist 规范最小结构 (Checklist Spec Minimum Structure)

适用场景：**Reviewer** 主模式必备 + **Generator** 输出校验 / **Pipeline** Gate 条件清单可选。

#### 8.4.1 严重度分级（强制）

按本项目 §14.6 的严重度分级：

| 级别 | 含义 | 处理 |
|---|---|---|
| **P0 / Critical** | 阻塞：违反 = 契约失败 / CI 失败 | MUST 修复，禁止放行 |
| **P1 / High** | 重要：影响一致性 / 可维护性 | MUST 修复或显式豁免 |
| **P2 / Medium** | 推荐：风格 / 美观 | SHOULD 修复 |
| **P3 / Low** | 建议：锦上添花 | MAY 修复 |

#### 8.4.2 Checklist 项最小结构

每项 MUST 包含：

```markdown
## §<章节号> <章节名>

| ID | 检查项 | 通过条件 | 严重度 | 检查方式 |
|---|---|---|---|---|
| C-001 | 检查项标题 | 具体可验证条件 | P0/P1/P2/P3 | manual / auto |
| C-002 | ... | ... | ... | ... |
```

**强制约束**：

- [ ] 每项 MUST 有唯一 ID（如 `C-001` / `P1-S001`）
- [ ] 通过条件 MUST 可验证（不要写"看起来不错"）
- [ ] 严重度 MUST 按 §8.4.1 四级选一
- [ ] 检查方式 MUST 标 `manual` 或 `auto`（auto 项应有配套脚本）
- [ ] P0/P1 项 = 0 才能放行；P2/P3 不阻塞

#### 8.4.3 Reviewer 模式 checklist.md 模板

落地路径：`<skill-name>/references/checklist.md`（frontmatter 已声明 `filePath`）。

```markdown
# <技能名> Review Checklist

> 严重度：P0 = Blocker / P1 = MUST / P2 = SHOULD / P3 = MAY
> 通过条件：所有 P0 = 0；P1 = 0 或全部豁免；P2/P3 不阻塞。

## §1 <章节名>

| ID | 检查项 | 通过条件 | 严重度 | 检查方式 |
|---|---|---|---|---|
| C-001 | ... | ... | P0 | auto |

## §2 <章节名>
...
```

#### 8.4.4 Generator 模式输出校验清单

Generator 模式可使用**轻量 checklist**（不强制落地独立文件，body 内嵌即可）：

```markdown
## 输出校验 (Output Validation)

生成后 MUST 自检以下项：

- [ ] **C-G001** 必填字段齐全（`name` / `description` / `version`）
- [ ] **C-G002** 字符数合规（`name` ≤ 64 / `description` ≤ 1024）
- [ ] **C-G003** 文件路径使用相对路径
- [ ] **C-G004** 代码块带语言标记

任意项不通过 → 重新生成，禁止交付。
```

### 8.5 组合模式下的规范叠加 (Composition: Spec Stacking)

当 `composition: composed` 时，按主模式选规范，次要模式可叠加：

| 主模式 | 次要模式 | 步骤规范 | Checklist 规范 |
|---|---|---|---|
| Pipeline | + Reviewer | ✅ 主模式必选 | ✅ 次模式必选（双份清单） |
| Pipeline | + Inversion | ✅ 主模式必选 | ⚠ 次模式可省略 |
| Generator | + Reviewer | ⚠ 主模式可选 | ✅ 双份（生成校验 + 产物审查） |
| Inversion | + Pipeline | ✅ 次模式必选 | ⚠ 可选 |

> **反模式**：Tool Wrapper + Reviewer 组合——Tool Wrapper 不产出可审查产物，硬塞 checklist 会变成空壳。

### 8.6 常用 Pattern 与本技能模式对照 (Pattern Correspondence)

| 通用 Pattern | 本技能对应模式 | 关键产物 |
|---|---|---|
| **Template Pattern** | Generator | 输出模板 + 校验清单 |
| **Examples Pattern** | Generator / Tool Wrapper | 输入/输出示例对 |
| **Workflow Pattern**（带步骤清单）| Pipeline | 步骤序列 + Gate 三要素 |
| **Feedback Loop Pattern**（带校验循环）| Pipeline + Reviewer / Generator | 自检步骤 + 失败兜底 |
| **Conditional Workflow Pattern** | Pipeline（带分支）| 决策点 → 子流程 |
| **Checklist Pattern**（核心）| **Reviewer** | `references/checklist.md` 按严重度分级 |

---

## 9. frontmatter 字段全集 (Frontmatter Field Reference)

基于 [AgentSkills 规范](https://agentskills.io/specification) 的标准字段 + 本项目实践扩展。

### 9.1 字段对照表

| 字段 | 必填 | 约束 | 说明 |
|---|---|---|---|
| **name** | ✅ MUST | hyphen-case，≤64 字符，与目录名一致 | 技能唯一标识 |
| **description** | ✅ MUST | 第三人称，仅描述触发条件，**MUST ≤ 1024** / SHOULD ≤ 500 字符 | Agent 加载决策依据 |
| **license** | ⚠ 推荐 | 协议名或引用 bundled license 文件 | 协议声明 |
| **metadata** | ⚠ 可选 | 自定义 key-value（项目内可任意键名） | 推荐放 `category` / `version` / `author` / `compatibility` / `tags` |
| **allowed-tools** | ⚠ 可选 | 空格分隔的预批准工具列表 | 跨 Agent 互操作 |

### 9.2 关键约束

- **name**: hyphen-case 格式，仅使用字母、数字和连字符（无括号、特殊字符）
- **description**:
  - 以"该技能应在..."开头，专注于触发条件
  - **永远不要总结技能的过程或工作流程**
  - 字符控制：**SHOULD ≤ 500** / **MUST ≤ 1024**
  - 第三人称（"该技能应在...时使用"）

### 9.3 description 字段写法规范 (Writing Effective Descriptions)

> 本节是 §9.2 第 2 项 description 字段的完整写法规范，参照 [AgentSkills Writing Effective Descriptions](https://agentskills.io/specification) 最佳实践，落地为本项目的强约束。Agent 创建或修订任何技能 SKILL.md 的 `description` 字段 MUST 满足本节全部 P0 项。

#### 9.3.1 三要素 (Three Mandatory Elements)

一份合格的 `description` MUST 同时含 **WHAT** + **WHEN** + **第三人称** 三要素，缺一项视为 P0 缺陷：

| 要素 | 含义 | 落地要求 |
|---|---|---|
| **WHAT** | 技能做什么（具体能力清单） | 动词引导的能力列表；避免泛词（"处理文档"） |
| **WHEN** | Agent 何时应触发（触发场景 + 触发短语） | 含 5+ 触发短语 + 1+ 反场景 |
| **第三人称** | 描述注入 Agent 系统提示，必须第三人称 | "该技能应在…时使用"，**禁止**"我" / "你可以" |

#### 9.3.2 字符控制 (Length Control)

| 阈值 | 性质 | 处置 |
|---|---|---|
| **≤ 500 字符** | SHOULD（推荐值） | 满足时优先采用，便于 Agent 上下文预算 |
| **≤ 1024 字符** | MUST（硬上限） | `quick-validate.ts` 强制；超过直接拒绝 |
| **> 1024 字符** | 校验失败 | 提交会被 CI 拦截（§7.5 CI 契约） |

#### 9.3.3 句式模板 (Sentence Templates)

**MUST 用以下两种句式之一**：

```yaml
# 句式 A：触发场景优先（推荐）
description: 该技能应在 Agent 需要 <触发场景 1> / <触发场景 2> 时使用。<能力简述>。触发短语包括 <短语 1>、<短语 2>、…。不适用：<反场景 1> / <反场景 2>。

# 句式 B：能力优先（适用于工具类技能）
description: 该技能应在 <能力领域> 时使用，覆盖 <路径 1> / <路径 2> / <路径 3>。触发短语包括 <短语 1>、<短语 2>、…。不适用：<反场景 1> / <反场景 2>。
```

**反模式（绝对禁止）**：

- ❌ "我能够帮你…" —— 第一人称（违反 §13.1）
- ❌ "你可以使用本技能…" —— 第二人称（违反 §13.1）
- ❌ "这个工具非常好用" —— 主观评价（违反 §13.6）
- ❌ "处理文档" —— 泛词，无 WHAT/WHEN
- ❌ 在 description 里复述 7 步工作流 —— 违反 §13.6「不在 description 中总结过程」
- ❌ 缺反场景 —— Agent 无法判断何时不触发

#### 9.3.4 正反示例 (Good vs Bad Examples)

**✅ 优秀 description**（[eas-skill-creator](file:///e:/work/apps/eas/agent-skills/skills/builtin/eas-skill-creator/SKILL.md) 当前 frontmatter）：

```yaml
description: 该技能应在 Agent 需要创建、验证、打包或迭代 Skill 时使用。覆盖 SKILL.md 结构规范、scripts/references/assets 资源组织、Tool Wrapper / Generator / Reviewer / Inversion / Pipeline 五大模式选择、init-skill 初始化。触发短语：创建技能、写技能、Skill Spec、frontmatter、5 大模式、init-skill、验证技能、打包技能、迭代技能。不适用：一次性 prompt / 临时记录 / 仅补 API 知识。
```

**❌ 反面示例 1**（违反「不总结过程」）：

```yaml
# ❌ 错误：在 description 里复述工作流
description: 该技能通过 7 步流程（需求收集 → 模式选型 → 初始化 → 填充 → 校验 → 打包 → 迭代）帮助 Agent 创建技能。
```

**❌ 反面示例 2**（违反「第一人称」）：

```yaml
# ❌ 错误：第一人称
description: 我能帮你创建技能，你可以用我来做 SKILL.md 模板和打包。
```

**❌ 反面示例 3**（违反「无 WHAT/WHEN」）：

```yaml
# ❌ 错误：泛词
description: 处理技能相关的事情。
```

**❌ 反面示例 4**（缺反场景）：

```yaml
# ❌ 错误：Agent 无法判断何时不触发
description: 该技能应在 Agent 需要处理文档、生成报告、分析数据、管理项目时使用。
```

#### 9.3.5 与 AGENTS.md / eas-skill-using 的同步 (Cross-Section Sync)

按 AGENTS.md §6.2 演化规则，`description` 字段修订 MUST 同步更新：

| # | 同步目标 | 字段 |
|---|---|---|
| 1 | `.claude-plugin/marketplace.json` | `plugins[].description` |
| 2 | `README.md` + `README.en.md` | 内置技能一览 / 工具类技能表的描述列 |
| 3 | `skills/builtin/eas-skill-using/SKILL.md` | 仅 `builtin` 类别：能力索引 + 决策辅助 + 场景映射 |
| 4 | `metadata.version` | frontmatter `version` bump（patch） |

> 失同步会被本评审（`docs/decisions/0006-review-all-skills.md`）判为 P0。

#### 9.3.6 自检清单 (Self-Check Before Commit)

提交前 Agent MUST 逐项打勾：

- [ ] **WHAT** 含具体能力清单（≥ 3 项）
- [ ] **WHEN** 含 5+ 触发短语（中英文混排可）
- [ ] 含 1+ 反场景（"不适用"或"不触发"段）
- [ ] 第三人称（"该技能应在…时使用"）
- [ ] 总长度 ≤ 500 字符（推荐）/ ≤ 1024 字符（硬上限）
- [ ] 未复述工作流 / 步骤 / 模式细节
- [ ] 未含主观评价词（"非常好" / "极其强大" / "完美"）
- [ ] 未使用第一人称 / 第二人称（"我" / "你可以"）
- [ ] 未含尖括号（`quick-validate.ts` 拒收）
- [ ] `metadata.version` 已 bump patch
- [ ] `marketplace.json` 已同步
- [ ] `README*.md` 已同步
- [ ] 跑 `npx tsx skills/builtin/eas-skill-creator/scripts/quick-validate.ts <skill-dir>` 通过

### 9.4 字段分层策略

| 层 | 字段 | 推荐用法 |
|---|---|---|
| **AgentSkills 标准**（顶层） | `name` / `description` / `license` / `metadata` / `allowed-tools` | 通用；跨 Agent 互操作 |
| **5 大模式规范字段**（顶层） | `mode` / `composition` / `secondaryModes` / `compositionConnections` / `behavior` / `reviewer` / `deliveryChecklist` | 行为类技能的规范字段；保留顶层 |
| **本项目扩展**（metadata 块内，**强制**） | `category` / `version` / `author` / `compatibility` / `tags` | EASBot 内部组织；不影响外部 Agent；**禁止出现在顶层**（quick-validate.ts 白名单已移除） |

> **规范生效**: 本分层策略已通过 [0012 跨技能决策](file:///e:/work/apps/eas/agent-skills/docs/decisions/0012-cross-skill-decision-frontmatter-metadata-normalize.md) 确立；任何 `category` / `version` / `tags` / `author` / `compatibility` 出现在顶层视为 P0 违规，quick-validate 直接拒绝。

> **关于 `compatibility`**：**本项目实践**（`[实现细节]` quick-validate 白名单当前未收录 `compatibility` 顶层字段）—— `compatibility` 暂放入 `metadata` 块；AgentSkills 规范允许作为顶层字段，待 quick-validate 扩展白名单后可上提。
