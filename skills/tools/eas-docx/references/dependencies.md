# 依赖 (Dependencies)

> 本技能栈全部依赖清单。

## 必需 (Required)

### Node.js + docx-js（路径 A 用）

```bash
npm install docx
```

`docx-js` 是 JS 库，无运行时依赖。

### Python 3.8+ + defusedxml（路径 B/C 用）

```bash
pip install defusedxml
```

`defusedxml` 防 XML 攻击（解析 OOXML 时强制要求）。

## 可选 (Optional)

### LibreOffice（路径 C + 格式转换）

`scripts/accept_changes.py` 与 `.doc → .docx` 转换都需要 LibreOffice。

**安装**：

- macOS：`brew install --cask libreoffice`
- Windows：从 [libreoffice.org](https://www.libreoffice.org/) 下载安装
- Linux：`apt install libreoffice`（Debian/Ubuntu）/ `dnf install libreoffice`（Fedora）

`soffice` 命令行必须在 `PATH` 中。

### pandoc（文本抽取）

```bash
brew install pandoc         # macOS
apt install pandoc          # Debian/Ubuntu
```

文本抽取：`pandoc --track-changes=all document.docx -o output.md`

### Poppler（截图）

```bash
brew install poppler        # macOS
apt install poppler-utils   # Debian/Ubuntu
```

截图：`pdftoppm -jpeg -r 150 document.pdf page`

## 依赖矩阵 (Dependency Matrix)

| 路径 | Node + docx | Python + defusedxml | LibreOffice | pandoc | Poppler |
| --- | --- | --- | --- | --- | --- |
| **A：CREATE** | ✓ 必装 | ✓ 必装（sanitize.py） | — | — | — |
| **B：EDIT** | — | ✓ 必装 | — | — | — |
| **C：ACCEPT-CHANGES** | — | ✓ 必装 | ✓ 必装 | — | — |
| 文本抽取 | — | ✓（用 unpack.py 替代） | — | 可选 | — |
| 格式转换（.doc → .docx） | — | — | ✓ 必装 | — | — |
| 预览截图（.docx → 图片） | — | — | ✓ 必装 | — | ✓ 必装 |

## 项目级依赖白名单 (§12.7)

注意：项目级 `package.json` 严格限制第三方依赖（§12.7 白名单：仅 `js-yaml` / `jszip` / `@easbot/agent`）。

`docx-js` / `defusedxml` / `pandoc` / `LibreOffice` / `Poppler` **不在白名单**，因此**不入仓**——由调用方环境自行安装。

**在 SKILL.md 内的写法**：脚本示例只展示调用方式，不引入 `package.json` 依赖。