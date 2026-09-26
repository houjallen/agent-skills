/**
 * packages/agent/src/creation/evolver.ts
 * 进化引擎：自评估 → 计划 → 执行 → 回滚 的完整生命周期
 *
 * 设计依据：
 * - 进化流程：assess → plan → apply → 记录结果
 * - 日预算/冷却机制：日 10 次 + 连续 2 次 rollback 冷却 7 天
 * - 高风险 plan 默认 requiresApproval=true
 *
 * 不做的事：
 * - 不做 LLM 计划生成（v1 规则化）
 * - 不做工作流自动发现
 * - 不做跨包发布
 */

import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { Log } from '@easbot/utils';
import { Identifier } from '@easbot/utils';
import { getCreationStore } from './store';
import type { Memory } from './memory';
import type { ApplyPlanRequest, EvolutionAction, EvolutionPlan, EvolutionResult, EvolverQuota, SelfAssessment, SkillSpec, SpecDiff, Weakness } from './types';

/** 进化引擎日志 */
const log = Log.create({ service: 'creation.evolver' });

/** 每日最大进化次数 */
const DAILY_BUDGET = 10;

/** 冷却时长（天） */
const COOLDOWN_DAYS = 7;

/**
 * 进化引擎配置选项
 */
export interface EvolverOptions {
  /** 状态文件路径（默认 {storageDir}/.evolver-state.json） */
  stateFilePath?: string;
  /** 计划存储文件路径（默认 {storageDir}/.evolver-plans.json） */
  plansFilePath?: string;
  /**
   * Skill 落盘根目录（默认 ~/.easbot/created）
   * 必须与 Creator 的 storageDir 对齐，否则 evolve 创建的 skill 在 list 中不可见。
   */
  storageDir?: string;
}

/**
 * Evolver 接口
 */
export interface Evolver {
  /**
   * 主循环入口
   *
   * 执行完整进化流程：评估 → 计划 → 应用
   * @returns 进化结果（无计划或冷却中返回 null）
   */
  evolve(): Promise<EvolutionResult | null>;

  /**
   * 执行自评估
   * @param opts 评估选项
   * @returns 自我评估结果
   */
  selfAssess(opts?: { windowDays?: number }): Promise<SelfAssessment>;

  /**
   * 生成进化计划
   * @param assessment 自我评估结果
   * @returns 进化计划列表
   */
  planEvolution(assessment: SelfAssessment): Promise<EvolutionPlan[]>;

  /**
   * 应用进化计划
   * @param plan 进化计划
   * @param req 应用请求选项
   * @returns 进化结果
   */
  applyPlan(plan: EvolutionPlan, req?: ApplyPlanRequest): Promise<EvolutionResult>;

  /**
   * 回滚进化结果
   * @param result 进化结果
   */
  rollback(result: EvolutionResult): Promise<void>;

  /**
   * 记录待审批计划
   * @param plan 进化计划
   */
  recordAwaitingApproval(plan: EvolutionPlan): Promise<void>;

  /**
   * 获取计划
   * @param planId 计划 ID
   * @returns 计划（不存在则返回 undefined）
   */
  getPlan(planId: string): Promise<EvolutionPlan | undefined>;

  /**
   * 获取进化配额状态
   * @returns 配额状态
   */
  loadQuota(): Promise<EvolverQuota>;

  /**
   * 检查是否在冷却中
   * @returns 是否在冷却中
   */
  isInCooldown(): Promise<boolean>;
}

// ── 辅助函数 ─────────────────────────────────────────────

/**
 * 获取默认状态文件路径
 */
function defaultStateFilePath(storageDir: string): string {
  return path.join(storageDir, '.evolver-state.json');
}

/** Evolver 默认 storageDir（与 Creator 默认对齐 ~/.easbot/created） */
function defaultStorageDir(): string {
  return path.join(os.homedir(), '.easbot', 'created');
}

/**
 * 解析计划文件路径
 */
function resolvePlansFilePath(stateFilePath?: string, storageDir?: string): string {
  const statePath = stateFilePath ?? defaultStateFilePath(storageDir ?? defaultStorageDir());
  return path.join(path.dirname(statePath), '.evolver-plans.json');
}

/**
 * 从字符串提取 skill 名称
 */
function extractSkillName(text: string): string {
  const match = text.match(/^[a-z][a-z0-9-]+/);
  return match ? match[0] : 'unknown-skill';
}

// ── 进化引擎实现 ─────────────────────────────────────────

/**
 * 进化引擎默认实现
 *
 * 负责自我评估、计划生成、计划应用和回滚
 */
export class DefaultEvolver implements Evolver {
  private readonly memory: Memory;
  private readonly store = getCreationStore();
  private readonly stateFilePath: string;
  private readonly plansFilePath: string;
  /**
   * Skill 落盘根目录（与 Creator.storageDir 对齐）
   * P0-1：之前硬编码 `~/.easbot/created`，导致 evolve 创建的 skill 在 list 中不可见。
   * 由 `Creation.evolve` 通过 EvolverOptions.storageDir 注入。
   */
  private readonly _storageDir: string;

  /**
   * 创建进化引擎
   * @param deps 依赖
   * @param deps.memory 记忆接口
   * @param options 配置选项
   */
  constructor(deps: { memory: Memory }, options?: EvolverOptions) {
    this.memory = deps.memory;
    const storageDir = options?.storageDir ?? defaultStorageDir();
    this._storageDir = storageDir;
    this.stateFilePath = options?.stateFilePath ?? defaultStateFilePath(storageDir);
    this.plansFilePath = options?.plansFilePath ?? resolvePlansFilePath(this.stateFilePath, storageDir);
  }

  /**
   * 获取状态文件路径（兼容旧 API）
   */
  getStateFilePath(): string {
    return this.stateFilePath;
  }

  /**
   * 记录待审批计划
   */
  async recordAwaitingApproval(plan: EvolutionPlan): Promise<void> {
    // 使用 store 保存计划
    await this.store.savePlan(plan);
  }

  /**
   * 获取计划
   */
  async getPlan(planId: string): Promise<EvolutionPlan | undefined> {
    const plan = await this.store.getPlan(planId);
    return plan ?? undefined;
  }

  // ── 主循环 ─────────────────────────────────────────────

  /**
   * 执行主进化循环
   *
   * 流程：
   * 1. 检查冷却
   * 2. 检查配额
   * 3. 自评估
   * 4. 生成计划
   * 5. 应用计划或记录待审批
   */
  async evolve(): Promise<EvolutionResult | null> {
    log.info('evolve:start');

    // 1. 冷却检查
    if (await this.isInCooldown()) {
      log.warn('evolve:in_cooldown');
      return null;
    }

    // 2. 配额检查
    const quota = await this.loadQuota();
    if (quota.todayCount >= DAILY_BUDGET) {
      log.warn('evolve:budget_exhausted', { today: quota.today, count: quota.todayCount });
      return null;
    }

    // 3. 自评估
    const assessment = await this.selfAssess();

    // 4. 生成计划
    const plans = await this.planEvolution(assessment);
    if (plans.length === 0) {
      log.info('evolve:no_plans');
      return null;
    }

    // 5. 选择优先级最高的计划
    const topPlan = plans[0];
    if (!topPlan) return null;

    // 6. 审批拦截
    if (topPlan.approval.required) {
      log.info('evolve:approval_required', { planId: topPlan.id, reason: topPlan.approval.reason });
      await this.recordAwaitingApproval(topPlan);
      return null;
    }

    // 7. 应用计划
    const result = await this.applyPlan(topPlan);

    return result;
  }

  // ── 自评估 ─────────────────────────────────────────────

  /**
   * 执行自评估
   *
   * 委托给 Assesor 模块
   */
  async selfAssess(opts?: { windowDays?: number }): Promise<SelfAssessment> {
    const { createSelfAssessor } = await import('./assessor');
    const assessor = createSelfAssessor(this.memory);
    return assessor.assess(opts);
  }

  // ── 计划生成 ───────────────────────────────────────────

  /**
   * 基于自我评估生成进化计划
   *
   * 规则：
   * - high 弱点 → create-skill
   * - optimize 机会 → revise-spec
   * - merge 机会 → deprecate + create-skill
   */
  async planEvolution(assessment: SelfAssessment): Promise<EvolutionPlan[]> {
    const plans: EvolutionPlan[] = [];

    // 规则 1: high 弱点 → create-skill
    for (const w of assessment.weaknesses.filter((x) => x.severity === 'high')) {
      const spec = this.synthesizeReplacementSkill(w.area, w);
      plans.push({
        id: Identifier.ascending('evolution'),
        generatedAt: new Date().toISOString(),
        priority: 'high',
        target: 'skill',
        actions: [{ kind: 'create-skill', spec }],
        expectedImpact: `Fix ${w.area}: ${w.evidence[0] ?? 'N/A'}`,
        risk: {
          reversibility: 'easy',
          blastRadius: `Only affects calls to ${w.area}`,
        },
        approval: {
          required: true,
          reason: `High severity weakness: ${w.evidence[0] ?? 'N/A'}`,
        },
      });
    }

    // 规则 2: optimize 机会 → revise-spec
    for (const o of assessment.opportunities.filter((x) => x.kind === 'optimize')) {
      const skillId = extractSkillName(o.rationale);
      plans.push({
        id: Identifier.ascending('evolution'),
        generatedAt: new Date().toISOString(),
        priority: 'medium',
        target: 'skill',
        actions: [
          {
            kind: 'revise-spec',
            specId: skillId,
            newSpec: this.emptySkillSpec(skillId, o.rationale),
          },
        ],
        expectedImpact: o.rationale,
        risk: {
          reversibility: 'easy',
          blastRadius: o.rationale,
        },
        approval: {
          required: false,
        },
      });
    }

    // 规则 3: merge 机会 → deprecate + create-skill
    for (const o of assessment.opportunities.filter((x) => x.kind === 'merge')) {
      const skillId = extractSkillName(o.rationale);
      const newSkill = this.emptySkillSpec(`${skillId}-merged`, o.rationale);
      plans.push({
        id: Identifier.ascending('evolution'),
        generatedAt: new Date().toISOString(),
        priority: 'low',
        target: 'skill',
        actions: [
          { kind: 'create-skill', spec: newSkill },
          { kind: 'deprecate', specId: skillId, reason: `merged into ${skillId}-merged` },
        ],
        expectedImpact: o.rationale,
        risk: {
          reversibility: 'hard',
          blastRadius: o.rationale,
        },
        approval: {
          required: true,
          reason: 'merge involves deprecate, requires manual confirmation',
        },
      });
    }

    // 按优先级排序
    return plans.sort((a, b) => {
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.priority] ?? 99) - (order[b.priority] ?? 99);
    });
  }

  // ── 应用计划 ───────────────────────────────────────────

  /**
   * 应用进化计划
   */
  async applyPlan(plan: EvolutionPlan, req?: ApplyPlanRequest): Promise<EvolutionResult> {
    const resultId = Identifier.ascending('result');
    log.info('applyPlan:start', { resultId, planId: plan.id });

    // Dry run 模式
    if (req?.dryRun) {
      return {
        id: resultId,
        planId: plan.id,
        status: 'success',
        diffs: [],
        completedAt: new Date().toISOString(),
      };
    }

    const diffs: SpecDiff[] = [];
    let successCount = 0;

    try {
      // 逐个执行 actions
      for (const action of plan.actions) {
        const diff = await this.executeAction(action, plan);
        if (diff) {
          diffs.push(diff);
          successCount++;
        }
      }

      const status = successCount === plan.actions.length ? 'success' : 'partial';

      // 成功时增加配额计数
      await this.incrementBudget();

      const result: EvolutionResult = {
        id: resultId,
        planId: plan.id,
        status,
        diffs,
        completedAt: new Date().toISOString(),
      };

      // 保存结果到 store
      await this.store.saveResult(result);

      return result;
    } catch (e) {
      // 失败 → 自动 rollback
      log.warn('applyPlan:auto_rollback', { reason: this.errorMsg(e) });
      const partialResult: EvolutionResult = {
        id: resultId,
        planId: plan.id,
        status: 'failed',
        diffs,
        completedAt: new Date().toISOString(),
      };
      await this.rollback(partialResult);
      await this.recordRollback();
      return { ...partialResult, status: 'rolled-back' };
    }
  }

  /**
   * 执行单个进化动作
   *
   * 入口校验：所有 create-skill / revise-spec 必须先过 `SkillSpecSchema.parse()`，
   * 失败抛 `CreationError.ValidationFailed`——避免演化绕过 Creator.validate 的安全检查。
   */
  private async executeAction(action: EvolutionAction, _plan: EvolutionPlan): Promise<SpecDiff | null> {
    switch (action.kind) {
      case 'create-skill': {
        // 0) 入口 schema 校验（对齐 references/validation.md §1）
        try {
          const { SkillSpecSchema } = await import('./spec/skill-spec');
          SkillSpecSchema.parse(action.spec);
        } catch (e) {
          log.warn('applyPlan:create_skill_schema_invalid', { name: action.spec.name, error: (e as Error).message });
          throw new Error(`create-skill spec invalid: ${(e as Error).message}`);
        }

        // 1. 创建快照
        await this.memory.snapshot(action.spec.name, JSON.stringify({ op: 'before', planId: _plan.id }));

        // 2. 直接使用 spec（不再通过 TemplateSkillGenerator）
        const spec: SkillSpec = {
          ...action.spec,
          origin: { kind: 'evolved', fromSpecId: action.spec.name },
          createdAt: new Date().toISOString(),
        };

        // 3. 创建目录和文件
        const { Filesystem } = await import('@easbot/utils');
        const storageDir = this._storageDir;
        const dir = path.join(storageDir, 'skills', spec.name);
        const filePath = path.join(dir, 'SKILL.md');

        await fs.mkdir(dir, { recursive: true });

        // 渲染 markdown
        const content = this.renderSkillMarkdown(spec);
        await Filesystem.write(filePath, content);

        // 4. 写元数据
        const metaPath = path.join(dir, '.creation-meta.json');
        await Filesystem.write(
          metaPath,
          JSON.stringify(
            {
              specId: spec.name,
              origin: spec.origin,
              createdAt: spec.createdAt,
              trustLevel: 'sandbox',
              version: '1.0.0',
            },
            null,
            2,
          ),
        );

        return {
          specId: spec.name,
          type: 'created',
          after: filePath,
        };
      }

      case 'revise-spec': {
        // 0) 入口 schema 校验
        const newSpec = action.newSpec as SkillSpec;
        try {
          const { SkillSpecSchema } = await import('./spec/skill-spec');
          SkillSpecSchema.parse(newSpec);
        } catch (e) {
          log.warn('applyPlan:revise_spec_schema_invalid', { specId: action.specId, error: (e as Error).message });
          throw new Error(`revise-spec newSpec invalid: ${(e as Error).message}`);
        }

        // 修订：读取旧文件，替换内容
        const storageDir = this._storageDir;
        const filePath = path.join(storageDir, 'skills', action.specId, 'SKILL.md');
        try {
          const oldContent = await fs.readFile(filePath, 'utf-8');
          await this.memory.snapshot(action.specId, oldContent);

          const content = this.renderSkillMarkdown(newSpec);
          await fs.writeFile(filePath, content, 'utf-8');

          return {
            specId: action.specId,
            type: 'modified',
            before: oldContent,
            after: content,
          };
        } catch (e) {
          log.warn('applyPlan:revise_spec_not_found', { specId: action.specId });
          return null;
        }
      }

      case 'deprecate': {
        // 废弃：标记文件或删除
        const storageDir = this._storageDir;
        const dir = path.join(storageDir, 'skills', action.specId);
        try {
          const metaPath = path.join(dir, '.creation-meta.json');
          const meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
          meta.deprecated = true;
          meta.deprecatedReason = action.reason;
          meta.deprecatedAt = new Date().toISOString();
          await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));

          return {
            specId: action.specId,
            type: 'modified',
            after: 'deprecated',
          };
        } catch {
          log.warn('applyPlan:deprecate_not_found', { specId: action.specId });
          return null;
        }
      }

      case 'create-workflow': {
        throw new Error('create-workflow is not implemented yet');
      }
    }
  }

  // ── 回滚 ───────────────────────────────────────────────

  /**
   * 回滚进化结果
   */
  async rollback(result: EvolutionResult): Promise<void> {
    log.info('rollback:start', { resultId: result.id, diffs: result.diffs.length });

    for (const diff of result.diffs) {
      if (diff.type === 'created' && diff.after) {
        // 删除 created 的 spec
        const filePath = diff.after;
        try {
          await fs.rm(path.dirname(filePath), { recursive: true, force: true });
          log.debug('rollback:deleted_created', { path: filePath });
        } catch (e) {
          log.error('rollback:delete_failed', { path: filePath, error: this.errorMsg(e) });
        }
      } else if (diff.type === 'modified' && diff.before) {
        // 恢复 modified 的 spec
        const storageDir = this._storageDir;
        const filePath = path.join(storageDir, 'skills', diff.specId, 'SKILL.md');
        try {
          await fs.writeFile(filePath, diff.before, 'utf-8');
          log.debug('rollback:restored_modified', { specId: diff.specId });
        } catch (e) {
          log.error('rollback:restore_failed', { specId: diff.specId, error: this.errorMsg(e) });
        }
      }
    }
  }

  // ── 配额/冷却 ─────────────────────────────────────────

  /**
   * 加载进化配额状态
   */
  async loadQuota(): Promise<EvolverQuota> {
    return this.store.loadQuota();
  }

  /**
   * 保存进化配额状态
   */
  private async saveQuota(quota: EvolverQuota): Promise<void> {
    await this.store.saveQuota(quota);
  }

  /**
   * 检查是否在冷却中
   */
  async isInCooldown(): Promise<boolean> {
    const quota = await this.loadQuota();
    if (!quota.cooldownUntil) return false;
    return new Date() < new Date(quota.cooldownUntil);
  }

  /**
   * 增加配额计数
   */
  private async incrementBudget(): Promise<void> {
    const quota = await this.loadQuota();
    quota.todayCount++;
    await this.saveQuota(quota);
  }

  /**
   * 记录 rollback 并更新冷却状态
   */
  private async recordRollback(): Promise<void> {
    const quota = await this.loadQuota();
    quota.consecutiveRollbacks++;
    quota.lastRollbackAt = new Date().toISOString();

    // 连续 2 次 rollback → 冷却
    if (quota.consecutiveRollbacks >= 2) {
      const cooldownUntil = new Date(Date.now() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
      quota.cooldownUntil = cooldownUntil.toISOString();
      log.warn('evolver:cooldown_triggered', { cooldownUntil: quota.cooldownUntil });
    }

    await this.saveQuota(quota);
  }

  // ── 辅助方法 ───────────────────────────────────────────

  /**
   * 合成替代 skill 规格
   *
   * 注意：0024 评审后 SkillSpec 是强类型（`mode` / `composition` / `deliveryChecklist`
   * 必填，`name` 必须满足正则在 spec/skill-spec.ts）。本方法生成最小合法 spec。
   */
  private synthesizeReplacementSkill(refId: string, w: Weakness): SkillSpec {
    return {
      name: `${refId}-v2`,
      description: `Regenerated ${refId} for weakness: ${w.evidence[0] ?? 'N/A'}`,
      scope: 'general',
      body: `# ${refId} v2\n\n## Purpose\nRedesign for weakness\n\n## Evidence\n${(w.evidence ?? []).map((e) => `- ${e}`).join('\n')}\n\n## Steps\n1. Analyze requirements\n2. Apply new strategy\n3. Validate output\n4. Return result\n`,
      origin: { kind: 'evolved', fromSpecId: refId },
      createdAt: new Date().toISOString(),
      mode: 'generator',
      composition: 'single',
      deliveryChecklist: {
        developmentGuide: false,
        pitfallTable: false,
        reviewProcess: false,
        deploymentGuide: false,
        observability: false,
        scripts: false,
      },
    };
  }

  /**
   * 创建空 skill 规格（占位）
   */
  private emptySkillSpec(name: string, desc: string): SkillSpec {
    return {
      name,
      description: desc.slice(0, 200),
      scope: 'general',
      body: `# ${name}\n\n${desc}\n\n## Steps\n1. Analyze input\n2. Execute core logic\n3. Validate output\n4. Return result\n`,
      origin: { kind: 'evolved' },
      createdAt: new Date().toISOString(),
      mode: 'generator',
      composition: 'single',
      deliveryChecklist: {
        developmentGuide: false,
        pitfallTable: false,
        reviewProcess: false,
        deploymentGuide: false,
        observability: false,
        scripts: false,
      },
    };
  }

  /**
   * 渲染 SKILL.md
   */
  private renderSkillMarkdown(spec: SkillSpec): string {
    const fmLines: string[] = ['---'];
    fmLines.push(`name: ${spec.name}`);
    fmLines.push(`description: ${spec.description}`);
    if (spec.scope) fmLines.push(`scope: ${spec.scope}`);
    if (spec.mode) fmLines.push(`mode: ${spec.mode}`);
    fmLines.push('---');
    fmLines.push('');
    fmLines.push(spec.body);
    return fmLines.join('\n');
  }

  /**
   * 获取错误消息
   */
  private errorMsg(e: unknown): string {
    if (e instanceof Error) return e.message;
    return String(e);
  }
}

/**
 * 创建进化引擎实例
 *
 * @param deps 依赖
 * @param deps.memory 记忆接口
 * @param options 配置选项
 * @returns 进化引擎实例
 */
export function createEvolver(deps: { memory: Memory }, options?: EvolverOptions): Evolver {
  return new DefaultEvolver(deps, options);
}
