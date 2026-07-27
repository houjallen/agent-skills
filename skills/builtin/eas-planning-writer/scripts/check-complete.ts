#!/usr/bin/env tsx
/**
 * 检查 task_plan.md 中的所有阶段是否完成
 * 由 Stop hook 使用以报告任务完成状态
 *
 * 设计原则：
 * - 不依赖任何外部库，只用 Node.js 内置模块
 * - 阶段识别按"阶段 N / Phase N"严格命名法，避免误命中
 */

import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join as pathJoin } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
void __dirname; // 占位以避免未使用警告；模板路径解析由 init-planning-session.ts 负责

/**
 * 阶段标题识别正则：
 * - `### 阶段 N：xxx` 或 `### Phase N: xxx`
 * - `#### 阶段 N / Phase N`（H4 子阶段）
 * - 后续可跟任意文字
 * - 数字编号必填，避免误匹配"阶段性评估""阶段总结"等字样
 */
const PHASE_HEADING_REGEX = /^#{3,4}\s*(?:阶段|Phase)\s+\d+\b/gim;

/**
 * 阶段状态识别正则（支持中英文 + `状态 (Status)` 格式）：
 * - `**Status:** complete`
 * - `**状态 (Status):** in_progress`
 * - `**状态:** skipped`
 */
const STATUS_REGEX = /\*\*(?:Status|状态(?:\s*\(Status\))?):\*\*\s*(complete|in_progress|pending|skipped)/gi;

/** 备选内联格式：`[complete]` / `[in_progress]` 等 */
const FALLBACK_STATUS_REGEX = /\[(complete|in_progress|pending|skipped)\]/gi;

type Status = 'complete' | 'in_progress' | 'pending' | 'skipped';
type Count = Record<Status, number>;

function emptyCount(): Count {
  return { complete: 0, in_progress: 0, pending: 0, skipped: 0 };
}

async function checkComplete(planFile: string): Promise<void> {
  // 校验文件存在；缺失则视为"无活跃任务"——正常退出 0
  try {
    await fs.access(planFile);
  } catch {
    console.log('[eas-planning-writer] No task_plan.md found — no active planning session.');
    process.exit(0);
  }

  const content = await fs.readFile(planFile, 'utf-8');

  // 阶段总数：基于"阶段 N / Phase N"严格命名法（避免误命中"阶段总结"等）
  const totalPhases = content.match(PHASE_HEADING_REGEX)?.length ?? 0;

  // 主格式：**Status:** / **状态 (Status):**
  const statusMatches = content.match(STATUS_REGEX) ?? [];
  const primary = emptyCount();
  for (const m of statusMatches) {
    const status = m.match(/(complete|in_progress|pending|skipped)/i)?.[0]?.toLowerCase() as Status;
    if (status) primary[status]++;
  }

  // 备选格式：[complete] / [in_progress] 等
  const useFallback = statusMatches.length === 0;
  const fallback = emptyCount();
  if (useFallback) {
    const fbMatches = content.match(FALLBACK_STATUS_REGEX) ?? [];
    for (const m of fbMatches) {
      const status = m.replace(/[[\]]/g, '').toLowerCase() as Status;
      fallback[status]++;
    }
  }

  const count = useFallback ? fallback : primary;
  const finished = count.complete + count.skipped;

  if (totalPhases === 0) {
    console.log(`[eas-planning-writer] No phases found in ${planFile}.`);
    process.exit(0);
  }

  if (finished > 0 && finished === totalPhases) {
    const summary = count.skipped > 0 ? `${count.complete}+${count.skipped} skipped` : `${count.complete}`;
    console.log(`[eas-planning-writer] ALL PHASES COMPLETE (${summary}/${totalPhases})`);
  } else {
    console.log(`[eas-planning-writer] Task in progress (${count.complete}/${totalPhases} phases complete, ${count.skipped} skipped)`);
    if (count.in_progress > 0) {
      console.log(`[eas-planning-writer] ${count.in_progress} phase(s) still in progress.`);
    }
    if (count.pending > 0) {
      console.log(`[eas-planning-writer] ${count.pending} phase(s) pending.`);
    }
  }

  // 始终 exit 0——未完成任务是正常状态
  process.exit(0);
}

if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  const planFile = args[0] || pathJoin(process.cwd(), 'task_plan.md');
  // fire-and-forget：脚本入口，函数内已 process.exit
  void checkComplete(planFile);
}

export { checkComplete, PHASE_HEADING_REGEX, STATUS_REGEX };
