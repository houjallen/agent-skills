# 红-绿-重构详解 (Red-Green-Refactor Details)

> **所属技能**：`eas-dev-tdd`
> **目标**：详细解释 TDD 3 步循环的落地步骤

---

## Step 1: 红灯 (Red) - 写失败测试

### 动作清单

1. **读任务验收**：
   - 打开 tasks.md 找到当前任务
   - 读 `acceptance_steps` 字段
   - 把每条 acceptance 翻译为测试用例

2. **写测试**：
   - 在 `tests/` 或同目录创建 `.test.ts` 文件
   - 使用 Arrange-Act-Assert（AAA）模式
   - 测试名描述行为（"should return empty array when no tickets match"）

3. **运行测试 → 失败**：

   ```bash
   npm test -- <test-file>
   # 或
   pnpm test <test-file>
   ```

4. **验证失败原因**：
   - ✅ 正确失败：`TypeError: searchService.search is not a function`
   - ❌ 错误失败：`SyntaxError: Unexpected token`（测试代码问题）
   - ❌ 错误失败：`Cannot find module './search-service'`（import 路径问题）

### 失败模式

| 失败类型                    | 是否红灯成功          |
| --------------------------- | --------------------- |
| "function not implemented"  | ✅ 成功               |
| "returned undefined"        | ✅ 成功               |
| "expected X, got undefined" | ✅ 成功               |
| 语法错误                    | ❌ 修复语法后重试     |
| Import 错误                 | ❌ 修复 import 后重试 |
| 测试运行前崩溃              | ❌ 修复配置后重试     |

### Commit 模板

```
test(<scope>): red light for <feature>

写失败测试，覆盖 acceptance:
- <AC-1>
- <AC-2>

测试失败原因：<具体错误>
```

## Step 2: 绿灯 (Green) - 写最小实现

### 动作清单

1. **写最小代码**：
   - 仅写让测试通过的最少代码
   - 不考虑性能 / 优雅性（重构阶段处理）
   - 必要时可写"硬编码"实现

2. **运行测试 → 通过**：

   ```bash
   npm test -- <test-file>
   ```

3. **不要扩展**：
   - ❌ 不要"顺便"加其他功能
   - ❌ 不要"顺手"重构
   - ✅ 仅写必要的代码

### 示例：从红灯到绿灯

**红灯测试**：

```typescript
test('should return empty array when no tickets match', () => {
  const service = new SearchService();
  expect(service.search('xxx')).toEqual([]);
});
```

**最小实现**：

```typescript
class SearchService {
  search(query: string): Ticket[] {
    return []; // 最小：直接返回空数组
  }
}
```

**绿灯测试**：✅ 通过

### Commit 模板

```
feat(<scope>): green light for <feature>

最小实现：<一句话描述>
- <具体改动>

所有红灯测试通过。
```

## Step 3: 重构 (Refactor) - 改进代码

### 动作清单

1. **识别改进点**：
   - 命名不清晰？
   - 函数过长？
   - 重复代码？
   - magic number / string？

2. **重构**：
   - 仅改结构，**不改行为**
   - 改一行 → 运行测试 → 改下一行
   - 一次只做一种重构

3. **运行测试 → 仍通过**：
   - 重构后 MUST 仍全绿
   - 如失败 → 回滚（重构 ≠ 改逻辑）

### 常见重构动作

| 重构     | 说明                    | 验证     |
| -------- | ----------------------- | -------- |
| 提取函数 | 长函数拆为多个短函数    | 测试全绿 |
| 重命名   | 变量 / 函数 / 类改名    | 测试全绿 |
| 提取常量 | magic number → 命名常量 | 测试全绿 |
| 移动代码 | 函数 / 类移到更合适位置 | 测试全绿 |
| 内联变量 | 单次使用的临时变量内联  | 测试全绿 |

### 反模式

- ❌ 重构阶段改逻辑（如改 if 条件）→ 应开新任务
- ❌ 重构阶段加功能 → 应开新任务
- ❌ 重构后不运行测试 → 灾难

### Commit 模板

```
refactor(<scope>): <具体改进>

改进内容：
- <改进 1>
- <改进 2>

所有测试仍通过；行为不变。
```

## 完整循环示例 (Full Cycle Example)

### 任务：添加 SearchService.search

**Step 1: 红灯**

```typescript
// tests/services/search-service.test.ts (新建)
import { SearchService } from '../../src/services/search-service';

describe('SearchService', () => {
  test('should return empty array when no tickets match', () => {
    const service = new SearchService();
    expect(service.search('xxx')).toEqual([]);
  });
});
```

```bash
$ npm test
FAIL tests/services/search-service.test.ts
  SearchService > should return empty array when no tickets match
  ● Cannot find module '../../src/services/search-service'
```

✅ 红灯成功 → commit `test(search): red light for SearchService.search`

**Step 2: 绿灯**

```typescript
// src/services/search-service.ts (新建)
import { Ticket } from '../types';

export class SearchService {
  search(query: string): Ticket[] {
    return []; // 最小实现
  }
}
```

```bash
$ npm test
PASS tests/services/search-service.test.ts
```

✅ 绿灯成功 → commit `feat(search): green light for SearchService.search`

**Step 3: 重构**

```typescript
// 重构：把方法签名提取到接口；加注释
import { Ticket } from '../types';

export interface Searchable {
  search(query: string): Ticket[];
}

export class SearchService implements Searchable {
  /** 搜索工单；当前为 stub 实现 */
  search(query: string): Ticket[] {
    return [];
  }
}
```

```bash
$ npm test
PASS tests/services/search-service.test.ts
```

✅ 重构成功 → commit `refactor(search): extract Searchable interface`

---

## 红-绿-重构的反模式总览

| ❌ 不要             | ✅ 应该            |
| ------------------- | ------------------ |
| 跳过红灯阶段        | 红灯验证测试有效性 |
| 跳过绿灯最小约束    | YAGNI              |
| 重构阶段改逻辑      | 重构 = 仅改结构    |
| 一次做太多步        | 一次一步；每步验证 |
| 不运行测试就 commit | 每步后 MUST 测试   |

---

**最后更新**：2026-08-08
