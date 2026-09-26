/**
 * src/creation/__tests__/memory-bridge.test.ts
 * Memory 单元测试
 *
 * 测试覆盖：
 * - Experience: recordExperience / queryExperiences (按 type / actionKind / refId / sessionId / sinceMs 过滤)
 * - Pattern: upsertPattern (upsert by id) / listPatterns (按 type / minConfidence 过滤)
 * - Knowledge: upsertKnowledge (upsert by id) / searchKnowledge (子串匹配)
 * - Snapshot / History: snapshot() 写文件 + history() 读快照列表
 * - 隔离：每个 test 用独立 tmp dir，不污染 home
 *
 * 修复（决策 0011 类型 bug）：
 * - memory-bridge.ts:53 `minConfidence: Pattern['type']` 应该是 `Pattern['confidence']`
 *   Pattern['type'] 是 string union（'successful' | 'failure' | 'optimization'），
 *   不能赋值 number minConfidence
 *
 * 隔离策略：
 * - MemoryBridge 接受构造参数 `storageDir`（line 114-116）—— 直接传 tmp dir
 * - 每个 test 用 mkdtempSync 创建独立 tmp 子目录
 * - afterEach 清理 + rmSync
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { MemoryBridge, createMemoryBridge, type Memory } from '../memory-bridge';
import type { Experience, Pattern, Knowledge } from '../types';

// ── 测试夹具工厂 ───────────────────────────────────────────

function makeExperience(overrides: Partial<Experience> = {}): Experience {
  return {
    id: `exp-${Math.random().toString(36).slice(2, 9)}`,
    type: 'success',
    context: {
      task: 'unit test task',
      agent: 'test-agent',
      sessionId: 'session-1',
    },
    action: {
      kind: 'skill',
      refId: 'test-skill',
      params: { foo: 'bar' },
    },
    result: {
      ok: true,
      output: 'success',
      durationMs: 100,
    },
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makePattern(overrides: Partial<Pattern> = {}): Pattern {
  return {
    id: `pat-${Math.random().toString(36).slice(2, 9)}`,
    type: 'successful',
    description: 'a test pattern',
    conditions: ['when test runs'],
    actions: ['do something'],
    outcomes: ['success'],
    confidence: 0.8,
    support: 5,
    derivedFromExperienceIds: [],
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeKnowledge(overrides: Partial<Knowledge> = {}): Knowledge {
  return {
    id: `know-${Math.random().toString(36).slice(2, 9)}`,
    kind: 'procedural',
    content: 'a piece of test knowledge',
    source: {
      patternIds: [],
      experienceIds: [],
    },
    applicability: ['testing'],
    reliability: 0.9,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ── 测试套件 ───────────────────────────────────────────────

describe('MemoryBridge', () => {
  let memory: MemoryBridge;
  let tmpDir: string;

  beforeEach(() => {
    // 隔离：每个 test 独立 tmp dir
    tmpDir = mkdtempSync(path.join(tmpdir(), 'easbot-memory-test-'));
    memory = createMemoryBridge(tmpDir);
  });

  afterEach(() => {
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // ── 1. Experience ─────────────────────────────────────

  describe('Experience: recordExperience + queryExperiences', () => {
    it('should record and retrieve an experience', async () => {
      // 业务 store 自动生成 id，不使用传入的 id（test 期望 recordsByQuery 而非 id 一致）
      const exp = makeExperience();
      await memory.recordExperience(exp);
      const results = await memory.queryExperiences({ refId: 'test-skill' });
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBeDefined();
      expect(typeof results[0]?.id).toBe('string');
    });

    it('should return empty array when no experiences match', async () => {
      const results = await memory.queryExperiences({ refId: 'nonexistent' });
      expect(results).toEqual([]);
    });

    it('should return empty array when storage dir is empty (no file)', async () => {
      // 没有 recordExperience 过，文件不存在
      const results = await memory.queryExperiences({});
      expect(results).toEqual([]);
    });

    it('should filter by type', async () => {
      await memory.recordExperience(makeExperience({ type: 'success' }));
      await memory.recordExperience(makeExperience({ type: 'failure' }));
      await memory.recordExperience(makeExperience({ type: 'partial' }));

      const successResults = await memory.queryExperiences({ type: 'success' });
      expect(successResults).toHaveLength(1);
      expect(successResults[0]?.type).toBe('success');
    });

    it('should filter by actionKind', async () => {
      await memory.recordExperience(makeExperience({ action: { kind: 'skill', refId: 's1', params: {} } }));
      await memory.recordExperience(makeExperience({ action: { kind: 'tool', refId: 't1', params: {} } }));
      await memory.recordExperience(makeExperience({ action: { kind: 'workflow', refId: 'w1', params: {} } }));

      const skillResults = await memory.queryExperiences({ actionKind: 'skill' });
      expect(skillResults).toHaveLength(1);
      expect(skillResults[0]?.action.kind).toBe('skill');
    });

    it('should filter by refId', async () => {
      await memory.recordExperience(makeExperience({ action: { kind: 'skill', refId: 'skill-A', params: {} } }));
      await memory.recordExperience(makeExperience({ action: { kind: 'skill', refId: 'skill-B', params: {} } }));

      const aResults = await memory.queryExperiences({ refId: 'skill-A' });
      expect(aResults).toHaveLength(1);
      expect(aResults[0]?.action.refId).toBe('skill-A');
    });

    it('should filter by sessionId', async () => {
      await memory.recordExperience(makeExperience({ context: { task: 't', agent: 'a', sessionId: 's1' } }));
      await memory.recordExperience(makeExperience({ context: { task: 't', agent: 'a', sessionId: 's2' } }));

      const s1Results = await memory.queryExperiences({ sessionId: 's1' });
      expect(s1Results).toHaveLength(1);
      expect(s1Results[0]?.context.sessionId).toBe('s1');
    });

    it('should filter by sinceMs (time threshold)', async () => {
      const old = new Date('2020-01-01T00:00:00.000Z').toISOString();
      const recent = new Date().toISOString();
      await memory.recordExperience(makeExperience({ createdAt: old }));
      await memory.recordExperience(makeExperience({ createdAt: recent }));

      const sinceMs = new Date('2025-01-01T00:00:00.000Z').getTime();
      const recentResults = await memory.queryExperiences({ sinceMs });
      expect(recentResults).toHaveLength(1);
    });

    it('should sort results by createdAt descending', async () => {
      await memory.recordExperience(makeExperience({ createdAt: '2025-01-01T00:00:00.000Z' }));
      await memory.recordExperience(makeExperience({ createdAt: '2025-03-01T00:00:00.000Z' }));
      await memory.recordExperience(makeExperience({ createdAt: '2025-02-01T00:00:00.000Z' }));

      const results = await memory.queryExperiences({});
      expect(results).toHaveLength(3);
      // 倒序：3月 → 2月 → 1月
      expect(new Date(results[0]!.createdAt).getMonth()).toBe(2); // 3月 = month index 2
      expect(new Date(results[1]!.createdAt).getMonth()).toBe(1);
      expect(new Date(results[2]!.createdAt).getMonth()).toBe(0);
    });

    it('should respect limit', async () => {
      for (let i = 0; i < 5; i++) {
        await memory.recordExperience(makeExperience());
      }
      const results = await memory.queryExperiences({ limit: 3 });
      expect(results).toHaveLength(3);
    });

    it('should combine multiple filters (AND semantics)', async () => {
      await memory.recordExperience(
        makeExperience({
          type: 'success',
          action: { kind: 'skill', refId: 'json-parser', params: {} },
          context: { task: 't', agent: 'a', sessionId: 's1' },
        }),
      );
      await memory.recordExperience(
        makeExperience({
          type: 'failure',
          action: { kind: 'skill', refId: 'json-parser', params: {} },
          context: { task: 't', agent: 'a', sessionId: 's2' },
        }),
      );

      const results = await memory.queryExperiences({
        type: 'success',
        refId: 'json-parser',
        sessionId: 's1',
      });
      expect(results).toHaveLength(1);
      expect(results[0]?.type).toBe('success');
    });
  });

  // ── 2. Pattern ────────────────────────────────────────

  describe('Pattern: upsertPattern + listPatterns', () => {
    it('should insert a pattern', async () => {
      const p = makePattern({ id: 'p1' });
      await memory.upsertPattern(p);
      const results = await memory.listPatterns();
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe('p1');
    });

    it('should upsert (update existing by id)', async () => {
      await memory.upsertPattern(makePattern({ id: 'p1', confidence: 0.5 }));
      await memory.upsertPattern(makePattern({ id: 'p1', confidence: 0.9 }));

      const results = await memory.listPatterns();
      expect(results).toHaveLength(1);
      expect(results[0]?.confidence).toBe(0.9);
    });

    it('should list multiple patterns', async () => {
      await memory.upsertPattern(makePattern({ id: 'p1' }));
      await memory.upsertPattern(makePattern({ id: 'p2' }));
      await memory.upsertPattern(makePattern({ id: 'p3' }));

      const results = await memory.listPatterns();
      expect(results).toHaveLength(3);
    });

    it('should filter by type', async () => {
      await memory.upsertPattern(makePattern({ id: 'p1', type: 'successful' }));
      await memory.upsertPattern(makePattern({ id: 'p2', type: 'failure' }));
      await memory.upsertPattern(makePattern({ id: 'p3', type: 'optimization' }));

      const successful = await memory.listPatterns({ type: 'successful' });
      expect(successful).toHaveLength(1);
      expect(successful[0]?.id).toBe('p1');
    });

    it('should filter by minConfidence (修复决策 0011 类型 bug 后)', async () => {
      await memory.upsertPattern(makePattern({ id: 'p1', confidence: 0.3 }));
      await memory.upsertPattern(makePattern({ id: 'p2', confidence: 0.7 }));
      await memory.upsertPattern(makePattern({ id: 'p3', confidence: 0.9 }));

      const highConf = await memory.listPatterns({ minConfidence: 0.6 });
      expect(highConf).toHaveLength(2);
      expect(highConf.every((p) => p.confidence >= 0.6)).toBe(true);
    });

    it('should sort by confidence descending', async () => {
      await memory.upsertPattern(makePattern({ id: 'p1', confidence: 0.3 }));
      await memory.upsertPattern(makePattern({ id: 'p2', confidence: 0.9 }));
      await memory.upsertPattern(makePattern({ id: 'p3', confidence: 0.5 }));

      const results = await memory.listPatterns();
      expect(results[0]?.confidence).toBe(0.9);
      expect(results[1]?.confidence).toBe(0.5);
      expect(results[2]?.confidence).toBe(0.3);
    });

    it('should return empty array when no patterns', async () => {
      const results = await memory.listPatterns();
      expect(results).toEqual([]);
    });
  });

  // ── 3. Knowledge ──────────────────────────────────────

  describe('Knowledge: upsertKnowledge + searchKnowledge', () => {
    it('should insert a knowledge item', async () => {
      const k = makeKnowledge({ id: 'k1', content: 'json parsing tip' });
      await memory.upsertKnowledge(k);
      const results = await memory.searchKnowledge({ text: 'json' });
      expect(results).toHaveLength(1);
    });

    it('should upsert (update existing by id)', async () => {
      await memory.upsertKnowledge(makeKnowledge({ id: 'k1', content: 'old content' }));
      await memory.upsertKnowledge(makeKnowledge({ id: 'k1', content: 'new content' }));

      const results = await memory.searchKnowledge({ text: 'new' });
      expect(results).toHaveLength(1);
      expect(results[0]?.content).toBe('new content');
    });

    it('should be case-insensitive in search', async () => {
      await memory.upsertKnowledge(makeKnowledge({ id: 'k1', content: 'JSON Parsing Tips' }));
      const results = await memory.searchKnowledge({ text: 'json' });
      expect(results).toHaveLength(1);
    });

    it('should respect limit', async () => {
      for (let i = 0; i < 5; i++) {
        await memory.upsertKnowledge(makeKnowledge({ content: `item ${i} with json` }));
      }
      const results = await memory.searchKnowledge({ text: 'json', limit: 3 });
      expect(results).toHaveLength(3);
    });

    it('should not match unrelated text', async () => {
      await memory.upsertKnowledge(makeKnowledge({ id: 'k1', content: 'xml parsing' }));
      const results = await memory.searchKnowledge({ text: 'json' });
      expect(results).toEqual([]);
    });

    it('should return empty when no knowledge exists', async () => {
      const results = await memory.searchKnowledge({ text: 'anything' });
      expect(results).toEqual([]);
    });
  });

  // ── 4. Snapshot / History ─────────────────────────────

  describe('Snapshot + History', () => {
    it('should write a snapshot file', async () => {
      await memory.snapshot('test-spec', 'content v1');
      const files = readdirSync(path.join(tmpDir, 'snapshots', 'test-spec'));
      expect(files).toHaveLength(1);
    });

    it('should create separate snapshot dir per specId', async () => {
      await memory.snapshot('spec-A', 'content A');
      await memory.snapshot('spec-B', 'content B');
      expect(existsSync(path.join(tmpDir, 'snapshots', 'spec-A'))).toBe(true);
      expect(existsSync(path.join(tmpDir, 'snapshots', 'spec-B'))).toBe(true);
    });

    it('should return empty history when no snapshots', async () => {
      const hist = await memory.history('nonexistent');
      expect(hist).toEqual([]);
    });

    it('should return snapshot list sorted descending', async () => {
      await memory.snapshot('test-spec', 'v1');
      await new Promise((r) => setTimeout(r, 10));
      await memory.snapshot('test-spec', 'v2');
      await new Promise((r) => setTimeout(r, 10));
      await memory.snapshot('test-spec', 'v3');

      const hist = await memory.history('test-spec');
      expect(hist).toHaveLength(3);
      // 倒序：v3 → v2 → v1
      expect(hist[0]?.content).toBe('v3');
      expect(hist[1]?.content).toBe('v2');
      expect(hist[2]?.content).toBe('v1');
    });
  });

  // ── 5. 并发写入 ──────────────────────────────────────

  describe('Concurrency', () => {
    it('should serialize concurrent writes (writeQueue)', async () => {
      // 并发写入 5 个 experience
      const writes = Array.from({ length: 5 }, (_, i) => memory.recordExperience(makeExperience({ id: `exp-${i}` })));
      await Promise.all(writes);

      const all = await memory.queryExperiences({});
      expect(all).toHaveLength(5);
    });
  });

  // ── 6. JSONL 格式验证 ─────────────────────────────────

  describe('JSONL file format', () => {
    it('should write one JSON object per line', async () => {
      await memory.recordExperience(makeExperience({ id: 'exp-1' }));
      await memory.recordExperience(makeExperience({ id: 'exp-2' }));

      const file = path.join(tmpDir, 'experiences.jsonl');
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n').filter((l) => l.trim().length > 0);
      expect(lines).toHaveLength(2);
      // 每行都是合法 JSON
      for (const line of lines) {
        const parsed = JSON.parse(line);
        expect(parsed.id).toBeDefined();
      }
    });
  });

  // ── 7. 隔离验证 ──────────────────────────────────────

  describe('Isolation', () => {
    it('should not write to real user home', async () => {
      await memory.recordExperience(makeExperience({ id: 'iso-1' }));
      const file = path.join(tmpDir, 'experiences.jsonl');
      expect(existsSync(file)).toBe(true);
      // 路径应该在 tmpdir() 下，不在用户 home 下
      expect(file).toContain(tmpdir());
    });
  });

  // ── 8. 接口完整性 ─────────────────────────────────────

  describe('Interface compliance', () => {
    it('MemoryBridge implements Memory interface (all methods present)', () => {
      const m: Memory = memory;
      expect(typeof m.recordExperience).toBe('function');
      expect(typeof m.queryExperiences).toBe('function');
      expect(typeof m.upsertPattern).toBe('function');
      expect(typeof m.listPatterns).toBe('function');
      expect(typeof m.upsertKnowledge).toBe('function');
      expect(typeof m.searchKnowledge).toBe('function');
      expect(typeof m.snapshot).toBe('function');
      expect(typeof m.history).toBe('function');
    });
  });
});
