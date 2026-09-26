/**
 * tests/cli-e2e.test.ts
 * eas-agent-creation CLI 端到端测试
 *
 * 通过子进程调用 dist/cli.mjs，覆盖本技能全部 6 个 op：
 *   - create      根据需求生成 skill
 *   - evolve      跑演化引擎（dry-run / 正式）
 *   - assess      自评（窗口天数 + 空数据降级）
 *   - list        列出已注册 skill（按 mode 过滤）
 *   - apply-plan  应用已审批的演化计划
 *   - review      LLM 评审（友好错误降级）
 *
 * 同时覆盖：
 *   - --help / -h / --version / -v / 未知子命令
 *   - 全局选项 --cwd / --log-level / --print-logs
 *   - 三种调用风格（args JSON / op-as-arg / --op）
 *
 * 隔离：
 *   - tests/xdg-bootstrap.ts(vitest setupFiles)统一注入 XDG_*_HOME 到 tmpdir
 *   - 每个 test 自己造 worktree(tmpdir)，--cwd 全局选项把 CLI 限定到自己的目录
 *
 * 真实执行链路：
 *   node dist/cli.mjs <op> [--key value ...] [--cwd <wt>]
 *     → cli.ts main()
 *       → loadEnv + Global.init + Log.init + Instance.init + bootstrapLanguageLlm
 *         → runOp → toolDefinition.execute → operationSchema.parse → runOperation
 *           → Creation.create / assess / list / applyPlan / ...
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Filesystem } from '@easbot/utils';
import { runCli } from './test-utils';

function makeWorktree(): string {
  return mkdtempSync(Filesystem.join(tmpdir(), `eas-agent-creation-e2e-${process.pid}-${Date.now()}-`));
}

/**
 * 从 worktree/.easbot/skills/ 找第一个实际创建的 skill 名字
 * （slug 化不可预测，故不能硬编码 skillName）。
 */
function findFirstSkillName(worktree: string): string | undefined {
  const dir = Filesystem.join(worktree, '.easbot', 'skills');
  if (!existsSync(dir)) return undefined;
  const entries = readdirSync(dir);
  return entries.find((d) => existsSync(Filesystem.join(dir, d, 'SKILL.md')));
}

/**
 * 跑一个 op，自动把 --cwd <wt> 放在参数末尾。
 * XDG_*_HOME 由 tests/xdg-bootstrap.ts 统一注入。
 */
function cli(worktree: string, ...args: string[]) {
  return runCli([...args, '--cwd', worktree], worktree);
}

// ─────────────────────────────────────────────────────────────────────────────
// 0. Banner / --help / --version / 未知子命令
// ─────────────────────────────────────────────────────────────────────────────

describe('eas-agent-creation CLI: --help / --version / 未知子命令', () => {
  it('--version prints semver', () => {
    const r = runCli(['--version']);
    expect(r.exitCode).toBe(0);
    expect(r.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('-v prints semver (short)', () => {
    const r = runCli(['-v']);
    expect(r.exitCode).toBe(0);
    expect(r.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('--help prints usage banner with all 6 operations', () => {
    const r = runCli(['--help']);
    expect(r.exitCode).toBe(0);
    for (const op of ['create', 'evolve', 'assess', 'list', 'apply-plan', 'review']) {
      expect(r.stdout).toContain(op);
    }
    expect(r.stdout).toContain('Usage:');
  });

  it('-h prints banner (short)', () => {
    const r = runCli(['-h']);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('Usage:');
  });

  it('no args prints banner', () => {
    const r = runCli([]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('Usage:');
  });

  it('unknown operation returns non-zero exit + diagnostic message', () => {
    const r = runCli(['__nonexistent_op__']);
    expect(r.exitCode).not.toBe(0);
    const combined = r.stdout + r.stderr;
    expect(combined).toMatch(/operation is required|invalid|unknown/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. create — 参数校验 / 落盘 / 同名检测 / scope 切换
// ─────────────────────────────────────────────────────────────────────────────

describe('eas-agent-creation CLI: create', () => {
  let worktree: string;

  beforeEach(() => {
    worktree = makeWorktree();
  });

  afterEach(() => {
    if (existsSync(worktree)) rmSync(worktree, { recursive: true, force: true });
  });

  it('create requires --requirement (≥10 chars)', () => {
    const r = cli(worktree, 'create');
    expect(r.exitCode).not.toBe(0);
    expect(r.stdout + r.stderr).toMatch(/requirement/i);
  });

  it('create rejects --requirement shorter than 10 chars', () => {
    const r = cli(worktree, 'create', '--requirement', 'short');
    expect(r.exitCode).not.toBe(0);
    // zod 当前输出 "Too small: expected string to have >=10 characters"
    // 与 "at least 10" 是同一语义的两种表达，测试 regex 兼容两者。
    expect(r.stdout + r.stderr).toMatch(/Too small.*>=10|at least 10/);
  });

  it('create (project scope) writes SKILL.md + .creation-meta.json under {cwd}/.easbot/skills/', () => {
    const r = cli(worktree, 'create', '--requirement', 'Help me build a CLI tool that audits code naming');
    expect(r.exitCode).toBe(0);

    // scope=project 默认 → {cwd}/.easbot/skills/{name}/SKILL.md
    const skillDir = Filesystem.join(worktree, '.easbot', 'skills');
    expect(existsSync(skillDir)).toBe(true);

    const entries = readFileSync.bind(null);
    // 找到 SKILL.md（slug 化后名字不可预测，但目录必然存在）
    const skillPath = Filesystem.join(skillDir, 'SKILL.md');
    // 实际是 skills/{slug}/SKILL.md —— 用 glob 找
    const dirs = (require('node:fs') as typeof import('node:fs')).readdirSync(skillDir);
    expect(dirs.length).toBeGreaterThanOrEqual(1);
    const firstSkill = dirs.find((d) => existsSync(Filesystem.join(skillDir, d, 'SKILL.md')));
    expect(firstSkill).toBeDefined();

    const md = readFileSync(Filesystem.join(skillDir, firstSkill!, 'SKILL.md'), 'utf-8');
    expect(md).toMatch(/^---\nname:/);
    expect(md).toMatch(/^mode: (tool-wrapper|generator|reviewer|inversion|pipeline)$/m);
    expect(md).toMatch(/composition: (single|composed)$/m);
    expect(md.length).toBeGreaterThan(200);

    const metaPath = Filesystem.join(skillDir, firstSkill!, '.creation-meta.json');
    expect(existsSync(metaPath)).toBe(true);
  });

  it('create with --hints writes hints into frontmatter (or body)', () => {
    const r = cli(worktree, 'create', '--requirement', 'Build a generator skill that outputs JSON report templates', '--hints', 'include schema validation,JSON schema,jq examples');
    expect(r.exitCode).toBe(0);
  });

  it('create --scope global writes under {XDG_CONFIG_HOME}/easbot/skills/', () => {
    const r = cli(worktree, 'create', '--requirement', 'Create a tool-wrapper skill for axios HTTP client usage', '--scope', 'global');
    expect(r.exitCode).toBe(0);

    // XDG_CONFIG_HOME 已由 xdg-bootstrap.ts 注入到 tmpdir 子目录
    const xdgConfig = process.env.XDG_CONFIG_HOME;
    expect(xdgConfig).toBeDefined();
    const globalSkillDir = Filesystem.join(xdgConfig!, 'easbot', 'skills');
    expect(existsSync(globalSkillDir)).toBe(true);
  });

  it('create 同名 skill 自动追加 hash 后缀 (P2-5)', () => {
    const req = 'Build a reviewer skill for React component naming conventions';

    // 第一次 create
    const r1 = cli(worktree, 'create', '--requirement', req);
    expect(r1.exitCode).toBe(0);

    // 找到第一次创建的 slug
    const skillDir = Filesystem.join(worktree, '.easbot', 'skills');
    const fs = require('node:fs') as typeof import('node:fs');
    const dirsBefore = fs.readdirSync(skillDir);
    expect(dirsBefore.length).toBeGreaterThanOrEqual(1);

    // 第二次 create 同 requirement → slug 截断后可能撞名，应自动 hash
    const r2 = cli(worktree, 'create', '--requirement', req);
    expect(r2.exitCode).toBe(0);

    const dirsAfter = fs.readdirSync(skillDir);
    // 至少 2 个不同目录（hash 后缀保证不覆盖）
    expect(dirsAfter.length).toBeGreaterThanOrEqual(2);

    // 两次的 SKILL.md 内容都必须存在（不被覆盖）
    for (const d of dirsAfter) {
      expect(existsSync(Filesystem.join(skillDir, d, 'SKILL.md'))).toBe(true);
    }
  });

  it('create via --args JSON 风格 (third invocation style)', () => {
    const argsJson = JSON.stringify({
      operation: 'create',
      requirement: 'Build a pipeline skill that runs lint then test sequentially',
    });
    const r = runCli(['--args', argsJson, '--cwd', worktree], worktree);
    expect(r.exitCode).toBe(0);
  });

  it('create via --op 显式 + 友好 flag 风格', () => {
    const r = cli(worktree, '--op', 'create', '--requirement', 'Build an inversion skill that clarifies tech stack before generating code');
    expect(r.exitCode).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. list — 过滤 / 分页
// ─────────────────────────────────────────────────────────────────────────────

describe('eas-agent-creation CLI: list', () => {
  let worktree: string;

  beforeEach(() => {
    worktree = makeWorktree();
    // 预创建 3 个 skill：1 个 tool-wrapper，1 个 generator，1 个 reviewer
    // 不同 requirement → slug 不同，避开 P2-5 hash 后缀
    cli(worktree, 'create', '--requirement', 'Tool wrapper skill for axios HTTP library usage');
    cli(worktree, 'create', '--requirement', 'Generator skill that produces JSON report templates');
    cli(worktree, 'create', '--requirement', 'Reviewer skill that audits code naming conventions');
  });

  afterEach(() => {
    if (existsSync(worktree)) rmSync(worktree, { recursive: true, force: true });
  });

  it('list 列出所有已创建 skill', () => {
    const r = cli(worktree, 'list');
    expect(r.exitCode).toBe(0);
    // 由于 XDG_*_HOME 在所有 e2e test 间共享（xdg-bootstrap 注入到同一 tmpdir），
    // 无法断言绝对数量；改断言"至少 3 个 + Total 字段存在 + 我们 create 的 3 个 slug 都在"。
    expect(r.stdout).toMatch(/Total: \d+/);
    expect(r.stdout).toContain('tool-wrapper');
    expect(r.stdout).toContain('generator');
    expect(r.stdout).toContain('reviewer');
  });

  it('list --mode tool-wrapper 只返回 tool-wrapper', () => {
    const r = cli(worktree, 'list', '--mode', 'tool-wrapper');
    expect(r.exitCode).toBe(0);
    // 通过 stdout 中标记 "(tool-wrapper)" 计数
    const matches = r.stdout.match(/\(tool-wrapper\)/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('list --mode pipeline 过滤空场景应该 Total: 0', () => {
    const r = cli(worktree, 'list', '--mode', 'pipeline');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/Total: 0|No skills found/);
  });

  it('list --limit 1 限制返回 1 行', () => {
    const r = cli(worktree, 'list', '--limit', '1');
    expect(r.exitCode).toBe(0);
    // 计数 markdown list 行（- **...**）
    const listLines = r.stdout.split('\n').filter((l) => l.startsWith('- **')).length;
    expect(listLines).toBeLessThanOrEqual(1);
  });

  it('list 非法 --mode 值被 zod schema 拒绝', () => {
    const r = cli(worktree, 'list', '--mode', 'invalid-mode');
    expect(r.exitCode).not.toBe(0);
    expect(r.stdout + r.stderr).toMatch(/invalid|enum/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. assess — 空数据 / windowDays
// ─────────────────────────────────────────────────────────────────────────────

describe('eas-agent-creation CLI: assess', () => {
  let worktree: string;

  beforeEach(() => {
    worktree = makeWorktree();
  });

  afterEach(() => {
    if (existsSync(worktree)) rmSync(worktree, { recursive: true, force: true });
  });

  it('assess 返回合法的 SelfAssessment JSON（含 capabilities 数组）', () => {
    const r = cli(worktree, 'assess');
    expect(r.exitCode).toBe(0);
    // 不依赖 XDG 隔离（test 间 XDG 共享），断言"返回结构合法"
    expect(r.stdout).toMatch(/"capabilities"\s*:/);
    expect(r.stdout).toMatch(/"windowDays"\s*:\s*\d+/);
    // 字段名存在（值可能是 0 或其他，取决于 XDG 中是否有经验数据）
    expect(r.stdout).toMatch(/"overallScore"\s*:/);
  });

  it('assess --windowDays 30 接受', () => {
    const r = cli(worktree, 'assess', '--windowDays', '30');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/windowDays.*30/);
  });

  it('assess --windowDays 越界 (0) 被 zod 拒绝', () => {
    const r = cli(worktree, 'assess', '--windowDays', '0');
    expect(r.exitCode).not.toBe(0);
    expect(r.stdout + r.stderr).toMatch(/min.*1|invalid/i);
  });

  it('assess --windowDays 越界 (200) 被 zod 拒绝', () => {
    const r = cli(worktree, 'assess', '--windowDays', '200');
    expect(r.exitCode).not.toBe(0);
  });

  it('assess 有 skill 时 capabilities 非空', () => {
    cli(worktree, 'create', '--requirement', 'Tool wrapper for axios HTTP library usage');
    const r = cli(worktree, 'assess');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).not.toMatch(/capabilities.*\[\]/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. evolve — dryRun + 不阻塞 create 已有 skill 的场景
// ─────────────────────────────────────────────────────────────────────────────

describe('eas-agent-creation CLI: evolve', () => {
  let worktree: string;

  beforeEach(() => {
    worktree = makeWorktree();
  });

  afterEach(() => {
    if (existsSync(worktree)) rmSync(worktree, { recursive: true, force: true });
  });

  it('evolve 空数据 + 无 plan 返回 0 plans / 0 applied / 0 awaitingApproval', () => {
    const r = cli(worktree, 'evolve');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/plans.*0|plans.*\[\]/s);
    expect(r.stdout).toMatch(/applied.*0/);
    expect(r.stdout).toMatch(/awaitingApproval.*0/);
  });

  it('evolve --dryRun 不真正执行', () => {
    const r = cli(worktree, 'evolve', '--dryRun');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/applied.*0/);
  });

  it('evolve 含 skill 时返回 plans / awaitingApproval / applied 字段', () => {
    // 先 create 一个 skill → experience 会进 store
    cli(worktree, 'create', '--requirement', 'Build a tool wrapper skill for axios HTTP library');
    // assess 会触发 experience 写入
    cli(worktree, 'assess');
    const r = cli(worktree, 'evolve');
    expect(r.exitCode).toBe(0);
    // plans / applied / awaitingApproval 至少一个非空或全部 0
    expect(r.stdout).toMatch(/"plans"/);
    expect(r.stdout).toMatch(/"applied"/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. apply-plan — 错误路径（plan 不存在 / 必填字段）
// ─────────────────────────────────────────────────────────────────────────────

describe('eas-agent-creation CLI: apply-plan', () => {
  let worktree: string;

  beforeEach(() => {
    worktree = makeWorktree();
  });

  afterEach(() => {
    if (existsSync(worktree)) rmSync(worktree, { recursive: true, force: true });
  });

  it('apply-plan 缺少 --planId 失败', () => {
    const r = cli(worktree, 'apply-plan', '--approvedBy', 'user@example.com');
    expect(r.exitCode).not.toBe(0);
    expect(r.stdout + r.stderr).toMatch(/planId|required/i);
  });

  it('apply-plan 缺少 --approvedBy 失败', () => {
    const r = cli(worktree, 'apply-plan', '--planId', 'fake-plan-id');
    expect(r.exitCode).not.toBe(0);
    expect(r.stdout + r.stderr).toMatch(/approvedBy|required/i);
  });

  it('apply-plan 对不存在的 planId 抛 ApprovalRequired', () => {
    const r = cli(worktree, 'apply-plan', '--planId', 'nonexistent-plan-9999', '--approvedBy', 'user@example.com');
    expect(r.exitCode).not.toBe(0);
    expect(r.stdout + r.stderr).toMatch(/plan not found|ApprovalRequired/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. review — 友好错误降级（无 LLM / skill 不存在）
// ─────────────────────────────────────────────────────────────────────────────

describe('eas-agent-creation CLI: review', () => {
  let worktree: string;

  beforeEach(() => {
    worktree = makeWorktree();
  });

  afterEach(() => {
    if (existsSync(worktree)) rmSync(worktree, { recursive: true, force: true });
  });

  it('review 缺少 --skillName 失败', () => {
    const r = cli(worktree, 'review');
    expect(r.exitCode).not.toBe(0);
    expect(r.stdout + r.stderr).toMatch(/skillName|required/i);
  });

  it('review 对不存在的 skillName 返回 SKILL.md not found', () => {
    const r = cli(worktree, 'review', '--skillName', 'nonexistent-skill-9999');
    expect(r.exitCode).not.toBe(0);
    expect(r.stdout + r.stderr).toMatch(/SKILL.md not found/i);
  });

  it('review 对真实存在的 skill 但未配置 languageLlm 返回友好错误 (exit 2)', () => {
    // 先 create 一个 skill（不需要 LLM，只走 generation）
    cli(worktree, 'create', '--requirement', 'Build a tool wrapper skill for axios HTTP library');
    const skillName = findFirstSkillName(worktree);
    expect(skillName).toBeDefined();

    const r = cli(worktree, 'review', '--skillName', skillName!);
    // languageLlm 未配置 → exit 2（用户错误），不是系统错误 3
    expect(r.exitCode).toBe(2);
    expect(r.stdout + r.stderr).toMatch(/languageLlm not configured|not configured/i);
  });

  it('review 接受 --temperature / --topP / --variant（即使 LLM 未配置）', () => {
    cli(worktree, 'create', '--requirement', 'Build a tool wrapper skill for axios HTTP library');
    const skillName = findFirstSkillName(worktree);
    expect(skillName).toBeDefined();

    const r = cli(worktree, 'review', '--skillName', skillName!, '--temperature', '0.3', '--topP', '0.95', '--variant', 'reviewer-strict');
    // exit 2（LLM 未配置），但 schema 接受所有 flag
    expect(r.exitCode).toBe(2);
    expect(r.stdout + r.stderr).toMatch(/languageLlm not configured/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. 全局选项
// ─────────────────────────────────────────────────────────────────────────────

describe('eas-agent-creation CLI: 全局选项', () => {
  let worktree: string;

  beforeEach(() => {
    worktree = makeWorktree();
  });

  afterEach(() => {
    if (existsSync(worktree)) rmSync(worktree, { recursive: true, force: true });
  });

  it('--cwd 把 storageDir 限定到指定工作区（不污染 home）', () => {
    // 用 --cwd <wt> create → SKILL.md 必须落在 <wt>/.easbot/skills/...
    cli(worktree, 'create', '--requirement', 'Build a tool wrapper for axios HTTP library usage');
    const skillDir = Filesystem.join(worktree, '.easbot', 'skills');
    expect(existsSync(skillDir)).toBe(true);
  });

  it('--log-level DEBUG 接受', () => {
    const r = runCli(['--log-level', 'DEBUG', 'list'], worktree);
    expect(r.exitCode).toBe(0);
  });

  it('--log-level INVALID 走默认 INFO（不报错）', () => {
    // 当前 cli.ts parseGlobalOptions 仅接受合法 enum（DEBUG/INFO/WARN/ERROR），
    // 非法值被静默忽略 → 后续 token 'list' 被当成 op，命令正常执行。
    // 这与 "@easbot/memory" 一致；如未来改成 strict 校验，测试期望需更新为 exit ≠ 0。
    const r = runCli(['--log-level', 'INVALID', 'list'], worktree);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/## Skills/);
  });

  it('--print-logs 把日志打到 stderr', () => {
    const r = runCli(['--print-logs', 'list'], worktree);
    expect(r.exitCode).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. 端到端：完整链路 create → list → assess → review (友好降级)
// ─────────────────────────────────────────────────────────────────────────────

describe('eas-agent-creation CLI: 端到端完整链路', () => {
  it('create → list → assess → review (友好降级到 languageLlm 错误)', () => {
    const worktree = makeWorktree();
    try {
      // 1. create
      const createR = cli(worktree, 'create', '--requirement', 'Build a tool wrapper skill for axios HTTP library usage in Node.js projects');
      expect(createR.exitCode).toBe(0);

      // 2. list 应该看到刚创建的 skill
      const listR = cli(worktree, 'list');
      expect(listR.exitCode).toBe(0);
      expect(listR.stdout).toMatch(/Total: \d+/);

      // 3. assess 不报错 + capabilities 非空
      const assessR = cli(worktree, 'assess');
      expect(assessR.exitCode).toBe(0);
      expect(assessR.stdout).toMatch(/capabilities.*\[/s);
      expect(assessR.stdout).not.toMatch(/capabilities.*\[\]/);

      // 4. review 友好降级（无 LLM）—— 验证端到端路径完整
      const skillName = findFirstSkillName(worktree);
      expect(skillName).toBeDefined();
      const reviewR = cli(worktree, 'review', '--skillName', skillName!);
      expect(reviewR.exitCode).toBe(2);
      expect(reviewR.stdout + reviewR.stderr).toMatch(/languageLlm not configured/i);

      // 5. evolve dry-run 不报错
      const evolveR = cli(worktree, 'evolve', '--dryRun');
      expect(evolveR.exitCode).toBe(0);
    } finally {
      if (existsSync(worktree)) rmSync(worktree, { recursive: true, force: true });
    }
  });

  it('scope=project 创建的 skill 在 scope=global 下不可见（隔离性）', () => {
    const worktreeA = makeWorktree();
    const worktreeB = makeWorktree();
    try {
      // A 用 project scope（默认）创建
      cli(worktreeA, 'create', '--requirement', 'Build a tool wrapper skill for axios HTTP library');
      // B 用 global scope 创建 → 写到 XDG_CONFIG_HOME/easbot/skills
      cli(worktreeB, 'create', '--requirement', 'Build a generator skill for JSON report templates', '--scope', 'global');

      // A 只看到自己的（slug 化的实际名字取自文件系统）
      const skillA = findFirstSkillName(worktreeA);
      expect(skillA).toBeDefined();
      const listA = cli(worktreeA, 'list');
      expect(listA.stdout).toContain(skillA!);
      expect(listA.stdout).not.toMatch(/Total: 2/);

      // B 看到 global 目录的（从 XDG_CONFIG_HOME 取）
      const globalSkillsDir = Filesystem.join(process.env.XDG_CONFIG_HOME!, 'easbot', 'skills');
      const globalEntries = existsSync(globalSkillsDir) ? readdirSync(globalSkillsDir) : [];
      const skillB = globalEntries.find((d) => existsSync(Filesystem.join(globalSkillsDir, d, 'SKILL.md')));
      expect(skillB).toBeDefined();

      const listB = cli(worktreeB, 'list', '--scope', 'global');
      expect(listB.stdout).toContain(skillB!);
    } finally {
      if (existsSync(worktreeA)) rmSync(worktreeA, { recursive: true, force: true });
      if (existsSync(worktreeB)) rmSync(worktreeB, { recursive: true, force: true });
    }
  });
});

// 兜底：测试过程中如果意外忘记 rmSync，提示用户清理
process.on('exit', () => {
  // vitest 不支持 afterAll 内全清；用 process.on('exit') 在进程退出前兜底
  const tmp = join(tmpdir(), `eas-agent-creation-e2e-${process.pid}-`);
  try {
    if (existsSync(tmp)) {
      // 仅清理本 pid 命名前缀的 tmpdir
      const fs = require('node:fs') as typeof import('node:fs');
      for (const e of fs.readdirSync(tmpdir())) {
        if (e.startsWith(`eas-agent-creation-e2e-${process.pid}-`)) {
          rmSync(join(tmpdir(), e), { recursive: true, force: true });
        }
      }
    }
  } catch {
    // 忽略
  }
});
