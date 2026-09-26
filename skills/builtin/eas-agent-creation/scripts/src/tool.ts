#!/usr/bin/env tsx
/**
 * Creation 工具 - 技能创建与进化工具
 *
 * 职责：
 * - 创建新的 AI 技能（基于需求描述生成技能模板）
 * - 执行技能自我评估（分析能力与弱点）
 * - 运行进化引擎（生成并应用改进计划）
 * - 列出和管理已注册的技能
 *
 * 形态：
 * - 可独立运行的 CLI：tsx tool.ts <command> [--args]
 * - 同时通过 toolDefinition 暴露 creation 工具，
 *   供后续 @easbot/llm 直接注入给语言模型
 *
 * 设计：
 * - 移除 EASBot host 依赖（Tool 基类 / Instance / Global / @easbot/utils 的
 *   loadTextFile + import.meta.url 文本加载），改为本地解析
 * - Filesystem 工具来自 @easbot/utils（纯 IO 工具，无 host 依赖）
 * - Tool 抽象改用 @easbot/plugin 的 ToolDefinition 接口（host 无关）
 * - scope='global' 默认落盘到 ~/.easbot/skills/{name}/SKILL.md
 * - scope='project' 默认落盘到 ${cwd}/.easbot/skills/{name}/SKILL.md
 *   （host 通过 ToolContext.directory 覆盖）
 */

import z from 'zod';
import path from 'node:path';
import os from 'node:os';
import process from 'node:process';
import { buildToolArgs, type ToolDefinition, type ToolContext } from '@easbot/plugin';
import { SkillModes } from './creation/spec/skill-spec';
import { CreationError } from './creation/errors';
import { Filesystem } from '@easbot/utils';

// Creation 命名空间按需加载（含 host shim 模块图），
// 避免 --help / ToolDefinition-only 触发整条模块链。
async function loadCreation(): Promise<typeof import('./creation').Creation> {
  const mod = await import('./creation');
  return mod.Creation;
}

const DESCRIPTION =
  'Creation tool - Create, evolve, assess, and manage AI skills.\n\n' +
  '## Operations\n\n' +
  '### create\n' +
  'Create a new AI skill based on requirements. The skill will be generated from templates and stored in the skill registry.\n' +
  '- requirement: Detailed description of the skill to create (minimum 10 characters)\n' +
  '- hints (optional): Array of hint strings to guide skill generation\n' +
  '- scope (optional): "project" (default) or "global"\n\n' +
  '### evolve\n' +
  'Run the evolution engine to improve existing skills based on self-assessment. Analyzes weaknesses and generates improvement plans.\n' +
  '- dryRun (optional): If true, generates plans without applying them\n\n' +
  '### assess\n' +
  'Perform self-assessment of skill capabilities and weaknesses. Identifies areas for improvement.\n' +
  '- windowDays (optional): Analysis window in days (1-90, default varies)\n\n' +
  '### list\n' +
  'List all registered skills with optional filtering.\n' +
  '- mode (optional): Filter by skill mode (e.g., "always", "contextual")\n' +
  '- limit (optional): Maximum number of results to return\n' +
  '- offset (optional): Number of results to skip for pagination\n\n' +
  '### apply-plan\n' +
  'Apply a previously generated evolution plan. Requires approval from a human.\n' +
  '- planId: ID of the evolution plan to apply\n' +
  '- approvedBy: Identifier of the approver\n\n' +
  '### review\n' +
  'Run LLM-based review on a skill (reads SKILL.md under {workspace}/.easbot/skills/{name}/).\n' +
  '- skillName: Name of the skill to review\n' +
  '- temperature (optional): Sampling temperature 0-2 (default 0.2)\n' +
  '- topP (optional): Nucleus sampling 0-1 (default 1)\n' +
  '- topK (optional): Top-K sampling\n' +
  '- maxOutputTokens (optional): Max output tokens (default 2048)\n' +
  '- variant (optional): Reviewer variant name (written into system message)\n' +
  '  Returns: { score 0-10, passed: score >= 7, criteria[], suggestions[], variant }';

/**
 * Creation 操作参数字段定义
 * 使用 discriminatedUnion 模式，每个操作有独立的参数结构
 */
const creationParameters = {
  create: z.object({
    operation: z.literal('create').describe('Create a new AI skill'),
    requirement: z.string().min(10).describe('Skill requirement description (minimum 10 characters)'),
    hints: z.array(z.string()).optional().describe('Array of hints to guide skill generation'),
    scope: z
      .enum(['global', 'project'])
      .optional()
      .default('project')
      .describe('Creation scope: project (default, writes to .easbot/skills/{name}) or global (writes to ~/.config/easbot/skills/{name})'),
  }),

  evolve: z.object({
    operation: z.literal('evolve').describe('Run skill evolution engine'),
    dryRun: z.boolean().optional().describe('Dry run mode, only generates plans without applying'),
  }),

  assess: z.object({
    operation: z.literal('assess').describe('Perform skill self-assessment'),
    windowDays: z.coerce.number().int().min(1).max(90).optional().describe('Analysis window in days (1-90)'),
  }),

  list: z.object({
    operation: z.literal('list').describe('List registered skills'),
    mode: z.enum(SkillModes).optional().describe('Filter by skill mode (tool-wrapper/generator/reviewer/inversion/pipeline)'),
    limit: z.coerce.number().int().positive().optional().describe('Maximum number of results to return'),
    offset: z.coerce.number().int().nonnegative().optional().describe('Pagination offset'),
  }),

  applyPlan: z.object({
    operation: z.literal('apply-plan').describe('Apply evolution plan to skill'),
    planId: z.string().min(1).describe('Unique identifier of the evolution plan'),
    approvedBy: z.string().min(1).describe('Approver identifier'),
  }),

  review: z.object({
    operation: z.literal('review').describe('Run LLM-based skill review'),
    skillName: z.string().min(1).describe('Skill name to review (must exist under {workspace}/.easbot/skills/{name}/SKILL.md)'),
    // LLM 参数：透传给 generateText
    temperature: z.coerce.number().min(0).max(2).optional().describe('Sampling temperature 0-2 (default 0.2)'),
    topP: z.coerce.number().min(0).max(1).optional().describe('Nucleus sampling 0-1 (default 1)'),
    topK: z.coerce.number().int().nonnegative().optional().describe('Top-K sampling'),
    maxOutputTokens: z.coerce.number().int().positive().optional().describe('Max output tokens (default 2048)'),
    variant: z.string().optional().describe('Reviewer variant name (written into system message)'),
  }),
};

/**
 * Creation 操作参数的联合类型定义
 */
export const operationSchema = z.discriminatedUnion('operation', [
  creationParameters.create,
  creationParameters.evolve,
  creationParameters.assess,
  creationParameters.list,
  creationParameters.applyPlan,
  creationParameters.review,
]);

/**
 * 解析 scope 为默认目录（CLI 场景；host 可在 ToolContext 中覆盖）
 *
 * **P1-3 (2026-09-26 评审)**：此函数原本硬编码 `process.cwd()` + `~/.config/easbot`，
 * 与 `Creation.getSkillStorageRoot`（Instance.directory + Global.Path.config）漂移，
 * 导致 review/assess 读不到 create 写出的 SKILL.md。
 *
 * 现改为纯薄封装，直接转发到 `Creation.getSkillStorageRoot`，三个操作根路径完全一致。
 */
async function defaultDirectoryForScope(scope: 'global' | 'project', _ctx?: ToolContext): Promise<string> {
  const Creation = await loadCreation();
  return Creation.getSkillStorageRoot(scope);
}

/**
 * 核心实现：执行 Creation 工具的一个 operation
 *
 * 可被：
 * 1. CLI 入口直接调用（见 main()）
 * 2. @easbot/plugin 的 ToolDefinition.execute 调用（ctx 可注入覆盖默认目录）
 */
export async function runOperation(params: z.infer<typeof operationSchema>, ctx?: ToolContext): Promise<{ title: string; output: string; metadata?: Record<string, unknown> }> {
  const Creation = await loadCreation();
  switch (params.operation) {
    case 'create': {
      const scope = params.scope ?? 'project';
      const result = await Creation.create({ requirement: params.requirement, hints: params.hints, scope });
      // result 是 SkillSpec & { path }：path 直接来自 Creator.register，与磁盘实际落盘一致
      const spec = result;
      const skillPath = result.path;

      const output = [
        '---',
        `name: ${spec.name}`,
        `description: ${spec.description}`,
        `mode: ${spec.mode}`,
        `composition: ${spec.composition}`,
        '---',
        '',
        spec.body,
        '',
        '---',
        '',
        '## Next Steps',
        '',
        `1. **Improve**: Use eas-skill-creator to enhance SKILL.md`,
        `2. **Path**: ${skillPath}`,
        `3. **Validate**: tsx scripts/quick-validate.ts ${skillPath}`,
      ].join('\n');
      return {
        title: `Created: ${spec.name}`,
        metadata: { sessionId: ctx?.sessionId, skillName: spec.name, path: skillPath, scope },
        output: JSON.stringify({ spec, path: skillPath, scope }, null, 2) + '\n\n' + output,
      };
    }
    case 'evolve': {
      const result = await Creation.evolve({ dryRun: params.dryRun });
      return {
        title: 'Evolution result',
        metadata: { sessionId: ctx?.sessionId },
        output: JSON.stringify(result, null, 2),
      };
    }
    case 'assess': {
      const assessment = await Creation.assess({ windowDays: params.windowDays });

      // 附带：模型评审（如果 Llm 已 init 且 workspace 里有 skills）
      // P1-4：直接复用 Creation.state 的内存 SkillSpec（避免重复读盘 + 与创建路径漂移）
      let reviews: unknown;
      try {
        const { Llm } = await import('./llm');
        if (Llm.isInitialized() && Llm.getLanguageLlm() && assessment.capabilities.length > 0) {
          const skillsState = await Creation.state();
          const reviewResults = [];
          for (const cap of assessment.capabilities) {
            const spec = skillsState.skills[cap.name];
            if (spec && spec.body && spec.body.length >= 50) {
              try {
                const r = await Llm.reviewSkill(cap.name, spec.body);
                reviewResults.push(r);
              } catch {
                // 单个 skill 评审失败不影响整体
              }
            }
          }
          if (reviewResults.length > 0) reviews = reviewResults;
        }
      } catch (err) {
        // Llm.reviewSkill 失败不影响主流程
        const { Log } = await import('@easbot/utils');
        Log.Default.warn('assess: reviewSkill failed', { error: err instanceof Error ? err.message : String(err) });
      }

      const output = reviews ? { ...assessment, llmReviews: reviews } : assessment;
      return {
        title: 'Assessment',
        metadata: { sessionId: ctx?.sessionId },
        output: JSON.stringify(output, null, 2),
      };
    }
    case 'list': {
      const skills = await Creation.list({ mode: params.mode, limit: params.limit, offset: params.offset });
      const skillList = skills.map((s) => `- **${s.name}** (${s.mode}) - ${s.description?.slice(0, 60) || 'no description'}...`).join('\n');
      const output = ['## Skills', '', `Total: ${skills.length}`, '', skillList || '_No skills found_'].join('\n');
      return {
        title: `Skills (${skills.length})`,
        metadata: { sessionId: ctx?.sessionId, count: skills.length },
        output: JSON.stringify({ skills }, null, 2) + '\n\n' + output,
      };
    }
    case 'apply-plan': {
      const result = await Creation.applyPlan(params.planId, { approvedBy: params.approvedBy });
      return {
        title: `Applied plan: ${params.planId}`,
        metadata: { sessionId: ctx?.sessionId, planId: params.planId },
        output: JSON.stringify(result, null, 2),
      };
    }
    case 'review': {
      // 防御：schema 已要求 skillName.min(1)，但兜底处理 undefined
      if (!params.skillName || typeof params.skillName !== 'string') {
        throw new CreationError.ReviewFailed({
          code: 'skill-name-missing',
          message: '--skillName is required',
          exitCode: 2,
        });
      }

      const skillName = params.skillName;

      // LLM 评审：读 SKILL.md，调 Llm.reviewSkill
      // P1-3：路径走 Creation.getSkillStorageRoot（与 create 完全一致），
      // 再补 /skills/{name}/SKILL.md
      const baseDir = await defaultDirectoryForScope('project', ctx);
      const skillPath = Filesystem.normalize(path.join(baseDir, 'skills', skillName, 'SKILL.md'));

      const fs = await import('node:fs/promises');
      let markdown: string;
      try {
        markdown = await fs.readFile(skillPath, 'utf-8');
      } catch {
        throw new CreationError.ReviewFailed({
          code: 'skill-md-not-found',
          message: `SKILL.md not found at ${skillPath}`,
          skillName,
          skillPath,
          exitCode: 2,
        });
      }

      const { Llm } = await import('./llm');
      if (!Llm.isInitialized() || !Llm.getLanguageLlm()) {
        throw new CreationError.ReviewFailed({
          code: 'language-llm-not-configured',
          message: 'languageLlm not configured. Set language_model in .easbot/easbot.json or call Llm.init() before invoking review.',
          skillName,
          exitCode: 2,
        });
      }

      const review = await Llm.reviewSkill(skillName, markdown, {
        temperature: params.temperature,
        topP: params.topP,
        topK: params.topK,
        maxOutputTokens: params.maxOutputTokens,
        variant: params.variant,
      });
      return {
        title: `Review: ${skillName} (score ${review.score}/10)`,
        metadata: { sessionId: ctx?.sessionId, skillName, score: review.score, passed: review.passed },
        output: JSON.stringify(review, null, 2),
      };
    }
  }
}

/**
 * 通过 @easbot/plugin 的 ToolDefinition 暴露的 creation 工具
 *
 * `args` 用 buildToolArgs 拼成一个完整 ZodObject —— 这是**真实可执行**的 schema，
 * main.ts（CLI）/ host / @easbot/llm 都可直接 `schema.parse(args)` 校验输入。
 *
 * 后续 host / @easbot/llm 可直接：
 *   import { toolDefinition } from '.../tool';
 *   llm.bindTools([toolDefinition]);
 */
export const toolDefinition: ToolDefinition = {
  description: DESCRIPTION,
  args: {
    operation: z.enum(['create', 'evolve', 'assess', 'list', 'apply-plan', 'review']).describe('Operation to perform'),
    // create
    requirement: z.string().min(10).optional().describe('Skill requirement description (minimum 10 characters)'),
    hints: z.array(z.string()).optional().describe('Array of hints to guide skill generation'),
    scope: z.enum(['global', 'project']).optional().describe("Creation scope: 'project' or 'global'"),
    // evolve
    dryRun: z.boolean().optional().describe('Dry run mode'),
    // assess
    windowDays: z.coerce.number().int().min(1).max(90).optional().describe('Analysis window in days'),
    // list
    mode: z.enum(SkillModes).optional().describe('Filter by skill mode'),
    limit: z.coerce.number().int().positive().optional().describe('Maximum results'),
    offset: z.coerce.number().int().nonnegative().optional().describe('Pagination offset'),
    // apply-plan
    planId: z.string().optional().describe('Plan identifier'),
    approvedBy: z.string().optional().describe('Approver identifier'),
    // review
    skillName: z.string().optional().describe('Skill name to review'),
    temperature: z.coerce.number().min(0).max(2).optional().describe('Sampling temperature'),
    topP: z.coerce.number().min(0).max(1).optional().describe('Nucleus sampling'),
    topK: z.coerce.number().int().nonnegative().optional().describe('Top-K sampling'),
    maxOutputTokens: z.coerce.number().int().positive().optional().describe('Max output tokens'),
    variant: z.string().optional().describe('Reviewer variant'),
  },
  async execute(args: Record<string, unknown>, context: ToolContext): Promise<string> {
    // 用 operationSchema（discriminated union）来校验 args，
    // 这样 TS 能在 switch 分支里自动 narrow 必填字段（如 review 的 skillName）。
    const validated = operationSchema.parse(args);
    const result = await runOperation(validated, context);
    return result.output;
  },
};

/**
 * 真实可执行的 zod schema（main.ts / host 直接 parse 用）。
 * 等价于 buildToolArgs(toolDefinition.args)，单独导出便于 main.ts 单次 import。
 */
export const toolArgsSchema = buildToolArgs(toolDefinition.args);

/**
 * 简易 argv 解析（CLI 入口）
 */
function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok === undefined) continue;
    if (!tok.startsWith('--')) continue;
    const key = tok.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

/**
 * CLI 入口
 *
 * 用法：
 *   tsx tool.ts create --requirement "..." [--hints "a,b,c"] [--scope project|global]
 *   tsx tool.ts evolve [--dryRun]
 *   tsx tool.ts assess [--windowDays 7]
 *   tsx tool.ts list [--mode ...] [--limit 20] [--offset 0]
 *   tsx tool.ts apply-plan --planId ... --approvedBy ...
 *   tsx tool.ts --help
 */
export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
    process.stdout.write(
      [
        'Usage: tsx tool.ts <command> [options]',
        '',
        'Commands:',
        '  create       Create a new AI skill',
        '  evolve       Run skill evolution engine',
        '  assess       Perform skill self-assessment',
        '  list         List registered skills',
        '  apply-plan   Apply an evolution plan',
        '  review       LLM-based skill review (--skillName, --temperature, --topP, --topK, --variant)',
        '',
        'Run `tsx tool.ts <command> --help` for command-specific options.',
        '',
      ].join('\n'),
    );
    return 0;
  }

  const [command, ...rest] = argv;
  const flags = parseArgs(rest);

  try {
    switch (command) {
      case 'create': {
        const requirement = String(flags['requirement'] ?? '');
        if (requirement.length < 10) {
          process.stderr.write('Error: --requirement must be at least 10 characters\n');
          return 2;
        }
        const hintsRaw = flags['hints'];
        const hints =
          typeof hintsRaw === 'string'
            ? hintsRaw
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined;
        const scope = flags['scope'] === 'global' ? 'global' : 'project';
        const result = await runOperation({ operation: 'create', requirement, hints, scope });
        process.stdout.write(result.output + '\n');
        return 0;
      }
      case 'evolve': {
        const dryRun = flags['dryRun'] === true || flags['dryRun'] === 'true';
        const result = await runOperation({ operation: 'evolve', dryRun });
        process.stdout.write(result.output + '\n');
        return 0;
      }
      case 'assess': {
        const windowDaysRaw = flags['windowDays'];
        const windowDays = windowDaysRaw !== undefined ? Number(windowDaysRaw) : undefined;
        const result = await runOperation({ operation: 'assess', windowDays });
        process.stdout.write(result.output + '\n');
        return 0;
      }
      case 'list': {
        const mode = typeof flags['mode'] === 'string' ? (flags['mode'] as (typeof SkillModes)[number]) : undefined;
        const limit = flags['limit'] !== undefined ? Number(flags['limit']) : undefined;
        const offset = flags['offset'] !== undefined ? Number(flags['offset']) : undefined;
        const result = await runOperation({ operation: 'list', mode, limit, offset });
        process.stdout.write(result.output + '\n');
        return 0;
      }
      case 'apply-plan': {
        const planId = String(flags['planId'] ?? '');
        const approvedBy = String(flags['approvedBy'] ?? '');
        if (!planId || !approvedBy) {
          process.stderr.write('Error: --planId and --approvedBy are required\n');
          return 2;
        }
        const result = await runOperation({ operation: 'apply-plan', planId, approvedBy });
        process.stdout.write(result.output + '\n');
        return 0;
      }
      case 'review': {
        const skillName = String(flags['skillName'] ?? '');
        if (!skillName) {
          process.stderr.write('Error: --skillName is required\n');
          return 2;
        }
        const temperature = flags['temperature'] !== undefined ? Number(flags['temperature']) : undefined;
        const topP = flags['topP'] !== undefined ? Number(flags['topP']) : undefined;
        const topK = flags['topK'] !== undefined ? Number(flags['topK']) : undefined;
        const maxOutputTokens = flags['maxOutputTokens'] !== undefined ? Number(flags['maxOutputTokens']) : undefined;
        const variant = typeof flags['variant'] === 'string' ? (flags['variant'] as string) : undefined;
        const result = await runOperation({
          operation: 'review',
          skillName,
          temperature,
          topP,
          topK,
          maxOutputTokens,
          variant,
        });
        process.stdout.write(result.output + '\n');
        return 0;
      }
      default:
        process.stderr.write(`Error: unknown command "${command}"\n`);
        return 2;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Error: ${msg}\n`);
    return 1;
  }
}

// 注：tool.ts 不再做 self-trigger CLI（避免与 scripts/main.ts 重复触发）；
// 独立运行请走 `tsx scripts/main.ts <command>`，host / llm 复用请 import toolDefinition / runOperation / main。
