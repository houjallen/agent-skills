# 用 docx-js 从零生成 .docx (Create with docx-js)

> **路径 A 的完整 API 速查**。阅读后能写出任意结构化 Word 文档。

## 安装 (Setup)

```bash
npm install docx
```

`docx-js` 是 JS 库，无运行时依赖。

## 最小骨架 (Minimal Skeleton)

```javascript
const fs = require("fs");
const { Document, Packer, Paragraph, TextRun } = require("docx");

const doc = new Document({
  sections: [{ children: [/* ALL content goes here */] }]
});

Packer.toBuffer(doc).then(buf => fs.writeFileSync("out.docx", buf));
```

**[MUST] 只用一个 section**：把全部内容放进 `sections[0].children`。多 section 会渲染空白页。

## 完成后必跑 (REQUIRED Reviewer)

```bash
python3 <skillPath>/scripts/sanitize.py out.docx
```

`sanitize.py` 清理 docx-js 偶发的文本型 TOC 块与多余空白页。

## 页大小 (Page Size)

**CRITICAL: docx-js 默认 A4**，不是 US Letter。

```javascript
sections: [{
  properties: {
    page: {
      size: { width: 12240, height: 15840 }, // US Letter DXA
      margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 1 inch
    }
  },
  children: [/* 内容 */]
}]
```

**常用页大小（DXA，1440 DXA = 1 inch）**：

| 纸张 | Width | Height | 内容区（1" 边距） |
| --- | --- | --- | --- |
| US Letter | 12,240 | 15,840 | 9,360 |
| A4（默认） | 11,906 | 16,838 | 9,026 |

## 字体与 CJK 支持 (Fonts & CJK)

**CRITICAL: 中文 / 日文 / 韩文文档 MUST 配置三槽字体**。仅设 ASCII 字体（`Arial`）会让 CJK 字符显示为方框或乱码。

**字体槽说明**：

- `ascii` / `hAnsi`：拉丁字母（A-Z / a-z / 数字）
- `eastAsia`：CJK 字符
- `cs`：复杂脚本（阿拉伯 / 希伯来）

### 推荐字体组合 (Recommended Font Combinations)

| 平台 | ASCII/Latin | East Asian (CJK) |
| --- | --- | --- |
| Cross-platform | Arial | Microsoft YaHei |
| macOS | Arial | PingFang SC |
| Windows | Arial | SimSun 或 SimHei |
| Linux | DejaVu Sans | Noto Sans CJK SC |

**最佳实践**：用 `Microsoft YaHei`，跨平台可获得良好渲染。

### 跨平台自适应选字体

```javascript
const os = require("os");
const cjkFont = os.platform() === "darwin" ? "PingFang SC"
              : os.platform() === "win32"  ? "Microsoft YaHei"
              : "Noto Sans CJK SC";

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Arial", hAnsi: "Arial", eastAsia: cjkFont }, size: 24 }
      }
    }
  },
  sections: [{ children: [/* ... */] }]
});
```

### 英文文档最小字体配置

```javascript
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 24 } } }
  }
});
```

### 中文文档完整样式覆盖 (Heading 必含 outlineLevel)

```javascript
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Arial", hAnsi: "Arial", eastAsia: "Microsoft YaHei" }, size: 24 }
      }
    },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: { ascii: "Arial", hAnsi: "Arial", eastAsia: "Microsoft YaHei" } },
        paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0, keepNext: false, keepLines: false } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: { ascii: "Arial", hAnsi: "Arial", eastAsia: "Microsoft YaHei" } },
        paragraph: { spacing: { before: 180, after: 180 }, outlineLevel: 1, keepNext: false, keepLines: false } }
    ]
  },
  sections: [{
    children: [
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("标题 Title")] })
    ]
  }]
});
```

**Heading 三件套**：

1. `outlineLevel: 0/1/2` —— TOC / 导航窗格能识别
2. `keepNext: false` + `keepLines: false` —— 避免标题独占空白页
3. `quickFormat: true` —— 显示在 Word 的"样式"下拉

## 引号转义 (Special Characters)

**⚠️ CRITICAL: docx-js 用 JS 转义 `\"`，不用 XML 实体 `&#x201C;`**。XML 实体在 docx-js 中会显示为字面量。

| 需要写 | ✅ 正确（JS） | ❌ 错（XML 实体） |
| --- | --- | --- |
| 双引号 `"` | `\"` | `&#x201C;` `&#x201D;` `&#34;` |
| 单引号 `'` | `\'` | `&#x2018;` `&#x2019;` `&#39;` |
| `&` | `&`（无需转义） | `&amp;` |
| `<` | `<`（无需转义） | `&lt;` |

```javascript
// ✅ 正确
new TextRun("He said \"Hello\" and replied \"你好\"")

// ❌ 错 - XML 实体在 docx-js 中渲染为字面字符
new TextRun("&#x201C;Hello&#x201D;")  // 显示: &#x201C;Hello&#x201D;

// ❌ 错 - 不要转换为 \uXXXX
new TextRun("\u8fd9\u662f\u4e2d\u6587")  // 代码不可读
```

**记忆要点**：

- docx-js 内部处理 XML，你写 JS 字符串，不写 XML
- XML 实体**仅**用于"编辑既有文档"路径的 raw XML 编辑
- 不确定时用 `\"` 表达引号

## 列表 (Lists)

**禁止用 unicode bullet**。

```javascript
const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [{
    children: [
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("项目 A")] }),
      new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun("第一项")] })
    ]
  }]
});
```

**编号规则**：每个 `reference` 创建**独立**编号。相同 reference 续编（1,2,3 → 4,5,6）；不同 reference 重新开始。

## 表格 (Tables)

**CRITICAL 4 件套**：

1. 表级 `columnWidths` 与每 cell 的 `width` 数值**必须一致**
2. 行级 `cantSplit: true` —— 行不被分页打断
3. 底纹用 `ShadingType.CLEAR`，**禁止** SOLID（会渲染为纯黑）
4. cell 内边距 `margins: { top: 80, bottom: 80, left: 120, right: 120 }`

```javascript
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },     // 推荐百分比，自动适配
  columnWidths: [4680, 4680],                            // DXA（1440 = 1 inch）
  rows: [
    new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          borders,
          width: { size: 4680, type: WidthType.DXA },
          shading: { fill: "D5E8F0", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun("Cell")] })]
        })
      ]
    })
  ]
})
```

**DXA 宽度规则**：

- 表 `width` 必须等于 `columnWidths` 之和
- cell `width` 必须等于对应 `columnWidth`
- cell `margins` 是内边距，**不算入** cell 宽度
- 全宽表：US Letter 1" 边距 → 用 `12240 - 2880 = 9360 DXA`

## 图片 (Images)

**`type` 参数必传**。

```javascript
new Paragraph({
  children: [new ImageRun({
    type: "png",  // 必传：png / jpg / jpeg / gif / bmp / svg
    data: fs.readFileSync("image.png"),
    transformation: { width: 200, height: 150 },
    altText: { title: "Title", description: "Desc", name: "Name" }  // 三字段必填
  })]
})
```

## 分页 (Page Breaks)

**CRITICAL: `PageBreak` 必须在 `Paragraph` 内**。

```javascript
// ✅ 正确
new Paragraph({ children: [new PageBreak()] })

// 用于封面 / 大章节
new Paragraph({ pageBreakBefore: true, children: [new TextRun("New page")] })
```

**避免过度空白**：Word 默认 Heading 设 `keepNext: true`，会强制标题与下段同行，造成大片空白。**所有 heading MUST 设 `keepNext: false` + `keepLines: false`**（见上文样式覆盖示例）。

**禁止空 section**：每个空 section 渲染为空白首页。多 section 仅在需要不同页眉 / 页脚 / 分栏时使用。

## 头脚 (Headers / Footers)

```javascript
sections: [{
  properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
  headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun("Header")] })] }) },
  footers: { default: new Footer({ children: [new Paragraph({
    children: [new TextRun("Page "), new TextRun({ children: [PageNumber.CURRENT] })]
  })] }) },
  children: [/* 内容 */]
}]
```

## Critical Rules 总结 (Quick Recap)

| # | 规则 | 后果（违反时） |
| --- | --- | --- |
| 1 | 只用一个 section | 多余空白页 |
| 2 | 显式设页大小 | 默认 A4 与预期不符 |
| 3 | CJK 三槽字体 | 中文方框 |
| 4 | JS 转义 `\"` | 字面量显示 |
| 5 | `PageBreak` 必须在 `Paragraph` 内 | 非法 XML |
| 6 | `ImageRun` 必传 `type` | 渲染失败 |
| 7 | 表格双宽度（`columnWidths` + cell `width`） | 平台渲染差异 |
| 8 | `ShadingType.CLEAR`（非 SOLID） | 纯黑背景 |
| 9 | Heading `outlineLevel: 0/1/2` | TOC / 导航失效 |
| 10 | Heading `keepNext: false` | 大片空白 |
| 11 | 表格行 `cantSplit: true` | 行被分页 |
| 12 | 不生成 TOC 块 | 留用 `sanitize.py` 清理 |