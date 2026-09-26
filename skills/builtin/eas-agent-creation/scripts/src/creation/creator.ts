/**
 * packages/agent/src/creation/creator.ts
 * 创造引擎：动态生成 Skill / Workflow 规格并注册
 *
 * 设计依据：
 * - 基于自然语言需求生成 Skill 规格
 * - 注册到 ~/.easbot/created/ 目录
 * - 所有创造物 trustLevel='sandbox'
 *
 * MVP 范围：
 * - createSkill：完整实现（落地为 SKILL.md）
 * - createWorkflow：接口占位
 * - validate：完整实现
 * - register：完整实现（写盘 + Bus 通知）
 */

import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import z from 'zod';
import { glob } from 'glob';
import { Log, Markdown, Filesystem } from '@easbot/utils';
import { Bus } from '../bus';
import { BusEvent } from '../bus/bus-event';
import { loadTextFile } from '@easbot/utils';
import { renderSkillMarkdown } from './render-skill-md';
import type { Composition, CreateSkillRequest, CreateWorkflowRequest, DeliveryChecklist, Portability, SkillMode, SkillSpec, ValidationResult, WorkflowSpec } from './types';

/** 创造引擎日志 */
const log = Log.create({ service: 'creation.creator' });

/** 模式模板加载（使用 loadTextFile） */
const getToolWrapperTemplate = loadTextFile('./template/modes/tool-wrapper.txt', import.meta.url);
const getGeneratorTemplate = loadTextFile('./template/modes/generator.txt', import.meta.url);
const getReviewerTemplate = loadTextFile('./template/modes/reviewer.txt', import.meta.url);
const getInversionTemplate = loadTextFile('./template/modes/inversion.txt', import.meta.url);
const getPipelineTemplate = loadTextFile('./template/modes/pipeline.txt', import.meta.url);

/** 模式模板映射 */
const MODE_TEMPLATES: Record<string, () => string> = {
  'tool-wrapper': getToolWrapperTemplate,
  generator: getGeneratorTemplate,
  reviewer: getReviewerTemplate,
  inversion: getInversionTemplate,
  pipeline: getPipelineTemplate,
};

/** Skill 创造事件 */
const SkillCreated = BusEvent.define(
  'creation.skill.created',
  z.object({
    specId: z.string(),
    name: z.string(),
    path: z.string(),
    trustLevel: z.literal('sandbox'),
    origin: z.object({
      kind: z.enum(['created', 'evolved']),
      fromSpecId: z.string().optional(),
      experienceIds: z.array(z.string()).optional(),
    }),
  }),
);

/** Workflow 创造事件 */
const WorkflowCreated = BusEvent.define(
  'creation.workflow.created',
  z.object({
    specId: z.string(),
    name: z.string(),
    path: z.string(),
    trustLevel: z.literal('sandbox'),
    origin: z.object({
      kind: z.enum(['created', 'evolved']),
      fromSpecId: z.string().optional(),
    }),
  }),
);

/** 创造物默认目录 */
function defaultCreatedBaseDir(): string {
  return path.join(os.homedir(), '.easbot', 'created');
}

/** 创造物元数据文件名 */
const SPEC_METADATA_FILE = '.creation-meta.json';

// ── 配置选项 ─────────────────────────────────────────────

/**
 * Creator 配置选项
 */
export interface CreatorOptions {
  /** 创造物写入目录（默认 ~/.easbot/created） */
  storageDir?: string;
}

/**
 * 创造错误
 */
export class CreatorError extends Error {
  /** 错误码 */
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'CreatorError';
    this.code = code;
  }
}

// ── Creator 接口 ─────────────────────────────────────────

/**
 * 创造引擎接口
 */
export interface Creator {
  /**
   * 基于需求创造 Skill
   * @param req 创造请求
   * @returns Skill 规格
   */
  createSkill(req: CreateSkillRequest): Promise<SkillSpec>;

  /**
   * 基于目标创造 Workflow（未实现）
   */
  createWorkflow(req: CreateWorkflowRequest): Promise<WorkflowSpec>;

  /**
   * 校验规格
   */
  validate(spec: SkillSpec | WorkflowSpec): Promise<ValidationResult>;

  /**
   * 注册到 Skill 系统
   */
  register(spec: SkillSpec | WorkflowSpec): Promise<RegisterResult>;

  /**
   * 推断组合模式
   */
  inferComposition(requirement: string, hints?: string[]): Promise<Composition>;

  /**
   * 生成 Skill 规格
   */
  generate(requirement: string, composition: Composition): Promise<SkillSpec>;

  /**
   * 移除 Skill
   */
  remove(name: string): Promise<boolean>;

  /**
   * 扫描已创造的 Skills
   */
  scanCreatedSkills(): Promise<Record<string, SkillSpec>>;

  /**
   * 扫描已创造的 Workflows
   */
  scanCreatedWorkflows(): Promise<Record<string, WorkflowSpec>>;

  /**
   * 扫描已创造的 Bundles（未实现）
   */
  scanCreatedBundles(): Promise<Record<string, unknown>>;

  /**
   * 获取存储目录
   */
  storageDir(): string;

  /**
   * 释放资源（P2-12）
   *
   * Creator 内部目前没有持久资源（无 fs handle / 无 timer / 无全局状态），
   * 但保留 dispose hook 以便未来：
   * - 注入持久连接 / 缓存
   * - 与 Creation.getSubmodules 的缓存替换配合释放前一个实例
   *
   * 默认实现 no-op；子类按需 override。
   */
  dispose?(): Promise<void> | void;
}

/**
 * 注册结果
 */
export interface RegisterResult {
  /** 是否接受 */
  accepted: boolean;
  /** 拒绝原因 */
  reason?: string;
  /** 写入路径 */
  path?: string;
  /** 规范 ID */
  specId?: string;
}

// ── 创造引擎实现 ─────────────────────────────────────────

/**
 * 创造引擎默认实现
 *
 * 基于模板生成 Skill 规格
 */
export class DefaultCreator implements Creator {
  private readonly _storageDir: string;

  /**
   * 创建创造引擎
   * @param options 配置选项
   */
  constructor(options?: CreatorOptions) {
    this._storageDir = options?.storageDir ?? defaultCreatedBaseDir();
  }

  /**
   * 获取存储目录（兼容旧 API）
   */
  getStorageDir(): string {
    return this._storageDir;
  }

  /**
   * 获取存储目录（兼容新 API）
   */
  storageDir(): string {
    return this._storageDir;
  }

  // ── createSkill ─────────────────────────────────────────

  /**
   * 创造 Skill
   */
  async createSkill(req: CreateSkillRequest): Promise<SkillSpec> {
    log.info('createSkill:start', { requirement: req.requirement.slice(0, 80) });

    // 1. 校验入参
    if (!req.requirement || req.requirement.trim().length === 0) {
      throw new CreatorError('EMPTY_REQUIREMENT', 'requirement cannot be empty');
    }

    // 2. 推断组合模式
    const composition = await this.inferComposition(req.requirement, req.hints);

    // 3. 生成规格
    const spec = await this.generate(req.requirement, composition);

    // 4. 校验
    const validation = await this.validate(spec);
    if (!validation.ok) {
      log.error('createSkill:validate_failed', { errors: validation.errors });
      throw new CreatorError('VALIDATION_FAILED', `Validation failed: ${validation.errors.join('; ')}`);
    }

    // 5. 标记来源
    const finalSpec: SkillSpec = {
      ...spec,
      origin: {
        kind: 'created',
        experienceIds: [],
      },
      createdAt: new Date().toISOString(),
    };

    log.info('createSkill:success', { name: finalSpec.name });
    return finalSpec;
  }

  // ── createWorkflow ──────────────────────────────────────

  /**
   * 创造 Workflow（未实现）
   */
  async createWorkflow(_req: CreateWorkflowRequest): Promise<WorkflowSpec> {
    throw new CreatorError('NOT_IMPLEMENTED', 'createWorkflow is not implemented yet');
  }

  // ── validate ────────────────────────────────────────────

  /**
   * 校验规格
   *
   * 强校验路径：使用 `spec/skill-spec.ts` 的 `SkillSpecSchema`（Zod）做完整字段校验，
   * 替代旧版 `Creator` 内置松散校验（mode/composition 必填、deliveryChecklist 必填、
   * name 正则等）。这与 references/validation.md §1-§4 的强校验规则对齐。
   *
   * 同时仍保留本类内的轻量校验（prompt 注入扫描、kebab-case 检查）作为补充。
   */
  async validate(spec: SkillSpec | WorkflowSpec): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if ('body' in spec) {
      // ── 1) Zod 强校验（对齐 references/skill-spec.md §3 + spec/skill-spec.ts） ──
      try {
        const { SkillSpecSchema } = await import('./spec/skill-spec');
        SkillSpecSchema.parse(spec);
      } catch (e) {
        const zodErr = e as { issues?: Array<{ path: (string | number)[]; message: string }> };
        if (zodErr.issues) {
          for (const issue of zodErr.issues) {
            errors.push(`Spec: ${issue.path.join('.')}: ${issue.message}`);
          }
        } else {
          errors.push(`Spec: ${(e as Error).message}`);
        }
      }

      // ── 2) 名称格式（Zod 已校验；此处冗余兜底） ──
      if (spec.name && !/^[a-z][a-z0-9-]{1,49}$/.test(spec.name)) {
        errors.push(`SkillSpec.name "${spec.name}" must be kebab-case, 2-50 chars, start with letter`);
      }

      // ── 3) description 长度（Zod 已校验；此处保留 warning 阈值） ──
      if (spec.description && spec.description.length > 500) {
        warnings.push('SkillSpec.description too long (> 500 chars)');
      }

      // ── 4) body 长度（Zod 要求 ≥ 50） ──
      if (spec.body && spec.body.trim().length < 50) {
        warnings.push('SkillSpec.body too short (< 50 chars), may not be useful');
      }

      // ── 5) origin 必须有 kind（Zod 已校验） ──
      if (!spec.origin?.kind) {
        errors.push('SkillSpec.origin.kind is required');
      }

      // ── 6) Prompt 注入检测（Zod 不含，需保留） ──
      const injection = this.scanInjection(spec.body);
      for (const issue of injection) {
        errors.push(`Security: ${issue}`);
      }
      const descInjection = this.scanInjection(spec.description);
      for (const issue of descInjection) {
        errors.push(`Security (description): ${issue}`);
      }
    } else {
      // Workflow 校验（保持原实现）
      if (!spec.id) errors.push('WorkflowSpec.id is required');
      if (!spec.name) errors.push('WorkflowSpec.name is required');
      if (!spec.version) errors.push('WorkflowSpec.version is required');
      if (!spec.steps || spec.steps.length === 0) {
        errors.push('WorkflowSpec.steps must contain at least one step');
      }
      if (spec.id && !/^[a-z][a-z0-9-]{1,49}$/.test(spec.id)) {
        errors.push(`WorkflowSpec.id "${spec.id}" must be kebab-case`);
      }
    }

    return { ok: errors.length === 0, errors, warnings };
  }

  // ── register ────────────────────────────────────────────

  /**
   * 注册规格
   */
  async register(spec: SkillSpec | WorkflowSpec): Promise<RegisterResult> {
    if ('body' in spec) {
      return this.registerSkill(spec);
    }
    return this.registerWorkflow(spec);
  }

  /**
   * 注册 Skill
   *
   * P2-5：注册前检测 `spec.name` 是否已存在于 storageDir/skills/{name}；
   * 存在则在 name 末尾追加 `-{6位hash}` 避免静默覆盖（同步更新 spec.name + 落盘路径）。
   */
  private async registerSkill(spec: SkillSpec): Promise<RegisterResult> {
    const specId = await this.ensureUniqueName(spec.name);
    const specWithUniqueName: SkillSpec = spec.name === specId ? spec : { ...spec, name: specId };
    // 路径结构：{storageDir}/skills/{name}/
    const dir = path.join(this._storageDir, 'skills', specId);
    const filePath = path.join(dir, 'SKILL.md');
    const metaPath = path.join(dir, SPEC_METADATA_FILE);

    try {
      // 1. 创建目录
      await fs.mkdir(dir, { recursive: true });

      // 2. 写入 SKILL.md（使用去重后的 name）
      const content = renderSkillMarkdown(specWithUniqueName);
      await Filesystem.write(filePath, content);

      // 3. 写入元数据
      const meta = {
        specId,
        origin: specWithUniqueName.origin,
        createdAt: specWithUniqueName.createdAt,
        trustLevel: 'sandbox',
        version: '1.0.0',
        spec: specWithUniqueName,
      };
      await Filesystem.write(metaPath, JSON.stringify(meta, null, 2));

      // 4. 验证写入
      const verify = await fs.readFile(filePath, 'utf-8');
      if (verify !== content) {
        throw new Error('Write verification failed');
      }

      // 5. Bus 广播
      await Bus.publishSafe(SkillCreated, {
        specId,
        name: specId,
        path: filePath,
        trustLevel: 'sandbox',
        origin: specWithUniqueName.origin,
      });

      log.info('registerSkill:success', { specId, path: filePath });
      return { accepted: true, path: filePath, specId };
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      log.error('registerSkill:failed', { specId, error: err.message });
      return { accepted: false, reason: err.message };
    }
  }

  /**
   * 检测同名 skill（已存在则追加 hash 后缀）
   *
   * P2-5：slug 截断可能导致 `aaaa-...` 与 `aaaa-...-v2` 生成同 name，
   * 直接写盘会静默覆盖。本方法在磁盘上检测 `skills/{name}/SKILL.md` 是否存在，
   * 存在则在末尾追加 `-{6位时间戳hash}` 直至唯一。
   *
   * 同一存储目录的并发 create 不保证原子（不做 fs lock），但概率极低。
   */
  private async ensureUniqueName(baseName: string): Promise<string> {
    let candidate = baseName;
    let attempt = 0;
    const MAX_ATTEMPTS = 16;
    while (attempt < MAX_ATTEMPTS) {
      const probe = path.join(this._storageDir, 'skills', candidate, 'SKILL.md');
      try {
        await fs.access(probe);
        // 已存在 → 生成新名
        attempt++;
        const suffix = Date.now().toString(36).slice(-6);
        candidate = `${baseName}-${suffix}${attempt > 1 ? `-${attempt}` : ''}`;
      } catch {
        // 不存在 → 唯一
        return candidate;
      }
    }
    // 极端情况 fallback：直接用时间戳
    return `${baseName}-${Date.now().toString(36)}`;
  }

  /**
   * 注册 Workflow
   */
  private async registerWorkflow(spec: WorkflowSpec): Promise<RegisterResult> {
    const specId = spec.id;
    const dir = path.join(this._storageDir, 'workflows', specId);
    const filePath = path.join(dir, 'workflow.json');
    const metaPath = path.join(dir, SPEC_METADATA_FILE);

    try {
      await fs.mkdir(dir, { recursive: true });
      await Filesystem.write(filePath, JSON.stringify(spec, null, 2));
      await Filesystem.write(
        metaPath,
        JSON.stringify(
          {
            specId,
            origin: spec.origin,
            createdAt: spec.createdAt,
            trustLevel: 'sandbox',
            version: spec.version,
          },
          null,
          2,
        ),
      );

      await Bus.publishSafe(WorkflowCreated, {
        specId,
        name: spec.name,
        path: filePath,
        trustLevel: 'sandbox',
        origin: spec.origin,
      });

      log.info('registerWorkflow:success', { specId, path: filePath });
      return { accepted: true, path: filePath, specId };
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      log.error('registerWorkflow:failed', { specId, error: err.message });
      return { accepted: false, reason: err.message };
    }
  }

  // ── 组合模式推断 ────────────────────────────────────────

  /**
   * 推断 Skill 的组合模式
   *
   * P1-6：原实现是单层 if/else if，第一个命中即定为 primary，secondary 只看
   * keyword 是否存在（容易把 inversion 误归到 secondary）。改为 keyword scoring：
   *   - 5 个 mode 各有一个 keyword 字典（含中文）
   *   - 取分数最高的 mode 作为 primary
   *   - 次要模式按分数 > 0 + primary != self 取最多 2 个
   *   - 同分时按 `[tool-wrapper, generator, reviewer, inversion, pipeline]` 顺序破平
   *   - 注意：关键词匹配**保留原文大小写**——中文关键词不分大小写、英文关键词按字面匹配
   */
  async inferComposition(requirement: string, hints?: string[]): Promise<Composition> {
    const text = `${requirement} ${(hints ?? []).join(' ')}`;
    const lower = text.toLowerCase();

    // 每个 mode 一个权重字典（数字越大信号越强）；
    // 通过 `i` flag 实现大小写不敏感的英文匹配，中文不受 i 影响。
    const weights: Record<SkillMode, Array<{ pattern: RegExp; weight: number }>> = {
      'tool-wrapper': [
        { pattern: /(怎么用|how to use|用法|使用|api|库|version|版本|最新|syntax|语法|调用|wrap|wrapper|封装|适配|tsc|help)/i, weight: 2 },
        { pattern: /(sdk|library|framework|tool|工具|函数|method)/i, weight: 1 },
      ],
      generator: [
        { pattern: /(生成|产出|输出|generator|template|模板|固定|固定格式|报表|report|scaffold|脚手架|schema|结构化输出|表格)/i, weight: 2 },
        { pattern: /(format|格式|generate|产出|fill|填充)/i, weight: 1 },
      ],
      reviewer: [
        { pattern: /(审查|评审|review|审核|合规|lint|check|verify|核查|核对|清单|对照|检查)/i, weight: 2 },
        { pattern: /(audit|inspect)/i, weight: 1 },
      ],
      inversion: [
        { pattern: /(先问|澄清|反问|提问|前置|inversion|clarify|questionnaire|歧义|模糊|参数缺失|ambiguous|缺关键参数)/i, weight: 2 },
        { pattern: /(before.*do|前置问题)/i, weight: 1 },
      ],
      pipeline: [
        { pattern: /(pipeline|流水线|流程|自动化|multi-step|sequential|按顺序|先.*后|步骤|step.*by.*step|编排)/i, weight: 2 },
        { pattern: /(orchestrate|orchestration|dag|workflow)/i, weight: 1 },
      ],
    };

    // 计算每个 mode 的得分
    const scores: Record<SkillMode, number> = {
      'tool-wrapper': 0,
      generator: 0,
      reviewer: 0,
      inversion: 0,
      pipeline: 0,
    };
    for (const [mode, patterns] of Object.entries(weights) as Array<[SkillMode, (typeof weights)[SkillMode]]>) {
      for (const { pattern, weight } of patterns) {
        if (pattern.test(lower)) scores[mode] += weight;
      }
    }

    // 取分数最高的 mode 作 primary（同分按工具链顺序破平）
    const order: SkillMode[] = ['tool-wrapper', 'generator', 'reviewer', 'inversion', 'pipeline'];
    let primary: SkillMode = 'generator';
    let bestScore = -1;
    for (const mode of order) {
      if (scores[mode] > bestScore) {
        bestScore = scores[mode]!;
        primary = mode;
      }
    }

    // 次要模式：分数 > 0 且不等于 primary，按分数倒序取最多 2 个
    const secondary: SkillMode[] = order
      .filter((m) => m !== primary && scores[m] > 0)
      .sort((a, b) => scores[b] - scores[a])
      .slice(0, 2);

    const connections: Composition['connections'] = secondary.map((m) => ({
      from: primary,
      to: m,
      kind: (primary === 'inversion' && m === 'pipeline') || (primary === 'pipeline' && m === 'inversion') ? 'gate' : 'sequence',
    }));

    return { primary, secondary, connections };
  }

  /**
   * 生成 Skill 规格
   *
   * 流程：
   *   1) slugify 需求 → name
   *   2) 按 `composition.primary` 选择 5 个独立模板之一（不再用通用模板 + (eq ...) 分支，
   *      避免渲染器不识别子表达式时残留 `{{#if}}` 块）
   *   3) `renderTemplate` 替换占位符
   *   4) 末尾用 `SkillSpecSchema.parse` 兜底校验（P1-7：防止 generate 与 validate 漂移）
   */
  async generate(requirement: string, composition: Composition): Promise<SkillSpec> {
    const slugResult = slugifyRequirement(requirement);
    const name = slugResult.name;
    // P2-2：fallback 时 warn 提醒用户（中文需求无法生成有意义 slug）
    if (slugResult.fallback) {
      log.warn('generate:slug_fallback', {
        requirement: requirement.slice(0, 80),
        suggestion: '建议使用英文需求或事后手动改 name',
        generatedName: name,
      });
    }
    const description = requirement.trim().slice(0, 200);
    const createdAt = new Date().toISOString();

    // 模板选择：按 primary mode 选独立 txt
    const getTemplate = MODE_TEMPLATES[composition.primary];
    const templateContent = getTemplate ? getTemplate() : '';
    // fallback：buildBody（保证 body >= 50 字符）
    const rawBody = templateContent ? templateContent : buildBody(requirement, composition);

    // 替换占位符（Markdown.renderTemplate 支持 (eq a b) / #each / 点路径 / 字符串字面量）
    // 注意：变量 key 必须符合 `\w+`（不含 `-`），用 `name` 而非 `skill-name`
    //
    // secondaryModes 在 body 模板渲染端是 CSV 字符串（方便模板里 `{{secondaryModes}}` 直接展示）；
    // frontmatter 序列化端由 render-skill-md 传原始数组（`spec.secondaryModes`），
    // 保证 YAML 写出为 `secondaryModes: [pipeline, reviewer]` 数组而非字符串。
    // 当前 5 个 mode 模板未引用 `{{secondaryModes}}`，故 CSV 形式暂未触发，
    // 但若未来模板要展示该字段，应直接传数组并让模板内做 join 处理（避免双标）。
    const secondaryModesCsv = composition.secondary.join(', ');
    const body = this.renderTemplate(rawBody, {
      name,
      description,
      requirement,
      mode: composition.primary,
      composition: composition.secondary.length > 0 ? 'composed' : 'single',
      secondaryModes: secondaryModesCsv,
      createdAt,
    });

    // body 长度 < 50 时追加 Notes 占位段（无意义 x 填充会污染 Agent 上下文，所以用明确引导文案）
    const finalBody = body.trim().length >= 50 ? body : `${body}\n\n## Notes\n\n（请补充本 skill 的具体使用说明 / 示例 / 注意事项，至少 50 字符。）`;

    const spec: SkillSpec = {
      name,
      description,
      scope: 'general',
      body: finalBody,
      origin: { kind: 'created' },
      createdAt,
      mode: composition.primary,
      secondaryModes: composition.secondary,
      composition: composition.secondary.length > 0 ? 'composed' : 'single',
      compositionConnections: composition.connections,
      deliveryChecklist: defaultDeliveryChecklist(requirement, finalBody),
      portability: defaultPortability(),
    };

    // P1-7：生成端 schema 自校验，避免 validate() 漏调导致非法 spec 落盘
    try {
      const { SkillSpecSchema } = await import('./spec/skill-spec');
      SkillSpecSchema.parse(spec);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.error('generate:schema_parse_failed', { name, error: msg });
      throw new CreatorError('SCHEMA_PARSE_FAILED', `Generated spec failed schema validation: ${msg}`);
    }

    return spec;
  }

  /**
   * 渲染模板，替换占位符
   *
   * 委托给 `@easbot/utils` 的 `Markdown.renderTemplate`：
   *   - {{var}} / {{var.path}} / {{arr[0]}}
   *   - {{#if var}} / {{#unless var}} / {{#if (eq a b)}}
   *   - {{#each list}} / {{this}} / {{@index}}
   *
   * 本层只负责"模板 = body"渲染；frontmatter 由 `renderSkillMarkdown` 走 `Markdown.format`
   * 用 gray-matter 序列化（避免手拼 YAML）。
   */
  private renderTemplate(template: string, vars: Record<string, unknown>): string {
    return Markdown.renderTemplate(template, vars);
  }

  // ── 模板助手（module-level） ──────────────────────────────

  /**
   * 移除 Skill
   */
  async remove(name: string): Promise<boolean> {
    const dir = path.join(this._storageDir, 'skills', name);
    try {
      await fs.rm(dir, { recursive: true, force: true });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 扫描已创造的 Skills
   */
  async scanCreatedSkills(): Promise<Record<string, SkillSpec>> {
    const skills: Record<string, SkillSpec> = {};
    // glob (fast-glob v10) 在 Windows 上只支持 forward-slash pattern；
    // path.join 输出 '\\' 分隔会让 glob 返回 []，所以统一 normalize
    const pattern = path.join(this._storageDir, 'skills', '*', SPEC_METADATA_FILE).replace(/\\/g, '/');
    const files = await glob(pattern);

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const meta = JSON.parse(content);
        if (meta.spec) {
          skills[meta.spec.name] = meta.spec;
        }
      } catch {
        // 跳过损坏的元数据文件
      }
    }

    return skills;
  }

  /**
   * 扫描已创造的 Workflows
   *
   * 区分两类错误：
   * - workflow.json 不存在（ENOENT）→ 合法（无 workflow），静默跳过
   * - workflow.json 存在但 JSON 损坏或读失败 → 异常，log.warn 并跳过
   */
  async scanCreatedWorkflows(): Promise<Record<string, WorkflowSpec>> {
    const workflows: Record<string, WorkflowSpec> = {};
    const pattern = path.join(this._storageDir, 'workflows', '*', SPEC_METADATA_FILE).replace(/\\/g, '/');
    const files = await glob(pattern);

    for (const file of files) {
      try {
        const dir = path.dirname(file);
        const workflowPath = path.join(dir, 'workflow.json');
        const content = await fs.readFile(workflowPath, 'utf-8');
        const spec = JSON.parse(content) as WorkflowSpec;
        workflows[spec.id] = spec;
      } catch (e) {
        const code = (e as NodeJS.ErrnoException).code;
        if (code === 'ENOENT') continue; // 合法：metadata 存在但 workflow.json 不存在
        log.warn('scanCreatedWorkflows: skip corrupted entry', { file, error: (e as Error).message });
      }
    }

    return workflows;
  }

  /**
   * 扫描已创造的 Bundles（未实现，返回空对象）
   */
  async scanCreatedBundles(): Promise<Record<string, unknown>> {
    return {};
  }

  // ── 辅助方法 ───────────────────────────────────────────

  /**
   * 扫描 Prompt 注入（统一规则，与 references/validation.md §3 对齐）
   *
   * P0-2：原 validator.ts 与 creator.ts 各有一套 PROMPT_INJECTION_PATTERNS 列表，
   * Creator 漏掉 `curl|sh` / `rm -rf /`。本方法统一定义在 creator 端，
   * validator.ts 仅 re-export（@deprecated）。
   */
  scanInjection(text: string): string[] {
    if (!text) return [];
    const issues: string[] = [];
    // P1-5：补充中文等价模式 — 原始 10 条仅覆盖英文，中文 prompt injection 完全漏过。
    // 新增中文规则（按 AGENTS.md §4 i18n 注释规范：reason 字段保持英文便于跨语言聚合）。
    const patterns = [
      { pattern: /ignore (all )?previous instructions/i, reason: 'Prompt injection: "ignore previous instructions"' },
      { pattern: /disregard (all )?prior (rules|instructions)/i, reason: 'Prompt injection: "disregard prior rules"' },
      { pattern: /system\s*:\s*you are now/i, reason: 'Prompt injection: "system: you are now"' },
      { pattern: /\[\s*ADMIN\s*\]/i, reason: 'Prompt injection: fake admin tag' },
      { pattern: /\bDAN\b.*\bmode\b/i, reason: 'Prompt injection: DAN mode' },
      { pattern: /reveal (your|the) (system )?prompt/i, reason: 'Prompt injection: reveal prompt' },
      { pattern: /execute (arbitrary|any) (code|command)/i, reason: 'Prompt injection: execute arbitrary code' },
      { pattern: /bypass (security|sandbox|permission)/i, reason: 'Prompt injection: bypass security' },
      { pattern: /curl\s+.*\|\s*(sh|bash)/i, reason: 'Dangerous shell pattern: curl|sh' },
      { pattern: /rm\s+-rf\s+\//i, reason: 'Dangerous: rm -rf /' },
      // 中文等价模式（与英文规则 1:1 对应，覆盖 i18n 攻击面）
      { pattern: /忽略.*(之前|先前)的?(指令|规则|指示)/, reason: 'Prompt injection (zh): "忽略之前指令"' },
      { pattern: /不再遵循.*(规则|约束|指令)/, reason: 'Prompt injection (zh): "不再遵循规则"' },
      { pattern: /你(现在|其实)是/, reason: 'Prompt injection (zh): "你现在是"' },
      { pattern: /\[?\s*管理员\s*\]?/ , reason: 'Prompt injection (zh): fake admin tag' },
      { pattern: /展示.*(系统|你的)?提示词/, reason: 'Prompt injection (zh): reveal system prompt' },
      { pattern: /(执行|运行).*(任意|任何).*(代码|命令)/, reason: 'Prompt injection (zh): execute arbitrary code' },
      { pattern: /(绕过|跳过).*(安全|沙箱|权限|校验)/, reason: 'Prompt injection (zh): bypass security' },
    ];
    for (const { pattern, reason } of patterns) {
      if (pattern.test(text)) {
        issues.push(reason);
      }
    }
    return issues;
  }
}

// ── 辅助函数 ─────────────────────────────────────────────

/**
 * 模板助手：已迁移到 `@easbot/utils` 的 `Markdown.renderTemplate`
 * （支持 {{var}} / {{#if var}} / {{#if (eq a b)}} / {{#each}} / {{this}} / {{@index}}）。
 * 本文件保留 `renderTemplate` 私有方法作为薄封装，便于未来 hook 切回本地实现。
 */

/**
 * 将需求转换为 kebab-case 名称
 *
 * 约束（spec/skill-spec.ts SkillSpecSchema）：`name` 必须满足正则
 * `/^[a-z][a-z0-9-]{1,49}$/`，即**只能小写字母 + 数字 + 连字符**，不含中文。
 *
 * 因此纯中文需求（如 "实现一个 CSV 解析器"）无法生成有意义 slug——ASCII 路径抽空，
 * 直接 fallback 到 `skill-${Date.now().toString(36)}`。用户应使用英文需求或事后手动改 name。
 *
 * P2-5：本函数**不**检测同名冲突；同名检测在 `registerSkill` 内做，避免截断后
 * `aaaa-...` 与 `aaaa-...-v2` 互相覆盖。
 */
function slugifyRequirement(requirement: string): { name: string; fallback: boolean } {
  const ascii = requirement
    .toLowerCase()
    .replace(/[\u4E00-\u9FFF]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join('-');
  if (ascii && /^[a-z]/.test(ascii)) return { name: ascii.slice(0, 50), fallback: false };
  // P2-2：fallback 时返回 fallback=true 让调用方 log.warn 提醒用户
  return { name: `skill-${Date.now().toString(36)}`, fallback: true };
}

/**
 * 构建 body 内容
 */
function buildBody(requirement: string, composition: Composition): string {
  const lines: string[] = [];
  lines.push(`# ${slugifyRequirement(requirement).name}`);
  lines.push('');
  lines.push('## Purpose');
  lines.push(requirement);
  lines.push('');
  lines.push('## Mode');
  lines.push(`primary: ${composition.primary}`);
  if (composition.secondary.length > 0) {
    lines.push(`secondary: ${composition.secondary.join(', ')}`);
  }
  lines.push('');
  lines.push('## Steps');
  lines.push('1. Analyze input');
  lines.push('2. Execute core logic');
  lines.push('3. Validate output');
  lines.push('4. Return result');
  return lines.join('\n');
}

/**
 * 默认交付检查清单
 *
 * 启发式推断（与 SKILL.md §交付清单 §5.2 表格对齐）：
 * - `developmentGuide`：body 含「使用」「When to Use」「Quick Start」等 → true
 * - `pitfallTable`：body 含「Pitfall」「Common Mistakes」「注意事项」等 → true
 * - `reviewProcess`：body 含「Review」「Checklist」「审查」等 → true
 * - `observability`：body 含「Log」「Metrics」「Observability」「日志」等 → true
 * - `scripts`：body 含「scripts/」「`npx tsx`」等 → true
 * - `deploymentGuide`：默认 false（部署细节需要上下文，本技能无法自动判断）
 */
function defaultDeliveryChecklist(requirement: string, body: string): DeliveryChecklist {
  const lower = `${requirement} ${body}`.toLowerCase();
  return {
    developmentGuide: /(使用|when to use|quick start|getting started|用法)/i.test(lower),
    pitfallTable: /(pitfall|common mistakes|注意事项|known issues|陷阱)/i.test(lower),
    reviewProcess: /(review|checklist|审查|审核|清单)/i.test(lower),
    deploymentGuide: false,
    observability: /(log|metric|observability|日志|监控)/i.test(lower),
    scripts: /(scripts\/|npx tsx)/i.test(lower),
  };
}

/**
 * 默认可迁移性
 */
function defaultPortability(): Portability {
  return { platforms: [], tools: [] };
}

// ── 工厂函数 ─────────────────────────────────────────────

/**
 * 创建创造引擎实例
 *
 * @param options 配置选项
 * @returns 创造引擎实例
 */
export function createCreator(options?: CreatorOptions): Creator {
  return new DefaultCreator(options);
}
