import type { BuildOptions } from 'esbuild';
import type { Options } from 'tsup';
import { defineConfig } from 'tsup';

export default defineConfig((options: Options): any => {
  console.log(`env=${JSON.stringify(options)}`);

  // 入口文件
  const input: string[] = [
    'src/cli.ts', // 新架构 CLI 入口
  ];
  const root = process.cwd();
  // 排除 Bun 特定的依赖和有问题的包
  const external: string[] = [
    // 本仓库运行时依赖（程序化调用，不打进 bundle）
    '@easbot/skills',
    // 透传依赖
    '@easbot/mcp',
    '@easbot/types',
    '@easbot/utils',
    '@easbot/agent',
    'zod',
    'commander',
    // 添加使用 Node.js 内置模块的包
    '@hono/node-server',
    '@hono/node-ws',
    'bonjour-service',
    '@agentclientprotocol/sdk',
    '@modelcontextprotocol/sdk',
    'node-pty',
    'bonjour-service',
    'dotenv',
    'undici',
    'gray-matter',
    // WebSocket 包 - 使用动态 require
    'ws',
    // 添加使用动态 require 的包
    'tunnel',
    '@actions/http-client',
    '@actions/core',
    '@actions/github',
    'undici',
    'dotenv',
    // Node.js 内置模块 - 使用 node: 前缀
    'node:fs',
    'node:path',
    'node:http',
    'node:https',
    'node:net',
    'node:crypto',
    'node:stream',
    'node:buffer',
    'node:util',
    'node:os',
    'node:events',
    'node:child_process',
    'node:readline',
    'node:url',
    'node:async_hooks',
    'node:v8',
    'node:module',
    'node:tls',
    'node:worker_threads',
    'child_process',
    // Node.js 内置模块 - 不带 node: 前缀（用于兼容某些依赖包）
    'fs',
    'path',
    'http',
    'https',
    'net',
    'crypto',
    'stream',
    'buffer',
    'util',
    'os',
    'events',
    'child_process',
    'readline',
    'url',
    'async_hooks',
    'v8',
    'module',
    'fs/promises',
    'tls',
    'worker_threads',
  ];
  console.log(`root=${root}`);
  console.log(`input=${JSON.stringify(input)}`);
  console.log(`external=${JSON.stringify(external)}`);

  return {
    entry: input,
    // 配置输出文件名后缀
    outExtension: ({ format }: { [format: string]: string }) => {
      let extension = '.js';
      switch (format) {
        case 'cjs':
          extension = '.cjs';
          break;
        case 'esm':
          extension = '.mjs';
          break;
        default:
          extension = '.js';
          break;
      }
      return {
        js: `${extension}`,
      };
    },
    // 输出文件目录
    outDir: './dist',
    // 输出格式:'cjs' | 'esm'
    format: ['esm'], //['cjs', 'esm'],
    // 选择目标模块解析策略
    platform: 'node', // 或根据需要设置为 'browser' 或 'neutral'
    // ts配置文件
    tsconfig: './tsconfig.json',
    // 编译目标
    target: 'es2020',
    // 分文件夹兼容输出
    legacyOutput: false,
    // 是否生成对应的调试源文件
    sourcemap: false,
    // 打包之前是否先清空dist文件
    clean: true,
    // 是否压缩代码
    minify: true,
    // 是否进行拆分
    splitting: true,
    // 忽略监听的文件
    ignoreWatch: ['assets', 'public'],
    // 是否开启垫片 - 关闭以避免可能的副作用
    shims: true,
    // 是否生成dts文件 - 禁用以避免 Solid.js 类型推断问题
    // dts: true,
    // fix dts build baseUrl bug
    dts: {
      compilerOptions: {
        ignoreDeprecations: '6.0',
      },
    },
    // 摇树优化
    treeshake: true,
    // 指定哪些模块应该被视为外部模块
    external,
    loader: {
      '.png': 'file',
      '.jpg': 'file',
      '.jpeg': 'file',
      '.ttf': 'file',
      '.css': 'file',
      // '.txt': 'file',// .txt 文件的加载方式需要特殊处理
    },
    // 打包成功后的回调函数
    async onSuccess() {
      console.log('Build completed successfully');
    },
    // esbuild 参数
    esbuildOptions: (options: BuildOptions) => {
      options.assetNames = 'assets/[ext]/[name]-[hash]';
      options.chunkNames = 'chunks/[name]-[hash]';
      // options.output.exports = "named";
    },
    // esbuild 插件
    esbuildPlugins: [
      // alias({
      //   // 配置@别名
      //   '@': `${path.resolve(root, './src')}`,
      //   // 配置@tui别名
      //   '@tui': `${path.resolve(root, './src/cli/cmd/tui')}`,
      // }),
      // svgr({
      //   svgProps: {
      //     className: 'icon',
      //   },
      //   memo: true,
      //   ref: true,
      //   prettier: false,
      //   dimensions: false,
      // }),
    ],
  };
});
