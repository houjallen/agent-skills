/**
 * src/creation/__tests__/creator.test.ts
 * Creator 单元测试
 *
 * 范围（v1）：
 * - CreatorError 命名错误
 * - DefaultCreator.createSkill 正常/异常路径
 * - Creator 接口完整性
 * - storageDir 配置
 */

import { describe, it, expect, vi } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { DefaultCreator, CreatorError } from '../creator';
import { Bus } from '../../bus';

describe('CreatorError', () => {
  it('should create a named error with code and message', () => {
    const err = new CreatorError('TEST_CODE', 'test message');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('CreatorError');
    expect(err.code).toBe('TEST_CODE');
    expect(err.message).toBe('test message');
  });

  it('should expose code as a property', () => {
    const err = new CreatorError('VALIDATION_FAILED', 'field X is required');
    expect(err.code).toBe('VALIDATION_FAILED');
    expect(err.message).toContain('field X is required');
  });
});

describe('DefaultCreator.createSkill', () => {
  it('should throw CreatorError on empty requirement', async () => {
    const creator = new DefaultCreator();
    try {
      await creator.createSkill({ requirement: '' });
      expect.fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(CreatorError);
      expect((e as CreatorError).code).toBe('EMPTY_REQUIREMENT');
    }
  });

  it('should throw CreatorError on whitespace-only requirement', async () => {
    const creator = new DefaultCreator();
    await expect(creator.createSkill({ requirement: '   \n\t  ' })).rejects.toBeInstanceOf(CreatorError);
  });

  it('should generate a valid SkillSpec', async () => {
    const creator = new DefaultCreator();
    const spec = await creator.createSkill({ requirement: '实现一个 CSV 解析器' });
    expect(spec.name).toMatch(/^[a-z][a-z0-9-]+$/);
    expect(spec.description.length).toBeGreaterThanOrEqual(10);
    expect(spec.body.length).toBeGreaterThanOrEqual(50);
    expect(spec.origin.kind).toBe('created');
    expect(spec.createdAt).toBeDefined();
  });
});

describe('DefaultCreator options', () => {
  it('should use default ~/.easbot/created when no storageDir provided', () => {
    const creator = new DefaultCreator();
    const dir = creator.storageDir();
    expect(dir).toContain('.easbot');
    expect(dir).toContain('created');
  });

  it('should accept storageDir via options', () => {
    const creator = new DefaultCreator({ storageDir: '/tmp/test-created' });
    expect(creator.storageDir()).toBe('/tmp/test-created');
  });

  it('should write register to custom storageDir', async () => {
    const customDir = path.join(os.tmpdir(), `creator-test-${Math.random().toString(36).slice(2, 8)}`);
    const creator = new DefaultCreator({ storageDir: customDir });

    const publishSpy = vi.spyOn(Bus, 'publish').mockResolvedValue([] as unknown as undefined[]);

    try {
      const spec = await creator.createSkill({ requirement: '实现一个端到端测试技能' });
      const result = await creator.register(spec);

      expect(result.accepted, `register failed: ${result.reason ?? 'unknown'}`).toBe(true);
      expect(result.path).toContain(customDir);
      expect(result.path).toMatch(/skills[/\\]/);
      expect(result.path).toContain('SKILL.md');
    } finally {
      publishSpy.mockRestore();
      await fs.rm(customDir, { recursive: true, force: true });
    }
  });
});

describe('Creator interface compliance', () => {
  it('DefaultCreator should expose all Creator methods', () => {
    const creator = new DefaultCreator();
    expect(typeof creator.createSkill).toBe('function');
    expect(typeof creator.createWorkflow).toBe('function');
    expect(typeof creator.validate).toBe('function');
    expect(typeof creator.register).toBe('function');
    expect(typeof creator.inferComposition).toBe('function');
    expect(typeof creator.generate).toBe('function');
    expect(typeof creator.remove).toBe('function');
    expect(typeof creator.scanCreatedSkills).toBe('function');
    expect(typeof creator.scanCreatedWorkflows).toBe('function');
    expect(typeof creator.scanCreatedBundles).toBe('function');
    expect(typeof creator.storageDir).toBe('function');
  });
});

describe('TemplateSkillGenerator (compat)', () => {
  it('should generate kebab-case name from requirement', async () => {
    const creator = new DefaultCreator();
    const spec = await creator.generate('实现一个 JSON 解析工具', { primary: 'generator', secondary: [], connections: [] });
    expect(spec.name).toMatch(/^[a-z][a-z0-9-]+$/);
    expect(spec.name.length).toBeGreaterThanOrEqual(2);
  });

  it('should set description from requirement', async () => {
    const creator = new DefaultCreator();
    const spec = await creator.generate('计算两个数的最大公约数', { primary: 'generator', secondary: [], connections: [] });
    expect(spec.description).toContain('最大公约数');
  });

  it('should set body with at least 50 chars', async () => {
    const creator = new DefaultCreator();
    const spec = await creator.generate('实现一个 HTTP 请求工具', { primary: 'generator', secondary: [], connections: [] });
    expect(spec.body.trim().length).toBeGreaterThanOrEqual(50);
  });
});
