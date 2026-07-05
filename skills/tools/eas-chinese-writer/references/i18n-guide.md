# i18n 国际化输出规范 (i18n Internationalization Output Guide)

本文档提供 EASBot 项目中 i18n 国际化输出的完整规范，确保所有用户可见的输出都通过国际化接口。

## 先定义后使用原则 (Define-First Principle)

**在 log、console 等任何面向用户的输出前，必须先在当前子项目的 `locales` 中定义该文案，且中英文都要定义。**

1. **先定义**：在 `src/i18n/locales/zh-CN.ts` 与 `src/i18n/locales/en-US.ts` 中为同一 key 分别添加中文、英文文案。
2. **后使用**：在代码中通过 `t(key)` 或 `formatLog(key)` 输出，禁止直接使用 `console.log`、`logger.info` 等传入硬编码字符串。
3. **双语文案**：每个 key 必须在 zh-CN 和 en-US 中都有对应条目，避免缺语言导致回退到 key 或英文。

## i18n 目录结构 (Directory Structure)

每个子项目（如 eas-agent、agent、eas-cli）的 i18n 采用统一结构：

```
<子项目>/src/i18n/
├── config.ts          # 语言配置、TranslationResources 类型、registerI18nResources
├── translator.ts     # translate / t、formatLog，并加载 locales
├── index.ts          # 导出
├── languages.json    # 支持语言列表
└── locales/
    ├── zh-CN.ts      # 中文文案：translation: { 'key': '中文' }
    └── en-US.ts      # 英文文案：translation: { 'key': 'English' }
```

- 所有面向用户的字符串只存在于 `locales/zh-CN.ts` 和 `locales/en-US.ts` 的 `translation` 中。
- 模板变量使用 `{{name}}` 形式，如 `'agent.init.error': 'Agent 初始化失败：{{error}}'`。

## 核心原则 (Core Principles)

- **先定义后使用**：先在各子项目 `src/i18n/locales` 中定义 key 及中英文文案，再在 log/console 中使用 `t(key)`。
- **统一日志器**：所有 `console.*` 调用必须通过项目自定义的 i18n Logger（目前支持 `zh-CN`、`en-US`）。
- **消息键命名**：使用 `模块.动作.结果` 风格，如 `agent.init.success`。
- **结构化输出**：日志函数默认输出 `{ level, message, timestamp, context }`。

## 消息键命名规范 (Message Key Naming Standards)

### 命名格式
使用 `模块.动作.结果` 格式：

```
{module}.{action}.{result}
```

### 示例

| 消息键 | 中文 | 英文 |
|--------|------|------|
| `agent.init.success` | Agent 初始化成功 | Agent initialized successfully |
| `agent.init.error` | Agent 初始化失败 | Agent initialization failed |
| `skill.load.success` | Skill 加载成功 | Skill loaded successfully |
| `skill.load.error` | Skill 加载失败：{error} | Failed to load skill: {error} |
| `session.create.complete` | 会话创建完成 | Session created successfully |
| `session.create.error` | 会话创建失败 | Failed to create session |
| `tool.execute.success` | 工具执行成功 | Tool executed successfully |
| `tool.execute.error` | 工具执行失败：{error} | Tool execution failed: {error} |

### 命名规则

1. **模块名**：使用小写，多个单词用点分隔，如 `agent.manager`
2. **动作名**：使用动词，如 `init`、`load`、`create`、`execute`
3. **结果名**：使用名词，如 `success`、`error`、`complete`、`warning`

## 消息字典结构 (Message Dictionary Structure)

每个子项目在 `locales/zh-CN.ts` 与 `locales/en-US.ts` 中分别导出 `TranslationResources`，键名一致，模板变量使用 `{{var}}`。

### zh-CN.ts 示例
```typescript
import type { TranslationResources } from '../config';

const zhCNTranslations: TranslationResources = {
  translation: {
    'agent.init.success': 'Agent 初始化成功',
    'agent.init.error': 'Agent 初始化失败：{{error}}',
    'skill.load.success': 'Skill 加载成功',
    'skill.load.error': 'Skill 加载失败：{{error}}',
  },
};
export default zhCNTranslations;
```

### en-US.ts 示例
```typescript
import type { TranslationResources } from '../config';

const enUSTranslations: TranslationResources = {
  translation: {
    'agent.init.success': 'Agent initialized successfully',
    'agent.init.error': 'Agent initialization failed: {{error}}',
    'skill.load.success': 'Skill loaded successfully',
    'skill.load.error': 'Failed to load skill: {{error}}',
  },
};
export default enUSTranslations;
```

### 带参数的消息（双语言同 key）
同一 key 在 zh-CN 与 en-US 中均需定义，变量用 `{{name}}`：

| key | zh-CN | en-US |
|-----|--------|--------|
| `agent.create.success` | Agent {{agentId}} 创建成功 | Agent {{agentId}} created successfully |
| `session.update.complete` | 会话 {{sessionId}} 已更新，共 {{count}} 条消息 | Session {{sessionId}} updated with {{count}} messages |

## 使用示例 (Usage Examples)

### 基础使用
```typescript
import { Log } from '@/util/log';
import { t } from '@/i18n';

// ✅ 正确：使用 i18n 接口
const log = Log.create({ service: 'agent' });
log.info(t('agent.init.success'), { agentId: 'agent-123' });

// ❌ 错误：直接使用 console.log 输出中文
console.log('Agent 初始化成功');
```

### 带参数的消息
```typescript
import { Log } from '@/util/log';
import { t } from '@/i18n';

// ✅ 正确：使用参数化消息
const log = Log.create({ service: 'agent' });
log.error(t('agent.create.error', {
  agentId: 'agent-123',
  error: error.message
}), { error });

// ❌ 错误：字符串拼接
console.log(`Agent ${agentId} 创建失败：${error.message}`);
```

### 结构化日志
```typescript
import { Log } from '@/util/log';
import { t } from '@/i18n';

// ✅ 正确：结构化日志输出
const log = Log.create({ service: 'session' });
log.info(t('session.create.complete'), {
  sessionId: 'session-123',
  timestamp: Date.now(),
  context: {
    userId: 'user-456',
    agentId: 'agent-789',
  },
});

// 输出格式：
// {
//   level: 'info',
//   message: '会话创建完成',
//   timestamp: 1234567890,
//   context: {
//     sessionId: 'session-123',
//     userId: 'user-456',
//     agentId: 'agent-789',
//   }
// }
```

## 日志级别 (Log Levels)

### 级别定义
```typescript
enum LogLevel {
  DEBUG = 'debug',    // 详细调试信息，仅在开发环境启用
  INFO = 'info',      // 重要的程序状态变化
  WARN = 'warn',      // 潜在问题，不影响程序执行
  ERROR = 'error',    // 错误事件，会影响程序功能
}
```

### 使用示例
```typescript
import { Log } from '@/util/log';
import { t } from '@/i18n';

// Debug：详细调试信息
const log = Log.create({ service: 'agent' });
log.debug(t('agent.state.transition'), {
  from: 'idle',
  to: 'running',
  agentId: 'agent-123',
});

// Info：重要状态变化
log.info(t('agent.init.success'), { agentId: 'agent-123' });

// Warn：潜在问题
log.warn(t('skill.deprecated.warning'), {
  skillName: 'old-skill',
  replacement: 'new-skill',
});

// Error：错误事件
log.error(t('agent.execute.error'), {
  agentId: 'agent-123',
  error: error.message,
}, { error });
```

## 常见模式 (Common Patterns)

### 操作开始/完成
```typescript
// 操作开始
const log = Log.create({ service: 'agent' });
log.info(t('agent.start.begin'), { agentId });

// 操作完成
log.info(t('agent.start.complete'), { agentId, duration: elapsedTime });
```

### 错误处理
```typescript
try {
  await agent.execute(task);
  const log = Log.create({ service: 'agent' });
  log.info(t('agent.execute.success'), { agentId, taskId });
} catch (error) {
  log.error(t('agent.execute.error'), {
    agentId,
    taskId,
    error: error.message,
  }, { error });
}
```

### 资源加载
```typescript
const log = Log.create({ service: 'skill' });
log.info(t('skill.load.begin'), { skillName });
try {
  const skill = await loadSkill(skillName);
  log.info(t('skill.load.success'), { skillName });
  return skill;
} catch (error) {
  log.error(t('skill.load.error'), {
    skillName,
    error: error.message,
  }, { error });
  throw error;
}
```

## 正确流程：新增输出时 (Correct Workflow for New Output)

1. **确定 key**：按 `模块.动作.结果` 命名，如 `mymodule.action.success`。
2. **在 locales 中定义**：
   - 在 `src/i18n/locales/zh-CN.ts` 的 `translation` 中增加：`'mymodule.action.success': '中文文案'`。
   - 在 `src/i18n/locales/en-US.ts` 的 `translation` 中增加：`'mymodule.action.success': 'English text'`。
   - 若带参数，使用 `{{paramName}}`，且两处 key 与变量名一致。
3. **在代码中使用**：通过 `t('mymodule.action.success')` 或 `formatLog('mymodule.action.success', { vars })` 输出，禁止先用 `console.log` 或 logger 直接打字符串再补 locales。

## 注意事项 (Notes)

1. **先定义后使用**：未在 locales 中定义过的 key 不得在 log/console 中使用。
2. **中英文都要定义**：zh-CN.ts 与 en-US.ts 中同一 key 必须同时存在。
3. **避免硬编码**：所有用户可见的文本都通过 i18n 接口。
4. **参数化消息**：使用 `{{var}}` 与 `t(key, { vars })`，禁止拼接字符串再传给 logger。
5. **结构化日志**：使用结构化日志格式，便于后续分析。

## 迁移指南 (Migration Guide)

### 从 console.log 迁移
```typescript
// ❌ 旧代码
console.log('Agent 初始化成功');
console.error(`Agent ${agentId} 初始化失败：${error.message}`);

// ✅ 新代码
import { Log } from '@/util/log';
const log = Log.create({ service: 'agent' });
log.info(t('agent.init.success'), { agentId });
log.error(t('agent.init.error'), {
  agentId,
  error: error.message,
}, { error });
```

### 从字符串拼接迁移
```typescript
// ❌ 旧代码
const message = `会话 ${sessionId} 已更新，共 ${count} 条消息`;
console.log(message);

// ✅ 新代码
import { Log } from '@/util/log';
const log = Log.create({ service: 'session' });
log.info(t('session.update.complete'), {
  sessionId,
  count,
});
```
