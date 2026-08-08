# 修症状反模式库 (Symptom-Fixing Anti-Patterns)

> **所属技能**：`eas-dev-diagnose`
> **目标**：列出常见的"修症状 ≠ 修根因"反模式

---

## 反模式 1: Catch and Log（捕获日志）

**症状代码**：

```typescript
try {
  await esClient.search(query);
} catch (e) {
  logger.error("ES search failed", e);
  throw new InternalServerError("search failed");
}
```

**问题**：把 ES 错误转为 500 返回；用户仍看到 500；根因（query 未转义）未修。

**修复**：转义 query（消除 ES 解析失败）

```typescript
const safeQuery = escapeQuery(query);  // 根因修复
await esClient.search(safeQuery);
```

---

## 反模式 2: Restart / Reset（重启重置）

**症状代码**：

```bash
# "重启就好了" 是症状修复
kubectl rollout restart deployment/api
```

**问题**：临时绕过 bug；下次仍出现；根因未修。

**修复**：定位根因；持久修复。

**例外**：已知根因为"内存泄漏"等状态问题 → 重启是临时止血，可接受；但仍需后续根因修复。

---

## 反模式 3: Increase Timeout（增加超时）

**症状代码**：

```typescript
// "超时了？那就调大点"
const result = await queryDatabase({ timeout: 60000 });  // 60s
```

**问题**：未解决"为什么慢"；下次仍可能超时。

**修复**：定位"为什么慢"——

- N+1 查询？→ 加 join / 批量
- 缺索引？→ 加索引
- 数据量太大？→ 分页

---

## 反模式 4: Disable Validation（关闭校验）

**症状代码**：

```typescript
// "校验太严格？那就关掉"
const service = new Service({ validateInput: false });
```

**问题**：无效输入进入系统；下游崩溃；根因未修。

**修复**：修复校验逻辑（允许合法输入；拒绝非法输入）而非关闭校验。

---

## 反模式 5: Mock Away the Problem（Mock 掉问题）

**症状代码**：

```typescript
// "ES 总是失败？那就 mock 掉"
const searchService = {
  search: async () => mockResults,
};
```

**问题**：生产代码仍坏；测试看起来"通过"。

**修复**：修复 ES 集成问题。

---

## 反模式 6: Add Fallback（加 Fallback）

**症状代码**：

```typescript
try {
  return await primaryService.search(query);
} catch {
  return await fallbackService.search(query);  // 用旧实现兜底
}
```

**问题**：bug 仍存在；只是不暴露给用户；监控告警失效。

**修复**：修主路径；移除 fallback。

**例外**：已知外部依赖不稳定 → fallback 是合理设计；但仍需记录告警。

---

## 反模式 7: Retry Forever（无限重试）

**症状代码**：

```typescript
// "失败了就重试"
while (true) {
  try {
    return await operation();
  } catch (e) {
    // 无限重试
  }
}
```

**问题**：耗尽资源；掩盖根因。

**修复**：限制重试次数 + 指数退避 + 失败告警 + 根因修复。

---

## 反模式 8: Skip the Test（跳过测试）

**症状代码**：

```typescript
test.skip("flaky test", () => {
  // 跳过
});
```

**问题**：bug 仍存在；测试套件"绿"但生产"红"。

**修复**：修复测试 / 修复被测代码；NEVER 跳过。

---

## 反模式 9: Comment Out（注释掉代码）

**症状代码**：

```typescript
// if (invalidInput) {
//   throw new Error("invalid");
// }
```

**问题**：校验失效；用户提交无效输入。

**修复**：修复校验逻辑。

---

## 反模式 10: Feature Flag Off（关闭特性）

**症状代码**：

```typescript
// "有 bug？那就关掉这个特性"
if (featureFlags.newSearchEnabled) {
  return await newSearchImplementation();
} else {
  return await legacySearch();
}
```

**问题**：用户无法使用新功能；bug 仍存在；技术债累积。

**修复**：修 bug；移除 legacy fallback。

---

## 反模式速查表 (Quick Reference)

| 反模式 | 一句话识别 | 修复 |
|---|---|---|
| Catch and Log | try/catch 转 InternalError | 消除错误原因 |
| Restart | "重启就好了" | 找根因 |
| Increase Timeout | 超时 → 调大 | 找为什么慢 |
| Disable Validation | validateInput: false | 修校验逻辑 |
| Mock Away | mock 掉坏路径 | 修真实实现 |
| Add Fallback | 加 try/catch fallback | 修主路径 |
| Retry Forever | while(true) retry | 限重试 + 修根因 |
| Skip Test | test.skip | 修测试或代码 |
| Comment Out | `// if (...)` | 修逻辑 |
| Feature Flag Off | 加 flag 跳过 | 修 bug + 删 legacy |

## 红旗信号 (Red Flags)

如发现以下任一信号，立刻警觉"我在修症状"：

- 🚩 改动没让 bug 不再发生，只是让 bug 不暴露
- 🚩 改动后无法解释"为什么这能修"
- 🚩 改动让监控 / 告警失效
- 🚩 改动增加系统复杂度（兜底逻辑 / 多层 try/catch）
- 🚩 改动让生产行为与测试结果不一致

---

**最后更新**：2026-08-08