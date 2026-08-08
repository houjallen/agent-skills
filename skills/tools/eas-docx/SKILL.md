---
name: eas-docx
description: 该技能应在 Agent 需要生成、修改或分析 Word 文档（.docx）时使用，覆盖三条路径：A-CREATE（docx-js 从零生成）/ B-EDIT（XML unpack/edit/pack 修改既有文档）/ C-ACCEPT-CHANGES（接受所有修订产出干净版）；底层栈为 docx-js + Python 助手脚本（unpack/pack/sanitize/comment/accept_changes）。触发短语：Word、docx、Word 文档、报告、合同、公文、提案、备忘录、tracked changes、review comments。不适用：PDF 输出（走 eas-pdf）/ PPT 演示（走 eas-pptx）/ Excel 表格（走 eas-xlsx）。
license: MIT
metadata:
  category: tools
  version: 1.2.0
  author: EASBot
  tags: [easbot, docx, word, document, generator, editor]
  mode: tool-wrapper+generator+reviewer+pipeline
  supported_os:
    - windows
    - macos
    - linux
  dependencies:
    - docx (npm)            # CREATE 路径
    - defusedxml (pip)      # EDIT/ACCEPT-CHANGES 路径
    - soffice (optional)    # ACCEPT-CHANGES + .doc 转换
    - pandoc (optional)     # 文本抽取
    - poppler (optional)    # .docx → .pdf 预览
  sources:
    - ECMA-376 Office Open XML File Formats
    - docx-js API reference
---

# eas-docx (Word 文档生成与编辑)

## 概述 (Overview)

`eas-docx` 是 EASBot 处理 Word 文档（.docx）的统一入口，覆盖**创建 / 编辑 / 接受修订**完整链路。它把高门槛的 OpenXML 操作封装为两套互补工具栈：

- **A-CREATE 路径**：用 `docx-js`（Node.js）声明式生成 `.docx`，最后跑 `sanitize.py` 兜底清理（去文本型 TOC、合并多余空白页）。
- **B-EDIT 路径**：`unpack.py` 解包 + Edit 工具改 XML（受保护 / 跟踪修订 / 评论 / 引用） + `pack.py` 重新打包（带自动修复 + 校验）。
- **C-ACCEPT-CHANGES 路径**：`accept_changes.py` 经 LibreOffice 把所有跟踪修订"接受"为干净版。

整个栈只依赖 **docx-js**（Node）+ **defusedxml**（Python 标准）+ **可选 LibreOffice**（接受修订 / 转 PDF），零重型框架。

**模式组合（Skill Mode Composition）**：

- **Tool Wrapper**：把 docx-js / defusedxml / LibreOffice 等异构工具封装到 `scripts/unpack.py` / `pack.py` / `sanitize.py` / `comment.py` / `accept_changes.py`。
- **Pipeline**：A-CREATE → B-EDIT → C-ACCEPT-CHANGES 三段主路径。
- **Generator**：A-CREATE 路径产出"按 docx-js 模板渲染的成品 .docx"。
- **Reviewer**：A-CREATE 后 MUST 跑 `sanitize.py`；B-EDIT 后 MUST 跑 `pack.py`（含 schema 校验）。

## 何时使用 (When to Use)

**触发场景（适用）**：

- 用户要求"写报告 / 起草提案 / 做合同 / 起草公文"等，最终产物为 `.docx`。
- 用户给出一份 .docx 需要"填字段 / 改文本 / 加批注 / 加跟踪修订"。
- 用户希望基于既有文档保留版式 / 字体 / 段落样式地填入新内容。
- 用户希望"接受 / 拒绝"所有跟踪修订并产出干净版。

**反场景（不适用）**：

- 最终产物不是 .docx（PDF / Excel / PPT）——交给 `eas-pdf` / `eas-xlsx` / `eas-pptx`。
- 只需做 OCR / 抽取文本——直接 `pandoc` 即可，不必走本技能。
- 需要 XSD 强校验 / 复杂多模板合并 / 自定义美学配方——本技能以轻量栈为基线，复杂场景建议装 `dotnet` OpenXML SDK 走重型流程。

## 快速参考 (Quick Reference)

| 项目 | 取值 / 说明 |
| --- | --- |
| 模式组合 | Tool Wrapper + Pipeline + Generator + Reviewer |
| 三大任务路由 | CREATE（A）/ EDIT（B）/ ACCEPT-CHANGES（C） |
| 工具栈 | docx-js（Node.js）+ Python 助手脚本 + defusedxml |
| CREATE 主入口 | Node.js + `docx-js`，生成后**必跑** `sanitize.py` |
| EDIT 主入口 | `unpack.py` → Edit 工具 → `pack.py`（含 schema 校验） |
| ACCEPT-CHANGES | `accept_changes.py`（需 LibreOffice） |
| 核心脚本 | `scripts/unpack.py` / `pack.py` / `sanitize.py` / `comment.py` / `accept_changes.py` + `helpers/merge_runs.py` + `helpers/simplify_redlines.py` |
| 依赖 | `npm install docx` / `pip install defusedxml` / 可选 LibreOffice |
| 脚本调用约定 | `python3 <skillPath>/scripts/xxx.py ...` / `node ...` |

## 任务路由 (Task Routing)

> **直接执行模式**：按路由表选定路径后，由主 Agent 自己走完；写操作后 MUST 跑对应 Reviewer。

```
User task
├─ 无输入 .docx / 要重做一份 → 路径 A：CREATE
│   signals: "write", "create", "draft", "generate", "new", "make a report/proposal/memo"
│   → Read references/create-with-docx-js.md
│
├─ 有输入 .docx，需改内容 / 加注释 / 加跟踪修订 → 路径 B：EDIT
│   signals: "fill in", "replace", "update", "change text", "add section", "edit"
│   → Read references/edit-xml.md
│
└─ 有输入 .docx，需"接受所有修订得干净版" → 路径 C：ACCEPT-CHANGES
    signals: "accept all changes", "clean version", "final"
    → 直接 python3 scripts/accept_changes.py input.docx output.docx
```

**跨路径处理**：单一需求跨多路径时按序串行执行（如先 CREATE 再 ACCEPT-CHANGES；先 EDIT 再 ACCEPT-CHANGES）。

## 路径 A：CREATE —— 从零生成 (Create from Scratch)

阅读 [create-with-docx-js.md](references/create-with-docx-js.md) 完整 API 与范例。

**最小可运行骨架**：

```javascript
const fs = require("fs");
const { Document, Packer, Paragraph, TextRun } = require("docx");

const doc = new Document({
  sections: [{ children: [/* 所有内容放这里 */] }]
});

Packer.toBuffer(doc).then(buf => fs.writeFileSync("out.docx", buf));
```

**完成后 MUST 跑 Reviewer**：

```bash
python3 <skillPath>/scripts/sanitize.py out.docx
```

`sanitize.py` 兜底清理：去除 docx-js 偶发的文本型 TOC 块、合并多余空白页。

**Critical Rules for docx-js（执行前必读）**：

1. **只用一个 section** —— 把所有内容放进 `sections[0].children`，**禁止**创建空 section 后跟内容 section（每个空 section 渲染为空白首页）。
2. **显式设页大小** —— docx-js 默认 A4；US Letter 用 `width: 12240, height: 15840`（DXA）。
3. **CJK 字体必设三槽** —— `font: { ascii: "Arial", hAnsi: "Arial", eastAsia: "Microsoft YaHei" }`，否则中文显示为方框。
4. **引号用 JS 转义** —— `\"`，**禁止** XML 实体 `&#x201C;`（会渲染为字面量）。
5. **`PageBreak` 必须放 `Paragraph` 内** —— `new Paragraph({ children: [new PageBreak()] })`，独立使用生成非法 XML。
6. **`ImageRun` 必传 `type`** —— png / jpg / jpeg / gif / bmp / svg。
7. **表格必设双宽度** —— 表级 `columnWidths` + 每个 cell 的 `width`，两者数值必须一致。
8. **`ShadingType.CLEAR`** —— 表格底纹用 CLEAR，**禁止** SOLID（会变纯黑）。
9. **Heading 含 `outlineLevel`** —— H1=0 / H2=1 / H3=2，否则 TOC / 导航窗格失效。
10. **Heading 设 `keepNext: false`** —— 避免标题被推到下一页造成大片空白。
11. **表格行 `cantSplit: true`** —— 行不被分页打断。
12. **不要生成 TOC 块** —— 直接以正文内容开头。

**CJK 字体推荐组合**：

| 平台 | ASCII/Latin | East Asian |
| --- | --- | --- |
| Cross-platform | Arial | Microsoft YaHei |
| macOS | Arial | PingFang SC |
| Windows | Arial | SimSun 或 SimHei |
| Linux | DejaVu Sans | Noto Sans CJK SC |

**Pages 与字体完整范例**（含 H1/H2、CJK、分页）见 [create-with-docx-js.md](references/create-with-docx-js.md)。

## 路径 B：EDIT —— 修改既有文档 (Edit Existing)

阅读 [edit-xml.md](references/edit-xml.md) 完整工作流。

**三步流程**：

```bash
# Step 1: 解包（合并相邻 runs + smart quotes 转 XML 实体）
python3 <skillPath>/scripts/unpack.py document.docx unpacked/

# Step 2: Edit 工具改 unpacked/word/document.xml（也可用 search_replace）

# Step 3: 打包（含 schema 校验 + 自动修复）
python3 <skillPath>/scripts/pack.py unpacked/ output.docx --original document.docx
```

**加注释（多文件 boilerplate 由 `comment.py` 处理）**：

```bash
python3 <skillPath>/scripts/comment.py unpacked/ 0 "Comment text with &amp; and &#x2019;"
python3 <skillPath>/scripts/comment.py unpacked/ 1 "Reply text" --parent 0
```

`comment.py` 写入 `comments.xml` 等 4 个模板文件并更新 `[Content_Types].xml` 与 `document.xml.rels`。然后在 `document.xml` 内加 `<w:commentRangeStart/>` / `<w:commentRangeEnd/>` / `<w:commentReference/>` 标记。

**[MUST] Author 名**：跟踪修订与评论作者用 `"AI Assistant"`，除非用户明确指定别的。

**Critical XML 规则**：

1. **`<w:pPr>` 元素顺序** —— `pStyle` → `numPr` → `spacing` → `ind` → `jc` → `rPr`（最末）。
2. **空白处理** —— `<w:t>` 含首尾空白 MUST 加 `xml:space="preserve"`。
3. **RSID** —— 8 位 hex（如 `00AB1234`）。
4. **`<w:del>` 内用 `<w:delText>`** —— 不用 `<w:t>`；`<w:ins>` 内用 `<w:t>`。
5. **`<w:commentRangeStart/End>` 是 `<w:p>` 的直接子节点** —— 不可放在 `<w:r>` 内。
6. **删除整段时 MUST 在 `<w:pPr><w:rPr>` 内加 `<w:del/>`** —— 标记段落符已删除，否则接受后留空段。
7. **图片加 4 处**：①文件放 `word/media/`；②关系加到 `word/_rels/document.xml.rels`；③`[Content_Types].xml` 加 `<Default Extension="png" ContentType="image/png"/>`；④`document.xml` 加 `<w:drawing>`。

**`pack.py` 自动修复**（自动触发，无需手工）：

- `durableId` ≥ `0x7FFFFFFF` → 重新生成合法 ID
- `<w:t>` 缺 `xml:space="preserve"` → 自动补

**`pack.py` 不会自动修复**：畸形 XML / 无效元素嵌套 / 缺失关系 / schema 违规。

**XML 完整参考**（含跟踪修订 / 评论 / 图片的代码范例）见 [edit-xml.md](references/edit-xml.md) + [tracked-changes.md](references/tracked-changes.md) + [comments.md](references/comments.md)。

## 路径 C：ACCEPT-CHANGES —— 接受所有修订 (Accept All Tracked Changes)

```bash
python3 <skillPath>/scripts/accept_changes.py input.docx output.docx
```

**要求**：LibreOffice（`soffice` 命令行）已安装。脚本调用 LibreOffice 的 UNO 宏 `AcceptAllTrackedChanges`，把全部 `<w:ins>` / `<w:del>` 接受为干净版。

## 文本抽取 (Reading Content)

文本抽取走外部工具，不依赖本技能的核心脚本：

```bash
# 包含修订标记的纯文本
pandoc --track-changes=all document.docx -o output.md

# 原始 XML
python3 <skillPath>/scripts/unpack.py document.docx unpacked/
```

## 格式转换 (Format Conversion)

`.doc` → `.docx` 必须先转换才能编辑：

```bash
soffice --headless --convert-to docx document.doc
```

`.docx` → `.pdf`（便于预览 / 截图）：

```bash
soffice --headless --convert-to pdf document.docx
pdftoppm -jpeg -r 150 document.pdf page
```

## 核心红线 (Key Rules)

1. **CREATE 路径只用一个 section** —— 多 section 制造空白页。
2. **CREATE 后 MUST 跑 `sanitize.py`** —— 兜底清理 docx-js 偶发的文本 TOC 与空白页。
3. **EDIT 后 MUST 跑 `pack.py`** —— schema 校验 + 自动修复。
4. **CJK 字体必设三槽** —— `ascii / hAnsi / eastAsia`，否则中文方框。
5. **docx-js 用 JS 转义 `\"`** —— **禁止** XML 实体 `&#x201C;`（会渲染为字面量）。
6. **跟踪修订 `<w:del>` 用 `<w:delText>`**，`<w:ins>` 用 `<w:t>`。
7. **`<w:commentRangeStart/End>` 是 `<w:p>` 的直接子节点**，不可放 `<w:r>` 内。
8. **Author 名默认 `"AI Assistant"`**，除非用户明确指定。

## 工具脚本速查 (Utility Scripts)

```bash
python3 <skillPath>/scripts/unpack.py document.docx unpacked/         # 解包（含合并 runs + 转义 smart quotes）
python3 <skillPath>/scripts/pack.py unpacked/ output.docx --original in.docx  # 打包（含 schema 校验 + 自动修复）
python3 <skillPath>/scripts/sanitize.py out.docx                      # CREATE 后清理（去 TOC 块 / 合并空白页）
python3 <skillPath>/scripts/comment.py unpacked/ 0 "Comment text"      # 加注释（含回复支持）
python3 <skillPath>/scripts/accept_changes.py in.docx out.docx         # 接受所有跟踪修订（需 LibreOffice）
```

## 进阶参考 (Advanced References)

> **按需加载**：不要一次性全读，按当前任务挑最相关的文件。

| 文件 | 何时读 |
| --- | --- |
| [create-with-docx-js.md](references/create-with-docx-js.md) | 路径 A：CREATE —— docx-js API + page size + 字体 + 列表 + 表格 + 图片 + 分页 + 头脚 |
| [edit-xml.md](references/edit-xml.md) | 路径 B：EDIT —— unpack/pack 三步流程 + XML 规则 + images |
| [tracked-changes.md](references/tracked-changes.md) | 路径 B 子话题：跟踪修订的 XML 模式 + 接受 / 拒绝 / 嵌套 |
| [comments.md](references/comments.md) | 路径 B 子话题：评论的 4 文件系统 + 范围标记 + 回复 |
| [dependencies.md](references/dependencies.md) | 外部依赖列表（pandoc / docx / LibreOffice / Poppler） |

> **设计选择归档**：本技能的设计取舍（CREATE/EDIT 路径拆分、sanitize.py 兜底、模式组合等）已迁出至 [docs/decisions/0008-decision-sediment-tools-office.md § 1](file:///e:/work/apps/eas/agent-skills/docs/decisions/0008-decision-sediment-tools-office.md)，不在 SKILL.md 末尾重复。