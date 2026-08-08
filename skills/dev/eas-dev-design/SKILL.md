---
name: eas-dev-design
description: 该技能应在用户要求基于 spec 设计模块架构（"设计架构" / "deep modules" / "怎么组织" / "接口怎么定" / "模块边界"）时使用。基于 `eas-dev-spec` 产出，按 John Ousterhout "Deep Modules" 哲学 + 4 个核心问题，产出包含模块图 / 接口契约 / 数据流 / 测试策略的 `design.md`。
mode: Pattern
composition: standalone
behavior:
  thinking_framework:
    name: "Deep Modules (John Ousterhout)"
    core_questions:
      - id: q1-shared-behavior
        question: "哪些行为共享？"
        purpose: "识别同质行为；共享行为可下沉到同一模块"
      - id: q2-independent-change
        question: "哪些行为可独立变化？"
        purpose: "识别变化轴；可独立变化的行为 MUST 分到不同模块"
      - id: q3-seam-location
        question: "接缝在哪？"
        purpose: "寻找最小接口面积；接缝 = 抽象边界"
      - id: q4-test-interface
        question: "怎么测试接口？"
        purpose: "通过接口可独立测试 = 抽象成功的标志"
metadata:
  category: dev
  version: 1.0.0
  author: EASBot
  compatibility: claude-code / codex / gemini-cli / 其他支持 Skill 协议的 Agent
  tags:
    - eas-dev
    - pattern
    - deep-modules
    - architecture
    - first-principles
---

# eas-dev-design - 架构设计 (Architecture Design)

> **分类位置**：`skills/dev/`（独立 dev 分类，**不**进 `eas-skill-using` 索引）
> **必填字段**：`name` / `description` / `mode=Pattern` / `composition=standalone` / `behavior.thinking_framework.core_questions` (4 questions) / `metadata.category=dev`
> **对应规划任务**：T-003 / 0014 决策

---

## 概述 (Overview)

`eas-dev-design` 在 spec 基础上设计模块边界、接口契约、数据流、测试策略。Pattern 模式：基于 John Ousterhout "Deep Modules" 哲学（多行为 + 小接口 + 干净接缝），通过 4 个核心问题驱动设计产出。

**不做什么**：

- ❌ 不写 spec（那是 `eas-dev-spec`）
- ❌ 不拆任务（那是 `eas-dev-plan`）
- ❌ 不选具体技术栈（设计聚焦"做什么"而非"用什么"；具体技术由 `eas-dev-implement` 决定）
- ❌ 不评审设计（设计完成后由 `eas-dev-review` 在实现后回检）

## 何时使用 (When to Use)

**该技能应在以下情况使用**：

- 用户说 "设计架构" / "怎么组织" / "deep modules"
- spec 已确认，需进一步设计模块边界
- 跨模块 / 复杂功能，需先设计接口契约再实现
- 现有代码"变成大泥球"，需重新审视模块边界

**不适用于**：

- ❌ spec 还未确认（先走 `eas-dev-align` / `eas-dev-spec`）
- ❌ 单一文件改动（直接实现即可）
- ❌ 一次性脚本 / 小工具（无需架构设计）
- ❌ 选型类问题（这是 design 之后的细化，由 `eas-dev-implement` 决定）

## 快速参考 (Quick Reference)

| 项 | 内容 |
|---|---|
| 模式 | Pattern（思维框架 + 4 核心问题） |
| 输入契约 | `spec.md`（来自 `eas-dev-spec`，`status: confirmed`） |
| 输出契约 | `design.md`（模块图 + 接口契约 + 数据流 + 测试策略） |
| 核心思维框架 | John Ousterhout "Deep Modules" |
| 必答问题 | 4 个核心问题（共享行为 / 独立变化 / 接缝位置 / 测试接口） |
| 必读 references | [references/deep-modules.md](references/deep-modules.md) / [references/seam-finding.md](references/seam-finding.md) |
| 必含 assets | [assets/design-template.md](assets/design-template.md) |
| 失败处理 | spec 缺失或不完整 → MUST 报错 |

## 第一性原理 (First Principles)

> **"复杂度 = 依赖 × 接口面积"** —— John Ousterhout《A Philosophy of Software Design》

**Deep Module 定义**：

- **Deep** = 接口小 + 实现深（多行为隐藏在简单接口后）
- **Shallow** = 接口大 + 实现浅（接口暴露实现细节；调用方需知内部）

**判断标准**：

1. **小接口**：1 个模块对外暴露的方法 / 参数越少越好
2. **深实现**：1 个接口后隐藏的行为越多越好
3. **干净接缝**：模块边界 = 变化轴边界（变化速率相同 = 同模块）

**反模式**：

- ❌ "类越多越好"（Shallow Class 反模式）
- ❌ "暴露所有 getter / setter"（信息隐藏缺失）
- ❌ "通用抽象"（Premature Abstraction）
- ❌ "为未来优化"（YAGNI 反模式）

## 4 核心问题 (Four Core Questions)

### Q1：哪些行为共享？(Shared Behavior)

**目标**：识别同质行为——多个调用方需要的相同功能。

**回答模板**：

```yaml
shared_behaviors:
  - behavior: "全文搜索"
    callers: [TicketAPI, EmailAPI, KnowledgeBaseAPI]
    proposed_module: SearchService
  - behavior: "用户认证"
    callers: [所有 API]
    proposed_module: AuthMiddleware
```

### Q2：哪些行为可独立变化？(Independent Change)

**目标**：识别变化轴——业务 / 技术 / 性能 / 合规 等维度上独立变化的行为。

**回答模板**：

```yaml
change_axes:
  - axis: "搜索引擎替换（ES → 自研）"
    affects: [SearchService]
    decision: 隔离到独立模块
  - axis: "数据库切换（Postgres → MySQL）"
    affects: [Repository 层]
    decision: 抽象 Repository 接口
```

### Q3：接缝在哪？(Seam Location)

**目标**：寻找最小接口面积——抽象边界在哪？接缝后隐藏多少实现？

**回答模板**：

```yaml
seams:
  - seam: "SearchService.search(query) → SearchResult[]"
    exposes: 1 个方法 + 1 个返回类型
    hides: 索引策略 / 评分算法 / 缓存策略 / 持久化
  - seam: "AuthMiddleware.verify(token) → User"
    exposes: 1 个方法 + 1 个返回类型
    hides: token 解析 / 缓存 / 过期检查 / 权限模型
```

### Q4：怎么测试接口？(Test Interface)

**目标**：通过接口可独立测试 = 抽象成功的标志。

**回答模板**：

```yaml
test_strategy:
  - module: SearchService
    interface_test: "mock 索引层；验证 query → result 映射"
    seam_test: "用真实索引（testcontainers）跑完整流程"
  - module: AuthMiddleware
    interface_test: "mock token 解析；验证 user 提取"
    seam_test: "用真实 JWT 库验证签名 / 过期"
```

## 输入契约 (Input Contract)

| 项 | 要求 |
|---|---|
| 必备 | `spec.md`（`status: confirmed`） |
| 可选 | 现有代码（brownfield 场景） |
| 可选 | 已有 `design.md`（增量设计场景） |
| 拒绝 | spec 缺失或不完整（NEVER；先回 `eas-dev-spec`） |

## 输出契约 (Output Contract)

**必须产出 `design.md`**，路径建议：

- 项目级：`<cwd>/designs/<topic>-design.md`
- 临时：`<cwd>/design.md`

**必含 5 章节**：

1. **模块图**（Module Diagram）—— 简单 ASCII 图或 Mermaid
2. **模块清单**（Module List）—— 每个模块的职责（1 句话）
3. **接口契约**（Interface Contract）—— 每个对外接口的签名
4. **数据流**（Data Flow）—— 关键场景的数据走向
5. **测试策略**（Test Strategy）—— seam test + interface test

**模板见** [assets/design-template.md](assets/design-template.md)。

## 失败处理 (Failure Handling)

| 情况 | 动作 |
|---|---|
| spec.md 缺失 | 报错并指引用户先走 `eas-dev-spec` |
| spec.md 不完整 | 报错并指明缺失章节 |
| 用户拒绝回答 4 个核心问题 | 退回 Q1 重新提问；NEVER 跳过 |
| 设计中出现 trade-off | 落地到 `docs/decisions/` ADR，而非 design.md |

## 常见错误 (Common Mistakes)

| ❌ 不要 | ✅ 应该 |
|---|---|
| 接口暴露实现细节 | 接口 = 抽象边界；实现细节 MUST 隐藏在模块内 |
| 为未来预留通用抽象 | YAGNI；只设计当前需要的行为 |
| 把设计塞进 spec | design = 设计；spec = 契约；两者分离 |
| 选具体技术栈（Postgres / Express） | design 聚焦"做什么"；技术栈由 `eas-dev-implement` 决定 |
| 没有 seam test | seam test 是验证抽象成功的唯一手段 |

## 下一步 (Next Steps)

| 下游技能 | 何时使用 |
|---|---|
| `eas-dev-plan` | design 已确认，需拆任务 |
| `eas-dev-implement` | 直接进入实现（小型项目） |
| `eas-dev-review` | 实现后回检 design 忠实度 |
| 用户再次讨论 | design 有歧义；回退 `eas-dev-spec` / `eas-dev-align` |

## 参考资料 (References)

- [references/deep-modules.md](references/deep-modules.md) —— Deep Modules 哲学详解
- [references/seam-finding.md](references/seam-finding.md) —— 如何找干净接缝
- [assets/design-template.md](assets/design-template.md) —— design.md 产出模板

## 与其他技能的关系 (Relationships)

| 技能 | 关系 |
|---|---|
| `eas-dev-spec` | **上游**：spec.md 是 design.md 的输入 |
| `eas-dev-plan` | **下游**：design.md 是 tasks.md 的输入 |
| `eas-dev-implement` | **下游**：design.md 是实现依据 |
| `eas-dev-review` | **下游**：design.md 是评审对照基线 |
| `eas-dev-loop` | **上游**：loop 第三阶段是本技能 |
| `eas-skill-creator` | **规范基线**：本技能遵循其结构 + 5 大模式 + frontmatter 规范 |
| `eas-skill-using` | **不重叠**：dev 分类不进索引 |

---

**最后更新**：2026-08-08