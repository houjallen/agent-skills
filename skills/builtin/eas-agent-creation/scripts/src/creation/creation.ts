/**
 * packages/agent/src/creation/creation.ts
 * Creation 命名空间 — 统一状态管理模式
 *
 * 设计依据：
 * - 与 Skill/Scheduler/Project 等 namespace 对齐
 * - State 工厂模式：懒加载 + dispose 钩子
 * - 三个入口汇聚：Command / Tool / Scheduler
 *
 * 子模块：
 * - Creator: 创造 Skill/Workflow
 * - Assessor: 自我评估
 * - Evolver: 进化引擎
 * - Memory: 记忆持久化
 */

import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { Log } from '@easbot/utils';
import { Identifier } from '@easbot/utils';
import { Instance } from '../project/instance';
import { Global } from '../global';
import { State } from '../project/state';
import { Bus } from '../bus';
import { HookRegistry } from '../hook';
import { HookEvent } from '@easbot/plugin';
import { CreationError } from './errors';
import { CreationEvents } from './events';
import type { Composition, EvolverQuota, SelfAssessment, SkillMode, SkillSpec } from './types';
import type { Memory } from './memory';

/** Creation 命名空间日志 */
const log = Log.create({ service: 'creation' });

/** Skill 模式常量 */
export const SkillModes = ['tool-wrapper', 'generator', 'reviewer', 'inversion', 'pipeline'] as const;

/** 导出类型 */
export type { Composition } from './types';

/**
 * 组合类型定义
 */
export type CompositionType = {
  /** 主模式 */
  primary: SkillMode;
  /** 次要模式 */
  secondary: SkillMode[];
  /** 连接关系 */
  connections: Array<{ from: SkillMode; to: SkillMode; kind: 'embed' | 'sequence' | 'gate' }>;
};

export namespace Creation {
  // ── 内部状态类型 ─────────────────────────────────────────

  /** Evolver 内部状态 */
  type EvolverState = {
    today: string;
    todayCount: number;
    consecutiveRollbacks: number;
    lastRollbackAt?: string;
    cooldownUntil?: string;
  };

  /**
   * Creation 状态
   */
  export interface State {
    /** 已创造的 Skills */
    skills: Record<string, SkillSpec>;
    /** 已创造的 Workflows */
    workflows: Record<string, unknown>;
    /** 已创造的 Bundles */
    bundles: Record<string, unknown>;
    /** Evolver 状态 */
    evolver: EvolverState;
    /** Memory 是否就绪 */
    memoryReady: boolean;
    /** 元数据 */
    meta: {
      storageDir: string;
      memoryDir: string;
      initializedAt: string;
      version: string;
    };
  }

  /**
   * Creation 配置选项
   */
  export type Options = {
    /** 存储目录 */
    storageDir?: string;
    /** 记忆目录 */
    memoryDir?: string;
    /** Evolver 状态文件路径 */
    evolverStatePath?: string;
    /** 计划文件路径 */
    plansFilePath?: string;
  };

  // ── 模块级配置 ──────────────────────────────────────────

  let _options: Options = {};

  // ── State 工厂 ──────────────────────────────────────────

  let _stateFactory: (() => Promise<State>) | undefined;

  // ── 子模块缓存（避免每次 importSubmodules 都创建新实例）───

  let _creatorCache: ReturnType<typeof import('./creator').createCreator> | undefined;
  let _creatorScope: 'global' | 'project' | undefined;
  let _memoryCache: ReturnType<typeof import('./memory').createMemory> | undefined;
  let _assessorCache: ReturnType<typeof import('./assessor').createSelfAssessor> | undefined;
  let _evolverCache: ReturnType<typeof import('./evolver').createEvolver> | undefined;

  // ── 私有工具函数 ────────────────────────────────────────

  /**
   * 解析配置选项
   */
  function resolveOptions(): Required<Options> {
    const storageDir = _options.storageDir ?? path.join(os.homedir(), '.easbot', 'created');
    const memoryDir = _options.memoryDir ?? path.join(os.homedir(), '.easbot', 'memory-bridge');
    const evolverStatePath = _options.evolverStatePath ?? path.join(storageDir, '.evolver-state.json');
    const plansFilePath = _options.plansFilePath ?? path.join(storageDir, '.evolver-plans.json');
    return { storageDir, memoryDir, evolverStatePath, plansFilePath };
  }

  /**
   * 加载 Evolver 状态
   */
  async function loadEvolverState(filePath: string): Promise<EvolverState> {
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<EvolverState>;
      const today = new Date().toISOString().slice(0, 10);
      const state: EvolverState = {
        today: parsed.today ?? today,
        todayCount: parsed.todayCount ?? 0,
        consecutiveRollbacks: parsed.consecutiveRollbacks ?? 0,
        lastRollbackAt: parsed.lastRollbackAt,
        cooldownUntil: parsed.cooldownUntil,
      };
      // 检查日期切换
      if (state.today !== today) {
        state.today = today;
        state.todayCount = 0;
        state.consecutiveRollbacks = 0;
        state.cooldownUntil = undefined;
      }
      return state;
    } catch {
      return {
        today: new Date().toISOString().slice(0, 10),
        todayCount: 0,
        consecutiveRollbacks: 0,
      };
    }
  }

  /**
   * 获取 State 工厂
   */
  function getStateFactory(): () => Promise<State> {
    if (!_stateFactory) {
      _stateFactory = Instance.state(
        async (): Promise<State> => {
          const { memoryDir, evolverStatePath } = resolveOptions();

          const { createCreator } = await import('./creator');
          const { createMemory } = await import('./memory');

          const memory = createMemory(memoryDir);
          await memory.init();

          // 合并扫描 project + global 两个 storageDir
          // （Creator.registerSkill 按 scope 写到对应目录，
          //   但 resolveOptions().storageDir 默认 ~/.easbot/created 与二者都不同，
          //   必须显式按两个 scope 目录扫描才能 list 看到 create 的产物）
          const projectDir = path.join(Instance.directory, '.easbot');
          const globalDir = Global.Path.config;
          const skills: Record<string, SkillSpec> = {};
          const workflows: Record<string, unknown> = {};
          const bundles: Record<string, unknown> = {};

          for (const storageDir of [projectDir, globalDir]) {
            const creator = createCreator({ storageDir });
            const s = await creator.scanCreatedSkills();
            const w = await creator.scanCreatedWorkflows();
            const b = await creator.scanCreatedBundles();
            Object.assign(skills, s);
            Object.assign(workflows, w);
            Object.assign(bundles, b);
          }

          const evolver = await loadEvolverState(evolverStatePath);

          return {
            skills,
            workflows,
            bundles,
            evolver,
            memoryReady: true,
            meta: {
              storageDir: `${projectDir} + ${globalDir}`,
              memoryDir,
              initializedAt: new Date().toISOString(),
              version: 'v1',
            },
          };
        },
        async () => {
          // dispose 钩子
        },
      );
    }
    return _stateFactory;
  }

  /**
   * 根据 scope 获取技能存储根目录（导出供 tool.ts / Evolver 复用）
   *
   * - 'global': Global.Path.config（用户配置目录）
   * - 'project': Instance.directory/.easbot（项目本地目录）
   *
   * P1-3：之前 tool.ts 自带 defaultDirectoryForScope 与本函数重复，且
   * defaultDirectoryForCreator 末尾多加 `/skills` 段，与本函数路径不一致，
   * 导致 review/assess 读不到 create 写出来的文件。现在统一 export，
   * tool.ts 直接调用。
   *
   * creator.registerSkill 会在此目录下创建 skills/{skillName}/SKILL.md
   */
  export function getSkillStorageRoot(scope: 'global' | 'project'): string {
    if (scope === 'global') {
      return Global.Path.config;
    }
    // project（默认）
    return path.join(Instance.directory, '.easbot');
  }

  /**
   * 获取子模块（带缓存）
   */
  async function getSubmodules(scope: 'global' | 'project' = 'project') {
    const { storageDir, memoryDir } = resolveOptions();

    // P2-12：scope 切换时释放前一个 Creator（保留 dispose hook 即可）
    if (!_creatorCache || _creatorScope !== scope) {
      if (_creatorCache?.dispose) {
        try {
          await _creatorCache.dispose();
        } catch {
          // 释放失败不影响新实例创建
        }
      }
      const { createCreator } = await import('./creator');
      const targetDir = getSkillStorageRoot(scope);
      _creatorCache = createCreator({ storageDir: targetDir });
      _creatorScope = scope;
    }

    // Memory 缓存
    if (!_memoryCache) {
      const { createMemory } = await import('./memory');
      _memoryCache = createMemory(memoryDir);
    }

    // Assessor 缓存
    if (!_assessorCache) {
      const { createSelfAssessor } = await import('./assessor');
      _assessorCache = createSelfAssessor(_memoryCache);
    }

    // Evolver 缓存
    if (!_evolverCache) {
      const { createEvolver } = await import('./evolver');
      // P0-1：Evolver 落盘目录必须与 Creator 对齐（默认 project scope），
      // 否则 evolve 创建的 skill 在 list 中不可见。
      const evolverStorageDir = getSkillStorageRoot(scope);
      _evolverCache = createEvolver(
        { memory: _memoryCache },
        {
          stateFilePath: _options.evolverStatePath,
          plansFilePath: _options.plansFilePath,
          storageDir: evolverStorageDir,
        },
      );
    }

    return {
      creator: _creatorCache,
      memory: _memoryCache,
      assessor: _assessorCache,
      evolver: _evolverCache,
    };
  }

  // ── 导出 API ────────────────────────────────────────────

  /**
   * 获取全局状态（懒加载）
   */
  export function state(): Promise<State> {
    return getStateFactory()();
  }

  /**
   * 获取 Memory 实例（用于 Hook 等场景）
   */
  export async function memory(): Promise<Memory> {
    const { memory: m } = await getSubmodules();
    return m;
  }

  /**
   * 初始化
   */
  export async function init(): Promise<void> {
    const s = await state();
    log.info('creation:initialized', {
      skills: Object.keys(s.skills).length,
      workflows: Object.keys(s.workflows).length,
      bundles: Object.keys(s.bundles).length,
      storageDir: s.meta.storageDir,
    });
  }

  /**
   * 释放资源
   */
  export async function dispose(): Promise<void> {
    // 清理缓存
    _creatorCache = undefined;
    _memoryCache = undefined;
    _assessorCache = undefined;
    _evolverCache = undefined;
    _stateFactory = undefined;

    // 清理状态
    await State.dispose('creation');
    log.info('creation:disposed');
  }

  /**
   * 配置选项
   */
  export function configure(options: Options): void {
    _options = { ..._options, ...options };
    // 配置变更时清除缓存
    _creatorCache = undefined;
    _evolverCache = undefined;
  }

  /**
   * 获取配置选项
   */
  export function getOptions(): Options {
    return _options;
  }

  // ── 1. 创造 ─────────────────────────────────────────────

  /**
   * 创造 Skill（端到端）
   *
   * 流程：
   * 1. Hook Event 触发
   * 2. inferComposition → 推断组合模式
   * 3. generate → 生成 SkillSpec
   * 4. validate → 校验
   * 5. register → 写盘 + Bus 事件
   * 6. recordExperience → 记录经验
   * 7. Hook Event 完成
   * 8. 刷新 State
   *
   * @param req 创造请求
   * @param req.requirement 需求描述
   * @param req.hints 提示信息
   * @param req.forceMode 强制模式
   * @param req.scope 创建范围：'global'（落到 {config}/skills/{name}）|'project'（落到 Instance.directory/.easbot/skills/{name}）
   * @returns 创造的 Skill 规格（含 path 字段，标记 SKILL.md 实际落盘路径）
   */
  export async function create(req: { requirement: string; hints?: string[]; forceMode?: SkillMode; sessionId?: string; scope?: 'global' | 'project' }): Promise<SkillSpec & { path: string }> {
    const startTime = Date.now();
    const requestId = `creq-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const sessionId = req.sessionId ?? 'unknown';

    // 触发 Hook
    await HookRegistry.triggerEvent(HookEvent.CreationRequest, {
      requestId,
      kind: 'create-skill',
      requirement: req.requirement,
      hints: req.hints ?? [],
      origin: { source: 'namespace', timestamp: startTime },
    });

    try {
      const { creator: c, memory: m } = await getSubmodules(req.scope ?? 'project');

      // 推断组合模式
      const composition: Composition = req.forceMode ? { primary: req.forceMode, secondary: [], connections: [] } : await c.inferComposition(req.requirement, req.hints);

      // 生成规格
      const spec = await c.generate(req.requirement, composition);

      // 校验
      const validation = await c.validate(spec);
      if (!validation.ok) {
        await m.recordExperience({
          id: `exp-${Date.now()}`,
          type: 'failure',
          context: { task: 'create', agent: 'creation', sessionId },
          action: { kind: 'skill', refId: spec.name, params: { requirement: req.requirement } },
          result: { ok: false, output: null, durationMs: Date.now() - startTime, error: validation.errors.join('; ') },
          createdAt: new Date().toISOString(),
        });
        throw new CreationError.ValidationFailed({ name: spec.name, errors: validation.errors });
      }

      // 注册
      const registerResult = await c.register(spec);
      if (!registerResult.accepted || !registerResult.path) {
        throw new CreationError.RegisterRejected({ name: spec.name, reason: registerResult.reason ?? 'unknown' });
      }

      // P2-13：与 Evolver 对齐，落盘后立刻写快照
      // （便于后续演化走 rollback 路径；若 specId 已存在则快照以最近版本覆盖）
      try {
        const fs = await import('node:fs/promises');
        const content = await fs.readFile(registerResult.path, 'utf-8');
        await m.snapshot(registerResult.specId ?? spec.name, content);
      } catch {
        // 快照失败不阻塞 create 主流程（演化路径仍可重新生成）
        log.warn('creation:snapshot_failed', { path: registerResult.path });
      }

      // 记录经验
      await m.recordExperience({
        id: Identifier.ascending('experience'),
        type: 'success',
        context: { task: 'create', agent: 'creation', sessionId },
        action: { kind: 'skill', refId: spec.name, params: { requirement: req.requirement } },
        result: { ok: true, output: { specId: spec.name, path: registerResult.path }, durationMs: Date.now() - startTime },
        createdAt: new Date().toISOString(),
      });

      // Hook 完成
      await HookRegistry.triggerEvent(HookEvent.CreationComplete, {
        requestId,
        status: 'success',
        specId: spec.name,
        durationMs: Date.now() - startTime,
      });

      // Bus 事件
      await Bus.publishSafe(CreationEvents.SkillCreated, {
        specId: spec.name,
        name: spec.name,
        mode: spec.mode ?? 'generator',
        composition: spec.composition ?? 'single',
        path: registerResult.path,
        trustLevel: 'sandbox',
        origin: spec.origin,
      });

      // 更新状态
      const s = await state();
      s.skills[spec.name] = spec;

      log.info('creation:created', { name: spec.name, mode: spec.mode, path: registerResult.path, durationMs: Date.now() - startTime });
      return { ...spec, path: registerResult.path };
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      log.error('creation:create:failed', { error: errMsg });

      await HookRegistry.triggerEvent(HookEvent.CreationComplete, {
        requestId,
        status: 'failed',
        error: errMsg,
        durationMs: Date.now() - startTime,
      });

      throw e;
    }
  }

  // ── 2. 进化 ─────────────────────────────────────────────

  /**
   * 触发进化循环
   *
   * 流程：
   * 1. 检查冷却
   * 2. 检查配额
   * 3. Assessor.assess → SelfAssessment
   * 4. Evolver.planEvolution → EvolutionPlan[]
   * 5. 高风险 → 记录待审批
   * 6. 低风险 → 直接 applyPlan
   *
   * @param opts 选项
   * @param opts.dryRun 是否只生成计划不执行
   * @returns 进化结果
   */
  export async function evolve(opts?: { dryRun?: boolean }): Promise<{
    plans: Array<{ id: string; approval: { required: boolean; reason?: string } }>;
    applied: number;
    awaitingApproval: number;
  }> {
    const dryRun = opts?.dryRun ?? false;

    await HookRegistry.triggerEvent(HookEvent.EvolutionRequest, { dryRun });

    const { assessor: a, evolver: e } = await getSubmodules();

    // 1. 检查冷却
    if (await e.isInCooldown()) {
      log.warn('evolve:in_cooldown');
      return { plans: [], applied: 0, awaitingApproval: 0 };
    }

    // 2. 检查配额
    const quota = await e.loadQuota();
    const dailyLimit = 10;
    if (quota.todayCount >= dailyLimit) {
      throw new CreationError.BudgetExhausted({ todayCount: quota.todayCount, limit: dailyLimit });
    }

    // 3. 自评估
    const assessment = await a.assess({ windowDays: 7 });

    // 4. 生成计划
    const plans = await e.planEvolution(assessment);

    await Bus.publishSafe(CreationEvents.EvolutionPlanned, {
      planIds: plans.map((p) => p.id),
      generatedAt: new Date().toISOString(),
    });

    if (plans.length === 0) {
      return { plans: [], applied: 0, awaitingApproval: 0 };
    }

    const applied: string[] = [];
    const awaitingApproval: string[] = [];

    for (const plan of plans) {
      if (plan.approval.required && !dryRun) {
        awaitingApproval.push(plan.id);
        await e.recordAwaitingApproval(plan);
        await Bus.publishSafe(CreationEvents.EvolutionAwaitingApproval, {
          planId: plan.id,
          reason: plan.approval.reason,
        });
        continue;
      }

      if (!dryRun) {
        const result = await e.applyPlan(plan);
        applied.push(result.id);
        await Bus.publishSafe(CreationEvents.EvolutionApplied, {
          planId: plan.id,
          resultId: result.id,
          status: result.status,
          completedAt: result.completedAt,
        });
      }
    }

    await HookRegistry.triggerEvent(HookEvent.EvolutionComplete, {
      status: awaitingApproval.length > 0 ? 'awaiting-approval' : 'success',
      applied: applied.length,
      awaitingApproval: awaitingApproval.length,
    });

    return {
      plans: plans.map((p) => ({ id: p.id, approval: p.approval })),
      applied: applied.length,
      awaitingApproval: awaitingApproval.length,
    };
  }

  /**
   * 应用已审批的计划
   *
   * @param planId 计划 ID
   * @param _approval 审批信息（用于审计）
   * @returns 进化结果
   */
  export async function applyPlan(planId: string, _approval?: { approvedBy: string }): Promise<unknown> {
    const { evolver: e } = await getSubmodules();
    const plan = await e.getPlan(planId);
    if (!plan) {
      throw new CreationError.ApprovalRequired({ planId, reason: 'plan not found' });
    }
    return e.applyPlan(plan, {});
  }

  // ── 3. 评估 ─────────────────────────────────────────────

  /**
   * 获取自我评估
   *
   * @param opts 选项
   * @param opts.windowDays 评估窗口天数
   * @returns 自我评估结果
   */
  export async function assess(opts?: { windowDays?: number }): Promise<SelfAssessment> {
    const { assessor: a } = await getSubmodules();
    return a.assess(opts);
  }

  // ── 4. 管理 ─────────────────────────────────────────────

  /**
   * 列出已创造的 Skill
   *
   * @param opts 选项
   * @param opts.mode 按模式过滤
   * @param opts.limit 返回数量限制
   * @param opts.offset 偏移量
   * @returns Skill 列表
   */
  export async function list(opts?: { mode?: SkillMode; limit?: number; offset?: number }): Promise<SkillSpec[]> {
    const s = await state();
    let skills = Object.values(s.skills);

    if (opts?.mode) {
      skills = skills.filter((sk) => sk.mode === opts.mode || (opts.mode && sk.secondaryModes?.includes(opts.mode)));
    }

    const offset = opts?.offset ?? 0;
    const limit = opts?.limit ?? 50;
    return skills.slice(offset, offset + limit);
  }

  /**
   * 获取单个 Skill
   *
   * @param name Skill 名称
   * @returns Skill 规格（不存在则返回 undefined）
   */
  export async function get(name: string): Promise<SkillSpec | undefined> {
    const s = await state();
    return s.skills[name];
  }

  /**
   * 移除 Skill
   *
   * @param name Skill 名称
   * @returns 是否成功移除
   */
  export async function remove(name: string): Promise<{ removed: boolean }> {
    const { creator: c } = await getSubmodules();
    const removed = await c.remove(name);
    if (removed) {
      const s = await state();
      delete s.skills[name];
    }
    await Bus.publishSafe(CreationEvents.SkillRemoved, { name, removed });
    return { removed };
  }

  /**
   * 刷新（重新扫描）
   */
  export async function refresh(): Promise<void> {
    const s = await state();
    const { creator: c } = await getSubmodules();
    s.skills = await c.scanCreatedSkills();
    s.workflows = await c.scanCreatedWorkflows();
    s.bundles = await c.scanCreatedBundles();
    log.info('creation:refreshed', {
      skills: Object.keys(s.skills).length,
      workflows: Object.keys(s.workflows).length,
    });
  }

  /**
   * 获取进化配额状态
   *
   * @returns 配额状态
   */
  export async function quota(): Promise<EvolverQuota> {
    const { evolver: e } = await getSubmodules();
    return e.loadQuota();
  }
}
