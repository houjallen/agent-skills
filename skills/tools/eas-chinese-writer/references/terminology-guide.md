# 术语翻译完整指南 (Complete Terminology Translation Guide)

本文档提供 EASBot 项目中技术术语翻译的完整参考，确保文档和代码注释中术语使用的一致性。所有列出的术语在中文文档和代码注释中应保持英文原样，不应翻译。

## 技术概念 (Technical Concepts)

| 英文术语 | 中文说明 | 使用规则 |
|---------|---------|---------|
| Agent | 智能体 | 保持英文 |
| Skill | 技能 | 保持英文 |
| Script | 脚本 | 保持英文 |
| Workflow | 工作流 | 保持英文 |
| Hook | 钩子 | 保持英文 |
| Registry | 注册表 | 保持英文 |
| Tool | 工具 | 保持英文 |
| Session | 会话 | 保持英文 |
| Provider | 提供商 | 保持英文 |
| Gateway | 网关 | 保持英文 |

## 编程语言与技术栈 (Programming Languages & Tech Stack)

| 英文术语 | 中文说明 | 使用规则 |
|---------|---------|---------|
| TypeScript | - | 保持英文 |
| Python | - | 保持英文 |
| JavaScript | - | 保持英文 |
| Bash | - | 保持英文 |
| Shell | - | 保持英文 |
| Node.js | - | 保持英文 |
| ESM | ES Module | 保持英文 |
| CJS | CommonJS | 保持英文 |

## 开发工具 (Development Tools)

| 英文术语 | 中文说明 | 使用规则 |
|---------|---------|---------|
| JSON | JavaScript Object Notation | 保持英文 |
| YAML | YAML Ain't Markup Language | 保持英文 |
| API | Application Programming Interface | 保持英文 |
| CLI | Command Line Interface | 保持英文 |
| HTTP/HTTPS | HyperText Transfer Protocol | 保持英文 |
| URL | Uniform Resource Locator | 保持英文 |
| UUID | Universally Unique Identifier | 保持英文 |
| npm | Node Package Manager | 保持英文 |
| pnpm | - | 保持英文 |
| GitHub | - | 保持英文 |
| Git | - | 保持英文 |
| tsx | TypeScript Execute | 保持英文 |
| tsup | TypeScript Bundler | 保持英文 |
| biome | Code Formatter/Linter | 保持英文 |

## 数据库与存储 (Database & Storage)

| 英文术语 | 中文说明 | 使用规则 |
|---------|---------|---------|
| SQL | Structured Query Language | 保持英文 |
| NoSQL | Not Only SQL | 保持英文 |
| PostgreSQL | - | 保持英文 |
| SQLite | - | 保持英文 |
| KV | Key-Value | 保持英文 |
| Database | 数据库 | 在非技术语境可翻译 |

## 系统与协议 (Systems & Protocols)

| 英文术语 | 中文说明 | 使用规则 |
|---------|---------|---------|
| MCP | Model Context Protocol | 保持英文 |
| TCP/IP | Transmission Control Protocol/Internet Protocol | 保持英文 |
| WebSocket | - | 保持英文 |
| REST | Representational State Transfer | 保持英文 |
| GraphQL | - | 保持英文 |
| SSE | Server-Sent Events | 保持英文 |

## 人工智能相关 (AI Related Terms)

| 英文术语 | 中文说明 | 使用规则 |
|---------|---------|---------|
| LLM | Large Language Model | 保持英文 |
| AI | Artificial Intelligence | 保持英文 |
| ML | Machine Learning | 保持英文 |
| Prompt | 提示词 | 在技术语境下保持英文 |
| Token | 令牌 | 在 AI 语境下保持英文 |
| Embedding | 嵌入 | 在技术语境下保持英文 |
| Model | 模型 | 在 AI 语境下保持英文 |

## 系统架构 (System Architecture)

| 英文术语 | 中文说明 | 使用规则 |
|---------|---------|---------|
| Microservices | 微服务 | 在技术语境下保持英文 |
| Container | 容器 | 在技术语境下保持英文 |
| Docker | - | 保持英文 |
| Kubernetes | - | 保持英文，简称 K8s |
| Load Balancer | 负载均衡器 | 在技术语境下保持英文 |
| Service | 服务 | 在技术语境下保持英文 |

## 安全术语 (Security Terms)

| 英文术语 | 中文说明 | 使用规则 |
|---------|---------|---------|
| JWT | JSON Web Token | 保持英文 |
| OAuth | Open Authorization | 保持英文 |
| SSL/TLS | Secure Sockets Layer/Transport Layer Security | 保持英文 |
| SSH | Secure Shell | 保持英文 |
| VPN | Virtual Private Network | 保持英文 |
| PKI | Public Key Infrastructure | 保持英文 |

## 使用示例 (Usage Examples)

### ✅ 正确示例

```markdown
# Agent 系统设计 (Agent System Design)

Agent 是 EASBot 的核心组件，负责处理用户请求并协调 Skill 的执行。

## 核心功能 (Core Features)

- **任务调度**：Agent 根据优先级调度任务
- **Skill 管理**：Agent 管理所有可用的 Skill
- **API 集成**：Agent 通过 REST API 与外部系统交互
```

```typescript
/**
 * Agent 管理器
 *
 * 负责创建、管理和销毁 Agent 实例，提供 Agent 生命周期管理功能。
 * 支持多 Agent 并发运行，自动处理资源分配和清理。
 */
export class AgentManager {
  /**
   * 通过 MCP 协议创建新的 Agent 实例
   *
   * @param config - Agent 配置对象，包含类型、能力等
   * @returns 创建的 Agent 实例
   */
  createAgent(config: AgentConfig): IAgent {
    // 实现
  }
}
```

### ❌ 错误示例

```markdown
# 智能体系统设计
智能体是 EASBot 的核心组件，负责处理用户请求并协调技能的执行。
```

```typescript
/**
 * 智能体管理器
 *
 * 负责创建、管理和销毁智能体实例。
 */
export class AgentManager {
  // 错误：将 Agent 翻译为"智能体"
}
```

## 应用原则 (Application Principles)

### 一致性原则
- 在同一文档中，相同的术语应始终保持英文或中文的一致性
- 避免混用，如不要在一篇文档中同时出现"Agent"/"智能体"

### 上下文适应原则
- 在纯技术语境中，优先使用英文术语
- 在用户文档中，可考虑首次出现时加注中文解释，如："Agent（智能体）"

### 行业通用原则
- 采用行业内广泛接受的英文术语
- 避免创造非标准的中文翻译

## 注意事项 (Notes)

1. **首字母缩写**：所有首字母缩写（如 API、CLI、MCP 等）必须保持大写英文形式
2. **专有名词**：产品名、项目名、品牌名等专有名词应保持英文原样
3. **复合词**：包含技术术语的复合词也应保持英文部分不变，如 "Agent-based system"
4. **更新维护**：如有新增的技术术语，应及时更新本指南
