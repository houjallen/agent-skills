#!/usr/bin/env tsx
/**
 * eas-planning-writer 三件套初始化脚本
 *
 * 从 references/templates/ 读取模板，落地 task_plan.md / findings.md / progress.md。
 * 文件已存在则跳过，不覆盖用户内容。
 *
 * 用法:
 *   tsx init-planning-session.ts [--output|-o <dir>]
 *   tsx init-planning-session.ts --help
 *
 * 设计原则：
 * - 不依赖任何外部库，只用 Node.js 内置模块（fs / path）
 * - 默认输出 `.easbot/knowledge/tasks/`（仓库隐藏知识目录，不进 git）
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLANNING_FILES = ['task_plan.md', 'findings.md', 'progress.md'] as const;

/** 默认输出目录（仓库隐藏知识目录，不进 git）。 */
const DEFAULT_OUTPUT_DIR = '.easbot/knowledge/tasks';

/** 读取模板文件内容；模板缺失时抛错（不再兜底默认内容，保持单一来源）。 */
async function readTemplate(templateName: string): Promise<string> {
  const templatePath = path.join(__dirname, '..', 'references', 'templates', templateName);
  return await fs.readFile(templatePath, 'utf-8');
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 校验输出目录：必须是相对路径、不能是根目录 / 当前目录。
 * 防止误传 `/` 或 `.` 导致污染全仓库。
 */
function validateOutputDir(outputDir: string): void {
  const trimmed = outputDir.trim();
  if (!trimmed) throw new Error('输出目录不能为空');
  if (path.isAbsolute(trimmed)) {
    throw new Error(`输出目录必须是相对路径，不能是绝对路径: ${trimmed}`);
  }
  if (trimmed === '.' || trimmed === './' || trimmed === '/') {
    throw new Error(`输出目录不能是当前目录或根目录: ${trimmed}`);
  }
}

async function createPlanningFiles(outputDir: string): Promise<void> {
  validateOutputDir(outputDir);
  await fs.mkdir(outputDir, { recursive: true });
  console.log(`[eas-planning-writer] 初始化任务目录: ${outputDir}`);

  for (const fileName of PLANNING_FILES) {
    const target = path.join(outputDir, fileName);
    if (await fileExists(target)) {
      console.log(`[eas-planning-writer] 跳过（已存在）: ${target}`);
      continue;
    }
    const content = await readTemplate(fileName);
    await fs.writeFile(target, content);
    console.log(`[eas-planning-writer] 已创建: ${target}`);
  }

  console.log(`[eas-planning-writer] 三件套落地完成。下一步：编辑 task_plan.md 设定目标与阶段。`);
}

function parseArgs(args: string[]): string {
  let outputDir = DEFAULT_OUTPUT_DIR;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--output' || arg === '-o') {
      const next = args[i + 1];
      if (!next || next.startsWith('-')) {
        throw new Error('--output 需要一个目录路径');
      }
      outputDir = next;
      i++;
    } else if (arg === '--help' || arg === '-h') {
      console.log('用法: tsx init-planning-session.ts [--output|-o <directory>]');
      console.log('初始化规划文件 (task_plan.md, findings.md, progress.md)');
      console.log('');
      console.log('选项:');
      console.log(`  --output, -o <directory>  规划文件的输出目录 (默认: ${DEFAULT_OUTPUT_DIR})`);
      console.log('  --help, -h               显示此帮助信息');
      console.log('');
      console.log('推荐输出: .easbot/knowledge/tasks/<task-name>/（仓库隐藏知识目录）');
      process.exit(0);
    } else {
      throw new Error(`未知参数: ${arg}`);
    }
  }

  return outputDir;
}

async function main(): Promise<void> {
  let outputDir: string;
  try {
    outputDir = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`[eas-planning-writer] ${(err as Error).message}`);
    process.exit(1);
  }

  try {
    await createPlanningFiles(outputDir);
  } catch (err) {
    console.error(`[eas-planning-writer] 初始化失败: ${(err as Error).message}`);
    process.exit(1);
  }
}

// ESM 入口检测：仅在直接调用时执行
const isDirectRun = (() => {
  try {
    const scriptPath = fileURLToPath(import.meta.url);
    return process.argv.some((arg) => arg === scriptPath || arg.endsWith(scriptPath.replace(/\\/g, '/')));
  } catch {
    return false;
  }
})();

if (isDirectRun) {
  void main();
}

export { createPlanningFiles, readTemplate, PLANNING_FILES, parseArgs, validateOutputDir };
