#!/usr/bin/env node
/**
 * register-backup-task.ts - 注册定时备份任务
 *
 * 功能：
 * 1. 使用 Scheduler.createCommand 注册定时备份任务
 * 2. 支持自定义 cron 表达式
 * 3. 支持列出和删除任务
 *
 * 使用示例：
 *   npx tsx scripts/register-backup-task.ts register
 *   npx tsx scripts/register-backup-task.ts register --cron "0 2 * * *"
 *   npx tsx scripts/register-backup-task.ts list
 */

import { Scheduler } from '@easbot/agent';

/**
 * 命令行参数
 */
interface CliArgs {
  command: 'register' | 'list' | 'delete' | 'help';
  cron?: string;
  taskId?: string;
  retentionDays?: number;
  configPath?: string;
}

/**
 * 默认 cron 表达式：每天凌晨 2 点
 */
const DEFAULT_CRON = '0 2 * * *';

/**
 * 解析命令行参数
 */
function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    command: 'help',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === 'register') {
      result.command = 'register';
    } else if (arg === 'list') {
      result.command = 'list';
    } else if (arg === 'delete' && args[i + 1]) {
      result.command = 'delete';
      result.taskId = args[++i];
    } else if (arg === '--cron' && args[i + 1]) {
      result.cron = args[++i];
    } else if (arg === '--retention-days' && args[i + 1]) {
      result.retentionDays = Number.parseInt(args[++i], 10);
    } else if (arg === '--config-path' && args[i + 1]) {
      result.configPath = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      result.command = 'help';
    }
  }

  return result;
}

/**
 * 注册备份任务
 */
async function registerTask(args: CliArgs): Promise<void> {
  const cron = args.cron || DEFAULT_CRON;

  console.log('Registering backup task...');
  console.log(`Cron: ${cron}`);
  console.log(`Retention days: ${args.retentionDays || 30}`);

  try {
    const task = await Scheduler.createCommand({
      name: 'agent-config-backup',
      cron,
      command: 'backup',
      arguments: `config-path=${args.configPath || '.easbot'} retention-days=${args.retentionDays || 30}`,
      durable: true,
      recurring: true,
    });

    console.log('\n✅ Backup task registered successfully!');
    console.log(`Task ID: ${task.id}`);
    console.log(`Next fire: ${new Date(task.nextFireAt).toISOString()}`);
  } catch (error) {
    console.error('\n❌ Failed to register backup task:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * 列出所有备份任务
 */
async function listTasks(): Promise<void> {
  console.log('Listing all command tasks...\n');

  try {
    const tasks = await Scheduler.listCommands();

    if (tasks.length === 0) {
      console.log('No command tasks found.');
      return;
    }

    console.log(`Found ${tasks.length} task(s):\n`);

    for (const task of tasks) {
      const status = task.enabled ? '✅ Enabled' : '❌ Disabled';
      const nextFire = task.nextFireAt ? new Date(task.nextFireAt).toISOString() : 'N/A';

      console.log(`Task: ${task.name}`);
      console.log(`  ID: ${task.id}`);
      console.log(`  Command: ${task.config.command}`);
      console.log(`  Cron: ${task.cron}`);
      console.log(`  Status: ${status}`);
      console.log(`  Next fire: ${nextFire}`);
      console.log('');
    }
  } catch (error) {
    console.error('Failed to list tasks:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * 删除备份任务
 */
async function deleteTask(taskId: string): Promise<void> {
  console.log(`Deleting task: ${taskId}...\n`);

  try {
    console.log('⚠️ Task deletion requires direct TaskStorage manipulation.');
    console.log('Task deletion will be implemented in a future update.');
  } catch (error) {
    console.error('Failed to delete task:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * 显示帮助信息
 */
function showHelp(): void {
  console.log(`
Usage: npx tsx scripts/register-backup-task.ts <command> [options]

Commands:
  register    Register a new backup task
  list        List all command tasks
  delete      Delete a task by ID
  help        Show this help message

Options:
  --cron <expression>      Cron expression (default: "0 2 * * *" - daily at 2 AM)
  --retention-days <days>  Number of days to keep backups (default: 30)
  --config-path <path>     Path to config directory (default: ".easbot")

Examples:
  # Register default backup task (daily at 2 AM)
  npx tsx scripts/register-backup-task.ts register

  # Register backup task with custom schedule (every 6 hours)
  npx tsx scripts/register-backup-task.ts register --cron "0 */6 * * *"

  # List all command tasks
  npx tsx scripts/register-backup-task.ts list
`);
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const args = parseArgs();

  switch (args.command) {
    case 'register':
      await registerTask(args);
      break;
    case 'list':
      await listTasks();
      break;
    case 'delete':
      if (args.taskId) {
        await deleteTask(args.taskId);
      } else {
        console.error('Error: Task ID is required for delete command');
        showHelp();
        process.exit(1);
      }
      break;
    default:
      showHelp();
      break;
  }
}

main().catch(console.error);
