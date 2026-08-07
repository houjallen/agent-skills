# 渐进式披露模式 (Progressive Disclosure Patterns)

本文件提供技能 SKILL.md 内容的组织模式示例，对应 [skill-spec.md §8.6 Pattern Correspondence](skill-spec.md) 三种常用模式。按需阅读。

## 何时阅读 (When to Read)

- 设计或重构技能时，需要决定"哪些内容放 SKILL.md / 哪些放 references/"
- 想了解"领域特定组织"如何避免加载无关上下文
- 需要为多框架 / 多变体技能设计 references 结构

## 模式 1：带参考的高级指南 (Advanced Guide with References)

适用场景：技能有"快速开始 + 高级功能"分层。

```markdown
# PDF处理

## 快速开始 (Quick Start)

使用pdfplumber提取文本：
[代码示例]

## 高级功能 (Advanced Features)

- **表单填写**: 请参阅[FORMS.md](reference/FORMS.md)获取完整指南
- **API参考**: 请参阅[REFERENCE.md](reference/REFERENCE.md)获取所有方法
- **示例**: 请参阅[EXAMPLES.md](reference/EXAMPLES.md)获取常见模式
```

Agent 仅在需要时加载 `FORMS.md` / `REFERENCE.md` / `EXAMPLES.md`。

## 模式 2：领域特定组织 (Domain-Specific Organization)

适用场景：技能覆盖多个独立领域，按领域拆分可避免加载无关上下文。

```
bigquery-skill/
├── SKILL.md (概述和导航)
└── reference/
    ├── finance.md (收入、计费指标)
    ├── sales.md (机会、管道)
    ├── product.md (API使用、功能)
    └── marketing.md (活动、归测)
```

当用户询问销售指标时，Agent 仅读取 `sales.md`。

### 变体：按框架 / 变体组织

适用场景：技能支持多个互斥的部署目标 / 编程语言 / 服务商。

```
cloud-deploy/
├── SKILL.md (工作流程 + 提供商选择)
└── references/
    ├── aws.md (AWS部署模式)
    ├── gcp.md (GCP部署模式)
    └── azure.md (Azure部署模式)
```

当用户选择 AWS 时，Agent 仅读取 `aws.md`。

## 模式 3：条件细节 (Conditional Details)

适用场景：技能默认路径简单，但部分用户场景需要深入细节。

```markdown
# DOCX处理

## 创建文档 (Create Document)

对新文档使用docx-js。请参阅[DOCX-JS.md](reference/DOCX-JS.md)。

## 编辑文档 (Edit Document)

对于简单编辑，直接修改XML。

**对于跟踪更改**: 请参阅[REDLINING.md](reference/REDLINING.md)
**对于OOXML详细信息**: 请参阅[OOXML.md](reference/OOXML.md)
```

Agent 在用户需要这些功能时才读取子文件。

## 重要指南 (Important Guidelines)

- **避免深度嵌套引用** - 保持引用从 SKILL.md 一层深；所有 references 必须直接从 SKILL.md 链接，不允许 `references/foo.md` 中再引用 `references/bar.md`（deep nesting 会被快速预览跳过）。
- **结构化较长的参考文件** - 超过 100 行的 references 在顶部包含目录，让 Agent 预览时可看到完整范围。
- **避免重复** - 信息在 SKILL.md 或 references 中只出现一次；选择 references 是为了"按需加载"或"避免 SKILL.md 超过 500 行"。

## 与 SKILL.md 的关系 (Relationship)

| SKILL.md 应保留 | references 应下沉 |
|---|---|
| 三级加载概念定义 | 各 Pattern 详细示例 |
| 设计原则要点（核心约束） | 多领域 / 多框架的拆分案例 |
| 重要指南（硬约束清单） | 单 Pattern 的完整 markdown 模板 |

## 关联引用 (Related)

- [skill-spec.md §8.6 Pattern Correspondence](skill-spec.md) — Pattern ↔ 五种模式映射
- [SKILL.md §渐进式披露设计原则](../SKILL.md) — 核心约束与设计原则