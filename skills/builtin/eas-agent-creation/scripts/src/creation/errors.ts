/**
 * packages/agent/src/creation/errors.ts
 * Creation 服务错误类型定义
 *
 * 使用 NamedError.create 创建类型安全的命名错误
 */

import { NamedError } from '@easbot/utils';
import z from 'zod';

export namespace CreationError {
  /**
   * 校验失败错误
   */
  export const ValidationFailed = NamedError.create(
    'CreationValidationFailedError',
    z.object({
      name: z.string(),
      errors: z.array(z.string()),
    }),
  );

  /**
   * 注册被拒绝错误
   */
  export const RegisterRejected = NamedError.create(
    'CreationRegisterRejectedError',
    z.object({
      name: z.string(),
      reason: z.string(),
    }),
  );

  /**
   * 预算耗尽错误
   */
  export const BudgetExhausted = NamedError.create(
    'CreationBudgetExhaustedError',
    z.object({
      todayCount: z.number(),
      limit: z.number(),
    }),
  );

  /**
   * 冷却中错误
   */
  export const InCooldown = NamedError.create(
    'CreationInCooldownError',
    z.object({
      until: z.string().datetime(),
    }),
  );

  /**
   * 需要审批错误
   */
  export const ApprovalRequired = NamedError.create(
    'CreationApprovalRequiredError',
    z.object({
      planId: z.string(),
      reason: z.string(),
    }),
  );

  /**
   * Prompt 注入检测错误
   */
  export const PromptInjectionDetected = NamedError.create(
    'CreationPromptInjectionError',
    z.object({
      name: z.string(),
      patterns: z.array(z.string()),
    }),
  );

  /**
   * review 操作错误（统一 SKILL.md 缺失 / LLM 未配置 / LLM 调用失败）
   *
   * exitCode 用于 CLI 区分用户错误(2)与系统错误(3),host 端可忽略。
   * 必须在 schema 里 export，cli.ts 顶层 catch 才能正确读取 exitCode 退出。
   */
  export const ReviewFailed = NamedError.create(
    'CreationReviewFailedError',
    z.object({
      code: z.enum(['skill-name-missing', 'skill-md-not-found', 'language-llm-not-configured', 'llm-invoke-failed']),
      message: z.string(),
      skillName: z.string().optional(),
      skillPath: z.string().optional(),
      exitCode: z.union([z.literal(2), z.literal(3)]),
    }),
  );
}
