/**
 * packages/agent/src/creation/index.ts
 * Creation 服务统一入口
 *
 * 导出所有公共类型和接口
 */

// 核心命名空间
export { Creation, SkillModes } from './creation';
export type { CompositionType } from './creation';

// 错误类型
export { CreationError } from './errors';

// 事件定义
export { CreationEvents } from './events';

// 类型导出（统一版本）
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
  WorkflowSpec,
  WorkflowStep,
  WorkflowType,
  WorkflowStepKind,
  ValidationResult,
  Experience,
  ExperienceQuery,
  ExperienceType,
  Pattern,
  PatternType,
  Knowledge,
  KnowledgeKind,
  SelfAssessment,
  CapabilityAssessment,
  Weakness,
  Opportunity,
  OpportunityKind,
  Recommendation,
  EvolutionPlan,
  EvolutionAction,
  EvolutionResult,
  EvolutionPriority,
  EvolutionTarget,
  SpecDiff,
  EvolverQuota,
  Severity,
} from './types';

// 工厂函数
export { createCreator } from './creator';
export { createSelfAssessor } from './assessor';
export { createEvolver } from './evolver';
export { createMemory } from './memory';
export type { Memory } from './memory';

// 接口
export type { Creator, CreatorOptions, RegisterResult } from './creator';
export type { SelfAssessor } from './assessor';
export type { Evolver, EvolverOptions } from './evolver';
