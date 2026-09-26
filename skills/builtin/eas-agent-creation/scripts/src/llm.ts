/**
 * Creation LLM - Creation 工具的 LLM 封装
 *
 * 设计依据：对标 @easbot/memory 的 src/llm.ts
 *
 * 职责：
 * - 封装 `languageLlm`（LanguageModel）用于 skill 评审（"模型评审"）
 * - 与 `@easbot/llm` 的 bootstrapLlm + setAdapterRegistry 对接
 * - 模块级单例：必须先调 Llm.init() 才能用 reviewSkill()
 *
 * 用法：
 *   await Llm.init();                  // 从 .easbot/easbot.json 顶层 LLMConfig 读 languageLlm
 *   const result = await Llm.reviewSkill(name, md, { temperature: 0.3, topP: 0.9, variant: 'reviewer' });
 *
 * 配置读取：
 *   1) <cwd>/.easbot/easbot.json 的顶层 language_model 字段（用户显式配置）
 *   2) 回退到 mock fallback（不阻塞 CLI，但 reviewSkill 会报 "languageLlm not configured"）
 */

import { generateText } from 'ai';
import type { LanguageModel } from 'ai';
import { Log } from '@easbot/utils';
import { ProviderTransform, Provider } from '@easbot/llm';
import type { ILLM, ILLMInitConfig, ILLMCapabilities } from '@easbot/llm';

/**
 * LLM 模型集合配置
 *
 * 公开类型与 `@easbot/llm` `ILLMModels.languageLlm` 保持一致,使用 AI SDK 的 `LanguageModel`。
 * 实际 `@easbot/llm` bootstrapLlm 注入的永远是 `LanguageModelV3` 实例,
 * 所以内部访问 `.provider`/`.modelId` 时会按 `LanguageModelV3` 取。
 */
export interface LlmModels {
  languageLlm?: LanguageModel;
}

/**
 * LLM 初始化配置（继承自 @easbot/llm ILLMInitConfig）
 */
export interface LlmInitConfig extends ILLMInitConfig {
  options?: {
    language?: { maxOutputTokens?: number; temperature?: number; topP?: number; topK?: number };
  };
}

type LlmState = Required<Pick<LlmInitConfig, 'models'>> & {
  options: NonNullable<LlmInitConfig['options']>;
};

/**
 * reviewSkill 的运行时选项（运行时覆盖 init 时配置的默认值）
 *
 * 注意：provider-specific 选项（如 anthropic.beta、openai.reasoning_effort 等）
 * 不要再由调用方传 — 由 ProviderTransform.providerOptions(model) 从模型自身推导。
 */
export interface ReviewSkillOptions {
  /** 温度 0-1（默认 0.2） */
  temperature?: number;
  /** nucleus sampling 0-1（默认 1） */
  topP?: number;
  /** top-K sampling（默认 undefined） */
  topK?: number;
  /** 最大输出 token（默认 2048） */
  maxOutputTokens?: number;
  /** 模型变体名（写入 system prompt，让 LLM 知道按哪个变体的语气/标准评审） */
  variant?: string;
}

/**
 * Skill 评审结果
 */
export interface SkillReview {
  /** 技能名 */
  skillName: string;
  /** 综合评分 0-10 */
  score: number;
  /** 通过/不通过（>= 7 通过） */
  passed: boolean;
  /** 评审要点（数组） */
  criteria: Array<{
    name: string;
    score: number;
    comment: string;
  }>;
  /** 改进建议 */
  suggestions: string[];
  /** 使用的变体名（如果传入） */
  variant?: string;
  /** 模型原始输出（方便调试） */
  rawOutput?: string;
}

/**
 * Reviewer system prompt (English).
 *
 * 遵循 AGENTS.md §13 提示词规范 + `eas-prompt-creator/references/prompt-validation.md`：
 *  - Identity 在最顶部（U 型曲线，§13.5.5）
 *  - IMPORTANT 边界控制放在 identity 之后（boundary-control.md）
 *  - 评审维度对齐 AGENTS.md §14.1 五维度（Best Practice / Clear Goals / Concise / Distinct / Non-conflicting / Unambiguous / Clear Steps / Actionable）
 *  - 评分 rubric 给出可判定的阈值（"5-7 = adequate", "8-10 = strong"），避免模型给随机分
 *  - 末尾 Reminders 复述 MUST 输出契约（U 型曲线 recency 效应）
 *  - 总 token < 800（远低于 §13.5.5 自定义部分 < 6,000 上限）
 */
export const REVIEW_SYSTEM_PROMPT = `# Identity

You are the EASBot skill reviewer. Evaluate one SKILL.md against the EASBot ecosystem standards and return a structured critique.

# IMPORTANT — Output Contract

## MUST

- Return ONLY a single JSON object matching the schema below. No prose, no markdown fences, no commentary before or after.
- Use double quotes for all JSON keys and string values.
- Keep the response under 4096 tokens; if a criterion needs more explanation, prefer the \`comment\` field over spilling into \`suggestions\`.
- Every score MUST be an integer in 0-10. No decimals, no nulls, no missing fields.

## NEVER

- Wrap the JSON in \`\`\`json ... \`\`\` fences or any other markdown.
- Add explanations, greetings, or apologies outside the JSON object.
- Invent fields not in the schema. Do not echo the prompt back. Do not include the SKILL.md text.
- Score without citing a concrete deficiency or strength in the \`comment\` field.

# Review Criteria (EASBot §14.1 Five Dimensions)

Score each criterion 0-10 using the rubric below. Anchor every score in a concrete observation.

| Criterion              | What it measures                                                                 | Anchor question                                       |
| ---------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------- |
| \`description-clarity\`  | Frontmatter \`description\` + When-to-Use triggers vs anti-triggers                | Would a fresh agent know when to load this skill?    |
| \`output-schema\`        | Schema completeness, validation rules, error contracts                            | Can a caller produce and consume outputs reliably?   |
| \`validation-rules\`     | Boundary checks, invariants, examples (good + bad), failure-mode coverage         | Does the skill prevent its own misuse?               |
| \`examples\`             | Realistic call examples, expected results, edge cases                            | Can a user copy-paste the example and succeed?       |
| \`portability\`          | Platform / tool neutrality, dependency hygiene, structure follows EASBot norms    | Will this skill survive a repo upgrade?              |

# Score Rubric

| Range  | Meaning                                                                   |
| ------ | ------------------------------------------------------------------------- |
| 0-3    | Broken or absent — skill cannot be used as-is.                            |
| 4-6    | Adequate — usable but missing key elements listed in the anchor question. |
| 7-8    | Strong — covers the anchor question well; minor polish only.             |
| 9-10   | Excellent — exemplary; cite this as a model for other skills.             |

The overall \`score\` is the rounded average of the five criteria. \`passed = true\` when overall \`score >= 7\`.

# Suggestions Guidance

- Provide 3-7 actionable, prioritized suggestions ordered by impact (highest first).
- Each suggestion MUST name the specific section / criterion it improves (e.g., "Add a bad example under \`examples\`").
- DO NOT repeat points already captured in \`criteria[*].comment\`.

# Reminders

- Output is JSON only. The schema is in the user message.
- The five criteria names are exact and case-sensitive: \`description-clarity\`, \`output-schema\`, \`validation-rules\`, \`examples\`, \`portability\`.
- The \`rawOutput\` field of the result will preserve your exact response for debugging, so formatting drift here directly degrades \`rawOutput\`.
`;

export namespace Llm {
  const log = Log.create({ service: 'creation-llm' });

  let state: LlmState | null = null;

  /**
   * 初始化 LLM 命名空间（idempotent）
   */
  export function init(config: ILLMInitConfig): void {
    if (isInitialized()) return;
    const extendedConfig = config as LlmInitConfig;
    state = {
      models: extendedConfig.models,
      options: extendedConfig.options ?? {},
    };
    log.debug('Llm initialized', {
      languageConfigured: !!extendedConfig.models.languageLlm,
    });
  }

  /**
   * 判断是否已初始化
   */
  export function isInitialized(): boolean {
    return state !== null;
  }

  /**
   * 重置 Llm 状态（仅供测试隔离使用）
   */
  export function reset(): void {
    state = null;
  }

  /**
   * 获取当前能力信息
   */
  export function capabilities(): ILLMCapabilities {
    if (!state) {
      return { languageLlm: false };
    }
    return {
      languageLlm: !!state.models.languageLlm,
    };
  }

  /**
   * 获取已注入的 language model（供 status/doctor 展示）
   */
  export function getLanguageLlm(): LanguageModel | undefined {
    return state?.models.languageLlm;
  }

  const getState = (): LlmState => {
    if (!state) throw new Error('Llm is not initialized. Please call Llm.init() first.');
    return state;
  };

  /**
   * 用 languageLlm 评审一个 skill（SKILL.md）
   *
   * 评审维度：
   *   - description 清晰度（0-10）
   *   - schema/输出格式完整性
   *   - validation rules 完备性
   *   - examples 覆盖度（good/bad）
   *   - 可移植性（platforms / tools）
   *
   * @param skillName - 技能名
   * @param skillMarkdown - SKILL.md 完整文本
   * @param options - 运行时 LLM 参数（覆盖 init 时配置的默认值）
   * @returns 评审结果（含评分 + 建议）
   */
  export async function reviewSkill(skillName: string, skillMarkdown: string, options: ReviewSkillOptions = {}): Promise<SkillReview> {
    const current = getState();
    const model = current.models.languageLlm;
    if (!model) {
      throw new Error('languageLlm model is not configured. Run `Llm.init()` first or set language_model in .easbot/easbot.json');
    }
    // `@easbot/llm` bootstrapLlm 注入的是 LanguageModelV3/V2 实例,
    // 通过 in 操作符 narrow 到实例分支后再读 .provider / .modelId
    if (typeof model === 'string') {
      throw new Error('languageLlm must be a LanguageModel instance, not a string id');
    }
    const providerId = model.provider;
    const modelId = model.modelId;

    const defaults = current.options.language ?? {};
    const temperature = options.temperature ?? defaults.temperature ?? 0.2;
    const topP = options.topP ?? defaults.topP ?? 1;
    const topK = options.topK ?? defaults.topK;
    const maxOutputTokens = options.maxOutputTokens ?? defaults.maxOutputTokens ?? 32_000;
    const variant = options.variant ?? (current.models as { variant?: string }).variant;

    // 把 variant 拼进 system 消息（如果提供），让 LLM 按对应变体的语气/标准评审
    const variantHint = variant ? `\n\n## Reviewer Variant\n\nAct as the \`${variant}\` reviewer persona: apply its tone and standards consistently across all five criteria.` : '';
    const systemMessage = REVIEW_SYSTEM_PROMPT + variantHint;

    // 重复 schema 是为了减少模型"遗漏字段"的失败模式（prompt-validation §Anti-Pattern #5 Missing Failure Handling）
    const userPrompt = `## SKILL.md to Review

- **name**: \`${skillName}\`

\`\`\`markdown
${skillMarkdown}
\`\`\`

## Required JSON Schema

Return exactly this shape (no extra fields, no markdown fences):

\`\`\`json
{
  "score": <integer 0-10>,
  "criteria": [
    { "name": "description-clarity", "score": <integer 0-10>, "comment": "<concrete observation>" },
    { "name": "output-schema",       "score": <integer 0-10>, "comment": "<concrete observation>" },
    { "name": "validation-rules",    "score": <integer 0-10>, "comment": "<concrete observation>" },
    { "name": "examples",            "score": <integer 0-10>, "comment": "<concrete observation>" },
    { "name": "portability",         "score": <integer 0-10>, "comment": "<concrete observation>" }
  ],
  "suggestions": ["<prioritized, actionable, references a criterion>", ...]
}
\`\`\``;

    try {
      // 从已注入的 languageLlm(AI SDK LanguageModel 实例)反推出 Provider.Model 元数据:
      //   - model.provider 是 @easbot/llm bootstrapLlm 时写入的 providerId(如 "anthropic")
      //   - model.modelId 是 Provider.Model.id(如 "claude-3-5-sonnet-20240620")
      // 然后让 ProviderTransform.providerOptions 查元数据生成 provider-specific 选项
      const providerModel = await Provider.getModel(providerId, modelId);
      const result = await generateText({
        model,
        system: systemMessage,
        prompt: userPrompt,
        temperature,
        topP,
        ...(topK !== undefined ? { topK } : {}),
        maxOutputTokens,
        providerOptions: ProviderTransform.providerOptions(providerModel, {}),
      });

      // 尝试 parse JSON；失败时降级为 raw text
      let parsed: { score?: number; criteria?: Array<{ name: string; score: number; comment: string }>; suggestions?: string[] };
      try {
        parsed = JSON.parse(result.text) as typeof parsed;
      } catch {
        log.warn('reviewSkill: model output is not JSON; returning raw', { output: result.text.slice(0, 200) });
        return {
          skillName,
          score: 0,
          passed: false,
          criteria: [],
          suggestions: ['Model output was not valid JSON; raw output in `rawOutput` for manual review'],
          variant,
          rawOutput: result.text,
        };
      }

      const score = typeof parsed.score === 'number' ? parsed.score : 0;
      const criteria = Array.isArray(parsed.criteria) ? parsed.criteria : [];
      const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

      return {
        skillName,
        score,
        passed: score >= 7,
        criteria,
        suggestions,
        variant,
        rawOutput: result.text,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error('reviewSkill: generateText failed', { error: msg });
      throw err;
    }
  }
}

/**
 * Llm 作为 ILLM 的视图（用于 `@easbot/llm` bootstrapLlm 的强类型接收）。
 */
export const llm: ILLM = Llm as ILLM;
