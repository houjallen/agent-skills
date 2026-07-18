#!/usr/bin/env node
/**
 * validate-config.ts - 配置验证脚本
 *
 * 功能：
 * 1. 检查文件格式是否符合规范
 * 2. 验证优先级是否存在冲突
 * 3. 检查内容完整性
 * 4. 提供修复建议
 *
 * 使用示例：
 * npx tsx scripts/validate-config.ts --config-path .easbot
 * npx tsx scripts/validate-config.ts --config-path .easbot --strict
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * 验证选项
 */
interface ValidateConfigOptions {
  /** 配置目录路径 */
  configPath: string;
  /** 是否严格模式（检查所有细节） */
  strict?: boolean;
  /** 是否自动修复可修复的问题 */
  autoFix?: boolean;
}

/**
 * 验证错误
 */
interface ValidationError {
  /** 错误类型 */
  type: 'format' | 'priority' | 'content' | 'missing';
  /** 错误级别 */
  severity: 'error' | 'warning' | 'info';
  /** 错误消息 */
  message: string;
  /** 相关文件 */
  file: string;
  /** 修复建议 */
  suggestion?: string;
  /** 是否可自动修复 */
  autoFixable?: boolean;
}

/**
 * 验证结果
 */
interface ValidateConfigResult {
  /** 是否验证通过 */
  valid: boolean;
  /** 错误列表 */
  errors: ValidationError[];
  /** 修复后的文件（如果启用了 autoFix） */
  fixed?: string[];
}

/**
 * 文件优先级定义
 */
const FILE_PRIORITIES: Record<string, number> = {
  'BOOT.md': 1,
  'BOOTSTRAP.md': 10,
  'IDENTITY.md': 20,
  'AGENTS.md': 30,
  'SOUL.md': 40,
  'USER.md': 50,
  'TOOLS.md': 60,
  'CONTEXT.md': 70,
  'CODER.md': 80,
  'HEARTBEAT.md': 90,
  'MEMORY.md': 100,
};

/**
 * 必需文件列表
 */
const REQUIRED_FILES = ['BOOT.md', 'IDENTITY.md', 'USER.md'];

/**
 * 推荐文件列表
 */
const RECOMMENDED_FILES = ['SOUL.md', 'AGENTS.md'];

/**
 * 验证文件格式
 */
async function validateFileFormat(filePath: string, content: string): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  const fileName = filePath.split('/').pop() ?? '';

  // 检查是否为空文件
  if (!content.trim()) {
    errors.push({
      type: 'format',
      severity: 'error',
      message: '文件为空',
      file: filePath,
      suggestion: '添加必要的内容',
      autoFixable: false,
    });
    return errors;
  }

  // 检查是否有标题
  if (!content.startsWith('#')) {
    errors.push({
      type: 'format',
      severity: 'warning',
      message: '文件应该以标题开头',
      file: filePath,
      suggestion: '在文件开头添加标题',
      autoFixable: false,
    });
  }

  // 检查是否有边界控制标记
  const boundaryMarkers = ['NEVER', 'MUST', 'ALWAYS', 'CRITICAL', 'DO NOT'];
  const hasBoundaryMarker = boundaryMarkers.some((marker) => content.includes(marker));

  if (!hasBoundaryMarker && ['BOOT.md', 'IDENTITY.md', 'SOUL.md'].includes(fileName)) {
    errors.push({
      type: 'content',
      severity: 'warning',
      message: '文件缺少边界控制标记（NEVER, MUST, ALWAYS, CRITICAL）',
      file: filePath,
      suggestion: '添加适当的边界控制标记',
      autoFixable: false,
    });
  }

  return errors;
}

/**
 * 验证优先级
 */
async function validatePriority(filePath: string, content: string): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  const fileName = filePath.split('/').pop() ?? '';

  // 检查文件名是否在优先级定义中
  if (!(fileName in FILE_PRIORITIES)) {
    errors.push({
      type: 'priority',
      severity: 'info',
      message: `文件 ${fileName} 不在标准优先级定义中`,
      file: filePath,
      suggestion: '确认文件名是否正确，或添加到优先级定义中',
      autoFixable: false,
    });
  }

  return errors;
}

/**
 * 验证内容完整性
 */
async function validateContent(filePath: string, content: string): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  const fileName = filePath.split('/').pop() ?? '';

  // 根据文件类型检查必需内容
  switch (fileName) {
    case 'BOOT.md':
      if (!content.includes('优先级') && !content.includes('Priority')) {
        errors.push({
          type: 'content',
          severity: 'error',
          message: 'BOOT.md 缺少优先级规则',
          file: filePath,
          suggestion: '添加优先级规则说明',
          autoFixable: false,
        });
      }
      if (!content.includes('冲突') && !content.includes('Conflict')) {
        errors.push({
          type: 'content',
          severity: 'warning',
          message: 'BOOT.md 缺少冲突处理策略',
          file: filePath,
          suggestion: '添加冲突处理策略',
          autoFixable: false,
        });
      }
      break;

    case 'IDENTITY.md':
      if (!content.includes('我是') && !content.includes('I am')) {
        errors.push({
          type: 'content',
          severity: 'error',
          message: 'IDENTITY.md 缺少身份声明',
          file: filePath,
          suggestion: '添加身份声明（如：我是 XXX）',
          autoFixable: false,
        });
      }
      break;

    case 'USER.md':
      if (!content.includes('姓名') && !content.includes('Name')) {
        errors.push({
          type: 'content',
          severity: 'warning',
          message: 'USER.md 缺少用户姓名',
          file: filePath,
          suggestion: '添加用户姓名',
          autoFixable: false,
        });
      }
      break;

    case 'SOUL.md':
      if (!content.includes('价值') && !content.includes('Value')) {
        errors.push({
          type: 'content',
          severity: 'warning',
          message: 'SOUL.md 缺少核心价值观',
          file: filePath,
          suggestion: '添加核心价值观',
          autoFixable: false,
        });
      }
      break;
  }

  return errors;
}

/**
 * 验证配置文件
 */
export async function validateConfig(options: ValidateConfigOptions): Promise<ValidateConfigResult> {
  const errors: ValidationError[] = [];
  const configPath = options.configPath;

  try {
    // 检查目录是否存在
    if (!existsSync(configPath)) {
      errors.push({
        type: 'missing',
        severity: 'error',
        message: `配置目录不存在: ${configPath}`,
        file: configPath,
        suggestion: '先运行 init-agent.ts 创建配置目录',
        autoFixable: false,
      });

      return { valid: false, errors };
    }

    // 读取目录中的所有文件
    const files = await readdir(configPath);
    const mdFiles = files.filter((f) => f.endsWith('.md'));

    // 检查必需文件
    for (const requiredFile of REQUIRED_FILES) {
      if (!mdFiles.includes(requiredFile)) {
        errors.push({
          type: 'missing',
          severity: 'error',
          message: `缺少必需文件: ${requiredFile}`,
          file: join(configPath, requiredFile),
          suggestion: `创建 ${requiredFile} 文件`,
          autoFixable: false,
        });
      }
    }

    // 检查推荐文件
    if (options.strict) {
      for (const recommendedFile of RECOMMENDED_FILES) {
        if (!mdFiles.includes(recommendedFile)) {
          errors.push({
            type: 'missing',
            severity: 'warning',
            message: `缺少推荐文件: ${recommendedFile}`,
            file: join(configPath, recommendedFile),
            suggestion: `创建 ${recommendedFile} 文件`,
            autoFixable: false,
          });
        }
      }
    }

    // 验证每个文件
    for (const file of mdFiles) {
      const filePath = join(configPath, file);
      const content = await readFile(filePath, 'utf-8');

      // 验证格式
      const formatErrors = await validateFileFormat(filePath, content);
      errors.push(...formatErrors);

      // 验证优先级
      const priorityErrors = await validatePriority(filePath, content);
      errors.push(...priorityErrors);

      // 验证内容
      const contentErrors = await validateContent(filePath, content);
      errors.push(...contentErrors);
    }

    // 判断是否验证通过
    const hasErrors = errors.some((e) => e.severity === 'error');

    return {
      valid: !hasErrors,
      errors,
    };
  } catch (error) {
    errors.push({
      type: 'format',
      severity: 'error',
      message: `验证过程出错: ${error}`,
      file: configPath,
      autoFixable: false,
    });

    return {
      valid: false,
      errors,
    };
  }
}

/**
 * 命令行入口
 */
async function main() {
  // 解析命令行参数
  const args = process.argv.slice(2);
  const options: ValidateConfigOptions = {
    configPath: '.easbot',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--config-path' && args[i + 1]) {
      options.configPath = args[++i];
    } else if (arg === '--strict') {
      options.strict = true;
    } else if (arg === '--auto-fix') {
      options.autoFix = true;
    }
  }

  console.log('Validating configuration...');
  console.log(`Config path: ${options.configPath}`);
  console.log(`Strict mode: ${options.strict ?? false}`);

  const result = await validateConfig(options);

  console.log('\n=== Validation Result ===');
  console.log(`Valid: ${result.valid}`);
  console.log(`Total issues: ${result.errors.length}`);

  if (result.errors.length > 0) {
    console.log('\nIssues:');
    result.errors.forEach((error) => {
      const severity = error.severity.toUpperCase().padEnd(7);
      const type = error.type.toUpperCase().padEnd(8);
      console.log(`  [${severity}] [${type}] ${error.file}`);
      console.log(`    ${error.message}`);
      if (error.suggestion) {
        console.log(`    Suggestion: ${error.suggestion}`);
      }
    });
  }

  process.exit(result.valid ? 0 : 1);
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  main().catch(console.error);
}

export default validateConfig;
