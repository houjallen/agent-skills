#!/usr/bin/env tsx
/**
 * 检查 task_plan.md 中的所有阶段是否完成
 * 由 Stop hook 使用以报告任务完成状态
 */

import { promises as fs } from 'fs';

async function checkComplete(planFile: string = 'task_plan.md'): Promise<void> {
  try {
    // 检查 task_plan.md 是否存在
    try {
      await fs.access(planFile);
    } catch {
      console.log('[eas-planning-writer] No task_plan.md found — no active planning session.');
      process.exit(0);
    }

    // 读取计划文件
    const content = await fs.readFile(planFile, 'utf-8');

    // 计算总阶段数（同时支持英文 `### Phase` 与中文 `### 阶段`）
    const totalPhases = (content.match(/###\s*(?:Phase|阶段)/g) || []).length;

    // 首先检查 **Status:** / **状态 (Status):** 格式（兼容中英文标题）
    const statusPattern = String.raw`\*\*(?:Status|状态\s*\(Status\)):\*\*\s*(complete|in_progress|pending)`;
    const statusMatches = content.match(new RegExp(statusPattern, 'g')) ?? [];
    const completeCount = statusMatches.filter((m) => m.endsWith('complete')).length;
    const inProgressCount = statusMatches.filter((m) => m.endsWith('in_progress')).length;
    const pendingCount = statusMatches.filter((m) => m.endsWith('pending')).length;

    // 备选：如果未找到 **Status:** 格式，则检查 [complete] 内联格式
    let fallbackComplete = 0;
    let fallbackInProgress = 0;
    let fallbackPending = 0;

    if (completeCount === 0 && inProgressCount === 0 && pendingCount === 0) {
      fallbackComplete = (content.match(/\[complete\]/g) || []).length;
      fallbackInProgress = (content.match(/\[in_progress\]/g) || []).length;
      fallbackPending = (content.match(/\[pending\]/g) || []).length;
    }

    // 如果主要格式没有找到任何内容，则使用备选计数
    const complete = completeCount > 0 ? completeCount : fallbackComplete;
    const inProgress = inProgressCount > 0 ? inProgressCount : fallbackInProgress;
    const pending = pendingCount > 0 ? pendingCount : fallbackPending;

    // 报告状态（始终退出 0 — 未完成任务是正常状态）
    if (complete > 0 && complete === totalPhases && totalPhases > 0) {
      console.log(`[eas-planning-writer] ALL PHASES COMPLETE (${complete}/${totalPhases})`);
    } else {
      console.log(`[eas-planning-writer] Task in progress (${complete}/${totalPhases} phases complete)`);
      if (inProgress > 0) {
        console.log(`[eas-planning-writer] ${inProgress} phase(s) still in progress.`);
      }
      if (pending > 0) {
        console.log(`[eas-planning-writer] ${pending} phase(s) pending.`);
      }
    }

    process.exit(0); // 始终退出 0 — 未完成任务是正常的
  } catch (error) {
    console.error('Error checking completion status:', error.message);
    process.exit(1);
  }
}

// Execute when run directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  const planFile = args[0] || 'task_plan.md';
  // fire-and-forget：脚本入口，函数内已 process.exit
  void checkComplete(planFile);
}
