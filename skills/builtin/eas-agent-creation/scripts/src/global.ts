import { writeFile, readdir, rm, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { xdgData, xdgCache, xdgConfig, xdgState } from 'xdg-basedir';
import os from 'node:os';
import { Filesystem } from '@easbot/utils';

/** 应用名称 */
const app = 'easbot';

/** XDG 数据目录 - 统一转换为标准化路径 */
const data = Filesystem.normalize(path.join(xdgData!, app));

/** XDG 缓存目录 - 统一转换为标准化路径 */
const cache = Filesystem.normalize(path.join(xdgCache!, app));

/** XDG 配置目录 - 统一转换为标准化路径 */
const config = Filesystem.normalize(path.join(xdgConfig!, app));

/** XDG 状态目录 - 统一转换为标准化路径 */
const state = Filesystem.normalize(path.join(xdgState!, app));

/**
 * Global 命名空间
 *
 * 管理应用的全局路径、版本信息和初始化流程。
 * 提供统一的目录访问接口和版本管理功能。
 */
export namespace Global {
  /**
   * 全局路径配置
   *
   * 遵循 XDG Base Directory 规范，提供跨平台的目录访问。
   * 所有路径都通过 Filesystem.normalize() 统一处理，转换为带盘符的 Unix 风格路径。
   */
  export const Path = {
    /**
     * 用户主目录
     *
     * 支持通过 EASBOT_TEST_HOME 环境变量覆盖，用于测试隔离。
     *
     * @returns 用户主目录路径
     *
     * @example
     * ```typescript
     * const home = Global.Path.home;
     * // 正常情况: /home/username
     * // 测试情况: process.env.EASBOT_TEST_HOME
     * ```
     */
    get home() {
      return Filesystem.normalize(process.env.EASBOT_TEST_HOME || os.homedir());
    },

    /** 数据目录 - ~/.local/share/easbot */
    data,

    /** 可执行文件目录 - ~/.local/share/easbot/bin */
    bin: Filesystem.normalize(path.join(data, 'bin')),

    /** 日志目录 - ~/.local/share/easbot/log */
    log: Filesystem.normalize(path.join(data, 'log')),

    /** 缓存目录 - ~/.cache/easbot */
    cache,

    /** 配置目录 - ~/.config/easbot */
    config,

    /** 状态目录 - ~/.local/state/easbot */
    state,
  };

  /**
   * 获取包含 Global.Path.bin 的 PATH 环境变量
   *
   * 用于在 spawn 子进程时确保能找到安装的 LSP 服务器等工具。
   * 格式: 原有 PATH + 分隔符 + Global.Path.bin
   *
   * @returns 扩展后的 PATH 环境变量值
   */
  export function getPathWithBin(): string {
    const currentPath = process.env.PATH || process.env.Path || '';
    return currentPath + path.delimiter + Path.bin;
  }

  /** 初始化标志，确保只初始化一次 */
  let initialized = false;

  /** 初始化 Promise，用于防止重复初始化 */
  let initPromise: Promise<void> | null = null;

  /**
   * 初始化全局目录和缓存
   *
   * 执行以下操作：
   * 1. 加载版本号（从环境变量或 package.json）
   * 2. 创建所有必需的目录（data、config、state、log、bin、cache）
   * 3. 处理缓存版本（清理旧版本缓存）
   *
   * 此函数会在第一次调用时执行初始化，后续调用会返回同一个 Promise。
   * 确保初始化只执行一次，避免重复创建目录和清理缓存。
   *
   * @returns Promise，初始化完成后 resolve
   *
   * @example
   * ```typescript
   * // 在应用启动时调用
   * await Global.init();
   *
   * // 后续调用会立即返回
   * await Global.init(); // 不会重复执行
   * ```
   */
  export async function init(): Promise<void> {
    if (initialized) {
      return;
    }

    if (initPromise) {
      return initPromise;
    }

    initPromise = (async () => {
      // 创建所有必需的目录并设置环境变量
      await Promise.all([
        mkdir(Global.Path.data, { recursive: true }),
        mkdir(Global.Path.config, { recursive: true }),
        mkdir(Global.Path.state, { recursive: true }),
        mkdir(Global.Path.log, { recursive: true }),
        mkdir(Global.Path.bin, { recursive: true }),
        mkdir(Global.Path.cache, { recursive: true }),
      ]);

      // 设置 PATH 环境变量，包含 Global.Path.bin
      // 这样 PKG.which 等工具能自动找到安装的可执行文件
      const currentPath = process.env.PATH || process.env.Path || '';
      process.env.PATH = currentPath + path.delimiter + Global.Path.bin;

      // 设置其他环境路径变量
      process.env.EASBOT_DATA_PATH = Global.Path.data;
      process.env.EASBOT_CONFIG_PATH = Global.Path.config;
      process.env.EASBOT_STATE_PATH = Global.Path.state;
      process.env.EASBOT_LOG_PATH = Global.Path.log;
      process.env.EASBOT_BIN_PATH = Global.Path.bin;
      process.env.EASBOT_CACHE_PATH = Global.Path.cache;

      // 处理缓存版本
      const CACHE_VERSION = '1';
      const versionFile = path.join(Global.Path.cache, 'version');

      const cachedVersion = await readFile(versionFile, 'utf-8').catch(() => '0');

      if (cachedVersion !== CACHE_VERSION) {
        try {
          const contents = await readdir(Global.Path.cache);
          await Promise.all(
            contents.map((item: string) =>
              rm(path.join(Global.Path.cache, item), {
                recursive: true,
                force: true,
              }),
            ),
          );
        } catch (e: any) {
          // 忽略错误
        }
        await writeFile(versionFile, CACHE_VERSION);
      }

      initialized = true;
    })();

    return initPromise;
  }
}

// 注释掉自动初始化，改为在 CLI 入口显式调用
// Global.init().catch((err) => {
//   console.error('Failed to initialize global directories:', err);
// });
