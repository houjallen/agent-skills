/**
 * packages/agent/src/creation/types.ts
 * Creation 服务全部类型定义
 *
 * 遵循命名规范（AGENTS.md）：
 * - 类：PascalCase
 * - 函数/变量：camelCase
 * - 常量：UPPER_SNAKE
 * - 接口：PascalCase（无 I 前缀，保持简洁）
 * - 类型别名：PascalCase
 * - 文件：kebab-case
 *
 * tsconfig.base.json 关键约束：
 * - verbatimModuleSyntax: true → 必须用 `import type`
 * - noUncheckedIndexedAccess: true → 数组/索引访问返回 T | undefined
 * - strict: true
 */

// ── 通用基础类型 ────────────────────────────────────────────

/** ISO-8601 时间戳字符串 */
export type ISOTimestamp = string;

/** SHA-256 内容寻址 ID */
export type HashId = string;

/** 0~1 之间的数值 */
export type Score = number;

// ── 经验层 ─────────────────────────────────────────────────

/** 经验类型 */
export type ExperienceType = 'success' | 'failure' | 'partial';

/** 经验的作用对象 */
export type ActionKind = 'skill' | 'workflow' | 'tool' | 'system';

/** 反馈来源 */
export type FeedbackSource = 'user' | 'auto';

/**
 * 经验记录
 *
 * 用于记录每次 skill/workflow/tool 调用的结果，供 assessor 分析
 */
export interface Experience {
  /** 唯一 ID */
  id: string;
  /** 结果类型 */
  type: ExperienceType;
  /** 执行上下文 */
  context: {
    task: string;
    agent: string;
    sessionId: string;
  };
  /** 执行的动作 */
  action: {
    kind: ActionKind;
    refId: string;
    params: unknown;
  };
  /** 执行结果 */
  result: {
    ok: boolean;
    output: unknown;
    durationMs: number;
    error?: string;
  };
  /** 用户/自动反馈（可选） */
  feedback?: {
    source: FeedbackSource;
    score?: Score;
    comment?: string;
  };
  /** 创建时间 */
  createdAt: ISOTimestamp;
}

/** 经验查询条件 */
export interface ExperienceQuery {
  type?: ExperienceType;
  actionKind?: ActionKind;
  refId?: string;
  sessionId?: string;
  /** 时间戳下限（ms） */
  sinceMs?: number;
  /** 返回数量限制 */
  limit?: number;
}

/** 模式类型 */
export type PatternType = 'successful' | 'failure' | 'optimization';

/**
 * 模式：从经验归纳出的可重用规律
 */
export interface Pattern {
  id: string;
  type: PatternType;
  /** 简短描述（自然语言） */
  description: string;
  /** 触发条件描述（自然语言+标签） */
  conditions: string[];
  /** 推荐动作 */
  actions: string[];
  /** 预期结果 */
  outcomes: string[];
  /** 置信度 0~1 */
  confidence: Score;
  /** 由多少条 Experience 归纳 */
  support: number;
  /** 关联的经验 ID */
  derivedFromExperienceIds: string[];
  updatedAt: ISOTimestamp;
}

/** 知识类型 */
export type KnowledgeKind = 'procedural' | 'declarative' | 'strategic';

/**
 * 知识：从模式沉淀的可复用知识
 */
export interface Knowledge {
  id: string;
  kind: KnowledgeKind;
  /** Markdown 或结构化片段 */
  content: string;
  /** 来源 */
  source: {
    patternIds: string[];
    experienceIds: string[];
  };
  /** 适用场景 */
  applicability: string[];
  /** 可靠性 0~1 */
  reliability: Score;
  updatedAt: ISOTimestamp;
}

// ── 创造规格 ───────────────────────────────────────────────

/** 创造物的来源 */
export type SpecOriginKind = 'created' | 'evolved';

/**
 * Skill 创造请求
 */
export interface CreateSkillRequest {
  /** 需求描述 */
  requirement: string;
  /** 提示信息 */
  hints?: string[];
}

/**
 * Workflow 创造请求
 */
export interface CreateWorkflowRequest {
  /** 目标描述 */
  target: string;
  /** 提示信息 */
  hints?: string[];
}

/**
 * Tool 创造请求
 */
export interface CreateToolRequest {
  /** 需求描述 */
  requirement: string;
  /** 提示信息 */
  hints?: string[];
}

// 注（0024 评审）：SkillSpec / ReviewerSpec / BehaviorSpec / Portability / Composition / CompositionConnection
// 的权威定义已在 `spec/skill-spec.ts` 的 Zod schema，本文件不再重复。
// 历史版本在 Git 历史中保留（v1 / v3）；v4+ production code 请直接 import `spec/skill-spec` 的导出。
//
// 注：必须用 `import type` + re-export 形式（而非纯 `export type {...} from ...`），
// 这样文件内 `SkillSpec` / `Composition` / `WorkflowSpec` 才能作为 file-local name 被使用。
import type { SkillSpec as SkillSpecBase } from './spec/skill-spec';
export type {
  SkillSpec,
  SkillMode,
  Composition,
  CompositionKind,
  CompositionConnection,
  DeliveryChecklist,
  Portability,
  ReviewerSpec,
  ReviewerChecklist,
  ReviewerProcess,
  BehaviorSpec,
} from './spec/skill-spec';

// 文件内类型别名（让本文件其它类型声明可直接用 SkillSpec）
type SkillSpec = SkillSpecBase;

/** Workflow 类型
 * 注（0024 评审）：WorkflowSpec / WorkflowStep / WorkflowType / WorkflowStepKind 的权威定义已在
 * `spec/workflow-spec.ts` 的 Zod schema，本文件不再重复。
 * 历史版本在 Git 历史中保留（v1）；v4+ production code 请直接 import `spec/workflow-spec` 的导出。
 */
import type { WorkflowSpec as WorkflowSpecBase } from './spec/workflow-spec';
export type { WorkflowSpec, WorkflowStep, WorkflowType, WorkflowStepKind } from './spec/workflow-spec';

// 文件内类型别名（让本文件其它类型声明可直接用 WorkflowSpec）
type WorkflowSpec = WorkflowSpecBase;

/**
 * Tool 规格
 */
export interface ToolSpec {
  name: string;
  description: string;
  /** 工具执行函数 */
  execute: (args: unknown, signal: AbortSignal) => Promise<ToolExecutionResult>;
  /** 信任级别（v1 全部为 sandbox） */
  trustLevel: 'sandbox';
  createdAt: ISOTimestamp;
}

/** Tool 执行结果 */
export interface ToolExecutionResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

// ── 校验结果 ───────────────────────────────────────────────

/**
 * 校验结果
 */
export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

// ── 自我评估与进化计划 ──────────────────────────────────────

/** 弱点严重度 */
export type Severity = 'low' | 'medium' | 'high';

/**
 * 能力评估
 */
export interface CapabilityAssessment {
  name: string;
  score: Score;
  sampleSize: number;
}

/**
 * 弱点
 */
export interface Weakness {
  /** 能力区域（格式：kind:refId） */
  area: string;
  /** 证据列表 */
  evidence: string[];
  severity: Severity;
}

/** 机会类型 */
export type OpportunityKind = 'new-skill' | 'optimize' | 'merge';

/**
 * 机会
 */
export interface Opportunity {
  kind: OpportunityKind;
  /** 理由描述 */
  rationale: string;
}

/**
 * 推荐
 */
export interface Recommendation {
  action: string;
  /** 优先级 0~10 */
  priority: number;
}

/**
 * 自我评估结果
 */
export interface SelfAssessment {
  generatedAt: ISOTimestamp;
  /** 评估窗口（天） */
  windowDays: number;
  /** 总分 0~1 */
  overallScore: Score;
  /** 能力评估列表 */
  capabilities: CapabilityAssessment[];
  /** 弱点列表 */
  weaknesses: Weakness[];
  /** 机会列表 */
  opportunities: Opportunity[];
  /** 建议列表 */
  recommendations: Recommendation[];
}

/** 进化优先级 */
export type EvolutionPriority = 'low' | 'medium' | 'high' | 'critical';

/** 进化目标 */
export type EvolutionTarget = 'skill' | 'workflow' | 'tool' | 'system';

/**
 * 进化动作（discriminated union）
 */
export type EvolutionAction =
  | { kind: 'create-skill'; spec: SkillSpec }
  | { kind: 'create-workflow'; spec: WorkflowSpec }
  | { kind: 'revise-spec'; specId: string; newSpec: SkillSpec | WorkflowSpec }
  | { kind: 'deprecate'; specId: string; reason: string };

/**
 * 进化计划
 */
export interface EvolutionPlan {
  id: string;
  generatedAt: ISOTimestamp;
  priority: EvolutionPriority;
  target: EvolutionTarget;
  actions: EvolutionAction[];
  expectedImpact: string;
  risk: {
    reversibility: 'easy' | 'hard';
    blastRadius: string;
  };
  approval: {
    required: boolean;
    reason?: string;
  };
}

/**
 * 进化执行结果
 */
export interface EvolutionResult {
  id: string;
  planId: string;
  status: 'success' | 'partial' | 'failed' | 'rolled-back';
  diffs: SpecDiff[];
  metrics?: {
    before: Score;
    after: Score;
  };
  completedAt: ISOTimestamp;
}

/**
 * 规格差异
 */
export interface SpecDiff {
  specId: string;
  type: 'created' | 'modified' | 'deleted';
  before?: string;
  after?: string;
}

/** 进化配额状态 */
export interface EvolverQuota {
  today: string;
  todayCount: number;
  consecutiveRollbacks: number;
  lastRollbackAt?: string;
  cooldownUntil?: string;
}

/** 应用计划请求 */
export interface ApplyPlanRequest {
  /** 是否为 dry run */
  dryRun?: boolean;
}

// ── 身份认知 ───────────────────────────────────────────────

/** 能力来源 */
export type CapabilitySource = 'created' | 'learned' | 'inherited';

/**
 * 能力
 */
export interface Capability {
  name: string;
  description: string;
  source: CapabilitySource;
  sourceRef?: string;
  acquiredAt: ISOTimestamp;
  gdiScore?: Score;
  usageCount: number;
  successRate: Score;
}

/**
 * 性格特质
 */
export interface PersonalityTrait {
  trait: string;
  /** 强度 0~1 */
  strength: Score;
  evidenceCount: number;
}

/**
 * 进化记录
 */
export interface EvolutionRecord {
  id: string;
  timestamp: ISOTimestamp;
  type: 'capability_acquired' | 'capability_deprecated' | 'trait_strengthened' | 'identity_evolved';
  description: string;
  diff: IdentityDiff;
  approvalRequired: boolean;
  approvedBy?: string;
  relatedExperienceIds?: string[];
  relatedEvolutionId?: string;
}

/** 身份差异 */
export interface IdentityDiff {
  capabilitiesAdded?: string[];
  capabilitiesRemoved?: string[];
  traitsChanged?: Array<{ trait: string; before: Score; after: Score }>;
}

/**
 * 身份基因组（运行时结构）
 */
export interface IdentityGenome {
  /** 核心原则（不可修改） */
  coreTruths: readonly string[];
  /** 可演化能力 */
  capabilities: Capability[];
  /** 性格特质 */
  personalityTraits: PersonalityTrait[];
  /** 进化历史 */
  evolutionHistory: EvolutionRecord[];
  /** 元数据 */
  version: string;
  lastUpdated: ISOTimestamp;
  /** SHA-256 完整性哈希 */
  integrityHash: HashId;
}

/**
 * 身份更新请求
 */
export interface IdentityUpdate {
  capabilitiesToAdd?: Capability[];
  capabilitiesToRemove?: string[];
  traitsToUpdate?: PersonalityTrait[];
  reason: string;
  triggeredByEvolutionId?: string;
}

/**
 * 身份异常报告
 */
export interface AnomalyReport {
  anomalies: string[];
  severity: 'none' | 'medium' | 'high';
}

/** EASBot 核心原则常量（对应 SOUL.md） */
export const EASBOT_CORE_TRUTHS: readonly string[] = [
  'Sincerity, Trust, Reliability, Innovation', // 核心价值观
  'Professional yet friendly', // 行为风格
  'Efficiency, Accuracy, Maintainability, Simplicity', // 决策原则
] as const;

// ── 基因/胶囊 ──────────────────────────────────────────────

/** 基因类型 */
export type GeneType = 'repair' | 'optimize' | 'innovate';

/**
 * 前置条件
 */
export interface Condition {
  /** 条件描述 */
  description: string;
  /** 检查函数（仅在运行时） */
  check?: () => boolean | Promise<boolean>;
}

/**
 * 验证命令
 */
export interface Command {
  /** 命令字符串 */
  cmd: string;
  /** 预期退出码 */
  expectedExitCode: number;
  /** 超时（ms） */
  timeoutMs?: number;
}

/**
 * 环境指纹
 */
export interface EnvironmentFingerprint {
  /** 操作系统 */
  os: string;
  /** Node 版本 */
  nodeVersion?: string;
  /** 已安装的关键依赖 */
  dependencies: Record<string, string>;
  /** 用户偏好 hash */
  userPreferenceHash?: string;
}

/**
 * 基因：可重用策略模板
 */
export interface Gene {
  id: HashId;
  type: GeneType;
  name: string;
  description: string;
  preconditions: Condition[];
  validationCommands: Command[];
  /** 实现模板 */
  implementationTemplate: string;
  environmentFingerprint: EnvironmentFingerprint;
  source: {
    type: 'user' | 'learned' | 'inherited';
    fromCapsuleId?: string;
  };
  createdAt: ISOTimestamp;
}

/**
 * 触发信号
 */
export interface Signal {
  type: string;
  /** 信号描述 */
  description: string;
  /** 权重 0~1 */
  weight: Score;
}

/**
 * 测试结果
 */
export interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  message?: string;
}

/**
 * 胶囊：验证过的解决方案包
 */
export interface Capsule {
  id: HashId;
  geneId: HashId;
  triggerSignals: Signal[];
  confidenceScore: Score;
  /** 影响范围 0~1 */
  blastRadius: Score;
  gdi: GDI;
  environmentFingerprint: EnvironmentFingerprint;
  implementation: {
    specType: 'skill' | 'workflow' | 'tool';
    specId: string;
  };
  testResults: TestResult[];
  createdAt: ISOTimestamp;
  lastUsedAt?: ISOTimestamp;
  usageCount: number;
  successCount: number;
}

// ── GDI 全局质量评估 ───────────────────────────────────────

/**
 * GDI 多维评分
 */
export interface GDI {
  /** 内在质量 (35%) */
  intrinsicQuality: {
    codeQuality: Score;
    security: Score;
    maintainability: Score;
    correctness: Score;
  };
  /** 使用指标 (30%) */
  usageMetrics: {
    usageFrequency: Score;
    successRate: Score;
    userFeedback: Score;
    performance: Score;
  };
  /** 社交信号 (20%) */
  socialSignals: {
    communityRating: Score;
    recommendations: Score;
    influence: Score;
  };
  /** 新鲜度 (15%) */
  freshness: {
    /** 时间衰减 0~1 */
    lastUpdated: Score;
    relevance: Score;
    compatibility: Score;
  };
}

// ── 自主性协调 ─────────────────────────────────────────────

/** 自主性等级 */
export type AutonomyLevelValue = 1 | 2 | 3 | 4;

export type AutonomyLevelName = 'planning' | 'learning' | 'evolution' | 'creation';

/**
 * 自主性等级
 */
export interface AutonomyLevel {
  level: AutonomyLevelValue;
  name: AutonomyLevelName;
  securityRequirement: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 用户控制选项
 */
export interface ControlOption {
  /** 选项 ID */
  id: string;
  /** 显示标签 */
  label: string;
  /** 选项描述 */
  description: string;
  /** 选项值 */
  value: string;
}

/**
 * 资源使用
 */
export interface ResourceUsage {
  /** 耗时 ms */
  durationMs: number;
  /** Token 消耗 */
  tokensUsed: number;
  /** LLM 调用次数 */
  llmCalls: number;
}

/**
 * 自主性响应
 */
export interface AutonomyResponse {
  level: AutonomyLevel;
  result: unknown;
  /** 决策可解释性 */
  reasoning: string;
  controlOptions: ControlOption[];
  resourcesUsed: ResourceUsage;
}

/**
 * 用户请求
 */
export interface UserRequest {
  /** 请求内容 */
  request: string;
  /** 请求上下文 */
  context: {
    userId: string;
    sessionId: string;
    /** 信任度 0~1 */
    trustLevel: Score;
    /** 风险容忍度 0~1 */
    riskTolerance: Score;
  };
}

// ── 安全控制 ───────────────────────────────────────────────

/**
 * 安全策略
 */
export interface SecurityPolicy {
  /** 最大信任级别 */
  maxTrustLevel: 'sandbox' | 'trusted' | 'builtin';
  /** 是否允许外部网络调用 */
  allowNetworkAccess: boolean;
  /** 文件系统访问范围 */
  filesystemScope: 'none' | 'sandbox' | 'restricted' | 'full';
  /** 执行超时（ms） */
  executionTimeoutMs: number;
}

/**
 * 安全审计日志
 */
export interface SecurityAuditLog {
  timestamp: ISOTimestamp;
  event: string;
  resource: string;
  allowed: boolean;
  reason?: string;
}
