---
name: eas-pdf
description: "该技能应在视觉品质与设计识别度成为 PDF 输出的关键诉求时使用，覆盖三条路径：CREATE（从零生成报告 / 提案 / 简历等成品 PDF）、FILL（向既有 PDF 填写表单字段而不改动版式）、REFORMAT（将已有 Markdown / 文本 / PDF 解析后套用设计 token 重新排版）。触发短语包括 PDF、PDF 生成、设计驱动、报告、提案、简历、作品集、学术文档、模板、make a PDF、beautiful PDF。"
license: MIT
metadata:
  version: "1.1.0"
  category: document-generation
  mode: tool-wrapper+generator+reviewer+pipeline
  supported_os:
    - windows
    - macos
    - linux
  dependencies:
    - python3 >= 3.9
    - reportlab (pip)         # 渲染正文
    - pypdf (pip)             # 填表 / 合并 / REFORMAT
    - nodejs >= 18            # 渲染封面
    - playwright (npm)        # 渲染封面
    - chromium (playwright)   # 渲染封面
    - matplotlib (pip)        # chart / flowchart / math
    - make (system)           # 统一入口 make.sh
  sources:
    - reportlab documentation
    - pypdf documentation
    - Playwright Chromium docs
---

# eas-pdf

## 概述 (Overview)

`eas-pdf` 是 EASBot 的设计驱动 PDF 生成入口，把"内容 → 设计 token → 封面 → 正文 → 合并"的整条流水线封装为可复用脚本，使 Agent 不必从零搭建 `reportlab` / Playwright 排版代码也能产出**接近设计师水准**的 PDF。它采用 token-based 设计系统：颜色 / 字体 / 间距从文档类型派生并贯穿每一页；输出为可印刷成品。当仅需把任意文档"转成 PDF"而不关心视觉品质时，请改用通用工具。

**模式组合（Skill Mode Composition）**：

- **Tool Wrapper**：封装 `reportlab` / `pypdf` / `playwright` / `matplotlib` 等异构工具到 `palette.py` / `cover.py` / `render_body.py` / `merge.py` / `fill_inspect.py` / `fill_write.py` / `reformat_parse.py`。
- **Pipeline**：CREATE / FILL / REFORMAT 三段流水线，按用户意图分派。
- **Generator**：CREATE / REFORMAT 产出"按设计 token 渲染的成品 PDF"。
- **Reviewer**：`design.md` 内置"封面类型 × 行业"配色建议表，Reviewer 必须先校验配色是否贴主题再放行。

## 何时使用 (When to Use)

**触发场景（适用）**：

- 用户希望生成一份**视觉过关、可直接交付**的 PDF：报告 / 提案 / 简历 / 作品集 / 学术文档 / 杂志 / 海报 / 终端风样式等。
- 用户给出一份现有 PDF，需要在**不破坏版式**的前提下填入表单字段。
- 用户希望把 Markdown / 纯文本 / 现有 PDF 套上品牌设计 token 重新排版。
- 用户明确要求"漂亮的 / 专业的 / 客户端可交付"等关键词。

**反场景（不适用）**：

- 仅需把任意文档"转成 PDF"而不要求视觉品质——使用通用 PDF 转换工具。
- 需要从 Word/Excel/PPT 转 PDF——交给 `eas-docx` / `eas-xlsx` / `eas-pptx`。
- 需要 OCR / 拆分 / 合并纯字节 PDF——使用 `pypdf` / `pdfplumber` 脚本即可，不必走本技能。
- 非学术 / 杂志级排版的纯文本 PDF 转换——本技能 token 化设计会带来不必要的开销，PDF 转换工具即可。

## 快速参考 (Quick Reference)

| 项目 | 取值 / 说明 |
| --- | --- |
| 模式组合 | Tool Wrapper + Pipeline + Generator + Reviewer |
| 三大任务路由 | CREATE / FILL / REFORMAT |
| 核心脚本 | `scripts/make.sh`（统一入口）+ `palette.py` / `cover.py` / `render_body.py` / `render_cover.js` / `merge.py` / `fill_inspect.py` / `fill_write.py` / `reformat_parse.py` |
| 设计 token 来源 | [aesthetic-system.md](references/aesthetic-system.md) —— **MUST 先读** |
| 文档类型 | report / proposal / resume / portfolio / academic / general / minimal / stripe / diagonal / frame / editorial / magazine / darkroom / terminal / poster |
| 配色来源 | 按行业 / 文档语境选 accent（Reviewer 校验项） |
| 主要依赖 | Python 3.9+ / reportlab / pypdf / Node.js 18+ / Playwright + Chromium |
| 脚本调用约定 | `bash <skillPath>/scripts/make.sh ...` / `python3 <skillPath>/scripts/xxx.py ...` |

## 任务路由 (Task Routing)

> **直接执行模式**：按路由表选定路径后，由主 Agent 自己走完流水线；REFORMAT 走 `reformat_parse.py` → 完整 CREATE 链路；FILL 走 `fill_inspect.py` → `fill_write.py`。

| 任务 | 路径 | 必读参考 | 脚本调用链 |
| --- | --- | --- | --- |
| **CREATE** —— 从零生成 PDF | CREATE | [aesthetic-system.md](references/aesthetic-system.md) + [overview.md](references/overview.md) | `make.sh run` → 内部串接 `palette.py` → `cover.py` → `render_cover.js` → `render_body.py` → `merge.py` |
| **FILL** —— 在既有 PDF 填表 | FILL | — | `fill_inspect.py` → `fill_write.py` |
| **REFORMAT** —— 既有文档套设计 | REFORMAT | [aesthetic-system.md](references/aesthetic-system.md) | `make.sh reformat` → 内部 `reformat_parse.py` → 完整 CREATE 链路 |

**CREATE vs REFORMAT 决策口诀**：用户有现成文档吗？有 → REFORMAT；无 → CREATE。

## 路径 A：CREATE —— 从零生成 (Create from Scratch)

阅读 [aesthetic-system.md](references/aesthetic-system.md) **先于任何 CREATE / REFORMAT 工作**。

完整流水线：**content → design tokens → cover → body → merged PDF**。

```bash
bash <skillPath>/scripts/make.sh run \
  --title "Q3 Strategy Review" --type proposal \
  --author "Strategy Team" --date "October 2025" \
  --accent "#2D5F8A" \
  --content content.json --out report.pdf
```

**文档类型清单 (Doc Types)**：

| 类型 | 封面样式 | 视觉识别度 |
| --- | --- | --- |
| `report` | `fullbleed` | 深色背景 + 点阵网格 + Playfair Display |
| `proposal` | `split` | 左面板 + 右几何块 + Syne |
| `resume` | `typographic` | 超大首词 + DM Serif Display |
| `portfolio` | `atmospheric` | 近黑 + 径向辉光 + Fraunces |
| `academic` | `typographic` | 浅色 + 古典衬线 + EB Garamond |
| `general` | `fullbleed` | 深石板 + Outfit |
| `minimal` | `minimal` | 白底 + 8px 强调条 + Cormorant Garamond |
| `stripe` | `stripe` | 三条粗色横带 + Barlow Condensed |
| `diagonal` | `diagonal` | SVG 斜切 + 深浅分屏 + Montserrat |
| `frame` | `frame` | 内嵌边框 + 角饰 + Cormorant |
| `editorial` | `editorial` | 幽灵字母 + 全大写标题 + Bebas Neue |
| `magazine` | `magazine` | 暖米色 + 居中堆叠 + 头图 + Playfair Display |
| `darkroom` | `darkroom` | 海军蓝 + 居中堆叠 + 灰度图 + Playfair Display |
| `terminal` | `terminal` | 近黑 + 网格线 + 等宽 + 霓虹绿 |
| `poster` | `poster` | 白底 + 粗侧栏 + 超大标题 + Barlow Condensed |

**封面扩展字段**：

- `--abstract "text"` —— 封面摘要文本块（magazine / darkroom）
- `--cover-image "url"` —— 封面头图 URL / 路径（magazine / darkroom / poster）

**配色覆盖（必须基于内容选色）**：

- `--accent "#HEX"` —— 覆盖强调色；`accent_lt` 自动向白色派生
- `--cover-bg "#HEX"` —— 覆盖封面背景色

**强调色选择规范 (Reviewer 项)**：根据文档语义语境（标题 / 行业 / 用途 / 受众）选色，**禁止**套用通用"安全色"。强调色会出现在分节线 / 标注条 / 表格头 / 封面，承载文档的视觉识别度。

| 语境 | 推荐强调色范围 |
| --- | --- |
| 法律 / 合规 / 金融 | 深海军 `#1C3A5E`、炭灰 `#2E3440`、石板 `#3D4C5E` |
| 医疗 / 健康 | 青绿 `#2A6B5A`、冷绿 `#3A7D6A` |
| 科技 / 工程 | 钢蓝 `#2D5F8A`、靛蓝 `#3D4F8A` |
| 环境 / 可持续 | 森林 `#2E5E3A`、橄榄 `#4A5E2A` |
| 创意 / 艺术 / 文化 | 酒红 `#6B2A35`、紫红 `#5A2A6B`、陶土 `#8A3A2A` |
| 学术 / 研究 | 深青 `#2A5A6B`、图书蓝 `#2A4A6B` |
| 企业 / 中性 | 石板 `#3D4A5A`、石墨 `#444C56` |
| 奢侈 / 高端 | 暖黑 `#1A1208`、深铜 `#4A3820` |

**[MUST]** 选择"为这份文档专门思考过的颜色"，而非类型的默认值。低饱和、暗色调优先；犹豫时往更暗、更中性走。

**`content.json` 块类型速查**：

| 块 | 用途 | 关键字段 |
| --- | --- | --- |
| `h1` | 节标题 + 强调线 | `text` |
| `h2` | 子节标题 | `text` |
| `h3` | 子子节（粗体） | `text` |
| `body` | 两端对齐段落，支持 `<b>` `<i>` 标记 | `text` |
| `bullet` | 无序列表项（• 前缀） | `text` |
| `numbered` | 有序列表项——遇到非 numbered 块自动重置计数 | `text` |
| `callout` | 高亮洞见框，左侧强调条 | `text` |
| `table` | 数据表——强调色表头，交替行底色 | `headers` / `rows` / `col_widths`? / `caption`? |
| `image` | 嵌入图片，按列宽缩放 | `path` / `src` / `caption`? |
| `figure` | 图片 + 自动编号 "Figure N:" | `path` / `src` / `caption`? |
| `code` | 等宽代码块，左强调条 | `text` / `language`? |
| `math` | 显示数学公式——LaTeX 经 matplotlib mathtext | `text` / `label`? / `caption`? |
| `chart` | 柱 / 折线 / 饼图（matplotlib） | `chart_type` / `labels` / `datasets` / `title`? / `x_label`? / `y_label`? / `caption`? / `figure`? |
| `flowchart` | 节点 + 边的流程图（matplotlib） | `nodes` / `edges` / `caption`? / `figure`? |
| `bibliography` | 编号参考列表 + 悬挂缩进 | `items[{id,text}]` / `title`? |
| `divider` | 全宽强调色分隔线 | — |
| `caption` | 小号 muted 标签 | `text` |
| `pagebreak` | 强制新页 | — |
| `spacer` | 垂直空白 | `pt`（默认 12） |

**chart / flowchart 示例**：

```json
{"type":"chart","chart_type":"bar","labels":["Q1","Q2","Q3","Q4"],
 "datasets":[{"label":"Revenue","values":[120,145,132,178]}],"caption":"Q results"}

{"type":"flowchart",
 "nodes":[{"id":"s","label":"Start","shape":"oval"},
          {"id":"p","label":"Process","shape":"rect"},
          {"id":"d","label":"Valid?","shape":"diamond"},
          {"id":"e","label":"End","shape":"oval"}],
 "edges":[{"from":"s","to":"p"},{"from":"p","to":"d"},
          {"from":"d","to":"e","label":"Yes"},{"from":"d","to":"p","label":"No"}]}

{"type":"bibliography","items":[{"id":"1","text":"Author (Year). Title. Publisher."}]}
```

## 路径 B：FILL —— 既有 PDF 填表 (Fill Form Fields)

在**不改动版式与设计**的前提下填入表单字段。

```bash
# 步骤 1：探查字段
python3 <skillPath>/scripts/fill_inspect.py --input form.pdf

# 步骤 2：写入
python3 <skillPath>/scripts/fill_write.py --input form.pdf --out filled.pdf \
  --values '{"FirstName": "Jane", "Agree": "true", "Country": "US"}'
```

| 字段类型 | 取值格式 |
| --- | --- |
| `text` | 任意字符串 |
| `checkbox` | `"true"` 或 `"false"` |
| `dropdown` | 必须匹配 inspect 输出中的 choice value |
| `radio` | 必须匹配 radio value（通常以 `/` 开头） |

**[MUST]** 总先跑 `fill_inspect.py` 获取精确字段名。

## 路径 C：REFORMAT —— 既有文档套设计 (Reformat with Design)

解析既有文档 → `content.json` → 完整 CREATE 链路。

```bash
bash <skillPath>/scripts/make.sh reformat \
  --input source.md --title "My Report" --type report --out output.pdf
```

**支持输入格式**：`.md` `.txt` `.pdf` `.json`。

## 环境与依赖 (Environment)

```bash
bash <skillPath>/scripts/make.sh check   # 校验依赖完整性
bash <skillPath>/scripts/make.sh fix     # 自动安装缺失依赖
bash <skillPath>/scripts/make.sh demo    # 生成示例 PDF
```

| 工具 | 使用脚本 | 安装方式 |
| --- | --- | --- |
| Python 3.9+ | 全部 `.py` 脚本 | 系统包 |
| `reportlab` | `render_body.py` | `pip install reportlab` |
| `pypdf` | fill / merge / reformat | `pip install pypdf` |
| Node.js 18+ | `render_cover.js` | 系统包 |
| `playwright` + Chromium | `render_cover.js` | `npm install -g playwright && npx playwright install chromium` |

## 核心红线 (Key Rules)

1. **CREATE / REFORMAT 前 MUST 读 [aesthetic-system.md](references/aesthetic-system.md)**：先于一切写代码动作。
2. **配色必选行业语义色**：禁止套用类型默认色，Reviewer MUST 校验 accent 是否贴主题。
3. **FILL 必先 inspect**：禁止凭直觉写字段名。
4. **REFORMAT 决策**：用户有源文档 → REFORMAT；无 → CREATE。
5. **依赖完整性**：先跑 `make.sh check` 再开工；缺失依赖先 `make.sh fix`。

## 进阶参考 (Advanced References)

- [aesthetic-system.md](references/aesthetic-system.md) —— **设计 token、调色板、字体、间距、反模式**（CREATE / REFORMAT 前必读）
- [overview.md](references/overview.md) —— 文档类型清单、架构、依赖、content.json schema 速查
- 脚本 README（如有）—— `scripts/` 目录内各脚本的细节参数

## 决策沉淀 (Decision Sediment)

- **采用 token-based 设计系统**：颜色 / 字体 / 间距从文档类型派生，使封面与正文风格天然统一，避免逐页重复设计决策。
- **Playwright 渲染封面 + reportlab 渲染正文 + pypdf 合并**：三件套各取所长——封面用浏览器级 SVG/CSS 排版，正文用 Python 数据流，合并稳定可靠。
- **三类 doc type 而非单一类型**：report / proposal / resume / portfolio 等明确视觉识别度，让"类型"本身成为可复用的设计资产。
- **模式组合固定 Tool Wrapper+Pipeline+Generator+Reviewer**：本技能是"读改写验"全链路，多模式叠加是必然；统一结构后与 eas-docx / eas-pptx / eas-xlsx 对齐，便于 Agent 跨技能切换。