# 5 章节规格模板详细说明 (Spec Template Details)

> **所属技能**：`eas-dev-spec`
> **目标**：详细解释 spec.md 5 章节的填写规则 + 5 条校验规则的落地步骤。

---

## 章节 1: 背景 (Background)

**来源**：alignment.md §1 背景（必含 motivation / reasoning / stakeholders / risk）

**字段**：

| 字段              | 必填 | 说明                                                 |
| ----------------- | ---- | ---------------------------------------------------- |
| Context           | ✓    | 1-2 段背景说明；可引用 alignment.md §1.reasoning     |
| Stakeholders      | ✓    | 受影响方列表；可引用 alignment.md §1.stakeholders    |
| Risk of NOT Doing | ✓    | 不做的风险；可引用 alignment.md §1.risk_of_not_doing |

**校验**：

- ✅ 段落含具体场景（不是抽象描述）
- ✅ Stakeholders 含 ≥1 个具体角色
- ✅ Risk 含可观察后果（不是"会有问题"等模糊词）

## 章节 2: 目标 (Goal)

**来源**：alignment.md §2 目标

**字段**：

| 字段              | 必填     | 说明             |
| ----------------- | -------- | ---------------- |
| Primary Goal      | ✓        | 一句话核心目标   |
| Success Indicator | ✓        | 可观察的成功标志 |
| Non-Goals         | optional | 明确不达成的目标 |

**校验**：

- ✅ Primary Goal 一句话，不超 30 字
- ✅ Success Indicator 含可观察信号（不是"更好"等主观词）

## 章节 3: 接口 (Interface)

**来源**：alignment.md §2 范围（in_scope） + 用户补充

**至少 1 项必填**（按需选择）：

### 3.1 API 端点

```yaml
endpoints:
  - method: GET
    path: /api/tickets/search
    query:
      - name: q
        type: string
        required: true
        description: '搜索关键词'
    response:
      200:
        schema:
          type: array
          items:
            $ref: '#/components/schemas/Ticket'
    errors:
      - 400: '参数错误'
      - 500: '服务异常'
```

### 3.2 数据结构

```typescript
interface Ticket {
  id: string;
  title: string;
  content: string;
  tags: string[];
  customerName: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.3 事件契约

```yaml
events:
  - name: ticket.searched
    payload:
      query: string
      resultCount: number
      latencyMs: number
```

### 3.4 UI 接口

```typescript
interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => Promise<SearchResult[]>;
  debounceMs?: number;
}
```

**校验**：

- ✅ 至少 1 种接口形式（API / 数据 / 事件 / UI）
- ✅ 每个接口含具体签名 + 类型 + 必填项
- ✅ 错误码 / 边界情况明确

## 章节 4: 验收 (Acceptance Criteria)

**来源**：alignment.md §4 验收

**主验收 + 副验收结构**：

```yaml
acceptance_criteria:
  primary:
    type: metric-defined # behavior-defined / metric-defined / test-coverage
    criteria:
      - id: AC-1
        name: P99 搜索响应时间
        target: < 500ms
        measurement: 'staging 环境跑 1000 条 query，统计 P99'
      - id: AC-2
        name: 搜索准确率
        target: 前 5 结果包含目标工单 ≥ 90%
        measurement: '100 条人工标注 query 的检索结果'
  secondary:
    - id: AC-3
      name: 单测覆盖率
      target: ≥ 80%
      measurement: 'jest --coverage'
  done_definition:
    - 所有 primary AC 通过
    - 所有 secondary AC 通过（或显式豁免）
    - PR 合并到 main
    - 部署到 staging
    - 通知客服团队
```

**校验**：

- ✅ 主验收 ≥ 1 条
- ✅ 每条 AC 含 `target`（具体值）+ `measurement`（如何测）
- ✅ target 是可量化 / 可观察的（不是"差不多"）
- ✅ done_definition 含 ≥3 项明确步骤

## 章节 5: 范围外 (Out-of-Scope)

**来源**：alignment.md §3 范围（out_of_scope 部分）

**字段**：

```yaml
out_of_scope:
  - item: '时间范围过滤'
    reason: '已有功能，不重复实现'
  - item: '状态过滤'
    reason: '已有功能，不重复实现'
  - item: 'AI 增强搜索'
    reason: '下一迭代单独规划；本迭代先做基础全文搜索'
  - item: '搜索结果高亮'
    reason: '暂不需要；保留接口预留未来扩展'
```

**校验**：

- ✅ ≥ 3 项明确不做的事
- ✅ 每项含 `item`（具体功能）+ `reason`（不做的理由）

---

## 5 条校验规则落地步骤 (Validation Steps)

```
1. 读取 spec.md
2. 解析 5 章节
3. 规则 no-tbd: 在所有章节中搜索 /\b(TBD|看情况|待定|差不多)\b/；命中 → 报错
4. 规则 no-empty-section: 每章节解析后检查条目数；空 → 报错
5. 规则 interface-required: 检查 §3 是否含 ≥1 个接口块；无 → 报错
6. 规则 acceptance-testable: 解析 §4，每 AC 检查 target + measurement 字段；缺失 → 报错
7. 规则 out-of-scope-explicit: 解析 §5，条目数 <3 → 报错
8. 任一规则失败 → 输出错误："章节 X 规则 Y 不通过；建议 Z"
9. 全部通过 → 输出 spec.md 路径 + "spec 已生成"
```

---

**最后更新**：2026-08-08
