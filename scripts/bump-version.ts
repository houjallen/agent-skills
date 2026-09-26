#!/usr/bin/env tsx
/**
 * 手动版本升级脚本
 * 升级根目录和所有子项目的版本号，并创建 git tag
 *
 * 使用方法:
 *   pnpm version:patch   # 升级补丁版本 (0.1.0 -> 0.1.1)
 *   pnpm version:minor   # 升级次版本 (0.1.0 -> 0.2.0)
 *   pnpm version:major   # 升级主版本 (0.1.0 -> 1.0.0)
 *
 * 副作用（自动化同步，**唯一真相源是 package.json**）:
 *   1. 写入根 package.json + 所有子包 package.json 的 version 字段
 *   2. 同步 README 顶部的中文版本段（heading = `## 版本`）与英文版本段（heading = `## Version`）：
 *      - 根 README.md / README.en.md
 *      - 每个包 README.md / README.en.md（如存在）
 *      仅写顶部锚定段，绝不散布版本号到正文表格 / 段落。
 *   3. 生成 CHANGELOG.md（如生成脚本存在）
 *   4. 提交所有 package.json + README + CHANGELOG 到 git 并打 tag
 *
 * 最佳实践:
 *   - 发布前确保所有更改已提交
 *   - 生成 CHANGELOG 时显式传递版本号参数
 *   - 确保代码已推送到远程，避免版本冲突
 */

/// <reference types="node" />
import { readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';
import { Glob } from '@easbot/utils';

// 版本号格式验证 (semver)
const VERSION_REGEX = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;

interface PackageJson {
  name: string;
  version: string;
  [key: string]: any;
}

/**
 * 解析版本号
 */
function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
} | null {
  const match = version.match(VERSION_REGEX);
  if (!match) return null;

  return {
    major: Number.parseInt(match[1]!, 10),
    minor: Number.parseInt(match[2]!, 10),
    patch: Number.parseInt(match[3]!, 10),
    prerelease: match[4],
    build: match[5],
  };
}

/**
 * 升级版本号
 */
function bumpVersion(version: string, type: 'major' | 'minor' | 'patch'): string {
  const parsed = parseVersion(version);
  if (!parsed) {
    throw new Error(`Invalid version format: ${version}`);
  }

  switch (type) {
    case 'major':
      return `${parsed.major + 1}.0.0`;
    case 'minor':
      return `${parsed.major}.${parsed.minor + 1}.0`;
    case 'patch':
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
    default:
      throw new Error(`Unknown bump type: ${type}`);
  }
}

/**
 * 读取 package.json
 */
function readPackageJson(pkgPath: string): PackageJson {
  const content = readFileSync(pkgPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * 写入 package.json
 */
function writePackageJson(pkgPath: string, pkg: PackageJson): void {
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
}

/**
 * 执行 git 命令
 */
function git(command: string): string {
  try {
    return execSync(`git ${command}`, { encoding: 'utf-8' }).trim();
  } catch (error) {
    throw new Error(`Git command failed: git ${command}\n${error}`);
  }
}

/**
 * 检查 git tag 是否存在
 */
function tagExists(tag: string): boolean {
  // 使用 refs/tags/ 限定符 + --verify 静默模式，避开 "ambiguous argument" 歧义
  // 退出码 0 = 存在，128 = 不存在
  try {
    const out = execSync(`git rev-parse -q --verify refs/tags/${tag}`, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out.length > 0;
  } catch {
    return false;
  }
}

/**
 * 获取所有子项目的 package.json 路径
 *
 * 使用 `@easbot/utils.Glob` 递归扫描，支持任意嵌套深度的 workspace 包。
 * 例如 `skills/builtin/eas-agent-creation/scripts/package.json` 也会被命中。
 *
 * 排除规则:
 *   - node_modules
 *   - dist（构建产物，不会作为 workspace 包发布）
 *   - .git
 *
 * 用 `scanSync` 保持原脚本的同步执行语义；`include: 'file'` 保证只命中文件
 * （不会误匹配 `skills/xxx/dist/package.json` 之类的目录）。
 */
function getAllPackageJsonPaths(): string[] {
  const cwd = process.cwd();
  const patterns = [
    'package.json', // 根目录
    'skills/**/package.json', // 任意深度的子包
    'packages/**/package.json', // 兜底：兼容旧版 packages/ 布局
  ];
  const ignore = ['**/node_modules/**', '**/dist/**', '**/.git/**'];

  // Glob.scanSync 是单 pattern；多 pattern 展开循环收集（与 clean-test-fixtures.ts 一致）
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

  // 去重（根目录的 package.json 不会被 glob 重复，但保险起见）+ 稳定排序
  // 根目录优先、其余按字典序（CI 日志友好）
  return Array.from(new Set(allMatches)).sort((a, b) => {
    if (a === 'package.json') return -1;
    if (b === 'package.json') return 1;
    return a.localeCompare(b);
  });
}

/**
 * 检查是否有未提交的更改（忽略 .gitignore 中的文件）
 */
function hasUncommittedChanges(): boolean {
  const status = git('status --porcelain --untracked-files=no');
  return status.length > 0;
}

/**
 * README 顶部版本锚定段定义
 *
 * - 中文锚点：`## 版本` 段，下一行为 `v<version>`
 * - 英文锚点：`## Version` 段，下一行为 `v<version>`
 *
 * 如果文件**已有**对应段：替换段中的版本号（保留所有其它内容）。
 * 如果文件**没有**对应段：在第一个 `## ` 段之前插入新段（不会破坏文件结构）。
 */
const README_SYNC = {
  zh: {
    heading: '## 版本',
    bodyLine: (v: string): string => `v${v}`,
    section: (v: string): string => `## 版本\n\nv${v}\n`,
  },
  en: {
    heading: '## Version',
    bodyLine: (v: string): string => `v${v}`,
    section: (v: string): string => `## Version\n\nv${v}\n`,
  },
} as const;

type ReadmeLang = 'zh' | 'en';

interface ReadmeSyncResult {
  file: string;
  action: 'updated' | 'inserted' | 'unchanged' | 'skipped-no-file';
  oldVersion?: string;
  newVersion: string;
}

/**
 * 同步单个 README 的版本锚定段
 *
 * 规则：
 * 1. 找到 `## 版本`（zh）或 `## Version`（en）段（位于行首）
 * 2. 该段从该行开始，直到下一个 `## ` / `### ` / `---` 行 / EOF（取最先）
 * 3. 替换整段内容为 `${heading}\n\nv<new>\n`，保留后续内容不动
 *
 * 如果段不存在：在文件**第一个 `## ` 二级标题之前**插入新段（保持顶部锚定位置）
 */
function syncReadmeVersion(filePath: string, newVersion: string, lang: ReadmeLang): ReadmeSyncResult {
  const cfg = README_SYNC[lang];

  if (!existsSync(filePath)) {
    return { file: filePath, action: 'skipped-no-file', newVersion };
  }

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // 找到锚点段行号
  const headingIdx = lines.findIndex((line) => line.trim() === cfg.heading);

  let result: ReadmeSyncResult;

  if (headingIdx >= 0) {
    // 段已存在 → 替换 [headingIdx, endIdx) 区间
    // 段结束 = 下一个 `## ` / `### ` / `---` 行 / EOF（取最先）
    let endIdx = lines.length;
    for (let i = headingIdx + 1; i < lines.length; i++) {
      const trimmed = lines[i]?.trim() ?? '';
      if (trimmed.startsWith('## ') || trimmed.startsWith('### ') || trimmed === '---') {
        endIdx = i;
        break;
      }
    }

    // 取出当前段（含空行）→ 提取旧版本
    const oldBlock = lines.slice(headingIdx, endIdx).join('\n');
    const oldVersionMatch = oldBlock.match(/v(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?(?:\+[a-zA-Z0-9.-]+)?)/);
    const oldVersion = oldVersionMatch?.[1];

    // 构造新段（heading + 1 行空 + 1 行版本号）
    const newBlock = `${cfg.heading}\n\n${cfg.bodyLine(newVersion)}`;

    // 替换：保持后续内容的缩进（不剥离尾部空行）
    const newLines = [
      ...lines.slice(0, headingIdx),
      ...newBlock.split('\n'),
      ...lines.slice(endIdx),
    ];
    writeFileSync(filePath, newLines.join('\n'), 'utf-8');

    result = {
      file: filePath,
      action: oldVersion === newVersion ? 'unchanged' : 'updated',
      oldVersion,
      newVersion,
    };
  } else {
    // 段不存在 → 在文件第一个 `## ` 之前插入（保证顶部锚定位置）
    const firstH2Idx = lines.findIndex((line) => /^## /.test(line));
    const newBlock = cfg.section(newVersion);
    const insertIdx = firstH2Idx >= 0 ? firstH2Idx : lines.length;

    const newLines = [...lines.slice(0, insertIdx), newBlock, ...lines.slice(insertIdx)];
    writeFileSync(filePath, newLines.join('\n'), 'utf-8');

    result = { file: filePath, action: 'inserted', newVersion };
  }

  return result;
}

/**
 * 同步所有 README（中英文两套）的版本锚定段
 *
 * 与 getAllPackageJsonPaths 对齐：复用相同的 Glob.scanSync 模式集合
 * （递归扫描 skills 与 packages 两套布局下的 package.json），
 * 以 package.json 是否存在作为"这是一个 workspace 包"的判定标准，
 * 再对每个包目录下的 README.md 与 README.en.md 执行锚定段同步。
 */
export function syncAllReadmes(newVersion: string): ReadmeSyncResult[] {
  const results: ReadmeSyncResult[] = [];
  const cwd = process.cwd();

  // 根 README
  results.push(syncReadmeVersion(join(cwd, 'README.md'), newVersion, 'zh'));
  results.push(syncReadmeVersion(join(cwd, 'README.en.md'), newVersion, 'en'));

  // 与 package.json 扫描规则保持一致：递归扫描 skills/ 与 packages/ 两套布局
  const pkgPatterns = ['skills/**/package.json', 'packages/**/package.json'];
  const ignore = ['**/node_modules/**', '**/dist/**', '**/.git/**'];

  const pkgPaths = new Set<string>();
  for (const pattern of pkgPatterns) {
    for (const p of Glob.scanSync(pattern, {
      cwd,
      ignore,
      absolute: false,
      include: 'file',
    })) {
      pkgPaths.add(p);
    }
  }

  for (const pkgPath of pkgPaths) {
    // pkgPath 形如 "skills/foo/README.md/../package.json" 之外的 → 实际是 "skills/foo/package.json"
    // 把结尾的 package.json 去掉，得到目录相对路径
    const dirRel = pkgPath.replace(/[/\\]package\.json$/, '');
    const pkgDir = join(cwd, dirRel);
    results.push(syncReadmeVersion(join(pkgDir, 'README.md'), newVersion, 'zh'));
    results.push(syncReadmeVersion(join(pkgDir, 'README.en.md'), newVersion, 'en'));
  }

  return results;
}

/**
 * 主函数
 */
function main(): void {
  // 获取升级类型
  const bumpType = process.argv[2] as 'major' | 'minor' | 'patch';

  // 验证升级类型
  if (!bumpType || !['major', 'minor', 'patch'].includes(bumpType)) {
    console.error('❌ 请指定升级类型: major, minor, 或 patch');
    console.error('\n使用方法:');
    console.error('  pnpm version:patch   # 升级补丁版本 (0.1.0 -> 0.1.1)');
    console.error('  pnpm version:minor   # 升级次版本 (0.1.0 -> 0.2.0)');
    console.error('  pnpm version:major   # 升级主版本 (0.1.0 -> 1.0.0)');
    process.exit(1);
  }

  // 检查是否有未提交的更改
  if (hasUncommittedChanges()) {
    console.error('❌ 有未提交的更改，请先提交或暂存所有更改');
    console.error('   运行 git status 查看详情');
    process.exit(1);
  }

  console.log(`🚀 手动版本升级 (${bumpType})`);

  // 读取根目录 package.json
  const rootPkg = readPackageJson('package.json');
  const oldVersion = rootPkg.version;
  const newVersion = bumpVersion(oldVersion, bumpType);
  const tag = `easbot-skills@${newVersion}`;

  console.log(`   当前版本: ${oldVersion}`);
  console.log(`   新版本: ${newVersion}`);

  // 检查 tag 是否已存在
  if (tagExists(tag)) {
    console.error(`\n❌ Tag 已存在: ${tag}`);
    console.error('   请手动指定不同的版本号或删除已存在的 tag');
    process.exit(1);
  }

  // 获取所有 package.json 路径
  const allPackages = getAllPackageJsonPaths();
  console.log(`\n📦 更新 ${allPackages.length} 个 package.json 文件:`);

  // 更新所有 package.json
  for (const pkgPath of allPackages) {
    try {
      const pkg = readPackageJson(pkgPath);
      pkg.version = newVersion;
      writePackageJson(pkgPath, pkg);

      console.log(`   ✅ ${pkgPath} (${pkg.name})`);
    } catch (error) {
      console.error(`   ❌ 更新 ${pkgPath} 失败:`, error);
      process.exit(1);
    }
  }

  // 同步 README 顶部 `## 版本` / `## Version` 段
  console.log(`\n📝 同步 README 版本锚定段...`);
  const readmeResults = syncAllReadmes(newVersion);
  for (const r of readmeResults) {
    const tagIcon =
      r.action === 'updated'
        ? '✏️  updated'
        : r.action === 'inserted'
          ? '➕ inserted'
          : r.action === 'unchanged'
            ? '✅ unchanged'
            : '⏭️  skipped';
    const verInfo =
      r.action !== 'skipped-no-file'
        ? r.oldVersion
          ? ` (${r.oldVersion} → ${r.newVersion})`
          : ` → v${r.newVersion}`
        : '';
    const relPath = relative(process.cwd(), r.file).replace(/\\/g, '/');
    console.log(`   ${tagIcon} ${relPath}${verInfo}`);
  }

  // 生成 CHANGELOG.md
  console.log(`\n📝 生成 CHANGELOG.md...`);
  try {
    execSync(`npx tsx scripts/generate-changelog.ts ${newVersion}`, {
      stdio: 'inherit',
    });
    git('add CHANGELOG.md');
    console.log(`   ✅ CHANGELOG.md 已更新并添加到暂存区`);
  } catch (error) {
    console.warn(`   ⚠️  生成 CHANGELOG.md 失败:`, error);
  }

  // 提交所有 package.json
  for (const pkgPath of allPackages) {
    git(`add ${pkgPath}`);
  }

  // 提交所有同步过的 README
  const readmePathsToAdd = readmeResults
    .filter((r) => r.action !== 'skipped-no-file')
    .map((r) => relative(process.cwd(), r.file).replace(/\\/g, '/'));
  for (const readmePath of readmePathsToAdd) {
    git(`add ${readmePath}`);
  }

  const commitMessage = `[auto] chore(release): easbot-skills@${newVersion}`;
  git(`commit -m "${commitMessage}" --no-verify`);

  console.log(`   ✅ 已提交: ${commitMessage}`);

  // 创建统一的 tag
  const tagMessage = `[auto] chore(release): easbot-skills@${newVersion}`;
  git(`tag -a ${tag} -m "${tagMessage}"`);

  console.log(`\n✅ 版本升级完成`);
  console.log(`   版本: ${oldVersion} -> ${newVersion}`);
  console.log(`   Tag: ${tag}`);
  console.log(`   Commit: ${git('rev-parse --short HEAD')}`);
  console.log(
    `   同步的 README 数: ${readmeResults.filter((r) => r.action !== 'skipped-no-file').length} / ${readmeResults.length}`,
  );
  console.log(`\n推送到远程仓库:`);
  console.log(`   git push`);
  console.log(`   git push --tags`);
}

// 仅在被直接调用（而非被 import）时执行 main()
// ESM 模式：通过比较 import.meta.url 与 process.argv[1] 判断入口
import { fileURLToPath } from 'node:url';
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
