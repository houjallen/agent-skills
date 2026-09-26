import z from 'zod';
import { BehaviorSpec, InversionGateSpec, PipelineSequenceSpec } from './gate-spec';
import { PortabilitySpec } from './portability-spec';
import { ReviewerChecklist, ReviewerProcess, ReviewerSpec } from './review-spec';

// ── 模式枚举 ─────────────────────────────────────────────

export const SkillModes = ['tool-wrapper', 'generator', 'reviewer', 'inversion', 'pipeline'] as const;
const SkillModeEnum = z.enum(SkillModes);
export type SkillMode = z.infer<typeof SkillModeEnum>;

// ── 组合类型 ─────────────────────────────────────────────

export const CompositionKindEnum = z.enum(['single', 'composed']);
export type CompositionKind = z.infer<typeof CompositionKindEnum>;

export const CompositionConnectionEnum = z.object({
  from: SkillModeEnum,
  to: SkillModeEnum,
  kind: z.enum(['embed', 'sequence', 'gate']),
});

export type CompositionConnection = z.infer<typeof CompositionConnectionEnum>;

/**
 * 组合定义
 *
 * 注：这是运行时 Composition（Creator/CLI 推断结果），与 SkillSpec.composition
 * 字段（`CompositionKind`，即 'single' | 'composed'）不同。Composition 含主模式、
 * 次要模式列表与连接关系，用于驱动 spec 生成；SkillSpec.composition 是简化标记。
 */
export interface Composition {
  /** 主模式 */
  primary: SkillMode;
  /** 次要模式列表（最多 2 个） */
  secondary: SkillMode[];
  /** 组合连接关系 */
  connections: CompositionConnection[];
}

// ── 交付检查 ─────────────────────────────────────────────

export const DeliveryChecklistSchema = z.object({
  developmentGuide: z.boolean(),
  pitfallTable: z.boolean(),
  reviewProcess: z.boolean(),
  deploymentGuide: z.boolean(),
  observability: z.boolean(),
  scripts: z.boolean(),
});

export type DeliveryChecklist = z.infer<typeof DeliveryChecklistSchema>;

export type Portability = z.infer<typeof PortabilitySpec>;

// ── Reviewer 模式专属 ────────────────────────────────────

/** Reviewer 模式专属规格（从 review-spec.ts re-export，使下游 `import from './spec/skill-spec'` 一站式可用） */
export { ReviewerChecklist, ReviewerProcess, ReviewerSpec };

// ── 行为强约束 ───────────────────────────────────────────

/** 行为强约束（Inversion + Pipeline 模式的 gate / sequence 字段） */
export { BehaviorSpec, InversionGateSpec, PipelineSequenceSpec };

// ── SkillSpec 主 schema ──────────────────────────────────

export const SkillSpecSchema = z
  .object({
    name: z.string().regex(/^[a-z][a-z0-9-]{1,49}$/),
    description: z.string().min(10).max(500),
    scope: z.enum(['all', 'coder', 'general']).optional(),
    body: z.string().min(50),
    frontmatter: z.record(z.string(), z.unknown()).optional(),
    origin: z.object({
      kind: z.enum(['created', 'evolved']),
      fromSpecId: z.string().optional(),
      experienceIds: z.array(z.string()).optional(),
    }),
    createdAt: z.string().datetime(),
    mode: SkillModeEnum,
    secondaryModes: z.array(SkillModeEnum).optional(),
    composition: CompositionKindEnum,
    compositionConnections: z.array(CompositionConnectionEnum).optional(),
    deliveryChecklist: DeliveryChecklistSchema,
    portability: PortabilitySpec.optional(),
    reviewer: ReviewerSpec.optional(),
    behavior: BehaviorSpec.optional(),
    references: z.array(z.string()).optional(),
    requires: z.array(z.string()).optional(),
    conflicts: z.array(z.string()).optional(),
    suggests: z.array(z.string()).optional(),
  })
  .meta({ ref: 'CreationSkillSpec' });

export type SkillSpec = z.infer<typeof SkillSpecSchema>;
