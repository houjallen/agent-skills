import { defineConfig } from 'vitest/config';
import { join } from 'node:path';

/**
 * Vitest 配置：同时识别 `__tests__/` 与历史的 `tests/` 目录下的单测文件，
 * 确保项目里全部测试用例都能被发现并执行。
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'tests/**/*.test.{ts,tsx}',
      'src/**/__tests__/**/*.test.{ts,tsx}', // 支持模块内 __tests__ 目录
    ],
    // 排除 fixture / 反例目录（点开头隐藏目录常用于 vitest grep/include 自身的 fixture test）
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    reporters: ['verbose'],
    // 单线程串行（默认 'forks')
    pool: 'threads',
    // 默认 30 秒；重测试文件单独 override 到 60s
    testTimeout: 30000,
    // hookTimeout 默认 10s 偏紧（git.test.ts beforeEach 12s+），放宽到 60s
    hookTimeout: 60000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'tests/', '__tests__/', 'types/', '*.config.ts', 'src/index.ts'],
      include: ['skills/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      '@': join(import.meta.dirname, 'src'),
    },
  },
  assetsInclude: [],
  optimizeDeps: {
    exclude: [],
  },
});
