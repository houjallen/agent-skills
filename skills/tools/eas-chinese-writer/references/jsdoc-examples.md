# JSDoc 注释示例大全 (JSDoc Comment Examples)

本文档提供各种场景下的 JSDoc 中文注释示例，确保代码注释的规范性和完整性。

## 函数注释 (Function Comments)

### 基础函数
```typescript
/**
 * 计算两个数字的和
 *
 * @param a - 第一个数字
 * @param b - 第二个数字
 * @returns 两个数字的和
 */
function add(a: number, b: number): number {
  return a + b;
}
```

### 异步函数
```typescript
/**
 * 异步获取用户信息
 *
 * 从数据库中查询用户信息，如果用户不存在则返回 null。
 * 该函数会自动处理数据库连接错误和超时情况。
 *
 * @param userId - 用户唯一标识符
 * @param options - 查询选项，如是否包含敏感信息
 * @returns Promise<User | null> 用户信息或 null
 * @throws DatabaseError 当数据库连接失败时抛出
 * @throws TimeoutError 当查询超时时抛出
 */
async function getUser(userId: string, options?: GetUserOptions): Promise<User | null> {
  // 实现
}
```

### 带复杂参数的函数
```typescript
/**
 * 创建新的 Agent 实例
 *
 * 根据配置创建并初始化 Agent，支持多种 Agent 类型和自定义配置。
 * 创建过程中会自动注册必要的 Skill 和 Tool。
 *
 * @param config - Agent 配置对象
 * @param config.type - Agent 类型，如 'ask-agent'、'build-agent'
 * @param config.capabilities - Agent 能力列表，如 ['read', 'write']
 * @param config.options - 可选配置项
 * @param config.options.timeout - 操作超时时间（毫秒），默认 30000
 * @param config.options.retries - 失败重试次数，默认 3
 * @returns Promise<IAgent> 创建的 Agent 实例
 * @throws InvalidConfigError 当配置无效时抛出
 * @throws AgentCreationError 当 Agent 创建失败时抛出
 * @example
 * ```typescript
 * const agent = await createAgent({
 *   type: 'ask-agent',
 *   capabilities: ['read', 'write'],
 *   options: { timeout: 60000 }
 * });
 * ```
 */
async function createAgent(config: AgentConfig): Promise<IAgent> {
  // 实现
}
```

## 类注释 (Class Comments)

### 基础类
```typescript
/**
 * Agent 管理器
 *
 * 负责创建、管理和销毁 Agent 实例，提供 Agent 生命周期管理功能。
 * 支持多 Agent 并发运行，自动处理资源分配和清理。
 */
export class AgentManager {
  private agents: Map<string, IAgent> = new Map();

  /**
   * 创建新的 Agent 实例
   *
   * @param config - Agent 配置对象
   * @returns Promise<IAgent> 创建的 Agent 实例
   */
  async createAgent(config: AgentConfig): Promise<IAgent> {
    // 实现
  }

  /**
   * 获取指定 ID 的 Agent 实例
   *
   * @param agentId - Agent 唯一标识符
   * @returns Agent 实例，如果不存在则返回 undefined
   */
  getAgent(agentId: string): IAgent | undefined {
    return this.agents.get(agentId);
  }
}
```

### 抽象类
```typescript
/**
 * Agent 基类
 *
 * 所有 Agent 实现的抽象基类，定义了 Agent 的基本接口和生命周期。
 * 子类需要实现 execute 方法来定义具体的执行逻辑。
 */
export abstract class BaseAgent implements IAgent {
  /**
   * Agent 唯一标识符
   */
  protected readonly id: string;

  /**
   * 构造函数
   *
   * @param id - Agent 唯一标识符
   * @param config - Agent 配置对象
   */
  constructor(id: string, config: AgentConfig) {
    this.id = id;
    // 初始化
  }

  /**
   * 执行 Agent 任务
   *
   * 子类必须实现此方法以定义具体的执行逻辑。
   *
   * @param input - 任务输入
   * @returns Promise<ExecutionResult> 执行结果
   */
  abstract execute(input: TaskInput): Promise<ExecutionResult>;
}
```

## 接口注释 (Interface Comments)

### 基础接口
```typescript
/**
 * Agent 接口
 *
 * 定义了 Agent 的基本行为和生命周期方法。
 * 所有 Agent 实现都必须遵循此接口。
 */
export interface IAgent {
  /**
   * Agent 唯一标识符
   */
  readonly id: string;

  /**
   * Agent 名称
   */
  readonly name: string;

  /**
   * 启动 Agent
   *
   * 初始化 Agent 并准备接收任务。如果 Agent 已经在运行，则不做任何操作。
   *
   * @returns Promise<void>
   */
  start(): Promise<void>;

  /**
   * 停止 Agent
   *
   * 停止 Agent 并清理资源。如果 Agent 未运行，则不做任何操作。
   *
   * @returns Promise<void>
   */
  stop(): Promise<void>;
}
```

### 泛型接口
```typescript
/**
 * 工具接口
 *
 * 定义了工具的基本结构，包括名称、描述和执行方法。
 *
 * @template TInput - 工具输入类型
 * @template TOutput - 工具输出类型
 */
export interface ITool<TInput = unknown, TOutput = unknown> {
  /**
   * 工具名称
   */
  readonly name: string;

  /**
   * 工具描述
   */
  readonly description: string;

  /**
   * 执行工具
   *
   * @param input - 工具输入
   * @param context - 执行上下文
   * @returns Promise<TOutput> 工具输出
   */
  execute(input: TInput, context: ToolContext): Promise<TOutput>;
}
```

## 命名空间注释 (Namespace Comments)

```typescript
/**
 * Provider 模块：AI 模型提供商统一封装
 *
 * 负责多厂商 SDK 的加载与封装（OpenAI、Anthropic、Azure、Bedrock、Vertex 等）、
 * 模型解析与路由、自定义 Loader 与 Gateway 支持。内置厂商通过 BUNDLED_PROVIDERS 直接导入。
 */
export namespace Provider {
  /**
   * 获取指定提供商的 SDK 实例
   *
   * @param providerId - 提供商 ID，如 'openai'、'anthropic'
   * @param options - 提供商配置选项
   * @returns Promise<SDK> SDK 实例
   */
  export async function getProvider(providerId: string, options?: ProviderOptions): Promise<SDK> {
    // 实现
  }
}
```

## 类型别名注释 (Type Alias Comments)

```typescript
/**
 * Agent 配置对象
 *
 * 包含创建 Agent 所需的所有配置信息。
 */
export type AgentConfig = {
  /**
   * Agent 类型，如 'ask-agent'、'build-agent'
   */
  type: string;

  /**
   * Agent 能力列表，如 ['read', 'write', 'execute']
   */
  capabilities: AgentCapability[];

  /**
   * 可选配置项
   */
  options?: AgentOptions;
};

/**
 * Agent 能力枚举
 *
 * 定义了 Agent 可以执行的操作类型。
 */
export type AgentCapability = 'read' | 'write' | 'execute' | 'search' | 'analyze';
```

## 关键节点注释 (Critical Node Comments)

### 复杂逻辑说明
```typescript
// ripgrep 退出码：0=有匹配，1=无匹配，2=有错误（如损坏的符号链接，--no-messages 下仍可能产生输出）
// 仅在 exitCode=2 且无任何输出时视为失败；有输出时仍返回结果并附带"部分路径不可访问"提示
if (exitCode === 1 || (exitCode === 2 && !output.trim())) {
  return { matches: 0 };
}

// 按文件修改时间倒序，优先展示最近改动的文件
matches.sort((a, b) => b.modTime - a.modTime);
```

### 性能优化说明
```typescript
// 性能优化：使用缓存避免重复执行 which 命令
const cacheKey = `${command}:${options?.PATH || process.env.PATH}`;
if (whichCache.has(cacheKey)) {
  return whichCache.get(cacheKey)!;
}
```

### 错误处理说明
```typescript
// 错误处理：命令不存在时返回 null 而不是抛出异常
try {
  const result = execSync(`${whichCmd} ${command}`, { encoding: 'utf-8' });
  return result.trim();
} catch {
  // 命令不存在，缓存 null 结果
  whichCache.set(cacheKey, null);
  return null;
}
```

## 模块级注释 (Module-Level Comments)

```typescript
/**
 * Grep 工具模块
 *
 * 基于 ripgrep 实现文件内容正则搜索，支持按路径、glob 包含规则过滤。
 * 行为说明：权限通过 ctx.ask 申请；结果按文件修改时间倒序、单文件行数截断；兼容 Unix/Windows 行尾。
 */
import z from 'zod';
import { Bun, readableStreamToText } from '@/pkg';

/** 单行展示最大字符数，超出部分截断并追加 "..." */
const MAX_LINE_LENGTH = 2000;
```

## 最佳实践 (Best Practices)

1. **完整性**：为所有公共 API 提供完整的 JSDoc 注释
2. **准确性**：确保注释与代码实现一致，及时更新
3. **清晰性**：使用简洁明了的中文，避免冗长描述
4. **技术术语**：技术术语保持英文，如 Agent、Skill、API
5. **示例代码**：复杂函数提供使用示例
6. **错误说明**：说明可能抛出的异常和错误情况
7. **参数说明**：详细说明每个参数的含义和约束
