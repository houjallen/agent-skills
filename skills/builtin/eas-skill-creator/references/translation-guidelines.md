# EASBot 项目文档翻译规范 (Translation Guidelines for EASBot Projects)

## 概述 (Overview)

本文档规定了在 EASBot 项目的中文文档中，哪些术语和技术名词应当保持英文原样，以确保技术准确性和行业通用性。

## 保持英文的术语列表 (Terms to Keep in English)

以下术语在中文文档中应当保持英文原样，不应翻译：

### 技术概念 (Technical Concepts)
- **Agent** - 智能体
- **Skill** - 技能
- **Script** - 脚本
- **Workflow** - 工作流
- **Hook** - 钩子
- **Registry** - 注册表

### 编程语言和技术栈 (Programming Languages & Tech Stack)
- **TypeScript** - 不翻译为"类型脚本"
- **Python** - 不翻译
- **JavaScript** - 不翻译为"JavaScript脚本"
- **Bash** - 不翻译
- **Shell** - 不翻译
- **Node.js** - 不翻译

### 开发工具 (Development Tools)
- **JSON** - JavaScript Object Notation
- **YAML** - YAML Ain't Markup Language
- **API** - Application Programming Interface
- **CLI** - Command Line Interface
- **HTTP/HTTPS** - HyperText Transfer Protocol
- **URL** - Uniform Resource Locator
- **UUID** - Universally Unique Identifier
- **npm** - Node Package Manager
- **pnpm** - 不翻译
- **GitHub** - 不翻译
- **Git** - 不翻译

### 数据库和存储 (Database & Storage)
- **SQL** - Structured Query Language
- **NoSQL** - Not Only SQL
- **PostgreSQL** - 不翻译
- **SQLite** - 不翻译
- **KV** - Key-Value

### 系统和协议 (Systems & Protocols)
- **MCP** - Model Context Protocol
- **TCP/IP** - Transmission Control Protocol/Internet Protocol
- **WebSocket** - 不翻译
- **REST** - Representational State Transfer
- **GraphQL** - 不翻译

### 人工智能相关 (AI Related Terms)
- **LLM** - Large Language Model
- **AI** - Artificial Intelligence
- **ML** - Machine Learning
- **Prompt** - 提示词（在技术语境下保持英文）
- **Token** - 在AI语境下保持英文
- **Embedding** - 嵌入（但在技术语境下保持英文）

### 系统架构 (System Architecture)
- **Microservices** - 微服务（但在技术语境下保持英文）
- **Container** - 容器（但在技术语境下保持英文）
- **Docker** - 不翻译
- **Kubernetes** - 不翻译，简称 K8s
- **Load Balancer** - 负载均衡器（但在技术语境下保持英文）

### 安全术语 (Security Terms)
- **JWT** - JSON Web Token
- **OAuth** - Open Authorization
- **SSL/TLS** - Secure Sockets Layer/Transport Layer Security
- **SSH** - Secure Shell
- **VPN** - Virtual Private Network
- **PKI** - Public Key Infrastructure

## 应用原则 (Application Principles)

### 1. 一致性原则 (Consistency Principle)
- 在同一文档中，相同的术语应始终保持英文或中文的一致性
- 避免混用，如不要在一篇文档中同时出现"Agent"/"智能体"

### 2. 上下文适应原则 (Context Adaptation Principle)
- 在纯技术语境中，优先使用英文术语
- 在用户文档中，可考虑首次出现时加注中文解释，如："Agent（智能体）"

### 3. 行业通用原则 (Industry Standard Principle)
- 采用行业内广泛接受的英文术语
- 避免创造非标准的中文翻译

## 示例 (Examples)

### 正确做法 (Correct Examples)
- ✅ "Agent 是 EASBot 的核心组件"
- ✅ "创建新的 Skill 需要遵循标准模板"
- ✅ "运行 TypeScript 脚本使用 tsx 命令"

### 错误做法 (Incorrect Examples)
- ❌ "智能体是 EASBot 的核心组件" (应该保持 Agent)
- ❌ "创建新的技能需要遵循标准模板" (应该保持 Skill)
- ❌ "运行类型脚本脚本使用 tsx 命令" (应该保持 TypeScript)

## 注意事项 (Notes)

1. **首字母缩写**：所有首字母缩写（如 API、CLI、MCP 等）必须保持大写英文形式
2. **专有名词**：产品名、项目名、品牌名等专有名词应保持英文原样
3. **复合词**：包含技术术语的复合词也应保持英文部分不变，如 "Agent-based system"
4. **更新维护**：如有新增的技术术语，应及时更新本指南

## 引用说明 (Reference Note)

在其他文档中可以这样引用本指南：
"根据 [translation-guidelines.md](./translation-guidelines.md)，本文档中的技术术语遵循英文保持原则。"