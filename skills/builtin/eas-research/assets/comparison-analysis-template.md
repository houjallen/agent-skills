---
topic: <一句话主题>
created_at: <YYYY-MM-DD>
updated_at: <YYYY-MM-DD>
phase: comparison-analysis
status: draft | confirmed
research_type: <tech-selection | root-cause | trend | competitive | general>
depth: <L1 | L2 | L3>
source_count: <N>
confidence: <high | medium | low>
citations:
  - "[cite:1] <标题> — <URL>"
  - "[cite:2] <标题> — <URL>"
  - "[cite:N] ..."
skill: eas-research
---

# <主题> - 对比分析 (Comparison Analysis)

> **生成方式**：通过 [`eas-research`](../SKILL.md) 技能 + [`comparison-analysis` 子路由](../references/comparison-analysis.md) 产出
> **上游输入**：候选实体清单 / 对比维度 / 决策上下文
> **下游消费者**：决策者 / 战略团队 / 产品团队

---

## 1. Executive Summary（执行摘要）

- **对比对象**：<实体 A> / <实体 B> / <实体 C> ...
- **分析目的**：<产品设计 / 战略规划 / 融资 deck / 年度复盘>（按子路由 §1.1）
- **核心结论**：<一句话>
- **整体置信度**：`<high | medium | low>`
- **Top 3 行动项**：
  - [ ] <行动项 1>
  - [ ] <行动项 2>
  - [ ] <行动项 3>

---

## 2. Scope & Methodology（范围与方法）

### 2.1 对比范围

- **对比对象**：<列出所有对比实体，含完整名 / 别名>
- **对比维度**：<功能 / 定价 / 性能 / 财务 / 战略 / UX / 架构>（按子路由 §2.1 选择）
- **数据时效**：<YYYY-MM-DD> 后可能需重核
- **排除项**：<明确不对比的维度>

### 2.2 行业关键指标（按子路由 §1.2）

| 行业 | 关键指标 |
|---|---|
| <SaaS / Fintech / ...> | <ARR / NRR / CAC payback / LTV/CAC / Rule of 40> |

### 2.3 方法论

- **源策略**：按父技能 §3.1 源层级（P0 > P1 > P2 > P3）
- **交叉验证**：核心声明 ≥3 独立源
- **同维度同标度**：MUST 避免 apples-to-oranges 比较（按子路由 §9.1）
- **冲突处理**：源冲突呈现两边 + 差异根因

---

## 3. Industry Context（行业上下文）

### 3.1 Porter's Five Forces（按子路由 §3.1）

| Force | 评估 | 一句话理由 + 引用 |
|---|---|---|
| **Supplier Power（供应商议价）** | Strong / Moderate / Weak | <理由>[cite:N] |
| **Buyer Power（买方议价）** | Strong / Moderate / Weak | <理由>[cite:N] |
| **Threat of New Entrants（新进入者威胁）** | Strong / Moderate / Weak | <理由>[cite:N] |
| **Threat of Substitutes（替代品威胁）** | Strong / Moderate / Weak | <理由>[cite:N] |
| **Industry Rivalry（行业竞争强度）** | Strong / Moderate / Weak | <理由>[cite:N] |

**整体行业吸引力**：<High / Medium / Low>

### 3.2 Competitive Moat Assessment（护城河评估，按子路由 §3.2）

| Moat Type | 评估 | 一句话证据 |
|---|---|---|
| **Network Effects** | Strong / Moderate / Weak | <证据>[cite:N] |
| **Switching Costs** | Strong / Moderate / Weak | <证据>[cite:N] |
| **Scale Economies** | Strong / Moderate / Weak | <证据>[cite:N] |
| **Intangible Assets** | Strong / Moderate / Weak | <证据>[cite:N] |

---

## 4. Multi-Dimensional Comparison（多维度对比）

### 4.1 Feature Comparison Matrix（功能对比矩阵 — 核心交付物，按子路由 §4.1）

| Feature Module | Sub-feature | 实体 A | 实体 B | 实体 C |
|---|---|---|---|---|
| <模块 1> | <子功能 1> | ✅ Full | ⚠️ Basic | ❌ None |
| | <子功能 2> | ⚠️ Basic | ✅ Full | 🔜 Planned |
| <模块 2> | <子功能 3> | ✅ Full | ✅ Full | ⚠️ Basic |

**Legend**：✅ Full / ⚠️ Basic / ❌ None / 🔜 Planned

### 4.2 SWOT Analysis（按子路由 §4.2）

| | Positive | Negative |
|---|---|---|
| **Internal** | **Strengths**: <S1>[cite:N] / <S2> | **Weaknesses**: <W1>[cite:N] / <W2> |
| **External** | **Opportunities**: <O1>[cite:N] / <O2> | **Threats**: <T1>[cite:N] / <T2> |

**SWOT Cross-Strategy Matrix**（仅当目的 = Strategic Planning）：

| Strategy | 含义 | 行动方向 |
|---|---|---|
| **SO** | 用优势抓机会 | <动作> |
| **WO** | 补弱点抓机会 | <动作> |
| **ST** | 用优势挡威胁 | <动作> |
| **WT** | 补弱点挡威胁 | <动作> |

### 4.3 Financial Benchmarking（按子路由 §4.3；如适用）

| Metric | 实体 A | 实体 B | 实体 C | Sector Median |
|---|---|---|---|---|
| Revenue (LTM) | <值> | <值> | <值> | <值> |
| Revenue growth (3-yr CAGR) | | | | |
| Gross margin | | | | |
| EBITDA margin | | | | |
| FCF margin | | | | |

### 4.4 Pricing Strategy Comparison（按子路由 §4.4；如适用）

| Item | 实体 A | 实体 B | 实体 C |
|---|---|---|---|
| Free-tier capability | | | |
| Starter monthly price | | | |
| Enterprise monthly price | | | |
| Billing model | per-seat / usage / feature | | |
| Pricing strategy type | Penetration / Skimming / Freemium | | |

### 4.5 UX & Technical Architecture（按子路由 §4.5；可选）

| Dimension | Method | 实体 A | 实体 B | 实体 C |
|---|---|---|---|---|
| **UX** | 核心流程步数 / 学习曲线 | | | |
| **Tech Architecture** | 架构模式 / 技术栈 / API 广度 | | | |

---

## 5. Competitive Positioning（竞争定位）

### 5.1 Positioning Map（按子路由 §5.1）

选择**最能区分**竞品的 2 个维度（如 "功能深度 vs 易用性" 或 "价格 vs 功能广度"）：

```
            High Capability
                  ▲
                  │
       实体 A     │     实体 B
                  │
   ───────────────┼────────────────► High Price
                  │
                  │     实体 C
                  │
            Low Capability
```

| Quadrant | 特征 | 代表实体 |
|---|---|---|
| High Capability + High Price | 企业级一站式 | <列表> |
| High Capability + Low Price | 性价比 | <列表> |
| Low Capability + High Price | 垂直专家 | <列表> |
| Low Capability + Low Price | 入门级 | <列表> |

### 5.2 Market Landscape Classification（按子路由 §5.2）

| Landscape Type | 标识 | 战略含义 |
|---|---|---|
| One dominant + many small | 主导者 > 50% 市占 | 利基差异化；避免正面冲突 |
| Duopoly | Top 2 合计 > 70% | 站队生态或做"第三选择" |
| Fragmented | Top 5 各 < 20% | 抢占细分市场 |
| Nascent | 无明确领导者 | 投资市场教育；早期建品牌 |

**本次判定**：<landscape type> —— <理由>[cite:N]

### 5.3 Strategy Projection（按子路由 §5.3）

| Competitor | Recent Key Moves | Inferred Strategic Intent | Impact on Us | Confidence | Suggested Response |
|---|---|---|---|---|---|
| 实体 A | <事件>[cite:N] | <推断> | <影响评估> | High / Med / Low | <动作> |
| 实体 B | <事件>[cite:N] | <推断> | <影响评估> | High / Med / Low | <动作> |

> **MUST 区分事实与推断**：事实带 `[cite:N]`；推断带置信度标签

---

## 6. Differentiation Playbook（差异化手册）

### 6.1 Three-Tier Differentiation（按子路由 §6.1）

| Tier | 描述 | Action Items |
|---|---|---|
| **Catch-up（追赶）** | 竞品都有但我们没有 | <功能 + 优先级 + 预估投入> |
| **Differentiate（差异化）** | 我们领先 / 独有 | <优势 + 强化 + 信息钩子> |
| **Innovate（创新）** | 蓝海机会（无人做） | <探索想法 + 验证方式> |

### 6.2 Monitoring Cadence（按子路由 §6.2，建议但非强制）

| Frequency | Scope | Trigger Action |
|---|---|---|
| Weekly | 竞品发布 / 社交媒体 | 记录重大更新到跟踪表 |
| Monthly | 价格 / 新功能 / 新闻 | 刷新功能对比矩阵 |
| Quarterly | 全量对比报告 + 战略预测 | 分发团队简报 |
| Event-driven | 融资 / 并购 / 大动作 / 人事变动 | 即时影响评估 + 响应备忘 |

---

## 7. Conflict & Uncertainty（冲突与不确定性）

### 7.1 源冲突

| 议题 | 源 A 立场 | 源 B 立场 | 差异根因 | 处理 |
|---|---|---|---|---|
| <议题 1> | <立场>[cite:N] | <立场>[cite:M] | <时段差 / 指标差异 / 立场偏差> | <如何处理> |

### 7.2 数据不足

| Gap | 影响 | 建议补充路径 |
|---|---|---|
| <Gap 1> | <影响范围> | <补充路径> |

---

## 8. Sources（来源）

| 编号 | 类型 | 标题 | URL | 时效 |
|---|---|---|---|---|
| [cite:1] | <P0/P1/P2/P3> | <标题> | <URL> | <YYYY-MM-DD / 季度> |
| [cite:2] | <P0/P1/P2/P3> | <标题> | <URL> | <YYYY-MM-DD / 季度> |
| [cite:N] | ... | ... | ... | ... |

---

## 元数据 (Metadata)

| 项 | 值 |
|---|---|
| 创建时间 | <YYYY-MM-DD> |
| 更新时间 | <YYYY-MM-DD> |
| 分析目的 | <产品设计 / 融资 deck / 战略规划 / 年度复盘> |
| 对比对象数 | <N> |
| 对比维度数 | <M> |
| 引用源数 | <K> |
| 整体置信度 | <high / medium / low> |
| 数据时效 | <YYYY-MM-DD> 后可能需重核 |
| 下一步 | （可选）接入对应领域的规格 / 架构设计流程；或战略决策 |

---

**最后更新**：<YYYY-MM-DD>
