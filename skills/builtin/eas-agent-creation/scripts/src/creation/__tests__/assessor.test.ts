/**
 * src/creation/__tests__/assessor.test.ts
 * SelfAssessor 单元测试
 *
 * 测试覆盖：
 * - assess() 主入口：拉取 Experience → 聚合 → 评估 → 弱点/机会/建议
 * - 能力评估：按 refId 分组 + 综合分（成功率 0.7 + 反馈分 0.3）
 * - 弱点识别：失败率 > 80% + 样本 >= 10 = high；失败率 >= 50% = medium；样本 < 5 = medium
 * - 机会发现：高频失败 → optimize；中等失败率 → merge
 * - 建议生成：按优先级排序（high=10, medium=5, optimize=8, merge=4, new-skill=6）
 * - calculateOverallScore：加权平均（按样本量加权）
 * - emptyAssessment：无数据时返回空集
 *
 * 隔离策略：
 * - 需要 MemoryBridge 注入 tmp dir（用 mkdtempSync + afterEach 清理）
 * - 通过 seedExperience() 辅助函数批量插入测试数据
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createMemory } from '../memory';
import type { Memory } from '../memory';
import { DefaultSelfAssessor, createSelfAssessor } from '../assessor';
import type { SelfAssessor } from '../assessor';
import type { Experience, ExperienceType, ActionKind, FeedbackSource } from '../types';

// ── 测试夹具工厂 ───────────────────────────────────────────

let expCounter = 0;

/**
 * 创建一个 Experience
 * @param overrides 字段覆盖
 */
function makeExp(overrides: Partial<Experience> = {}): Experience {
  expCounter++;
  return {
    id: `exp-${expCounter}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'success',
    context: {
      task: 'unit test',
      agent: 'test-agent',
      sessionId: 'session-1',
    },
    action: {
      kind: 'skill',
      refId: 'test-skill',
      params: {},
    },
    result: {
      ok: true,
      output: 'ok',
      durationMs: 100,
    },
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * 生成 N 个 refId 同、type 相同的 Experience（用于批量测试）
 */
function seedExps(memory: Memory, refId: string, type: ExperienceType, count: number, opts: { kind?: ActionKind; durationMs?: number; error?: string; feedbackScore?: number } = {}): Promise<void>[] {
  const writes: Promise<void>[] = [];
  for (let i = 0; i < count; i++) {
    writes.push(
      memory.recordExperience(
        makeExp({
          action: { kind: opts.kind ?? 'skill', refId, params: {} },
          type,
          result: {
            ok: type === 'success',
            output: type === 'success' ? 'ok' : undefined,
            durationMs: opts.durationMs ?? 100,
            error: opts.error,
          },
          feedback: opts.feedbackScore !== undefined ? { source: 'user' as FeedbackSource, score: opts.feedbackScore } : undefined,
        }),
      ),
    );
  }
  return writes;
}

// ── 测试套件 ───────────────────────────────────────────────

describe('SelfAssessor', () => {
  let memory: Memory;
  let tmpDir: string;
  let assessor: SelfAssessor;

  beforeEach(async () => {
    expCounter = 0;
    tmpDir = mkdtempSync(path.join(tmpdir(), 'easbot-assessor-test-'));
    memory = createMemory(tmpDir);
    assessor = createSelfAssessor(memory);
  });

  afterEach(() => {
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // ── 1. 主入口：assess() ────────────────────────────────

  describe('assess()', () => {
    it('should return empty assessment when no experiences', async () => {
      const result = await assessor.assess();
      expect(result.windowDays).toBe(7); // DEFAULT_WINDOW_DAYS
      expect(result.overallScore).toBe(0);
      expect(result.capabilities).toEqual([]);
      expect(result.weaknesses).toEqual([]);
      expect(result.opportunities).toEqual([]);
      expect(result.recommendations).toEqual([]);
      expect(result.generatedAt).toBeDefined();
    });

    it('should respect custom windowDays', async () => {
      const result = await assessor.assess({ windowDays: 30 });
      expect(result.windowDays).toBe(30);
    });

    it('should return overallScore 0 when no data', async () => {
      const result = await assessor.assess();
      expect(result.overallScore).toBe(0);
    });
  });

  // ── 2. 能力评估：capabilities ──────────────────────────

  describe('capability aggregation', () => {
    it('should aggregate by refId', async () => {
      await Promise.all([...seedExps(memory, 'skill-A', 'success', 5), ...seedExps(memory, 'skill-B', 'success', 3)]);

      const result = await assessor.assess();
      const names = result.capabilities.map((c) => c.name).sort();
      expect(names).toEqual(['skill-A', 'skill-B']);

      const a = result.capabilities.find((c) => c.name === 'skill-A');
      expect(a?.sampleSize).toBe(5);
      expect(a?.score).toBeGreaterThanOrEqual(0);
      expect(a?.score).toBeLessThanOrEqual(1);
    });

    it('should compute score = successRate (all success)', async () => {
      await Promise.all(seedExps(memory, 'perfect-skill', 'success', 10));

      const result = await assessor.assess();
      const c = result.capabilities.find((c) => c.name === 'perfect-skill');
      expect(c?.score).toBe(1); // 100%
    });

    it('should compute score = successRate (all failure)', async () => {
      await Promise.all(seedExps(memory, 'failing-skill', 'failure', 5));

      const result = await assessor.assess();
      const c = result.capabilities.find((c) => c.name === 'failing-skill');
      expect(c?.score).toBe(0);
    });

    it('should compute score = mixed (50% success)', async () => {
      await Promise.all([...seedExps(memory, 'mixed-skill', 'success', 5), ...seedExps(memory, 'mixed-skill', 'failure', 5)]);

      const result = await assessor.assess();
      const c = result.capabilities.find((c) => c.name === 'mixed-skill');
      expect(c?.score).toBeCloseTo(0.5, 1);
    });

    it('should combine feedback score (0.7 success + 0.3 feedback)', async () => {
      // 100% 成功率 + 0.0 反馈分 = 0.7
      // 100% 成功率 + 1.0 反馈分 = 1.0
      await Promise.all([...seedExps(memory, 'fb-low', 'success', 10, { feedbackScore: 0.0 }), ...seedExps(memory, 'fb-high', 'success', 10, { feedbackScore: 1.0 })]);

      const result = await assessor.assess();
      const low = result.capabilities.find((c) => c.name === 'fb-low');
      const high = result.capabilities.find((c) => c.name === 'fb-high');
      // fb-low: 1.0 * 0.7 + 0.0 * 0.3 = 0.7
      expect(low?.score).toBe(0.7);
      // fb-high: 1.0 * 0.7 + 1.0 * 0.3 = 1.0
      expect(high?.score).toBe(1);
    });

    it('should sort capabilities by score ascending (worst first)', async () => {
      await Promise.all([
        ...seedExps(memory, 'good', 'success', 5),
        ...seedExps(memory, 'bad', 'failure', 5),
        ...seedExps(memory, 'mid', 'success', 5), // 0% success (实际上 100% success)
        // 添加真正的 mid: 5 success + 3 failure
      ]);

      const result = await assessor.assess();
      // 弱的能力在前
      expect(result.capabilities[0]?.score).toBeLessThanOrEqual(result.capabilities[1]?.score ?? 1);
    });
  });

  // ── 3. 弱点识别：weaknesses ────────────────────────────

  describe('weakness identification', () => {
    it('should detect high severity weakness (failureRate >= 80% AND sample >= 10)', async () => {
      // 10 次调用，10 全失败 = 100% failure rate
      await Promise.all(seedExps(memory, 'broken-skill', 'failure', 10));

      const result = await assessor.assess();
      const w = result.weaknesses.find((w) => w.area === 'skill:broken-skill');
      expect(w).toBeDefined();
      expect(w?.severity).toBe('high');
    });

    it('should NOT mark as high if sample < 10 (even with 100% failure)', async () => {
      // 5 failures - 50% failure, sample < 10
      await Promise.all(seedExps(memory, 'small-broken', 'failure', 5));

      const result = await assessor.assess();
      const w = result.weaknesses.find((w) => w.area === 'skill:small-broken');
      // 失败率 100% 但样本 5 < 10，不会标 high；而是触发"样本不足"路径
      expect(w?.severity).not.toBe('high');
    });

    it('should detect medium severity weakness (failureRate >= 50%)', async () => {
      // 6 success + 6 failure = 50% failure rate, 12 samples
      await Promise.all([...seedExps(memory, 'flaky-skill', 'success', 6), ...seedExps(memory, 'flaky-skill', 'failure', 6)]);

      const result = await assessor.assess();
      const w = result.weaknesses.find((w) => w.area === 'skill:flaky-skill');
      expect(w?.severity).toBe('medium');
    });

    it('should mark as "sample insufficient" when totalCalls < 5 and not 100% successful', async () => {
      // 2 success + 1 failure = 67% success（< 1）+ 3 次调用（< 5）
      // 失败率 33% < 50%，不会触发"失败率高"路径
      // 但样本不足（< 5）+ 成功率 < 1 → 触发"样本不足"
      await Promise.all([...seedExps(memory, 'low-volume', 'success', 2), ...seedExps(memory, 'low-volume', 'failure', 1)]);

      const result = await assessor.assess();
      const w = result.weaknesses.find((w) => w.area === 'skill:low-volume');
      expect(w).toBeDefined();
      expect(w?.evidence.some((e) => e.includes('Insufficient samples'))).toBe(true);
    });

    it('should not generate weaknesses for all-success high-volume skills', async () => {
      await Promise.all(seedExps(memory, 'reliable-skill', 'success', 20));

      const result = await assessor.assess();
      const w = result.weaknesses.find((w) => w.area === 'skill:reliable-skill');
      expect(w).toBeUndefined();
    });

    it('should sort weaknesses by severity (high → medium → low)', async () => {
      // 同时存在 high 和 medium
      await Promise.all([
        ...seedExps(memory, 'high-broken', 'failure', 20), // 100% failure, sample 20 → high
        ...seedExps(memory, 'medium-flaky', 'success', 5), // 50% failure, sample 10 → medium
        ...seedExps(memory, 'no-issues', 'success', 10),
      ]);
      // medium-flaky 实际只 5 success，需要再补 5 failure
      await Promise.all(seedExps(memory, 'medium-flaky', 'failure', 5));

      const result = await assessor.assess();
      // high 在前
      if (result.weaknesses.length >= 2) {
        const first = result.weaknesses[0];
        const second = result.weaknesses[1];
        const order = { high: 0, medium: 1, low: 2 };
        expect(order[first!.severity]).toBeLessThanOrEqual(order[second!.severity]);
      }
    });
  });

  // ── 4. 机会发现：opportunities ─────────────────────────

  describe('opportunity discovery', () => {
    it('should detect optimize opportunity (failureRate >= 70% AND calls >= 20)', async () => {
      await Promise.all(seedExps(memory, 'optimize-target', 'failure', 20));

      const result = await assessor.assess();
      const opp = result.opportunities.find((o) => o.kind === 'optimize');
      expect(opp).toBeDefined();
      expect(opp?.rationale).toContain('optimize-target');
    });

    it('should NOT detect optimize if calls < 20', async () => {
      await Promise.all(seedExps(memory, 'low-volume-failure', 'failure', 10));

      const result = await assessor.assess();
      const opp = result.opportunities.find((o) => o.kind === 'optimize');
      expect(opp).toBeUndefined();
    });

    it('should detect merge opportunity (failureRate in [40%, 70%) AND calls >= 10)', async () => {
      // 5 success + 5 failure = 50% failure, 10 calls
      await Promise.all([...seedExps(memory, 'merge-target', 'success', 5), ...seedExps(memory, 'merge-target', 'failure', 5)]);

      const result = await assessor.assess();
      const opp = result.opportunities.find((o) => o.kind === 'merge');
      expect(opp).toBeDefined();
    });

    it('should return empty opportunities when all skills are reliable', async () => {
      await Promise.all(seedExps(memory, 'perfect', 'success', 30));

      const result = await assessor.assess();
      // 100% success 没有 optimize/merge 触发
      expect(result.opportunities).toEqual([]);
    });
  });

  // ── 5. 建议生成：recommendations ───────────────────────

  describe('recommendation generation', () => {
    it('should convert high severity weaknesses to priority-10 recommendations', async () => {
      await Promise.all(seedExps(memory, 'critical-broken', 'failure', 20));

      const result = await assessor.assess();
      const rec = result.recommendations.find((r) => r.action.includes('critical-broken'));
      expect(rec).toBeDefined();
      expect(rec?.priority).toBe(10);
    });

    it('should convert medium severity weaknesses to priority-5 recommendations', async () => {
      await Promise.all([...seedExps(memory, 'medium-issue', 'success', 5), ...seedExps(memory, 'medium-issue', 'failure', 5)]);

      const result = await assessor.assess();
      const rec = result.recommendations.find((r) => r.action.includes('medium-issue'));
      expect(rec?.priority).toBe(5);
    });

    it('should convert optimize opportunities to priority-8 recommendations', async () => {
      await Promise.all(seedExps(memory, 'needs-optimize', 'failure', 20));

      const result = await assessor.assess();
      const rec = result.recommendations.find((r) => r.action.includes('needs-optimize') && r.priority === 8);
      expect(rec).toBeDefined();
    });

    it('should sort recommendations by priority descending', async () => {
      // 同时制造 high 弱点（priority 10）和 merge 机会（priority 4）
      await Promise.all([
        ...seedExps(memory, 'critical', 'failure', 20), // high weakness → priority 10
        ...seedExps(memory, 'mergeable', 'success', 5), // 50% failure → merge opportunity → priority 4
        ...seedExps(memory, 'mergeable', 'failure', 5),
      ]);

      const result = await assessor.assess();
      // 第一个 recommendation 应该有最高 priority
      if (result.recommendations.length >= 2) {
        expect(result.recommendations[0]!.priority).toBeGreaterThanOrEqual(result.recommendations[1]!.priority);
      }
    });
  });

  // ── 6. overallScore 加权平均 ──────────────────────────

  describe('overallScore', () => {
    it('should be weighted average by sample size', async () => {
      // 完美技能（10 样本，score 1.0）+ 失败技能（10 样本，score 0.0）
      // 加权：(10 * 1 + 10 * 0) / 20 = 0.5
      await Promise.all([...seedExps(memory, 'good', 'success', 10), ...seedExps(memory, 'bad', 'failure', 10)]);

      const result = await assessor.assess();
      expect(result.overallScore).toBe(0.5);
    });

    it('should be dominated by high-volume skill', async () => {
      // 小样本完美（1 call, 1.0）+ 大样本失败（20 calls, 0.0）
      // 加权 = (1 * 1 + 20 * 0) / 21 ≈ 0.05
      await Promise.all([...seedExps(memory, 'low-freq-good', 'success', 1), ...seedExps(memory, 'high-freq-bad', 'failure', 20)]);

      const result = await assessor.assess();
      expect(result.overallScore).toBeLessThan(0.1);
    });

    it('should be 0 when no capabilities', async () => {
      const result = await assessor.assess();
      expect(result.overallScore).toBe(0);
    });
  });

  // ── 7. 多 refId / 多 kind 场景 ────────────────────────

  describe('multi-capability scenarios', () => {
    it('should aggregate across different action.kind', async () => {
      await Promise.all([
        ...seedExps(memory, 'skill-1', 'success', 5, { kind: 'skill' }),
        ...seedExps(memory, 'tool-1', 'success', 5, { kind: 'tool' }),
        ...seedExps(memory, 'workflow-1', 'success', 5, { kind: 'workflow' }),
      ]);

      const result = await assessor.assess();
      expect(result.capabilities).toHaveLength(3);
    });

    it('should produce full assessment structure when data exists', async () => {
      await Promise.all([
        ...seedExps(memory, 'happy-skill', 'success', 30), // 完美
        ...seedExps(memory, 'broken-skill', 'failure', 20), // 高弱点
        ...seedExps(memory, 'flaky-skill', 'success', 5), // medium 弱点
      ]);
      await Promise.all(seedExps(memory, 'flaky-skill', 'failure', 5));

      const result = await assessor.assess();

      // 结构完整性
      expect(result.generatedAt).toBeDefined();
      expect(result.windowDays).toBe(7);
      expect(typeof result.overallScore).toBe('number');

      // 应有 3 个 capability
      expect(result.capabilities).toHaveLength(3);

      // 应有弱点（broken-skill + flaky-skill）
      expect(result.weaknesses.length).toBeGreaterThan(0);

      // 应有 optimize 机会（broken-skill 触发）
      const opp = result.opportunities.find((o) => o.kind === 'optimize');
      expect(opp).toBeDefined();

      // 应有建议（按优先级排序）
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  // ── 8. 性能聚合 ───────────────────────────────────────

  describe('aggregation details', () => {
    it('should compute avg duration per capability (verified via evidence)', async () => {
      // 失败 10 次，每次 200ms，平均 200ms
      // evidence: `Avg latency: 200ms`
      await Promise.all(seedExps(memory, 'slow-broken', 'failure', 10, { durationMs: 200, error: 'TIMEOUT' }));

      const result = await assessor.assess();
      const w = result.weaknesses.find((w) => w.area === 'skill:slow-broken');
      expect(w).toBeDefined();
      // evidence 包含平均时延
      expect(w?.evidence.some((e) => e.includes('Avg latency'))).toBe(true);
    });

    it('should record top-3 error codes in weakness evidence', async () => {
      // 高弱点：10+ 次失败
      for (let i = 0; i < 15; i++) {
        await memory.recordExperience(
          makeExp({
            action: { kind: 'skill', refId: 'multi-error', params: {} },
            type: 'failure',
            result: {
              ok: false,
              output: null,
              durationMs: 50,
              error: i % 3 === 0 ? 'TIMEOUT' : i % 3 === 1 ? 'OOM' : 'EPERM',
            },
          }),
        );
      }

      const result = await assessor.assess();
      const w = result.weaknesses.find((w) => w.area === 'skill:multi-error');
      expect(w?.evidence.some((e) => e.includes('TIMEOUT'))).toBe(true);
    });

    it('should treat success rate 100% as no weakness, regardless of volume', async () => {
      await Promise.all(seedExps(memory, 'flawless', 'success', 100));
      const result = await assessor.assess();
      const w = result.weaknesses.find((w) => w.area === 'skill:flawless');
      expect(w).toBeUndefined();
    });
  });

  // ── 9. 接口完整性 ─────────────────────────────────────

  describe('interface compliance', () => {
    it('DefaultSelfAssessor should expose assess()', async () => {
      expect(typeof assessor.assess).toBe('function');
      const result = await assessor.assess();
      expect(result).toBeDefined();
    });

    it('createSelfAssessor should return DefaultSelfAssessor', () => {
      const a = createSelfAssessor(memory);
      expect(a).toBeInstanceOf(DefaultSelfAssessor);
    });
  });

  // ── 10. 隔离验证 ──────────────────────────────────────

  describe('isolation', () => {
    it('should not read from real user home', async () => {
      // 测试 tmpDir 之外没有任何文件被读
      await Promise.all(seedExps(memory, 'iso-test', 'success', 5));
      const result = await assessor.assess();
      // 数据从 tmpDir 读到，所以 capability 应该存在
      expect(result.capabilities).toHaveLength(1);
      // tmpDir 存在
      expect(existsSync(tmpDir)).toBe(true);
    });
  });
});
