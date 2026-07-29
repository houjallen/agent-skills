# 注释 (Comments)

> **路径 B 子话题**：给 .docx 加评论（comments）的 4 文件系统 + 范围标记 + 回复支持。

## 4 文件系统 (Four-File Comment System)

docx 评论由 4 个 XML 文件协同：

| 文件 | 作用 |
| --- | --- |
| `word/comments.xml` | 评论主体（id + author + date + text） |
| `word/commentsExtended.xml` | 扩展元数据（done 标记 / parentId） |
| `word/commentsIds.xml` | 持久化 ID（durableId，跨会话稳定） |
| `word/commentsExtensible.xml` | 扩展本地化（可选） |

外加 `word/_rels/document.xml.rels` 加 4 个 relationship + `[Content_Types].xml` 加 4 个 Content Type。

**`comment.py` 自动处理上述 4 文件 + 关系 + Content Types**：

```bash
python3 <skillPath>/scripts/comment.py unpacked/ 0 "Comment text with &amp; and &#x2019;"
python3 <skillPath>/scripts/comment.py unpacked/ 1 "Reply text" --parent 0
python3 <skillPath>/scripts/comment.py unpacked/ 0 "Text" --author "Custom Author"
```

**评论文本必须是预转义的 XML**（`&amp;` 代替 `&`，`&#x2019;` 代替 smart quotes）。这是因为脚本直接写入 XML，不做二次转义。

## 范围标记 (Comment Range Markers)

`comment.py` 只写 boilerplate，**范围标记必须手工加到 `document.xml`**。

**CRITICAL: `<w:commentRangeStart>` 和 `<w:commentRangeEnd>` 是 `<w:p>` 的直接子节点**，不是 `<w:r>` 的子节点。

```xml
<!-- ✅ 正确 - 标记是 w:p 的直接子节点 -->
<w:p>
  <w:commentRangeStart w:id="0"/>
  <w:r><w:t>被评论的内容</w:t></w:r>
  <w:commentRangeEnd w:id="0"/>
  <w:r>
    <w:rPr><w:rStyle w:val="CommentReference"/></w:rPr>
    <w:commentReference w:id="0"/>
  </w:r>
</w:p>
```

```xml
<!-- ❌ 错 - 标记不能放在 w:r 内 -->
<w:r>
  <w:commentRangeStart w:id="0"/>
  <w:t>被评论的内容</w:t>
  <w:commentRangeEnd w:id="0"/>
</w:r>
```

## 回复嵌套 (Reply Nesting)

回复的 `<w:commentRangeStart/End>` 嵌套在父评论的范围内：

```xml
<!-- 评论 0 含回复 1 -->
<w:commentRangeStart w:id="0"/>
  <w:commentRangeStart w:id="1"/>
  <w:r><w:t>被评论的正文</w:t></w:r>
  <w:commentRangeEnd w:id="1"/>
<w:commentRangeEnd w:id="0"/>

<!-- 两个 commentReference 都要 -->
<w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="0"/></w:r>
<w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="1"/></w:r>
```

## 完整工作流 (End-to-End Workflow)

```bash
# 1. 解包
python3 <skillPath>/scripts/unpack.py document.docx unpacked/

# 2. 写评论 boilerplate
python3 <skillPath>/scripts/comment.py unpacked/ 0 "主评论：这段需要修订"
python3 <skillPath>/scripts/comment.py unpacked/ 1 "回复：已改好" --parent 0

# 3. Edit 工具在 document.xml 加范围标记（见上文 XML 模式）

# 4. 打包（含 schema 校验）
python3 <skillPath>/scripts/pack.py unpacked/ output.docx --original document.docx
```

## 与跟踪修订结合 (Combining with Tracked Changes)

评论范围可以与跟踪修订共存。常见用法：评论"这段删除不合理"，同时用 `<w:ins>` 反驳他人的 `<w:del>`：

```xml
<w:commentRangeStart w:id="0"/>
<w:del w:author="Jane" w:id="5">
  <w:r><w:delText>被删的文字</w:delText></w:r>
</w:del>
<w:ins w:author="AI Assistant" w:id="10">
  <w:r><w:t>被删的文字</w:t></w:r>
</w:ins>
<w:commentRangeEnd w:id="0"/>
<w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="0"/></w:r>
```

## 关键陷阱 (Critical Pitfalls)

1. **`<w:commentRangeStart/End>` 必须是 `<w:p>` 的直接子节点** —— 不可放 `<w:r>` 内。
2. **评论文本必须预转义 XML** —— `&amp;` / `&#x2019;` 等。
3. **回复的标记嵌套在父评论范围内**，且引用两者的 `<w:commentReference>` 都要写。
4. **作者名默认 `"AI Assistant"`**，除非用户明确指定。