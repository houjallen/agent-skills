---
name: eas-pptx
description: 该技能应在 Agent 需要生成、编辑或分析 PowerPoint 演示文稿（.pptx）时使用，覆盖三条路径：CREATE（用 PptxGenJS + 18 配色 × 4 风格 × 5 页面类型设计资产生成）、EDIT（XML unpack/edit/pack 修改既有模板）、READ（markitdown 抽取文本分析）；含 Layout QA + Content QA 双层校验与布局安全规则。触发短语：PPT、PPTX、PowerPoint、presentation、slide、deck、slides、演示文稿、幻灯片。不适用：纯数据可视化（走 eas-xlsx + chart）/ 静态设计稿（走 eas-pdf）/ Word 文档（走 eas-docx）。
license: MIT
metadata:
  category: tools
  version: 1.1.0
  author: EASBot
  tags: [easbot, pptx, powerpoint, presentation, slides, deck, generator, editor]
  mode: tool-wrapper+generator+reviewer+pipeline
  supported_os:
    - windows
    - macos
    - linux
  dependencies:
    - markitdown[pptx] (pip)    # READ + Content QA
    - pillow (pip)              # 缩略图
    - pptxgenjs (npm)           # CREATE
    - lxml (pip)                # XML 编辑
  sources:
    - https://gitbrent.github.io/PptxGenJS/
    - https://github.com/microsoft/markitdown
    - ECMA-376 Office Open XML File Formats
---

# eas-pptx (PPTX 演示文稿生成与编辑)

## 概述 (Overview)

`eas-pptx` 是 EASBot 处理 PowerPoint 演示文稿（.pptx）的统一入口，覆盖**读取分析 → 创建 → 编辑 → 校验**完整链路。它把高门槛的 PptxGenJS 调用与 OOXML XML 直编封装为统一工作流：CREATE 路径产出"按设计 token 渲染的成品 `.pptx`"，EDIT 路径基于既有模板做结构 / 内容修改，READ 路径用 markitdown 抽取文本。所有从零生成的页面 MUST 经 Layout QA（`validate_layout.py`）+ Content QA（`markitdown`）双层 Reviewer 校验。

**模式组合（Skill Mode Composition）**：

- **Tool Wrapper**：把 PptxGenJS / markitdown / PIL / pptxgenjs / LibreOffice 等异构工具封装到 `scripts/validate_layout.py` / `fix_pptx.py` / `unpack.py` / `pack.py` / `clean.py` / `add_slide.py`。
- **Pipeline**：READ → CREATE → EDIT → VALIDATE 四段流水线，按用户意图分派。
- **Generator**：CREATE 路径产出"按 5 页面类型 + 18 配色方案 + 4 风格配方渲染的成品 .pptx"。
- **Reviewer**：每次 build 后 MUST 跑 Layout QA（`validate_layout.py`）+ Content QA（`markitdown`），循环最多 3 轮。

## 何时使用 (When to Use)

**触发场景（适用）**：

- 用户要求"生成 / 制作 / 写一份 PPT / 演示文稿 / 幻灯片"。
- 用户给出一份 .pptx 要求"修改内容 / 改样式 / 套设计 / 改章节顺序 / 加分页"。
- 用户希望基于既有模板保持版式填入新内容。
- 需要抽取 .pptx 文本做内容分析 / 校对。

**反场景（不适用）**：

- 最终产物不是 .pptx（Word / Excel / PDF）——交给 `eas-docx` / `eas-xlsx` / `eas-pdf`。
- 只需做文本抽取——直接 `python -m markitdown` 即可，不必走本技能。
- 简单图片轮播（不需 Office 兼容）——直接生成 HTML 即可。

## 快速参考 (Quick Reference)

| 项目 | 取值 / 说明 |
| --- | --- |
| 模式组合 | Tool Wrapper + Pipeline + Generator + Reviewer |
| 三大任务路由 | CREATE / EDIT / READ |
| 默认布局 | `LAYOUT_16x9`（10" × 5.625"） |
| 颜色格式 | 6 字符 hex（**无 `#` 前缀**，例如 `"FF0000"`） |
| 字体 | 中文 Microsoft YaHei / 英文 Arial 或授权替代 |
| 页码徽章位置 | x: 9.3", y: 5.1" |
| Theme 契约 keys | `primary` / `secondary` / `accent` / `light` / `bg`（**禁止其他命名**） |
| 5 页面类型 | Cover / TOC / Section Divider / Content / Summary |
| 4 风格配方 | Sharp / Soft / Rounded / Pill（仅 `rectRadius` 与 spacing 不同） |
| 核心脚本 | `scripts/validate_layout.py`（Layout QA）/ `scripts/fix_pptx.py`（修复）/ `scripts/unpack.py` + `scripts/pack.py`（XML 编辑）/ `scripts/clean.py` / `scripts/add_slide.py` / `scripts/thumbnail.py` |
| 设计搜索 | `scripts/design/search.py "<topic> <industry>" --design-system` |
| 数据 CSV 资产 | `references/design-data/colors.csv` / `styles.csv` / `icons.csv` / `charts.csv` 等 |
| 脚本调用约定 | `python3 <skillPath>/scripts/xxx.py ...` / `python3 -m markitdown ...` |

## 任务路由 (Task Routing)

> **直接执行模式**：按路由表选定路径后，由主 Agent 自己走完；任何 CREATE / EDIT 完成后 MUST 跑 [VALIDATE 子路径](#validate-子路径--createedit-必跑)。

| 任务 | 路径 | 必读参考 | 脚本调用链 |
| --- | --- | --- | --- |
| **READ** —— 分析既有内容 | READ | — | `python -m markitdown file.pptx` |
| **CREATE** —— 从零生成 | CREATE | [slide-types.md](references/slide-types.md) + [design-system.md](references/design-system.md) + [pptxgenjs.md](references/pptxgenjs.md) | PptxGenJS 脚本 → `fix_pptx.py` → `validate_layout.py` → `markitdown` |
| **EDIT** —— 修改既有模板 | EDIT | [editing.md](references/editing.md) | `unpack.py` → 改 XML / `add_slide.py` → `clean.py` → `pack.py` → `validate_layout.py` |

**CREATE vs EDIT 决策口诀**：用户给了 .pptx 模板吗？给了 → EDIT；没给 → CREATE。

## 路径 A：READ —— 文本抽取 (Read & Analyze)

```bash
# 文本抽取（标准入口）
python -m markitdown presentation.pptx

# 原始 XML（深入分析时）
python3 <skillPath>/scripts/unpack.py presentation.pptx unpacked/
```

## 路径 B：CREATE —— 从零生成 (Create from Scratch)

阅读 [slide-types.md](references/slide-types.md) + [design-system.md](references/design-system.md) + [pptxgenjs.md](references/pptxgenjs.md)。

**完整工作流**：

1. **规划内容** → 2. **预生成资产** → 3. **写 PptxGenJS 脚本** → 4. **跑 [VALIDATE 子路径](#validate-子路径--createedit-必跑)**。

### B-1 必填结构 (Required Slide Structure)

从零生成的演示 MUST 遵循：

1. 第 1 页：封面（Cover）
2. 第 2 页：目录 / 大纲（Table of Contents）
3. 第 3 页起：按 TOC 顺序排的内容页
4. 末页：致谢 / 总结（Closing / Thank You）

**禁止**跳过目录页；**禁止**把内容页放在目录页之前。

### B-2 禁止空白页 (No Blank Slides Allowed)

每张幻灯片 MUST 至少含一个可见元素（`addText` / `addShape` / `addImage` / `addChart` / `addTable`）。仅有背景色无内容的页面是生成缺陷。

**常见空白原因**：

- 分节页 / 过渡页忘了加内容元素
- 生成 token 截断导致后续页面为空
- 假设 slide layout / master 会自动填充（不会——PptxGenJS 创建的 layout 是空的）

**修复**：明确加分节编号 / 大标题 / 装饰形状等元素。

### B-3 预生成规划 (REQUIRED Pre-Generation Planning)

**写代码前 MUST 完成以下规划步骤**：

#### B-3.1 输出内容设计计划

提交结构化计划，覆盖：

1. **整体主题与样式** —— 配色选择（参考 [Design Ideas](references/design-system.md)）/ 字体配对 / 贯穿幻灯片的视觉母题。
2. **逐页大纲**：
   ```
   第 1 页：Cover —— 布局类型 / 关键元素
   第 2 页：TOC —— 有序章节列表
   第 3 页：[TOC 章节 1] —— 布局类型 / 关键元素 / 视觉洞见（如有）
   ...
   第 N 页：致谢 —— 布局 / 关键元素
   ```
3. **视觉元素清单** —— 列出所有图片 / 图标 / 图表 / 关系图，每项标 `[Built-in]`（PptxGenJS 自带 shapes / charts）或 `[External]`（需预生成）。

**示例规划**：

```markdown
## 演示计划
**主题**：Ocean Gradient 配色（065A82 / 1C7293 / 21295C）
**字体**：Georgia（标题）+ Calibri（正文）
**母题**：圆角卡片 + 左侧强调条

### 幻灯片：
1. Cover —— 居中标题，渐变背景
2. TOC —— Overview / Architecture / Metrics / Timeline
3. [TOC 章节 1] —— 布局 / 元素 / 洞见（如有视觉）
...
n. Thank You —— 收尾语 + 联系方式
```

#### B-3.2 预生成外部资产

`[External]` 项 MUST 在写 PptxGenJS 代码**前**生成完成。

**[MUST] 颜色一致性**：所有生成的图表与关系图 MUST 用同一配色。在生成脚本顶部定义 `COLORS` 常量。

**首选：原生 shapes / charts (REQUIRED Default)**

所有架构图 / 流程图 / 过程图 / 组织结构图 / 关系图 MUST 用 PptxGenJS 原生 shapes（RECTANGLE / OVAL / LINE / 连接器 + addText）。见 [pptxgenjs.md](references/pptxgenjs.md) 的 "Building Diagrams with Native Shapes" 节。

- 优先用强模板幻灯片（流程 / 对比 / 双列 / 图标网格）。
- 用 PptxGenJS 原生 shapes（方块 / 箭头 / 直线 + 文本）做流程 / 架构 / 层级图。
- 用 PptxGenJS charts 做简单数据图（柱 / 饼 / 折线）。

**仅在以下情况降级**：

- matplotlib：复杂统计图（热力图 / 散点 / 箱线图）等 PptxGenJS 不能胜任的场景。
- Mermaid：原生 shapes 表达不了的、含大量交叉连接的复杂图。

**matplotlib 示例（带主题色板）**：

```python
import matplotlib.pyplot as plt

COLORS = {
    'primary': '#065A82',
    'secondary': '#1C7293',
    'accent': '#21295C',
    'background': '#F0F7FA',
    'text': '#21295C',
    'light': '#E8F4F8',
}
COLOR_CYCLE = [COLORS['primary'], COLORS['secondary'], COLORS['accent'], '#4A90A4', '#2D5A6B']

plt.rcParams.update({
    'axes.prop_cycle': plt.cycler(color=COLOR_CYCLE),
    'axes.facecolor': 'none',
    'axes.edgecolor': COLORS['text'],
    'axes.labelcolor': COLORS['text'],
    'text.color': COLORS['text'],
    'xtick.color': COLORS['text'],
    'ytick.color': COLORS['text'],
    'figure.facecolor': 'none',
    'font.family': 'sans-serif',
    'font.size': 12,
})

fig, ax = plt.subplots(figsize=(8, 5), dpi=150)
ax.bar(['Q1','Q2','Q3','Q4'], [25,40,35,50],
       color=[COLORS['primary'], COLORS['secondary'], COLORS['primary'], COLORS['secondary']],
       edgecolor=COLORS['accent'], linewidth=1.5)
# ... 完整代码见 references/design-system.md

width_px, height_px = int(8 * 150), int(5 * 150)
plt.savefig(f'chart_{width_px}x{height_px}.png', dpi=150, transparent=True)
plt.close()
```

**matplotlib 配色模板**：Midnight Executive / Forest & Moss / Coral Energy / Warm Terracotta / Teal Trust 等多套可用，详见 [design-system.md](references/design-system.md)。

**CJK matplotlib**：

```python
import matplotlib, platform

def setup_matplotlib_cjk():
    system = platform.system()
    if system == "Darwin": fonts = ['Arial Unicode MS','PingFang SC','Heiti SC','STHeiti']
    elif system == "Windows": fonts = ['Microsoft YaHei','SimHei','SimSun']
    else: fonts = ['Noto Sans CJK SC','WenQuanYi Zen Hei','Droid Sans Fallback']
    for f in fonts:
        if f in [x.name for x in matplotlib.font_manager.fontManager.ttflist]:
            plt.rcParams['font.sans-serif'] = [f] + plt.rcParams['font.sans-serif']
            plt.rcParams['axes.unicode_minus'] = False
            return f
    return None

cjk = setup_matplotlib_cjk()  # 调用后再 plt.bar(...)
```

#### B-3.3 图像命名规范 (REQUIRED)

**所有生成图像 MUST 在文件名中包含尺寸**：`{name}_{width}x{height}.png`（例 `architecture_800x600.png`）。

保存时计算像素并写入文件名：

```python
width_px = int(8 * 150)   # 1200
height_px = int(5 * 150)  # 750
plt.savefig(f'chart_{width_px}x{height_px}.png', dpi=150, transparent=True)
```

#### B-3.4 资产校验

```bash
ls -la *_*x*.png *_*x*.jpg 2>/dev/null
for f in *_*x*.png; do
  echo "$f: $(file "$f" | grep -oE '[0-9]+ x [0-9]+')"
done
```

**仅在满足以下条件时进入代码生成**：

- [ ] 内容计划完成且经用户确认
- [ ] 所有 `[External]` 资产已生成
- [ ] 资产文件名含 `{name}_{width}x{height}.png`
- [ ] 文件名尺寸与实际尺寸一致

### B-4 滑页尺寸 (REQUIRED FIRST)

**加任何元素前 MUST 在脚本顶部声明尺寸常量**：

```javascript
pres.layout = 'LAYOUT_16x9';
const SLIDE_W = 10;        // 英寸
const SLIDE_H = 5.625;     // 英寸

const MARGIN = 0.5;
const CONTENT_X = MARGIN;
const CONTENT_Y = MARGIN;
const CONTENT_W = SLIDE_W - (2 * MARGIN);  // 9
const CONTENT_H = SLIDE_H - (2 * MARGIN);  // 4.625

const CENTER_X = SLIDE_W / 2;               // 5
const CENTER_Y = SLIDE_H / 2;               // 2.8125
```

**可用布局与尺寸**：

| Layout | 宽 × 高 | 内容区（含 0.5" 边距） |
| --- | --- | --- |
| `LAYOUT_16x9` | 10" × 5.625" | 9" × 4.625" |
| `LAYOUT_16x10` | 10" × 6.25" | 9" × 5.25" |
| `LAYOUT_4x3` | 10" × 7.5" | 9" × 6.5" |

**[MUST]** 所有定位用尺寸常量，**禁止**硬编码坐标。

### B-5 容器系统 (REQUIRED)

**每个 PptxGenJS 脚本开头（声明尺寸常量后）加容器系统代码**。它提供：

1. **文本溢出防护** —— 自动加 `autoFit: true` + `fit: "shrink"`
2. **嵌套容器** —— 在 shape 内用相对坐标加元素
3. **自动 z-order** —— 子元素渲染于父元素之上

完整实现见 [pptxgenjs.md](references/pptxgenjs.md) 的 "CRITICAL: Container System" 节。

**用法**：

```javascript
let card = slide.addShape(pres.shapes.RECTANGLE, {
  x: 1, y: 2, w: 4, h: 2.5, fill: { color: "FFFFFF" }
});
card.addText("Title", { x: 0.2, y: 0.2, w: 3.6, h: 0.4, fontSize: 18 });
card.addText("Description", { x: 0.2, y: 0.7, w: 3.6, h: 1.5, fontSize: 12 });

// ⚠️ 必调：slide.render()
slide.render();
```

**多行文本需正常换行**：显式禁用溢出防护 `autoFit: false, fit: "none"`。

### B-6 Theme Object Contract (MANDATORY)

`compile.js` 传给每页的 theme 对象 keys 必须为以下 5 个：

| Key | 用途 | 示例 |
| --- | --- | --- |
| `theme.primary` | 最深色，标题 | `"22223b"` |
| `theme.secondary` | 深强调，正文 | `"4a4e69"` |
| `theme.accent` | 中等强调 | `"9a8c98"` |
| `theme.light` | 浅强调 | `"c9ada7"` |
| `theme.bg` | 背景色 | `"f2e9e4"` |

**[MUST] 禁止**使用 `background` / `text` / `muted` / `darkest` / `lightest` 等其他命名。

### B-7 页码徽章 (REQUIRED，除封面)

非封面页 MUST 含右下角页码徽章。

- 位置：x: 9.3", y: 5.1"
- 仅显示当前页码（如 `3` 或 `03`），**禁止** "3/12"
- 用调色板颜色，保持克制

**圆形徽章（默认）**：

```javascript
slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent } });
slide.addText("3", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 12, fontFace: "Arial",
  color: "FFFFFF", bold: true, align: "center", valign: "middle" });
```

**药丸徽章**：

```javascript
slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 9.1, y: 5.15, w: 0.6, h: 0.35,
  fill: { color: theme.accent }, rectRadius: 0.15 });
slide.addText("03", { x: 9.1, y: 5.15, w: 0.6, h: 0.35, fontSize: 11, fontFace: "Arial",
  color: "FFFFFF", bold: true, align: "center", valign: "middle" });
```

## 路径 C：EDIT —— 修改既有模板 (Edit Existing)

阅读 [editing.md](references/editing.md) 完整工作流。

**模板工作流**：

1. **复制并分析** —— `cp user.pptx template.pptx` + `markitdown template.pptx > template.md`
2. **规划映射** —— 为每个内容节选模板页（**禁止**千篇一律——多用多列 / 图文组合 / 全幅图 / 引用 / 分节 / 大数字 / 图标网格）
3. **解包** —— `python3 <skillPath>/scripts/unpack.py template.pptx unpacked/`
4. **风格层检查 (必须)** —— 检查 `ppt/slides/slide{N}.xml` / `slideLayouts/slideLayout{N}.xml` / `theme/theme1.xml`
5. **Theme & Style 对齐计划 (必须)** —— 列要复用的主色 / 字体 / 间距 / 视觉母题
6. **结构性变更** —— 删 / 复制 / 重排（`<p:sldIdLst>`）。**所有结构性变更必须在步骤 7 前完成**。
7. **改内容** —— 用 Edit 工具改每页 XML；可用子 Agent 并行
8. **清理** —— `python3 <skillPath>/scripts/clean.py unpacked/`
9. **打包** —— `python3 <skillPath>/scripts/pack.py unpacked/ output.pptx --original template.pptx`
10. **跑 [VALIDATE 子路径](#validate-子路径--createedit-必跑)**

**关键规则**：

- **粗体所有标题 / 子标题 / 行内标签** —— `<a:rPr b="1"/>`。
- **禁止用 unicode 项目符号** —— 用 `<a:buChar>` / `<a:buAutoNum>`。
- **删多余元素**（图片 / 形状 / 文本框），不要只清空文字。
- **多项目 MUST 用独立 `<a:p>`** —— 禁止串成一段。

## VALIDATE 子路径 —— CREATE/EDIT 必跑 (Validation Pipeline)

> **[MUST] CREATE / EDIT 完成后 MUST 跑 Layout QA + Content QA**。最多循环 3 轮。

### V-1 Layout QA (MANDATORY — Run After Every Build)

**⚠️ 这是硬门。必须通过才声明完成。**

**从零生成（CREATE）—— 修复并校验所有页**：

```bash
python3 <skillPath>/scripts/fix_pptx.py output.pptx
python3 <skillPath>/scripts/validate_layout.py output.pptx
```

**模板编辑（EDIT）—— 仅校验修改页**：

```bash
python3 <skillPath>/scripts/validate_layout.py output.pptx --slides 3,5,8
```

**规则**：

1. 报告 `Issues: 0` → 通过。
2. `Issues: > 0` → 只修受影响的页，重 build 再跑。**循环到 0 问题为止**。
3. **`blank_slide` 是生成缺陷 —— 禁止跳过**。报告说空白就是空白——必须加预期内容（文本 / 形状 / 图片），**禁止**当"已知限制"放过。
4. **最多 3 轮重试**。3 轮后仍未通过，向用户汇报剩余问题再继续——不要无限循环。
5. **禁止跳过首跑**。禁止带着问题宣布成功（除已达重试上限）。

**调试细节**：

```bash
python3 <skillPath>/scripts/validate_layout.py output.pptx --verbose
```

### V-2 Content QA

```bash
python -m markitdown output.pptx
```

检查：内容缺失 / 拼写错误 / 顺序错误。

**洞见覆盖校验**：含 chart / 关系图的页面 MUST 有显式洞见判断；默认加洞见，除非视觉纯装饰。

**模板场景查占位符残留**：

```bash
# macOS / Linux
python -m markitdown output.pptx | grep -iE "xxxx|lorem|ipsum|placeholder|this.*(page|slide).*layout"

# Windows PowerShell
python -m markitdown output.pptx | Select-String -Pattern "xxxx|lorem|ipsum|placeholder|this.*(page|slide).*layout"
```

grep 有结果 → 修干净再宣布成功。

### V-3 重叠预防 (Overlap Prevention)

- **文本 vs 文本** —— 文本框必须 `autoFit` 或定高；若高度动态，按上一文本长度算下一元素的 Y。
- **文本 vs 图片** —— 禁止文本直接压在图片上而无半透明底 / 高对比叠加。
- **图表图例** —— 图例常变宽。预留 20% 余量或放底部。
- **表格内容** —— 窄列里的长单词会换行推高行高，把下方内容顶出幻灯片。

## 设计系统速查 (Design System Reference)

完整设计系统见 [design-system.md](references/design-system.md)。速查：

### 18 套预设配色方案

详见 [references/design-system.md](references/design-system.md) 的 "Color Palette Reference"。每套含 5 色 + 适用场景 + 选色提示。包括：

- Modern & Wellness / Business & Authority / Nature & Outdoors / Vintage & Academic
- Soft & Creative / Bohemian / Vibrant & Tech / Craft & Artisan
- Tech & Night / Education & Charts / Forest & Eco / Elegant & Fashion
- Art & Food / Luxury & Mysterious / Pure Tech Blue / Coastal Coral
- Vibrant Orange Mint / Platinum White Gold

**白金黑主题含完整色阶**（White / Gold / Blue / Gray scale + Opacity），适合品牌设计。

### 4 种风格配方 (Style Recipes)

仅调整 `rectRadius` 与 spacing 即可在同一设计上呈现 4 种风格：

| 风格 | rectRadius | 间距 | 最佳用途 |
| --- | --- | --- | --- |
| **Sharp & Compact** | 0 ~ 0.05" | 紧凑 | 数据密集 / 表格 / 专业报告 |
| **Soft & Balanced** | 0.08 ~ 0.12" | 适中 | 企业 / 商务 / 通用 |
| **Rounded & Spacious** | 0.15 ~ 0.25" | 放松 | 产品介绍 / 营销 / 创意展示 |
| **Pill & Airy** | 0.3 ~ 0.5" | 开放 | 品牌展示 / 发布会 / 高端演示 |

**混合规则**：

1. 外层圆角 ≥ 内层圆角
2. 信息密度驱动间距（数据区紧凑 / 浏览区放松）
3. 圆角 vs 元素高度：小元素 0" / 中元素 0.05" / 大元素 0.08~0.2" / 超大 0.12~0.25"；标准 pill = `rectRadius = height / 2`

**速选指引**：

| 演示类型 | 推荐风格 | 原因 |
| --- | --- | --- |
| 财务 / 数据报告 | Sharp & Compact | 高密度 + 严谨精确 |
| 企业 / 商务 | Soft & Balanced | 专业 + 平易近人 |
| 产品介绍 / 营销 | Rounded & Spacious | 现代 + 友好 |
| 发布会 / 品牌 | Pill & Airy | 高端 + 视觉冲击 |
| 培训 / 教育 | Soft / Rounded | 清晰 + 易读 + 友好 |
| 技术分享 | Sharp / Soft | 专业 + 信息密集 |

### 排版 (Typography)

**标题 MUST 用衬线字体**：封面 / 幻灯片标题 / 副标题优先 serif（Georgia / Cambria / Palatino / Garamond / Times New Roman；CJK：宋体 / 思源宋体）。无 serif 时降级到 sans-serif。

**字体配对**：serif 标题 + sans-serif 正文。

| Header (serif) | Body |
| --- | --- |
| Georgia | Calibri |
| Cambria | Calibri |
| Cambria | Calibri Light |
| Palatino Linotype | Calibri |
| Palatino | Garamond |
| Garamond | Calibri Light |
| Times New Roman | Arial |

**字号表**：

| 元素 | 字号 |
| --- | --- |
| 封面标题 | 36-44pt 粗体 serif |
| 幻灯片标题 | 28-36pt 粗体 serif |
| 副标题 | 18-24pt serif |
| 节标题 | 20-24pt 粗体 |
| 正文 | 14-16pt |
| 注释 | 10-12pt muted |

**衬线 charSpacing 规则**：

| 字号 | charSpacing |
| --- | --- |
| ≥ 36pt | 2.5 |
| 24-35pt | 1.5 |
| 18-23pt | 1 |
| 12-17pt | 0.5 |
| < 12pt | 0（默认） |

### 5 种页面类型 (Slide Page Types)

每张幻灯片 MUST 归为以下 5 种**之一**：

1. **Cover**（封面）—— 开场 + 定调
2. **Table of Contents**（目录）—— 3-5 节
3. **Section Divider**（分节页）—— 章间过渡
4. **Content**（内容页）—— 文本 / 图文 / 数据 / 对比 / 时间线 / 图集
5. **Summary / Closing**（总结 / 收尾）—— 关键要点 / 下一步 / 致谢

每类的版式选项、字号层级、内容元素、工作流详见 [slide-types.md](references/slide-types.md)。

## 布局安全 (Layout Safety, REQUIRED Before QA)

**在 QA 里修溢出太晚。在代码里预防。**

1. 按所需 Y 范围选 layout：
   - `LAYOUT_16x9` 高 = 5.625
   - `LAYOUT_16x10` 高 = 6.25
   - `LAYOUT_4x3` 高 = 7.5
   - `LAYOUT_WIDE` 高 = 7.5
2. 放元素前先定 margin：
   - 默认 `left/right/top/bottom = 0.5`
3. 在内容框内构建：
   - `contentX = marginLeft`
   - `contentY = marginTop`
   - `contentW = slideW - marginLeft - marginRight`
   - `contentH = slideH - marginTop - marginBottom`
4. 每个 shape/text/image/chart 强约束边界：
   - `x >= marginLeft`
   - `y >= marginTop`
   - `x + w <= slideW - marginRight`
   - `y + h <= slideH - marginBottom`
5. 文本长度不确定时预留垂直 slack：
   - 堆叠块间留 ≥ 0.3" 间距
   - 文本密集页底部留 ≥ 0.4" 缓冲

设计需要 `y + h > 5.625` 时，**禁止**用 `LAYOUT_16x9`。

## 核心红线 (Key Rules)

1. **每个 PptxGenJS 脚本顶部 MUST 声明尺寸常量 + 容器系统代码**。
2. **每个 slide MUST 以 `slide.render()` 结尾**。
3. **禁止 hex 加 `#` 前缀** —— `"FF0000"` 正确，`"#FF0000"` 损坏文件。
4. **禁止 hex 编码 opacity** —— 用 `opacity` 属性，不用 8 字符 hex。
5. **禁止 `async/await` in createSlide()** —— compile.js 不会 await。
6. **禁止跨调用复用 option 对象** —— PptxGenJS 会 in-place 修改对象（转 EMU）。
7. **禁止 ROUNDED_RECTANGLE 加 accent 边框** —— 矩形覆盖条压不住圆角。用 RECTANGLE。
8. **禁止标题用横线分隔** —— AI 生成标志，用留白或背景色代替。
9. **禁止空白页** —— `validate_layout.py` 会捕获。
10. **最大 3 轮 Layout QA 重试** —— 超出即汇报。
11. **HEX 颜色与文本框 margin** —— 对齐形状/图标时设 `margin: 0`。

## 工具脚本速查 (Utility Scripts)

```bash
python3 <skillPath>/scripts/validate_layout.py output.pptx              # Layout QA（必跑）
python3 <skillPath>/scripts/fix_pptx.py output.pptx                     # 后处理修复
python3 <skillPath>/scripts/unpack.py input.pptx unpacked/              # 解包为 XML 树
python3 <skillPath>/scripts/pack.py unpacked/ out.pptx --original in    # 重新打包
python3 <skillPath>/scripts/clean.py unpacked/                          # 清理孤儿文件
python3 <skillPath>/scripts/add_slide.py unpacked/ slide2.xml           # 复制 / 新建 slide
python3 <skillPath>/scripts/thumbnail.py output.pptx                     # 缩略图网格
python3 <skillPath>/scripts/design/search.py "<topic>" --design-system  # 检索设计系统
python -m markitdown output.pptx                                         # 文本抽取（Content QA）
```

## 数据资产速查 (Data Assets)

按需查阅 `references/design-data/` 下的 CSV：

- `colors.csv` / `styles.csv` —— 配色与样式
- `icons.csv` —— 图标
- `charts.csv` —— 图表
- `typography.csv` / `ux-guidelines.csv` / `ui-reasoning.csv` —— 排版与设计推理
- `web-interface.csv` / `landing.csv` / `products.csv` —— 行业模板
- `react-performance.csv` —— 性能数据
- `stacks/{astro,flutter,html-tailwind,jetpack-compose,nextjs,nuxt-ui,nuxtjs,react,react-native,shadcn,svelte,swiftui,vue}.csv` —— 各类栈

## 依赖 (Dependencies)

```bash
pip install "markitdown[pptx]"     # 文本抽取
pip install Pillow                 # 缩略图
npm install pptxgenjs              # 从零生成（项目依赖）
```

## 进阶参考 (Advanced References)

> **按需加载**：不要一次性全读，按当前任务挑最相关的文件。

| 文件 | 何时读 |
| --- | --- |
| [slide-types.md](references/slide-types.md) | 5 页面类型的版式 / 字号 / 工作流 |
| [design-system.md](references/design-system.md) | 18 配色 / 4 风格 / 字体配对 / 字号 / 间距 / matplotlib 模板 |
| [pptxgenjs.md](references/pptxgenjs.md) | PptxGenJS 完整 API + 容器系统 + 布局安全 + 字号表 |
| [editing.md](references/editing.md) | 模板编辑工作流 / 结构 / 内容 / 格式规则 / 常见坑 |
| [colors.csv](references/design-data/colors.csv) | 按域查配色 |
| [styles.csv](references/design-data/styles.csv) | 按域查样式 |
| [charts.csv](references/design-data/charts.csv) | 按域查图表 |
| [icons.csv](references/design-data/icons.csv) | 按域查图标 |
| [stacks/](references/design-data/stacks/) | 各类技术栈的设计基线 |

> **设计选择归档**：本技能的设计取舍（PptxGenJS 为主、Theme 5 keys、三维组合设计资产、Layout QA + Content QA 双层 Reviewer、模式组合等）已迁出至 [docs/decisions/0008-decision-sediment-tools-office.md § 3](file:///e:/work/apps/eas/agent-skills/docs/decisions/0008-decision-sediment-tools-office.md)，不在 SKILL.md 末尾重复。