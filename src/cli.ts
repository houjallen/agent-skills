#!/usr/bin/env node
/**
 * EASBot Agent Skills CLI 入口（host process wrapper）
 *
 * 与 `@easbot/skills` 包自己的 `cli.ts` 保持一致的两步初始化（决策 0049-agent-cli-init-pattern）：
 *   1. loadEnv() —— 必须放在任何 `import @easbot/utils` 之前（xdg-basedir 缓存陷阱）
 *   2. Log.init() —— 接住用户传 `--log-level / --print-logs / --debug`，与库一致
 *
 * **关键设计**：用动态 import + 顶层 await 让 loadEnv / Log.init 先于任何子模块跑。
 * 静态 import 链 `handleSkillsCli → installer/store → @easbot/utils` 会触发 xdg-basedir
 * 缓存；如果先 import 再 loadEnv，路径解析会用错的 XDG_* 值。
 *
 * 顶层参数拦截：
 *   - 空参数 / `--help` / `-h` / `--version` / `-v`  → 本 wrapper 自己处理
 *   - 其余 argv → 透传给 `@easbot/skills` 的 `handleSkillsCli`
 *
 * 退出码语义（与库对齐）：
 *   - result.code !== 0 → process.exitCode = result.code（让 finally 自然跑完）
 *   - 默认 exitCode = 0
 *
 * finally 兜底：
 *   - flushTelemetry() —— 异步上报缓冲中的 telemetry 事件
 *   - Log.close()      —— 关闭日志文件句柄
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * 读取本仓库 package.json 的 version 字段。
 *
 * 路径策略：
 *   - dev（tsx 直接跑 src/cli.ts）：src/cli.ts → ../package.json
 *   - build（tsup 打包到 dist/cli.mjs）：dist/cli.ts → ../../package.json
 */
function getVersion(): string {
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
  return '0.0.0';
}

/**
 * 提取全局日志参数（与 @easbot/skills/cli.ts 保持一致）。
 *
 * 支持：
 *   --log-level <DEBUG|INFO|WARN|ERROR>     默认 INFO
 *   --log-level=<level>                      等价简写
 *   --print-logs                             默认 false
 *   --debug                                  默认 false
 *
 * 注意：本 wrapper 拦截的只有顶层 --help / -h / --version / -v（库会识别顶层，
 * 但顶层识别会优先调 renderBanner / renderHelp，本 wrapper 必须先吃掉这几个 flag）。
 * 其他参数（含 --print-logs / --debug / --log-level）原样透传给 handleSkillsCli。
 */
interface GlobalLogOptions {
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  printLogs: boolean;
  debug: boolean;
}

const VALID_LOG_LEVELS = new Set(['DEBUG', 'INFO', 'WARN', 'ERROR']);

function parseGlobalLogOptions(argv: readonly string[]): GlobalLogOptions {
  const opts: GlobalLogOptions = {
    logLevel: 'INFO',
    printLogs: false,
    debug: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg) continue;

    if (arg === '--log-level' && i + 1 < argv.length) {
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
 * 主入口。
 *
 * 故意保持**单一**的 main()（不抽到独立函数）—— `await import` 必须发生在主模块
 * 顶层 await 上下文里，封装成函数会拖后到 handleSkillsCli 之后调用。
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const version = getVersion();

  // **第一步（与 @easbot/skills/cli.ts 对齐）**：loadEnv
  // 必须放在任何静态 `import @easbot/utils` 之前——xdg-basedir 在 import 时缓存 XDG_*。
  // 这里所有 import 都走动态 import（动态 import 是 lazy，不会触发 xdg-basedir 缓存）。
  const { loadEnv } = await import('@easbot/utils');
  loadEnv();

  // 独立 CLI 默认输出与 v1 兼容（英文）；被其他 host 复用时可由宿主覆盖 EASBOT_LANG。
  if (!process.env.EASBOT_LANG) {
    process.env.EASBOT_LANG = 'en-US';
  }

  // 顶层参数拦截：本 wrapper 先吃掉 help / version / 空参数，避免落到库内部子命令分支
  // （库的 handleSkillsCli 把所有 argv 当作 `<command> [args]`，会把 --help 当成子命令；
  //  子命令级别的 --help / -h 也被库吞掉，所以这里一起拦截）。
  if (args.length === 0) {
    const { renderBanner } = await import('@easbot/skills');
    renderBanner({ version });
    return;
  }
  if (args[0] === '--help' || args[0] === '-h') {
    const { renderHelp } = await import('@easbot/skills');
    renderHelp({ version });
    return;
  }
  if (args[0] === '--version' || args[0] === '-v') {
    console.log(version);
    return;
  }
  // 子命令级别的 --help / -h —— 库内部不识别，wrapper 截到后走库的 renderHelp
  // （库的 renderHelp 是通用 help 文本，不区分子命令；如需 per-command help 需后续扩展）
  if (args.includes('--help') || args.includes('-h')) {
    const { renderHelp } = await import('@easbot/skills');
    renderHelp({ version });
    return;
  }

  // **第二步（与 @easbot/skills/cli.ts 对齐）**：Log.init
  // 必须在 handleSkillsCli 之前，因为 store / installer / git 等模块会用 `Log.create()`。
  // logDir 走与库内 getXdgData() 同源的派生路径（对齐决策 0043：skill-lock / store 同源）。
  const globalLogOpts = parseGlobalLogOptions(args);
  const { Log } = await import('@easbot/utils');
  // 复用库的 getXdgData() —— 它依赖 interfaces.ts 里的全局注入顺序，
  // 动态 import 同样不会触发 xdg-basedir 缓存（loadEnv 已先于所有 import 完成）。
  const { getXdgData } = await import('@easbot/skills');
  const logDir = join(getXdgData(), 'log');
  const isDevelopment = process.env.NODE_ENV === 'development';
  await Log.init({
    logDir,
    print: globalLogOpts.printLogs,
    dev: globalLogOpts.debug || isDevelopment,
    level: globalLogOpts.logLevel,
  });

  // handleSkillsCli 也走动态 import —— 确保上面 Log.init 完成后才加载子模块
  // （避免子模块在 Log 未初始化时调 Log.create() 报错）。
  const { handleSkillsCli } = await import('@easbot/skills');
  const result = await handleSkillsCli(args, { version });

  // 库返回的 code 即进程退出码；用 exitCode 字段而非 process.exit()，
  // 让 finally 自然走完（flush telemetry + close log）。
  if (result.code !== 0) {
    process.exitCode = result.code;
  }
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      const { flushTelemetry } = await import('@easbot/skills');
      await flushTelemetry();
    } catch {
      // ignore
    }
    try {
      const { Log } = await import('@easbot/utils');
      await Log.close();
    } catch {
      // ignore
    }
    process.exit(process.exitCode ?? 0);
  });