# 决策沉淀：4 个 office tools 技能的设计选择归档（2026-08-08）

> **本文件按 §11 / §14.7 落档决策文档**。原内容位于 4 个 SKILL.md 末尾「## 决策沉淀 (Decision Sediment)」节，因 §13.5 注释禁止 builtin/tools 通用约定使用该节标题反向引用评审报告，故迁出至本文件独立归档。
>
> **来源**：原 [eas-docx/SKILL.md](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-docx/SKILL.md) / [eas-pdf/SKILL.md](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-pdf/SKILL.md) / [eas-pptx/SKILL.md](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-pptx/SKILL.md) / [eas-xlsx/SKILL.md](file:///e:/work/apps/eas/agent-skills/skills/tools/eas-xlsx/SKILL.md) 末尾「## 决策沉淀」节。
>
> **触发评审**：[0007-review-all-skills-round1.md](file:///e:/work/apps/eas/agent-skills/docs/decisions/0007-review-all-skills-round1.md) C2 项 P1。

---

## 1. eas-docx 设计选择

- **以 docx-js + Python 助手脚本为主，弃用 .NET OpenXML SDK 重型栈**：原 .NET 工程（EasbotAIDocx）虽然功能强但部署成本高（需 .NET 8 SDK + NuGet 还原 + 编译），不利于 Agent 在临时环境快速启用。docx-js + Python 助手脚本栈零编译、即装即用，覆盖 90% 常规场景。
- **CREATE 走声明式 JS、EDIT 走 XML unpack/edit/pack**：两种工作流覆盖互补场景。CREATE 用 docx-js 写一遍 JS 即可生成结构化文档；EDIT 在保版式的前提下用 Edit 工具直接改 XML。
- **`sanitize.py` 作为 CREATE 路径的 Reviewer 兜底**：docx-js 偶发生成文本型 TOC 块或多余空白页，`sanitize.py` 自动检测并清理。

## 2. eas-pdf 设计选择

- **采用 token-based 设计系统**：颜色 / 字体 / 间距从文档类型派生，使封面与正文风格天然统一，避免逐页重复设计决策。
- **Playwright 渲染封面 + reportlab 渲染正文 + pypdf 合并**：三件套各取所长——封面用浏览器级 SVG/CSS 排版，正文用 Python 数据流，合并稳定可靠。
- **三类 doc type 而非单一类型**：report / proposal / resume / portfolio 等明确视觉识别度，让"类型"本身成为可复用的设计资产。

## 3. eas-pptx 设计选择

- **以 PptxGenJS 为主、XML 直编为辅**：CREATE 走 JS 模板生成（声明式 + 易排版），EDIT 走 XML unpack/edit/pack（保留全部原始格式）。
- **Theme Object 固定 5 keys**：避免 Agent 自创命名（如 `background` / `text` / `darkest`），让所有 slide 共享同一调色板契约。
- **18 配色 × 4 风格 × 5 页面类型 × 3 layout**：三维组合设计资产，Agent 按场景取而非从零想。
- **Layout QA + Content QA 双层 Reviewer**：先物理（不溢出 / 不空白）+ 后语义（内容不缺失 / 无占位符）。
- **模式组合固定 Tool Wrapper+Pipeline+Generator+Reviewer**：本技能是"读改写验"全链路，多模式叠加是必然；统一结构后与 eas-docx / eas-pdf / eas-xlsx 对齐，便于 Agent 跨技能切换。

## 4. eas-xlsx 设计选择

- **走 Python 脚本而非 TypeScript**：与项目 `package.json` 不引入运行依赖的策略一致（§12.7 依赖白名单）；脚本仅依赖 Python 标准库，部署成本最低。
- **写入路径固定 unpack/edit/pack**：openpyxl round-trip 会损坏 VBA / PivotTable / Sparkline 等高级特性，故强制 XML 直编。
- **模板用最小 OOXML 骨架**：避免 LibreOffice / Excel 版本兼容差异；体积小、便于审查。
- **模式组合固定 Tool Wrapper+Pipeline+Generator+Reviewer**：本技能是"读改写验"全链路，多模式叠加是必然；统一结构后与 eas-docx / eas-pptx / eas-pdf 对齐，便于 Agent 跨技能切换。

---

**本文件与 SKILL.md 的关系**：4 个 SKILL.md 末尾不再含「## 决策沉淀」节；如有读者想了解设计取舍，本文件作为权威归档。
