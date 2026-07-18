#!/usr/bin/env tsx
/**
 * Session Catchup Script for eas-planning-writer
 *
 * 分析上一个会话以找出上次规划文件更新后的未同步上下文。设计用于在 SessionStart 时运行。
 *
 * 用法: tsx session-catchup.ts [project-path]
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const PLANNING_FILES = ['task_plan.md', 'progress.md', 'findings.md'];

interface SessionMessage {
  _line_num: number;
  type?: string;
  isMeta?: boolean;
  message?: {
    content?: string | Array<{ type?: string; text?: string; name?: string; input?: Record<string, unknown> }>;
  };
}

interface ExtractedMessage {
  role: 'user' | 'assistant';
  content?: string;
  tools?: string[];
  line: number;
}

/** 将项目路径转换为 Agent 的存储路径格式。 */
function getProjectDir(projectPath: string): string {
  let sanitized = projectPath.replace(/\//g, '-');
  if (!sanitized.startsWith('-')) {
    sanitized = '-' + sanitized;
  }
  sanitized = sanitized.replace(/_/g, '-');
  return path.join(homedir(), '.easbot', 'sessions', sanitized);
}

/** 按修改时间（最新的在前）获取所有会话文件。 */
async function getSessionsSorted(projectDir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(projectDir);
    const sessionPaths = files.filter((file) => file.endsWith('.jsonl') && !file.startsWith('agent-')).map((file) => path.join(projectDir, file));

    const statsWithPaths = await Promise.all(
      sessionPaths.map(async (sessionPath) => {
        const stat = await fs.stat(sessionPath);
        return { path: sessionPath, mtime: stat.mtime };
      }),
    );

    return statsWithPaths.sort((a, b) => b.mtime.getTime() - a.mtime.getTime()).map((item) => item.path);
  } catch {
    return [];
  }
}

/** 从会话文件中解析所有消息，保持顺序。 */
async function parseSessionMessages(sessionFile: string): Promise<SessionMessage[]> {
  try {
    const content = await fs.readFile(sessionFile, 'utf-8');
    const lines = content.split('\n');
    const messages: SessionMessage[] = [];

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      if (!line || line.trim() === '') continue;
      try {
        const data = JSON.parse(line) as SessionMessage;
        data._line_num = lineNum;
        messages.push(data);
      } catch {
        // 跳过无效的 JSON 行
      }
    }
    return messages;
  } catch {
    return [];
  }
}

/** 查找最后一次规划文件写入/编辑的时间。返回 {line, file} 或 {-1, null}（如果未找到）。 */
function findLastPlanningUpdate(messages: SessionMessage[]): { line: number; file: string | null } {
  let lastUpdateLine = -1;
  let lastUpdateFile: string | null = null;

  for (const msg of messages) {
    if (msg.type !== 'assistant') continue;
    const content = msg.message?.content;
    if (!Array.isArray(content)) continue;

    for (const item of content) {
      if (item.type !== 'tool_use') continue;
      const toolName = item.name ?? '';
      const toolInput = (item.input ?? {}) as { file_path?: string };

      if (toolName === 'Write' || toolName === 'Edit') {
        const filePath = toolInput.file_path ?? '';
        for (const pf of PLANNING_FILES) {
          if (filePath.endsWith(pf)) {
            lastUpdateLine = msg._line_num;
            lastUpdateFile = pf;
          }
        }
      }
    }
  }
  return { line: lastUpdateLine, file: lastUpdateFile };
}

/** 提取指定行号之后的对话消息。 */
function extractMessagesAfter(messages: SessionMessage[], afterLine: number): ExtractedMessage[] {
  const result: ExtractedMessage[] = [];

  for (const msg of messages) {
    if (msg._line_num <= afterLine) continue;

    const msgType = msg.type;
    const isMeta = msg.isMeta ?? false;

    if (msgType === 'user' && !isMeta) {
      const rawContent = msg.message?.content ?? '';
      let content = '';
      if (Array.isArray(rawContent)) {
        for (const item of rawContent) {
          if (item && item.type === 'text') {
            content = item.text ?? '';
            break;
          }
        }
      } else if (typeof rawContent === 'string') {
        content = rawContent;
      }

      if (content && typeof content === 'string') {
        if (content.startsWith('<local-command') || content.startsWith('<command-') || content.startsWith('<task-notification')) {
          continue;
        }
        if (content.length > 20) {
          result.push({ role: 'user', content, line: msg._line_num });
        }
      }
    } else if (msgType === 'assistant') {
      const msgContent = msg.message?.content ?? '';
      let textContent = '';
      const toolUses: string[] = [];

      if (typeof msgContent === 'string') {
        textContent = msgContent;
      } else if (Array.isArray(msgContent)) {
        for (const item of msgContent) {
          if (item.type === 'text') {
            textContent = item.text ?? '';
          } else if (item.type === 'tool_use') {
            const toolName = item.name ?? '';
            const toolInput = (item.input ?? {}) as { file_path?: string; command?: string };
            if (toolName === 'Edit') {
              toolUses.push(`Edit: ${toolInput.file_path ?? 'unknown'}`);
            } else if (toolName === 'Write') {
              toolUses.push(`Write: ${toolInput.file_path ?? 'unknown'}`);
            } else if (toolName === 'Bash') {
              const cmd = (toolInput.command ?? '').substring(0, 80);
              toolUses.push(`Bash: ${cmd}`);
            } else {
              toolUses.push(toolName);
            }
          }
        }
      }

      if (textContent || toolUses.length > 0) {
        result.push({
          role: 'assistant',
          content: textContent.substring(0, 600),
          tools: toolUses,
          line: msg._line_num,
        });
      }
    }
  }
  return result;
}

async function main(): Promise<void> {
  const projectPath = process.argv[2] ?? process.cwd();
  const projectDir = getProjectDir(projectPath);

  // 检查规划文件是否存在（指示有活跃任务）
  const hasPlanningFiles = await Promise.all(
    PLANNING_FILES.map(async (f) => {
      try {
        await fs.access(path.join(projectPath, f));
        return true;
      } catch {
        return false;
      }
    }),
  );
  if (!hasPlanningFiles.some(Boolean)) {
    // 没有规划文件，可能不是项目级任务，跳过
  }

  // 检查项目会话目录是否存在
  try {
    await fs.access(projectDir);
  } catch {
    // 无之前的会话，无需追补
    return;
  }

  const sessions = await getSessionsSorted(projectDir);
  if (sessions.length === 0) return;

  // 查找一个实质性之前的会话
  let targetSession: string | null = null;
  for (const session of sessions) {
    try {
      const stat = await fs.stat(session);
      if (stat.size > 5000) {
        targetSession = session;
        break;
      }
    } catch {
      // 忽略文件读取错误
    }
  }

  if (!targetSession) return;

  const messages = await parseSessionMessages(targetSession);
  const { line: lastUpdateLine, file: lastUpdateFile } = findLastPlanningUpdate(messages);

  // 仅在有未同步内容时输出
  let messagesAfter: ExtractedMessage[];
  if (lastUpdateLine < 0) {
    const startIdx = Math.max(0, messages.length - 30);
    messagesAfter = extractMessagesAfter(messages, startIdx);
  } else {
    messagesAfter = extractMessagesAfter(messages, lastUpdateLine);
  }

  if (messagesAfter.length === 0) return;

  // 输出追补报告
  console.log('\n[eas-planning-writer] SESSION CATCHUP DETECTED');
  console.log(`Previous session: ${path.basename(targetSession, '.jsonl')}`);

  if (lastUpdateLine >= 0) {
    console.log(`Last planning update: ${lastUpdateFile} at message #${lastUpdateLine}`);
    console.log(`Unsynced messages: ${messagesAfter.length}`);
  } else {
    console.log('No planning file updates found in previous session');
  }

  console.log('\n--- UNSYNCED CONTEXT ---');
  const lastMessages = messagesAfter.slice(-15); // 最后 15 条消息
  for (const msg of lastMessages) {
    if (msg.role === 'user') {
      console.log(`USER: ${(msg.content ?? '').substring(0, 300)}`);
    } else {
      if (msg.content) {
        console.log(`AGENT: ${msg.content.substring(0, 300)}`);
      }
      if (msg.tools && msg.tools.length > 0) {
        console.log(`  Tools: ${msg.tools.slice(0, 4).join(', ')}`);
      }
    }
  }

  console.log('\n--- RECOMMENDED ---');
  console.log('1. Run: git diff --stat');
  console.log('2. Read: task_plan.md, progress.md, findings.md');
  console.log('3. Update planning files based on above context');
  console.log('4. Continue with task');
}

// 只有在直接运行此脚本时才执行主函数（ESM 入口检测）
const isDirectRun = (() => {
  try {
    const scriptPath = fileURLToPath(import.meta.url);
    return process.argv.some((arg) => arg === scriptPath || arg.endsWith(scriptPath.replace(/\\/g, '/')));
  } catch {
    return false;
  }
})();

if (isDirectRun) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error in session catchup:', message);
    process.exit(1);
  });
}

export { getProjectDir, getSessionsSorted, parseSessionMessages, findLastPlanningUpdate, extractMessagesAfter };
