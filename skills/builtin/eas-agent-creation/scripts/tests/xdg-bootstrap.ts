/**
 * Vitest XDG bootstrap file
 *
 * 参考 skills 包的实现：https://github.com/houjallen/easbot/blob/main/packages/skills/tests/xdg-bootstrap.ts
 *
 * 重定向 XDG_*_HOME 到临时目录，避免测试污染用户 home 目录。
 * 必须在任何对 xdg-basedir / better-sqlite3 db path 的 import 之前注入环境变量。
 */
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// 用 pid + 启动时间戳保证每个 vitest worker 进程独立目录
const testRoot = join(tmpdir(), `eas-agent-creation-test-xdg-${process.pid}-${Date.now()}`);

if (!process.env.XDG_CONFIG_HOME) {
  process.env.XDG_CONFIG_HOME = join(testRoot, 'config');
}
if (!process.env.XDG_DATA_HOME) {
  process.env.XDG_DATA_HOME = join(testRoot, 'data');
}
if (!process.env.XDG_CACHE_HOME) {
  process.env.XDG_CACHE_HOME = join(testRoot, 'cache');
}
