/**
 * packages/agent/src/creation/events.ts
 * Creation 服务事件定义
 *
 * 使用 BusEvent.define 定义类型安全的事件
 */

import z from 'zod';
import { BusEvent } from '../bus/bus-event';
import { SkillModes } from './spec/skill-spec';

export namespace CreationEvents {
  /**
   * Skill 创造事件
   */
  export const SkillCreated = BusEvent.define(
    'creation.skill.created',
    z.object({
      specId: z.string(),
      name: z.string(),
      mode: z.enum(SkillModes),
      composition: z.enum(['single', 'composed']),
      path: z.string(),
      trustLevel: z.literal('sandbox'),
      origin: z.object({
        kind: z.enum(['created', 'evolved']),
        fromSpecId: z.string().optional(),
        experienceIds: z.array(z.string()).optional(),
      }),
    }),
  );

  /**
   * Skill 移除事件
   */
  export const SkillRemoved = BusEvent.define(
    'creation.skill.removed',
    z.object({
      name: z.string(),
      removed: z.boolean(),
    }),
  );

  /**
   * 进化计划已生成事件
   */
  export const EvolutionPlanned = BusEvent.define(
    'creation.evolution.planned',
    z.object({
      planIds: z.array(z.string()),
      generatedAt: z.string().datetime(),
    }),
  );

  /**
   * 进化计划等待审批事件
   */
  export const EvolutionAwaitingApproval = BusEvent.define(
    'creation.evolution.awaiting_approval',
    z.object({
      planId: z.string(),
      reason: z.string().optional(),
    }),
  );

  /**
   * 进化计划已应用事件
   */
  export const EvolutionApplied = BusEvent.define(
    'creation.evolution.applied',
    z.object({
      planId: z.string(),
      resultId: z.string(),
      status: z.enum(['success', 'partial', 'failed', 'rolled-back']),
      completedAt: z.string().datetime(),
    }),
  );

  /**
   * 进化失败事件
   */
  export const EvolutionFailed = BusEvent.define(
    'creation.evolution.failed',
    z.object({
      error: z.string(),
      planId: z.string().optional(),
    }),
  );
}
