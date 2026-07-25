#!/usr/bin/env tsx
/**
 * Git pre-commit hook - 统一版本管理
 * 在提交代码时自动升级根目录和所有子项目的版本号，并创建 git tag
 *
 * 版本管理策略:
 *   - 根目录 package.json 和所有子项目 package.json 使用统一版本号
 *   - 默认禁用自动版本升级（安全考虑）
 *   - 需要显式设置 ENABLE_VERSION_BUMP=1 才启用
 *   - 创建统一的 git tag: easbot@版本号
 *   - **只在发布版本时生成 CHANGELOG**
 *
 * 使用方法:
 *   在 .husky/pre-commit 中调用此脚本
 *
 * 环境变量:
 *   ENABLE_VERSION_BUMP=1           # 启用自动版本升级（默认禁用）
 *   VERSION_BUMP=major|minor|patch  # 指定升级类型，默认为 patch
 *
 * 最佳实践:
 *   - CHANGELOG 只在发布版本时生成
 *   - 避免在每次 commit 时重新生成 CHANGELOG
 *   - 这样可以避免覆盖已发布的 CHANGELOG 条目
 */

/// <reference types="node" />
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

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
function parseVersion(version: string): { major: number; minor: number; patch: number; prerelease?: string; build?: string } | null {
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
  try {
    git(`rev-parse ${tag}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取所有子项目的 package.json 路径
 */
function getAllPackageJsonPaths(): string[] {
  const packagesDir = join(process.cwd(), 'packages');
  const paths: string[] = ['package.json']; // 根目录

  try {
    const packages = readdirSync(packagesDir);
    for (const pkg of packages) {
      const pkgPath = join(packagesDir, pkg);
      const pkgJsonPath = join(pkgPath, 'package.json');

      try {
        if (statSync(pkgPath).isDirectory() && statSync(pkgJsonPath).isFile()) {
          paths.push(`packages/${pkg}/package.json`);
        }
      } catch {
        // 忽略不存在 package.json 的目录
      }
    }
  } catch (error) {
    console.warn('⚠️  无法读取 packages 目录:', error);
  }

  return paths;
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
  // 检查是否有未提交的更改
  if (!hasUncommittedChanges()) {
    console.log('ℹ️  没有需要提交的更改，跳过');
    process.exit(0);
  }

  // 读取根目录 package.json
  const rootPkg = readPackageJson('package.json');
  const currentVersion = rootPkg.version;

  // 检查是否启用版本升级
  if (process.env.ENABLE_VERSION_BUMP !== '1') {
    console.log('ℹ️  版本升级已禁用（默认）');
    console.log('   使用 ENABLE_VERSION_BUMP=1 启用自动版本升级');
    console.log('   注意: CHANGELOG 只在发布版本时生成');
    process.exit(0);
  }

  // 获取升级类型，默认为 patch
  const bumpType = (process.env.VERSION_BUMP as 'major' | 'minor' | 'patch') || 'patch';

  // 验证升级类型
  if (!['major', 'minor', 'patch'].includes(bumpType)) {
    console.error(`❌ 无效的升级类型: ${bumpType}`);
    console.error('   支持的类型: major, minor, patch');
    process.exit(1);
  }

  console.log(`\n🚀 统一版本升级 (${bumpType})`);

  const oldVersion = currentVersion;
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

      // 添加到暂存区
      git(`add ${pkgPath}`);

      console.log(`   ✅ ${pkgPath} (${pkg.name})`);
    } catch (error) {
      console.error(`   ❌ 更新 ${pkgPath} 失败:`, error);
      process.exit(1);
    }
  }

  // 生成 CHANGELOG.md（使用新版本号作为参数）
  console.log(`\n📝 生成 CHANGELOG.md（新版本 ${newVersion}）...`);
  try {
    execSync(`npx tsx scripts/generate-changelog.ts ${newVersion}`, { stdio: 'inherit' });

    // 将 CHANGELOG.md 添加到暂存区
    git('add CHANGELOG.md');
    console.log(`   ✅ CHANGELOG.md 已更新并添加到暂存区`);
  } catch (error) {
    console.warn(`   ⚠️  生成 CHANGELOG.md 失败:`, error);
  }

  // 创建统一的 tag
  const message = `chore(release): easbot@${newVersion}`;
  git(`tag -a ${tag} -m "${message}"`);

  console.log(`\n✅ 版本升级完成`);
  console.log(`   Tag: ${tag}`);
  console.log(`\n推送到远程仓库:`);
  console.log(`   git push`);
  console.log(`   git push --tags`);
}

main();
