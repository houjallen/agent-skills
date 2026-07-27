#!/usr/bin/env tsx
/**
 * Claude Plugin Marketplace 元数据自动生成脚本
 *
 * 根据 `package.json` 元信息和 `skills/` 目录下所有技能的 `SKILL.md` frontmatter
 * 自动生成 `.claude-plugin/marketplace.json`。
 *
 * 本仓库是 marketplace 仓库（不是单 plugin 仓库），按官方规范：
 *   - 单 plugin 仓库：.claude-plugin/plugin.json
 *   - marketplace 仓库：.claude-plugin/marketplace.json（指向各 plugin 源）
 * 故只生成 marketplace.json，不再生成 plugin.json。
 *
 * 使用方法：
 *   - 默认（生成到 .claude-plugin）: npx tsx scripts/generate-plugin.ts
 *   - 指定输出目录: npx tsx scripts/generate-plugin.ts <output-dir>
 *
 * 依赖：零外部依赖（仅使用 node:fs / node:path）
 */

/// <reference types="node" />
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';

// ============ 类型定义 ============

interface PackageJson {
  name: string;
  version: string;
  description: string;
  author: string | { name: string; email?: string };
  license?: string;
  repository?: string | { type?: string; url?: string };
  homepage?: string;
  keywords?: string[];
}

interface SkillFrontmatter {
  name?: string;
  description?: string;
  category?: string;
  version?: string;
  author?: string;
  tags?: string[];
}

interface PluginAuthor {
  name: string;
  email: string;
}

interface MarketplacePlugin {
  name: string;
  description: string;
  source: string;
  category: string;
  version: string;
  author: PluginAuthor;
}

interface MarketplaceJson {
  name: string;
  description: string;
  owner: PluginAuthor;
  plugins: MarketplacePlugin[];
}

// ============ 工具函数 ============

/**
 * 解析 package.json 中的 author 字段
 * 兼容字符串（"Name <email>"）和对象两种形式
 */
function parseAuthor(author: PackageJson['author']): PluginAuthor {
  const fallback = { name: 'houjallen', email: 'houjallen@gmail.com' };
  if (!author) return fallback;
  if (typeof author === 'object') {
    return {
      name: author.name || fallback.name,
      email: author.email || fallback.email,
    };
  }
  // 字符串形式："Name <email>" 或 "Name"
  const match = author.match(/^([^<]+?)(?:\s*<([^>]+)>)?$/);
  if (match) {
    return {
      name: (match[1] || fallback.name).trim(),
      email: (match[2] || fallback.email).trim(),
    };
  }
  return { name: author.trim() || fallback.name, email: fallback.email };
}

/**
 * 从 SKILL.md 文件中提取 YAML frontmatter
 * 使用简易解析（避免引入 js-yaml），仅支持脚本所需的字段
 */
function parseSkillFrontmatter(skillMdPath: string): SkillFrontmatter | null {
  if (!existsSync(skillMdPath)) return null;

  const content = readFileSync(skillMdPath, 'utf-8');
  // 去除 BOM
  const clean = content.replace(/^\uFEFF/, '');
  if (!clean.startsWith('---')) return null;

  // 找到第二个 ---
  const lines = clean.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') return null;

  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === '---') {
      endIndex = i;
      break;
    }
  }
  if (endIndex === -1) return null;

  const frontmatterLines = lines.slice(1, endIndex);
  const result: SkillFrontmatter = {};

  // 简易解析：仅支持脚本所需的简单键值对、列表、对象
  let currentKey: string | null = null;
  let currentArray: string[] | null = null;

  for (const rawLine of frontmatterLines) {
    const line = rawLine.replace(/\s+$/, '');
    if (!line.trim()) continue;

    // 顶层键（不以空格开头）
    if (/^[a-zA-Z_][a-zA-Z0-9_-]*\s*:/.test(line)) {
      // 提交上一个 array
      if (currentKey && currentArray) {
        result[currentKey as keyof SkillFrontmatter] = currentArray as never;
      }
      currentKey = null;
      currentArray = null;

      const colonIndex = line.indexOf(':');
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      if (value === '' || value === '|' || value === '>') {
        // 可能是后续多行内容或列表，跳过该行
        currentKey = key;
        continue;
      }

      // 处理行内数组：tags: [a, b, c]
      if (value.startsWith('[') && value.endsWith(']')) {
        const inner = value.slice(1, -1).trim();
        const items = inner
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
        (result as Record<string, unknown>)[key] = items;
        continue;
      }

      // 普通字符串值，去除首尾引号
      (result as Record<string, unknown>)[key] = value.replace(/^["']|["']$/g, '');
      currentKey = key;
    } else if (currentKey && /^\s*-\s+/.test(line)) {
      // 列表项
      const item = line
        .replace(/^\s*-\s+/, '')
        .replace(/^["']|["']$/g, '')
        .trim();
      if (!currentArray) currentArray = [];
      currentArray.push(item);
    }
  }
  // 收尾
  if (currentKey && currentArray) {
    result[currentKey as keyof SkillFrontmatter] = currentArray as never;
  }

  return result;
}

/**
 * 读取 package.json
 */
function readPackageJson(cwd: string): PackageJson {
  const pkgPath = join(cwd, 'package.json');
  if (!existsSync(pkgPath)) {
    throw new Error(`未找到 package.json: ${pkgPath}`);
  }
  return JSON.parse(readFileSync(pkgPath, 'utf-8')) as PackageJson;
}

/**
 * 从 npm 包名提取 marketplace 名
 * "@easbot/agent-skills" → "easbot-agent-skills"
 * 官方要求 marketplace name 为 kebab-case（不允许斜杠 / 空格）
 */
function deriveMarketplaceName(npmName: string): string {
  // 去掉 @ 前缀，把 / 替换成 -
  return npmName.replace(/^@/, '').replace(/\//g, '-');
}

/**
 * 构造 marketplace.description
 * 简化 package.json.description 中的冗长修饰，输出 "the EASBot agent-skills management repository" 风格
 *
 * 取自 marketplace slug（"easbot-agent-skills"），把首段识别为品牌名：
 *   - 已在白名单的拼写（如 "easbot" → "EASBot"）按白名单转换
 *   - 其他首段按 PascalCase 处理（首字母大写，其余小写）
 *   - 其余段保持原样（kebab-case 短语）
 */
function deriveMarketplaceDescription(pkgDescription: string, pkgName: string): string {
  const slug = deriveMarketplaceName(pkgName);
  const segments = slug.split('-');
  const brandMap: Record<string, string> = {
    easbot: 'EASBot',
  };
  const first = segments[0] ?? '';
  const brand = brandMap[first] ?? (first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : first);
  const rest = segments.slice(1).join('-');
  return rest ? `the ${brand} ${rest} management repository` : `the ${brand} management repository`;
}

/**
 * 扫描 skills 目录下所有技能的元数据
 */
function scanSkills(cwd: string): Array<{
  name: string;
  category: string;
  description: string;
  version: string;
  author: PluginAuthor;
  source: string;
}> {
  const skillsRoot = join(cwd, 'skills');
  if (!existsSync(skillsRoot)) {
    console.warn(`⚠️  未找到 skills 目录: ${skillsRoot}`);
    return [];
  }

  const result: Array<{
    name: string;
    category: string;
    description: string;
    version: string;
    author: PluginAuthor;
    source: string;
  }> = [];

  const topDirs = readdirSync(skillsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const category of topDirs) {
    const categoryPath = join(skillsRoot, category);
    const skillDirs = readdirSync(categoryPath, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();

    for (const skillDir of skillDirs) {
      const skillPath = join(categoryPath, skillDir);
      const skillMdPath = join(skillPath, 'SKILL.md');

      // 仅作为目录存在性检查
      if (!existsSync(skillMdPath)) {
        console.warn(`⚠️  跳过 ${skillDir}：未找到 SKILL.md`);
        continue;
      }

      const stat = statSync(skillPath);
      if (!stat.isDirectory()) continue;

      const fm = parseSkillFrontmatter(skillMdPath);
      if (!fm) {
        console.warn(`⚠️  跳过 ${skillDir}：SKILL.md 缺少合法 frontmatter`);
        continue;
      }

      const name = fm.name || skillDir;
      const author = parseAuthor(fm?.author ?? '');

      result.push({
        name,
        category: fm.category || category,
        description: fm.description || '',
        version: fm.version || '0.1.0',
        author,
        source: `./skills/${category}/${skillDir}`,
      });
    }
  }

  return result;
}

/**
 * 写入文件（带尾行换行）
 */
function writeJson(filePath: string, data: unknown): void {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  writeFileSync(filePath, json, 'utf-8');
}

// ============ 生成逻辑 ============

function generateMarketplaceJson(pkg: PackageJson, skills: ReturnType<typeof scanSkills>): MarketplaceJson {
  const owner = parseAuthor(pkg.author);

  return {
    name: deriveMarketplaceName(pkg.name),
    description: deriveMarketplaceDescription(pkg.description, pkg.name),
    owner,
    plugins: skills.map((s) => ({
      name: s.name,
      description: s.description,
      source: s.source,
      category: s.category,
      version: s.version,
      author: s.author,
    })),
  };
}

// ============ 主函数 ============

function main(): void {
  const args = process.argv.slice(2);
  const outputDirName = args[0] || '.claude-plugin';
  const cwd = process.cwd();
  const outputDir = resolve(cwd, outputDirName);

  console.log(`🔧 生成 Claude Plugin Marketplace 元数据 → ${outputDir}\n`);

  // 1. 读取 package.json
  const pkg = readPackageJson(cwd);
  console.log(`   读取 package.json: ${pkg.name}@${pkg.version}`);

  // 2. 扫描 skills 目录
  const skills = scanSkills(cwd);
  console.log(`   扫描到 ${skills.length} 个技能:`);
  for (const s of skills) {
    console.log(`     - [${s.category}] ${s.name}@${s.version}`);
  }

  // 3. 生成 marketplace.json
  const marketplaceJson = generateMarketplaceJson(pkg, skills);

  // 4. 写入文件
  const marketplacePath = join(outputDir, 'marketplace.json');

  if (!existsSync(outputDir)) {
    console.log(`   输出目录不存在，自动创建: ${outputDir}`);
    mkdirSync(outputDir, { recursive: true });
  }

  writeJson(marketplacePath, marketplaceJson);
  console.log(`\n✅ 已生成: ${basename(marketplacePath)}`);

  console.log(`\n📦 Marketplace: ${marketplaceJson.name}`);
  console.log(`   Description: ${marketplaceJson.description}`);
  console.log(`   Plugins（共 ${marketplaceJson.plugins.length} 项）:`);
  for (const p of marketplaceJson.plugins) {
    console.log(`     • ${p.name} (${p.category})`);
  }
}

main();
