---
name: eas-chinese-writer
description: 该技能应在需要编写中文文档、翻译英文内容到中文、或在代码中添加规范的中文注释（JSDoc）时使用。该技能提供专业技术名词保留英文、文档与代码中文使用规范、i18n 输出规范等指导，确保中文文档和代码注释的准确性与一致性。
category: tool
---

# EAS Chinese Writer - 中文文档与注释编写规范 (Chinese Documentation and Comment Writing Guidelines)

## 概述 (Overview)

eas-chinese-writer 提供 EASBot 项目中中文文档编写、英文翻译和代码中文注释的完整规范。该技能确保所有中文内容遵循一致的术语翻译原则、JSDoc 注释规范和 i18n 输出标准，专业技术名词保持英文原样，提升代码可读性和文档质量。

## 何时使用 (When to Use)

该技能应在以下情况使用：
- 编写或更新 Markdown、README 等中文文档
- 将英文文档或内容翻译为中文
- 为代码添加 JSDoc 中文注释
- 在关键代码节点完善中文注释说明
- 实现代码输出的 i18n 国际化规范
- 需要确保技术术语翻译一致性时

## 快速参考 (Quick Reference)

- **技术名词保留英文**：Agent、Skill、Script、API、CLI、MCP 等术语保持英文
- **文档使用中文**：Markdown 文档主体使用中文，标题采用双语格式
- **JSDoc 中文注释**：函数、类、接口使用完整中文 JSDoc，技术术语保留英文
- **关键节点注释**：复杂逻辑、算法、业务规则处补充中文说明
- **i18n 先定义后使用**：在 log/console 输出前，先在子项目 `src/i18n/locales/zh-CN.ts` 与 `en-US.ts` 中定义同一 key 的中英文文案，再通过 `t(key)` 使用

## 核心原则 (Core Principles)

### 1. 术语翻译规范 (Terminology Translation Standards)

专业技术名词在中文文档中应保持英文原样，确保技术准确性和行业通用性。

**核心原则**
- **一致性原则**：同一文档中相同术语保持英文或中文的一致性
- **上下文适应**：纯技术语境优先使用英文术语；用户文档可首次出现时加注中文解释
- **行业通用**：采用行业内广泛接受的英文术语，避免创造非标准翻译

**完整术语列表**：请参阅 [术语翻译完整指南](references/terminology-guide.md) 获取所有应保持英文的技术术语及其使用规则。

### 2. 文档编写规范 (Documentation Writing Standards)

#### Markdown 文档
- **标题格式**：使用双语标题，中文标题后跟括号包起来的英文标题
  ```markdown
  ## 概述 (Overview)
  ## 何时使用 (When to Use)
  ```
- **内容语言**：文档主体使用中文，技术术语保持英文
- **代码示例**：代码注释使用中文，console.log 等输出保持英文
- **结构清晰**：使用适当的标题层级，保持文档结构清晰

#### 文档示例
```markdown
# Agent 系统设计 (Agent System Design)

## 概述 (Overview)

Agent 是 EASBot 的核心组件，负责处理用户请求并协调 Skill 的执行。

## 核心功能 (Core Features)

- **任务调度**：Agent 根据优先级调度任务
- **Skill 管理**：Agent 管理所有可用的 Skill
```

### 3. JSDoc 注释规范 (JSDoc Comment Standards)

代码注释必须使用中文，技术术语保持英文。为函数、类、接口、命名空间等提供完整的 JSDoc 注释。

**核心要求**
- **文件级注释**：使用 JSDoc 说明模块职责和要点
- **函数注释**：使用完整 JSDoc，包含参数、返回值、异常、示例
- **关键逻辑**：使用单行 `//` 说明"做什么/为什么"
- **类型定义**：为复杂类型添加中文说明

**完整示例**：请参阅 [JSDoc 注释示例大全](references/jsdoc-examples.md) 获取各种场景下的注释示例和最佳实践。

### 4. i18n 输出规范 (i18n Output Standards)

所有面向用户的输出必须通过 i18n 接口，且**先定义后使用**：先在子项目 `src/i18n/locales` 中定义 key 及中英文文案，再在代码中用 `t(key)` 输出。

**核心要求**
- **先定义后使用**：在 log、console 等输出前，先在 `src/i18n/locales/zh-CN.ts` 与 `en-US.ts` 中为同一 key 添加中英文文案，再使用 `t(key)` 或 `formatLog(key)`
- **中英文都要定义**：每个 key 在 zh-CN 与 en-US 中均需有对应条目
- **统一日志器**：所有 `console.*` 调用必须通过项目 i18n Logger（支持 `zh-CN`、`en-US`）
- **消息键命名**：使用 `模块.动作.结果` 风格，如 `agent.init.success`

**完整规范**：请参阅 [i18n 国际化输出规范](references/i18n-guide.md) 获取目录结构、先定义后使用流程、消息键命名与迁移指南。

### 5. 代码注释最佳实践 (Code Comment Best Practices)

#### 何时添加注释
- **复杂业务逻辑**：解释"为什么"而不仅仅是"做什么"
- **算法与性能**：记录算法复杂度、性能考虑
- **假设与限制**：记录重要的假设和限制条件
- **关键决策**：说明为什么选择特定实现方式

#### 注释风格
- **文件级注释**：使用 JSDoc 说明模块职责和要点
- **函数注释**：使用完整 JSDoc，包含参数、返回值、异常、示例
- **关键逻辑**：使用单行 `//` 说明"做什么/为什么"
- **类型定义**：为复杂类型添加中文说明

#### 避免的注释
- ❌ 重复代码内容的注释
- ❌ 错误的注释（代码更新但注释未更新）
- ❌ 调试用的临时注释
- ❌ 中英混杂的注释（应使用完整中文，技术术语保留英文）

## 实现指南 (Implementation Guidelines)

### 文档编写流程
1. **确定术语**：查阅 [术语翻译完整指南](references/terminology-guide.md) 确认技术术语
2. **编写标题**：使用双语标题格式（中文标题后跟括号包起来的英文标题）
3. **编写内容**：使用中文，技术术语保持英文
4. **检查一致性**：确保术语使用一致

### 代码注释流程
1. **文件级注释**：为模块/命名空间添加 JSDoc 说明职责
2. **函数注释**：为公共函数添加完整 JSDoc（参考 [JSDoc 注释示例大全](references/jsdoc-examples.md)）
3. **关键逻辑**：在复杂逻辑处添加中文说明
4. **类型注释**：为复杂类型添加中文说明

### 翻译流程
1. **识别术语**：识别需要保持英文的技术术语（参考 [术语翻译完整指南](references/terminology-guide.md)）
2. **翻译内容**：翻译非技术术语部分
3. **保持格式**：保持原文档的结构和格式
4. **检查质量**：确保翻译准确、术语一致

### i18n 实现流程
1. **定义消息键**：使用 `模块.动作.结果` 格式（参考 [i18n 国际化输出规范](references/i18n-guide.md)）
2. **创建消息字典**：在消息字典内提供中英文文案
3. **替换输出**：将所有 `console.*` 调用替换为 i18n Logger
4. **测试验证**：确保中英文输出正确

## 常见错误 (Common Mistakes)

### ❌ 错误示例
```markdown
# 智能体系统设计
智能体是 EASBot 的核心组件，负责处理用户请求。
```

### ✅ 正确示例
```markdown
# Agent 系统设计 (Agent System Design)
Agent 是 EASBot 的核心组件，负责处理用户请求。
```

### ❌ 错误示例
```typescript
// User login function
function loginUser() {
  // 实现
}
```

### ✅ 正确示例
```typescript
/**
 * 处理用户登录请求并验证凭据
 *
 * @param credentials - 包含用户名和密码的凭据对象
 * @returns Promise<UserSession> 登录成功的用户会话信息
 */
async function loginUser(credentials: Credentials): Promise<UserSession> {
  // 实现
}
```

## 参考资料 (References)

- [术语翻译完整指南](references/terminology-guide.md) - 技术术语保持英文的完整列表和使用规则
- [JSDoc 注释示例大全](references/jsdoc-examples.md) - 各种场景下的 JSDoc 中文注释示例和最佳实践
- [i18n 国际化输出规范](references/i18n-guide.md) - 消息键命名、消息字典结构、使用示例和迁移指南
