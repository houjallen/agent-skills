#!/usr/bin/env node
/**
 * scripts/clean-test-fixtures.mjs
 *
 * 清理 codebase 包测试相关的临时文件 / 目录。
 *
 * 被 `test` / `test:run` 自动前后调用（见 package.json），也可以手动跑：
 *
 *   pnpm --filter ./packages/codebase test:clean
 *
 * ## 为什么用 npm scripts 而非 vitest hooks
 *
 *  - vitest 4 + pool=threads 模式下，每个 worker 是独立 process
 *  - worker 内部 afterEach / afterAll 在 race / 中断场景下**不保证**触发
 *  - 主进程的 `process.on('beforeExit')` 在 vitest force exit 时也**不触发**
 *  - `globalSetup` 在 vitest 4.1.x 实际未执行（已验证：log 无对应输出）
 *
 * npm scripts 的 `&&` 串联由 pnpm 串行调度，最可靠：
 *  - 前置 clean 在 vitest 启动前跑 → 本次运行从干净状态开始
 *  - 后置 clean 在 vitest 退出后跑 → 即便中途 Ctrl+C 也保证清理
 *
 * ## 清理范围（默认）
 *
 *  - src 目录下所有 __tests__ 目录及其子目录里的 .test-* fixture
 *  - tests 目录、examples 目录下递归命中的临时条目
 *  - vitest --outputFile 模式生成的 v*.json 报告
 *
 * 安全保证：只删除 dot-prefix 文件 / 目录（.test-* / .*-tmp-*）+ 已知后缀的临时
 * 文件（v*.json）。绝不碰 setup.ts / test-codebase.test.ts 这类真实源文件。
 *
 * ## 依赖说明
 *
 * 使用 `@easbot/utils.Glob` 扫描（gitignore 严格语义，`*` 不跨 `/`）。
 * `package.json` 的 `test:clean` 脚本前置 `pnpm --filter @easbot/utils build`，
 * 保证 dist 已构建。脚本以 `tsx` 运行时通过 workspace 解析到 utils 的 `dist/index.mjs`。
 */

import { rmSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Glob, Filesystem } from '@easbot/utils';

const here = fileURLToPath(import.meta.url);
const PKG_ROOT = dirname(dirname(here));

/**
 * 顶层扫描根目录（相对 PKG_ROOT）。脚本会以这些根为起点递归扫描匹配项。
 * 不再硬编码 src 下的某个具体 __tests__ 路径，src 下任意位置及其子目录里的 fixture 都能命中。
 */
const SCAN_ROOTS = [join(PKG_ROOT, 'src'), join(PKG_ROOT, 'tests'), join(PKG_ROOT, 'examples'), join(PKG_ROOT, 'skills')];

/**
 * Glob 扫描模式（相对 cwd = SCAN_ROOT）。
 *
 * 只匹配明确的"测试临时文件 / 目录"模式，安全优先：
 *  - dot-prefix 目录：.test-* / .tmp-* / .*-tmp-* / .vitest-*
 *  - 已知临时文件后缀：v*.json（vitest --outputFile 模式报告，规则已下线）
 *
 * 注意：测试源码本身（如 setup.ts、test-codebase.test.ts）不命中任何模式，
 * 不会出现在结果中。
 *
 * 历史说明：早期 vitest --outputFile 模式的 v*.json 报告也在清理列表里，规则如下线；
 * 若未来重新启用，取消注释 GLOB_PATTERNS 末尾对应项 + isTestTempEntry 中的正则即可。
 */
const GLOB_PATTERNS = ['**/.test-*/**', '**/.test-*', '**/.vitest-*/**', '**/.vitest-*', '**/.tmp-*/**', '**/.tmp-*', '**/.*-tmp-*/**', '**/.*-tmp-*', 'vitest-*.json'];

/**
 * 判断路径名是否符合"测试临时文件 / 目录"命名规则（取最后一段 basename）。
 *
 * 规则（保守优先，宁可漏清不可误删）：
 *  - dot-prefix 目录：`.test-*` / `.tmp-*`  / `.*-tmp-*` / `.vitest-*`
 *  - 已知临时文件后缀：`v*.json`（vitest --outputFile 模式报告）
 */
function isTestTempEntry(name: string) {
  // 已知测试 fixture 命名模式
  if (name.startsWith('.test-')) return true; // .test-xxx
  if (name.startsWith('.vitest-')) return true; // vitest reporter 临时
  if (name.startsWith('.tmp')) return true; // .tmp-xxx
  if (name.startsWith('.') && name.includes('-tmp-')) return true; // .foo-tmp-xxx
  // vitest --outputFile 模式的报告：`v1.json` / `v-final.json` / `v_test.json` 等
  if (/^v[a-z0-9_-]*\.json$/i.test(name) && name.length <= 32) return true;
  return false;
}

/**
 * 收集所有"待清理"的顶层 entity 路径。
 *
 * `**` 通配会同时匹配目录和目录内的文件，导致同一个 fixture 目录被多次
 * 命中。这里对结果做一次"取最长祖先路径"压缩：只保留叶子的目录 / 文件，避免重复删除。
 *
 * 例：src/__tests__/.test-foo/a.ts 和 src/__tests__/.test-foo/b.ts
 *   收敛为 src/__tests__/.test-foo（删一次，recursive 即可）
 *
 * 例：tests/.test-x/y.tmp 收敛为 tests/.test-x/y.tmp（删除文件本身）
 */
function collectEntities(matches: string[]): string[] {
  const sorted = [...matches].sort((a, b) => b.length - a.length);
  const kept: string[] = [];
  for (const p of sorted) {
    if (kept.some((k) => p.startsWith(`${k}/`) || p === k)) continue;
    kept.push(p);
  }
  return kept;
}

let totalCleaned = 0;
let totalFailed = 0;
const cleanedByRoot: Record<string, number> = {};

for (const root of SCAN_ROOTS) {
  // Glob.scan 是单 pattern；多 pattern 展开循环收集（保留 fast-glob 数组语义）
  const allRel: string[] = [];
  for (const pattern of GLOB_PATTERNS) {
    try {
      const matches = await Glob.scan(pattern, {
        cwd: root,
        absolute: false,
        include: 'all', // 同时匹配目录与文件（fixture 目录和文件都在清理列表）
        dot: true,
        symlink: false,
        maxDepth: 20,
      });
      for (const rel of matches) {
        allRel.push(Filesystem.toUnixPath(rel));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[clean-test-fixtures] failed to scan ${root} with ${pattern}: ${message}`);
      totalFailed++;
    }
  }

  // 转绝对路径（Glob.scan 返回 POSIX 相对路径）
  const matches = Array.from(new Set(allRel)).map((rel) => Filesystem.join(root, rel));

  const entities = collectEntities(matches);

  let rootCleaned = 0;
  for (const fullPath of entities) {
    // 双保险：basename 必须命中临时命名规则（防止 glob 模式未来被误改）
    const basename = fullPath.split(/[/\\]/).pop() ?? '';
    if (!isTestTempEntry(basename)) continue;
    try {
      const stat = statSync(fullPath);
      rmSync(fullPath, { recursive: stat.isDirectory(), force: true });
      rootCleaned++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[clean-test-fixtures] failed to remove ${fullPath}: ${message}`);
      totalFailed++;
    }
  }

  if (rootCleaned > 0) {
    cleanedByRoot[relative(PKG_ROOT, root)] = rootCleaned;
    totalCleaned += rootCleaned;
  }
}

if (totalCleaned > 0) {
  console.log(`[clean-test-fixtures] cleaned up ${totalCleaned} leftover entries:`);
  for (const [root, n] of Object.entries(cleanedByRoot)) {
    console.log(`  - ${root} (${n})`);
  }
}

if (totalFailed > 0) {
  process.exit(1);
}
