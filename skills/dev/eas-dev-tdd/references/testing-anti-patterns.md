# 测试反模式库 (Testing Anti-Patterns)

> **所属技能**：`eas-dev-tdd`
> **目标**：列出常见测试反模式 + 修复方法

---

## 反模式 1: 私有状态测试 (Private State Testing)

**症状**：

```typescript
test("should set internal cache", () => {
  const service = new SearchService();
  service.search("foo");
  // ❌ 直接读私有字段
  expect((service as any).cache).toBeDefined();
});
```

**问题**：测试依赖实现细节；重构（不改行为）就破坏测试。

**修复**：测行为而非状态

```typescript
test("should return cached results on second call", () => {
  const service = new SearchService();
  const firstResult = service.search("foo");
  const secondResult = service.search("foo");
  // ✅ 测可观察行为
  expect(secondResult).toBe(firstResult);  // 引用相等 = 缓存命中
});
```

## 反模式 2: 过度 Mock (Over-Mocking)

**症状**：

```typescript
test("should call dependencies", () => {
  const mockDb = jest.mock();
  const mockCache = jest.mock();
  const mockLogger = jest.mock();
  const mockMetrics = jest.mock();
  // ❌ mock 所有依赖
  const service = new SearchService(mockDb, mockCache, mockLogger, mockMetrics);
  service.search("foo");
  expect(mockDb.query).toHaveBeenCalled();
});
```

**问题**：测的不是 search 功能，而是"调用了哪些方法"。

**修复**：仅 mock 边界（外部依赖）

```typescript
test("should return empty when no matches", () => {
  // ✅ 仅 mock 必要的外部依赖
  const mockIndex = { query: () => [] };
  const service = new SearchService(mockIndex);
  expect(service.search("foo")).toEqual([]);
});
```

## 反模式 3: 不测实现 (Implementation Testing)

**症状**：

```typescript
test("should call query then sort then format", () => {
  const spy1 = jest.spyOn(service, "query");
  const spy2 = jest.spyOn(service, "sort");
  const spy3 = jest.spyOn(service, "format");
  service.search("foo");
  // ❌ 测调用顺序
  expect(spy1).toHaveBeenCalledBefore(spy2);
  expect(spy2).toHaveBeenCalledBefore(spy3);
});
```

**问题**：实现细节（方法拆分）一变测试就破坏。

**修复**：测结果

```typescript
test("should return results sorted by score", () => {
  const results = service.search("foo");
  // ✅ 测可观察结果
  expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
});
```

## 反模式 4: 测试替身 (Test Doubles Misuse)

**症状**：

```typescript
test("should save to database", () => {
  // ❌ 用真实数据库
  const service = new SearchService(realDatabaseConnection);
  service.search("foo");
});
```

**问题**：测试慢 / 不稳定 / 污染真实数据。

**修复**：用 testcontainers 或 mock

```typescript
// 方案 A: 真实 DB 但用 testcontainers
test("should save to database", async () => {
  const db = await new TestDB().start();
  const service = new SearchService(db);
  service.search("foo");
  await teardown(db);
});

// 方案 B: 完全 mock 边界
test("should save to database", () => {
  const mockDb = { save: jest.fn() };
  const service = new SearchService(mockDb);
  service.search("foo");
  expect(mockDb.save).toHaveBeenCalled();
});
```

## 反模式 5: 测试代码本身的反模式 (Test Code Smells)

### 5.1 跳过遗留

**症状**：`test.skip(...)` / `xit(...)` 永远遗留

**修复**：删除跳过的测试；如不需要则删除测试，否则修复

### 5.2 共享可变状态

**症状**：

```typescript
let sharedService: SearchService;

beforeAll(() => {
  sharedService = new SearchService();  // ❌ 共享
});

test("test A", () => {
  sharedService.search("foo");  // 影响 test B
});
```

**修复**：每个 test 独立初始化

```typescript
beforeEach(() => {
  const service = new SearchService();  // ✅ 每个 test 独立
});
```

### 5.3 不清理的资源

**症状**：测试创建数据库连接 / 文件但未清理

**修复**：`afterEach` / `afterAll` 显式清理

### 5.4 过度具体断言

**症状**：

```typescript
expect(result).toEqual({
  id: "ticket-123",
  title: "Test",
  content: "...",
  tags: ["a", "b", "c"],
  customerName: "Alice",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  // ... 20 个字段
});
```

**问题**：任何字段调整都破坏测试

**修复**：断言关键字段

```typescript
expect(result.id).toBe("ticket-123");
expect(result.title).toBe("Test");
// 仅断言验证行为所必需的字段
```

### 5.5 不稳定的异步等待

**症状**：

```typescript
test("async operation", async () => {
  service.startAsync();
  await new Promise(r => setTimeout(r, 100));  // ❌ 魔法等待时间
  expect(service.isDone()).toBe(true);
});
```

**修复**：等待真实信号

```typescript
test("async operation", async () => {
  const promise = service.startAsync();
  await promise;  // ✅ 等待 promise 解析
  expect(service.isDone()).toBe(true);
});
```

## 反模式速查表 (Quick Reference)

| 反模式 | 一句话识别 | 修复 |
|---|---|---|
| 私有状态测试 | 读 `.privateField` | 测行为 |
| 过度 mock | mock 5+ 依赖 | 仅 mock 边界 |
| 不测实现 | `toHaveBeenCalledBefore` | 测结果 |
| 测试替身 | 用真实 DB / API | testcontainers 或 mock |
| 跳过遗留 | `test.skip` | 删除或修复 |
| 共享状态 | `beforeAll` 创建 | `beforeEach` 独立 |
| 不清理 | 无 `afterEach` | 显式清理 |
| 过度具体 | 断言 20 字段 | 断言关键字段 |
| 魔法等待 | `setTimeout(100)` | 等待真实信号 |

---

**最后更新**：2026-08-08