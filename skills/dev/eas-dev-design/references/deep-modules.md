# Deep Modules 哲学详解 (Deep Modules Philosophy)

> **所属技能**：`eas-dev-design`
> **核心来源**：John Ousterhout《A Philosophy of Software Design》第 5 章

---

## Deep vs Shallow

**Deep Module（深度模块）**：

- 接口小（few methods / params）
- 实现深（many behaviors hidden）
- 抽象成功 = 调用方无需知道内部

```
   ┌─────────────────────────────┐
   │                             │  ← 接口：小（1-3 个方法）
   │  ● ● ● ● ● ● ● ● ● ● ● ●  │  ← 实现：深（10+ 行为）
   │  ● ● ● ● ● ● ● ● ● ● ● ●  │
   │                             │
   └─────────────────────────────┘
```

**Shallow Module（浅模块）**：

- 接口大（many methods / params）
- 实现浅（few behaviors per method）
- 抽象失败 = 调用方被迫知道内部

```
   ┌─────────────────────────────┐
   │ ●  ●  ●  ●  ●  ●  ●  ●  ●  │  ← 接口：大（10+ 方法）
   │                             │
   │  ● ● ●  ● ●  ●  ● ●  ● ●  │  ← 实现：浅（每个方法 1-2 行为）
   │                             │
   └─────────────────────────────┘
```

## 设计原则 (Design Principles)

### 原则 1：信息隐藏 (Information Hiding)

**定义**：每个模块 MUST 隐藏"调用方无需知道的细节"。

**判断**：

- ✅ Deep：如果隐藏的是"如何做"（实现策略 / 算法 / 数据结构）
- ❌ Shallow：如果隐藏的是"是什么"（数据本身）

**示例**：

```typescript
// ❌ Shallow（暴露内部数据）
class TicketRepository {
  findById(id: string): Ticket;
  findByCustomerId(customerId: string): Ticket[];
  findByTagId(tagId: string): Ticket[];
  // 每个方法只暴露一种查找方式
}

// ✅ Deep（隐藏在统一接口后）
class TicketRepository {
  search(query: TicketQuery): Ticket[];
  // 内部按 query 自动选择查找策略（id / customer / tag / 全文）
}
```

### 原则 2：避免 Pass-through Methods（传递方法）

**定义**：类 A 的方法仅调用类 B 的同名方法，不做任何额外工作 → 抽象失败。

**判断**：

- ✅ Deep：方法在 A 中有独立价值
- ❌ Shallow：A 仅为 B 的"门面"（pass-through）

### 原则 3：小接口面积 (Small Interface Surface)

**度量**：

- 方法数 ≤ 5（理想 1-3）
- 参数数 ≤ 3（理想 1-2）
- 不暴露内部状态 / 类型

**反例**：

```typescript
// ❌ 接口面积过大
class HttpClient {
  get(url, headers, timeout, retry, proxy, ...);
  post(url, body, headers, timeout, ...);
  put(url, body, ...);
  // 8 个方法 × N 个参数 = 巨大接口面积
}
```

**正例**：

```typescript
// ✅ 接口面积小
class HttpClient {
  request(spec: RequestSpec): Promise<Response>;
  // 1 个方法 + 1 个 spec 对象（spec 内部可选）
}
```

### 原则 4：Pull Complexity Downward（向下拉复杂度）

**定义**：把复杂度从"接口" 推到 "实现"——让调用方简单，让模块自己处理复杂性。

**示例**：

```typescript
// ❌ 调用方需处理复杂度
function searchTickets(query: string, options: SearchOptions): Ticket[] {
  // 调用方需知：分词 / 评分 / 缓存
  const tokens = tokenize(query);
  const scored = score(tokens, options);
  const cached = cache.get(tokens);
  return merge(scored, cached);
}

// ✅ 模块自己处理复杂度
function searchTickets(query: string): Ticket[] {
  // 内部处理：分词 / 评分 / 缓存
  return searchEngine.search(query);
}
```

## 模块边界判定 (Module Boundary Decision)

**问自己**：

1. **变化速率**：哪些行为会以相同速率变化？（同速率 = 同模块）
2. **变化原因**：哪些行为因相同原因变化？（同原因 = 同模块）
3. **变化时间**：哪些行为在相同时机变化？（同时机 = 同模块）

**违反任一** → 分到不同模块。

**示例**：

```
用户认证 + 用户权限：
- 变化速率：认证（按月变）/ 权限（按周变）→ 不同模块 ✓
- 变化原因：认证（安全合规驱动）/ 权限（业务需求驱动）→ 不同模块 ✓

全文搜索 + 搜索结果高亮：
- 变化速率：搜索（按月变）/ 高亮（按周变）→ 不同模块 ✓
```

---

**最后更新**：2026-08-08