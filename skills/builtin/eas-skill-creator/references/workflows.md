# 工作流程 (Workflows)

## 技能创建流程 (Skill Creation Process)

```
了解需求 → 确定模式 → 初始化结构 → 填充内容 → 验证 → 打包 → 迭代
```

### 步骤 1：了解需求 (Understand Requirements)

通过具体示例理解技能的使用场景。

### 步骤 2：确定模式 (Determine Mode)

根据需求选择合适的模式（参考 [skill-spec.md](skill-spec.md)）。

### 步骤 3：初始化结构 (Initialize Structure)

```bash
tsx scripts/init-skill.ts <skill-name> --path ./skills --resources scripts,references,assets --examples
```

### 步骤 4：填充内容 (Fill Content)

根据模式填充 SKILL.md 和资源文件。

### 步骤 5：验证 (Validate)

```bash
tsx scripts/quick-validate.ts ./skills/<skill-name>
```

### 步骤 6：打包 (Package)

```bash
tsx scripts/package-skill.ts ./skills/<skill-name>
```

---

## 模式特定流程 (Mode-Specific Process)

> **执行入口约束**：以下流程对应「步骤规范 (Step Spec)」。仅 Pipeline 必须展开为完整步骤序列；其他模式按需选用 checklist / 模板作为替代。完整映射见 [skill-spec.md §8](skill-spec.md)。

### Tool Wrapper 流程 (Tool Wrapper Process)

**核心：补 API/库知识，不涉及执行步骤** → ❌ 不需要步骤规范；⚠ 可选「常见错误表」作轻度 checklist。

1. 收集目标库的 API / 用法 / 版本约束
2. 编写 API 速查表（按功能分组，1 行 1 用法）
3. 添加调用示例（最小可运行片段）
4. 编写常见错误表（错误现象 → 原因 → 修复）

> **checklist 项（可选）**：
> - [ ] C-T001 API 表覆盖库核心能力 ≥ 80%
> - [ ] C-T002 每个 API 有可运行示例
> - [ ] C-T003 常见错误表 ≥ 5 项

### Generator 流程 (Generator Process)

**核心：按模板稳定输出** → ⚠ 步骤可选（生成阶段）；✅ 推荐输出校验清单。

1. 定义输出模板（必填字段、字符限制、格式）
2. 编写生成步骤（如何填模板、如何处理边界）
3. 编写校验规则（输出自检 checklist）
4. 定义失败处理（生成失败 / 校验失败兜底）

> **步骤模板（可选）**：
>
> ### Step 1: 收集输入
> - 目标: 拿到生成所需的全部参数
> - 入口: 用户已给出需求或上游产物
> - 操作: 列出必填参数清单，逐项确认
> - 出口: 参数对象（缺一不可）
> - 失败: 缺参数 → 反问补全，不进入下一步
>
> ### Step 2: 填充模板
> - 目标: 按模板产出候选产物
> - 入口: 参数已收集
> - 操作: 按模板逐字段填入，运行校验清单
> - 出口: 候选产物（已通过 C-G 系列校验）
> - 失败: 校验失败 → 重填或回退到 Step 1
>
> **checklist 项（必选）**：
> - [ ] C-G001 必填字段齐全
> - [ ] C-G002 字符数合规（name ≤ 64 / description ≤ 1024）
> - [ ] C-G003 文件路径使用相对路径
> - [ ] C-G004 代码块带语言标记
> - [ ] C-G005 输出通过校验脚本（auto）

### Reviewer 流程 (Reviewer Process)

**核心：按清单逐项核查** → ❌ 不需要执行步骤；✅ **必须有 checklist**。

1. 编写审查流程（entry → steps → exit）
2. 创建 `references/checklist.md`（**强制落地**）
3. 定义输出格式（结构化 JSON 报告）

> **checklist 规范要求**（按 [skill-spec.md §8.4](skill-spec.md)）：
> - 落地到 `<skill-name>/references/checklist.md`
> - 每项含：唯一 ID（C-001）/ 检查项 / 通过条件 / 严重度（P0-P3）/ 检查方式（manual/auto）
> - **按严重度分级**：P0 = Blocker / P1 = MUST / P2 = SHOULD / P3 = MAY
> - **通过条件**：所有 P0 = 0；P1 = 0 或全部豁免；P2/P3 不阻塞
>
> **checklist 章节划分（推荐）**：
>
> | 章节 | 内容 | 示例 |
> |---|---|---|
> | §1 入口检查 | 待审对象是否就绪、范围是否明确 | 提交 PR 时附 description |
> | §2 结构检查 | 文件结构 / frontmatter / 必填节 | `SKILL.md` 存在；frontmatter 完整 |
> | §3 语义检查 | 指令强度 / 概念边界 / 无歧义 | MUST / SHOULD 按 §13.3 使用 |
> | §4 规范检查 | 命名 / 链接 / 代码块 / 中英混排 | 无 `@` 路径引用 |
> | §5 出口检查 | 产出报告 / 闭环动作 | 输出结构化 JSON |
>
> **输出格式**：
> ```json
> {
>   "passed": true | false,
>   "failed": ["C-001", "C-005"],
>   "severity": ["P0", "P1"],
>   "comments": { "C-001": "缺 frontmatter" }
> }
> ```

### Inversion 流程 (Inversion Process)

**核心：反向澄清需求** → ⚠ 阶段序列（澄清流程）；❌ 不需要 checklist。

1. 设计澄清阶段（≤3 阶段，按"先广后窄"原则）
2. 编写问题（≤5 必答，每题 2~4 选项；frontmatter `behavior.gate.phases`）
3. 设置 `refuseActionWhenIncomplete: true`（不全答不执行）

> **步骤模板（推荐）**：
>
> ### Phase 1: 澄清阶段
> - 目标: 把模糊需求拆成可选项
> - 入口: 用户提出需求但有歧义
> - 操作: 按 `behavior.gate.phases` 顺序提问，每题 2~4 选项
> - 出口: 用户完成所有必答
> - 失败: 用户拒绝回答 → 退出，不进入后续步骤
>
> ### Phase 2: 锁定需求
> - 目标: 收敛到唯一方案
> - 入口: 必答完成
> - 操作: 总结用户选择 + 推断未选维度
> - 出口: 需求规格确认
> - 失败: 选择冲突 → 回退到 Phase 1 重新澄清

### Pipeline 流程 (Pipeline Process)

**核心：按顺序多步执行** → ✅ **必须有步骤规范**；⚠ Gate 条件清单可选。

1. 定义步骤序列（`behavior.sequence.steps`）
2. 每步设置 Gate 三要素（**入口 / 出口 / 失败策略**）
3. 声明依赖关系（`dependsOn`，禁止循环）

> **步骤规范要求**（按 [skill-spec.md §8.3](skill-spec.md)）：每步 MUST 包含
>
> ### Step <N>: <步骤名>
> - **目标 (Goal)**: 本步要完成什么（1 句）
> - **入口条件 (Entry)**: 前置依赖 / 必备输入（MUST 满足才能开始）
> - **操作 (Action)**: 具体动作（动词开头，1~3 句）
> - **出口条件 (Exit)**: 完成后产生的产物 / 状态
> - **失败策略 (Failure)**: `abort | retry | skip`，附 `maxRetries` / 通知方式
> - **回滚 (Rollback)**: 是否需要回滚 + 回滚动作
>
> **Gate 三要素**（每步 MUST）：
> 1. **入口 Gate** — 依赖就绪、权限就位、输入存在
> 2. **出口 Gate** — 产物已生成、校验已通过、人工已批准
> 3. **失败 Gate** — 失败兜底动作 + 通知方式（不可"Agent 自决"）
>
> **checklist 项（可选，仅 Gate 条件清单）**：
> - [ ] C-P001 步骤依赖图无循环
> - [ ] C-P002 每个 step 都设置了 entryConditions / exitConditions / onFailure
> - [ ] C-P003 `onFailure` 必须含 `action` ∈ {abort, retry, skip} + `maxRetries` + `rollback` 三子字段；涉及部署/删除的步骤 `rollback=true` 必须显式声明
> - [ ] C-P004 涉及部署 / 删除的步骤标记 rollback=true

---

## 验证流程 (Validation Process)

### 基础验证 (Basic Validation)

1. 检查 SKILL.md 存在
2. 验证 YAML frontmatter 格式
3. 检查 name 和 description 必填

### 模式验证 (Mode Validation)

1. 检查 mode 字段有效
2. 验证模式特定字段
3. 检查组合模式结构

### quick-validate.ts 用法

`scripts/quick-validate.ts` 验证技能是否符合 EASBot 规范：

```bash
tsx scripts/quick-validate.ts ./skills/<skill-name>
```

校验项包含：
- 检查 SKILL.md 文件是否存在
- 验证 YAML frontmatter 格式和内容
- 检查 name 和 description 字段是否符合要求（hyphen-case / 第三人称 / 字符限制）
- 验证命名约定和长度限制（≤ 64 / ≤ 1024）

## 打包流程 (Packaging Process)

### package-skill.ts 用法

`scripts/package-skill.ts` 将技能打包成可分发的 `.skill` 文件（ZIP 格式）：

```bash
tsx scripts/package-skill.ts ./skills/<skill-name>
```

打包步骤：
- 先调用 `quick-validate.ts` 验证技能格式是否正确
- 使用 ZIP 格式创建 `.skill` 文件
- 将技能目录中的所有文件添加到包中

## 核心脚本实现 (Core Scripts Implementation)

> **统一 TypeScript**：本技能仅维护 TypeScript 实现（`.ts`），不提供 Python 平行版本。这样可以避免双语言实现漂移、减少维护负担、保持行为一致。

### 零外部依赖原则 (Zero External Dependencies)

**核心脚本（`scripts/init-skill.ts`、`scripts/quick-validate.ts`、`scripts/package-skill.ts`）仅依赖 Node.js 内置模块**：
- `fs` / `fs/promises` — 文件系统操作
- `path` — 路径处理
- `url` — URL 解析（用于 ESM `import.meta.url`）
- `node:fs/promises`、`node:path` 等 — Node 内置命名空间

> **关于 `package-skill.ts` 中的 `jszip`**：`jszip` 是当前实现的依赖项，未来计划替换为 Node 内置的 `node:zlib` + `node:stream` 实现（ZIP 格式可纯 Node 实现）。在替换完成前，新创建技能的 `scripts/` 不应再引入 `jszip` 等第三方依赖。

新技能创建脚本时，**SHOULD 优先使用 Node 内置模块**，仅在确实无法满足需求时引入第三方依赖，且 MUST 在 SKILL.md 的「实现」章节明确标注依赖原因。

### init-skill.ts (技能初始化脚本)

此脚本用于创建新的技能目录结构，包含：
- 技能目录的创建
- SKILL.md 模板文件的生成
- 可选的 scripts、references、assets 目录及示例文件的创建

使用示例：

```bash
tsx scripts/init-skill.ts my-skill --path ./skills --resources scripts,references,assets --examples
```

---

## 迭代流程 (Iteration Process)

1. 在实际任务中使用技能
2. 记录问题或低效之处
3. 更新 SKILL.md 或资源
4. 重新验证和打包
