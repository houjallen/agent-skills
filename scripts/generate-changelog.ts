#!/usr/bin/env tsx
/**
 * CHANGELOG 自动生成脚本
 * 基于 git commit 历史生成 CHANGELOG.md
 *
 * 提交格式（AGENTS.md §6）：
 *   - [skill: <name>] <type>(<scope>): <summary>
 *   - [repo] <type>(<scope>): <summary>
 *   - [auto] <summary>
 *
 * type 类型：
 *   - feat: 新功能
 *   - fix: 修复错误
 *   - docs: 文档更新
 *   - test: 测试相关
 *   - chore: 构建或工具变动
 *   - refactor: 代码重构
 *   - perf: 性能优化
 *   - ci: CI/CD 相关
 *
 * 使用方法：
 *   - 自动（基于 git tag）: npx tsx scripts/generate-changelog.ts
 *   - 手动指定版本: npx tsx scripts/generate-changelog.ts 0.2.0
 *   - 全量（不基于 tag）: npx tsx scripts/generate-changelog.ts --all
 *
 * 最佳实践：
 *   - 只在发布版本时生成 CHANGELOG
 *   - 避免在每次 commit 时生成 CHANGELOG
 *   - 基于 git tag 确定版本范围，而不是 package.json
 */

/// <reference types="node" />
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

interface Commit {
  hash: string;
  // 提交归属：[skill: <name>] | [repo] | [auto]
  scope: string; // 例如 eas-skill-creator / repo / auto
  type: string; // feat / fix / docs / chore ...
  subject: string; // 提交首行去掉前缀后的描述
  date: string;
}

interface ChangelogSection {
  title: string;
  emoji: string;
  commits: Commit[];
}

/**
 * 执行 git 命令
 */
function git(command: string): string {
  try {
    return execSync(`git ${command}`, { encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

/**
 * 读取 package.json
 */
function readPackageJson(): { name: string; version: string } {
  const content = readFileSync('package.json', 'utf-8');
  return JSON.parse(content) as { name: string; version: string };
}

/**
 * 获取最近的版本 tag
 */
function getLatestVersionTag(): string | null {
  const tags = git('tag -l "easbot-skills@*" --sort=-version:refname');
  if (!tags) return null;
  const tagList = tags.split('\n').filter(Boolean);
  return tagList[0] || null;
}

/**
 * 解析 commit 消息
 * 支持：
 *   [skill: <name>] <type>(<scope>): <subject>
 *   [skill: <name>] <type>: <subject>
 *   [repo] <type>(<scope>): <subject>
 *   [repo] <type>: <subject>
 *   [auto] <subject>
 */
function parseCommit(commitLine: string): Commit | null {
  // 格式: hash|date|message（仅取首行）
  const [hash, date, ...messageParts] = commitLine.split('|');
  const message = messageParts.join('|');
  if (!hash || !date || !message) return null;

  // 优先按"主行"匹配（commit message 可能多行，但首行足够）
  const firstLine = message.split('\n')[0] || message;

  // 1) [skill: <name>] <type>(<scope>): <subject>
  let m = firstLine.match(/^\[skill:\s+([a-z][a-z0-9-]*)\]\s+(feat|fix|docs|test|chore|refactor|perf|ci)\(([a-z][a-z0-9-]*)\):\s+(.+)$/);
  if (m) {
    return makeCommit(hash, date, m[1]!, `${m[2]}(${m[3]}): ${m[4]}`, m[2]!);
  }

  // 2) [skill: <name>] <type>: <subject>
  m = firstLine.match(/^\[skill:\s+([a-z][a-z0-9-]*)\]\s+(feat|fix|docs|test|chore|refactor|perf|ci):\s+(.+)$/);
  if (m) {
    return makeCommit(hash, date, m[1]!, `${m[2]}: ${m[3]}`, m[2]!);
  }

  // 3) [repo] <type>(<scope>): <subject>
  m = firstLine.match(/^\[repo\]\s+(feat|fix|docs|test|chore|refactor|perf|ci)\(([a-z][a-z0-9-]*)\):\s+(.+)$/);
  if (m) {
    return makeCommit(hash, date, 'repo', `${m[1]}(${m[2]}): ${m[3]}`, m[1]!);
  }

  // 4) [repo] <type>: <subject>
  m = firstLine.match(/^\[repo\]\s+(feat|fix|docs|test|chore|refactor|perf|ci):\s+(.+)$/);
  if (m) {
    return makeCommit(hash, date, 'repo', `${m[1]}: ${m[2]}`, m[1]!);
  }

  // 5) [auto] ... → 归到 chore（不解析 type）
  m = firstLine.match(/^\[auto\]\s+(.+)$/);
  if (m) {
    return makeCommit(hash, date, 'auto', firstLine, 'chore');
  }

  return null;
}

function makeCommit(hash: string, date: string, scope: string, subject: string, type: string): Commit {
  // 过滤 release / version bump 自身的 commit（避免 changelog 自我引用）
  const lower = subject.toLowerCase();
  if (type === 'chore' && (lower.includes('release') || lower.includes('version'))) {
    return { hash, scope, type: '__skip__', subject, date };
  }
  return {
    hash: hash.trim(),
    scope: scope.trim(),
    type: type.trim(),
    subject: subject.trim(),
    date: date.trim(),
  };
}

/**
 * 获取 commits
 */
function getCommits(since?: string, all = false): Commit[] {
  let command = 'log --pretty=format:"%h|%ad|%s" --date=short --no-merges';
  if (since) {
    command += ` ${since}..HEAD`;
  }
  const output = git(command);
  if (!output) return [];

  const commits: Commit[] = [];
  for (const line of output.split('\n')) {
    if (!line.trim()) continue;
    const commit = parseCommit(line);
    if (commit) {
      commits.push(commit);
    }
  }
  return all ? commits : commits.filter((c) => c.type !== '__skip__');
}

/**
 * 按 type 分组 commits
 */
function groupCommitsByType(commits: Commit[]): Map<string, Commit[]> {
  const groups = new Map<string, Commit[]>();
  for (const commit of commits) {
    if (commit.type === '__skip__') continue;
    const existing = groups.get(commit.type) || [];
    existing.push(commit);
    groups.set(commit.type, existing);
  }
  return groups;
}

/**
 * 类型 → 标题 / emoji
 */
function getTypeInfo(type: string): { title: string; emoji: string } {
  const typeMap: Record<string, { title: string; emoji: string }> = {
    feat: { title: '新功能', emoji: '✨' },
    fix: { title: '修复', emoji: '🐛' },
    docs: { title: '文档', emoji: '📝' },
    test: { title: '测试', emoji: '✅' },
    chore: { title: '构建/工具', emoji: '🔧' },
    refactor: { title: '重构', emoji: '♻️' },
    perf: { title: '性能优化', emoji: '⚡' },
    ci: { title: 'CI/CD', emoji: '👷' },
  };
  return typeMap[type] || { title: type, emoji: '📦' };
}

/**
 * 生成 changelog 内容
 */
function generateChangelogContent(version: string, commits: Commit[]): string {
  if (commits.length === 0) return '';

  const groups = groupCommitsByType(commits);
  const sections: ChangelogSection[] = [];

  const typeOrder = ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'chore', 'ci'];
  for (const type of typeOrder) {
    const typeCommits = groups.get(type);
    if (typeCommits && typeCommits.length > 0) {
      const { title, emoji } = getTypeInfo(type);
      sections.push({ title, emoji, commits: typeCommits });
    }
  }

  // 计算本次版本涉及的 skill 列表（用于 "Changed Skills" 摘要）
  const skills = Array.from(new Set(commits.filter((c) => c.scope.startsWith('eas-')).map((c) => c.scope))).sort();

  let content = `## ${version}\n\n`;
  if (commits.length > 0) {
    content += `_${commits[0]!.date}_\n\n`;
  }
  if (skills.length > 0) {
    content += `**影响技能 (${skills.length})**：${skills.map((s) => `\`${s}\``).join('、')}\n\n`;
  }

  for (const section of sections) {
    content += `### ${section.emoji} ${section.title}\n\n`;
    for (const commit of section.commits) {
      const scopeTag = commit.scope === 'repo' ? 'repo' : commit.scope === 'auto' ? 'auto' : `skill:${commit.scope}`;
      content += `- **[${scopeTag}]** ${commit.subject} ([${commit.hash}](https://github.com/houjallen/agent-skills/commit/${commit.hash}))\n`;
    }
    content += '\n';
  }

  return content;
}

/**
 * 读取现有 CHANGELOG.md
 */
function readExistingChangelog(): string {
  if (!existsSync('CHANGELOG.md')) {
    return '# EASBot Agent Skills 更新日志\n\n';
  }
  return readFileSync('CHANGELOG.md', 'utf-8');
}

/**
 * 更新 CHANGELOG.md
 */
function updateChangelog(version: string, newContent: string): void {
  const existing = readExistingChangelog();
  const versionPattern = new RegExp(`^## ${version.replace(/\./g, '\\.')}$`, 'm');

  if (versionPattern.test(existing)) {
    // 版本已存在，替换该版本的内容
    const lines = existing.split('\n');
    const versionIndex = lines.indexOf(`## ${version}`);
    if (versionIndex !== -1) {
      let nextVersionIndex = lines.findIndex((line, index) => index > versionIndex && line.startsWith('## '));
      if (nextVersionIndex === -1) nextVersionIndex = lines.length;
      const before = lines.slice(0, versionIndex).join('\n');
      const after = lines.slice(nextVersionIndex).join('\n');
      const updated = `${before}\n${newContent}${after}`;
      writeFileSync('CHANGELOG.md', updated, 'utf-8');
      return;
    }
  }

  // 版本不存在，在标题后插入新内容
  const headerMatch = existing.match(/^#\s+.+$/m);
  if (headerMatch) {
    const headerEnd = existing.indexOf(headerMatch[0]) + headerMatch[0].length;
    const before = existing.substring(0, headerEnd);
    const after = existing.substring(headerEnd);
    const updated = `${before}\n\n${newContent}${after}`;
    writeFileSync('CHANGELOG.md', updated, 'utf-8');
  } else {
    const updated = `# EASBot Agent Skills 更新日志\n\n${newContent}${existing}`;
    writeFileSync('CHANGELOG.md', updated, 'utf-8');
  }
}

/**
 * 从 tag 中提取版本号
 * 支持 tag 格式：easbot-skills@<version>
 */
function extractVersionFromTag(tag: string): string | null {
  const match = tag.match(/^easbot-skills@(.*)$/);
  return match ? (match[1] as string) : null;
}

/**
 * 主函数
 */
function main(): void {
  const args = process.argv.slice(2);
  const allMode = args.includes('--all');
  let version: string | null = null;

  if (args.length > 0 && !args[0]!.startsWith('--')) {
    version = args[0]!;
    console.log(`   使用命令行指定的版本: ${version}`);
  } else {
    const pkg = readPackageJson();
    version = pkg.version;
    console.log(`   当前版本: ${version}`);
  }

  // 获取最近的版本 tag
  const latestTag = getLatestVersionTag();

  if (latestTag) {
    console.log(`   最近 tag: ${latestTag}`);
    if (!allMode && args.length === 0) {
      version = extractVersionFromTag(latestTag);
      console.log(`   从 tag 提取版本: ${version}`);
    }
  } else {
    console.log('   未找到版本 tag，将获取所有 commits');
  }

  // 获取 commits
  const commits = getCommits(latestTag || undefined, allMode);
  console.log(`   找到 ${commits.length} 个符合格式的 commits`);

  if (commits.length === 0) {
    console.log('   没有新的 commits，跳过 CHANGELOG 生成');
    console.log('   提示：commit 消息必须以 [skill: <name>] / [repo] / [auto] 起头（AGENTS.md §6）');
    return;
  }

  if (!version) {
    console.error('   ❌ 无法确定版本号');
    process.exit(1);
  }

  // 生成 changelog 内容
  const content = generateChangelogContent(version, commits);

  // 更新 CHANGELOG.md
  updateChangelog(version, content);

  console.log('✅ CHANGELOG.md 已更新');
}

main();
