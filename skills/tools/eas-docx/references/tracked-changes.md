# 跟踪修订 (Tracked Changes)

> **路径 B 子话题**：跟踪修订（Track Changes / Redlining）的 XML 模式 + 接受 / 拒绝 / 嵌套规则。

## 修订元素 (Track Change Elements)

| 元素 | 含义 |
| --- | --- |
| `<w:ins>` | 标记为"插入" |
| `<w:del>` | 标记为"删除" |
| `<w:ins>` / `<w:del>` 内的 run | 必须用 `<w:t>` / `<w:delText>` 对应 |

**插入**：

```xml
<w:ins w:id="1" w:author="AI Assistant" w:date="2025-01-01T00:00:00Z">
  <w:r><w:t>inserted text</w:t></w:r>
</w:ins>
```

**删除**：

```xml
<w:del w:id="2" w:author="AI Assistant" w:date="2025-01-01T00:00:00Z">
  <w:r><w:delText>deleted text</w:delText></w:r>
</w:del>
```

**`<w:del>` 内**：用 `<w:delText>` 代替 `<w:t>`；用 `<w:delInstrText>` 代替 `<w:instrText>`。

## 最小改动 (Minimal Edits)

**只标记变化的部分**。

```xml
<!-- 把 "30 days" 改成 "60 days" -->
<w:r><w:t>The term is </w:t></w:r>
<w:del w:id="1" w:author="AI Assistant" w:date="2025-01-01T00:00:00Z">
  <w:r><w:delText>30</w:delText></w:r>
</w:del>
<w:ins w:id="2" w:author="AI Assistant" w:date="2025-01-01T00:00:00Z">
  <w:r><w:t>60</w:t></w:r>
</w:ins>
<w:r><w:t> days.</w:t></w:r>
```

## 删除整段 (Deleting Entire Paragraphs)

当删除**整段 / 整个列表项**的内容时，还需在 `<w:pPr><w:rPr>` 内加 `<w:del/>` 标记段落符已删除。否则接受修订后会留空段。

```xml
<w:p>
  <w:pPr>
    <w:numPr>...</w:numPr>  <!-- 列表编号（如有） -->
    <w:rPr>
      <w:del w:id="1" w:author="AI Assistant" w:date="2025-01-01T00:00:00Z"/>
    </w:rPr>
  </w:pPr>
  <w:del w:id="2" w:author="AI Assistant" w:date="2025-01-01T00:00:00Z">
    <w:r><w:delText>整段删除的内容...</w:delText></w:r>
  </w:del>
</w:p>
```

无 `<w:pPr><w:rPr>` 内的 `<w:del/>`，接受后会留空段 / 列表项。

## 跨作者交互 (Cross-Author Interactions)

### 拒绝他人的插入 (Reject Another's Insertion)

嵌套 `<w:del>` 在他人的 `<w:ins>` 内：

```xml
<w:ins w:author="Jane" w:id="5">
  <w:del w:author="AI Assistant" w:id="10">
    <w:r><w:delText>她插入的文字</w:delText></w:r>
  </w:del>
</w:ins>
```

### 恢复他人的删除 (Restore Another's Deletion)

**不要**改他人的 `<w:del>`，**在其后加一个 `<w:ins>`**：

```xml
<w:del w:author="Jane" w:id="5">
  <w:r><w:delText>被删的文字</w:delText></w:r>
</w:del>
<w:ins w:author="AI Assistant" w:id="10">
  <w:r><w:t>被删的文字</w:t></w:r>
</w:ins>
```

## 接受修订 (Accept Changes)

**批处理接受所有修订**：

```bash
python3 <skillPath>/scripts/accept_changes.py input.docx output.docx
```

**要求**：LibreOffice 已安装。脚本调用 LibreOffice 的 UNO 宏 `AcceptAllTrackedChanges`。

**手工接受（少量）**：在 Word / LibreOffice UI 里选 `Review → Accept All Changes`。

## 关键陷阱 (Critical Pitfalls)

1. **`<w:del>` 内用 `<w:delText>`**，不用 `<w:t>`（否则显示为空）。
2. **删除整段时 MUST 加 `<w:pPr><w:rPr><w:del/>`** —— 否则接受后留空段。
3. **不要在 run 内部塞 `<w:ins>` / `<w:del>` 标签** —— 标签是 run 的**兄弟元素**。
4. **保留原 `<w:rPr>`** —— 复制原 run 的 `<w:rPr>` 到修订 run，保持粗体 / 字号等格式。
5. **跨作者恢复**：不要修改他人的 `<w:del>`，**追加** `<w:ins>`。
6. **`pack.py` 会简化跟踪修订**（合并相邻同作者的 `<w:ins>` / `<w:del>`），便于人工审查。