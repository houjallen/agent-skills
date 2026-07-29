# 设计系统 (Aesthetic System)

> **路径 A 与 C 的美学指南**。阅读后再动手任何 CREATE / REFORMAT 工作。

## 唯一规则 (The One Rule)

每个设计决策 MUST **根植于文档内容与用途**。

深青 + 米色 ≠ "专业"；衬线 + 米黄 ≠ "优雅"。一份**为内容而选**的配色永远胜过一份**为求稳而选**的配色。

---

## 调色板逻辑 (Palette Logic)

`palette.py` 接收简短的 content description，输出 `tokens.json`。其推理逻辑如下：

### Mood → 基础调色板 (Mood → Base Palette)

| 内容信号 | Mood | 背景色 | 强调色 | 文本色 |
| --- | --- | --- | --- | --- |
| 研究 / 科学 / 分析 | Authoritative | `#0F1F2E` deep ink | `#00B4A6` teal | `#F0EDE6` warm white |
| 商业 / 战略 / 金融 | Confident | `#1C1C2B` near-black | `#E8A020` amber | `#F5F2EC` cream |
| 创意 / 作品集 / 设计 | Expressive | `#1A0A2E` deep violet | `#FF6B6B` coral | `#FAF5FF` lavender white |
| 教育 / 学术 | Scholarly | `#FAFAF7` warm white | `#2C4A7C` navy | `#1A1A2E` dark |
| 医疗 / 健康 | Calm | `#F5F9F8` pale mint | `#2D8B72` forest | `#1E3830` deep green |
| 简历 / 个人 | Clean | `#FFFFFF` white | pick from content | `#111111` near-black |
| 一般 / 未知 | Neutral | `#F8F6F1` warm off-white | `#3D3D3D` dark gray | `#1A1A1A` black |
| 正式出版物 / 年报 | Magazine | `#F2F0EC` warm linen | `#1C3557` deep navy | `#0D1A2B` near-black |
| 高端深色报告 / 科技评测 | Darkroom | `#151C27` deep navy | `#4A6FA5` steel blue | `#F0EDE6` warm white |
| 技术文档 / 开发者报告 | Terminal | `#0D1117` near-black | `#39D353` neon green | `#E6EDF3` cool white |
| 作品集 / 创意 / 摄影 | Poster | `#FFFFFF` white | `#0A0A0A` near-black | `#0A0A0A` near-black |

### 强调色选择规则 (Accent Selection Rules)

- **仅一个强调色**：用两个强调色会分散视觉能量。
- 强调色只出现在：封面几何元素 / 分节线 / callout 左边框 / 表头底色 / 页头线。**其他位置禁止出现**。
- 强调色与封面背景对比度 MUST ≥ 4.5:1（WCAG AA）。
- **不要默认蓝色**——蓝色是 AI 生成文档最泛滥的强调色。

### 配色反模式（永不采用）(Color Pairing Anti-Patterns)

| ❌ 避免 | 为什么 |
| --- | --- |
| 白底紫色渐变 | AI 默认美学——立刻暴露"AI 生成"标签 |
| 黑底霓虹粉 | 廉价感；与正式报告语境冲突 |
| 蓝 + 绿相邻 | 视觉疲劳 |
| 6 种颜色平铺 | 没有主次，混乱感 |
| 灰色背景 + 灰色文本 | 文本不可读 |

---

## 字体 (Typography)

### 字体配对原则 (Pairing Principles)

- 标题：display serif（Playfair Display / Syne / DM Serif Display / Fraunces / EB Garamond / Bebas Neue 等）
- 正文：humanist sans-serif（Inter / IBM Plex Sans / Source Sans 3 / DM Sans / Outfit 等）
- 标题与正文 MUST 形成**对比**——同家族会让页面扁平。

### 字体配对推荐 (Recommended Pairings)

| 类型 | Display | Body |
| --- | --- | --- |
| `report` | Playfair Display | IBM Plex Sans |
| `proposal` | Syne | Nunito Sans |
| `resume` | DM Serif Display | DM Sans |
| `portfolio` | Fraunces | Inter |
| `academic` | EB Garamond | Source Sans 3 |
| `general` | Outfit | Outfit |
| `minimal` | Cormorant Garamond | Jost |
| `stripe` | Barlow Condensed | Barlow |
| `diagonal` | Montserrat | Montserrat |
| `frame` | Cormorant | Crimson Pro |
| `editorial` | Bebas Neue | Libre Franklin |
| `terminal` | Space Mono | Space Mono |
| `poster` | Barlow Condensed | Courier Prime |

**封面字体**经 Google Fonts `@import` 在渲染时加载——不本地缓存。
**正文**用系统字体（Times / Helvetica）经 ReportLab。

---

## 间距与节奏 (Spacing & Rhythm)

### 间距刻度 (Spacing Scale)

| 用途 | 距离 |
| --- | --- |
| 元素内部 padding | 8 / 12 / 16 pt |
| 段落间距 | 18 / 24 pt |
| 节间距 | 36 / 48 pt |
| 页边距 | 48 / 72 pt |

### 节奏规则 (Rhythm Rules)

1. **封面留白 ≥ 30%** —— 封面信息密度低才显高级。
2. **正文行高 1.4-1.6** —— 太挤无层次，太松显松散。
3. **callout 与正文间距 1.5 倍节距** —— 视觉分组明确。
4. **表头与正文间加大间距** —— 帮助表格"呼吸"。

---

## 内容类型 × 设计对应 (Doc Type × Design Mapping)

| Type | Mood | 封面模式 | 视觉识别度 |
| --- | --- | --- | --- |
| `report` | Authoritative | `fullbleed` | 深底 + 点阵网格 |
| `proposal` | Confident | `split` | 左暗面板 + 右点阵 |
| `resume` | Clean | `typographic` | 超大显示体 + 首词强调 |
| `portfolio` | Expressive | `atmospheric` | 暗底 + 径向辉光 + 点阵 |
| `academic` | Scholarly | `typographic` | 浅底 + 古典衬线 |
| `general` | Neutral | `fullbleed` | 暗石板 + Outfit |
| `minimal` | Restrained | `minimal` | 近白 + 8px 强调条 |
| `stripe` | Bold | `stripe` | 三色横带 |
| `diagonal` | Dynamic | `diagonal` | 斜切几何 |
| `frame` | Classical | `frame` | 内嵌边框 + 角饰 |
| `editorial` | Editorial | `editorial` | 幽灵字母 + 全大写 |
| `magazine` | Magazine | `magazine` | 暖亚麻 + 居中 + 头图 |
| `darkroom` | Darkroom | `darkroom` | 海军蓝 + 灰度图 |
| `terminal` | Terminal | `terminal` | 近黑 + 网格 + 等宽 + 霓虹绿 |
| `poster` | Poster | `poster` | 白底 + 粗侧栏 + 超大标题 |

---

## 设计师判断标准 (Designer Judgment Bar)

**一份 PDF 通过质量门槛** 当且仅当：一位设计师愿意把它交付给客户而**不感到尴尬**。

具体检验项：

1. **配色有理由** —— 不是"安全色"，而是这份文档专属
2. **字体有性格** —— 标题字体让人"记住了这份文档"
3. **封面留白足够** —— 不是塞满
4. **正文可读** —— 行高 / 字号 / 字距合理
5. **强调色克制** —— 只在最有意义的位置出现
6. **没有 AI 标志** —— 没有"紫色渐变 / 居中几何块 / emoji 装饰"等套路

> **核心原则**：A PDF passes the quality bar when a designer would not be embarrassed to hand it to a client.