# 接缝寻找指南 (Seam Finding Guide)

> **所属技能**：`eas-dev-design`
> **目标**：教 Agent 在设计模块时识别"干净接缝"——接口边界 = 抽象边界

---

## 什么是接缝 (What is a Seam)

**接缝** = 模块与外界的接触面。Deep Module 的接缝 = 小且稳定。

**好接缝的特征**：

1. **稳定**：调用方依赖的接口不随实现变化
2. **最小**：只暴露必要的方法 / 类型
3. **可独立测试**：不依赖具体实现即可验证调用方逻辑

## 寻找接缝的 5 步法 (5-Step Method)

### Step 1：列出所有行为

```yaml
behaviors:
  - 全文搜索
  - 索引更新
  - 评分排序
  - 搜索结果缓存
  - 搜索历史记录
  - 搜索建议（自动补全）
  - 多语言支持
```

### Step 2：识别变化轴

```yaml
change_axes:
  - 搜索引擎替换（ES → 自研） → 影响所有搜索行为
  - 缓存策略变更（LRU → LFU） → 影响缓存
  - 多语言支持（中文 → 中英） → 影响分词 + 评分
  - 业务指标变化（搜索 → 推荐） → 影响排序
```

### Step 3：聚类（按变化轴分组）

```yaml
clusters:
  - cluster: 搜索核心
    members: [全文搜索, 索引更新, 评分排序]
    change_axis: 搜索引擎替换
  - cluster: 缓存
    members: [搜索结果缓存]
    change_axis: 缓存策略变更
  - cluster: i18n
    members: [多语言支持]
    change_axis: 多语言支持
```

### Step 4：定义接缝

```yaml
seams:
  - name: SearchService
    seam: 'search(query: string) → SearchResult[]'
    exposes: [1 方法, 1 返回类型]
    hides: [索引, 评分, 缓存, i18n]
    testable: 'mock search index; verify query → result mapping'
  - name: SearchIndex
    seam: 'index(doc: Document) → void; remove(id: string) → void'
    exposes: [2 方法]
    hides: [ES 内部 / 分片 / 副本]
    testable: '用 testcontainers 跑真实 ES'
```

### Step 5：验证（4 个核心问题）

- ✅ Q1 共享行为：被多个调用方需要的 = 进接缝
- ✅ Q2 独立变化：变化轴不同的 = 不同接缝
- ✅ Q3 接缝位置：接口最小 = 好接缝
- ✅ Q4 测试接口：可独立 mock = 好接缝

## 接缝反模式 (Seam Anti-Patterns)

| 反模式                | 问题                                              | 修复                                    |
| --------------------- | ------------------------------------------------- | --------------------------------------- |
| **暴露实现类**        | 调用方被迫依赖具体类（`ESEngine` / `RedisCache`） | 暴露抽象接口（`SearchIndex` / `Cache`） |
| **暴露配置对象**      | 调用方需懂所有配置项                              | 配置收敛到模块内部                      |
| **暴露状态**          | 模块状态被外部修改                                | 状态 MUST 私有；外部只能通过方法触发    |
| **多层 pass-through** | A → B → C 但 A 和 C 是同一概念                    | 合并 A 和 C；B 作为内部实现             |

## 接缝测试 (Seam Testing)

**两类测试**：

1. **Interface Test**：调用方视角测试（mock 模块）
   - 验证：调用方逻辑正确性
   - 不依赖：模块实现

2. **Seam Test**：模块自身测试（mock 调用方）
   - 验证：模块实现的正确性
   - 集成依赖：模块的外部依赖（DB / API / 第三方）

**两类测试都通过 = 抽象成功**：

```typescript
// Interface Test（调用方视角）
describe('TicketAPI', () => {
  it('returns 200 on search', async () => {
    const mockSearch = mock(SearchService).search.mockResolvedValue([]);
    const res = await TicketAPI.searchTickets('foo');
    expect(res.status).toBe(200);
  });
});

// Seam Test（模块自身视角）
describe('SearchService', () => {
  it('returns relevance-sorted results', async () => {
    const realIndex = await new TestES().start();
    const service = new SearchService(realIndex);
    const results = await service.search('foo');
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });
});
```

---

**最后更新**：2026-08-08
