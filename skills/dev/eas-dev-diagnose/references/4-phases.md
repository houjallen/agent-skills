# 4 阶段详解 (4-Phase Details)

> **所属技能**：`eas-dev-diagnose`
> **目标**：详细解释 reproduce → locate → fix → regression 各阶段落地步骤

---

## Phase 1: 复现 (Reproduce)

### MRC（最小可重现用例）5 要素

| 要素             | 说明       | 示例                                |
| ---------------- | ---------- | ----------------------------------- |
| **Description**  | 一句话描述 | "搜索包含特殊字符的 query 返回 500" |
| **Input**        | 最小输入   | `q = "test\\u0000"`                 |
| **Expected**     | 期望行为   | "返回 200 + 空结果"                 |
| **Actual**       | 实际行为   | "返回 500"                          |
| **Trigger Rate** | 触发概率   | "必现" / "10% 概率" / "特定数据下"  |

### 复现步骤

```yaml
mrc:
  description: '搜索包含特殊字符的 query 返回 500'
  input: |
    q = "test\u0000"
  expected: |
    HTTP 200, JSON { results: [] }
  actual: |
    HTTP 500, "Internal Server Error"
  trigger_rate: '必现'
  environment:
    os: 'Linux 5.15'
    runtime: 'Node 20.10'
    data: 'staging DB 含 1000 工单'
  steps:
    - '调用 GET /api/tickets/search?q=test%5C0'
    - '观察响应'
```

### 复现技巧

- **二分法**：逐步减少输入直到最小仍能触发
- **固定变量**：每次只改一个变量
- **环境隔离**：本地 / staging / 生产；优先本地复现
- **时间窗口**：高频 bug 加日志定位精确时间

### 复现失败的应对

如果 24 小时内无法复现：

- 加详细日志 / 监控
- 与用户 / 报告人确认更多细节
- **NEVER 盲目修改代码"碰运气"**

## Phase 2: 定位 (Locate)

### 症状 vs 根因

**示例**：

```
症状（用户可见）：
- "搜索返回 500"
- "页面加载慢"

根因（代码层）：
- "ES 查询未转义特殊字符 → ES 解析失败 → 500"
- "DB 查询缺少索引 → 全表扫描 → 慢"
```

### 4 层排查法

| 层           | 关注点             | 工具                          |
| ------------ | ------------------ | ----------------------------- |
| **用户层**   | 操作 / 输入        | 浏览器 DevTools / 用户日志    |
| **应用层**   | 代码逻辑 / 状态    | 应用日志 / 调用栈 / debugger  |
| **数据层**   | DB / 缓存 / 队列   | DB 慢查询日志 / Redis monitor |
| **基础设施** | 网络 / 资源 / 依赖 | 系统监控 / APM / 链路追踪     |

### 定位证据收集

- **日志**：异常发生时的完整堆栈
- **调用栈**：trace_id 串联全链路
- **数据状态**：DB 中相关记录
- **实验验证**：通过实验排除/确认假设

### 验证根因（5 个问题）

1. **根因能解释所有症状吗？**（不只是部分）
2. **移除根因 = 症状消失吗？**（反推）
3. **根因发生在代码哪一行 / 哪个分支？**（精确定位）
4. **根因是首次出现还是回归？**（git log + blame）
5. **根因修复会影响其他功能吗？**（影响面）

## Phase 3: 修复 (Fix)

### 最小变更原则

- ✅ 仅改必要的代码
- ✅ 不"顺便"重构
- ✅ 不引入新依赖（如非必要）
- ✅ 不改无关代码风格

### 修复模板

```yaml
fix:
  change_type: code # code / config / data / infra
  files:
    - src/services/search-service.ts
  diff_summary: '转义 ES 查询特殊字符'
  why_root_cause_fix: |
    ES 查询未转义导致解析失败；转义后 ES 正常解析。
  why_not_symptom_fix: |
    不是"加 try/catch 吞掉错误"——根因是 ES 查询缺少转义。
```

### 修复验证

修复后 MUST 跑 Phase 1 的 MRC：

- MRC 触发 → 期望行为（不再是 500）
- 完整测试套件 → 仍通过

## Phase 4: 回归 (Regression)

### 回归测试三步

1. **写测试**：覆盖 MRC + 根因触发条件
2. **验证失败**：在修复前跑 → 测试失败
3. **验证通过**：在修复后跑 → 测试通过

### 测试模板

```typescript
test('should handle special characters in search query', async () => {
  const service = new SearchService();
  // 根因触发条件：特殊字符
  const result = await service.search('test\u0000');
  // 期望行为：返回结果（不抛错）
  expect(result).toBeDefined();
  expect(result.length).toBeGreaterThanOrEqual(0);
});
```

### 监控与告警（可选）

- 加 metric：搜索特殊字符失败率
- 加 alert：错误率 > X% 触发告警
- 加 runbook：值班人员排查步骤

## 完整示例 (Full Example)

### Bug 报告

> "用户反馈：搜索关键词包含特殊字符（如 `&` `\`）时返回 500"

### Phase 1: 复现

```yaml
mrc:
  description: "搜索包含 `\\` 的 query 返回 500"
  input: q="test\\"
  expected: HTTP 200, results
  actual: HTTP 500
  trigger_rate: '必现'
  steps:
    - 'GET /api/tickets/search?q=test%5C%5C'
```

### Phase 2: 定位

```yaml
root_cause:
  description: 'ES 查询构造时未转义反斜杠'
  layer: application
  evidence:
    - '应用日志：ES returned 400 - failed to parse query'
    - '代码：src/services/search-service.ts:42 — 直接拼接 query，未调用 escapeQuery'
  why_symptoms_explainable: |
    ES 7.x 后对反斜杠敏感；未转义 → ES 解析失败 → 上层捕获为 500。
```

### Phase 3: 修复

```yaml
fix:
  change_type: code
  files: [src/services/search-service.ts]
  diff_summary: '调用 escapeQuery 转义 query 后传给 ES'
  why_root_cause_fix: '转义后 ES 正常解析'
  why_not_symptom_fix: '不是 catch 500；是消除 ES 解析失败'
```

### Phase 4: 回归

```yaml
regression_test:
  test_file: tests/services/search-service.test.ts
  test_name: 'should escape special characters in search query'
  before_fix_behavior: '测试失败（500）'
  after_fix_behavior: '测试通过（200）'
```

---

**最后更新**：2026-08-08
