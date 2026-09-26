/**
 * packages/agent/src/creation/memory-bridge.ts
 * 记忆桥接器：基于 CreationStore 的 Memory 实现
 *
 * 委托给 store.ts 统一存储：
 * - Experience → store.recordExperience
 * - Pattern → store.upsertPattern / listPatterns
 * - Knowledge → store.upsertKnowledge / searchKnowledge
 * - 快照 → 本地 snapshots 目录
 *
 * 不做的事：
 * - 不引入向量搜索（简单子串匹配）
 * - 不做关系图
 * - 不做版本号乐观锁
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import { Log } from '@easbot/utils';
import { getCreationStore, DefaultCreationStore, DEFAULT_STORAGE_DIR, type CreationStore } from './store';
import type { Experience, ExperienceQuery, Knowledge, Pattern } from './types';

/** 记忆桥接器日志 */
const log = Log.create({ service: 'creation.memory-bridge' });

/** 快照存储根目录 */
const SNAPSHOT_DIR = 'snapshots';

/**
 * Memory 接口（v0.1 §4.2）
 *
 * 统一的记忆接口，供 Assessor/Evolution 使用
 */
export interface Memory {
  /** 记录经验 */
  recordExperience(e: Experience): Promise<void>;
  /** 查询经验 */
  queryExperiences(q: ExperienceQuery): Promise<Experience[]>;
  /** 插入或更新模式 */
  upsertPattern(p: Pattern): Promise<void>;
  /** 列出模式 */
  listPatterns(filter?: { type?: Pattern['type']; minConfidence?: number }): Promise<Pattern[]>;
  /** 插入或更新知识 */
  upsertKnowledge(k: Knowledge): Promise<void>;
  /** 搜索知识 */
  searchKnowledge(q: { text: string; limit?: number }): Promise<Knowledge[]>;
  /** 创建快照（用于回滚） */
  snapshot(specId: string, content: string): Promise<void>;
  /** 获取快照历史 */
  history(specId: string): Promise<Array<{ version: string; content: string; at: string }>>;
}

// ── 实现 ───────────────────────────────────────────────

/**
 * MemoryBridge：基于 CreationStore 的 Memory 实现
 *
 * 特点：
 * - 委托给 CreationStore 统一存储
 * - 快照独立管理（不属于 store 职责）
 */
export class MemoryBridge implements Memory {
  private readonly store: CreationStore;
  private readonly snapshotBaseDir: string;

  /**
   * 创建 MemoryBridge
   * @param snapshotBaseDir 快照存储根目录（默认使用 {data}/creation/snapshots）
   * @param storageDir CreationStore 存储根目录（默认使用全局 singleton）
   */
  constructor(snapshotBaseDir?: string, storageDir?: string) {
    // 修复（2026-07-21）：让 MemoryBridge 可指定 store 路径，
    // 否则测试用 tmpDir 创建独立 MemoryBridge 时，
    // store 仍用全局 singleton 写入 user home 导致测试失败。
    this.store = storageDir ? new DefaultCreationStore({ storageDir }) : getCreationStore();
    // 修复（2026-07-21）：测试用 tmpDir 时 snapshot 写到 tmpDir/snapshots/...
    // 业务默认时写到 {DEFAULT_STORAGE_DIR}/snapshots/...
    this.snapshotBaseDir = snapshotBaseDir ? path.join(snapshotBaseDir, SNAPSHOT_DIR) : path.join(DEFAULT_STORAGE_DIR, SNAPSHOT_DIR);
  }

  /**
   * 初始化（懒加载，无需显式初始化）
   */
  async init(): Promise<void> {
    // no-op: store 懒加载
  }

  /**
   * 刷新（无待刷新的缓冲）
   */
  async flush(): Promise<void> {
    // no-op: 写操作已直接落盘
  }

  /**
   * 获取存储目录
   */
  getStorageDir(): string {
    return this.snapshotBaseDir;
  }

  // ── Experience ─────────────────────────────────────────

  /**
   * 记录经验
   */
  async recordExperience(e: Experience): Promise<void> {
    await this.store.recordExperience(e);
    log.debug('recordExperience:done', { id: e.id, type: e.type });
  }

  /**
   * 查询经验
   */
  async queryExperiences(q: ExperienceQuery): Promise<Experience[]> {
    return this.store.queryExperiences(q);
  }

  // ── Pattern ───────────────────────────────────────────

  /**
   * 插入或更新模式
   */
  async upsertPattern(p: Pattern): Promise<void> {
    await this.store.upsertPattern(p);
    log.debug('upsertPattern:done', { id: p.id, type: p.type });
  }

  /**
   * 列出模式
   */
  async listPatterns(filter?: { type?: Pattern['type']; minConfidence?: number }): Promise<Pattern[]> {
    return this.store.listPatterns(filter);
  }

  // ── Knowledge ─────────────────────────────────────────

  /**
   * 插入或更新知识
   */
  async upsertKnowledge(k: Knowledge): Promise<void> {
    await this.store.upsertKnowledge(k);
    log.debug('upsertKnowledge:done', { id: k.id, kind: k.kind });
  }

  /**
   * 搜索知识
   */
  async searchKnowledge(q: { text: string; limit?: number }): Promise<Knowledge[]> {
    return this.store.searchKnowledge(q.text, q.limit);
  }

  // ── 快照 ──────────────────────────────────────────────

  /**
   * 创建快照（用于回滚）
   */
  async snapshot(specId: string, content: string): Promise<void> {
    const specDir = path.join(this.snapshotBaseDir, specId);
    const version = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(specDir, `${version}.json`);

    await fs.mkdir(specDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify({ version, content, at: new Date().toISOString() }, null, 2), 'utf-8');

    log.debug('snapshot:done', { specId, version });
  }

  /**
   * 获取快照历史
   */
  async history(specId: string): Promise<Array<{ version: string; content: string; at: string }>> {
    const specDir = path.join(this.snapshotBaseDir, specId);

    try {
      const files = await fs.readdir(specDir);
      const snapshots: Array<{ version: string; content: string; at: string }> = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const filePath = path.join(specDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content) as { version: string; content: string; at: string };
        snapshots.push(data);
      }

      // 按时间倒序
      // P2-10：用 getTime() 比较，兼容任意能被 Date 解析的字符串
      snapshots.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      return snapshots;
    } catch {
      return [];
    }
  }
}

// ── 工厂函数（兼容旧代码）────────────────────────────────

/**
 * 创建 MemoryBridge 实例（兼容旧 API）
 *
 * @param dir 存储目录（已废弃，忽略）
 * @returns MemoryBridge 实例
 * @deprecated 使用 CreationStore 替代
 */
export function createMemoryBridge(dir?: string): MemoryBridge {
  // 修复（2026-07-21）：让 createMemoryBridge 接受 dir 参数，
  // 测试用 tmpDir 隔离生效
  return new MemoryBridge(dir, dir);
}
