---
name: eas-xlsx
description: "该技能应在 Agent 需要读取、创建、编辑或校验 Excel/电子表格文件（.xlsx / .xlsm / .csv / .tsv）时使用，涵盖：分析既有数据、按 XML 模板从零生成新文件、在不破坏原始格式的前提下修改既有文件、修复损坏的公式、以及按财务配色规范做静态 / 动态校验。触发短语包括 spreadsheet、Excel、.xlsx、.xlsm、.csv、.tsv、pivot table、financial model、formula、表格、电子表格。"
license: MIT
metadata:
  version: "1.1.0"
  category: document-processing
  mode: tool-wrapper+generator+reviewer+pipeline
  supported_os:
    - windows
    - macos
    - linux
  dependencies:
    - python3 (system)          # 全部 .py 脚本
    - pandas (pip)              # READ 路径数据分析
    - lxml (pip)                # XML 直编（unpack/edit/pack）
    - openpyxl (pip)            # 仅用于结构发现（**禁止**对既有 .xlsx round-trip）
    - soffice (optional)        # VALIDATE 动态重算
  sources:
    - ECMA-376 Office Open XML File Formats
    - Microsoft Open XML SDK documentation
---

# eas-xlsx

## 概述 (Overview)

`eas-xlsx` 是 EASBot 处理 Excel/电子表格文件的统一入口，覆盖**读取分析 → 创建 → 编辑 → 修复 → 校验**完整链路。它把零散、高门槛的 OOXML 操作封装为 `unpack → edit → pack` 的 Python 脚本工作流，使 Agent 不必直接面对 `<c>` / `<f>` / `<row>` / `<styleSheet>` 等底层节点即可生成合规 `.xlsx`。所有写操作固定走 XML 直接编辑，**禁止**对已有 `.xlsx` 走 openpyxl round-trip——后者会破坏 VBA / 透视表 / 迷你图等高级特性。

**模式组合（Skill Mode Composition）**：

- **Tool Wrapper**：把 OOXML 直编、pandas、LibreOffice 等异构工具封装成统一脚本接口。
- **Pipeline**：READ → CREATE → EDIT → FIX → VALIDATE 五段流水线，按用户意图分派。
- **Generator**：CREATE 路径产出"按公式驱动的成品 `.xlsx`"。
- **Reviewer**：EDIT / FIX 后必须经过 `formula_check.py` + `libreoffice_recalc.py` 双重校验。

## 何时使用 (When to Use)

**触发场景（适用）**：

- 用户要求"打开 / 读取 / 分析" `.xlsx` / `.csv` / `.tsv`，需要结构化展示数据。
- 用户要求"新建 / 制作"一个 Excel 文件（财务模型、预算表、数据报表、Pivot 模型等）。
- 用户要求"修改 / 填值 / 改公式"已有 `.xlsx`，且不希望破坏原始格式（字体、列宽、合并、样式等）。
- 用户要求"修公式 / 修复损坏单元格"，或对成品文件做一次校验。

**反场景（不适用）**：

- 仅需把 CSV / TSV 文本转成表格视图——直接 Markdown 表格即可。
- 用户只要"看一眼"某列数据——`pandas.read_excel` 即可，不必走本技能。
- 需求落到非 Excel 格式（PDF / Word / PPT）——交给 `eas-pdf` / `eas-docx` / `eas-pptx`。

## 快速参考 (Quick Reference)

| 项目 | 取值 / 说明 |
| --- | --- |
| 模式组合 | Tool Wrapper + Pipeline + Generator + Reviewer |
| 五大任务路由 | READ / CREATE / EDIT / FIX / VALIDATE |
| 默认写策略 | XML 直接编辑（unpack → edit → pack），**禁用** openpyxl round-trip |
| 公式优先 | 所有派生单元格 MUST 使用 `<f>...</f>`，禁止硬编码计算结果 |
| 核心脚本 | `scripts/xlsx_reader.py` / `scripts/xlsx_unpack.py` / `scripts/xlsx_pack.py` / `scripts/xlsx_add_column.py` / `scripts/xlsx_insert_row.py` / `scripts/xlsx_shift_rows.py` / `scripts/formula_check.py` / `scripts/libreoffice_recalc.py` |
| 最小模板 | `assets/xlsx_template/`（CREATE 路径起点） |
| 财务配色 | 输入蓝 `0000FF` / 公式黑 `000000` / 跨表绿 `00B050` |
| 脚本调用约定 | `python3 <skillPath>/scripts/xxx.py ...` |

## 任务路由 (Task Routing)

> **直接执行模式**：本技能不需要 spawn 子 Agent；按路由表选定路径后，由主 Agent 自己走完 XML 编辑流程，并**始终产出最终 `.xlsx`**。

| 任务 | 方法 | 必读参考 |
| --- | --- | --- |
| **READ** —— 分析既有数据 | `xlsx_reader.py` + pandas | [read-analyze.md](references/read-analyze.md) |
| **CREATE** —— 从零新建 | 拷贝最小模板 → 直接编辑 XML → `xlsx_pack.py` | [create.md](references/create.md) + [format.md](references/format.md) |
| **EDIT** —— 修改既有文件 | XML unpack → helper 脚本或 Edit 工具 → pack | [edit.md](references/edit.md)（如需样式追加 [format.md](references/format.md)） |
| **FIX** —— 修复损坏公式 | XML unpack → 改 `<f>` 节点 → pack | [fix.md](references/fix.md) |
| **VALIDATE** —— 公式校验 | `formula_check.py`（静态） + 可选 `libreoffice_recalc.py`（动态） | [validate.md](references/validate.md) |

## 路径 A：READ —— 分析数据 (Read & Analyze)

阅读 [read-analyze.md](references/read-analyze.md)。先用 `xlsx_reader.py` 做结构发现，再用 pandas 做自定义分析。**绝不修改源文件**。

- **小数位规范**：用户指定小数位（如"2 位小数"）时，**所有**数值列 MUST 使用 `f'{v:.2f}'`；禁止在应输出 `12875.00` 时输出 `12875`。
- **聚合规范**：求和 / 均值 / 计数必须**直接**在 DataFrame 列上计算（如 `df['Revenue'].sum()`），禁止在聚合前重新派生列值。

## 路径 B：CREATE —— 从零新建 (Create from Scratch)

阅读 [create.md](references/create.md) + [format.md](references/format.md)。

1. 拷贝 `assets/xlsx_template/` 到工作目录。
2. 用 Edit 工具直接改 XML（worksheets / sharedStrings / styles）。
3. 用 `xlsx_pack.py` 打包。
4. **每个派生值 MUST 是 Excel 公式 `<f>SUM(B2:B9)</f>`，禁止硬编码数字**。
5. 字体颜色按 `format.md` 的财务配色规范执行。

## 路径 C：EDIT —— 直接编辑 XML (Edit Existing File)

阅读 [edit.md](references/edit.md)。

**[MUST] 编辑完整性 4 条红线**：

1. **禁止为 EDIT 任务 `Workbook()` 新建**。永远加载原文件 → unpack → edit → pack。
2. 输出 MUST 包含与输入**完全一致**的工作表（同名 + 同数据）。
3. 只改任务指定的单元格，其余一律保留。
4. **保存后 MUST 验证**：用 `xlsx_reader.py` 或 pandas 重新打开输出文件，确认原 sheet 名 + 原数据样本都在；验证失败即写错文件，先修再交付。

**禁止对既有 `.xlsx` 走 openpyxl round-trip**（会破坏 VBA / 透视表 / 迷你图）。统一走 unpack → helper → repack。

**典型工作流示例**：

```bash
# 给 B3 写一个跨表 SUM 公式
python3 <skillPath>/scripts/xlsx_unpack.py input.xlsx /tmp/xlsx_work/
# 通过 xl/workbook.xml → xl/_rels/workbook.xml.rels 找到目标 sheet
# 用 Edit 工具在目标 <c> 节点内添加 <f>：
#   <c r="B3"><f>SUM('Sales Data'!D2:D13)</f><v></v></c>
python3 <skillPath>/scripts/xlsx_pack.py /tmp/xlsx_work/ output.xlsx
```

```bash
# 新增一列 G（公式 / 数字格式 / 样式自动从相邻列复制）
python3 <skillPath>/scripts/xlsx_unpack.py input.xlsx /tmp/xlsx_work/
python3 <skillPath>/scripts/xlsx_add_column.py /tmp/xlsx_work/ --col G \
  --sheet "Sheet1" --header "% of Total" \
  --formula '=F{row}/$F$10' --formula-rows 2:9 \
  --total-row 10 --total-formula '=SUM(G2:G9)' --numfmt '0.0%' \
  --border-row 10 --border-style medium
python3 <skillPath>/scripts/xlsx_pack.py /tmp/xlsx_work/ output.xlsx
```

`--border-row` 会对**整行所有单元格**应用上边框（不只是新列）；会计风格合计线用之。

```bash
# 插入一行（自动下移、修复 SUM 公式、修正循环引用）
python3 <skillPath>/scripts/xlsx_unpack.py input.xlsx /tmp/xlsx_work/
# [MUST] 先按文本标签定位真实行号，**不要**直接用 prompt 给的行号
# grep -n "Utilities" /tmp/xlsx_work/xl/worksheets/sheet*.xml
python3 <skillPath>/scripts/xlsx_insert_row.py /tmp/xlsx_work/ --at 5 \
  --sheet "Budget FY2025" --text A=Utilities \
  --values B=3000 C=3000 D=3500 E=3500 \
  --formula 'F=SUM(B{row}:E{row})' --copy-style-from 4
python3 <skillPath>/scripts/xlsx_pack.py /tmp/xlsx_work/ output.xlsx
```

**行号查找规则**：当任务说"在 row N (Label) 之后"，先在 worksheet XML 中 grep "Label" 找到真实行号；用"实际行号 + 1"作 `--at`。**禁止**单独调用 `xlsx_shift_rows.py`，`xlsx_insert_row.py` 内部已调用。

## 路径 D：FIX —— 修复损坏公式 (Repair Broken Formulas)

阅读 [fix.md](references/fix.md)。本质仍是 EDIT：unpack → 修 `<f>` 节点 → pack。所有原始 sheet 与数据 MUST 保留。

## 路径 E：VALIDATE —— 公式校验 (Validate Formulas)

阅读 [validate.md](references/validate.md)。先跑 `formula_check.py`（静态、可在无 LibreOffice 环境运行）；环境允许时再跑 `libreoffice_recalc.py`（动态重算）。

## 财务配色规范 (Financial Color Standard)

| 单元格角色 | 字体色 | Hex |
| --- | --- | --- |
| 硬编码输入 / 假设 | 蓝 | `0000FF` |
| 公式 / 计算结果 | 黑 | `000000` |
| 跨表引用公式 | 绿 | `00B050` |

## 核心红线 (Key Rules)

1. **公式优先 (Formula-First)**：每个计算单元格 MUST 是 Excel 公式，**禁止**硬编码数字。
2. **CREATE → XML 模板**：拷贝最小模板 → 直接改 XML → `xlsx_pack.py`。
3. **EDIT → XML**：禁止 openpyxl round-trip；统一 unpack / edit / pack。
4. **始终产出文件**：交付给用户的最终 `.xlsx` 是第一优先级。
5. **交付前校验 (Reviewer Gate)**：`formula_check.py` 退出码 0 才算安全。

## 工具脚本速查 (Utility Scripts)

```bash
python3 <skillPath>/scripts/xlsx_reader.py input.xlsx                 # 结构发现
python3 <skillPath>/scripts/formula_check.py file.xlsx --json         # 公式校验（JSON）
python3 <skillPath>/scripts/formula_check.py file.xlsx --report       # 公式校验（报告）
python3 <skillPath>/scripts/xlsx_unpack.py in.xlsx /tmp/work/         # 解包为 XML 树
python3 <skillPath>/scripts/xlsx_pack.py /tmp/work/ out.xlsx          # 重新打包
python3 <skillPath>/scripts/xlsx_shift_rows.py /tmp/work/ insert 5 1  # 行位移辅助
python3 <skillPath>/scripts/xlsx_add_column.py /tmp/work/ --col G ...  # 新增一列
python3 <skillPath>/scripts/xlsx_insert_row.py /tmp/work/ --at 6 ...  # 插入一行
python3 <skillPath>/scripts/libreoffice_recalc.py file.xlsx           # 动态重算（需 LibreOffice）
```

## 进阶参考 (Advanced References)

- [create.md](references/create.md) —— CREATE 路径的 XML 模板起步细节
- [edit.md](references/edit.md) —— EDIT 路径的 XML 操作详细步骤与边界条件
- [fix.md](references/fix.md) —— FIX 路径的常见公式损坏模式
- [format.md](references/format.md) —— 财务配色 + 数字格式 + 边框的 OpenXML 写法
- [read-analyze.md](references/read-analyze.md) —— READ 路径的 pandas 协同
- [validate.md](references/validate.md) —— VALIDATE 路径的静态 + 动态校验流程
- [ooxml-cheatsheet.md](references/ooxml-cheatsheet.md) —— OOXML 节点速查（仅按需查阅）

## 决策沉淀 (Decision Sediment)

- **走 Python 脚本而非 TypeScript**：与项目 `package.json` 不引入运行依赖的策略一致（§12.7 依赖白名单）；脚本仅依赖 Python 标准库，部署成本最低。
- **写入路径固定 unpack/edit/pack**：openpyxl round-trip 会损坏 VBA / PivotTable / Sparkline 等高级特性，故强制 XML 直编。
- **模板用最小 OOXML 骨架**：避免 LibreOffice / Excel 版本兼容差异；体积小、便于审查。
- **模式组合固定 Tool Wrapper+Pipeline+Generator+Reviewer**：本技能是"读改写验"全链路，多模式叠加是必然；统一结构后与 eas-docx / eas-pptx / eas-pdf 对齐，便于 Agent 跨技能切换。