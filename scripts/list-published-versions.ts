#!/usr/bin/env tsx
/**
 * 查询根目录与所有子项目 package.json 在 npm 上的最新发布版本号
 *
 * 功能说明：
 * - 遍历根目录、skills / packages 子目录下所有 package.json
 * - 通过 npm view 获取每个包在 npm 上的 dist-tags.latest（即最新版本号）
 * - 与本地 package.json 的 version 比对，标注是否已发布到 npm
 * - 与 `bump-version.ts` 使用同一套 workspace 包发现规则（Glob.scanSync）
 *
 * 使用方法：
 *   pnpm publish:list            # 人类可读表格输出
 *   pnpm publish:list:json       # JSON 输出到 stdout
 *   pnpm publish:list:saved      # 将 JSON 写入 publish-status.json
 *
 * 命令行参数：
 *   --json                 输出 JSON（默认人类可读）
 *   --output, -o <path>    将 JSON 结果写入文件
 *   --include-root         包含根 package.json（默认；与 bump-version.ts 行为一致）
 *   --no-include-root      不包含根 package.json
 *   --registry <url>       指定 npm registry（默认 https://registry.npmjs.org）
 *   --help, -h             显示帮助
 *
 * 设计原则：
 * - 复用项目自带的 Shell.run() 跨平台调用 npm
 * - 复用项目自带的 Semver.compare() 做版本比较（处理预发布边界）
 * - 不引入任何额外依赖
 * - 严格遵循 biome 风格（2 空格、单引号、分号、trailing commas）
 */

/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { Glob, Shell, Semver } from '@easbot/utils';

/** 单个 package 的最新发布版本状态 */
interface PackageLatestStatus {
  /** 包名 */
  name: string;
  /** package.json 相对路径 */
  path: string;
  /** 本地 package.json 的 version */
  localVersion: string;
  /** npm 上 dist-tags.latest 的版本号（若无则 null） */
  latest: string | null;
  /** 本地版本是否已发布（localVersion === latest） */
  publishedLocally: boolean;
  /** 获取信息失败时的错误信息（若有） */
  error?: string;
}

/** CLI 选项 */
interface CliOptions {
  json: boolean;
  output: string | undefined;
  includeRoot: boolean;
  registry: string;
}

/**
 * 解析命令行参数
 */
function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    json: false,
    output: undefined,
    // 默认包含根目录的 package.json：与 bump-version.ts 的行为保持一致
    // （bump-version 默认也会更新根目录的 version），用户可通过 --no-include-root 关闭。
    includeRoot: true,
    registry: 'https://registry.npmjs.org',
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--json') {
      opts.json = true;
    } else if (arg === '--include-root') {
      opts.includeRoot = true;
    } else if (arg === '--no-include-root') {
      opts.includeRoot = false;
    } else if (arg === '--output' || arg === '-o') {
      opts.output = argv[++i];
      if (!opts.output) throw new Error('--output 需要一个文件路径参数');
    } else if (arg === '--registry') {
      const val = argv[++i];
      if (!val) throw new Error('--registry 需要一个 URL 参数');
      opts.registry = val;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`未知参数: ${arg}`);
    }
  }

  return opts;
}

function printHelp(): void {
  console.log(`list-published-versions.ts

查询根目录与所有子项目 package.json 在 npm 上的最新发布版本号。

用法:
  tsx scripts/list-published-versions.ts [选项]

选项:
  --json                 输出 JSON 格式（默认人类可读表格）
  --output, -o <path>    将结果写入文件（搭配 --json 使用）
  --include-root         包含根 package.json（默认；与 bump-version.ts 行为一致）
  --no-include-root      不包含根 package.json
  --registry <url>       指定 npm registry（默认 https://registry.npmjs.org）
  --help, -h             显示帮助

示例:
  tsx scripts/list-published-versions.ts
  tsx scripts/list-published-versions.ts --json --output publish-status.json
  tsx scripts/list-published-versions.ts --no-include-root
`);
}

/**
 * 读取 JSON 文件（同步）
 */
function readJson<T>(filePath: string): T {
  const text = readFileSync(filePath, 'utf-8');
  return JSON.parse(text) as T;
}

/**
 * 收集所有 package.json 路径（根目录 + skills / packages 子目录）
 *
 * 使用 `@easbot/utils.Glob.scanSync` 递归扫描，支持任意嵌套深度的 workspace 包。
 * 与 `bump-version.ts` 中的 `getAllPackageJsonPaths()` 保持完全一致：相同的
 * pattern 集合、相同的 ignore 规则、相同的稳定排序，方便两份脚本对
 * 「哪些包算 workspace 包」达成同一个事实。
 *
 * 排除规则:
 *   - node_modules
 *   - dist（构建产物，不会作为 workspace 包发布）
 *   - .git
 *
 * 用 `scanSync` 保持原脚本的同步执行语义；`include: 'file'` 保证只命中文件
 * （不会误匹配 `skills/xxx/dist/package.json` 之类的目录）。
 */
function collectPackageJsonPaths(includeRoot: boolean): string[] {
  const cwd = process.cwd();
  const patterns = [
    'package.json', // 根目录
    'skills/**/package.json', // 任意深度的子包
    'packages/**/package.json', // 兜底：兼容旧版 packages/ 布局
  ];
  const ignore = ['**/node_modules/**', '**/dist/**', '**/.git/**'];

  // Glob.scanSync 是单 pattern；多 pattern 展开循环收集（与 bump-version.ts 一致）
  const allMatches: string[] = [];
  for (const pattern of patterns) {
    allMatches.push(
      ...Glob.scanSync(pattern, {
        cwd,
        ignore,
        absolute: false,
        include: 'file',
      }),
    );
  }

  // 去重 + 稳定排序：根目录优先、其余按字典序（CI 日志友好）
  const sorted = Array.from(new Set(allMatches)).sort((a, b) => {
    if (a === 'package.json') return -1;
    if (b === 'package.json') return 1;
    return a.localeCompare(b);
  });

  // 当 includeRoot=false 时，过滤掉根目录的 package.json
  return includeRoot ? sorted : sorted.filter((p) => p !== 'package.json');
}

/**
 * 通过 npm view 获取 dist-tags.latest 版本号
 *
 * 仅请求 latest 字段，显著降低网络和解析开销
 */
async function fetchLatestVersion(pkgName: string, registry: string): Promise<{ latest: string | null; error?: string }> {
  const cmd = `npm view ${pkgName} dist-tags.latest --registry ${registry} --loglevel error`;
  try {
    const result = await Shell.run(undefined, cmd, { timeout: 60_000 });
    if (result.code !== 0) {
      const stderr = result.stderr.trim();
      if (stderr.includes('E404') || result.stdout.trim() === '') {
        return { latest: null, error: '包尚未发布到 npm' };
      }
      return { latest: null, error: stderr || `npm view 退出码 ${result.code}` };
    }
    const stdout = result.stdout.trim();
    if (!stdout) return { latest: null, error: '包尚未发布到 npm' };
    // npm 输出的 latest 字段可能包含多行（极少见），取第一行
    const firstLine = stdout.split(/\r?\n/)[0]?.trim() ?? '';
    if (!firstLine || firstLine === 'undefined' || firstLine === 'null') {
      return { latest: null, error: 'npm 未返回 latest 版本号' };
    }
    return { latest: firstLine };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { latest: null, error: msg };
  }
}

/**
 * 分析单个 package 的最新发布版本
 */
async function analyzePackage(pkgJsonPath: string, registry: string): Promise<PackageLatestStatus> {
  let pkg: { name: string; version: string };
  try {
    pkg = readJson<{ name: string; version: string }>(pkgJsonPath);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      name: pkgJsonPath,
      path: pkgJsonPath,
      localVersion: '?',
      latest: null,
      publishedLocally: false,
      error: `无法读取 package.json: ${msg}`,
    };
  }

  const { latest, error } = await fetchLatestVersion(pkg.name, registry);

  // 使用 Semver 工具做精确比较（处理预发布标签等边界情况）
  const publishedLocally = latest !== null && latest !== undefined && Semver.eq(latest, pkg.version);

  return {
    name: pkg.name,
    path: pkgJsonPath,
    localVersion: pkg.version,
    latest,
    publishedLocally,
    error,
  };
}

/**
 * 人类可读表格输出
 */
function printTable(statuses: PackageLatestStatus[]): void {
  console.log('\n📦 EASBot packages npm 最新发布版本\n');

  // 对齐：列宽按"中文字符 × 2 + 英文 × 1"的视觉宽度估算（终端等宽字体下中文占 2 格）
  const visualWidth = (s: string): number => {
    let w = 0;
    for (const ch of s) {
      // CJK 统一表意文字 + 全角符号按 2 算；其他按 1
      w += /[\u3000-\u9fff\uff00-\uffef]/.test(ch) ? 2 : 1;
    }
    return w;
  };

  const nameWidth = Math.max(8, ...statuses.map((s) => visualWidth(s.name)));
  const verWidth = Math.max(8, ...statuses.map((s) => visualWidth(s.localVersion)));
  const latestWidth = Math.max(11, ...statuses.map((s) => visualWidth(s.latest ?? '-')));

  const padEndVisual = (s: string, width: number): string => {
    const diff = width - visualWidth(s);
    return diff > 0 ? s + ' '.repeat(diff) : s;
  };

  const header = `${padEndVisual('包名', nameWidth)}  ${padEndVisual('本地版本', verWidth)}  ${padEndVisual('npm latest', latestWidth)}  状态`;
  console.log(header);
  console.log('-'.repeat(visualWidth(header) + 6));

  let publishedCount = 0;
  let unpublishedCount = 0;
  let errorCount = 0;

  for (const s of statuses) {
    const latestText = s.latest ?? '-';
    const status = s.error ? `⚠️  ${s.error}` : s.publishedLocally ? '✅ 已发布' : '⬜ 未发布';

    if (s.publishedLocally) publishedCount++;
    else if (s.error) errorCount++;
    else unpublishedCount++;

    console.log(`${padEndVisual(s.name, nameWidth)}  ${padEndVisual(s.localVersion, verWidth)}  ${padEndVisual(latestText, latestWidth)}  ${status}`);
  }

  console.log('');
  console.log(`📊 总计: ${statuses.length} 个 package，${publishedCount} 个已发布本地版本，${unpublishedCount} 个本地版本待发布，${errorCount} 个查询异常`);
}

/**
 * JSON 输出结构
 */
function toJsonOutput(statuses: PackageLatestStatus[]) {
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      total: statuses.length,
      localVersionPublished: statuses.filter((s) => s.publishedLocally).length,
      localVersionNotPublished: statuses.filter((s) => !s.publishedLocally && !s.error).length,
      errors: statuses.filter((s) => Boolean(s.error)).length,
    },
    packages: statuses.map((s) => ({
      name: s.name,
      path: s.path,
      localVersion: s.localVersion,
      latest: s.latest,
      publishedLocally: s.publishedLocally,
      error: s.error ?? null,
    })),
  };
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  let opts: CliOptions;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`❌ 参数错误: ${msg}`);
    printHelp();
    process.exit(1);
  }

  const paths = collectPackageJsonPaths(opts.includeRoot);
  if (paths.length === 0) {
    console.error('❌ 未找到任何 package.json');
    process.exit(1);
  }

  console.log(`🔍 正在查询 ${paths.length} 个 package 的 npm 最新版本（registry: ${opts.registry}）...`);

  // 串行查询，避免对 npm registry 造成压力
  const statuses: PackageLatestStatus[] = [];
  for (const p of paths) {
    const status = await analyzePackage(p, opts.registry);
    statuses.push(status);
    process.stdout.write(`· ${status.name.padEnd(25)} ${status.localVersion.padEnd(10)} `);
    process.stdout.write(status.publishedLocally ? '✅\n' : status.error ? '⚠️\n' : '⬜\n');
  }

  if (opts.json || opts.output) {
    const json = JSON.stringify(toJsonOutput(statuses), null, 2);
    if (opts.output) {
      writeFileSync(opts.output, json + '\n', 'utf-8');
      console.log(`\n💾 已写入: ${opts.output}`);
    }
    if (opts.json && !opts.output) console.log(json);
  } else {
    printTable(statuses);
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本异常终止:', error);
    process.exit(1);
  });
