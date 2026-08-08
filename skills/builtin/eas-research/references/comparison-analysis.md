---
name: comparison-analysis
description: 该 reference 是 `eas-research` 的多实体对比子路由，用于产出竞品分析 / 市场格局 / 产品评估（含 Porter's Five Forces / SWOT / 财务基准 / 差异化手册）。多实体对比场景 MUST 路由到此。
metadata:
  phase: comparison-analysis
  parent_skill: eas-research
  routing_priority: multi-entity-comparison
---

# 多实体对比分析 (Competitive & Product Analysis)

> **所属 reference**：`eas-research`（多实体对比子路由）
> **父技能**：[`eas-research`](../SKILL.md)
> **模板**：[`assets/comparison-analysis-template.md`](../assets/comparison-analysis-template.md)
> **触发场景**：明确要求多实体对比 / 竞品分析 / 市场格局 / 产品评估
> **落地路径**（builtin 技能通用默认；宿主项目可在自有 `.easbot/AGENTS.md` 声明覆盖）：`<cwd>/.easbot/knowledge/docs/research/<topic>/comparison-analysis.md`

---

## 概述 (Overview)

本 reference 是 `eas-research` 的**多实体对比子路由**，从范围定义到最终交付物提供端到端工作流。覆盖：

- **多框架分析**：Porter's Five Forces（5 力模型）/ SWOT（优势劣势机会威胁） / Competitive Moat（竞争护城河）
- **多维度比较**：功能矩阵 / 财务基准 / 定价策略 / UX & 技术架构
- **战略推断**：竞争定位图 / 市场格局分类 / 战略推断 / 差异化手册

**继承父技能约束**：源层级 / 引用规范 / 交叉验证 / 冲突解决（见父技能 SKILL.md §第一性原理 + §4 步流程）。

**不做什么**：

- ❌ 不产出实施性交付物（代码 / 规格 / 设计方案等）—— 这是研究技能，落地物是**调研报告**，不是实现
- ❌ 不修根因 / 不做修复性操作 —— 这是研究技能，不是诊断 / 调试流程
- ❌ 不替代领域专家判断（医学 / 法律 / 金融等）—— 仅作信息综合，不作最终判断
- ❌ 不做单交付物研究 —— 默认路由到 `research-report`（与本 reference 是同 sibling 路由关系）

## 何时使用 (When to Use)

**该 reference 应在以下情况使用**：

- 用户说 "对比 X 和 Y / X vs Y / 竞品分析 / 产品对比"
- 用户说 "市场格局 / 行业分析 / 战略规划"
- 用户说 "融资 deck / 投资分析 / 产品设计"
- 用户说 "XX 领域有哪些玩家 / 我应该选 X 还是 Y"

**不适用于**：

- ❌ 单交付物研究（走 `research-report` 子路由）
- ❌ 简单事实查询（L1 速答，由父技能直接处理）
- ❌ 项目级技术选型（"该不该引入 Kafka"）—— 走项目级需求 / 决策流程（与本研究技能的"调研"职责不同）
- ❌ Bug 根因调研（这是研究技能；bug 修复由专门的诊断 / 调试流程负责）

## 快速参考 (Quick Reference)

| 项 | 内容 |
|---|---|
| 模式 | Generator（产出对比分析报告）+ 父技能 Pattern（思维框架）+ orchestrator |
| 路由 | `eas-research` 多实体对比场景 MUST 路由到此 |
| 必含分析 | Porter's Five Forces + 护城河 + 功能矩阵 + SWOT + 定位图 + 战略推断 + 差异化手册 |
| 必含章节 | Executive Summary / Scope & Methodology / Industry Context / Multi-Dimensional Comparison / Competitive Positioning / Conflict & Uncertainty / Sources |
| 可选章节 | Financial Benchmarking / Pricing Strategy / UX & Tech Architecture / Scenario Analysis / SWOT Cross-Strategy Matrix / Monitoring Cadence |
| 源层级 | P0 官方原始 → P1 权威二手 → P2 专业社区 → P3一般参考 |
| 引用规范 | `[cite:N]` inline；1-3 引用 / 实质性声明；≥3 独立源 / 核心声明 |
| 红线 | 不编造数据 / 不第一人称 / 不武断取舍 / 不虚构引用 / 同维度同标度 |
| 模板 | [comparison-analysis-template.md](../assets/comparison-analysis-template.md) |
| 落地路径 | `<cwd>/.easbot/knowledge/docs/dev/<topic>/comparison-analysis.md` |

## 第一性原理 (First Principles)

> **"同维度、同标度、同时间窗；事实带引用，推断带置信度"**

**判断标准**：

1. **所有被比较实体是否在相同维度上、用相同标度比较？** — 否则 MUST 避免 apples-to-oranges
2. **每个定量值是否带 `[cite:N]`？** — 否则标 `[unverified]`
3. **推断（战略意图）是否带置信度（High / Medium / Low）？** — 否则标 `[SINGLE-SOURCE]` / `[INSUFFICIENT DATA]`
4. **数据时效是否标注？** — 数据龄 > 6 个月 MUST 提醒重新核实
5. **SWOT / 定位图条目是否事实支撑？** — 不可用空话（"团队强 / 技术先进"）

**反模式**：

- ❌ "X ARR 100M，Y ARR 80M，X 比 Y 大 25%"（不同币种 / 财年 → 不可比）
- ❌ "X 团队强 / Y 技术先进"（无事实支撑 = 空话）
- ❌ "综合来看 X 更有优势"（综合无引用 = 总结即编造）
- ❌ "X 必然会做 Y"（推断无置信度 = 武断）

## 6 步对比分析流程 (Six-Step Comparison Process)

> **本节保留速查入口**；详细规则见下方 §1-§6 各节。

| Step | 目标 | 核心动作 | 落地产物 |
|---|---|---|---|
| 1 | 目的 + 深度标定 | 选目的 / 选深度 / 选行业指标 | §2 Scope & Methodology |
| 2 | 信息收集 | 父技能 §3 + 本 reference §2.1 信度分级 + §2.2 收集清单 | §2 Scope & Methodology |
| 3 | 评估框架 | Porter's Five Forces + Moat Assessment | §3 Industry Context |
| 4 | 多维度比较 | 功能矩阵 / SWOT / 财务基准 / 定价 / UX & Tech | §4 Multi-Dimensional Comparison |
| 5 | 竞争定位 + 战略推断 | 定位图 + 市场格局 + 战略推断 | §5 Competitive Positioning |
| 6 | 差异化手册 | 三层策略 + 监控频率 | §6 Differentiation Playbook |

---

## 1. 目的与深度标定 (Purpose & Depth Calibration)

### 1.1 目的 → 模板映射

| 目的 (Purpose) | 重点维度 | 输出重点 | 深度 |
|---|---|---|---|
| **产品设计 (Product Design)** | 功能矩阵 + UX | 功能缺口清单 + 差异化手册 | Moderate |
| **融资 deck (Fundraising Deck)** | 市场格局 + 防御性 | 定位图 + 护城河分析 | Concise |
| **战略规划 (Strategic Planning)** | 全维度 | SWOT + Five Forces + 定价 + 路线图推断 | Deep |
| **年度复盘 (Annual Review)** | 市占率变化 + 趋势 | YoY 差异分析 + 趋势预测 | Moderate |

### 1.2 行业关键指标 (Industry-Defining Metrics)

数据采集**前**先识别能区分本行业玩家的 **3-5 个核心指标**。下表为起点，按场景调整：

| 行业 | 关键指标 |
|---|---|
| **SaaS** | ARR / NRR / CAC payback / LTV/CAC / Rule of 40 / RPO |
| **支付 / 金融科技 (Payments / Fintech)** | GPV / take rate / attach rate / transaction margin |
| **市场平台 (Marketplaces)** | GMV / take rate / 买卖比例 / 复购率 |
| **零售 (Retail)** | 同店销售 / 库存周转 / sales/sqft / 电商占比 |
| **工业 (Industrials)** | Backlog / book-to-bill / 产能利用率 / 价格 vs 销量 |
| **医疗 (Healthcare)** | Scripts / 患者量 / pipeline 里程碑 / 研发投入占比 |
| **半导体 (Semiconductors)** | 终端市场收入 / ASP 趋势 / design wins / fab 利用率 |
| **消费软件 (Consumer Software)** | DAU/MAU / 留存率（D1/D7/D30）/ ARPU / 互动时长 |

> **无明确行业匹配时**：从竞品财报电话会或产品页推导专属指标，并陈述推导理由。

---

## 2. 信息收集 (Information Gathering)

> 遵循父技能 `eas-research` SKILL.md §3.3 信息收集指南完整规则。本节**补充**领域专用检查清单与信度分级。

### 2.1 信度分级 (Credibility Grading)

| 信度 (Grade) | 源类型 (Source Type) | 标注 (Annotation) |
|---|---|---|
| **High（高）** | 官方网站 / 定价页 / 财报 / 监管文件 | 直接引用 |
| **Medium（中）** | 一线媒体 / 分析师报告 / 用户评论（G2 / Capterra / 应用商店） | 标注源名 |
| **Low（低）** | 传闻 / 过期数据（>12 个月）/ 未验证自媒体 | 标 `[unverified]` |

### 2.2 收集清单 (Collection Checklist)

| 维度 (Dimension) | 条目 (Items) | 典型源 (Typical Sources) |
|---|---|---|
| **基本面 (Fundamentals)** | 成立时间 / 融资轮次 / 团队规模 / 用户基数 | 官网 / Crunchbase / PitchBook |
| **产品 (Product)** | 核心功能列表 / 最新发布 / 公开路线图 | 官网 / changelog / 博客 |
| **定价 (Pricing)** | 套餐等级 / 价格点 / 免费层限制 / 计费模型 | 定价页 |
| **口碑 (Reputation)** | 主要好评点 / 主要投诉 / NPS / 评分 | G2 / 应用商店 / 论坛 |
| **战略 (Strategy)** | 目标细分 / 获客渠道 / 合作 / 定位声明 | 媒体 / 社交媒体 / 招聘 |
| **财务 (Financials)（如上市）** | 营收 / 利润率 / 业务线拆分 / 资本配置 | SEC 文件 / 财报电话会 |

### 2.3 时效标注 (Timeliness Annotation)

每条竞品数据 MUST 带时间标签（如 `(as of 2026-Q1 public info)`）。数据龄 > 6 个月 MUST 提醒用户重新核实。

### 2.4 并行 vs 顺序 (Parallel vs. Sequential)

按父技能 §3.3 策略选择：

- **多个独立竞品** → 并行扇出，每个竞品一个搜索线程
- **单竞品深挖** → 顺序深挖，逐步缩小源范围
- **快变市场** → 时效优先；从 P1-P2 起，回溯 P0

---

## 3. 评估与分析框架 (Evaluation & Analytical Frameworks)

### 3.1 Porter's Five Forces（5 力模型）

| 力量 (Force) | 分析维度 (Analysis Dimension) | 评估重点 (Assessment Focus) |
|---|---|---|
| **供应商议价 (Supplier Power)** | 上游依赖 | 关键技术 / 人才 / 资源集中度；切换成本 |
| **买方议价 (Buyer Power)** | 下游客户杠杆 | 客户集中度 / 切换成本 / 价格敏感度 |
| **新进入者威胁 (Threat of New Entrants)** | 进入壁垒 | 技术壁垒 / 资本要求 / 品牌护城河 / 网络效应 / 监管障碍 |
| **替代品威胁 (Threat of Substitutes)** | 替代方案 | 现有替代品 / 替代品性价比 |
| **行业竞争强度 (Industry Rivalry)** | 在位玩家动态 | 竞品数量 / 市场集中度 / 差异化程度 / 退出壁垒 |

**每项输出**：Strong / Moderate / Weak + 一句话理由 + 引用

**汇总**：整体行业吸引力 = High / Medium / Low

### 3.2 竞争护城河评估 (Competitive Moat Assessment)

| 护城河类型 (Moat Type) | 评估标准 (Criteria) |
|---|---|
| **网络效应 (Network Effects)** | 用户 / 供给双边的飞轮强度 |
| **切换成本 (Switching Costs)** | 集成深度 / 数据锁定 / 工作流依赖 |
| **规模经济 (Scale Economies)** | 批量下的单位成本优势 |
| **无形资产 (Intangible Assets)** | 品牌资产 / 专有数据 / 牌照 / 专利 |

每项评 **Strong / Moderate / Weak** + 证据。引用源支撑。

---

## 4. 多维度比较 (Multi-Dimensional Comparison)

### 4.1 功能对比矩阵（核心交付物）(Feature Comparison Matrix)

| Feature Module | Sub-feature | Ours | Comp A | Comp B | Comp C |
|---|---|---|---|---|---|
| {Module 1} | {Sub-feature 1} | ✅ Full | ✅ Full | ⚠️ Basic | ❌ None |
| | {Sub-feature 2} | ⚠️ Basic | ✅ Full | ✅ Full | 🔜 Planned |

**Legend**：✅ Full — ⚠️ Basic（存在但不完整） — ❌ None — 🔜 Planned

### 4.2 SWOT 分析 (SWOT Analysis)

| | Positive（正） | Negative（负） |
|---|---|---|
| **Internal（内）** | **Strengths（优势）** | **Weaknesses（劣势）** |
| **External（外）** | **Opportunities（机会）** | **Threats（威胁）** |

- 每象限 2-3 条；每条 MUST 引用可验证事实
- 不可用空话（"团队强 / 技术先进"）

**SWOT 跨策略矩阵**（仅当目的 = 战略规划）：

| 策略 | 含义 | 行动方向 |
|---|---|---|
| **SO** | 用优势抓机会 | 用核心优势抢市场窗口 |
| **WO** | 补弱点抓机会 | 补缺口解锁新增长路径 |
| **ST** | 用优势挡威胁 | 用护城河抗竞争压力 |
| **WT** | 补弱点挡威胁 | 最紧迫的防御动作 |

### 4.3 财务基准 (Financial Benchmarking)（维度含财务时）

| Metric | Ours | Comp A | Comp B | Comp C | Sector Median |
|---|---|---|---|---|---|
| Revenue (LTM) | | | | | |
| Revenue growth (3-yr CAGR) | | | | | |
| Gross margin | | | | | |
| EBITDA margin | | | | | |
| FCF margin | | | | | |

**估值对比**（仅上市公司）：

| Metric | Ours | Comp A | Comp B | Comp C |
|---|---|---|---|---|
| P/E (NTM) | | | | |
| EV/EBITDA (NTM) | | | | |
| EV/Revenue (NTM) | | | | |
| Premium / discount to median | | | | |

### 4.4 定价策略对比 (Pricing Strategy Comparison)（维度含定价时）

| Item | Ours | Comp A | Comp B | Comp C |
|---|---|---|---|---|
| Free-tier capability | | | | |
| Starter monthly price | | | | |
| Enterprise monthly price | | | | |
| Billing model | per-seat / usage / feature | | | |
| Pricing strategy type | Penetration / Skimming / Freemium | | | |

**定价策略分类**：

- **Penetration（渗透）**：低价抢份额（免费层丰富）
- **Skimming（撇脂）**：高端定价（功能严格分级）
- **Freemium（免费增值）**：核心免费 / 高级付费（看免费 vs 付费功能差距）

### 4.5 UX & 技术架构对比 (UX & Technical Architecture Comparison)（可选维度）

| Dimension | Method | Scoring |
|---|---|---|
| **UX（用户体验）** | 核心流程步数 / 学习曲线 / 任务完成效率 | 对比关键工作流的点击数与耗时 |
| **Tech Architecture（技术架构）** | 架构模式 / 技术栈 / 性能指标 / 开放性 | API 广度 / 集成能力 / 可扩展性 |

---

## 5. 竞争定位与战略推断 (Competitive Positioning & Strategy Projection)

### 5.1 定位图 (Positioning Map)

选**最能区分**竞品的 2 个维度（如"功能深度 vs 易用性"或"价格 vs 功能广度"），将所有产品放入 2×2 象限：

```
        High capability（高能力）
              ▲
              │
   Comp A     │     Comp B
              │
   ───────────┼────────────────► High price（高价）
              │
              │     Comp C
              │
        Low capability（低能力）
```

| 象限 | 特征 | 代表产品 |
|---|---|---|
| 高能力 + 高价 | 企业级一站式 | {list} |
| 高能力 + 低价 | 性价比 | {list} |
| 低能力 + 高价 | 利基 / 垂直专家 | {list} |
| 低能力 + 低价 | 入门级 | {list} |

### 5.2 市场格局分类 (Market Landscape Classification)

| 格局类型 (Landscape Type) | 标识 (Signature) | 战略含义 (Strategy Implication) |
|---|---|---|
| **一家独大 + 众多小厂** | 主导者 > 50% 市占 | 利基差异化；避免正面冲突 |
| **双寡头 (Duopoly)** | Top 2 合计 > 70% | 站队生态或做"第三选择" |
| **分散 (Fragmented)** | Top 5 各 < 20% | 抢占细分市场 |
| **新兴 (Nascent)** | 无明确领导者 | 投资市场教育；早期建品牌 |

### 5.3 战略推断 (Strategy Projection)

从近期信号推断每个竞品可能的下一步动作：

1. **信号收集 (Signal Collection)**：过去 3-6 个月的产品更新 / 融资事件 / 招聘模式 / 合作公告
2. **模式识别 (Pattern Recognition)**：
   - 某领域集中发布 → 可能在加倍投入
   - 某职能招聘激增 → 可能建新产品线
   - 降价 / 免费层扩张 → 抢市场份额
3. **推断表 (Projection Table)**：

| Competitor | Recent Key Moves | Inferred Strategic Intent | Impact on Us | Confidence | Suggested Response |
|---|---|---|---|---|---|
| Comp A | {description}[cite:N] | {inference} | {assessment} | High / Med / Low | {action} |

- **MUST 区分**事实 vs 推断：事实带 `[cite:N]`；推断带置信度
- 数据支持时给出短期（1-3 个月）+ 中期（3-12 个月）推断

### 5.4 情景分析 (Scenario Analysis)（如提供投资背景）

| Scenario | Probability | Revenue | EPS | Key Driver |
|---|---|---|---|---|
| Bull（乐观） | 25-30% | $X.XB | $X.XX | ... |
| Base（基准） | 45-50% | $X.XB | $X.XX | ... |
| Bear（悲观） | 20-30% | $X.XB | $X.XX | ... |

概率 MUST 总和 ≈ 100%。每个驱动因素 MUST 引用。

---

## 6. 差异化手册 (Differentiation Playbook)

### 6.1 三层差异化策略 (Three-Tier Differentiation Strategy)

| Tier | 描述 | Action Items |
|---|---|---|
| **Catch-up（追赶）** | 竞品都有但我们没有 | 列出功能 + 优先级 + 预估投入 |
| **Differentiate（差异化）** | 我们领先 / 独有 | 列出优势 + 强化 + 信息钩子 |
| **Innovate（创新）** | 蓝海机会（无人做） | 列出探索想法 + 验证方式 |

### 6.2 监控频率 (Monitoring Cadence)（建议但非强制）

| Frequency | Scope | Trigger Action |
|---|---|---|
| Weekly | 竞品发布日志 / 社交媒体 | 记录重大更新到跟踪表 |
| Monthly | 价格 / 新功能 / 新闻 | 刷新功能对比矩阵 |
| Quarterly | 全量对比报告 + 战略预测更新 | 分发团队简报 |
| Event-driven | 融资 / 并购 / 大动作 / 人事变动 | 即时影响评估 + 响应备忘 |

---

## 7. 报告输出规范 (Report Output Specification)

### 7.1 默认结构

1. **Executive Summary（执行摘要）**—— 一页结论：市场格局 / 我们的位置 / Top 3 行动项
2. **Scope & Methodology（范围与方法）**—— 覆盖竞品 / 分析维度 / 数据截止日 / 信度分级总结
3. **Industry Context（行业上下文）**—— Porter's Five Forces + 护城河评估
4. **Multi-Dimensional Comparison（多维度比较）**—— 功能矩阵 / SWOT / 财务基准 / 定价对比（按维度可选）
5. **Competitive Positioning（竞争定位）**—— 定位图 + 市场格局分类
6. **Strategy Projection（战略推断）**—— 每个竞品的推断表
7. **Differentiation Playbook（差异化手册）**—— 三层策略 + 监控频率
8. **Appendix（附录）**—— 原始数据表 / 方法论注记

> §3-§6 按 §1.1 分析目的伸缩。"融资 deck"目的压缩为单页定位 + 护城河；"战略规划"目的全部展开。

### 7.2 格式

- 默认 Markdown；如用户请求 `.pptx` / `.docx` 则适配
- 所有表格列宽对齐一致
- 所有标题 MUST 描述性中立——不可修辞 / 劝说 / 论辩
- 图表遵循父技能 SKILL.md §4 可视化生成指南

---

## 8. Quality Gate — 出口标准 (Exit Criteria)

报告未通过以下全部检查前 **MUST NOT** 交付：

- [ ] 每个定量值带 `[cite:N]` 标签
- [ ] 所有竞品在**相同维度、相同标度**下评估——无 apples-to-oranges
- [ ] SWOT 条目事实支撑；无空泛褒贬
- [ ] 每个竞品节都标注数据时效
- [ ] 按 §2.1 分配信度等级；`[unverified]` 标签就位
- [ ] 战略推断行清晰区分事实与推断；置信度标签就位
- [ ] 情景概率总和 ≈ 100%（如适用）
- [ ] §1.2 行业 KPI 包含在对比表中
- [ ] 缺失数据标 `N/A` 或 `—`；永不编造
- [ ] Porter's Five Forces 每项评分有支撑证据
- [ ] 差异化手册优先级有理由

---

## 9. Red-Line Rules（红线规则）

1. **不编造数据** —— 未验证的竞品信息 MUST 标 `[unverified]`；模拟 / 合成数字严格禁止
2. **不主观贬低** —— 竞品评估 MUST 客观；不用贬损语言
3. **MUST 标注时效** —— 每个数据点带日期或时段标签；数据龄 > 6 个月提醒重新核实
4. **推断 MUST 带置信度** —— 每个推断的战略意图 MUST 带置信度（High / Medium / Low）
5. **同维度测量** —— 所有被对比实体用相同的指标定义 / 财年 / 币种

---

## 输入契约 (Input Contract)

| 项 | 要求 |
|---|---|
| 必备 | 候选实体清单（对比对象 ≥ 2 个）+ 对比维度 / 决策上下文 |
| 可选 | 行业 / 地域范围 / 数据时效要求 |
| 可选 | 已有参考资料 / 链接 |
| 拒绝 | 单交付物研究（走 `research-report`） |

## 输出契约 (Output Contract)

| 路径 | 用途 |
|---|---|
| `<cwd>/.easbot/knowledge/docs/research/<topic>/comparison-analysis.md` | 主交付物（按 §7.1 默认结构） |
| `<cwd>/.easbot/state/scratch-comparison-<topic>.md` | 临时 / 实验性场景 |

**`<topic>` 命名**：kebab-case，≤ 64 字符；如 `compare-postgres-mysql` / `competitive-postgres-vs-mysql-2026-q3`。

**frontmatter 必含字段**：见 [`assets/comparison-analysis-template.md`](../assets/comparison-analysis-template.md)。

## 失败处理 (Failure Handling)

| 情况 | 动作 |
|---|---|
| 用户未指定对比对象 | 退回 Step 1；询问候选实体清单 |
| 维度过多（>10 维度） | 退回 §1.1；按目的选最相关 3-5 维度 |
| 源不足（<3 独立源 / 核心竞品） | 继续 §2 信息收集；如工具边界已达 → 标 `[INSUFFICIENT DATA]` |
| 用户要求 PPTX 输出 | 路由到 `eas-pptx` 技能；本 reference 仅出 Markdown 内容 |
| 战略推断置信度不足 | 标 `[SINGLE-SOURCE]` 或 `[LOW_CONFIDENCE]`；不武断推断 |

## 常见错误 (Common Mistakes)

| ❌ 不要 | ✅ 应该 |
|---|---|
| 跨实体用不同指标定义 | MUST 同维度同标度（避免 apples-to-oranges） |
| SWOT 用空话（"团队强"） | 每条 MUST 引用可验证事实 |
| 推断无置信度 | MUST 标 High / Medium / Low |
| 数据无时效标签 | MUST `(as of YYYY-MM-DD public info)` |
| 不同币种 / 财年直接比较 | MUST 标准化到同一币种 / 财年 |
| 战略推断写成事实 | 推断行 MUST 显式标 `[inferred]` 或置信度标签 |
| 单交付物研究也用此 reference | 单交付物走 `research-report`；本 reference 仅多实体对比 |

## 下一步 (Next Steps)

| 场景 | 动作 |
|---|---|
| 对比报告完成 | 落地到 `<cwd>/.easbot/knowledge/docs/research/<topic>/comparison-analysis.md` |
| 用户要求进入战略实施 | 路由到对应领域的规格 / 架构设计流程（与本对比分析的下游对接） |
| 后续监控需求 | 按 §6.2 监控频率执行；刷新功能矩阵 |
| 重做 / 反驳 | 加载本 reference 重做；增量更新产物 frontmatter `updated_at` |

---

## 参考资料 (References)

- [父技能 eas-research SKILL.md](../SKILL.md) —— 源层级 / 引用规范 / 4 步流程 / Quality Gate
- [research-report 子路由](research-report.md) —— 单交付物研究场景
- [assets/comparison-analysis-template.md](../assets/comparison-analysis-template.md) —— 产出模板
- **Porter's Five Forces** 原始来源：Michael Porter《How Competitive Forces Shape Strategy》（Harvard Business Review, 1979）

---

**最后更新**：2026-08-08
