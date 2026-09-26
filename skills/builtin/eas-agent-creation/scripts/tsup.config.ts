import type { BuildOptions } from 'esbuild';
import type { Format, Options } from 'tsup';
import { defineConfig } from 'tsup';
import path from 'node:path';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { glob } from 'glob';

export default defineConfig((options: Options): any => {
  const env = options.env || {};
  const isDev = env.NODE_ENV === 'development';

  // 入口文件
  const input: string[] = ['src/cli.ts'];
  // external 规则：
  //   - '@easbot/*'：workspace 包，保持走 node_modules ESM 解析（避免 dynamic require）
  //   - 'node:*'：Node 内置模块的 node: 前缀形式（ESM 安全，Node 原生支持）
  //   - 旧 CLI 残留的裸名 'fs'/'path'/...：不要列在 external，会被 esbuild 转成 'node:*'，
  //     避免在 ESM 上下文里触发 "Dynamic require of \"path\" is not supported"
  //   - 'brace-expansion' 等第三方包：npm 上的 ESM 版本自带 'node:' 前缀，无需额外声明
  const external: string[] = [
    '@easbot/llm',
    '@easbot/plugin',
    '@easbot/utils',
    '@easbot/terminal',
    '@easbot/types',
    'zod',
    'ai',
    'xdg-basedir',
    'glob',
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
    'node:fs/promises',
    'child_process',
    'brace-expansion',
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
  ]; // 根据实际依赖调整

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
    clean: !isDev,
    // 是否压缩代码
    minify: !isDev,
    // 是否进行拆分
    splitting: true,
    // 忽略监听的文件
    ignoreWatch: ['assets', 'public'],
    // 是否开启垫片
    shims: true,
    // 是否生成dts文件
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
    },
    // 打包成功后的回调函数
    async onSuccess() {
      console.log('Build completed successfully');

      // 复制所有 .txt 文件到 dist/assets/txt 目录，保持 src 的目录结构
      // 因为使用了动态加载（loadTextFile），tsup 不会自动处理这些文件
      console.log('Copying .txt files to dist/assets/txt...');
      const txtFiles = await glob('src/**/*.txt', { cwd: process.cwd() });

      for (const file of txtFiles) {
        const srcPath = path.join(process.cwd(), file);
        // 去掉 'src/' 前缀，保持后续的相对路径结构
        // 例如: src/assets/jieba_dict.txt -> assets/jieba_dict.txt -> dist/assets/txt/assets/jieba_dict.txt
        const relativePath = file.substring(4); // 去掉 'src/' (4个字符)
        const destPath = path.join(process.cwd(), 'dist', 'assets', 'txt', relativePath);
        const destDir = path.dirname(destPath);

        // 确保目标目录存在
        if (!existsSync(destDir)) {
          mkdirSync(destDir, { recursive: true });
        }

        // 复制文件
        copyFileSync(srcPath, destPath);
      }

      console.log(`Copied ${txtFiles.length} .txt files to dist/assets/txt`);
    },
    // esbuild 参数
    esbuildOptions: (
      options: BuildOptions,
      context: {
        format: Format;
      },
    ) => {
      options.assetNames = 'assets/[ext]/[name]-[hash]';
      options.chunkNames = 'chunks/[name]-[hash]';
      // options.output.exports = "named";
    },
    // esbuild 插件
    esbuildPlugins: [],
  };
});
