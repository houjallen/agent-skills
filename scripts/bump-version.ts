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
 * 最佳实践:
 *   - 发布前确保所有更改已提交
 *   - 生成 CHANGELOG 时显式传递版本号参数
 *   - 确保代码已推送到远程，避免版本冲突
 */

/// <reference types="node" />
import { readFileSync, writeFileSync, statSync } from 'node:fs';
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

  // 提交更改
  console.log(`\n📝 提交版本更新...`);
  for (const pkgPath of allPackages) {
    git(`add ${pkgPath}`);
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
  console.log(`\n推送到远程仓库:`);
  console.log(`   git push`);
  console.log(`   git push --tags`);
}

main();
