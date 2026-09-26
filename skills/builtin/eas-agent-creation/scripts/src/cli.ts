#!/usr/bin/env node
/**
 * Creation 工具 standalone CLI 主入口（scripts/main.ts）
 *
 * 设计依据：对标 `@easbot/memory` / `@easbot/codebase` 的 src/cli.ts
 *
 * **两步初始化**（决策 0049-agent-cli-init-pattern）：
 *   1. loadEnv() —— 动态 import 避免 xdg-basedir 提前缓存
 *   2. Log.init() —— 接住 --log-level / --print-logs / --debug
 *
 * **worktree**：独立 CLI 场景下走 --cwd 优先，否则 process.cwd()。
 * 通过 `Instance.init(directory)` 把路径注入到 host shim。
 *
 * **全局选项**（与 agent 一致）：
 *   --cwd <dir>           worktree 目录
 *   --log-level <L>       DEBUG | INFO | WARN | ERROR（默认 INFO）
 *   --print-logs          把日志打印到 stderr
 *   --debug               等价于 --log-level DEBUG
 *
 * **独立 CLI flag 拦截**：
 *   --help / -h           输出 usage
 *   --version / -v        输出 package.json 版本号
 *
 * **finally 兜底**：
 *   - Instance.dispose() —— 释放当前 directory 的 state 缓存
 *   - Log.close()        —— 关闭日志文件句柄
 *
 * 用法：
 *   tsx scripts/main.ts create --requirement "..." [--scope project|global]
 *   tsx scripts/main.ts evolve [--dryRun]
 *   tsx scripts/main.ts assess [--windowDays 7]
 *   tsx scripts/main.ts list [--mode ...] [--limit 20]
 *   tsx scripts/main.ts apply-plan --planId ... --approvedBy ...
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * 读取本 skill 目录上的 package.json version。
 * skill 本身没有 package.json，回退到仓库根的 package.json（dev 场景）。
 */
function getVersion(): string {
  const candidates = [
    join(__dirname, '..', '..', '..', '..', 'package.json'), // dev: scripts/main.ts → 仓库根
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
  return '0.0.0';
}

interface GlobalLogOptions {
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  printLogs: boolean;
  debug: boolean;
  cwd?: string;
}

const VALID_LOG_LEVELS = new Set(['DEBUG', 'INFO', 'WARN', 'ERROR']);

function parseGlobalOptions(argv: readonly string[]): GlobalLogOptions {
  const opts: GlobalLogOptions = {
    logLevel: 'INFO',
    printLogs: false,
    debug: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg) continue;

    if (arg === '--cwd' && i + 1 < argv.length) {
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
        opts.cwd = next;
        i++;
      }
    } else if (arg.startsWith('--cwd=')) {
      opts.cwd = arg.slice('--cwd='.length);
    } else if (arg === '--log-level' && i + 1 < argv.length) {
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
        const upper = next.toUpperCase();
        if (VALID_LOG_LEVELS.has(upper)) {
          opts.logLevel = upper as GlobalLogOptions['logLevel'];
          i++;
        }
      }
    } else if (arg.startsWith('--log-level=')) {
      const upper = arg.slice('--log-level='.length).toUpperCase();
      if (VALID_LOG_LEVELS.has(upper)) {
        opts.logLevel = upper as GlobalLogOptions['logLevel'];
      }
    } else if (arg === '--print-logs') {
      opts.printLogs = true;
    } else if (arg === '--debug') {
      opts.debug = true;
    }
  }
  return opts;
}

/**
 * 把全局 flag（--cwd / --log-level / --print-logs / --debug）从 argv 里剔除，
 * 剩下的传给 tool.ts 的 main()。
 */
function stripGlobalOptions(argv: readonly string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg) continue;

    if (
      arg === '--cwd' ||
      arg === '--log-level' ||
      (arg.startsWith('--cwd=') && false) || // handled below
      (arg.startsWith('--log-level=') && false)
    ) {
      // 已知 value-taking flag：跳过当前 + 下一个
      i++;
      continue;
    }
    if (arg.startsWith('--cwd=') || arg.startsWith('--log-level=')) {
      continue;
    }
    if (arg === '--print-logs' || arg === '--debug') {
      continue;
    }
    out.push(arg);
  }
  return out;
}

/**
 * 输出 usage（独立 CLI 拦截 --help / -h 时使用）。
 */
function renderHelp(): void {
  const lines = [
    'Usage: tsx src/cli.ts <command> [options]',
    '',
    'Commands:',
    '  create       Create a new AI skill',
    '  evolve       Run skill evolution engine',
    '  assess       Perform skill self-assessment',
    '  list         List registered skills',
    '  apply-plan   Apply an evolution plan',
    '  review       LLM-based skill review (--skillName, --temperature, --topP, --topK, --variant)',
    '',
    'Global Options:',
    '  --cwd <dir>           Worktree directory (default: process.cwd())',
    '  --log-level <L>       DEBUG | INFO | WARN | ERROR (default: INFO)',
    '  --print-logs          Print logs to stderr',
    '  --debug               Equivalent to --log-level DEBUG',
    '  --version / -v        Print version',
    '  --help / -h           Print this help',
    '',
  ];
  process.stdout.write(lines.join('\n'));
}

/**
 * 主流程。
 *
 * 初始化顺序（对标 @easbot/memory）：
 *   1. loadEnv()                  —— 动态 import 避免 xdg-basedir 提前缓存
 *   2. Global.init()              —— 创建 ~/.easbot 全局目录（XDG 兼容），必须在 Log.init 前
 *   3. parseGlobalOptions + help/version 拦截
 *   4. Log.init()                 —— 接住 --log-level / --print-logs / --debug（此时 Global.Path.log 已就绪）
 *   5. Instance.init(cwd)         —— 注入路径（依赖 Global.init 完成）
 *   6. runOp(remaining)           —— 走 toolArgsSchema 校验 + toolDefinition.execute
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const version = getVersion();

  // **第一步**：loadEnv（动态 import 避免 xdg-basedir 提前缓存）
  const { loadEnv, Log, Filesystem } = await import('@easbot/utils');
  await loadEnv();

  // 默认英文
  if (!process.env.EASBOT_LANG) {
    process.env.EASBOT_LANG = 'en-US';
  }

  // **第二步**：Global.init —— 创建 ~/.easbot 全局目录（XDG 兼容）
  // 必须在 Log.init 之前：Global.init 会设置 EASBOT_*_PATH 环境变量，
  // Log.init 用 Global.Path.log 决定 logDir；不先 init Global，Log.init 会拿到错的路径。
  try {
    const { Global } = await import('./global');
    await Global.init();
  } catch (err) {
    // Log 未初始化前只能用 console.warn；这里不 throw，让 CLI 继续
    // eslint-disable-next-line no-console
    console.warn(`global:init failed; falling back to process.cwd() — ${err instanceof Error ? err.message : String(err)}`);
  }

  // **第三步**：独立 CLI flag 拦截（必须在 Log.init 之前，便于 --help 走快路径）
  const globalOpts = parseGlobalOptions(args);
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    renderHelp();
    return;
  }
  if (args[0] === '--version' || args[0] === '-v') {
    process.stdout.write(`${version}\n`);
    return;
  }

  // **第四步**：Log.init（Global.init 已就绪，直接用 Global.Path.log）
  const { Global: GlobalNs } = await import('./global');
  const logDir = GlobalNs.Path.log;
  const isDevelopment = process.env.NODE_ENV === 'development';
  await Log.init({
    logDir,
    print: globalOpts.printLogs,
    dev: globalOpts.debug || isDevelopment,
    level: globalOpts.logLevel,
  });

  // **第五步**：Instance.init(cwd) —— 注入路径
  // 用 then 链：Instance.init resolve 后才执行 runOp，
  // 保证 toolDefinition.execute 内部依赖的 Instance.directory 已被正确注入。
  const cwd = globalOpts.cwd ?? process.cwd();
  const { Instance } = await import('./project/instance');
  const remaining = stripGlobalOptions(args);

  await Instance.init(cwd).then(async () => {
    // **第六步（a）**：bootstrapLlm —— 从 .easbot/easbot.json 读 language_model
    // 失败时降级到 mock（不阻塞 CLI）；日志级别受 --log-level 控制（P2-11）
    await bootstrapLanguageLlm(cwd, { logLevel: globalOpts.logLevel });

    // **第六步（b）**：通过 toolArgsSchema 校验 argv，调 toolDefinition.execute
    const code = await runOp(remaining);
    if (code !== 0) {
      process.exitCode = code;
    }
  });
}

/**
 * bootstrapLlm —— 注入 languageLlm 用于"模型评审"。
 *
 * 参照 @easbot/memory 的独立 CLI 模式：
 *   1) setAdapterRegistry：把 Global/Instance 适配给 LLM bootstrapLlm
 *   2) bootstrapLlm({ target: llm, cwd, language: true })
 *      不传 subConfigPath → 由 @easbot/llm 用默认 easbot.json 路径解析模型配置
 *   3) 失败时 log.warn 但不 throw（CLI 继续，reviewSkill 会显式报"未配置"）
 */
async function bootstrapLanguageLlm(cwd: string, opts: { logLevel: GlobalLogOptions['logLevel'] }): Promise<void> {
  // P1-4：bootstrapLlm 在网络不通时可能无限挂起。加 60 秒超时，超时后降级到 mock（不影响 CLI 主流程）。
  const BOOTSTRAP_TIMEOUT_MS = 60_000;
  try {
    const [{ bootstrapLlm, setAdapterRegistry }, { Global: GlobalNs }, { Instance: InstanceNs }, { Llm, llm }] = await Promise.all([
      import('@easbot/llm'),
      import('./global'),
      import('./project/instance'),
      import('./llm'),
    ]);

    setAdapterRegistry({
      config: undefined,
      instance: {
        getDirectory: () => InstanceNs.directory,
        getWorktree: () => InstanceNs.worktree,
      },
      global: {
        home: GlobalNs.Path.home,
        data: GlobalNs.Path.data,
        cache: GlobalNs.Path.cache,
        config: GlobalNs.Path.config,
        state: GlobalNs.Path.state,
        log: GlobalNs.Path.log,
        bin: GlobalNs.Path.bin,
      },
      installation: {
        getVersion: () => getVersion(),
        getChannel: () => 'local',
        getUserAgent: () => `easbot-creation/${getVersion()}`,
      },
    });

    const bootstrapPromise = bootstrapLlm({
      target: llm,
      cwd,
      language: true,
    });
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => reject(new Error(`bootstrap timed out after ${BOOTSTRAP_TIMEOUT_MS}ms`)), BOOTSTRAP_TIMEOUT_MS);
      // 让 timer 不阻塞进程退出
      timer.unref?.();
    });
    const result = await Promise.race([bootstrapPromise, timeoutPromise]);

    // P2-11：bootstrap 结果不再用 console.log 无条件输出。
    //   - DEBUG 模式 → 输出到 stderr（开发调试）
    //   - 其他级别 → 完全静默
    if (opts.logLevel === 'DEBUG') {
      process.stderr.write(
        `[llm] bootstrap: ${JSON.stringify({
          language: result.loaded.language,
          hasFallback: result.hasFallback,
          source: result.sources.language,
        })}\n`,
      );
    }
  } catch (err) {
    // bootstrap 失败 → 强制 reset Llm 状态，确保 review 路径走
    // "languageLlm model is not configured" 友好降级（exit 2），而不是
    // 触发生成路径里的 lazy require('path') 把整个进程搞挂。
    try {
      const { Llm } = await import('./llm');
      Llm.reset();
    } catch {
      // ignore — Llm 都不存在时无需 reset
    }
    // bootstrap 失败始终报 warn（影响 reviewSkill 可用性，是用户需要知道的）
    process.stderr.write(`[llm] bootstrap failed; reviewSkill will be unavailable — ${err instanceof Error ? err.message : String(err)}\n`);
  }
}

/**
 * 把 CLI argv 通过 toolDefinition.args 的 zod schema 校验并转换，
 * 然后调 toolDefinition.execute(args, ctx)。
 *
 * 关键设计：argv 解析**严格依赖 schema**，而非手工写 flag 列表。
 * 这样 tool.ts 加新 op / 新字段时，main.ts 不需要改任何代码。
 *
 * 支持两种调用风格：
 *   1) --op <op> --<key> <value> ...      ← 友好 CLI 风格（自动按 schema 转换类型）
 *   2) --args '<json>'                     ← 直接传 JSON 参数（与 LLM tool_call 等价）
 *   3) <op> --<key> <value> ...            ← 第一个非 flag token 作为 op
 */
async function runOp(argv: string[]): Promise<number> {
  if (argv.length === 0) {
    process.stderr.write('Error: missing operation\n');
    return 2;
  }

  const { toolDefinition, toolArgsSchema } = await import('./tool');
  const { Instance } = await import('./project/instance');
  const z = await import('zod');

  // P2-4：互斥检查（--args 与 --op/<op> 互斥 — cli.md §概述 已声明但代码未强制）
  const hasArgs = argv.some((a) => a === '--args' || a?.startsWith('--args='));
  const hasOpFlag = argv.some((a) => a === '--op' || a?.startsWith('--op='));
  const hasPositionalOp = argv.some((a) => !a.startsWith('--'));
  if (hasArgs && (hasOpFlag || hasPositionalOp)) {
    process.stderr.write('Error: --args is mutually exclusive with --op/<op>\n');
    return 2;
  }
  if (hasOpFlag && hasPositionalOp) {
    process.stderr.write('Error: --op is mutually exclusive with positional <op>\n');
    return 2;
  }

  // 1) 提取 op 和可选的 --args JSON
  let op: string | undefined;
  let jsonArgs: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--op' && i + 1 < argv.length) {
      op = argv[++i];
    } else if (arg?.startsWith('--op=')) {
      op = arg.slice('--op='.length);
    } else if (arg === '--args' && i + 1 < argv.length) {
      jsonArgs = argv[++i];
    } else if (arg?.startsWith('--args=')) {
      jsonArgs = arg.slice('--args='.length);
    }
  }

  // 第一个非 flag token 作为 op（友好 CLI 风格）
  if (!op) {
    const firstNonFlag = argv.find((a) => !a.startsWith('--'));
    if (firstNonFlag) op = firstNonFlag;
  }

  if (!op) {
    process.stderr.write('Error: operation is required (use --op <op> or pass <op> as first arg)\n');
    return 2;
  }

  // 2) 拼装 args：用 tool.ts 暴露的真实可执行 schema 做字段类型转换
  const raw: Record<string, unknown> = { operation: op };

  if (jsonArgs !== undefined) {
    try {
      const parsed = JSON.parse(jsonArgs) as Record<string, unknown>;
      Object.assign(raw, parsed);
    } catch (err) {
      process.stderr.write(`Error: --args is not valid JSON: ${err instanceof Error ? err.message : String(err)}\n`);
      return 2;
    }
  } else {
    // 把 <op> / --op / --args 之外的 --flag 收集出来，按 schema 类型转换
    for (let i = 0; i < argv.length; i++) {
      const tok = argv[i];
      if (!tok?.startsWith('--')) continue;
      // 跳过已识别的 --op / --args
      if (tok === '--op' || tok.startsWith('--op=')) {
        if (tok === '--op') i++;
        continue;
      }
      if (tok === '--args' || tok.startsWith('--args=')) {
        if (tok === '--args') i++;
        continue;
      }
      // 注：op 本身（第一个非 flag token）不带 '--' 前缀，
      // 上面 `if (!tok?.startsWith('--')) continue;` 已保证此处 tok 必带 '--'，
      // 因此不必再 `if (tok === op) continue;`（永真且死代码）

      const key = tok.slice(2);
      const fieldSchema = toolDefinition.args[key];
      if (!fieldSchema) continue; // schema 里没有，跳过

      // boolean 字段：flag 出现即为 true
      // 注意：ZodOptional<ZodBoolean> 包装层也要剥掉再判断
      const unwrapped = (fieldSchema as any)._def?.innerType ?? fieldSchema;
      const typeName = (unwrapped as any)._def?.typeName;
      if (typeName === 'ZodBoolean' || unwrapped instanceof z.ZodBoolean) {
        raw[key] = true;
        continue;
      }

      // array 字段（ZodArray）：flag value 是 CSV，拆成数组
      // 例如 --hints "a,b,c" → ['a','b','c']
      if (typeName === 'ZodArray' || unwrapped instanceof z.ZodArray) {
        const next = argv[i + 1];
        if (next === undefined || next.startsWith('--')) {
          raw[key] = [];
        } else {
          raw[key] = next
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          i++;
        }
        continue;
      }

      // 其他字段：取下一个 token 作为 value
      const next = argv[i + 1];
      if (next === undefined) {
        raw[key] = true;
      } else {
        raw[key] = next;
        i++;
      }
    }
  }

  // 3) 用 tool.ts 的真实 schema 校验 / 转换（处理 enum、min(10)、array of string 等）
  // 注：toolDefinition.execute 内部用 operationSchema（discriminated union），
  // 这里为了对齐也用同一个 schema，让 TS 在 runOperation 分支里能 narrow 必填字段
  let parsedArgs: Record<string, unknown>;
  try {
    const { operationSchema } = await import('./tool');
    parsedArgs = operationSchema.parse(raw) as Record<string, unknown>;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Error: invalid arguments: ${msg}\n`);
    return 2;
  }

  // 4) 构造 ToolContext（对齐 host 调用形态）
  const ctx = {
    sessionId: `cli-${Date.now()}`,
    messageId: `msg-${Date.now()}`,
    agent: 'creation-cli',
    directory: Instance.directory,
    worktree: Instance.worktree,
    abort: new AbortController().signal,
    metadata: (_input: { title?: string; metadata?: Record<string, unknown> }): void => {
      // CLI 场景下无外部元数据消费者，no-op
    },
    ask: async (_input: { permission: string; patterns: string[]; always: string[]; metadata: Record<string, unknown> }): Promise<void> => {
      // CLI 场景下无权限系统，no-op（直接放行）
    },
  };

  // 5) 调 toolDefinition.execute —— 与 host / @easbot/llm 注入后行为完全一致
  // 注：ToolDefinition.execute 是可选的，必须先判空
  try {
    if (!toolDefinition.execute) {
      process.stderr.write('Error: toolDefinition.execute is not implemented\n');
      return 2;
    }
    const output = await toolDefinition.execute(parsedArgs, ctx);
    process.stdout.write(`${output}\n`);
    return 0;
  } catch (err) {
    // NamedError（来自 @easbot/utils）携带结构化 data: { code, message, exitCode, ... }
    // 让 CreationError.ReviewFailed 这类错误能精确给出 exit code（用户错误=2，系统错误=3）
    const anyErr = err as { data?: { exitCode?: number; message?: string }; message?: string };
    if (anyErr && typeof anyErr === 'object' && anyErr.data && typeof anyErr.data.exitCode === 'number') {
      const detail = anyErr.data.message ?? anyErr.message ?? String(err);
      const payload = { error: detail, ...anyErr.data };
      process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
      return anyErr.data.exitCode;
    }
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Error: ${msg}\n`);
    return 1;
  }
}

main()
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      const { Log } = await import('@easbot/utils');
      const { Instance } = await import('./project/instance');
      await Instance.dispose();
      await Log.close();
    } catch {
      // ignore
    }
    process.exit(process.exitCode ?? 0);
  });
