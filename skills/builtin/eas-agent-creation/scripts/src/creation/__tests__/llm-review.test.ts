/**
 * src/creation/__tests__/llm-review.test.ts
 * Llm.reviewSkill 单元测试（P1-5：评审路径必须可单测验证）
 *
 * 范围：
 * - LLM 初始化 / reset 状态隔离
 * - 未配置 languageLlm 时抛 "languageLlm model is not configured"
 * - mock generateText 返回合法 JSON → 解析为 SkillReview
 * - mock 返回非 JSON → 降级为 rawOutput + score=0 + passed=false
 * - variant 拼接到 system message
 * - temperature / topP / topK / maxOutputTokens 透传
 * - providerOptions 自动推导被调用（不需调用方手动传）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const generateTextMock = vi.fn();

vi.mock('ai', () => ({
  generateText: (args: Record<string, unknown>) => generateTextMock(args),
}));

// Provider.getModel / ProviderTransform.providerOptions 必须能被 reviewSkill 调用
const providerGetModelMock = vi.fn(async (_provider: string, modelId: string) => ({ id: modelId, provider: 'anthropic' }));
const providerOptionsMock = vi.fn((_model: unknown, _opts: unknown) => ({}));

vi.mock('@easbot/llm', () => ({
  Provider: {
    getModel: (provider: string, modelId: string) => providerGetModelMock(provider, modelId),
  },
  ProviderTransform: {
    providerOptions: (model: unknown, opts: unknown) => providerOptionsMock(model, opts),
  },
}));

import { Llm } from '../../llm';
import type { LanguageModel } from 'ai';

const MOCK_MD = `---
name: sample
description: demo skill for unit testing
mode: generator
composition: single
---

# Sample

Brief description.

## When to Use

When testing.
`;

/**
 * 构造最小可用的 LanguageModel 假对象
 * （@easbot/llm bootstrapLlm 注入的是 LanguageModelV3 实例，含 .provider / .modelId）
 */
function makeMockModel(provider = 'anthropic', modelId = 'claude-3-5-sonnet-20240620'): LanguageModel {
  return { provider, modelId } as unknown as LanguageModel;
}

describe('Llm.reviewSkill', () => {
  beforeEach(() => {
    Llm.reset();
    generateTextMock.mockReset();
    providerGetModelMock.mockClear();
    providerOptionsMock.mockClear();
  });

  afterEach(() => {
    Llm.reset();
  });

  // ── 1. 初始化 + 状态隔离 ──────────────────────────────────

  it('init is idempotent', () => {
    const model = makeMockModel();
    Llm.init({ models: { languageLlm: model } });
    const firstState = (Llm as unknown as { state?: { models: { languageLlm: LanguageModel } } }).state;
    Llm.init({ models: { languageLlm: model } });
    const secondState = (Llm as unknown as { state?: { models: { languageLlm: LanguageModel } } }).state;
    expect(secondState).toBe(firstState);
  });

  it('isInitialized reflects state', () => {
    expect(Llm.isInitialized()).toBe(false);
    Llm.init({ models: { languageLlm: makeMockModel() } });
    expect(Llm.isInitialized()).toBe(true);
  });

  it('reset clears state', () => {
    Llm.init({ models: { languageLlm: makeMockModel() } });
    Llm.reset();
    expect(Llm.isInitialized()).toBe(false);
  });

  // ── 2. 未配置场景 ──────────────────────────────────────────

  it('throws when reviewSkill called without init', async () => {
    await expect(Llm.reviewSkill('foo', MOCK_MD)).rejects.toThrow(/Llm is not initialized/);
  });

  it('throws when languageLlm not configured but state initialized', async () => {
    // init 接受 models，但 models.languageLlm 缺省也允许；
    // 之后 reviewSkill 必须明确报 "languageLlm model is not configured"
    Llm.init({ models: {} });
    await expect(Llm.reviewSkill('foo', MOCK_MD)).rejects.toThrow(/languageLlm model is not configured/);
  });

  // ── 3. 正常路径（合法 JSON） ───────────────────────────────

  it('parses model JSON into SkillReview', async () => {
    const model = makeMockModel();
    Llm.init({ models: { languageLlm: model } });
    generateTextMock.mockResolvedValueOnce({
      text: JSON.stringify({
        score: 8,
        criteria: [
          { name: 'description-clarity', score: 8, comment: 'clear triggers' },
          { name: 'output-schema', score: 7, comment: 'ok' },
          { name: 'validation-rules', score: 9, comment: 'thorough' },
          { name: 'examples', score: 8, comment: 'good coverage' },
          { name: 'portability', score: 8, comment: 'platform-neutral' },
        ],
        suggestions: ['Add a bad example under `examples`', 'Surface P1 in frontmatter description'],
      }),
    });

    const review = await Llm.reviewSkill('sample', MOCK_MD, { temperature: 0.3, topP: 0.9, topK: 40, maxOutputTokens: 1024 });
    expect(review.skillName).toBe('sample');
    expect(review.score).toBe(8);
    expect(review.passed).toBe(true);
    expect(review.criteria).toHaveLength(5);
    expect(review.criteria[0]?.name).toBe('description-clarity');
    expect(review.suggestions).toHaveLength(2);
    expect(review.rawOutput).toContain('"score":8');
  });

  it('passes through temperature/topP/topK/maxOutputTokens', async () => {
    Llm.init({ models: { languageLlm: makeMockModel() } });
    generateTextMock.mockResolvedValueOnce({ text: '{"score":7,"criteria":[],"suggestions":[]}' });

    await Llm.reviewSkill('s', MOCK_MD, { temperature: 0.1, topP: 0.5, topK: 10, maxOutputTokens: 512 });
    expect(generateTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 0.1,
        topP: 0.5,
        topK: 10,
        maxOutputTokens: 512,
      }),
    );
  });

  // ── 4. JSON 降级路径 ───────────────────────────────────────

  it('falls back to rawOutput when model returns non-JSON', async () => {
    Llm.init({ models: { languageLlm: makeMockModel() } });
    generateTextMock.mockResolvedValueOnce({
      text: 'I cannot comply with that output format. Here is my prose review...',
    });

    const review = await Llm.reviewSkill('sample', MOCK_MD);
    expect(review.score).toBe(0);
    expect(review.passed).toBe(false);
    expect(review.criteria).toEqual([]);
    expect(review.suggestions[0]).toMatch(/raw output/i);
    expect(review.rawOutput).toContain('I cannot comply');
  });

  it('falls back when JSON.parse throws on partial JSON', async () => {
    Llm.init({ models: { languageLlm: makeMockModel() } });
    generateTextMock.mockResolvedValueOnce({
      text: '{"score": 5, "criteria": [',
    });

    const review = await Llm.reviewSkill('sample', MOCK_MD);
    expect(review.score).toBe(0);
    expect(review.passed).toBe(false);
    expect(review.rawOutput).toBe('{"score": 5, "criteria": [');
  });

  // ── 5. variant 注入 ───────────────────────────────────────

  it('appends variant hint to system message when provided', async () => {
    Llm.init({ models: { languageLlm: makeMockModel() } });
    generateTextMock.mockResolvedValueOnce({ text: '{"score":7,"criteria":[],"suggestions":[]}' });

    await Llm.reviewSkill('sample', MOCK_MD, { variant: 'reviewer-strict' });
    expect(generateTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining('reviewer-strict'),
      }),
    );
  });

  it('omits variant hint when not provided', async () => {
    Llm.init({ models: { languageLlm: makeMockModel() } });
    generateTextMock.mockResolvedValueOnce({ text: '{"score":7,"criteria":[],"suggestions":[]}' });

    await Llm.reviewSkill('sample', MOCK_MD);
    const system = generateTextMock.mock.calls[0]?.[0]?.system as string;
    expect(system).not.toContain('## Reviewer Variant');
  });

  // ── 6. providerOptions 自动推导 ───────────────────────────

  it('calls Provider.getModel + ProviderTransform.providerOptions', async () => {
    Llm.init({ models: { languageLlm: makeMockModel('anthropic', 'claude-3-5-sonnet-20240620') } });
    generateTextMock.mockResolvedValueOnce({ text: '{"score":7,"criteria":[],"suggestions":[]}' });

    await Llm.reviewSkill('sample', MOCK_MD);
    expect(providerGetModelMock).toHaveBeenCalledWith('anthropic', 'claude-3-5-sonnet-20240620');
    expect(providerOptionsMock).toHaveBeenCalledTimes(1);
    expect(generateTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        providerOptions: expect.anything(),
      }),
    );
  });

  // ── 7. 默认参数 ───────────────────────────────────────────

  it('uses default temperature=0.2 / maxOutputTokens=32000 when not provided', async () => {
    Llm.init({ models: { languageLlm: makeMockModel() } });
    generateTextMock.mockResolvedValueOnce({ text: '{"score":7,"criteria":[],"suggestions":[]}' });

    await Llm.reviewSkill('sample', MOCK_MD);
    expect(generateTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 0.2,
        maxOutputTokens: 32_000,
      }),
    );
  });

  // ── 8. generateText 抛错时透传 ────────────────────────────

  it('rethrows generateText errors so callers can map to ReviewFailed', async () => {
    Llm.init({ models: { languageLlm: makeMockModel() } });
    generateTextMock.mockRejectedValueOnce(new Error('rate limit'));

    await expect(Llm.reviewSkill('sample', MOCK_MD)).rejects.toThrow(/rate limit/);
  });
});
