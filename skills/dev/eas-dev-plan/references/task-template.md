# 7 字段任务模板详解 (Task Template Details)

> **所属技能**：`eas-dev-plan`
> **目标**：详细解释 tasks.md 中每个任务的 7 字段填写规则

---

## 7 字段详解

### 字段 1：id

**类型**：string
**必填**：✓
**格式**：`T-NNN`（3 位数字，零填充）

**示例**：
- `T-001`（首个任务）
- `T-042`（第 42 个任务）

**作用**：唯一标识；用于 prerequisites 字段的引用。

### 字段 2：title

**类型**：string
**必填**：✓
**格式**：动宾结构（"动词 + 对象"）

**示例**：

- ✅ "添加全文搜索 API 端点"（动宾）
- ✅ "编写 SearchService.search 单元测试"（动宾）
- ❌ "搜索功能"（仅名词，无动作）
- ❌ "实现"（太泛）

**反例检查**：

- 标题是否说明"做什么"？
- 是否能从中看出"做完后会改变什么"？

### 字段 3：prerequisites

**类型**：list of task IDs
**必填**：✓（可为空列表）
**格式**：`[T-001, T-002]` 或 `[]`（无依赖）

**示例**：

```yaml
prerequisites: [T-001, T-002]  # 依赖 T-001 和 T-002 完成
prerequisites: []              # 无依赖，可立即开始
```

**作用**：定义任务执行顺序；下游 `eas-dev-implement` 据此调度。

**反例**：

- ❌ "需要先有数据库" → 这不是任务依赖；是环境前提
- ❌ 循环依赖（T-A 依赖 T-B，T-B 依赖 T-A）→ 报错

### 字段 4：acceptance_steps

**类型**：list of strings
**必填**：✓（每条 MUST 可执行 / 可验证）

**示例**：

```yaml
acceptance_steps:
  - "curl GET /api/tickets/search?q=test 返回 200"
  - "返回 JSON 含 results 数组，每项有 id / title / score"
  - "空查询返回 400 错误"
  - "单元测试覆盖率 ≥ 80%"
```

**必含要素**：

- 具体可执行步骤（命令 / 函数调用 / 检查点）
- 可观察结果（不是"看起来对就行"）

**反例**：

- ❌ "代码能跑" → 不具体
- ❌ "测试通过" → 不指明哪个测试
- ❌ "效果不错" → 主观

### 字段 5：code_paths

**类型**：list of paths
**必填**：✓

**示例**：

```yaml
code_paths:
  - src/api/tickets/search.ts
  - src/services/search-service.ts
  - tests/services/search-service.test.ts
```

**作用**：Agent 据此定位文件；评审者据此审查范围。

**注意**：

- 相对路径（相对项目根）
- 文件级即可，不必细到行

### 字段 6：estimated_minutes

**类型**：number
**必填**：✓
**范围**：[2, 5]（MUST）

**判断**：

- 任务能在 2-5 分钟完成？→ 是 → 接受
- < 2 分钟？→ 合并到相邻任务
- \> 5 分钟？→ 拆分为子任务

**示例**：

```yaml
estimated_minutes: 3  # 典型值
estimated_minutes: 2  # 下限（必须含 acceptance + 测试）
estimated_minutes: 5  # 上限（含简单实现 + 测试）
```

**反例**：

- ❌ 30 分钟 → 远超上限，必须拆
- ❌ 1 分钟 → 太短，任务开销 > 工作量

### 字段 7：risks

**类型**：list of objects
**必填**：✓（可为空 `[]`）

**格式**：

```yaml
risks:
  - risk: "<风险描述>"
    mitigation: "<缓解策略>"
```

**示例**：

```yaml
risks:
  - risk: "ES 索引可能因字段映射不一致导致查询失败"
    mitigation: "先在 staging 验证 mapping；用别名做切换"
  - risk: "中文分词性能可能不达标"
    mitigation: "准备 fallback 到简单 substring 匹配"
```

**反例**：

- ❌ "可能有 bug" → 不具体
- ❌ 列风险但不列缓解 → 信息不完整

---

**最后更新**：2026-08-08