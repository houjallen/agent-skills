# 颗粒度判断规则 (Granularity Rules)

> **所属技能**：`eas-dev-plan`
> **目标**：判断任务颗粒度是否合适；超 5 分钟任务如何拆分

---

## 黄金区间 (Golden Range)

**2-5 分钟 / 任务** 是最优区间。

### 为什么下限是 2 分钟

| 项                                 | 时间        |
| ---------------------------------- | ----------- |
| 任务上下文加载（读 spec / 上下文） | ~30s        |
| 代码定位 + 编写                    | ~60s        |
| 编写测试                           | ~30s        |
| 运行验证                           | ~15s        |
| **总计下限**                       | **~2 分钟** |

低于 2 分钟的任务开销 > 工作量——应合并到相邻任务。

### 为什么上限是 5 分钟

| 场景                                    | 时间     |
| --------------------------------------- | -------- |
| Agent 调用一次内可完成（含思考 + 输出） | 3-5 分钟 |
| 反馈周期（写 → 测 → 改）                | < 5 分钟 |
| 评审发现 → 修复 → 验证                  | < 5 分钟 |

超过 5 分钟——反馈延迟太长；bug 定位困难。

## 颗粒度过粗的迹象 (Too Coarse Signs)

| 迹象                       | 例子                       |
| -------------------------- | -------------------------- |
| 标题含多个动作             | "实现搜索 + 写测试 + 部署" |
| acceptance_steps > 10 条   | 一个任务做太多事           |
| estimated_minutes > 5      | 超出上限                   |
| prerequisites 形成复杂 DAG | 多模块同时改               |

**拆分策略**：

- 按"动词"拆（每个动词一个任务）
- 按"模块"拆（每个模块一个任务）
- 按"步骤"拆（每步骤：写代码 / 写测试 / 验证）

## 颗粒度过细的迹象 (Too Fine Signs)

| 迹象                           | 例子               |
| ------------------------------ | ------------------ |
| 标题是单行操作                 | "添加 import 语句" |
| estimated_minutes < 2          | 低于下限           |
| acceptance_steps 仅 1 条且琐碎 | "确认变量命名"     |
| 任务数 > 50                    | 颗粒度过细         |

**合并策略**：

- 把相邻小任务合并（如 import + 类型定义 + 函数签名 → 一起）
- 保留"创建文件"和"在文件中加代码"为一个任务

## 拆分示例 (Splitting Examples)

### 例 1：颗粒度过粗 → 拆分

**原始任务**：

```yaml
- id: T-001
  title: '实现全文搜索'
  estimated_minutes: 30
  acceptance_steps: [添加 API, 加 Service, 加 Repository, 写测试, 部署]
```

**拆分后**：

```yaml
- id: T-001
  title: '添加 SearchService.search 单元测试'
  estimated_minutes: 5
  acceptance_steps:
    - '测试用例：空查询返回 []'
    - '测试用例：单字段查询返回匹配项'
    - '测试覆盖率 ≥ 80%'

- id: T-002
  title: '实现 SearchService.search'
  estimated_minutes: 5
  prerequisites: [T-001]
  acceptance_steps:
    - 'Service.search(query) 返回 SearchResult[]'
    - '对应测试用例全部通过'

- id: T-003
  title: '添加 SearchRepository.query'
  estimated_minutes: 5
  prerequisites: [T-002]
  acceptance_steps:
    - 'Repository.query(query) 返回结果'
    - '集成测试通过'

- id: T-004
  title: '添加 /api/tickets/search 端点'
  estimated_minutes: 3
  prerequisites: [T-002, T-003]
  acceptance_steps:
    - 'GET /api/tickets/search?q=test 返回 200'
    - '参数校验：空 q 返回 400'

- id: T-005
  title: '端到端集成测试'
  estimated_minutes: 5
  prerequisites: [T-004]
  acceptance_steps:
    - 'E2E 测试：搜索 → 返回 → 验证格式'
    - '性能测试：1000 query P99 < 500ms'
```

**变化**：30 分钟单任务 → 5 个 3-5 分钟任务。每个任务可独立执行 + 独立评审。

## 自动颗粒度校验 (Auto Granularity Check)

```typescript
// 概念性代码（实际由 Agent / 脚本执行）
function checkGranularity(task: Task): ValidationResult {
  if (task.estimated_minutes < 2) {
    return { valid: false, reason: '颗粒度过细；考虑合并' };
  }
  if (task.estimated_minutes > 5) {
    return { valid: false, reason: '颗粒度过粗；MUST 拆分' };
  }
  if (task.acceptance_steps.length < 2) {
    return { valid: false, reason: '无验收或验收不足' };
  }
  if (task.code_paths.length === 0) {
    return { valid: false, reason: '无代码路径' };
  }
  return { valid: true };
}
```

---

**最后更新**：2026-08-08
