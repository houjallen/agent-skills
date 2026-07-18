#!/usr/bin/env tsx
/**
 * eas-planning-writer 技能测试脚本
 * 验证所有 .ts 脚本是否正常工作并与技能定义保持一致
 */

import { spawnSync } from 'child_process';
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';

interface TestResult {
  name: string;
  pass: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runScript(scriptRelPath: string, args: string[] = []): { code: number; stdout: string; stderr: string } {
  const scriptPath = path.join(__dirname, scriptRelPath);
  const result = spawnSync('npx', ['tsx', scriptPath, ...args], {
    encoding: 'utf-8',
    shell: process.platform === 'win32',
  });
  return {
    code: result.status ?? -1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function testInitScript(): TestResult {
  // 烟雾测试：调用 --help 应退出 0
  const r = runScript('init-planning-session.ts', ['--help']);
  return {
    name: 'init-planning-session.ts --help',
    pass: r.code === 0,
    stdout: r.stdout,
    stderr: r.stderr,
    exitCode: r.code,
  };
}

async function testInitFunctionality(): Promise<TestResult> {
  // 创建临时目录，运行 init 脚本，检查三件套是否生成
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'eas-planning-test-'));
  const taskDir = path.join(tempDir, 'task');
  try {
    const r = runScript('init-planning-session.ts', ['--output', taskDir]);
    if (r.code !== 0) {
      return {
        name: 'init-planning-session.ts 落盘三件套',
        pass: false,
        stdout: r.stdout,
        stderr: r.stderr,
        exitCode: r.code,
      };
    }
    const expected = ['task_plan.md', 'findings.md', 'progress.md'];
    const checks = await Promise.all(
      expected.map(async (f) => {
        try {
          await fs.access(path.join(taskDir, f));
          return true;
        } catch {
          return false;
        }
      }),
    );
    const allOk = checks.every(Boolean);
    return {
      name: 'init-planning-session.ts 落盘三件套',
      pass: allOk,
      stdout: r.stdout,
      stderr: r.stderr,
      exitCode: 0,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

function testCheckCompleteScript(): TestResult {
  // 无参数：扫描 cwd 的 task_plan.md
  const r = runScript('check-complete.ts');
  return {
    name: 'check-complete.ts (无参数)',
    pass: r.code === 0 || r.code === 1, // exit 0/1 都是正常
    stdout: r.stdout,
    stderr: r.stderr,
    exitCode: r.code,
  };
}

async function testCheckCompleteWithFile(): Promise<TestResult> {
  // 准备一个 task_plan.md，验证报告输出
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'eas-planning-test-'));
  const planFile = path.join(tempDir, 'task_plan.md');
  const content = `# Test

## 阶段 (Phases)

### Phase 1: One
- [ ] item
- **Status:** complete

### Phase 2: Two
- [ ] item
- **Status:** in_progress
`;
  try {
    await fs.writeFile(planFile, content, 'utf-8');
    const r = runScript('check-complete.ts', [planFile]);
    const ok = r.code === 0 && /1\/2 phases complete/.test(r.stdout);
    return {
      name: 'check-complete.ts 报告阶段完成度',
      pass: ok,
      stdout: r.stdout,
      stderr: r.stderr,
      exitCode: r.code,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

function testSessionCatchupScript(): TestResult {
  // 无项目路径参数：不崩溃即可
  const r = runScript('session-catchup.ts', [os.tmpdir()]);
  return {
    name: 'session-catchup.ts (无项目历史应静默退出)',
    pass: r.code === 0,
    stdout: r.stdout,
    stderr: r.stderr,
    exitCode: r.code,
  };
}

function printResult(r: TestResult): void {
  const tag = r.pass ? '[PASS]' : '[FAIL]';
  console.log(`${tag} ${r.name}`);
  if (!r.pass) {
    if (r.stderr) console.log(`  stderr: ${r.stderr.trim()}`);
    if (r.stdout) console.log(`  stdout: ${r.stdout.trim()}`);
    console.log(`  exitCode: ${r.exitCode}`);
  }
}

async function main(): Promise<void> {
  console.log('EAS-PLANNING-WRITER Skill Validation Test');
  console.log('='.repeat(60));

  const results: TestResult[] = [];
  results.push(testInitScript());
  results.push(await testInitFunctionality());
  results.push(testCheckCompleteScript());
  results.push(await testCheckCompleteWithFile());
  results.push(testSessionCatchupScript());

  console.log('\nTest Results');
  console.log('='.repeat(60));
  for (const r of results) printResult(r);

  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  console.log(`\nOverall: ${passed}/${total} (${((passed / total) * 100).toFixed(1)}%)`);

  if (passed === total) {
    console.log('\nAll tests passed! eas-planning-writer skill validation successful.');
    process.exit(0);
  } else {
    console.log(`\n${total - passed} test(s) failed. Please check the .ts scripts.`);
    process.exit(1);
  }
}

// 只有在直接运行此脚本时才执行主函数（ESM 入口检测）
const isDirectRun = (() => {
  try {
    return process.argv.some((arg) => arg === __filename || arg.endsWith(__filename.replace(/\\/g, '/')));
  } catch {
    return false;
  }
})();

if (isDirectRun) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Test runner error:', message);
    process.exit(1);
  });
}

export { runScript, testInitScript, testCheckCompleteScript, testSessionCatchupScript };
