#!/usr/bin/env node
/**
 * backup-config.ts - 配置备份脚本
 *
 * 作为 local command 实现，可由 scheduler 定时触发
 *
 * 功能：
 * 1. 备份所有核心配置文件
 * 2. 按日期组织备份目录
 * 3. 支持恢复指定日期的备份
 * 4. 清理过期备份
 *
 * 使用示例：
 * npx tsx scripts/backup-config.ts --retention-days 30
 * npx tsx scripts/backup-config.ts --restore-date 2026-04-17
 */

import { copyFile, mkdir, readdir, rm, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * 备份选项
 */
interface BackupConfigOptions {
  /** 备份目录，默认为 Global.Path.data/backup/ */
  backupDir?: string;
  /** 要备份的文件列表，默认为核心配置文件 */
  files?: string[];
  /** 是否压缩备份 */
  compress?: boolean;
  /** 保留天数，超过此天数的备份将被清理 */
  retentionDays?: number;
  /** 恢复指定日期的备份 */
  restoreDate?: string;
  /** 配置目录路径 */
  configPath?: string;
}

/**
 * 备份结果
 */
interface BackupConfigResult {
  /** 备份是否成功 */
  success: boolean;
  /** 备份目录路径 */
  backupPath: string;
  /** 备份的文件列表 */
  backedUpFiles: string[];
  /** 清理的旧备份数量 */
  cleanedOldBackups: number;
  /** 错误消息 */
  error?: string;
}

/**
 * 核心配置文件列表
 */
const CORE_CONFIG_FILES = ['BOOT.md', 'IDENTITY.md', 'SOUL.md', 'USER.md', 'AGENTS.md', 'TOOLS.md', 'CONTEXT.md', 'CODER.md'];

/**
 * 获取默认备份目录
 *
 * 注意：实际使用时应该从 Global.Path.data 获取
 * 这里提供默认值
 */
function getDefaultBackupDir(): string {
  // 在实际使用时，应该使用：
  // import { Global } from '@easbot/agent';
  // return join(Global.Path.data, 'backup');

  // 默认值
  return join(process.env.EASBOT_DATA_PATH ?? '.easbot', 'backup');
}

/**
 * 创建备份
 */
async function createBackup(options: BackupConfigOptions): Promise<BackupConfigResult> {
  const backupDir = options.backupDir ?? getDefaultBackupDir();
  const configPath = options.configPath ?? '.easbot';
  const files = options.files ?? CORE_CONFIG_FILES;
  const date = new Date().toISOString().split('T')[0];
  const backupPath = join(backupDir, date);

  const backedUpFiles: string[] = [];
  let cleanedOldBackups = 0;

  try {
    // 创建备份目录
    if (!existsSync(backupPath)) {
      await mkdir(backupPath, { recursive: true });
    }

    // 备份每个文件
    for (const file of files) {
      const sourceFile = join(configPath, file);
      const targetFile = join(backupPath, file);

      if (existsSync(sourceFile)) {
        await copyFile(sourceFile, targetFile);
        backedUpFiles.push(file);
        console.log(`Backed up: ${file}`);
      } else {
        console.log(`Skipped (not found): ${file}`);
      }
    }

    // 清理过期备份
    if (options.retentionDays && options.retentionDays > 0) {
      cleanedOldBackups = await cleanOldBackups(backupDir, options.retentionDays);
      console.log(`Cleaned ${cleanedOldBackups} old backup(s)`);
    }

    return {
      success: true,
      backupPath,
      backedUpFiles,
      cleanedOldBackups,
    };
  } catch (error) {
    return {
      success: false,
      backupPath,
      backedUpFiles,
      cleanedOldBackups,
      error: `Backup failed: ${error}`,
    };
  }
}

/**
 * 清理过期备份
 */
async function cleanOldBackups(backupDir: string, retentionDays: number): Promise<number> {
  if (!existsSync(backupDir)) {
    return 0;
  }

  const now = Date.now();
  const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
  let cleaned = 0;

  const entries = await readdir(backupDir);

  for (const entry of entries) {
    const entryPath = join(backupDir, entry);
    const entryStat = await stat(entryPath);

    // 检查是否过期
    if (now - entryStat.mtime.getTime() > retentionMs) {
      await rm(entryPath, { recursive: true, force: true });
      console.log(`Cleaned old backup: ${entry}`);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * 恢复备份
 */
async function restoreBackup(options: BackupConfigOptions): Promise<BackupConfigResult> {
  if (!options.restoreDate) {
    return {
      success: false,
      backupPath: '',
      backedUpFiles: [],
      cleanedOldBackups: 0,
      error: 'No restore date specified',
    };
  }

  const backupDir = options.backupDir ?? getDefaultBackupDir();
  const configPath = options.configPath ?? '.easbot';
  const backupPath = join(backupDir, options.restoreDate);

  const backedUpFiles: string[] = [];

  try {
    // 检查备份是否存在
    if (!existsSync(backupPath)) {
      return {
        success: false,
        backupPath,
        backedUpFiles,
        cleanedOldBackups: 0,
        error: `Backup not found for date: ${options.restoreDate}`,
      };
    }

    // 恢复每个文件
    const files = await readdir(backupPath);

    for (const file of files) {
      if (file.endsWith('.md')) {
        const sourceFile = join(backupPath, file);
        const targetFile = join(configPath, file);

        await copyFile(sourceFile, targetFile);
        backedUpFiles.push(file);
        console.log(`Restored: ${file}`);
      }
    }

    return {
      success: true,
      backupPath,
      backedUpFiles,
      cleanedOldBackups: 0,
    };
  } catch (error) {
    return {
      success: false,
      backupPath,
      backedUpFiles,
      cleanedOldBackups: 0,
      error: `Restore failed: ${error}`,
    };
  }
}

/**
 * 备份配置文件
 */
export async function backupConfig(options?: BackupConfigOptions): Promise<BackupConfigResult> {
  const opts = options ?? {};

  // 如果指定了恢复日期，执行恢复操作
  if (opts.restoreDate) {
    return restoreBackup(opts);
  }

  // 否则执行备份操作
  return createBackup(opts);
}

/**
 * 命令行入口
 */
async function main() {
  // 解析命令行参数
  const args = process.argv.slice(2);
  const options: BackupConfigOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--backup-dir' && args[i + 1]) {
      options.backupDir = args[++i];
    } else if (arg === '--config-path' && args[i + 1]) {
      options.configPath = args[++i];
    } else if (arg === '--retention-days' && args[i + 1]) {
      options.retentionDays = parseInt(args[++i], 10);
    } else if (arg === '--restore-date' && args[i + 1]) {
      options.restoreDate = args[++i];
    } else if (arg === '--compress') {
      options.compress = true;
    }
  }

  console.log('Backup configuration...');
  if (options.restoreDate) {
    console.log(`Restoring from date: ${options.restoreDate}`);
  }

  const result = await backupConfig(options);

  console.log('\n=== Backup Result ===');
  console.log(`Success: ${result.success}`);
  console.log(`Backup path: ${result.backupPath}`);
  console.log(`Files backed up: ${result.backedUpFiles.length}`);
  result.backedUpFiles.forEach((f) => {
    console.log(`  - ${f}`);
  });
  if (result.cleanedOldBackups > 0) {
    console.log(`Old backups cleaned: ${result.cleanedOldBackups}`);
  }
  if (result.error) {
    console.log(`Error: ${result.error}`);
  }

  process.exit(result.success ? 0 : 1);
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  main().catch(console.error);
}

export default backupConfig;
