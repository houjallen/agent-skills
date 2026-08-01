#!/usr/bin/env tsx
/**
 * .well-known/agent-skills/index.json 生成脚本（v1.0.0）
 *
 * 用途：把所有技能以 `well-known` 协议暴露给外部 Agent 加载器（例如
 * `@easbot/plugin` 的 `WellKnownPluginSource`），实现"只给 URL + 走
 * `/.well-known/agent-skills/index.json` 即可发现 + 加载技能"。
 *
 * 物理流程：
 *   1. 扫描 `skills/<category>/<skill>/SKILL.md`（递归）
 *   2. 把 `skills/` 完整复制到 `<outDir>/skills/`（保留目录结构）
 *   3. 根据 SKILL.md frontmatter 写出 `<outDir>/index.json`（v1 schema）
 *
 * 输出目录结构：
 *   .well-known/agent-skills/
 *   ├── index.json
 *   └── skills/
 *       ├── builtin/<skill>/SKILL.md + scripts/ + references/ + assets/
 *       └── tools/<skill>/...
 *
 * v1 index.json 字段（**严格对齐 `@easbot/plugin` 的 `SkillMetadataSchema` 与
 * `source-parser.ts` 的 `owner/repo@subpath` 协议**）：
 *
 *   - $schema        字符串 schema URL（便于 IDE / validator 校验）
 *   - skills[]       每项 = 1 个技能
 *       - name         hyphen-case，与目录名一致（与 SkillMetadataSchema.name 对齐）
 *       - description  frontmatter description（与 SkillMetadataSchema.description 对齐）
 *       - sourceUrl    **绝对 URL**，指向 .well-known/agent-skills/skills/<cat>/<skill>/SKILL.md
 *                       （绝对 URL 跨 host / 跨 entry 调用均不会断链；前端解析时直接 fetch）
 *       - installName  `<owner>/<repo>@<skill-name>`（**用 `@` 隔**，与
 *                       source-parser.ts 的 `owner/repo@subpath` 协议一致，
 *                       喂给 store pluginId 时可直接走 parsePluginId）
 *       - scope        （可选）general / coder / all（与 SkillMetadataSchema.scope 对齐；
 *                       缺省 = 'all'，由 agent runtime 推断）
 *
 * **不**包含（与决策 0034 字段最小化一致）：
 *   - version（前端从 SKILL.md frontmatter 读；写死会 stale）
 *   - category / group（与 plugin.category 命名冲突；本 schema 用物理目录结构 builtin/tools 表达）
 *   - endpoint / source / generated_at（项目解析器只看 `$schema` + `skills[]`）
 *   - tags / metadata / owner / author（过度字段，决策 0014）
 *
 * 用法：
 *   npx tsx scripts/generate-well-known.ts                         # 默认：skills/ → .well-known/agent-skills/
 *   npx tsx scripts/generate-well-known.ts <srcDir> <outDir>       # 自定义输入输出
 *   npx tsx scripts/generate-well-known.ts --no-copy               # 只生成 index.json，不复制 skill 文件
 *   npx tsx scripts/generate-well-known.ts --no-clean              # 增量追加（不删除已有文件）
 *   npx tsx scripts/generate-well-known.ts --endpoint-url <url>   # 显式指定 endpoint 绝对 URL
 *                                                         （默认 = "https://easbot.cn/skills/.well-known/agent-skills"）
 *
 * 默认行为：先清空 outDir 再生成，确保每次重新生成得到完整重建结果。
 * 安全护栏：仅当 outDir 位于 cwd 内部时才允许删除，避免误删用户路径。
 *
 * 依赖：零外部依赖（仅 node:fs / node:path / node:url）。
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
  cpSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, relative, resolve, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

// ============ 常量 ============

const SCHEMA_URL = 'https://easbot.cn/schemas/agent-skills/index.v1.json';
const INDEX_FILENAME = 'index.json';
const SKILL_BUNDLE_DIR = 'skills'; // 输出目录内承载 skill 树的子目录名

const OWNER = 'easbot';
const REPO = 'agent-skills';

/**
 * 脚本默认的 endpoint 绝对 URL（与发布路径对齐）。
 *
 * sourceUrl 字段 = endpointUrl + '/' + relPath（如 `${endpointUrl}/skills/builtin/eas-skill-using/SKILL.md`）。
 * 用绝对 URL 让前端解析器无需关心 base URL；跨 host / 跨 entry 调用都不会断链。
 *
 * 通过 `--endpoint-url <url>` 覆盖（用于 staging / 内部测试）。
 */
const DEFAULT_ENDPOINT_URL = 'https://easbot.cn/skills/.well-known/agent-skills';

// ============ 类型 ============

interface PackageJson {
  name: string;
  version: string;
  repository?: string | { type?: string; url?: string };
}

interface SkillFrontmatter {
  name?: string;
  description?: string;
  /** 上下文模式（general / coder / all），与 SkillMetadataSchema.scope 对齐 */
  scope?: string;
  [key: string]: unknown;
}

interface IndexSchema {
  $schema: string;
  skills: IndexSkill[];
}

interface IndexSkill {
  name: string;
  description: string;
  /** 绝对 URL（与 index.json endpoint 拼接），前端可直接 fetch */
  sourceUrl: string;
  /** `<owner>/<repo>@<skill-name>`（用 `@` 隔，与 source-parser 协议一致） */
  installName: string;
  /** 上下文模式：general / coder / all；缺省 = 'all' */
  scope?: string;
}

// ============ 工具函数 ============

/**
 * 把绝对路径转成 POSIX 风格相对路径（统一输出格式）。
 */
function toPosixRel(from: string, to: string): string {
  return relative(from, to).split(sep).join('/');
}

/**
 * 简易 YAML frontmatter 解析（仅支持脚本所需字段；不需要完整 YAML 解析）。
 *
 * 支持：
 *   - 顶级 key: value
 *   - 行内数组 [a, b, c]
 *   - 多行数组
 *   - 双引号 / 单引号 / 无引号字符串
 *
 * 不支持：嵌套对象、多行字符串（| / >）、复杂 YAML 特性。
 * 如未来需要更复杂解析，可替换为 js-yaml（已加入 package.json devDependencies）。
 */
function parseFrontmatter(content: string): SkillFrontmatter {
  const clean = content.replace(/^\uFEFF/, '');
  if (!clean.startsWith('---')) return {};

  const lines = clean.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') return {};

  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === '---') {
      endIndex = i;
      break;
    }
  }
  if (endIndex === -1) return {};

  const result: SkillFrontmatter = {};
  let currentKey: string | null = null;
  let currentArray: string[] | null = null;

  const flushArray = () => {
    if (currentKey && currentArray) {
      (result as Record<string, unknown>)[currentKey] = currentArray;
    }
    currentKey = null;
    currentArray = null;
  };

  for (const rawLine of lines.slice(1, endIndex)) {
    const line = rawLine.replace(/\s+$/, '');
    if (!line.trim()) continue;

    // 顶层键
    if (/^[a-zA-Z_][a-zA-Z0-9_-]*\s*:/.test(line)) {
      flushArray();
      const colonIndex = line.indexOf(':');
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      if (value === '' || value === '|' || value === '>') {
        currentKey = key;
        continue;
      }

      // 行内数组
      if (value.startsWith('[') && value.endsWith(']')) {
        const inner = value.slice(1, -1).trim();
        const items = inner
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
        (result as Record<string, unknown>)[key] = items;
        continue;
      }

      // 普通字符串值
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
  flushArray();

  return result;
}

/**
 * 读取 package.json（解析 version 与 repository URL）。
 */
function readPackageJson(cwd: string): PackageJson {
  const pkgPath = join(cwd, 'package.json');
  if (!existsSync(pkgPath)) {
    throw new Error(`未找到 package.json: ${pkgPath}`);
  }
  return JSON.parse(readFileSync(pkgPath, 'utf-8')) as PackageJson;
}

/**
 * 从 repository.url 提取 `<owner>/<repo>` 形式。
 * 兼容 git@、git+https://、https:// 等多种格式。
 */
function deriveRepoSlug(repoUrl: string | undefined): string {
  if (!repoUrl) return `${OWNER}/${REPO}`;
  // git+https://github.com/owner/repo.git → owner/repo
  // https://github.com/owner/repo.git → owner/repo
  // git@github.com:owner/repo.git → owner/repo
  const m1 = repoUrl.match(/(?:[:/])github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (m1) return `${m1[1]}/${m1[2]}`;
  return `${OWNER}/${REPO}`;
}

/**
 * 递归扫描 srcDir 下所有技能目录（每个含 SKILL.md 的目录）。
 *
 * 约定结构：<srcDir>/<category>/<skill>/SKILL.md
 *   - category  ∈ { builtin, tools }（来自仓库约定）
 *   - skill     hyphen-case，与目录名一致
 */
function scanSkills(srcDir: string): Array<{
  category: string;
  skillName: string;
  skillDir: string;
  frontmatter: SkillFrontmatter;
}> {
  if (!existsSync(srcDir)) {
    throw new Error(`srcDir 不存在: ${srcDir}`);
  }

  const result: Array<{
    category: string;
    skillName: string;
    skillDir: string;
    frontmatter: SkillFrontmatter;
  }> = [];

  const categories = readdirSync(srcDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const category of categories) {
    const categoryPath = join(srcDir, category);
    const skillDirs = readdirSync(categoryPath, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();

    for (const skillName of skillDirs) {
      const skillPath = join(categoryPath, skillName);
      const skillMdPath = join(skillPath, 'SKILL.md');
      if (!existsSync(skillMdPath)) {
        console.warn(`⚠️  跳过 ${category}/${skillName}：未找到 SKILL.md`);
        continue;
      }

      const content = readFileSync(skillMdPath, 'utf-8');
      const fm = parseFrontmatter(content);
      if (!fm.name || !fm.description) {
        console.warn(`⚠️  跳过 ${category}/${skillName}：SKILL.md 缺少 name/description frontmatter`);
        continue;
      }

      result.push({
        category,
        skillName,
        skillDir: skillPath,
        frontmatter: fm,
      });
    }
  }

  return result;
}

/**
 * 把 srcDir 整棵树复制到 outDir/skills/ 下（保留目录结构）。
 */
function copySkillsTree(srcDir: string, outDir: string): void {
  const dest = join(outDir, SKILL_BUNDLE_DIR);
  if (existsSync(dest)) {
    rmSync(dest, { recursive: true, force: true });
  }
  mkdirSync(dest, { recursive: true });

  // 过滤掉 macOS / Windows 噪声文件
  cpSync(srcDir, dest, {
    recursive: true,
    filter: (src) => {
      const base = src.split(sep).pop() ?? '';
      return base !== '.DS_Store' && base !== 'Thumbs.db';
    },
  });
  const stat = statSync(dest);
  console.log(`[copy] skills -> ${toPosixRel(process.cwd(), dest)}`);
  console.log(`       files: ${countFiles(dest)}`);
}

function countFiles(dir: string): number {
  let count = 0;
  const walk = (d: string) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) count++;
    }
  };
  walk(dir);
  return count;
}

/**
 * 构建 v1 index.json。
 *
 * 字段严格最小化（决策 0034）：
 *   - 仅输出 `$schema` + `skills[]`，每个 skill 含 `name/description/sourceUrl/installName[/scope]`
 *   - `sourceUrl` 走绝对 URL（基于 endpointUrl 拼接），前端 fetch 时无需关心 base
 *   - `installName` 用 `@` 隔（与 source-parser 协议一致）
 *   - 物理 builtin/tools 分类通过源目录结构表达，不入 schema
 */
function buildIndex(args: {
  pkg: PackageJson;
  skills: ReturnType<typeof scanSkills>;
  outDir: string;
  endpointUrl: string;
}): IndexSchema {
  const { pkg, skills, endpointUrl } = args;
  const repo = deriveRepoSlug(
    typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url,
  );

  // endpointUrl 去掉尾斜杠（拼 sourceUrl 时保持一致）
  const baseUrl = endpointUrl.replace(/\/+$/, '');

  return {
    $schema: SCHEMA_URL,
    skills: skills.map((s) => {
      const fm = s.frontmatter;
      const relPath = posix.join(
        SKILL_BUNDLE_DIR,
        s.category,
        s.skillName,
        'SKILL.md',
      );
      const skill: IndexSkill = {
        name: fm.name!,
        description: fm.description!,
        sourceUrl: `${baseUrl}/${relPath}`,
        installName: `${repo}@${s.skillName}`,
      };
      // scope 仅在 frontmatter 显式声明且合法值时写入；否则省略（运行时按 'all' 处理）
      const scope = fm.scope;
      if (scope === 'general' || scope === 'coder' || scope === 'all') {
        skill.scope = scope;
      }
      return skill;
    }),
  };
}

/**
 * 校验输出：路径必须指向 outDir 内（避免 ../ 越界）。
 */
function assertSafe(p: string, outDir: string): void {
  const resolved = resolve(p);
  const outResolved = resolve(outDir);
  if (!resolved.startsWith(outResolved)) {
    throw new Error(`非安全路径: ${p}`);
  }
}

// ============ CLI ============

interface CliOptions {
  srcDir: string;
  outDir: string;
  noCopy: boolean;
  clean: boolean;
  validate: boolean;
  endpointUrl: string;
}

function parseArgs(argv: string[]): CliOptions {
  const positional: string[] = [];
  let noCopy = false;
  let clean = true; // 默认每次重新生成都先清空 outDir
  let validate = false; // 默认不自校验；显式 --validate / --no-validate 启用
  let endpointUrl = DEFAULT_ENDPOINT_URL;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) continue;
    if (arg === '--no-copy') noCopy = true;
    else if (arg === '--no-clean') clean = false;
    else if (arg === '--validate') validate = true;
    else if (arg === '--no-validate') validate = false;
    else if (arg === '--endpoint-url' && i + 1 < argv.length) {
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        endpointUrl = next;
        i++;
      }
    } else if (arg.startsWith('--endpoint-url=')) {
      endpointUrl = arg.slice('--endpoint-url='.length);
    } else if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    } else if (arg.startsWith('--')) {
      console.warn(`⚠️  未知参数: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  const cwd = process.cwd();
  const srcDir = resolve(cwd, positional[0] ?? 'skills');
  const outDir = resolve(cwd, positional[1] ?? '.well-known/agent-skills');

  return { srcDir, outDir, noCopy, clean, validate, endpointUrl };
}

function printHelp(): void {
  console.log(`用法: npx tsx scripts/generate-well-known.ts [srcDir] [outDir] [--no-copy] [--no-clean] [--validate] [--endpoint-url <url>]

  srcDir    源目录（默认: skills/）
  outDir    输出目录（默认: .well-known/agent-skills/）
  --no-copy        只生成 index.json，不复制 skill 文件
  --no-clean       增量追加（不删除已有文件；默认会先清空 outDir）
  --validate       生成后自动运行 docs/schemas/agent-skills/validate-v1.cjs 校验契约
  --endpoint-url   显式指定 endpoint 绝对 URL（用于 sourceUrl 拼接；默认: ${DEFAULT_ENDPOINT_URL}）

  默认行为：先清空 outDir 再生成，确保每次重新生成得到完整重建结果。
  安全护栏：仅当 outDir 位于 cwd 内部时才允许删除，避免误删用户路径。

  示例:
    npx tsx scripts/generate-well-known.ts
    npx tsx scripts/generate-well-known.ts skills .well-known/agent-skills
    npx tsx scripts/generate-well-known.ts --no-copy
    npx tsx scripts/generate-well-known.ts --no-clean
    npx tsx scripts/generate-well-known.ts --validate
    npx tsx scripts/generate-well-known.ts --endpoint-url https://staging.easbot.cn/skills/.well-known/agent-skills
`);
}

// ============ 主函数 ============

function main(): void {
  const opts = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();

  console.log(`[generate] .well-known/agent-skills/`);
  console.log(`   srcDir:   ${toPosixRel(cwd, opts.srcDir)}`);
  console.log(`   outDir:   ${toPosixRel(cwd, opts.outDir)}`);
  console.log(`   copy:     ${opts.noCopy ? '❌' : '✅'}`);
  console.log(`   clean:    ${opts.clean ? '✅' : '❌'}`);
  console.log(`   validate: ${opts.validate ? '✅' : '❌'}`);
  console.log(`   endpoint: ${opts.endpointUrl}`);

  // 1. 清理 outDir（默认开启；--no-clean 关闭）
  //    安全护栏：outDir 必须位于 cwd 内部，否则拒绝删除，避免误删用户路径。
  if (opts.clean) {
    const outResolved = resolve(opts.outDir);
    const cwdResolved = resolve(cwd);
    const insideCwd =
      outResolved === cwdResolved || outResolved.startsWith(cwdResolved + sep);
    if (!insideCwd) {
      throw new Error(
        `outDir 不在 cwd 内，拒绝清理: ${outResolved} (cwd=${cwdResolved})。` +
          `如确实需要，请改用 --no-clean 手动管理。`,
      );
    }
    if (existsSync(outResolved)) {
      rmSync(outResolved, { recursive: true, force: true });
      console.log(`[clean]   ${toPosixRel(cwd, outResolved)} removed`);
    }
  }

  // 2. 确保输出目录
  mkdirSync(opts.outDir, { recursive: true });

  // 3. 扫描 skills
  const skills = scanSkills(opts.srcDir);
  console.log(`[scan]    ${skills.length} skill(s) found:`);
  for (const s of skills) {
    console.log(`   - [${s.category}] ${s.skillName}@${s.frontmatter.version ?? '0.1.0'}`);
  }

  // 4. 复制 skill 文件树
  if (!opts.noCopy) {
    copySkillsTree(opts.srcDir, opts.outDir);
  } else {
    console.log(`⏭️  跳过文件复制（--no-copy）`);
  }

  // 5. 构建 index.json
  const pkg = readPackageJson(cwd);
  const index = buildIndex({ pkg, skills, outDir: opts.outDir, endpointUrl: opts.endpointUrl });

  // 6. 写入 index.json
  const indexPath = join(opts.outDir, INDEX_FILENAME);
  assertSafe(indexPath, opts.outDir);
  writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, 'utf-8');
  console.log(`\n✅ 已生成: ${toPosixRel(cwd, indexPath)}`);
  console.log(`   skills: ${index.skills.length} 项`);
  console.log(`   schema: ${index.$schema}`);

  // 7. 自校验（生成完毕后立即用 docs/schemas/agent-skills/validate-v1.cjs 验证）
  if (opts.validate) {
    const validatorPath = resolve(cwd, 'docs/schemas/agent-skills/validate-v1.cjs');
    if (!existsSync(validatorPath)) {
      console.warn(`⚠️  校验器不存在: ${validatorPath}`);
      return;
    }
    console.log(`\n[validate] ${toPosixRel(cwd, validatorPath)}`);
    const result = spawnSync(
      process.execPath,
      [validatorPath, indexPath],
      { stdio: 'inherit', cwd },
    );
    if (result.status !== 0) {
      throw new Error(`validate-v1.cjs 校验失败（exit ${result.status}）`);
    }
  }
}

// 仅在作为主入口执行时调用 main
const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  try {
    main();
  } catch (err) {
    console.error(`\n❌ ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

export {
  parseFrontmatter,
  scanSkills,
  buildIndex,
  copySkillsTree,
  SCHEMA_URL,
};
export type { IndexSchema, IndexSkill, SkillFrontmatter };
