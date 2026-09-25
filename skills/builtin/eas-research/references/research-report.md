---
name: research-report
description: 该 reference 是 `eas-research` 的默认子路由，用于产出独立研究报告（市场调研 / 技术评估 / 政策分析 / 文献综述 / 可行性研究 / 通用研究）。如任务不涉及多实体对比，默认路由到此。
metadata:
  phase: research
  parent_skill: eas-research
  routing_priority: default
---

# 研究报告 (Research Report)

> **所属 reference**：`eas-research`（默认子路由）
> **父技能**：[`eas-research`](../SKILL.md)
> **模板**：[`assets/research-report-template.md`](../assets/research-report-template.md)
> **触发场景**：单交付物研究 / 多交付物中的"通用研究报告"部分
> **落地路径**（builtin 技能通用默认；宿主项目可在自有 `.easbot/AGENTS.md` 声明覆盖）：`<cwd>/.easbot/knowledge/docs/research/<topic>/research-report.md`

---

## 概述 (Overview)

本 reference 是 `eas-research` 的**默认子路由**，产出任何研究交付物作为结构化报告。覆盖市场调研 / 技术评估 / 政策分析 / 行业深度研究 / 文献综述 / 可行性研究 / 通用研究等所有不涉及多实体对比的研究场景。

**继承父技能约束**：源层级 / 引用规范 / 交叉验证 / 冲突解决（见父技能 SKILL.md §第一性原理 + §4 步流程）。

**不做什么**：

- ❌ 不产出实施性交付物（代码 / 规格 / 设计方案等）—— 这是研究技能，落地物是**调研报告**，不是实现
- ❌ 不修根因 / 不做修复性操作 —— 这是研究技能，不是诊断 / 调试流程
- ❌ 不替代领域专家判断（医学 / 法律 / 金融等）—— 仅作信息综合，不作最终判断
- ❌ 不做多实体对比 —— 默认路由到 `comparison-analysis`（与本 reference 是同 sibling 路由关系）

## 何时使用 (When to Use)

**该 reference 应在以下情况使用**：

- 用户说 "写一份研究报告 / 出个调研报告"
- 用户说 "市场调研 / 技术评估 / 政策分析 / 文献综述"
- 用户说 "调研 X（无明确对比对象）"
- 用户说 "深度分析 / 综合调研 / 可行性研究"
- 多交付物任务中的"通用研究报告"部分
- 商业 / 学术 / 政策 / 技术 / 趋势 等多领域通用

**不适用于**：

- ❌ 多实体对比（走 `comparison-analysis` 子路由）
- ❌ 简单事实查询（L1 速答，由父技能直接处理）
- ❌ 软件项目级决策（"该不该引入 Kafka"）—— 走项目级需求 / 决策流程（与本研究技能的"调研"职责不同）
- ❌ 软件代码内部调研（已有 codebase 的 API 调用 / 内部实现）—— 走代码层面的 spec / design / diagnose / review 流程（与本"调研"职责不同）

## 快速参考 (Quick Reference)

| 项       | 内容                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| 模式     | Generator（产出研究报告）+ 父技能 Pattern（思维框架）+ orchestrator                                                 |
| 路由     | `eas-research` 默认路由；多实体对比场景 MUST 路由到 `comparison-analysis`                                           |
| 默认格式 | Markdown（GFM）+ 引用规范 `[cite:N]`                                                                                |
| 必含章节 | Executive Summary / Scope & Methodology / Key Findings / Conflict & Uncertainty / Discussion / Conclusion / Sources |
| 可选章节 | 领域特定结构（学术 / 投资 / 技术 / 政策）/ Appendix                                                                 |
| 源层级   | P0 官方原始 → P1 权威二手 → P2专业社区 → P3一般参考                                                                 |
| 引用规范 | `[cite:N]` inline；1-3 引用 / 实质性声明；≥3 独立源 / 核心声明                                                      |
| 红线     | 不编造数据 / 不第一人称 / 不武断取舍 / 不虚构引用                                                                   |
| 模板     | [research-report-template.md](../assets/research-report-template.md)                                                |
| 落地路径 | `<cwd>/.easbot/knowledge/docs/dev/<topic>/research-report.md`                                                       |

## 第一性原理 (First Principles)

> **"报告是独立可读的参考文档；chat 是执行摘要；两者解耦"**

**判断标准**：

1. **报告能否脱离对话上下文独立阅读？** — 是 → 报告合格；否 → 缺失上下文，**MUST** 补足
2. **核心事实是否带 `[cite:N]`？** — 是 → 可信；否 → **MUST** 标 `[unverified]` 或补引用
3. **冲突是否被呈现？** — 是 → 客观；否 → 武断
4. **第一人称是否被消除？** — 是 → 中立；否 → **MUST** 改为"研究发现" / "数据显示"
5. **未发现的数据是否标 N/A？** — 是 → 诚实；否 → **MUST** 避免编造

**反模式**：

- ❌ "我查了 3 个来源都说……"（3 个相互引用 = 1 个来源）
- ❌ "业内普遍认为……"（无具体源 = 编造）
- ❌ "综合来看……"（综合无引用 = 总结即编造）
- ❌ "我认为 / 我们建议 / 大家需要"（第一人称 = 主观）

---

## 1. 内容分离 (Content Separation)

报告是**独立参考文档**——可脱离对话上下文阅读。

- **对话直接回答**放 chat 响应中，**不**放进报告
- 把 chat 响应视为**执行摘要**，报告视为**完整分析**
- 报告 MUST 仅含研究发现、分析、证据

---

## 2. 报告格式 (Report Format)

### 2.1 Markdown 规范 (Markdown Specification)

报告使用**标准 GitHub-Flavored Markdown (GFM)**，支持：

- 标准 Markdown：标题 / 段落 / 列表 / 强调 / 链接 / 代码块
- Markdown 表格（用于对比和结构化数据）
- Inline `[cite:N]` 引用（与搜索结果索引对齐）
- LaTeX 数学表达式：`\( \)` inline / `\[ \]` block。**禁止** `$` / `$$` 语法
- **禁止** Mathpix Markdown —— 纯 GFM 即可

> 价格 / 百分比 / 日期等数字文本作为常规文本，**不**用 LaTeX 包裹。

### 2.2 标题层级 (Heading Hierarchy)

- `#`（H1）—— 仅报告标题
- `##`（H2）—— 主章节
- `###`（H3）—— 子章节
- 所有标题 MUST 描述性中立——**禁止**修辞 / 劝说 / 论辩
- **禁止** 跳级（如 H1 直接到 H3）

### 2.3 表格 (Tables)

- 对比 2+ 实体的共享属性时 MUST 用表格
- 结构化数据有明确行列时 MUST 用表格
- 读者需并排对比时优先用表格
- 表格聚焦 —— 列数 > 6-7 时考虑拆分
- 表格单元格如来自源 MUST 加引用

---

## 3. 报告结构 (Report Structure)

模型根据主题 / 目的 / 复杂度决定适当结构。

### 3.1 通用组件 (Common Components)

| 组件                                         | 用途                     |
| -------------------------------------------- | ------------------------ |
| **Title（标题）**（H1）                      | 清晰描述性报告标题       |
| **Executive Summary / Overview（执行摘要）** | 关键发现简要综合         |
| **Body sections（正文）**（H2/H3）           | 按主题 / 论点 / 时间组织 |
| **Analysis / Discussion（分析 / 讨论）**     | 解读 / 取舍 / 含义       |
| **Conclusion（结论）**                       | 发现总结 + 可执行要点    |

### 3.2 领域特定结构 (Domain-Specific Structures)

适用领域使用领域惯例：

| 领域                                  | 结构                                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **学术 (Academic)**                   | Introduction → Literature Review → Methodology → Analysis → Discussion → Conclusion                     |
| **投资 / 市场 (Investment / Market)** | Executive Summary → Industry Overview → Competitive Landscape → Financial Analysis → Risks → Conclusion |
| **技术 (Technical)**                  | Overview → Architecture / Methodology → Analysis / Results → Discussion                                 |
| **政策 / 法律 (Policy / Legal)**      | Summary → Context → Stakeholder Analysis → Evidence Review → Implications → Recommendations             |

**MUST 按查询实际需要适配结构**——不为简单查询强套模板。

---

## 4. 引用系统 (Citation System)

### 4.1 何时引用 (When to Cite)

**MUST 引用**（满足任一）：

- 主题经过调研（做了工具调用）
- 报告含来自源的客观声明
- 涉及数据 / 统计 / 研究发现
- 描述事件 / 发现 / 发展

**可选 / 不引用**：

- 个人写作 / 观点
- 创意写作
- 模板 / 空白表单
- 用户明确说"不需要引用"

### 4.2 引用格式 (Citation Format)

Inline 使用 `[cite:N]`，N 为工具返回的数字索引。

**Inline 引用示例**：

```markdown
Recent research shows significant AI advances. Multiple studies confirm this trend.[cite:2][cite:3][cite:4]

Climate change impacts are accelerating globally. Temperature increases exceed predictions.[cite:5][cite:6]
```

**表格引用示例**：

```markdown
| Method   | Accuracy | Source   |
| -------- | -------- | -------- |
| Method A | 95.2%    | [cite:8] |
| Method B | 93.8%    | [cite:9] |
```

### 4.3 引用规则 (Citation Rules)

- `[cite:N]` 紧跟声明或事实后
- 多源：`[cite:2][cite:5]` —— **无空格 / 无范围**
- 每个实质性声明 1-3 个引用
- 全文引用密度一致
- 长报告末尾 MUST 含 "Sources" 节列出所有引用 URL 或源标识
- **MUST** 仅引用实际搜索结果中的源 —— 不虚构引用

### 4.4 引用资产 (Citing Assets)

代码文件 / PDF 等资产（`type` 为 `code_file` 或 `pdf`）按 `id` 编号 inline 引用：

- 在相关标题或段落后**新一行**用 `[cite:N]` 引用资产——**禁止** inline 到句中
- 同一资产**禁止**重复引用
- **禁止**引用未通过工具获取的资产
- **禁止**按文件名引用 —— MUST 按 `id` 编号

### 4.5 引用用户附加图片 (Citing User-Attached Images)

引用用户附加图片用 `[image:N]`，N 为附件元数据中的图片索引。

---

## 5. 写作原则 (Writing Principles)

### 5.1 结构 (Structure)

- 先给直接答案，再给支撑上下文
- 段落 3-8 句
- **MUST NOT** 使用第一人称（"I" / "my" / "we" / "our"）或自指短语

### 5.2 列表 (Lists)

- 信息天然列表化时用 bullet points：选项 / 功能 / 优缺点 / 步骤 / 推荐 / 3+ 并列项
- 列表提升可扫读性 —— 读者可能跳读或引用特定点时使用
- 扩展分析 / 论辩用散文（逻辑流更重要）

### 5.3 标题 (Headings)

- 用标题标识主题转换
- 不是每节都需要标题 —— 按长度复杂度判断
- 简单答案可能无需任何标题

### 5.4 简洁性 (Brevity)

- 长度匹配查询复杂度 —— 简单问题给简短答案
- **MUST NOT** 用不同词重述同一信息
- 答案可直接给出时省略开场白

### 5.5 逻辑流 (Logical Flow)

- 引入概念后再展开
- 转换显式（"基于此…" / "这引出问题…" / "相比之下…"）
- 结论综合分析，将关键线索凝聚成可执行洞察

### 5.6 分析 (Analysis)

- 先结论后证据
- 分析而非总结 —— 解释因果 / 取舍 / 信息为何可执行
- 源冲突时陈述分歧、评估源质量、为结论提供依据
- 适用时应用分析框架（如 Porter's Five Forces / SWOT）
- 预见 "so what?" —— 帮助用户理解信息为何重要、如何应用

### 5.7 相关性 (Relevance)

- 全程以用户核心问题为北极星
- 探索相关主题时，连接回主问题
- 预见后续问题并主动回应

---

## 6. 词汇校准 (Vocabulary Calibration)

写作前评估用户知识水平：

| 水平                     | 处理                            |
| ------------------------ | ------------------------------- |
| **Expert（专家）**       | 用精确领域术语，不解释          |
| **Intermediate（中等）** | 用技术术语 + 简短 inline 上下文 |
| **General（一般）**      | 首次出现时定义 jargon           |

---

## 7. 长度校准 (Length Calibration)

研究过程始终综合。输出长度匹配用户意图：

| 请求类型                                       | 长度      | 注                     |
| ---------------------------------------------- | --------- | ---------------------- |
| **简洁 / 摘要**（"简要概述…" / "总结…"）       | 5-10 段   | 提炼最核心要点         |
| **事实查询**（"什么是 X？" / "Y 何时发生？"）  | 5-10 段   | 直接答案 + 丰富上下文  |
| **对比 / 排名**（"对比前 5…" / "最佳选项是…"） | 20-40+ 段 | 结构化分析；优先用表格 |
| **开放式研究**（"分析…" / "解释历史和含义…"）  | 20-40+ 段 | 全分析深度             |
| **明确深度**（"综合报告…" / "深度研究…"）      | 无上限    | 长度由主题范围决定     |
| **所有其他查询**                               | 默认综合  | 拿不准时多给而非少给   |

---

## 8. 源深度 (Source Depth)

优先主要和权威源。偏好顺序：官方文档 / 同行评审研究 / 权威媒体 / 政府源 / 公认行业专家 —— 优于博客 / 论坛 / 未验证源。

| 查询复杂度                                 | 要求                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| **简单事实**                               | 搜索直到多个源一致权威 —— 不止步首个结果                                 |
| **中等研究**                               | 多视角实质性分析；关键声明 3+ 独立源                                     |
| **复杂研究**（报告 / 对比分析 / 文献综述） | 覆盖所有主要观点和子主题；用证据支撑推荐；识别局限；追溯关键声明到原始源 |

- 跨多源交叉验证重要声明
- 信息冲突时进一步调查而非武断选源
- 显式识别知识缺口 —— 声明找不到或无法验证的信息

---

## 9. Quality Gate — 出口标准 (Exit Criteria)

报告未通过以下全部检查前 **MUST NOT** 交付：

- [ ] GFM 语法有效，标题层级适当
- [ ] Markdown 表格用于对比和结构化数据
- [ ] **无** MMD 语法 —— 纯 GFM（LaTeX 数学按 §2.1 允许）
- [ ] **引用检查**（如调研过）：
  - [ ] 客观声明有 inline `[cite:N]` 引用
  - [ ] 长报告末尾 "Sources" 节列出所有引用 URL
  - [ ] 引用对应实际搜索结果索引
  - [ ] 每个实质性声明 1-3 个引用
  - [ ] 全文引用密度一致
  - [ ] 源来自实际搜索结果（不编造）
- [ ] 无第一人称
- [ ] 报告独立 —— 可脱离对话上下文阅读
- [ ] 报告结构适配主题和目的
- [ ] 长度适当 —— 按 §7 匹配查询复杂度
- [ ] 无 TODO / 占位符 —— 所有章节完整撰写
- [ ] 仅真实数据 —— 不编造引用或数据
- [ ] 直接答案在 chat，详细分析在报告

---

## 10. Red-Line Rules（红线规则）

1. **不编造数据** —— 未验证信息 MUST 标 `[unverified]`；模拟 / 合成数字严格禁止
2. **不第一人称** —— 永不使用 "I" / "my" / "we" / "our" 或自指短语
3. **独立文档** —— 报告 MUST 可脱离对话上下文理解
4. **引用完整性** —— 仅引用实际通过工具获取的源；不发明引用索引
5. **同维度测量** —— 跨实体用相同指标定义 / 时段 / 单位

---

## 输入契约 (Input Contract)

| 项   | 要求                                                     |
| ---- | -------------------------------------------------------- |
| 必备 | 用户研究意图（自然语言描述：调研主题 / 范围 / 深度期望） |
| 可选 | 行业背景 / 时效要求 / 参考资料链接                       |
| 拒绝 | 多实体对比（走 `comparison-analysis`）                   |
| 拒绝 | 简单事实查询（L1 速答）                                  |

## 输出契约 (Output Contract)

| 路径                                                          | 用途                       |
| ------------------------------------------------------------- | -------------------------- |
| `<cwd>/.easbot/knowledge/docs/dev/<topic>/research-report.md` | 主交付物（按 §3 默认结构） |
| `<cwd>/.easbot/state/dev-scratch-<topic>-research.md`         | 临时 / 实验性场景          |

**`<topic>` 命名**：kebab-case，≤ 64 字符；如 `research-grpc-trends-2026` / `investigate-flaky-test`。

**frontmatter 必含字段**：见 [`assets/research-report-template.md`](../assets/research-report-template.md)。

## 失败处理 (Failure Handling)

| 情况                | 动作                                                        |
| ------------------- | ----------------------------------------------------------- |
| 用户意图不清        | 退回 Step 1；询问研究主题 / 深度 / 交付物期望               |
| 源不足（<3 独立源） | 继续迭代证据循环；如工具边界已达 → 标 `[INSUFFICIENT DATA]` |
| 用户要求多实体对比  | 退回父技能 → 路由到 `comparison-analysis`                   |
| 数据时效 > 6 个月   | 标 `(data aged)`；提醒用户重新核实                          |
| 用户要求 PPTX 输出  | 路由到 `eas-pptx` 技能；本 reference 仅出 Markdown 内容     |

## 常见错误 (Common Mistakes)

| ❌ 不要                     | ✅ 应该                                                 |
| --------------------------- | ------------------------------------------------------- |
| 在报告中含 chat 直接回答    | chat 答 + 文件落地报告（解耦）                          |
| 用第一人称写报告            | MUST 第三人称；"研究发现" / "数据显示"                  |
| 编造数据填空白              | 未知 = 已知未知；MUST 声明                              |
| 单源支撑核心声明            | MUST ≥3 独立源；否则标 `[SINGLE-SOURCE]`                |
| 武断取舍冲突源              | MUST 呈现两边 + 差异根因                                |
| 报告无 Sources 节（长报告） | MUST 含 "Sources" 节列出引用 URL                        |
| 引用编号对不上工具返回      | MUST 与工具返回的真实索引对齐                           |
| 多实体对比也用此 reference  | 多实体走 `comparison-analysis`；本 reference 仅单交付物 |

## 下一步 (Next Steps)

| 场景                 | 动作                                                                      |
| -------------------- | ------------------------------------------------------------------------- |
| 研究报告完成         | 落地到 `<cwd>/.easbot/knowledge/docs/research/<topic>/research-report.md` |
| 用户要求进入开发实施 | 路由到对应领域的规格 / 架构设计流程（与本研究技能的下游对接）             |
| 多实体对比需求       | 加载本 reference 重路由 → `comparison-analysis`                           |
| 重做 / 反驳          | 加载本 reference 重做；增量更新产物 frontmatter `updated_at`              |

---

## 参考资料 (References)

- [父技能 eas-research SKILL.md](../SKILL.md) —— 源层级 / 引用规范 / 4 步流程 / Quality Gate
- [comparison-analysis 子路由](comparison-analysis.md) —— 多实体对比场景
- [assets/research-report-template.md](../assets/research-report-template.md) —— 产出模板

---

**最后更新**：2026-08-08
