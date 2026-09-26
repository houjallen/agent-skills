/**
 * @deprecated 自 0024 评审起，强校验已统一并入 `spec/skill-spec.ts` 的 Zod schema（`SkillSpecSchema`）。
 * `Creator.validate()` 已直接调用 `SkillSpecSchema.parse()`，与 references/validation.md §1-§4 强校验对齐。
 * 本类（含 `DefaultValidator`）将在下次 minor 删除（评审报告 0024 P0 M1 / P1 L2）。
 *
 * 保留历史实现供外部脚本可能引用的兼容期；新代码请用 `SkillSpecSchema`。
 *
 * **P0-2（2026-09-26 评审）**：本文件的 `PROMPT_INJECTION_PATTERNS` 已废弃，
 * 全部转发到 `creator.ts` 的 `DefaultCreator.scanInjection`（统一规则，避免双源漂移）。
 */

import { Log } from '@easbot/utils';
import { DefaultCreator } from './creator';
import type { SkillSpec, ValidationResult, WorkflowSpec } from './types';

/** 校验器日志 */
const log = Log.create({ service: 'creation.validator' });

/** Skill 名称规则：kebab-case，2~50 字符 */
const SKILL_NAME_PATTERN = /^[a-z][a-z0-9-]{1,49}$/;

/** Workflow ID 规则：与 Skill 类似 */
const WORKFLOW_ID_PATTERN = /^[a-z][a-z0-9-]{1,49}$/;

/**
 * Validator 接口
 */
export interface Validator {
  /**
   * 校验 Skill 规格
   */
  validateSkillSpec(spec: SkillSpec): ValidationResult;
  /**
   * 校验 Workflow 规格
   */
  validateWorkflowSpec(spec: WorkflowSpec): ValidationResult;
  /**
   * 扫描 Prompt 注入（兼容旧 API）
   *
   * **P0-2**：本方法仅转发到 `creator.ts` 的 `scanPromptInjection`，
   * 不再独立维护注入模式列表。
   */
  scanInjection(text: string): string[];
}

/**
 * 默认校验器
 *
 * 提供完整 spec 校验 + 安全扫描
 */
export class DefaultValidator implements Validator {
  // ── Skill ──────────────────────────────────────────────

  /**
   * 校验 Skill 规格
   */
  validateSkillSpec(spec: SkillSpec): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. 必备字段
    if (!spec.name) errors.push('SkillSpec.name is required');
    if (!spec.description) errors.push('SkillSpec.description is required');
    if (!spec.body) errors.push('SkillSpec.body is required');

    // 2. 名称格式
    if (spec.name && !SKILL_NAME_PATTERN.test(spec.name)) {
      errors.push(`SkillSpec.name "${spec.name}" must be kebab-case, 2-50 chars, start with letter`);
    }

    // 3. description 长度（10~500）
    if (spec.description) {
      if (spec.description.length < 10) {
        errors.push('SkillSpec.description too short (< 10 chars)');
      }
      if (spec.description.length > 500) {
        warnings.push('SkillSpec.description too long (> 500 chars), consider shortening');
      }
    }

    // 4. body 长度（≥ 50 chars）
    if (spec.body && spec.body.trim().length < 50) {
      warnings.push('SkillSpec.body too short (< 50 chars), may not be useful');
    }

    // 5. frontmatter 一致性
    if (spec.frontmatter) {
      if (spec.frontmatter['name'] && spec.frontmatter['name'] !== spec.name) {
        warnings.push(`frontmatter.name ("${spec.frontmatter['name']}") does not match spec.name ("${spec.name}")`);
      }
    }

    // 6. origin 必须有 kind
    if (!spec.origin?.kind) {
      errors.push('SkillSpec.origin.kind is required');
    }

    // 7. 安全扫描：prompt 注入黑名单（body）
    const injectionIssues = this.scanInjection(spec.body);
    for (const issue of injectionIssues) {
      errors.push(`Security: ${issue}`);
    }

    // 8. 安全扫描：description 也扫一遍
    const descIssues = this.scanInjection(spec.description);
    for (const issue of descIssues) {
      errors.push(`Security (description): ${issue}`);
    }

    if (errors.length > 0) {
      log.warn('validateSkillSpec:failed', { name: spec.name, errors: errors.length });
    } else if (warnings.length > 0) {
      log.debug('validateSkillSpec:warnings', { name: spec.name, warnings: warnings.length });
    }

    return { ok: errors.length === 0, errors, warnings };
  }

  // ── Workflow ───────────────────────────────────────────

  /**
   * 校验 Workflow 规格
   */
  validateWorkflowSpec(spec: WorkflowSpec): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!spec.id) errors.push('WorkflowSpec.id is required');
    if (!spec.name) errors.push('WorkflowSpec.name is required');
    if (!spec.version) errors.push('WorkflowSpec.version is required');
    if (!spec.steps || spec.steps.length === 0) {
      errors.push('WorkflowSpec.steps must contain at least one step');
    }

    if (spec.id && !WORKFLOW_ID_PATTERN.test(spec.id)) {
      errors.push(`WorkflowSpec.id "${spec.id}" must be kebab-case, 2-50 chars, start with letter`);
    }

    // version 应是 semver 简化版
    if (spec.version && !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(spec.version)) {
      warnings.push(`WorkflowSpec.version "${spec.version}" is not in semver format (x.y.z)`);
    }

    // 步骤 ID 唯一性
    if (spec.steps && spec.steps.length > 0) {
      const ids = new Set<string>();
      for (const step of spec.steps) {
        if (!step.id) {
          errors.push('WorkflowStep.id is required for all steps');
          continue;
        }
        if (ids.has(step.id)) {
          errors.push(`Duplicate WorkflowStep.id: "${step.id}"`);
        }
        ids.add(step.id);

        // 校验 dependsOn 引用
        if (step.dependsOn) {
          for (const dep of step.dependsOn) {
            if (dep === step.id) {
              errors.push(`WorkflowStep "${step.id}" depends on itself`);
            }
          }
        }
      }

      // 校验 dependsOn 引用的步骤存在
      const allIds = new Set(spec.steps.map((s) => s.id));
      for (const step of spec.steps) {
        if (!step.dependsOn) continue;
        for (const dep of step.dependsOn) {
          if (!allIds.has(dep)) {
            errors.push(`WorkflowStep "${step.id}" depends on non-existent step "${dep}"`);
          }
        }
      }
    }

    return { ok: errors.length === 0, errors, warnings };
  }

  // ── 安全扫描 ───────────────────────────────────────────

  /**
   * 扫描文本中的 prompt 注入和危险模式
   *
   * **P0-2**：仅转发到 `DefaultCreator.scanInjection`，不在此处独立维护列表。
   * 单例 `__sharedCreator` 保证 10 条注入模式列表只被解析一次。
   *
   * @param text 要扫描的文本
   * @returns 命中的问题描述列表（空数组 = 干净）
   */
  scanInjection(text: string): string[] {
    return __sharedCreator.scanInjection(text);
  }
}

/** 模块级 DefaultCreator 单例（避免每次 new 重新加载模式列表） */
const __sharedCreator = new DefaultCreator();

/**
 * 创建默认校验器实例
 *
 * @returns 校验器实例
 */
export function createValidator(): Validator {
  return new DefaultValidator();
}
