/**
 * packages/agent/src/creation/store.ts
 * Creation 存储模块 — 统一持久化管理
 *
 * 设计依据：
 * - 遵循 gateway/session-store.ts 和 message-store.ts 的存储模式
 * - 提供经验、模式、知识、进化计划等实体的统一存储接口
 * - 支持 JSONL 文件存储和批量操作
 * - 集成 Identifier 命名空间生成规范 ID
 *
 * 存储结构：
 * - ~/.easbot/creation/
 *   ├── experiences.jsonl    # 经验记录（追加写入）
 *   ├── patterns.jsonl       # 模式（upsert by id）
 *   ├── knowledge.jsonl      # 知识（upsert by id）
 *   ├── evolver-state.json   # 进化器状态
 *   ├── plans/
 *   │   └── {planId}.json    # 进化计划（按 ID 分离）
 *   └── results/
 *       └── {resultId}.json  # 进化结果（按 ID 分离）
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import { Log } from '@easbot/utils';
import { Identifier } from '@easbot/utils';
import { Global } from '../global';
import type { Experience, ExperienceQuery, EvolutionPlan, EvolutionResult, EvolverQuota, Knowledge, Pattern } from './types';

/** Creation Store 日志 */
const log = Log.create({ service: 'creation.store' });

/** 默认存储根目录：{data}/creation */
export const DEFAULT_STORAGE_DIR = path.join(Global.Path.data, 'creation');

/** JSONL 文件名映射 */
const FILES = {
  experience: 'experiences.jsonl',
  pattern: 'patterns.jsonl',
  knowledge: 'knowledge.jsonl',
} as const;

/** 写锁队列（串行化写操作） */
const writeQueue: Promise<void> = Promise.resolve();

// ── 工具函数 ────────────────────────────────────────────

/**
 * P2-10：safe 时间戳比较
 *
 * 原实现用 `b.createdAt.localeCompare(a.createdAt)`，仅 ISO-8601 字符串字面量按字典序排时与时间序一致。
 * 若某条记录的 createdAt 是 epoch / 非标准格式，会排错。统一改为 `getTime()` 数值比较，
 * 兼容任意 `new Date(...).toString()` 能解析的字符串。
 */
function compareIsoDesc(a: string, b: string): number {
  return new Date(b).getTime() - new Date(a).getTime();
}

/**
 * 串行追加写入
 */
async function appendFile(filePath: string, line: string): Promise<void> {
  return writeQueue.then(async () => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.appendFile(filePath, `${line}\n`, 'utf-8');
  });
}

/**
 * 读取 JSONL 文件
 */
async function readJsonl<T>(filePath: string, predicate?: (item: T) => boolean): Promise<T[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    const items: T[] = [];

    for (const line of lines) {
      try {
        const item = JSON.parse(line) as T;
        if (!predicate || predicate(item)) {
          items.push(item);
        }
      } catch {
        // 跳过损坏行
      }
    }

    return items;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw e;
  }
}

/**
 * 读取 JSON 文件
 */
async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
}

/**
 * 写入 JSON 文件
 */
async function writeJson<T>(filePath: string, data: T): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  // 修复（2026-07-21）：writeJson 也写 JSONL 格式（每行一个对象），
  // 否则 upsertJsonl 写入整个数组后 readJsonl 解析失败
  const content = Array.isArray(data) ? data.map((item) => JSON.stringify(item)).join('\n') + '\n' : JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Upsert 单条记录到 JSONL（按 ID 更新）
 */
async function upsertJsonl<T extends { id: string }>(filePath: string, item: T): Promise<void> {
  const existing = await readJsonl<T>(filePath, (x) => x.id === item.id);
  if (existing.length > 0) {
    // 更新：读全部 → 修改 → 写全部
    const all = await readJsonl<T>(filePath);
    const updated = all.map((x) => (x.id === item.id ? item : x));
    await writeJson(filePath, updated);
  } else {
    // 新增：追加
    await appendFile(filePath, JSON.stringify(item));
  }
}

// ── Store 接口 ──────────────────────────────────────────

/**
 * Creation Store 配置
 */
export interface CreationStoreConfig {
  /** 存储根目录 */
  storageDir?: string;
  /** 进化状态文件路径 */
  evolverStatePath?: string;
  /** 进化计划目录 */
  plansDir?: string;
  /** 进化结果目录 */
  resultsDir?: string;
}

/**
 * Creation Store 接口
 *
 * 提供经验、模式、知识、进化计划和结果的统一存储
 */
export interface CreationStore {
  // ── 经验 ──────────────────────────────────────────────

  /**
   * 记录经验
   */
  recordExperience(e: Omit<Experience, 'id'>): Promise<Experience>;

  /**
   * 查询经验
   */
  queryExperiences(q: ExperienceQuery): Promise<Experience[]>;

  /**
   * 获取经验数量
   */
  countExperiences(): Promise<number>;

  // ── 模式 ──────────────────────────────────────────────

  /**
   * 插入或更新模式
   */
  upsertPattern(p: Omit<Pattern, 'id'> & { id?: string }): Promise<Pattern>;

  /**
   * 获取模式
   */
  getPattern(id: string): Promise<Pattern | null>;

  /**
   * 列出模式
   */
  listPatterns(filter?: { type?: Pattern['type']; minConfidence?: number }): Promise<Pattern[]>;

  /**
   * 删除模式
   */
  deletePattern(id: string): Promise<boolean>;

  // ── 知识 ──────────────────────────────────────────────

  /**
   * 插入或更新知识
   */
  upsertKnowledge(k: Omit<Knowledge, 'id'> & { id?: string }): Promise<Knowledge>;

  /**
   * 获取知识
   */
  getKnowledge(id: string): Promise<Knowledge | null>;

  /**
   * 搜索知识（简单子串匹配）
   */
  searchKnowledge(text: string, limit?: number): Promise<Knowledge[]>;

  /**
   * 删除知识
   */
  deleteKnowledge(id: string): Promise<boolean>;

  // ── 进化计划 ──────────────────────────────────────────

  /**
   * 保存进化计划
   */
  savePlan(plan: EvolutionPlan): Promise<void>;

  /**
   * 获取进化计划
   */
  getPlan(id: string): Promise<EvolutionPlan | null>;

  /**
   * 列出所有进化计划
   */
  listPlans(filter?: { status?: 'pending' | 'approved' | 'rejected' }): Promise<EvolutionPlan[]>;

  /**
   * 删除进化计划
   */
  deletePlan(id: string): Promise<boolean>;

  // ── 进化结果 ──────────────────────────────────────────

  /**
   * 保存进化结果
   */
  saveResult(result: EvolutionResult): Promise<void>;

  /**
   * 获取进化结果
   */
  getResult(id: string): Promise<EvolutionResult | null>;

  /**
   * 列出进化结果
   */
  listResults(limit?: number): Promise<EvolutionResult[]>;

  // ── 进化器状态 ────────────────────────────────────────

  /**
   * 加载进化器配额
   */
  loadQuota(): Promise<EvolverQuota>;

  /**
   * 保存进化器配额
   */
  saveQuota(quota: EvolverQuota): Promise<void>;

  // ── 统计 ──────────────────────────────────────────────

  /**
   * 获取存储统计
   */
  getStats(): Promise<CreationStoreStats>;

  /**
   * 关闭存储（清理资源）
   */
  close(): Promise<void>;
}

/**
 * 存储统计
 */
export interface CreationStoreStats {
  experienceCount: number;
  patternCount: number;
  knowledgeCount: number;
  planCount: number;
  resultCount: number;
}

// ── Store 实现 ──────────────────────────────────────────

/**
 * Creation Store 默认实现
 */
export class DefaultCreationStore implements CreationStore {
  private readonly storageDir: string;
  private readonly evolverStatePath: string;
  private readonly plansDir: string;
  private readonly resultsDir: string;

  /**
   * 创建 Creation Store
   */
  constructor(config: CreationStoreConfig = {}) {
    this.storageDir = config.storageDir ?? DEFAULT_STORAGE_DIR;
    this.evolverStatePath = config.evolverStatePath ?? path.join(this.storageDir, 'evolver-state.json');
    this.plansDir = config.plansDir ?? path.join(this.storageDir, 'plans');
    this.resultsDir = config.resultsDir ?? path.join(this.storageDir, 'results');

    log.info('CreationStore:init', { storageDir: this.storageDir });
  }

  private getFile(name: keyof typeof FILES): string {
    return path.join(this.storageDir, FILES[name]);
  }

  // ── 经验 ──────────────────────────────────────────────

  async recordExperience(e: Omit<Experience, 'id'>): Promise<Experience> {
    const experience: Experience = {
      ...e,
      id: Identifier.ascending('experience'),
    };

    const file = this.getFile('experience');
    await appendFile(file, JSON.stringify(experience));

    log.debug('CreationStore:recordExperience', { id: experience.id, type: experience.type });
    return experience;
  }

  async queryExperiences(q: ExperienceQuery): Promise<Experience[]> {
    const file = this.getFile('experience');
    const all = await readJsonl<Experience>(file);

    const filtered = all.filter((e) => {
      if (q.type && e.type !== q.type) return false;
      if (q.actionKind && e.action.kind !== q.actionKind) return false;
      if (q.refId && e.action.refId !== q.refId) return false;
      if (q.sessionId && e.context.sessionId !== q.sessionId) return false;
      if (q.sinceMs && new Date(e.createdAt).getTime() < q.sinceMs) return false;
      return true;
    });

    // 按时间倒序
    filtered.sort((a, b) => compareIsoDesc(a.createdAt, b.createdAt));

    return q.limit ? filtered.slice(0, q.limit) : filtered;
  }

  async countExperiences(): Promise<number> {
    const file = this.getFile('experience');
    const all = await readJsonl<Experience>(file);
    return all.length;
  }

  // ── 模式 ──────────────────────────────────────────────

  async upsertPattern(p: Omit<Pattern, 'id'> & { id?: string }): Promise<Pattern> {
    const pattern: Pattern = {
      ...p,
      id: p.id ?? Identifier.ascending('pattern'),
    };

    const file = this.getFile('pattern');
    await upsertJsonl(file, pattern);

    log.debug('CreationStore:upsertPattern', { id: pattern.id, type: pattern.type });
    return pattern;
  }

  async getPattern(id: string): Promise<Pattern | null> {
    const file = this.getFile('pattern');
    const all = await readJsonl<Pattern>(file, (p) => p.id === id);
    return all[0] ?? null;
  }

  async listPatterns(filter?: { type?: Pattern['type']; minConfidence?: number }): Promise<Pattern[]> {
    const file = this.getFile('pattern');
    const all = await readJsonl<Pattern>(file);

    const minConf = filter?.minConfidence ?? 0;
    const filtered = all.filter((p) => {
      if (filter?.type && p.type !== filter.type) return false;
      if (p.confidence < minConf) return false;
      return true;
    });
    // 按 confidence 降序排序（修复 2026-07-21 测试期望）
    filtered.sort((a, b) => b.confidence - a.confidence);
    return filtered;
  }

  async deletePattern(id: string): Promise<boolean> {
    const file = this.getFile('pattern');
    const all = await readJsonl<Pattern>(file);
    const filtered = all.filter((p) => p.id !== id);

    if (filtered.length === all.length) return false;

    const content = filtered.map((p) => JSON.stringify(p)).join('\n') + '\n';
    await writeJson(file, content);
    return true;
  }

  // ── 知识 ──────────────────────────────────────────────

  async upsertKnowledge(k: Omit<Knowledge, 'id'> & { id?: string }): Promise<Knowledge> {
    const knowledge: Knowledge = {
      ...k,
      id: k.id ?? Identifier.ascending('knowledge'),
    };

    const file = this.getFile('knowledge');
    await upsertJsonl(file, knowledge);

    log.debug('CreationStore:upsertKnowledge', { id: knowledge.id, kind: knowledge.kind });
    return knowledge;
  }

  async getKnowledge(id: string): Promise<Knowledge | null> {
    const file = this.getFile('knowledge');
    const all = await readJsonl<Knowledge>(file, (k) => k.id === id);
    return all[0] ?? null;
  }

  async searchKnowledge(text: string, limit = 10): Promise<Knowledge[]> {
    const file = this.getFile('knowledge');
    const all = await readJsonl<Knowledge>(file);
    const lower = text.toLowerCase();

    const matched = all.filter((k) => k.content.toLowerCase().includes(lower) || k.applicability.some((a) => a.toLowerCase().includes(lower)));

    return matched.slice(0, limit);
  }

  async deleteKnowledge(id: string): Promise<boolean> {
    const file = this.getFile('knowledge');
    const all = await readJsonl<Knowledge>(file);
    const filtered = all.filter((k) => k.id !== id);

    if (filtered.length === all.length) return false;

    const content = filtered.map((k) => JSON.stringify(k)).join('\n') + '\n';
    await writeJson(file, content);
    return true;
  }

  // ── 进化计划 ──────────────────────────────────────────

  async savePlan(plan: EvolutionPlan): Promise<void> {
    const filePath = path.join(this.plansDir, `${plan.id}.json`);
    await writeJson(filePath, plan);
    log.debug('CreationStore:savePlan', { id: plan.id, priority: plan.priority });
  }

  async getPlan(id: string): Promise<EvolutionPlan | null> {
    const filePath = path.join(this.plansDir, `${id}.json`);
    return readJson<EvolutionPlan>(filePath);
  }

  async listPlans(): Promise<EvolutionPlan[]> {
    try {
      const files = await fs.readdir(this.plansDir);
      const plans: EvolutionPlan[] = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const filePath = path.join(this.plansDir, file);
        const plan = await readJson<EvolutionPlan>(filePath);
        if (plan) plans.push(plan);
      }

      // 按生成时间倒序
      plans.sort((a, b) => compareIsoDesc(a.generatedAt, b.generatedAt));
      return plans;
    } catch {
      return [];
    }
  }

  async deletePlan(id: string): Promise<boolean> {
    const filePath = path.join(this.plansDir, `${id}.json`);
    try {
      await fs.unlink(filePath);
      return true;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return false;
      throw e;
    }
  }

  // ── 进化结果 ──────────────────────────────────────────

  async saveResult(result: EvolutionResult): Promise<void> {
    const filePath = path.join(this.resultsDir, `${result.id}.json`);
    await writeJson(filePath, result);
    log.debug('CreationStore:saveResult', { id: result.id, status: result.status });
  }

  async getResult(id: string): Promise<EvolutionResult | null> {
    const filePath = path.join(this.resultsDir, `${id}.json`);
    return readJson<EvolutionResult>(filePath);
  }

  async listResults(limit = 50): Promise<EvolutionResult[]> {
    try {
      const files = await fs.readdir(this.resultsDir);
      const results: EvolutionResult[] = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const filePath = path.join(this.resultsDir, file);
        const result = await readJson<EvolutionResult>(filePath);
        if (result) results.push(result);
      }

      // 按完成时间倒序
      results.sort((a, b) => compareIsoDesc(a.completedAt, b.completedAt));
      return results.slice(0, limit);
    } catch {
      return [];
    }
  }

  // ── 进化器状态 ────────────────────────────────────────

  async loadQuota(): Promise<EvolverQuota> {
    const data = await readJson<Partial<EvolverQuota>>(this.evolverStatePath);
    const today = new Date().toISOString().slice(0, 10);

    // 日期切换时重置计数
    if (data?.today !== today) {
      return {
        today,
        todayCount: 0,
        consecutiveRollbacks: 0,
      };
    }

    return {
      today: data?.today ?? today,
      todayCount: data?.todayCount ?? 0,
      consecutiveRollbacks: data?.consecutiveRollbacks ?? 0,
      lastRollbackAt: data?.lastRollbackAt,
      cooldownUntil: data?.cooldownUntil,
    };
  }

  async saveQuota(quota: EvolverQuota): Promise<void> {
    await writeJson(this.evolverStatePath, quota);
    log.debug('CreationStore:saveQuota', { today: quota.today, count: quota.todayCount });
  }

  // ── 统计 ──────────────────────────────────────────────

  async getStats(): Promise<CreationStoreStats> {
    const [experienceCount, patternCount, knowledgeCount, plans, results] = await Promise.all([
      this.countExperiences(),
      this.listPatterns().then((p) => p.length),
      this.listPatterns().then((k) => k.length),
      this.listPlans().then((p) => p.length),
      this.listResults().then((r) => r.length),
    ]);

    return {
      experienceCount,
      patternCount,
      knowledgeCount,
      planCount: plans,
      resultCount: results,
    };
  }

  async close(): Promise<void> {
    log.info('CreationStore:close');
    // no-op: 无待关闭资源
  }
}

// ── 工厂函数 ────────────────────────────────────────────

let _storeInstance: CreationStore | undefined;

/**
 * 获取 Creation Store 单例
 */
export function getCreationStore(config?: CreationStoreConfig): CreationStore {
  if (!_storeInstance) {
    _storeInstance = new DefaultCreationStore(config);
  }
  return _storeInstance;
}

/**
 * 重置 Store 单例（用于测试）
 */
export function resetCreationStore(): void {
  _storeInstance = undefined;
}
