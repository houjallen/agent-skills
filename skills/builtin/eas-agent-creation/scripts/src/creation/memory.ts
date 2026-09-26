/**
 * packages/agent/src/creation/memory.ts
 * Memory 接口定义与工厂函数
 *
 * 统一 Memory 接口，消除 MemoryBridge 与 Memory 的类型差异
 */

import path from 'node:path';
import os from 'node:os';
import type { Experience, ExperienceQuery, Knowledge, Pattern } from './types';
import { MemoryBridge } from './memory-bridge';

/**
 * Memory 接口
 *
 * 统一的记忆接口，用于 recordExperience、queryExperiences 等操作
 */
export interface Memory {
  /** 初始化（可选） */
  init(): Promise<void>;
  /** 刷新/持久化（可选） */
  flush(): Promise<void>;
  /** 获取存储目录 */
  storageDir(): string;
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

/**
 * 创建 Memory 实例
 *
 * @param dir 存储目录（默认 ~/.easbot/memory-bridge）
 * @returns Memory 接口实例
 */
export function createMemory(dir?: string): Memory {
  const resolved = dir ?? path.join(os.homedir(), '.easbot', 'memory-bridge');
  // 修复（2026-07-21）：把 resolved 同时传给 MemoryBridge 作为 store storageDir + snapshotBaseDir，
  // 让测试 tmpdir 隔离生效（否则 store 写入 user home）
  const bridge = new MemoryBridge(resolved, resolved);

  return {
    /** 初始化：MemoryBridge 无需显式初始化 */
    async init() {
      // no-op: bridge is lazily initialized
    },

    /** 刷新：MemoryBridge 无需显式刷新 */
    async flush() {
      // no-op: bridge has no pending writes to flush
    },

    /** 获取存储目录 */
    storageDir: () => resolved,

    /** 记录经验 */
    recordExperience: (e) => bridge.recordExperience(e),

    /** 查询经验 */
    queryExperiences: (q) => bridge.queryExperiences(q),

    /** 插入或更新模式 */
    upsertPattern: (p) => bridge.upsertPattern(p),

    /** 列出模式 */
    listPatterns: (filter) => bridge.listPatterns(filter),

    /** 插入或更新知识 */
    upsertKnowledge: (k) => bridge.upsertKnowledge(k),

    /** 搜索知识 */
    searchKnowledge: (q) => bridge.searchKnowledge(q),

    /** 创建快照 */
    snapshot: (specId, content) => bridge.snapshot(specId, content),

    /** 获取快照历史 */
    history: (specId) => bridge.history(specId),
  };
}
