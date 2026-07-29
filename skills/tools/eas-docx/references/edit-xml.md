# 编辑既有 .docx (Edit Existing Documents via XML)

> **路径 B 的完整工作流**。本路径在保留原始版式 / 字体 / 段落样式的前提下修改文档内容、添加注释 / 跟踪修订 / 图片。

## 三步流程 (Three-Step Workflow)

```bash
# Step 1: 解包（合并相邻 runs + smart quotes 转 XML 实体）
python3 <skillPath>/scripts/unpack.py document.docx unpacked/

# Step 2: Edit 工具改 unpacked/word/document.xml（也可用 search_replace）
# 推荐：用 Edit / search_replace 工具直接改 XML
# 禁止：写 Python 脚本批量改——Edit 工具能看到修改 diff

# Step 3: 打包（含 schema 校验 + 自动修复）
python3 <skillPath>/scripts/pack.py unpacked/ output.docx --original document.docx
```

**Author 名**：跟踪修订与评论用 `"AI Assistant"`，除非用户明确指定别的。

**不要用脚本批量改 XML**：Edit 工具强制显式地"改什么"，diff 清晰，便于审查与回退。

## Step 1: unpack.py

```bash
python3 <skillPath>/scripts/unpack.py document.docx unpacked/
# 选填：
#   --merge-runs false     跳过合并相邻 runs
#   --no-simplify-redlines 跳过简化跟踪修订
```

**做了什么**：

- ZIP 解包到 `unpacked/`
- `defusedxml.minidom` 美化 XML（便于 Edit 工具读）
- 合并相邻 `<w:r>`（同一 `<w:rPr>`）
- smart quotes 转 XML 实体（`&#x201C;` 等），让 Edit 工具不破坏它们
- 简化跟踪修订（合并相邻 `<w:ins>` / `<w:del>` 同作者）

**unpack 目录结构**：

```
unpacked/
├── [Content_Types].xml
├── _rels/.rels
├── word/
│   ├── document.xml
│   ├── styles.xml
│   ├── numbering.xml
│   ├── media/                 # 图片资源
│   ├── _rels/document.xml.rels
│   ├── comments.xml           # 仅含注释的文档存在
│   └── ...
└── docProps/
```

## Step 2: Edit XML

**用 Edit 工具 / search_replace 直接改 `unpacked/word/document.xml`**。

**Smart quotes**：在 Edit 工具中贴入的 smart quotes 会被转回 ASCII。**当添加新文本含引号时，用 XML 实体**：

```xml
<w:t>Here&#x2019;s a quote: &#x201C;Hello&#x201D;</w:t>
```

| Entity | 字符 |
| --- | --- |
| `&#x2018;` | ‘ (left single) |
| `&#x2019;` | ’ (right single / apostrophe) |
| `&#x201C;` | “ (left double) |
| `&#x201D;` | ” (right double) |

**XML Schema Compliance**：

| 父节点 | 元素顺序（属性优先） |
| --- | --- |
| `<w:pPr>` | `pStyle` → `numPr` → `spacing` → `ind` → `jc` → `rPr`（最末） |
| `<w:p>` | `pPr` → runs |
| `<w:r>` | `rPr` → `t` / `br` / `tab` |
| `<w:tbl>` | `tblPr` → `tblGrid` → `tr` |
| `<w:tr>` | `trPr` → `tc` |
| `<w:tc>` | `tcPr` → `p`（至少 1 个 `<w:p/>`） |
| `<w:body>` | 块内容 → `sectPr`（**最末子节点**） |

**空白处理**：`<w:t>` 含首尾空白 MUST 加 `xml:space="preserve"`。

**RSID**：8 位 hex（如 `00AB1234`）。

## Step 3: pack.py

```bash
python3 <skillPath>/scripts/pack.py unpacked/ output.docx --original document.docx
# 选填：
#   --validate false       跳过 schema 校验（不推荐）
```

**会自动修复**：

- `durableId` ≥ `0x7FFFFFFF` → 重新生成合法 ID
- `<w:t>` 缺 `xml:space="preserve"` → 自动补

**不会自动修复**：

- 畸形 XML
- 无效元素嵌套
- 缺失关系
- schema 违规（会报错并退出非零）

**XML 解析器**：内部用 `defusedxml.minidom`，避免命名空间损坏（**禁止**用 `xml.etree.ElementTree`）。

## 加注释 (Adding Comments)

```bash
# Step 1: 写注释文本到 comments.xml 等 4 个文件
python3 <skillPath>/scripts/comment.py unpacked/ 0 "Comment text with &amp; and &#x2019;"
python3 <skillPath>/scripts/comment.py unpacked/ 1 "Reply text" --parent 0
python3 <skillPath>/scripts/comment.py unpacked/ 0 "Text" --author "Custom Author"

# Step 2: 在 document.xml 加范围标记（见 comments.md）
```

`comment.py` 写入 4 个 boilerplate 文件：

- `word/comments.xml`
- `word/commentsExtended.xml`
- `word/commentsIds.xml`
- `word/commentsExtensible.xml`

并自动更新 `[Content_Types].xml` 与 `word/_rels/document.xml.rels`。

## 加图片 (Adding Images)

**4 处必须同步**：

1. **文件放 `word/media/`**：
   ```bash
   cp image.png unpacked/word/media/image1.png
   ```

2. **加关系到 `word/_rels/document.xml.rels`**：
   ```xml
   <Relationship Id="rId5" Type=".../image" Target="media/image1.png"/>
   ```

3. **加 Content Type 到 `[Content_Types].xml`**：
   ```xml
   <Default Extension="png" ContentType="image/png"/>
   ```

4. **在 `document.xml` 内引用**：
   ```xml
   <w:drawing>
     <wp:inline>
       <wp:extent cx="914400" cy="914400"/>  <!-- EMU: 914400 = 1 inch -->
       <a:graphic>
         <a:graphicData uri=".../picture">
           <pic:pic>
             <pic:blipFill><a:blip r:embed="rId5"/></pic:blipFill>
           </pic:pic>
         </a:graphicData>
       </a:graphic>
     </wp:inline>
   </w:drawing>
   ```

## 常见陷阱 (Common Pitfalls)

**替换整个 `<w:r>` 元素**：添加跟踪修订时，把整个 `<w:r>...</w:r>` 块替换为 `<w:del>...<w:ins>` 作为兄弟元素。**不要**把修订标签塞进 run 内部。

**保留 `<w:rPr>` 格式**：把原 run 的 `<w:rPr>` 块复制到修订 run 里，维持粗体 / 字号等格式。

**删除整段时**：除了把段内文本放进 `<w:del>`，还需在 `<w:pPr><w:rPr>` 内加 `<w:del/>` 标记段落符已删。详见 [tracked-changes.md](tracked-changes.md)。

## 校验流水线 (Reviewer Pipeline)

```bash
# EDIT 完成后 MUST 跑 pack.py（含 schema 校验）
python3 <skillPath>/scripts/pack.py unpacked/ output.docx --original in.docx

# 选填：若需"接受所有修订得干净版"
python3 <skillPath>/scripts/accept_changes.py output.docx clean.docx
```