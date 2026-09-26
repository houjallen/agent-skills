/**
 * tests/test-utils.ts
 * eas-agent-creation CLI e2e 测试工具
 *
 * 设计：参考 `@easbot/memory` 的 test-utils.ts，但 CLI 参数对齐本技能:
 *   - `create / evolve / assess / list / apply-plan / review` 6 个 op
 *   - 全局 flag: --cwd / --log-level / --print-logs / --debug
 *   - 三种调用风格(详见 references/cli.md):
 *       * --args '<json>'
 *       * <op> --key value  (友好 CLI)
 *       * --op <op> --key value (显式 op)
 *
 * 隔离：
 *   - tests/xdg-bootstrap.ts(vitest setupFiles)统一注入 XDG_*_HOME 到 tmpdir
 *   - 每个 test 自己造 worktree(tmpdir)，--cwd 全局选项把 CLI 限定到自己的目录
 *   - 父 vitest 进程的 env 通过 process.env inherit 给子进程
 */

import { spawnSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stripAnsi } from '@easbot/terminal';

// CLI 入口: 优先 dist/cli.mjs (build 后的 ESM, 启动 1-3s)
// 找不到 dist 时回退 src/cli.ts (tsx, 启动 30-60s, 仅本地开发态)
const DIST_CLI_PATH = join(import.meta.dirname, '..', 'dist', 'cli.mjs');
const SRC_CLI_PATH = join(import.meta.dirname, 'cli.ts');
const CLI_PATH = existsSync(DIST_CLI_PATH) ? DIST_CLI_PATH : SRC_CLI_PATH;

/**
 * 透传父 vitest 进程的 XDG 路径（xdg-bootstrap.ts 已注入）。
 * 子进程通过 process.env inherit，天然拿同一 storageDir。
 */
export function makeIsolatedXdgEnv(): Record<string, string> {
  return {
    XDG_DATA_HOME: process.env.XDG_DATA_HOME ?? join(tmpdir(), 'eas-agent-creation-fallback-data'),
    XDG_CACHE_HOME: process.env.XDG_CACHE_HOME ?? join(tmpdir(), 'eas-agent-creation-fallback-cache'),
    XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME ?? join(tmpdir(), 'eas-agent-creation-fallback-config'),
  };
}

/**
 * 通过子进程执行 CLI 入口，捕获 stdout/stderr/退出码。
 *
 * **重要**：本测试在 Windows + PowerShell 下运行，**不能用 execSync + shell:true**
 * （PowerShell 会把 `--cwd <path>` 误识别为 node.exe 的 flag 导致 `bad option: --cwd`）。
 * 这里用 `spawnSync` 直接传 argv 数组，绕开 shell 解析。
 *
 * 测试期间强制 EASBOT_LANG=en-US，避免本地 shell 中文 locale 影响快照。
 *
 * @param args 命令行参数（如 `['create', '--requirement', '...', '--cwd', '/tmp/wt']`）
 * @param cwd 子进程工作目录
 * @param env 追加到子进程的环境变量
 * @param timeout 毫秒超时（默认 60s）
 */
export function runCli(args: string[], cwd?: string, env?: Record<string, string>, timeout?: number): { stdout: string; stderr: string; exitCode: number } {
  const sanitizedEnv: Record<string, string | undefined> = {
    ...process.env,
    ...makeIsolatedXdgEnv(),
    EASBOT_LANG: 'en-US',
    ...env,
  };
  try {
    const r = spawnSync(process.execPath, [CLI_PATH, ...args], {
      encoding: 'utf-8',
      cwd,
      env: sanitizedEnv,
      timeout: timeout ?? 60000,
    });
    if (r.error) throw r.error;
    if (r.signal) {
      throw new Error(`CLI killed by signal ${r.signal}`);
    }
    return {
      stdout: stripAnsi(r.stdout ?? ''),
      stderr: stripAnsi(r.stderr ?? ''),
      exitCode: r.status ?? 1,
    };
  } catch (error: unknown) {
    // spawnSync 超时 / spawn error 都进这里
    const e = error as { stdout?: string; stderr?: string; status?: number; message?: string };
    return {
      stdout: stripAnsi(e.stdout || ''),
      stderr: stripAnsi(e.stderr || e.message || ''),
      exitCode: e.status || 1,
    };
  }
}

/** 简化输出（stdout 优先，回退 stderr） */
export function runCliOutput(args: string[], cwd?: string): string {
  const r = runCli(args, cwd);
  return r.stdout || r.stderr;
}

/** stdin 注入（用于 review 等可能走 stdin 的命令） */
export function runCliWithInput(args: string[], input: string, cwd?: string, env?: Record<string, string>): { stdout: string; stderr: string; exitCode: number } {
  const sanitizedEnv: Record<string, string | undefined> = {
    ...process.env,
    ...makeIsolatedXdgEnv(),
    EASBOT_LANG: 'en-US',
    ...env,
  };
  try {
    const r = spawnSync(process.execPath, [CLI_PATH, ...args], {
      encoding: 'utf-8',
      cwd,
      env: sanitizedEnv,
      input: input + '\n',
      timeout: 60000,
    });
    if (r.error) throw r.error;
    if (r.signal) {
      throw new Error(`CLI killed by signal ${r.signal}`);
    }
    return {
      stdout: stripAnsi(r.stdout ?? ''),
      stderr: stripAnsi(r.stderr ?? ''),
      exitCode: r.status ?? 1,
    };
  } catch (error: unknown) {
    const e = error as { stdout?: string; stderr?: string; status?: number; message?: string };
    return {
      stdout: stripAnsi(e.stdout || ''),
      stderr: stripAnsi(e.stderr || e.message || ''),
      exitCode: e.status || 1,
    };
  }
}

/**
 * 构造 shell 调用。
 * 直接 `node` 跑 dist/cli.mjs，ESM 原生支持，无需 tsx / npx。
 *
 * 注：本函数保留为兼容性导出，但 runCli / runCliWithInput 内部已不再调用它
 * （PowerShell 下 `--cwd` 会被 shell 误识别为 node.exe flag，所以走 spawnSync）。
 */
function buildNodeInvocation(args: string[]): string {
  return `node "${CLI_PATH}" ${args.join(' ')}`;
}

// 显式 re-export spawn 以满足上层 import（兼容未来需求）
export { spawn };
