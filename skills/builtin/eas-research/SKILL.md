---
name: eas-research
description: 该技能应在用户需要做调研 / 分析 / 对比 / 查证 / 趋势预测时（"调研 X" / "对比 A 和 B" / "为什么 Y" / "2025 年 Z 趋势" / "查一下 W" / "技术选型" / "竞品分析" / "市场调研" / "文献综述" / "根因调研"）使用。覆盖商业 / 技术 / 学术 / 政策 / 趋势 / 竞品等多类场景；产出带引用、有置信度、可追溯的研究报告。不适用：实施性活动（写代码 / 修 bug） / 领域专家判断 / 简单事实速答 / 项目级决策 / 元层管理。
mode: Pattern
composition: orchestrator
behavior:
  thinking_framework:
    name: 'Research Conductor (源-证据-路由-冲突解决)'
    core_principles:
      - id: source-hierarchy
        text: 'P0 官方原始 > P1 权威二手 > P2 专业社区 > P3 一般参考'
      - id: cross-validation
        text: '核心声明 MUST ≥3 独立源相互佐证'
      - id: conflict-resolution
        text: '源冲突 MUST 呈现两边 + 差异根因，不武断取舍'
      - id: no-fabrication
        text: 'MUST NOT 编造数据；未知即声明'
metadata:
  category: builtin
  version: 3.0.0
  author: EASBot
  compatibility: claude-code / codex / gemini-cli / 其他支持 Skill 协议的 Agent
  tags:
    - easbot
    - pattern
    - research
    - investigation
    - comparison
    - analysis
    - sub-skill-routing
---

# eas-research - 调研分析 (Research & Analysis)

> **分类位置**：`skills/builtin/`（EASBot builtin 核心技能；进 `eas-skill-using` 能力索引）
> **必填字段**：`name` / `description` / `mode=Pattern` / `composition=orchestrator` / `behavior.thinking_framework.core_principles` (4 项) / `metadata.category=builtin`
> **重构版本**：v3.0.0（从 `eas-dev-research` v2.0.0 升级并去 dev 耦合；落地决策见 [0019-upgrade-eas-dev-research-to-builtin.md](../decisions/0019-upgrade-eas-dev-research-to-builtin.md)）

---

## 概述 (Overview)

`eas-research` 是 EASBot 的**通用研究 / 分析**核心技能。当用户需要查资料 / 做对比 / 挖根因 / 看趋势 / 写报告时，Agent 加载本技能，按"源层级 → 证据收集 → 路由到子 reference → 冲突解决"四步推进，产出带引用、有置信度、可追溯的研究报告。

**核心定位**：

- **Pattern 模式**（思维框架）+ **orchestrator**（调度 2 个子 reference）
- **6 大场景**：商业调研 / 技术调研（含代码外部：库对比 / 框架选型 / 趋势）/ 学术文献 / 政策分析 / 趋势预测 / 竞品对比 / 根因调研
- **2 个子 reference**：
  - `references/research-report.md`（默认）—— 单交付物独立研究报告
  - `references/comparison-analysis.md` —— 多实体对比（竞品 / 方案 / 框架对比）
- **不限于软件开发场景** —— 任何需要调研 / 分析 / 对比的任务都适用

**不做什么**（明确边界）：

- ❌ 不产出实施性交付物（代码 / 规格 / 设计方案等）—— 这是研究技能，落地物是**调研报告**，不是实现
- ❌ 不修根因 / 不做修复性操作 —— 这是研究技能，不是诊断 / 调试流程
- ❌ 不替代领域专家判断（如医学 / 法律 / 金融）—— 仅作信息综合，不作最终判断
- ❌ 不做项目级决策 —— 决策是用户的事；本技能只提供决策所需的调研材料

## 何时使用 (When to Use)

**该技能应在以下情况使用**：

- 用户说 "调研 / 研究 / 调查 / 查一下 X"
- 用户说 "对比 A 和 B / X vs Y 该选谁 / 哪个更好"
- 用户说 "为什么会出现 Y（根因）/ Z 是什么原理 / W 怎么工作"
- 用户说 "2025 年 X 领域有什么趋势 / 业界最佳实践"
- 用户说 "竞品分析 / 市场调研 / 文献综述 / 政策分析"
- 用户说 "写一份研究报告 / 出个调研报告 / 帮我整理资料"
- 用户说 "技术选型 / 框架对比 / 库评估"（软件领域外部调研 —— 选哪个库属通用研究范围）

**不适用于**：

- ❌ **实施性活动**（写代码 / 修 bug / 写规格 / 评审 PR 等）—— 研究只提供决策材料
- ❌ **决策本身**（"该不该引入 X"）—— 决策是用户 / Agent 的事；本技能只产出调研报告
- ❌ **领域专家判断**（医学 / 法律 / 金融等）—— 仅作信息综合，不作最终判断
- ❌ **简单事实查询**（L1 轻度查证）—— Agent 直接答，无需本技能
- ❌ **元层管理**（技能搜索 / 创建 / 演化 / 配置）—— 走对应 builtin 元技能

## 快速参考 (Quick Reference)

| 项              | 内容                                                                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 模式            | **Pattern**（思维框架）+ **orchestrator**（调度 2 个子 reference）                                                                            |
| 6 大场景        | 商业调研 / 技术调研 / 学术文献 / 政策分析 / 趋势预测 / 竞品对比 / 根因调研                                                                    |
| 核心思维框架    | Research Conductor（源层级 + 证据收集 + 路由 + 冲突解决）                                                                                     |
| 4 项核心原则    | source-hierarchy / cross-validation / conflict-resolution / no-fabrication                                                                    |
| 子 reference    | `references/research-report.md`（默认）/ `references/comparison-analysis.md`（多实体对比）                                                    |
| 路由决策        | 简单事实查询 → 父技能直接答；需产出报告 → 路由到 `research-report`；多实体对比 → 路由到 `comparison-analysis`                                 |
| 源层级          | P0 官方原始 → P1 权威二手 → P2 专业社区 → P3 一般参考                                                                                         |
| 引用规范        | `[cite:N]` inline；1-3 引用 / 实质性声明；≥3 独立源 / 核心声明                                                                                |
| 红线            | 不编造数据 / 不第一人称 / 不武断取舍 / 不虚构引用                                                                                             |
| 必读 references | [research-report.md](references/research-report.md)（默认路由） / [comparison-analysis.md](references/comparison-analysis.md)（多实体对比）   |
| 必含 assets     | [research-report-template.md](assets/research-report-template.md) / [comparison-analysis-template.md](assets/comparison-analysis-template.md) |
| 无前置依赖      | 独立 builtin 技能；不依赖 dev 包任何技能                                                                                                      |
| 落地路径        | `<cwd>/.easbot/knowledge/docs/research/<topic>/research-report.md` 或 `comparison-analysis.md`                                                |

## 第一性原理 (First Principles)

> **"证据 > 观点；多源 > 单源；诚实 > 完整"**

**判断标准**：

1. **每个核心声明是否有 ≥3 独立源佐证？** — 否则 MUST 标 `[SINGLE-SOURCE]` / `[INSUFFICIENT DATA]`
2. **数据是否带时间戳？** — 否则 MUST 标 `(as of <date> public info)`
3. **冲突是否被压制？** — 不可武断取舍，必须呈现两边
4. **未知是否被掩盖？** — 不可编造 / 模拟数据；未知 = 已知未知（MUST 显式声明）

**反模式**：

- ❌ "我查了 3 个来源都说……"（3 个来源相互引用 = 1 个来源）
- ❌ "业内普遍认为……"（无具体源 = 编造）
- ❌ "X 性能比 Y 高 30%"（无引用 + 无单位 + 无时间 = 虚假陈述）
- ❌ "综合来看……"（综合无引用 = 总结即编造）

## 4 步研究流程 (Four-Step Research Process)

> **详细子场景规则见 [research-report.md](references/research-report.md) / [comparison-analysis.md](references/comparison-analysis.md)；本节仅保留速查入口。**

### Step 1：意图分类 + 深度标定

**动作**：

1. **分类意图**：事实查证 / 对比分析 / 趋势模式 / 系统建模 / 探索性
2. **标定深度**：L1（快速验证）/ L2（中等分析）/ L3（深度建模）
3. **判断交付物**：是否需要结构化报告

**输出**：路由决策（直接答 / 路由 `research-report` / 路由 `comparison-analysis`）

### Step 2：迭代证据循环

```
Hypothesize → Search → Validate → Refine → (重复或终止)
```

- 每轮产出：验证事实（带 source ID）+ 更新 gap list + 下轮理由
- **终止条件**：核心声明 ≥3 独立源 OR 剩余 gaps 可忽略 OR 工具边界（显式声明）

### Step 3：冲突解决

- 源一致 → 综合 + 置信度标注
- 源冲突 → 呈现两边 + 差异根因（指标差异 / 时段差 / 立场偏差）；**MUST NOT 武断取舍**
- 数据不足 → 标 `[INSUFFICIENT DATA]`，建议补充路径

### Step 4：路由到子 reference

- 单交付物研究 → [research-report.md](references/research-report.md)（含报告结构 + 写作原则 + 长度校准 + Quality Gate）
- 多实体对比 → [comparison-analysis.md](references/comparison-analysis.md)（含 Porter's Five Forces / 财务基准 / SWOT / 差异化手册）

## 输入契约 (Input Contract)

| 项   | 要求                                                            |
| ---- | --------------------------------------------------------------- |
| 必备 | 用户研究意图（自然语言描述：调研主题 / 范围 / 深度期望）        |
| 可选 | 已知候选实体清单（如 "对比 A / B / C"）                         |
| 可选 | 行业背景 / 时效要求                                             |
| 可选 | 已有参考资料 / 链接                                             |
| 拒绝 | 纯技术语法问题 / 编程 API 用法 / 软件代码 bug —— 走对应领域技能 |
| 拒绝 | 项目级软件决策（"该不该引入 Kafka"）—— 走项目级需求 / 决策流程  |

## 输出契约 (Output Contract)

**本技能是调度器**，直接产出仅限**简答型 L1 事实查询**；结构化研究报告 MUST 由子 reference 产出。落地路径规范（builtin 技能通用默认；宿主项目可在自有 `.easbot/AGENTS.md` 声明覆盖）：

| 场景                        | 路径                                                                   |
| --------------------------- | ---------------------------------------------------------------------- |
| **研究报告（默认）**        | `<cwd>/.easbot/knowledge/docs/research/<topic>/research-report.md`     |
| **对比分析（多实体）**      | `<cwd>/.easbot/knowledge/docs/research/<topic>/comparison-analysis.md` |
| **探索性速答（L1 直接答）** | （不落档；chat 内直接答复）                                            |
| **临时 / 实验性**           | `<cwd>/.easbot/state/scratch-research-<topic>.md`                      |

**禁止路径**（会污染版本控制或与既有规范冲突）：

- ❌ `<cwd>/research.md`（仓库根，会入仓）
- ❌ `<cwd>/reports/...` / `<cwd>/docs/research/...`（仓库根平级，会入仓或污染 `docs/`）
- ❌ 任何 `<cwd>/.easbot/research/` 散落目录（与新规范路径层级不一致）
- ❌ `<cwd>/.easbot/knowledge/docs/dev/...`（**dev 路径**已不再适用本技能 —— research 改归 builtin，路径根改为 `docs/research/`）

**`<topic>` 命名**：kebab-case，≤ 64 字符；如 `compare-postgres-mysql` / `research-grpc-trends-2026` / `investigate-cache-stampede` / `competitor-analysis-stripe-2026`。

**frontmatter 必含字段**（研究报告 / 对比分析产物）：

- `topic` / `phase: research|comparison-analysis` / `status: draft|confirmed` / `created_at` / `updated_at`
- `research_type: business|technical|academic|policy|trend|competitive|general`
- `depth: L1|L2|L3`
- `source_count`（实际引用源数）/ `confidence: high|medium|low`（整体置信度）
- `citations: '[cite:N]'` 列表（如适用）

## 失败处理 (Failure Handling)

| 情况                              | 动作                                                        |
| --------------------------------- | ----------------------------------------------------------- |
| 用户意图不清                      | 退回 Step 1；询问研究主题 + 深度期望 + 交付物期望           |
| 源不足（<3 独立源）               | 继续迭代证据循环；如工具边界已达 → 标 `[INSUFFICIENT DATA]` |
| 路由歧义（"调研 + 对比"混合）     | 按**主交付物**路由；副意图作分析修饰                        |
| 多交付物（"市场报告 + 竞品对比"） | 各自路由独立产出（每个产物 1 个独立文件）                   |
| 用户拒绝子 reference 路由         | 退回父技能直接产出；显式声明"未经子 reference 完整流程"     |
| 数据时效 > 6 个月                 | 标 `(data aged)`；提醒用户重新核实                          |
| 用户原意是软件代码内部调研        | 拒绝；引导至代码层面的设计 / 诊断 / 评审流程                |

## 常见错误 (Common Mistakes)

| ❌ 不要                       | ✅ 应该                                                  |
| ----------------------------- | -------------------------------------------------------- |
| 跳过 Step 1 意图分类          | MUST 先分类 + 标定深度 + 路由                            |
| 单源支撑核心声明              | MUST ≥3 独立源；否则标 `[SINGLE-SOURCE]`                 |
| 武断取舍冲突源                | MUST 呈现两边 + 差异根因                                 |
| 编造数据填空白                | 未知 = 已知未知；MUST 声明                               |
| 报告 + 直接答混在一起         | chat 答 + 文件落地报告（解耦）                           |
| 走完所有 4 步才发现是 L1 速答 | Step 1 先判深度；L1 直接答无需 4 步                      |
| 引用编号对不上                | MUST 与工具返回的真实索引对齐                            |
| 用第一人称写报告              | MUST 第三人称；"研究发现" / "数据显示"                   |
| 把"代码内部调研"当 research   | 走代码层面的设计 / 诊断 / 评审流程（不是调研类技能职责） |

## 参考资料 (References)

- [research-report.md](references/research-report.md) —— 默认路由；研究报告结构 + 写作原则 + 长度校准 + Quality Gate + 红线规则
- [comparison-analysis.md](references/comparison-analysis.md) —— 多实体对比路由；Porter's Five Forces + SWOT + 财务基准 + 定价策略 + 差异化手册 + 监控频率

## 与其他技能的关系 (Relationships)

| 技能                                                                    | 关系                                                                                                     |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `eas-skill-using`                                                       | **导航前置** —— 本技能被 `eas-skill-using` 能力索引收录                                                  |
| `eas-skill-creator`                                                     | **规范基线** —— 本技能遵循其结构 + 5 大模式 + frontmatter 规范                                           |
| `eas-skill-find`                                                        | **互补** —— 用户可先 `eas-skill-find` 找现成技能（市场 / 本地），再用本技能做信息综合                    |
| `eas-planning-writer`                                                   | **不重叠** —— planning-writer 是项目级长任务（三件套 task_plan/findings/progress）；本技能是单次调研产物 |
| `eas-agent-creation` / `eas-agent-evolution` / `eas-prompt-creator`     | **不重叠** —— 三个 builtin 服务 Agent 自身管理；本技能服务研究 / 分析                                    |
| 软件开发类技能（如 spec / design / code review / debugging 等）         | **互补 / 边界清晰** —— 开发类技能产出实现 / 规格 / 评审报告；本技能产出**调研报告**（不与开发流程互斥）  |
| `eas-chinese-writer` / `eas-docx` / `eas-pdf` / `eas-pptx` / `eas-xlsx` | **互补** —— tools 包负责最终产出格式（Word / PDF / PPT / Excel）；本技能只出 Markdown 内容               |

---

**最后更新**：2026-08-08
