/**
 * Instance 实例模块
 *
 * 负责管理当前工作目录 / 工作树路径，以及按目录维度的 state 缓存。
 * 不实现 sandbox / project 探测（CLI 场景用 process.cwd()，
 * host 加载时通过 init() 注入真实路径与初始化钩子）。
 */
import process from 'node:process';
import { Log } from '@easbot/utils';
import { State } from './state';

/** 模块级路径（host 可通过 init() 注入覆盖） */
let _directory = process.cwd();
let _worktree = process.cwd();

/** 实例缓存：directory -> 初始化 Promise（去重并发 init） */
const _initCache = new Map<string, Promise<void>>();

/**
 * Instance 实例对象
 */
export const Instance = {
  /**
   * 初始化当前 directory 与可选的 init 钩子。
   *
   * - 设置 `directory`（同步生效）
   * - `worktree` 默认与 `directory` 相同，可由 initFn 内修改
   * - `initFn` 同步执行；异步场景请在 initFn 内自行 await
   * - 同一 directory 的 init 是幂等的（并发 init 复用同一 Promise）
   *
   * @param directory - 工作目录
   * @param initFn - 可选的初始化钩子（可在此设置 worktree / 触发其他副作用）
   */
  init(directory: string, initFn?: () => void | Promise<void>): Promise<void> {
    const existing = _initCache.get(directory);
    if (existing) return existing;
    const promise = (async () => {
      _directory = directory;
      _worktree = directory;
      Log.Default.info('instance:initialized', { directory });
      await initFn?.();
    })();
    _initCache.set(directory, promise);
    return promise;
  },

  /**
   * 当前工作目录（默认 process.cwd()，host 可通过 init() 覆盖）
   */
  get directory(): string {
    return _directory;
  },
  set directory(value: string) {
    Log.Default.info('instance:directory updated', { from: _directory, to: value });
    _directory = value;
  },

  /**
   * 当前工作树根目录（默认与 directory 相同，可在 init() 内修改）
   */
  get worktree(): string {
    return _worktree;
  },
  set worktree(value: string) {
    _worktree = value;
  },

  /**
   * 按目录缓存 lazy state
   *
   * @param init - 状态初始化函数
   * @param dispose - 可选的状态清理函数
   * @returns 状态访问函数
   */
  state<S>(init: () => S, dispose?: (state: Awaited<S>) => Promise<void>): () => S {
    return State.create(() => Instance.directory, init, dispose);
  },

  /**
   * 释放当前 directory 的所有 state
   *
   * 触发每个 state 注册的 dispose 回调，清理缓存。
   * 通常在 namespace 释放 / 进程退出前调用。
   */
  async dispose(): Promise<void> {
    Log.Default.info('instance:disposing', { directory: _directory });
    await State.dispose(_directory);
    _initCache.delete(_directory);
  },
};
