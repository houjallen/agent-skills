#!/usr/bin/env node
/**
 * EASBot Agent Skills CLI 入口（host process wrapper）
 *
 * 职责：作为 `easbot-agent-skills` 可执行文件的进程入口，把 argv 透传给
 * `@easbot/skills` 包暴露的程序化入口 `handleSkillsCli`，并把返回的
 * `SkillsCliResult.code` 作为进程退出码。
 *
 * 为什么不直接 fork `easbot-skills` 子进程：
 *   - 同进程内 import 可共享类型 / 错误堆栈 / telemetry 上下文
 *   - tsup 把本文件与库依赖一并打包进 dist/cli.mjs，避免 npx 解析路径
 *
 * 调用约定（与 @easbot/skills 0.3.x 对齐）：
 *   - args:   process.argv.slice(2)（不包含 node / 脚本路径）
 *   - deps:   { version, cwd } —— 透传本仓库 package.json 版本号
 *   - 返回值: { code: number; handled: boolean; command?: string }
 *     - code    进程退出码
 *     - handled 是否被库内部命令消费；false 时本 CLI 兜底为 1 + 用法
 *
 * 退出码语义：
 *   - result.code          → exit(result.code)（库自定义退出码直通）
 *   - result.handled=false → exit(1)（未识别子命令，兜底）
 *   - handleSkillsCli 抛错 → exit(1)（stderr 打印错误信息）
 */
import { handleSkillsCli } from '@easbot/skills';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ============ 本仓库版本号（透传给库做 banner / telemetry） ============

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 读取本仓库 package.json 的 version 字段。
 *
 * 路径策略：
 *   - dev（tsx 直接跑 src/cli.ts）：src/cli.ts → ../package.json
 *   - build（tsup 打包到 dist/cli.mjs）：dist/cli.ts → ../../package.json
 *
 * 同步读一次（启动时一次），IO 失败时降级为 'unknown'，不影响主流程。
 */
function readPkgVersion(): string {
  const candidates = [
    join(__dirname, '..', 'package.json'), // dev: src/ → root
    join(__dirname, '..', '..', 'package.json'), // build: dist/ → root
  ];
  for (const p of candidates) {
    try {
      const pkg = JSON.parse(readFileSync(p, 'utf-8')) as { version?: string };
      if (typeof pkg.version === 'string' && pkg.version.length > 0) {
        return pkg.version;
      }
    } catch {
      // 试下一个候选路径
    }
  }
  return 'unknown';
}

// ============ 主入口 ============

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const version = readPkgVersion();
  const cwd = process.cwd();

  let result;
  try {
    result = await handleSkillsCli(args, { version, cwd });
  } catch (err) {
    // 库内部未捕获异常 → 透传到 stderr，退出码 1
    const msg = err instanceof Error ? (err.stack ?? err.message) : String(err);
    process.stderr.write(`easbot-agent-skills: ${msg}\n`);
    process.exit(1);
  }

  // 未被任何命令处理 → 兜底：usage + 非零退出
  if (!result.handled) {
    process.stderr.write(
      `easbot-agent-skills: unknown command: ${args.join(' ') || '(none)'}\n` +
        `Run \`easbot-agent-skills --help\` for usage.\n`,
    );
    process.exit(1);
  }

  // 库返回的 code 即进程退出码（0 表示成功，非 0 表示业务失败）
  process.exit(result.code);
}

main();